"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { buildPrompts, type Style, type Duration, type VideoModel, type Treatment } from "@/lib/runway";
import { useApiKey } from "@/hooks/useApiKey";
import { LINKS, BUILDER, tweetShareUrl, redditShareUrl } from "@/lib/links";

type GenStep = "idle" | "image" | "video" | "done" | "error";

// Per-style accent colors used for selected state
const STYLE_COLOR: Record<Style, string> = {
  cinematic:  "#F59E0B",
  retro:      "#EC4899",
  futuristic: "#06B6D4",
  minimal:    "#E5E7EB",
  horror:     "#EF4444",
  anime:      "#F472B6",
  epic:       "#F97316",
  nature:     "#22C55E",
  prestige:   "#E50914",
};

const STYLES: { id: Style; label: string; emoji: string; desc: string }[] = [
  { id: "prestige",   label: "Prestige",   emoji: "🔴", desc: "Bold red on black" },
  { id: "cinematic",  label: "Cinematic",  emoji: "🎬", desc: "Navy & gold, film grain" },
  { id: "retro",      label: "Retro",      emoji: "📺", desc: "80s neon synthwave" },
  { id: "futuristic", label: "Futuristic", emoji: "🚀", desc: "Holographic chrome" },
  { id: "minimal",    label: "Minimal",    emoji: "✦",  desc: "Clean & elegant" },
  { id: "horror",     label: "Horror",     emoji: "🩸", desc: "Gothic, fog & shadow" },
  { id: "anime",      label: "Anime",      emoji: "🌸", desc: "Vivid, cherry blossoms" },
  { id: "epic",       label: "Epic",       emoji: "⚔️", desc: "Golden hour, dust" },
  { id: "nature",     label: "Nature",     emoji: "🌿", desc: "Earthy documentary" },
];

const DURATIONS: { value: Duration; label: string; est: string }[] = [
  { value: 2,  label: "2s",  est: "~20 sec" },
  { value: 5,  label: "5s",  est: "~35 sec" },
  { value: 10, label: "10s", est: "~60 sec" },
];

const INSPO: { name: string; style: Style; tagline: string; desc: string }[] = [
  { name: "Joeflix",   style: "prestige",   tagline: "Where stories come alive",  desc: "Example · your name here" },
  { name: "NightOwl",  style: "horror",     tagline: "Streaming after dark",       desc: "Late-night horror hub" },
  { name: "SkyBox",    style: "futuristic", tagline: "Beyond the horizon",         desc: "Sci-fi & space content" },
  { name: "VibeTube",  style: "retro",      tagline: "Totally tubular",            desc: "80s & 90s nostalgia" },
  { name: "SakuraTV",  style: "anime",      tagline: "Stories bloom here",         desc: "Anime & animation" },
  { name: "EpicQuest", style: "epic",       tagline: "Every story is legendary",   desc: "Action & adventure" },
  { name: "TerraDoc",  style: "nature",     tagline: "The world, unfiltered",      desc: "Nature documentaries" },
  { name: "WhiteRoom", style: "minimal",    tagline: "Less is more",               desc: "Arthouse & indie film" },
];

const SEASONAL: { name: string; style: Style; tagline: string; desc: string }[] = [
  { name: "SpookFlix",   style: "horror",     tagline: "Horror has a home",           desc: "🎃 Halloween" },
  { name: "WinterFlix",  style: "cinematic",  tagline: "The magic of the season",     desc: "🎄 Christmas" },
  { name: "SunsetCut",   style: "epic",       tagline: "Blockbuster season",          desc: "☀️ Summer" },
  { name: "NightStream", style: "futuristic", tagline: "The future starts at midnight", desc: "🎆 New Year" },
];

type LogoMode = "ai" | "upload";

const COLOR_SWATCHES = [
  { label: "Gold",    value: "#F59E0B" },
  { label: "Crimson", value: "#EF4444" },
  { label: "Blue",    value: "#3B82F6" },
  { label: "Purple",  value: "#8B5CF6" },
  { label: "Cyan",    value: "#06B6D4" },
  { label: "Green",   value: "#22C55E" },
  { label: "Pink",    value: "#EC4899" },
  { label: "White",   value: "#F9FAFB" },
];

