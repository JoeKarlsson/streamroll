"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/plausible";

interface Props {
  videoUrl: string;
  name: string;
  style: string;
  accentColor: string;
  duration: number;
  initialFile?: File;
}

type MixState = "idle" | "working" | "done" | "error";

interface StatusStep {
  label: string;
  detail?: string;
  state: "pending" | "active" | "done" | "error";
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sanitizeFilename(s: string) {
  return s.replace(/[^a-z0-9_-]/gi, "_").toLowerCase();
}

interface EngineHandle {
  onProgress: (cb: (ratio: number) => void) => void;
  writeFile: (path: string, data: Uint8Array) => Promise<void>;
  exec: (args: string[]) => Promise<number>;
  readFile: (path: string) => Promise<Uint8Array>;
  terminate: () => void;
}

// Creates a classic (non-module) blob worker that loads the UMD FFmpeg bundle via
// importScripts. Avoids type:"module" workers, which Firefox fails to dynamic-import
// from under COEP credentialless.
async function loadFFmpegEngine(wasmBlobUrl: string): Promise<EngineHandle> {
  const src = `importScripts(${JSON.stringify(`${location.origin}/ffmpeg/classic-worker.js`)});`;
  const workerUrl = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
  const worker = new Worker(workerUrl);
  URL.revokeObjectURL(workerUrl);

  let nextId = 0;
  const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  let progressCb: ((ratio: number) => void) | null = null;

  worker.onmessage = ({ data: { id, type, data } }: MessageEvent) => {
    if (type === "PROGRESS") { progressCb?.(data.progress); return; }
    if (type === "LOG") return;
    const p = pending.get(id as number);
    if (!p) return;
    pending.delete(id as number);
    if (type === "ERROR") p.reject(new Error(data as string));
    else p.resolve(data);
  };

  worker.onerror = (e) => {
    const err = new Error(e.message ?? "Worker error");
    for (const p of pending.values()) p.reject(err);
    pending.clear();
  };

  function send(type: string, data: unknown, transfer: Transferable[] = []): Promise<unknown> {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      worker.postMessage({ id, type, data }, transfer);
    });
  }

  await send("LOAD", {
    coreURL: `${location.origin}/ffmpeg/ffmpeg-core-umd.js`,
    wasmURL: wasmBlobUrl,
  });

  return {
    onProgress(cb) { progressCb = cb; },
    writeFile: async (path, data) => { await send("WRITE_FILE", { path, data }, [data.buffer]); },
    exec: (args) => send("EXEC", { args, timeout: -1 }) as Promise<number>,
    readFile: async (path) => send("READ_FILE", { path, encoding: "binary" }) as Promise<Uint8Array>,
    terminate: () => worker.terminate(),
  };
}

function friendlyError(e: unknown, step: string | null): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("SharedArrayBuffer"))
    return "Your browser blocked shared memory (required for WASM). Try reloading or use Chrome/Firefox.";
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    if (step === "engine") return "Could not download the audio engine. Check your internet connection and try again.";
    if (step === "video")  return "Could not fetch the video — the Runway URL may have expired. Try regenerating your video first.";
    return "Network error. Check your internet connection and try again.";
  }
  if (msg.includes("Invalid data") || msg.includes("moov atom"))
    return "The video file appears corrupted or unsupported. Try regenerating.";
  if (msg.includes("decode") || msg.includes("audio"))
    return "Could not decode the audio file. Try a different format (MP3 or AAC work best).";
  if (msg.length > 120) return msg.slice(0, 120) + "…";
  return msg;
}

// Load a same-origin asset as a blob URL for FFmpeg. Uses Cache API so the 30 MB
// WASM is only read from the network once per browser — subsequent loads are instant.
async function localBlobURL(
  path: string,
  mimeType: string,
  onProgress?: (pct: number) => void,
): Promise<string> {
  // Cache hit → instant, no progress needed
  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open("streamroll-ffmpeg-v1");
      const hit = await cache.match(path);
      if (hit) {
        const blob = new Blob([await hit.arrayBuffer()], { type: mimeType });
        return URL.createObjectURL(blob);
      }
    } catch {}
  }

  // Cache miss → stream so we can report download progress
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);

  let buffer: ArrayBuffer;

  if (onProgress && res.body) {
    const total = Number(res.headers.get("content-length")) || 0;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) { chunks.push(value); received += value.length; }
      if (total) onProgress(Math.min(99, Math.round(received / total * 100)));
    }
    onProgress(100);
    const out = new Uint8Array(received);
    let off = 0;
    for (const c of chunks) { out.set(c, off); off += c.length; }
    buffer = out.buffer;
  } else {
    buffer = await res.arrayBuffer();
  }

  // Persist in cache for next session
  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open("streamroll-ffmpeg-v1");
      await cache.put(path, new Response(buffer.slice(0), { headers: { "content-type": mimeType } }));
    } catch {}
  }

  return URL.createObjectURL(new Blob([buffer], { type: mimeType }));
}

