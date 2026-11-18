"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CANVAS_STYLES } from "@/lib/styles";
import { isVeoModel } from "@/lib/models";
import { renderCanvasLogo } from "@/lib/canvasLogo";
import { introFilename } from "@/lib/filename";
import { GEN_SESSION_KEY, isSavedStep, parseSavedGeneration, type GenStep } from "@/lib/genSession";
import { GenerationError, generationErrorProps, kindForFailureCode, readApiJson, type ErrorKind, type GenerationStage } from "@/lib/generationError";
import { track } from "@/lib/plausible";
import { sleepUnlessAborted } from "@/lib/sleepUnlessAborted";
import type { IntroSettings } from "./useIntroSettings";

const VIDEO_REVEAL_MS = 400;

/**
 * The generation run: poster (Runway, canvas or upload), the review step, the video task and its polling,
 * cancel and reset, downloads, and keeping a finished result in sessionStorage across navigation.
 */
export function useGeneration({ settings, apiKey, keyLoaded, uploadedUri, onMissingKey }: {
  settings: IntroSettings;
  apiKey: string;
  keyLoaded: boolean;
  uploadedUri: string | null;
  /** Called instead of generating when the key has loaded and there is none. */
  onMissingKey: () => void;
}) {
  const router = useRouter();
  const {
    name, tagline, style, duration, imageModel, videoModel, treatment, primaryColor, customNotes, audio,
    logoMode, genMode, imagePromptOverride, videoPromptOverride, activePresetRef,
  } = settings;
  const [step, setStep]         = useState<GenStep>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [genStartedAt, setGenStartedAt] = useState(0);
  const [timings, setTimings] = useState<{ image: number; video: number } | null>(null);
  const [credits, setCredits] = useState<{ image: number; video: number } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [videoRegenNotes, setVideoRegenNotes] = useState("");
  const [sessionRestored, setSessionRestored] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [pollProgress, setPollProgress] = useState<number | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [posterDownloadError, setPosterDownloadError] = useState<string | null>(null);
  // A finished video that is still loading: the skeleton (or the old video, on a redo) stays until it can play.
  const [incomingVideoUrl, setIncomingVideoUrl] = useState<string | null>(null);
  // The video being replaced, kept underneath while the new one fades in.
  const [outgoingVideoUrl, setOutgoingVideoUrl] = useState<string | null>(null);
  // Only a freshly generated poster wipes in; one restored on load just appears.
  const [revealPoster, setRevealPoster] = useState(false);
  const imageTimeRef = useRef(0);
  const imageCreditCostRef = useRef(0);
  const activeTaskIdRef = useRef<string | null>(null);
  const cancelControllerRef = useRef<AbortController | null>(null);
  const currentVideoRef = useRef<HTMLVideoElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const restoredFromSessionRef = useRef(false);

  // Restore completed generation from sessionStorage on mount.
  // Multiple setState calls here are intentional — we batch-restore persisted state.
  useEffect(() => {
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(GEN_SESSION_KEY); } catch { /* storage blocked: nothing to restore */ }
    const saved = parseSavedGeneration(raw);
    if (saved) {
      /* eslint-disable react-hooks/set-state-in-effect */
      settings.restore(saved);
      if (saved.imageUrl) setImageUrl(saved.imageUrl);
      if (saved.videoUrl) setVideoUrl(saved.videoUrl);
      if (saved.timings)  setTimings(saved.timings);
      if (saved.error)    setError(saved.error);
      restoredFromSessionRef.current = true;
      setStep(saved.step);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
    setSessionRestored(true);
    // Runs once on mount; settings.restore only calls state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist completed/error state to sessionStorage so navigation doesn't wipe results
  useEffect(() => {
    if (!sessionRestored) return;
    if (isSavedStep(step)) {
      try {
        sessionStorage.setItem(GEN_SESSION_KEY, JSON.stringify(
          { step, imageUrl, videoUrl, timings, error, name, style, tagline, videoModel, imageModel, treatment, duration }
        ));
      } catch {}
    } else if (step === "idle") {
      try { sessionStorage.removeItem(GEN_SESSION_KEY); } catch {}
    }
  }, [step, imageUrl, videoUrl, timings, error, name, style, tagline, sessionRestored, videoModel, imageModel, treatment, duration]);

  // Warn before browser-level unload (refresh/close) while a generation is running
  useEffect(() => {
    if (step !== "image" && step !== "video") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step]);

  // Move focus to result when generation completes so keyboard/screen-reader users
  // don't have to discover the change by tabbing.
  // A result restored from sessionStorage on load is not news: leave the page at the top.
  useEffect(() => {
    if (step !== "done" && step !== "review") return;
    if (restoredFromSessionRef.current) { restoredFromSessionRef.current = false; return; }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
    resultRef.current?.focus({ preventScroll: true });
  }, [step]);

  // While a redo runs, the old video holds still under the progress bar so only the bar moves.
  useEffect(() => {
    const vid = currentVideoRef.current;
    if (!vid) return;
    if (step === "video") vid.pause();
    // Muted autoplay can't be refused; a rejection here only means the element went away mid-call.
    else if (vid.paused) vid.play().catch(() => {});
  }, [step, videoUrl]);

  async function downloadPoster() {
    if (!imageUrl) return;
    track("Download Poster", { style });
    setPosterDownloadError(null);
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Runway returned ${res.status}`);
      const blob = await res.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = introFilename(name, style, ext);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      setPosterDownloadError(`Download failed (${reason}). Runway’s image links expire after a while; if this keeps failing, regenerate the poster.`);
    }
  }

  async function downloadVideo() {
    if (!videoUrl) return;
    track("Download Video", { style, video_model: videoModel, audio: "original" });
    setDownloadError(null);
    try {
      // Runway's CDN sends Access-Control-Allow-Origin: *, so the MP4 can be saved under our filename.
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error(`Runway returned ${res.status}`);
      const objUrl = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = introFilename(name, style, "mp4");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      setDownloadError(`Download failed (${reason}). Runway’s video links expire after a while; if this keeps failing, redo the video.`);
    }
  }

  /** A new preset or style choice throws away the current result. */
  function clearResult() {
    setStep("idle");
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
  }

  // Asks Runway to stop the running task without blocking the UI; a failure is shown, since the task may still use credits.
  function cancelActiveTask() {
    const taskId = activeTaskIdRef.current;
    if (!taskId) return;
    activeTaskIdRef.current = null;
    setCancelError(null);
    cancelRunwayTask(taskId).catch((e) => {
      const reason = e instanceof Error ? e.message : String(e);
      setCancelError(`Couldn’t cancel the Runway task (${reason}). It may still finish and use credits; check your Runway dashboard.`);
    });
  }

  async function cancelRunwayTask(taskId: string) {
    const headers: Record<string, string> = {};
    if (apiKey) headers["x-runway-key"] = apiKey;
    const res = await fetch(`/api/video/cancel?id=${encodeURIComponent(taskId)}`, { method: "DELETE", headers });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `cancel failed with ${res.status}`);
    }
  }

  function handleCancelVideo() {
    setCancelling(true);
    cancelControllerRef.current?.abort("cancel");
    cancelActiveTask();
  }

  function reset() {
    cancelControllerRef.current?.abort("reset");
    cancelActiveTask();
    setIncomingVideoUrl(null);
    setOutgoingVideoUrl(null);
    setCancelling(false);
    setPosterDownloadError(null);
    setPollStatus(null);
    setPollProgress(null);
    setConfirmingReset(false);
    setStep("idle");
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
    setTimings(null);
    setCredits(null);
    setVideoRegenNotes("");
    setDownloadError(null);
    try { sessionStorage.removeItem(GEN_SESSION_KEY); } catch {}
  }

  function safeReset() {
    if (step === "done" && videoUrl) {
      setConfirmingReset(true);
    } else {
      reset();
    }
  }

  function buildBody(overrideNotes?: string) {
    return {
      name: name.trim(), style, tagline: tagline.trim(), duration,
      imageModel, videoModel, treatment,
      primaryColor: primaryColor ?? undefined,
      customNotes: overrideNotes ?? (customNotes.trim() || undefined),
      audio: isVeoModel(videoModel) ? audio : undefined,
      imagePromptOverride: imagePromptOverride ?? undefined,
      videoPromptOverride: videoPromptOverride ?? undefined,
    };
  }

  // Decode the poster off-screen first, so it appears whole in one reveal instead of painting in as it loads.
  async function showGeneratedPoster(url: string) {
    setRevealPoster(true);
    try {
      const img = new window.Image();
      img.src = url;
      await img.decode();
    } catch (e) {
      throw new GenerationError(
        `The poster was generated but couldn’t be loaded (${e instanceof Error ? e.message : String(e)})`,
        { kind: "other", stage: "poster" },
      );
    } finally {
      setImageUrl(url);
    }
  }

  // Kind, status and Runway's code only: the message can quote the prompt.
  function trackGenerationError(e: unknown, stage: GenerationStage) {
    track("Generation Error", generationErrorProps(e, stage, { imageModel, videoModel }));
  }

  function startTimer() {
    setGenStartedAt(Date.now());
  }

  async function generate() {
    if (!name.trim()) return;
    if (keyLoaded && !apiKey) {
      track("Key Missing", { page: "home" });
      onMissingKey();
      return;
    }

    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
    setTimings(null);
    setCredits(null);
    setReviewNotes("");
    imageTimeRef.current = 0;
    imageCreditCostRef.current = 0;

    track("Generate", {
      style,
      preset: activePresetRef.current,
      mode: genMode,
      logo_source: logoMode === "upload" ? "upload" : CANVAS_STYLES.has(style) ? "canvas" : "ai",
      image_model: imageModel,
      video_model: videoModel,
      duration: String(duration),
    });

    // Upload mode: image is already known — skip image generation and review entirely
    if (logoMode === "upload") {
      if (!uploadedUri) return; // upload not complete — button should be disabled, but guard anyway
      setImageUrl(uploadedUri);
      if (genMode === "image-only") {
        setStep("done");
        return;
      }
      await proceedToVideo(uploadedUri);
      return;
    }

    // Canvas mode: render logo locally for flat-design styles — no Runway image credits used
    if (CANVAS_STYLES.has(style)) {
      startTimer();
      try {
        setStep("image");
        const imageStart = Date.now();
        const dataUri = await renderCanvasLogo(style, name, tagline);
        imageTimeRef.current = Date.now() - imageStart;
        await showGeneratedPoster(dataUri);
        if (genMode === "image-only") {
          setTimings({ image: imageTimeRef.current, video: 0 });
          setStep("done");
          return;
        }
        setStep("review");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Canvas render failed");
        setStep("error");
        trackGenerationError(e, "canvas");
      }
      return;
    }

    // AI generation path
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["x-runway-key"] = apiKey;
    startTimer();

    try {
      setStep("image");
      const imageStart = Date.now();
      const imageRes = await fetch("/api/image", { method: "POST", headers, body: JSON.stringify(buildBody()) });
      const imageData = await readApiJson<{ imageUrl: string; creditCost?: number }>(imageRes, "Image generation failed");
      imageTimeRef.current = Date.now() - imageStart;
      await showGeneratedPoster(imageData.imageUrl);
      imageCreditCostRef.current = imageData.creditCost ?? 0;
      track("Logo Generated", { style, image_model: imageModel });

      if (genMode === "image-only") {
        setTimings({ image: imageTimeRef.current, video: 0 });
        setCredits({ image: imageCreditCostRef.current, video: 0 });
        setStep("done");
        return;
      }

      setStep("review");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setStep("error");
      trackGenerationError(e, "image");
    }
  }

  async function handleRegenerate() {
    if (keyLoaded && !apiKey) { router.push("/setup"); return; }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["x-runway-key"] = apiKey;

    const combined = [customNotes.trim(), reviewNotes.trim()].filter(Boolean).join(". ");

    setImageUrl(null);
    setError(null);
    setReviewNotes("");
    imageTimeRef.current = 0;
    startTimer();
    setStep("image");

    try {
      const imageStart = Date.now();
      const imageRes = await fetch("/api/image", { method: "POST", headers, body: JSON.stringify(buildBody(combined || undefined)) });
      const imageData = await readApiJson<{ imageUrl: string; creditCost?: number }>(imageRes, "Image generation failed");
      imageTimeRef.current = Date.now() - imageStart;
      await showGeneratedPoster(imageData.imageUrl);
      imageCreditCostRef.current = imageData.creditCost ?? 0;
      setStep("review");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setStep("error");
      trackGenerationError(e, "regenerate");
    }
  }

  async function proceedToVideo(imageUrlOverride?: string) {
    const effectiveImageUrl = imageUrlOverride ?? imageUrl;
    if (!effectiveImageUrl || (keyLoaded && !apiKey)) return;
    const jsonHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) jsonHeaders["x-runway-key"] = apiKey;
    const pollHeaders: Record<string, string> = {};
    if (apiKey) pollHeaders["x-runway-key"] = apiKey;

    setError(null);
    setPollStatus(null);
    setPollProgress(null);
    setCancelling(false);
    setCancelError(null);
    startTimer();
    setStep("video");
    track("Video Started", { style, video_model: videoModel, duration: String(duration) });

    // Cancel video aborts with "cancel" (back to the poster, or to the old video on a redo); Start over aborts with "reset".
    const controller = new AbortController();
    cancelControllerRef.current = controller;
    const { signal } = controller;
    const previousVideoUrl = videoUrl;
    function stopIfCancelled() {
      if (!signal.aborted) return false;
      cancelActiveTask();
      if (signal.reason === "cancel") {
        setPollStatus(null);
        setPollProgress(null);
        setCancelling(false);
        setStep(previousVideoUrl ? "done" : "review");
      }
      return true;
    }

    try {
      // Step 1: kick off the Runway task (fast, < 5s)
      setPollStatus("STARTING");
      const videoCombinedNotes = [customNotes.trim(), videoRegenNotes.trim()].filter(Boolean).join(". ");
      const startRes = await fetch("/api/video/start", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ ...buildBody(videoCombinedNotes || undefined), imageUrl: effectiveImageUrl }),
      });
      const startData = await readApiJson<{ taskId: string; creditsBefore?: number | null }>(startRes, "Failed to start video generation");

      const taskId = startData.taskId;
      const videoCreditsBefore: number = startData.creditsBefore ?? 0;
      activeTaskIdRef.current = taskId;
      if (stopIfCancelled()) return;
      const videoStart = Date.now();
      const maxWaitMs = 15 * 60 * 1000; // 15 minutes

      // Step 2: poll every 8s until done (Runway updates no more than every 5s)
      while (Date.now() - videoStart < maxWaitMs) {
        await sleepUnlessAborted(8_000, signal);
        if (stopIfCancelled()) return;

        const pollRes = await fetch(`/api/video/poll?id=${encodeURIComponent(taskId)}`, { headers: pollHeaders });
        // A failed check throws; the catch below still honours a cancel that arrived meanwhile.
        const pollData = await readApiJson<{
          status: string; output: string; failure?: string; failureCode?: string | null; kind?: ErrorKind;
          progress?: number | null; creditsAfter?: number | null;
        }>(pollRes, "Status check failed");
        if (stopIfCancelled()) return;

        const { status, output, failure, failureCode, kind, progress, creditsAfter } = pollData;
        setPollStatus(status);
        if (typeof progress === "number") setPollProgress(Math.round(progress * 100));
        else if (status !== "RUNNING") setPollProgress(null);

        if (status === "SUCCEEDED") {
          activeTaskIdRef.current = null;
          const videoTime = Date.now() - videoStart;
          setTimings({ image: imageTimeRef.current, video: videoTime });
          track("Video Generated", { style, video_model: videoModel, duration: String(duration) });
          if (videoCreditsBefore > 0 && typeof creditsAfter === "number") {
            setCredits({ image: imageCreditCostRef.current, video: Math.max(0, videoCreditsBefore - creditsAfter) });
          }
          // Let the bar land at 100% before the video takes over; showIncomingVideo finishes the step once it can play.
          setPollProgress(100);
          await sleepUnlessAborted(150, signal);
          if (signal.aborted && signal.reason === "reset") return;
          setIncomingVideoUrl(output);
          return;
        }
        if (status === "FAILED") {
          throw new GenerationError(`${failure ?? "Video generation failed"}${failureCode ? ` (${failureCode})` : ""}`, {
            kind: kind ?? kindForFailureCode(failureCode), code: failureCode ?? null,
          });
        }
        if (status === "CANCELLED") throw new GenerationError("Video generation was cancelled", { kind: "runway_failed" });
        // PENDING / THROTTLED / RUNNING → keep polling
      }

      throw new GenerationError("Video generation timed out after 15 minutes. Check your Runway dashboard for task status.", { kind: "timeout" });
    } catch (e) {
      if (stopIfCancelled()) return;
      activeTaskIdRef.current = null;
      setPollStatus(null);
      setPollProgress(null);
      const message = e instanceof Error ? e.message : "Something went wrong";
      setError(message);
      setStep("error");
      trackGenerationError(e, "video");
    }
  }

  // The new video can play: it fades in over the skeleton (or over the dimmed old video on a redo), which leaves after the fade.
  function showIncomingVideo() {
    if (!incomingVideoUrl) return;
    setOutgoingVideoUrl(videoUrl);
    setVideoUrl(incomingVideoUrl);
    setIncomingVideoUrl(null);
    setPollStatus(null);
    setPollProgress(null);
    setStep("done");
    setTimeout(() => setOutgoingVideoUrl(null), VIDEO_REVEAL_MS);
  }

  function failIncomingVideo() {
    setIncomingVideoUrl(null);
    setPollStatus(null);
    setPollProgress(null);
    setError("The video was generated but your browser couldn’t load it. Runway’s links expire after a while; try again.");
    setStep("error");
  }

  return {
    step, imageUrl, videoUrl, error, genStartedAt, timings, credits, downloadError, posterDownloadError,
    reviewNotes, setReviewNotes, videoRegenNotes, setVideoRegenNotes, pollStatus, pollProgress,
    confirmingReset, setConfirmingReset, cancelling, cancelError, incomingVideoUrl, outgoingVideoUrl, revealPoster,
    currentVideoRef, resultRef,
    isGenerating: step === "image" || step === "video",
    generate, handleRegenerate, proceedToVideo, handleCancelVideo, cancelRunwayTask, reset, safeReset, clearResult,
    downloadPoster, downloadVideo, showIncomingVideo, failIncomingVideo,
  };
}

export type Generation = ReturnType<typeof useGeneration>;