const TREATMENTS: { id: Treatment; label: string; desc: string }[] = [
  { id: "full-bleed",  label: "Full Bleed",  desc: "Logo fills the frame" },
  { id: "theatrical",  label: "Theatrical",  desc: "Black letterbox bars" },
  { id: "minimal",     label: "Minimal",     desc: "Small logo, vast space" },
];

const VEO_DURATIONS: { value: Duration; label: string; est: string }[] = [
  { value: 4, label: "4s", est: "~45 sec" },
  { value: 6, label: "6s", est: "~60 sec" },
  { value: 8, label: "8s", est: "~75 sec" },
];

const VIDEO_MODELS: { id: VideoModel; label: string; group: "Runway" | "Google"; crInfo: string; desc: string }[] = [
  { id: "gen4_turbo",  label: "Gen4 Turbo",  group: "Runway", crInfo: "5 cr/s",   desc: "Fast, great quality" },
  { id: "gen4.5",      label: "Gen4.5",       group: "Runway", crInfo: "12 cr/s",  desc: "Highest quality" },
  { id: "gen3a_turbo", label: "Gen3a Turbo",  group: "Runway", crInfo: "5 cr/s",   desc: "Previous generation" },
  { id: "veo3",        label: "Veo 3",        group: "Google", crInfo: "~25 cr/s", desc: "Google video model" },
  { id: "veo3.1",      label: "Veo 3.1",      group: "Google", crInfo: "~25 cr/s", desc: "Google latest" },
  { id: "veo3.1_fast", label: "Veo 3.1 Fast", group: "Google", crInfo: "~15 cr/s", desc: "Fast Google model" },
];

const PLATFORMS = [
  {
    name: "Plex", slug: "plex", color: "#EBAF00",
    howTo: "Settings → Extras → Cinema Trailers → enable pre-roll, then drop the .mp4 into your Extras folder.",
    docs: "https://support.plex.tv/articles/202934883-cinema-trailers-extras/",
  },
  {
    name: "Jellyfin", slug: "jellyfin", color: "#00A4DC",
    howTo: "Dashboard → Admin → Pre-Roll Video → upload the .mp4 file.",
    docs: "https://jellyfin.org/docs/general/server/plugins/",
  },
  {
    name: "Emby", slug: "emby", color: "#52B54B",
    howTo: "Server Settings → Pre-Roll Videos → add the .mp4 file.",
    docs: "https://emby.media/community/index.php?/topic/86649-pre-roll-videos/",
  },
];