const PIPELINE_STEPS = [
  { id: "engine",  label: "Load audio engine",  detail: "~30 MB · slow on first load · cached after" },
  { id: "video",   label: "Fetch video",         detail: "downloading from Runway CDN" },
  { id: "audio",   label: "Read audio file",     detail: "" },
  { id: "encode",  label: "Encode",              detail: "mixing tracks" },
  { id: "package", label: "Package",             detail: "building output file" },
];

export function AudioMixer({ videoUrl, name, style, accentColor, duration, initialFile }: Props) {
  const [open, setOpen]                     = useState(false);
  const [audioFile, setAudioFile]           = useState<File | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [mixState, setMixState]             = useState<MixState>("idle");
  const [activeStep, setActiveStep]         = useState<string | null>(null);
  const [engineProgress, setEngineProgress] = useState<number | null>(null);
  const [encodeProgress, setEncodeProgress] = useState(0);
  const [outputUrl, setOutputUrl]           = useState<string | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [loopAudio, setLoopAudio]           = useState(false);
  const [fadeOut, setFadeOut]               = useState(true);
  const inputRef                            = useRef<HTMLInputElement>(null);
  const prevOutputRef                       = useRef<string | null>(null);
  const prevPreviewRef                      = useRef<string | null>(null);
  const activeStepRef                       = useRef<string | null>(null);
  const initialFileApplied                  = useRef(false);

  useEffect(() => {
    if (initialFile && !initialFileApplied.current) {
      initialFileApplied.current = true;
      setFile(initialFile);
      setOpen(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile]);

  // Browser compat — SharedArrayBuffer is required by FFmpeg WASM
  const supportsWasm = typeof SharedArrayBuffer !== "undefined";

  function reset() {
    setAudioFile(null);
    if (prevPreviewRef.current) { URL.revokeObjectURL(prevPreviewRef.current); prevPreviewRef.current = null; }
    setAudioPreviewUrl(null);
    setMixState("idle");
    setActiveStep(null);
    setEncodeProgress(0);
    setError(null);
    if (prevOutputRef.current) { URL.revokeObjectURL(prevOutputRef.current); prevOutputRef.current = null; }
    setOutputUrl(null);
  }

  function setFile(file: File) {
    reset();
    setAudioFile(file);
    const previewUrl = URL.createObjectURL(file);
    prevPreviewRef.current = previewUrl;
    setAudioPreviewUrl(previewUrl);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("audio/")) setFile(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setFile(file);
  }

  async function mix() {
    if (!audioFile) return;
    setMixState("working");
    setEngineProgress(null);
    setEncodeProgress(0);
    setError(null);
    if (prevOutputRef.current) { URL.revokeObjectURL(prevOutputRef.current); prevOutputRef.current = null; }
    setOutputUrl(null);

    let engine: EngineHandle | null = null;
    try {
      // ── Step 1: load FFmpeg engine ────────────────────────────────────────
      activeStepRef.current = "engine"; setActiveStep("engine");
      const { fetchFile } = await import("@ffmpeg/util");

      setEngineProgress(0);
      const wasmBlobUrl = await localBlobURL("/ffmpeg/ffmpeg-core.wasm", "application/wasm",
        (pct) => setEngineProgress(pct));
      engine = await loadFFmpegEngine(wasmBlobUrl);
      engine.onProgress((p) => setEncodeProgress(Math.round(p * 100)));

      // ── Step 2: fetch video ───────────────────────────────────────────────
      activeStepRef.current = "video"; setActiveStep("video");
      await engine.writeFile("video.mp4", await fetchFile(videoUrl));

      // ── Step 3: read audio ────────────────────────────────────────────────
      activeStepRef.current = "audio"; setActiveStep("audio");
      await engine.writeFile("audio", await fetchFile(audioFile));

      // ── Step 4: encode ────────────────────────────────────────────────────
      activeStepRef.current = "encode"; setActiveStep("encode");
      const args = ["-i", "video.mp4"];
      if (loopAudio) args.push("-stream_loop", "-1");
      args.push(
        "-i", "audio",
        "-map", "0:v",
        "-map", "1:a",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
      );
      const fadeStart = duration - 0.8;
      if (fadeOut && fadeStart > 0.5) {
        args.push("-af", `afade=t=out:st=${fadeStart.toFixed(2)}:d=0.8`);
      }
      args.push("-shortest", "output.mp4");
      await engine.exec(args);

      // ── Step 5: package output ────────────────────────────────────────────
      activeStepRef.current = "package"; setActiveStep("package");
      const raw  = await engine.readFile("output.mp4");
      const blob = new Blob([raw.buffer.slice(0) as ArrayBuffer], { type: "video/mp4" });
      const url  = URL.createObjectURL(blob);
      prevOutputRef.current = url;
      setOutputUrl(url);
      setMixState("done");
      setActiveStep(null);
      track("Mix Audio", { style, duration: String(duration) });
    } catch (e) {
      const msg = friendlyError(e, activeStepRef.current);
      setError(msg);
      setMixState("error");
      setActiveStep(null);
      track("Mix Audio Error", { style, step: activeStepRef.current ?? "unknown", reason: msg.slice(0, 100) });
    } finally {
      engine?.terminate();
    }
  }

  const outputFilename = `${sanitizeFilename(name)}_${style}_with_audio.mp4`;

  const steps: StatusStep[] = PIPELINE_STEPS.map(({ id, label, detail }) => {
    const idx    = PIPELINE_STEPS.findIndex((s) => s.id === id);
    const active = PIPELINE_STEPS.findIndex((s) => s.id === activeStep);
    let state: StatusStep["state"] = "pending";
    if (mixState === "error") {
      state = idx < active ? "done" : idx === active ? "error" : "pending";
    } else if (mixState === "done") {
      state = "done";
    } else if (activeStep) {
      if (idx < active)        state = "done";
      else if (idx === active) state = "active";
    }
    return { label, detail, state };
  });

  return (
    <div className="rounded-xl border border-neutral-800 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        <span>Add audio to your video</span>
        <span className="text-neutral-600">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="bg-neutral-950 p-4 space-y-4">

          {/* Browser compat warning */}
          {!supportsWasm && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg border border-amber-800/60 bg-amber-950/30 text-xs text-amber-300">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>
                Your browser doesn&apos;t support SharedArrayBuffer, which is required for in-browser audio mixing.
                Try Chrome or Firefox, or make sure the page is loaded over HTTPS.
              </span>
            </div>
          )}

          {supportsWasm && (
            <p className="text-xs text-neutral-500">
              Upload an audio file and we&apos;ll mix it directly in your browser — nothing leaves your device.
            </p>
          )}

          {/* Drop zone */}
          {supportsWasm && mixState === "idle" && !audioFile && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-neutral-700 rounded-lg px-6 py-8 flex flex-col items-center gap-2 cursor-pointer hover:border-neutral-500 transition-colors text-center"
            >
              <span className="text-2xl">♪</span>
              <span className="text-sm text-neutral-400">Drop an audio file or click to browse</span>
              <span className="text-xs text-neutral-600">MP3, WAV, AAC, OGG, FLAC, M4A</span>
              <input ref={inputRef} type="file" accept="audio/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* Selected file pill + audio preview */}
          {audioFile && mixState !== "done" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">♪</span>
                  <span className="text-sm text-neutral-300 truncate">{audioFile.name}</span>
                  <span className="text-xs text-neutral-600 shrink-0">{formatBytes(audioFile.size)}</span>
                </div>
                {mixState === "idle" && (
                  <button onClick={reset} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors shrink-0">
                    ✕
                  </button>
                )}
              </div>
              {/* Audio preview player */}
              {audioPreviewUrl && mixState === "idle" && (
                <audio
                  src={audioPreviewUrl}
                  controls
                  className="w-full h-8"
                  style={{ colorScheme: "dark" }}
                />
              )}
            </div>
          )}

          {/* Options */}
          {audioFile && mixState === "idle" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={loopAudio}
                  onChange={(e) => setLoopAudio(e.target.checked)}
                  className="w-3.5 h-3.5"
                  style={{ accentColor }}
                />
                <span className="text-xs text-neutral-500">Loop audio to fill video length</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                <input
                  type="checkbox"
                  checked={fadeOut}
                  onChange={(e) => setFadeOut(e.target.checked)}
                  className="w-3.5 h-3.5"
                  style={{ accentColor }}
                />
                <span className="text-xs text-neutral-500">Fade out audio at end</span>
              </label>
            </div>
          )}

          {/* Mix button */}
          {audioFile && mixState === "idle" && (
            <button
              onClick={mix}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-black transition-all"
              style={{ background: accentColor }}
            >
              Mix Audio
            </button>
          )}

          {/* ── Pipeline status ─────────────────────────────────────────── */}
          {(mixState === "working" || mixState === "error") && (
            <div role="status" aria-live="polite" aria-atomic="false" className="rounded-lg border border-neutral-800 overflow-hidden">
              {/* Header bar */}
              <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center gap-2">
                {mixState === "working" ? (
                  <>
                    <div className="w-3 h-3 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin shrink-0" />
                    <span className="text-xs text-neutral-400">
                      {activeStep === "engine"  && (engineProgress !== null ? `Downloading audio engine… ${engineProgress}%` : "Loading audio engine…")}
                      {activeStep === "video"   && "Fetching video from Runway…"}
                      {activeStep === "audio"   && "Reading audio file…"}
                      {activeStep === "encode"  && `Encoding… ${encodeProgress}%`}
                      {activeStep === "package" && "Packaging output…"}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-red-400 text-xs">⚠</span>
                    <span className="text-xs text-red-400">Mixing failed</span>
                  </>
                )}
              </div>

              {/* Step list */}
              <div className="divide-y divide-neutral-900">
                {steps.map(({ label, detail, state }, i) => (
                  <div key={i} className="px-3 py-2 flex items-center gap-3 bg-neutral-950">
                    <div className="w-4 shrink-0 flex items-center justify-center">
                      {state === "done"    && <span className="text-xs" style={{ color: accentColor }}>✓</span>}
                      {state === "active"  && <div className="w-3 h-3 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin" />}
                      {state === "error"   && <span className="text-xs text-red-400">✕</span>}
                      {state === "pending" && <span className="text-xs text-neutral-700">·</span>}
                    </div>
                    <span className={`text-xs flex-1 ${
                      state === "done"    ? "text-neutral-500"
                      : state === "active"  ? "text-neutral-200"
                      : state === "error"   ? "text-red-400"
                      : "text-neutral-700"
                    }`}>
                      {label}
                      {state === "active" && detail && (
                        <span className="ml-1.5 text-neutral-600">{detail}</span>
                      )}
                    </span>
                    {state === "active" && label === "Load audio engine" && (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="w-24 h-1 rounded-full bg-neutral-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${engineProgress ?? 0}%`, backgroundColor: accentColor }}
                          />
                        </div>
                        {engineProgress !== null && engineProgress < 100 && (
                          <span className="text-neutral-700 text-xs">{engineProgress}%</span>
                        )}
                      </div>
                    )}
                    {state === "active" && label === "Encode" && (
                      <div className="w-20 h-1 rounded-full bg-neutral-800 overflow-hidden shrink-0">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${encodeProgress}%`, backgroundColor: accentColor }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Error detail */}
              {mixState === "error" && error && (
                <div className="px-3 py-3 bg-red-950/30 border-t border-red-900/40 space-y-2">
                  <p className="text-xs text-red-300">{error}</p>
                  <button onClick={reset} className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors">
                    ← Try again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Done ────────────────────────────────────────────────────── */}
          {mixState === "done" && outputUrl && (
            <div className="space-y-3">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg border text-xs"
                style={{ borderColor: accentColor + "40", background: accentColor + "0d", color: accentColor }}
              >
                <span>✓</span>
                <span>Audio mixed successfully — all 5 steps complete</span>
              </div>
              <video src={outputUrl} controls className="w-full rounded-lg" />
              <div className="flex items-center gap-2">
                <a
                  href={outputUrl}
                  download={outputFilename}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black text-center transition-all"
                  style={{ background: accentColor }}
                >
                  Download with audio
                </a>
                <button
                  onClick={reset}
                  className="px-4 py-2.5 rounded-lg text-sm text-neutral-400 border border-neutral-700 hover:border-neutral-500 transition-colors"
                >
                  Change audio
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