export default function Home() {
  const [name, setName]         = useState("Joeflix");
  const [tagline, setTagline]   = useState("Where stories come alive");
  const [style, setStyle]       = useState<Style>("cinematic");
  const [duration, setDuration] = useState<Duration>(5);
  const [step, setStep]         = useState<GenStep>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(true);
  const [showInstall, setShowInstall] = useState(false);
  const [logoMode, setLogoMode] = useState<LogoMode>("ai");
  const [videoModel, setVideoModel] = useState<VideoModel>("gen4_turbo");
  const [treatment, setTreatment] = useState<Treatment>("full-bleed");
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState("");
  const [uploadedUri, setUploadedUri] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timings, setTimings] = useState<{ image: number; video: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [audio, setAudio] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const genStartRef = useRef(0);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const { key: apiKey, loaded: keyLoaded } = useApiKey();
  const preview = buildPrompts({ name, style, tagline, duration, treatment, primaryColor: primaryColor ?? undefined, customNotes: customNotes || undefined });
  const isGenerating = step === "image" || step === "video";
  const selectedDuration = DURATIONS.find((d) => d.value === duration)!;
  const accentColor = STYLE_COLOR[style];
  const crPerSec = videoModel === "gen4.5" ? 12 : videoModel === "veo3" || videoModel === "veo3.1" ? 25 : videoModel === "veo3.1_fast" ? 15 : 5;
  const isVeoModel = videoModel === "veo3" || videoModel === "veo3.1" || videoModel === "veo3.1_fast";
  const hasNoDuration = videoModel === "gen4.5";
  const activeDurations = isVeoModel ? VEO_DURATIONS : DURATIONS;

  function applyInspo(i: (typeof INSPO)[number]) {
    setName(i.name);
    setTagline(i.tagline);
    setStyle(i.style);
    setStep("idle");
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
  }

  function reset() {
    setStep("idle");
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
    setTimings(null);
    setElapsedMs(0);
  }

  function handleModelChange(m: VideoModel) {
    setVideoModel(m);
    const veo = m === "veo3" || m === "veo3.1" || m === "veo3.1_fast";
    if (veo && ![4, 6, 8].includes(duration)) setDuration(4 as Duration);
    else if (!veo && m !== "gen4.5" && ![2, 5, 10].includes(duration)) setDuration(5 as Duration);
  }

  function copyScript() {
    const durationLine = hasNoDuration ? "" : `    duration: ${duration},\n`;
    const audioLine = isVeoModel && audio ? `    audio: true,\n` : "";
    const script = `import RunwayML from "@runwayml/sdk";

const runway = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

// Step 1: Generate logo image
const imageTask = await runway.textToImage
  .create({
    model: "gen4_image",
    promptText: \`${preview.imagePrompt}\`,
    ratio: "1920:1080",
  })
  .waitForTaskOutput();

const logoUrl = imageTask.output[0];

// Step 2: Animate into ${hasNoDuration ? "an" : `a ${duration}s`} intro
const videoTask = await runway.imageToVideo
  .create({
    model: "${videoModel}",
    promptImage: logoUrl,
    promptText: \`${preview.videoPrompt}\`,
    ratio: "1280:720",
${durationLine}${audioLine}  })
  .waitForTaskOutput();

console.log(videoTask.output[0]);
`;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleFileUpload(file: File) {
    setIsUploading(true);
    setUploadedUri(null);
    setUploadPreview(URL.createObjectURL(file));
    const fd = new FormData();
    fd.append("file", file);
    const headers: Record<string, string> = {};
    if (apiKey) headers["x-runway-key"] = apiKey;
    try {
      const res = await fetch("/api/upload", { method: "POST", headers, body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setUploadedUri(data.uri);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function generate() {
    if (!name.trim()) return;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["x-runway-key"] = apiKey;

    const body = {
      name: name.trim(), style, tagline: tagline.trim(), duration,
      videoModel, treatment,
      primaryColor: primaryColor ?? undefined,
      customNotes: customNotes.trim() || undefined,
      audio: isVeoModel ? audio : undefined,
    };
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
    setTimings(null);
    setElapsedMs(0);
    genStartRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - genStartRef.current), 100);

    try {
      let logoImageUrl: string;
      let imageTime = 0;

      if (logoMode === "upload" && uploadedUri) {
        logoImageUrl = uploadedUri;
        setImageUrl(uploadedUri);
        setStep("video");
      } else {
        setStep("image");
        const imageStart = Date.now();
        const imageRes = await fetch("/api/image", { method: "POST", headers, body: JSON.stringify(body) });
        const imageData = await imageRes.json();
        if (!imageRes.ok) throw new Error(imageData.error ?? "Image generation failed");
        imageTime = Date.now() - imageStart;
        logoImageUrl = imageData.imageUrl;
        setImageUrl(logoImageUrl);
        setStep("video");
      }

      const videoStart = Date.now();
      const videoRes = await fetch("/api/video", { method: "POST", headers, body: JSON.stringify({ ...body, imageUrl: logoImageUrl }) });
      const videoData = await videoRes.json();
      if (!videoRes.ok) throw new Error(videoData.error ?? "Video generation failed");
      const videoTime = Date.now() - videoStart;
      setVideoUrl(videoData.videoUrl);
      setTimings({ image: imageTime, video: videoTime });
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    } finally {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
  }

  return (
    <main
      className="relative min-h-screen text-white flex flex-col items-center px-4 py-12 overflow-hidden"
      style={{ background: "radial-gradient(ellipse 55% 40% at 50% -2%, rgba(255,248,200,0.07) 0%, transparent 65%), #080808" }}
    >
      {/* Film grain overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.032]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
        }}
      />

      {/* Nav */}
      <div className="w-full max-w-2xl flex justify-between items-center mb-12 text-sm text-neutral-500">
        <span className="font-bold text-white tracking-tight text-lg">StreamRoll</span>
        <div className="flex items-center gap-5">
          <Link href="/how-it-works" className="hover:text-white transition-colors">How it&apos;s built</Link>
          <Link href="/setup" className="hover:text-white transition-colors">API key</Link>
          <a href={LINKS.runwaySignup} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Get Runway →
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center gap-2 text-xs tracking-[0.25em] uppercase text-neutral-600 mb-4 font-medium">
          <span className="w-8 h-px bg-neutral-800 inline-block" />
          Now Showing
          <span className="w-8 h-px bg-neutral-800 inline-block" />
        </div>

        <h1
          className="text-6xl font-bold tracking-tight mb-3"
          style={{ backgroundImage: "linear-gradient(to bottom, #fff 40%, #6b7280)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
        >
          StreamRoll
        </h1>
        <p className="text-neutral-400 text-lg mb-5">
          AI-generated pre-roll intros for your media server, ready in 30 seconds
        </p>

        {/* Platform badges */}
        <div className="flex items-center justify-center gap-5 mb-3">
          <span className="text-xs text-neutral-600">Works with</span>
          {PLATFORMS.map((p) => (
            <div key={p.name} className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/${p.slug}.svg`} alt={p.name} width={16} height={16} />
              <span className="text-xs font-medium" style={{ color: p.color }}>{p.name}</span>
            </div>
          ))}
        </div>

        {/* Community resources */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-700 mb-5">
          <span>Community:</span>
          <a href={LINKS.prerollSub} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors">r/plexprerolls</a>
          <span>·</span>
          <a href={LINKS.plexSub} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors">r/PleX</a>
          <span>·</span>
          <a href={LINKS.jellyfinSub} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors">r/jellyfin</a>
          <span>·</span>
          <a href={LINKS.plexForums} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors">Plex Forums</a>
        </div>

        {keyLoaded && (
          <div>
            {apiKey ? (
              <Link href="/setup" className="inline-flex items-center gap-1.5 text-xs text-green-400 border border-green-900 bg-green-950/40 px-3 py-1 rounded-full hover:border-green-700 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Runway API key active
              </Link>
            ) : (
              <Link href="/setup" className="inline-flex items-center gap-1.5 text-xs text-amber-400 border border-amber-900 bg-amber-950/40 px-3 py-1 rounded-full hover:border-amber-700 transition-colors">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                Add your Runway API key to get started
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-2xl space-y-8">

        {/* Inspo presets */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-300">Inspiration</label>
            <button
              onClick={() => applyInspo(INSPO[Math.floor(Math.random() * INSPO.length)])}
              disabled={isGenerating}
              className="text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-3 py-1 rounded-full transition-colors disabled:opacity-40"
            >
              🎲 Surprise me
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {INSPO.map((i) => {
              const isActive = name === i.name && style === i.style;
              const color = STYLE_COLOR[i.style];
              return (
                <button
                  key={i.name}
                  onClick={() => applyInspo(i)}
                  disabled={isGenerating}
                  className="text-left p-2.5 rounded-lg border transition-all disabled:opacity-40"
                  style={isActive
                    ? { borderColor: color + "60", backgroundColor: color + "12" }
                    : { borderColor: "#262626" }
                  }
                >
                  <div className="font-medium text-sm" style={isActive ? { color } : undefined}>{i.name}</div>
                  <div className="text-xs text-neutral-600 mt-0.5">{i.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-3">
            <div className="text-xs text-neutral-700 mb-2 tracking-wide">Seasonal</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEASONAL.map((i) => {
                const isActive = name === i.name && style === i.style;
                const color = STYLE_COLOR[i.style];
                return (
                  <button
                    key={i.name}
                    onClick={() => applyInspo(i)}
                    disabled={isGenerating}
                    className="text-left p-2.5 rounded-lg border transition-all disabled:opacity-40"
                    style={isActive
                      ? { borderColor: color + "60", backgroundColor: color + "12" }
                      : { borderColor: "#262626" }
                    }
                  >
                    <div className="font-medium text-sm" style={isActive ? { color } : undefined}>{i.name}</div>
                    <div className="text-xs text-neutral-600 mt-0.5">{i.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Name & tagline */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Service name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Joeflix"
              maxLength={30}
              disabled={isGenerating}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 disabled:opacity-50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Tagline <span className="text-neutral-600">(optional)</span>
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Where stories come alive"
              maxLength={60}
              disabled={isGenerating}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 disabled:opacity-50 transition-colors"
            />
          </div>
        </section>

        {/* Logo mode toggle */}
        <section>
          <label className="block text-sm font-medium text-neutral-300 mb-3">Logo source</label>
          <div className="flex gap-2 mb-4">
            {(["ai", "upload"] as LogoMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setLogoMode(m)}
                disabled={isGenerating}
                className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-50"
                style={logoMode === m
                  ? { borderColor: accentColor + "70", backgroundColor: accentColor + "15", color: accentColor }
                  : { borderColor: "#262626", color: "#a3a3a3" }
                }
              >
                {m === "ai" ? "✦ Generate with AI" : "⬆ Upload your own"}
              </button>
            ))}
          </div>

          {logoMode === "upload" && (
            <div>
              <label
                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all"
                style={{ borderColor: uploadedUri ? accentColor + "60" : "#404040", backgroundColor: uploadedUri ? accentColor + "08" : "transparent" }}
              >
                {uploadPreview ? (
                  <div className="relative w-full h-full">
                    <Image src={uploadPreview} alt="Uploaded logo" fill className="object-contain p-3 rounded-xl" unoptimized />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                        <span className="text-sm text-white animate-pulse">Uploading...</span>
                      </div>
                    )}
                    {uploadedUri && !isUploading && (
                      <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full" style={{ background: accentColor + "30", color: accentColor }}>
                        Ready
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center pointer-events-none">
                    <div className="text-3xl mb-2">🖼</div>
                    <div className="text-sm text-neutral-400">Drop your logo here or click to browse</div>
                    <div className="text-xs text-neutral-600 mt-1">PNG, JPG, WebP up to 10MB</div>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={isGenerating || isUploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
                />
              </label>
            </div>
          )}
        </section>

        {/* Style */}
        <section>
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            {logoMode === "upload" ? "Motion style" : "Visual style"}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map((s) => {
              const isActive = style === s.id;
              const color = STYLE_COLOR[s.id];
              return (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  disabled={isGenerating}
                  className="flex flex-col items-start p-3 rounded-lg border transition-all disabled:opacity-50"
                  style={isActive
                    ? { borderColor: color + "70", backgroundColor: color + "15" }
                    : { borderColor: "#262626" }
                  }
                >
                  <span className="text-lg mb-1">{s.emoji}</span>
                  <div className="font-medium text-xs" style={isActive ? { color } : { color: "#e5e7eb" }}>{s.label}</div>
                  <div className="text-xs leading-tight mt-0.5" style={{ color: "#525252" }}>{s.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Duration */}
        {!hasNoDuration ? (
          <section>
            <label className="block text-sm font-medium text-neutral-300 mb-3">Duration</label>
            <div className="flex gap-3">
              {activeDurations.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDuration(d.value)}
                  disabled={isGenerating}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-lg border text-xs transition-all disabled:opacity-50"
                  style={duration === d.value
                    ? { borderColor: accentColor + "70", backgroundColor: accentColor + "15" }
                    : { borderColor: "#262626" }
                  }
                >
                  <span className="text-base font-bold" style={duration === d.value ? { color: accentColor } : { color: "#e5e7eb" }}>
                    {d.label}
                  </span>
                  <span className="text-neutral-500">{d.value * crPerSec + 8} cr · {d.est}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <label className="block text-sm font-medium text-neutral-300 mb-3">Duration</label>
            <div className="px-4 py-3 rounded-lg border text-xs text-neutral-500" style={{ borderColor: "#262626" }}>
              Gen4.5 generates a fixed-length video — duration is set automatically.
            </div>
          </section>
        )}

        {/* Advanced Settings */}
        <section>
          <button
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between text-sm font-medium text-neutral-400 hover:text-white transition-colors mb-3"
          >
            <span>Advanced Settings</span>
            <span className="text-neutral-600 text-xs">{showAdvanced ? "▾ collapse" : "▸ expand"}</span>
          </button>

          {showAdvanced && (
            <div className="space-y-7 pt-1">

              {/* Video model */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Video model</label>
                <div className="space-y-1.5">
                  <div className="text-xs text-neutral-700 mb-2">Runway</div>
                  <div className="grid grid-cols-3 gap-2">
                    {VIDEO_MODELS.filter((m) => m.group === "Runway").map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleModelChange(m.id)}
                        disabled={isGenerating}
                        className="flex flex-col items-start p-2.5 rounded-lg border text-xs transition-all disabled:opacity-50 text-left"
                        style={videoModel === m.id
                          ? { borderColor: accentColor + "70", backgroundColor: accentColor + "15" }
                          : { borderColor: "#262626" }
                        }
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-semibold" style={videoModel === m.id ? { color: accentColor } : { color: "#e5e7eb" }}>{m.label}</span>
                          <span className="text-neutral-700 text-[10px]">{m.crInfo}</span>
                        </div>
                        <span className="text-neutral-600 leading-tight">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-neutral-700 mt-3 mb-2">Google via Runway</div>
                  <div className="grid grid-cols-3 gap-2">
                    {VIDEO_MODELS.filter((m) => m.group === "Google").map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleModelChange(m.id)}
                        disabled={isGenerating}
                        className="flex flex-col items-start p-2.5 rounded-lg border text-xs transition-all disabled:opacity-50 text-left"
                        style={videoModel === m.id
                          ? { borderColor: accentColor + "70", backgroundColor: accentColor + "15" }
                          : { borderColor: "#262626" }
                        }
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-semibold" style={videoModel === m.id ? { color: accentColor } : { color: "#e5e7eb" }}>{m.label}</span>
                          <span className="text-neutral-700 text-[10px]">{m.crInfo}</span>
                        </div>
                        <span className="text-neutral-600 leading-tight">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audio toggle — Veo models only */}
                {isVeoModel && (
                  <div
                    className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                    style={{ borderColor: "#262626" }}
                  >
                    <div className="flex-1">
                      <div className="text-xs font-medium text-neutral-300">Generate audio</div>
                      <div className="text-xs text-neutral-600 mt-0.5">Veo can auto-generate ambient sound &amp; music</div>
                    </div>
                    <button
                      onClick={() => setAudio((v) => !v)}
                      disabled={isGenerating}
                      aria-label="Toggle audio generation"
                      className="relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 shrink-0"
                      style={{ backgroundColor: audio ? accentColor : "#404040" }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                        style={{ left: audio ? "calc(100% - 18px)" : "2px" }}
                      />
                    </button>
                  </div>
                )}
              </div>

              {/* Card treatment */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Card treatment</label>
                <div className="flex gap-3">
                  {TREATMENTS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTreatment(t.id)}
                      disabled={isGenerating}
                      className="flex-1 flex flex-col items-start px-3 py-2.5 rounded-lg border text-xs transition-all disabled:opacity-50"
                      style={treatment === t.id
                        ? { borderColor: accentColor + "70", backgroundColor: accentColor + "15" }
                        : { borderColor: "#262626" }
                      }
                    >
                      <span className="font-medium mb-0.5" style={treatment === t.id ? { color: accentColor } : { color: "#e5e7eb" }}>{t.label}</span>
                      <span style={{ color: "#525252" }}>{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary color */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Primary color <span className="text-neutral-700 font-normal normal-case">(optional)</span>
                  </label>
                  {primaryColor && (
                    <button onClick={() => setPrimaryColor(null)} className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors">Clear</button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setPrimaryColor(primaryColor === c.value ? null : c.value)}
                      disabled={isGenerating}
                      title={c.label}
                      className="w-7 h-7 rounded-full transition-all disabled:opacity-50 shrink-0"
                      style={{
                        backgroundColor: c.value,
                        boxShadow: primaryColor === c.value ? `0 0 0 2px #0a0a0a, 0 0 0 4px ${c.value}` : "none",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Custom notes */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                  Custom details <span className="text-neutral-700 font-normal normal-case">(optional)</span>
                </label>
                <input
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder='e.g. "wolf mascot", "slow burn reveal", "HBO Max aesthetic"'
                  maxLength={120}
                  disabled={isGenerating}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 disabled:opacity-50 transition-colors text-sm"
                />
              </div>

            </div>
          )}
        </section>

        {/* Prompt preview */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowPrompt((v) => !v)}
              className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <span>{showPrompt ? "▾" : "▸"}</span>
              <span className="font-medium text-neutral-300">Prompt preview</span>
              <span className="text-neutral-700">· see what gets sent to the API</span>
            </button>
            <button
              onClick={copyScript}
              className="text-xs border px-3 py-1 rounded transition-colors"
              style={copied
                ? { borderColor: accentColor + "60", color: accentColor }
                : { borderColor: "#2a2a2a", color: "#737373" }
              }
            >
              {copied ? "Copied!" : "{ } Copy as script"}
            </button>
          </div>
          {showPrompt && (
            <div className="space-y-3">
              <PromptBlock label="Step 1 · Gen4 Image · 1920x1080" text={preview.imagePrompt} />
              <PromptBlock label={`Step 2 · ${videoModel} · 1280x720${isVeoModel && audio ? " · audio on" : ""}`} text={preview.videoPrompt} />
            </div>
          )}
        </section>

        {/* Generate */}
        <button
          onClick={generate}
          disabled={isGenerating || !name.trim()}
          className="w-full font-semibold py-3.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-base"
          style={
            isGenerating || !name.trim()
              ? { background: "#fff", color: "#000" }
              : {
                  background: `linear-gradient(135deg, ${accentColor}22 0%, transparent 60%), #fff`,
                  color: "#000",
                  boxShadow: `0 0 24px ${accentColor}30`,
                }
          }
        >
          {isGenerating ? `Generating... ${(elapsedMs / 1000).toFixed(1)}s` : "Generate Intro"}
        </button>
      </div>

      {/* Progress + results */}
      {(isGenerating || step === "done") && (
        <div className="mt-10 w-full max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <StepIndicator label="Scene 1 · Design poster" status={step === "image" ? "active" : "done"} color={accentColor} />
            <div className="flex-1 h-px bg-neutral-800" />
            <StepIndicator
              label="Scene 2 · Roll camera"
              status={step === "video" ? "active" : step === "done" ? "done" : "pending"}
              color={accentColor}
            />
          </div>

          <div className="space-y-4">
            {/* Image skeleton */}
            {step === "image" && !imageUrl && logoMode === "ai" && (
              <div className="rounded-xl overflow-hidden border border-neutral-800">
                <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800">
                  <div className="h-3 w-44 rounded bg-neutral-800 animate-pulse" />
                </div>
                <div className="w-full bg-neutral-900 animate-pulse" style={{ aspectRatio: "16/9" }} />
              </div>
            )}

            {imageUrl && (
              <div className="rounded-xl overflow-hidden border border-neutral-800" style={{ boxShadow: `0 0 40px ${accentColor}18` }}>
                <div className="px-3 py-2 text-xs text-neutral-500 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                  <span>Scene 1 · Logo · 1920x1080</span>
                  {timings && <span className="tabular-nums">{(timings.image / 1000).toFixed(1)}s</span>}
                </div>
                <Image src={imageUrl} alt="Generated logo" width={1920} height={1080} className="w-full" unoptimized />
              </div>
            )}

            {/* Video skeleton */}
            {step === "video" && !videoUrl && (
              <div className="rounded-xl overflow-hidden border border-neutral-800">
                <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800">
                  <div className="h-3 w-56 rounded bg-neutral-800 animate-pulse" />
                </div>
                <div className="w-full bg-neutral-900 animate-pulse" style={{ aspectRatio: "16/9" }} />
              </div>
            )}

            {videoUrl && (
              <div className="rounded-xl overflow-hidden border border-neutral-800" style={{ boxShadow: `0 0 80px ${accentColor}30` }}>
                <div className="px-3 py-2 text-xs text-neutral-500 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                  <span>Scene 2 · Intro video{!hasNoDuration ? ` · ${duration}s` : ""} · 1280x720</span>
                  {timings && <span className="tabular-nums">{(timings.video / 1000).toFixed(1)}s</span>}
                </div>
                {/* TV screen */}
                <div className="relative bg-black">
                  <video src={videoUrl} autoPlay loop muted playsInline className="w-full block" />
                  <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 40%)" }} />
                </div>
                {/* Timing strip */}
                {timings && (
                  <div className="px-3 py-1.5 bg-neutral-950 border-b border-neutral-800 flex gap-4 text-xs text-neutral-600 tabular-nums">
                    <span>Scene 1: {(timings.image / 1000).toFixed(1)}s</span>
                    <span>Scene 2: {(timings.video / 1000).toFixed(1)}s</span>
                    <span className="text-neutral-500 font-medium">Total: {((timings.image + timings.video) / 1000).toFixed(1)}s</span>
                  </div>
                )}
                <div className="px-3 py-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-2">
                  <button onClick={reset} className="text-sm text-neutral-400 hover:text-white transition-colors shrink-0">
                    Generate another
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyScript}
                      className="text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 py-1.5 rounded transition-colors"
                    >
                      {copied ? "Copied!" : "{ } Copy as script"}
                    </button>
                    <a
                      href={redditShareUrl(name.trim())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 py-1.5 rounded transition-colors"
                    >
                      Post to r/plexprerolls
                    </a>
                    <a
                      href={tweetShareUrl(name.trim())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 py-1.5 rounded transition-colors"
                    >
                      Share on X
                    </a>
                    <a
                      href={videoUrl}
                      download={`${name.trim()}-intro.mp4`}
                      className="text-sm text-black font-medium px-4 py-1.5 rounded transition-all"
                      style={{ background: accentColor }}
                    >
                      Download MP4
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Install guide */}
            {videoUrl && (
              <div className="rounded-xl border border-neutral-800 overflow-hidden">
                <button
                  onClick={() => setShowInstall((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-neutral-900 text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  <span>How to add this to your media server</span>
                  <span className="text-neutral-600">{showInstall ? "▾" : "▸"}</span>
                </button>
                {showInstall && (
                  <div className="divide-y divide-neutral-800">
                    {PLATFORMS.map((p) => (
                      <div key={p.name} className="px-4 py-3 flex gap-3 items-start bg-neutral-950">
                        <div
                          className="flex items-center gap-1.5 shrink-0 mt-0.5 px-2 py-0.5 rounded"
                          style={{ backgroundColor: p.color + "18" }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`/logos/${p.slug}.svg`} alt={p.name} width={12} height={12} />
                          <span className="text-xs font-bold" style={{ color: p.color }}>{p.name}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-neutral-400 leading-relaxed">{p.howTo}</p>
                          <a
                            href={p.docs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs mt-1 inline-block transition-colors hover:text-neutral-300"
                            style={{ color: p.color + "cc" }}
                          >
                            Official docs →
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {step === "error" && (
        <div className="mt-8 max-w-2xl w-full space-y-3">
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">{error}</div>
          <button onClick={reset} className="text-sm text-neutral-400 hover:text-white transition-colors">Try again</button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 w-full max-w-2xl border-t border-neutral-900 pt-8 flex flex-col items-center gap-4 text-xs text-neutral-600">
        <div className="flex items-center gap-4">
          <Link href="/how-it-works" className="hover:text-neutral-400 transition-colors">How it&apos;s built</Link>
          <a href={LINKS.repoGitHub} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors">Fork on GitHub</a>
          <a href={LINKS.runwayDocs} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors">Runway docs</a>
          <a href={LINKS.runwayCommunity} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors">Discord</a>
          <a href={LINKS.runwaySignup} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors">Get API key</a>
        </div>
        <div className="flex items-center gap-4 text-neutral-700">
          <div className="flex items-center gap-1.5">
            <span>Built by</span>
            <a href={BUILDER.website} target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors">{BUILDER.name}</a>
            <span>·</span>
            <a href={BUILDER.github} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">GitHub</a>
            <span>·</span>
            <a href={BUILDER.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-500 transition-colors">LinkedIn</a>
          </div>
          <span className="text-neutral-800">|</span>
          <a href={LINKS.runwayDocs} target="_blank" rel="noopener noreferrer" className="hover:text-neutral-400 transition-colors">
            Powered by Runway
          </a>
        </div>
      </div>
    </main>
  );
}

function StepIndicator({ label, status, color }: { label: string; status: "pending" | "active" | "done"; color: string }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
        style={
          status === "done"   ? { background: color, color: "#000" } :
          status === "active" ? { background: "#fff", color: "#000", animation: "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite" } :
                                { background: "#262626", color: "#737373" }
        }
      >
        {status === "done" ? "✓" : status === "active" ? "..." : "○"}
      </div>
      <span className="text-sm" style={
        status === "active" ? { color: "#fff" } :
        status === "done"   ? { color } :
                              { color: "#525252" }
      }>
        {label}
      </span>
    </div>
  );
}

function PromptBlock({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
        <span className="text-xs text-neutral-500">{label}</span>
        <button onClick={copy} className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="px-3 py-2.5 text-xs text-neutral-400 font-mono leading-relaxed bg-neutral-950">{text}</div>
    </div>
  );
}
