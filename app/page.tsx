"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { buildPrompts, imageRatio, type Style, type Duration, type ImageModel, type VideoModel, type Treatment } from "@/lib/runway";
import { useApiKey } from "@/hooks/useApiKey";
import { LINKS, BUILDER, tweetShareUrl, redditShareUrl } from "@/lib/links";

type GenStep = "idle" | "image" | "review" | "video" | "done" | "error";

const SESSION_KEY = "streamroll_gen_state";

// Per-style accent colors used for selected state
const STYLE_COLOR: Record<Style, string> = {
  cinematic:  "#F59E0B",
  retro:      "#EC4899",
  futuristic: "#06B6D4",
  minimal:    "#E5E7EB",
  horror:     "#EF4444",
  anime:      "#3B82F6",
  epic:       "#F97316",
  nature:     "#22C55E",
  prestige:   "#E50914",
  adultswim:  "#D4D4D4",
  cartoon:    "#EF4444",
  vhs:        "#94A3B8",
  grindhouse: "#EC4899",
  lofi:       "#A78BFA",
  vaporwave:  "#C084FC",
  cyberpunk:  "#F43F5E",
  hbo:         "#A1A1AA",
  blockbuster: "#FFDE00",
};

const STYLES: { id: Style; label: string; emoji: string; desc: string; tip?: string }[] = [
  { id: "prestige",   label: "Netflix",    emoji: "🔴", desc: "Bold red on black",       tip: "Auto: Gen4.5 · Minimal · 4s" },
  { id: "cinematic",  label: "Cinematic",  emoji: "🎬", desc: "Navy & gold, film grain",  tip: "Auto: Gen4.5 · Full Bleed · 5s" },
  { id: "retro",      label: "Retro",      emoji: "📺", desc: "80s neon synthwave",       tip: "Auto: Gen4 Turbo · Full Bleed · 5s" },
  { id: "futuristic", label: "Futuristic", emoji: "🚀", desc: "Holographic chrome",       tip: "Auto: Gen4.5 · Full Bleed · 5s" },
  { id: "minimal",    label: "Minimal",    emoji: "✦",  desc: "Clean & elegant",          tip: "Auto: Gen4 Turbo · Minimal · 4s" },
  { id: "horror",     label: "Horror",     emoji: "🩸", desc: "Gothic, fog & shadow",     tip: "Auto: Gen4 Turbo · Theatrical · 5s" },
  { id: "anime",      label: "Anime",      emoji: "⚡", desc: "Shonen energy burst",      tip: "Auto: Gen4.5 · Full Bleed · 4s" },
  { id: "adultswim",  label: "Adult Swim", emoji: "📺", desc: "Black screen, white text",   tip: "Auto: Gen4 Turbo · Minimal · 2s" },
  { id: "cartoon",    label: "Cartoon Network", emoji: "🟥", desc: "Checkerboard graphic pop",   tip: "Auto: Gen4 Turbo · Full Bleed · 4s" },
  { id: "vhs",        label: "VHS",             emoji: "📼", desc: "Tracking errors, tape decay", tip: "Auto: Gen4 Turbo · Theatrical · 5s" },
  { id: "grindhouse", label: "Grindhouse",      emoji: "🎞️", desc: "Psychedelic cinema pre-show", tip: "Auto: Gen4 Turbo · Theatrical · 5s" },
  { id: "lofi",       label: "Lo-fi",           emoji: "🎧", desc: "Cozy rain, study beats",      tip: "Auto: Gen4 Turbo · Minimal · 4s" },
  { id: "vaporwave",  label: "Vaporwave",       emoji: "🌴", desc: "Pastel grid, marble busts",    tip: "Auto: Gen4.5 · Full Bleed · 5s" },
  { id: "cyberpunk",  label: "Cyberpunk",       emoji: "🌆", desc: "Neon rain, dark mega-city",    tip: "Auto: Gen4.5 · Theatrical · 5s" },
  { id: "hbo",        label: "HBO",             emoji: "⬛", desc: "3D chrome letters, star field", tip: "Auto: Gen4.5 · Theatrical · 5s" },
  { id: "epic",        label: "Epic",        emoji: "⚔️", desc: "Golden hour, dust",          tip: "Auto: Gen4.5 · Theatrical · 5s" },
  { id: "nature",      label: "Nature",      emoji: "🌿", desc: "Earthy documentary",         tip: "Auto: Gen4 Turbo · Minimal · 4s" },
  { id: "blockbuster", label: "Blockbuster", emoji: "🎫", desc: "Yellow on navy, video store", tip: "Auto: Gen4.5 · Theatrical · 5s" },
];

const STYLE_DEFAULTS: Record<Style, { videoModel: VideoModel; imageModel: ImageModel; treatment: Treatment; duration: Duration }> = {
  // gen4_image = creative/artistic;  gemini_image3_pro = precise instruction-following
  prestige:   { videoModel: "gen4.5",      imageModel: "gemini_image3_pro", treatment: "minimal",     duration: 4 },
  cinematic:  { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  retro:      { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  futuristic: { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  minimal:    { videoModel: "gen4_turbo",  imageModel: "gemini_image3_pro", treatment: "minimal",     duration: 4 },
  horror:     { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
  anime:      { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "full-bleed",  duration: 4 },
  adultswim:  { videoModel: "gen4_turbo",  imageModel: "gemini_image3_pro", treatment: "minimal",     duration: 2 },
  cartoon:    { videoModel: "gen4_turbo",  imageModel: "gemini_image3_pro", treatment: "full-bleed",  duration: 4 },
  vhs:        { videoModel: "gen4_turbo",  imageModel: "gemini_image3_pro", treatment: "theatrical",  duration: 5 },
  grindhouse: { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
  lofi:       { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "minimal",     duration: 4 },
  vaporwave:  { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "full-bleed",  duration: 5 },
  cyberpunk:  { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
  hbo:        { videoModel: "gen4.5",      imageModel: "gemini_image3_pro", treatment: "theatrical",  duration: 5 },
  epic:        { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
  nature:      { videoModel: "gen4_turbo",  imageModel: "gen4_image",        treatment: "minimal",     duration: 4 },
  blockbuster: { videoModel: "gen4.5",      imageModel: "gen4_image",        treatment: "theatrical",  duration: 5 },
};

const STYLE_TAGLINES: Record<Style, string[]> = {
  prestige:    ["Where stories come alive","Stream like it matters","The next great thing","Your world, your screen","For the discerning viewer","Stories worth watching","Premium starts here","Not all streams are equal","Everything. Anytime.","The future of watching"],
  cinematic:   ["Made for the big moments","Cinema lives here","Film, reimagined","Every frame, a story","The cinematic experience, at home","Gold standard streaming","Drama in every pixel","Where movies breathe","Feel everything","The picture is the message"],
  retro:       ["Totally tubular","Rad to the max","Don't touch that dial","Press play on the past","Rewind and relive","Pop the tape in","Back to the good stuff","Gnarly content ahead","Wicked awesome streaming","Totally radical"],
  futuristic:  ["The future is on","Tomorrow's content today","Streaming from the future","Next-gen entertainment","Beyond what's possible","Interface with tomorrow","Upgrade your reality","The signal from ahead","Neural-linked entertainment","Stream beyond the horizon"],
  minimal:     ["Less is more","Only what matters","Simple. Perfect.","Quiet excellence","Nothing extra","Pure signal, no noise","Refined, always","Curated by intention","The essential cut","Elegance in simplicity"],
  horror:      ["Sleep is for the weak","Don't look behind you","You were warned","Horror has a home","Fear finds a way","Streaming after dark","The dark side of streaming","Watch if you dare","Nightmares, delivered","The screams are real"],
  anime:       ["Plus ultra streaming","Power level: maximum","The next episode awaits","Your destiny streams here","Unlimited power","The saga continues","Eyes of a warrior","This is your moment","Believe in the run","Arc begins now"],
  adultswim:   ["on after 11","we're still here","goodnight, almost","stay up with us","you're still watching","it's late. perfect.","don't change the channel","this is the content","ok.","the weird stuff"],
  epic:        ["Every story is legendary","Born for the big screen","Where legends are made","The epic begins","Forged in fire","Rise to the moment","Worthy of the legend","This is your saga","Victory through streaming","The battle for your queue"],
  nature:      ["The world, unfiltered","Earth has a story","Nature speaks, we listen","Every creature, every moment","Wild and beautiful","The living world, streaming","Find your wild","Planet in focus","Stream with the seasons","The natural order"],
  cartoon:     ["Check it","Serious about fun","Cartoons. Duh.","The original good stuff","Watch more cartoons","Fun is our business","Drawing you in","The animated life","It's cartoon o'clock","Cartoon headquarters"],
  vhs:         ["Be kind, rewind","Press play","Tracking... please wait","Rewind to remember","Pop it in and press play","Static and stories","The analog age","Rewound and ready","Rewinding is caring","The tape lives on"],
  grindhouse:  ["NOW SHOWING","FEATURE PRESENTATION","The picture is about to begin","Ladies and gentlemen...","Take your seats","The main event","The show is about to begin","Curtain up","Coming to your screen","A presentation of excellence"],
  lofi:        ["beats to stream to","study and watch","chill vibes only","soft signal, strong content","rainy day streaming","slow down, watch something","the gentle stream","ambient entertainment","just right","background and foreground"],
  vaporwave:   ["aesthetic dreams","lost in the mall of content","remember when?","the simulation is streaming","totally.aesthetic","enter the mall","stream it on repeat","the past is pretty","Windows 95 never died","aesthetic.jpg streaming"],
  cyberpunk:   ["The future is now","Neon and nightmare","Jack in and stream","The signal never sleeps","Dark city, bright screen","Interface engaged","The net is alive","Rain on glass, fire on screen","Outlaws watch this","Escape velocity streaming"],
  hbo:         ["It's not TV","Prestige, defined","The gold standard","Some things are worth it","Where television grew up","The serious watch","Excellence, delivered","Nothing compromises here","Not for casual viewers","It's HBO"],
  blockbuster: ["Make it a Blockbuster night","Be kind, rewind","Open seven nights a week","Your entertainment destination","No streaming required","Late fees apply","Member since opening night","The original binge destination","Returns due by midnight","Where the movies lived"],
};

const DURATIONS: { value: Duration; label: string; est: string }[] = [
  { value: 2,  label: "2s",  est: "~20 sec" },
  { value: 4,  label: "4s",  est: "~30 sec" },
  { value: 5,  label: "5s",  est: "~35 sec" },
  { value: 10, label: "10s", est: "~60 sec" },
];

type Preset = { name: string; style: Style; tagline: string; desc: string; emoji?: string; customNotes?: string };

const INSPO: Preset[] = [
  { name: "Joeflix",   style: "prestige",   tagline: "Where stories come alive",  desc: "Example · your name here" },
  { name: "NightOwl",  style: "horror",     tagline: "Streaming after dark",       desc: "Late-night horror hub" },
  { name: "SkyBox",    style: "futuristic", tagline: "Beyond the horizon",         desc: "Sci-fi & space content" },
  { name: "VibeTube",  style: "retro",      tagline: "Totally tubular",            desc: "80s & 90s nostalgia" },
  { name: "SakuraTV",  style: "anime",      tagline: "Stories bloom here",         desc: "Anime & animation" },
  { name: "EpicQuest", style: "epic",       tagline: "Every story is legendary",   desc: "Action & adventure" },
  { name: "TerraDoc",  style: "nature",     tagline: "The world, unfiltered",      desc: "Nature documentaries" },
  { name: "WhiteRoom", style: "minimal",    tagline: "Less is more",               desc: "Arthouse & indie film" },
  { name: "LateNight",   style: "adultswim",  tagline: "on after dark",               desc: "Adult Swim bumper" },
  { name: "CheckerBox", style: "cartoon",    tagline: "Serious about fun",           desc: "Cartoon Network style" },
  { name: "RewindFlix", style: "vhs",        tagline: "Be kind, rewind",             desc: "90s home video" },
  { name: "DriveInFlix",style: "grindhouse", tagline: "NOW SHOWING",                 desc: "Drive-in theater" },
  { name: "ChillFlix",  style: "lofi",       tagline: "beats to stream to",          desc: "Lo-fi study beats" },
  { name: "VaporFlix",  style: "vaporwave",  tagline: "aesthetic dreams",             desc: "Vaporwave" },
  { name: "NeonCity",   style: "cyberpunk",  tagline: "The future is now",            desc: "Cyberpunk night city" },
  { name: "StaticFlix",  style: "hbo",         tagline: "It's not TV",                  desc: "HBO prestige style" },
  { name: "VideoVault",  style: "blockbuster", tagline: "Make it a Blockbuster night",   desc: "Video store nostalgia" },
];

const SEASONAL: Preset[] = [
  { name: "AutumnFlix",  emoji: "🍂", style: "cinematic",  tagline: "The season of great stories",  desc: "Fall",   customNotes: "autumn leaves drifting down, warm amber and orange hues, golden light through turning foliage, crisp air" },
  { name: "WinterFlix",  emoji: "❄️", style: "minimal",    tagline: "Crisp nights, great stories",  desc: "Winter", customNotes: "winter frost and fresh snowfall, cool blue-white palette, clean icy crisp quiet atmosphere" },
  { name: "SpringFlix",  emoji: "🌸", style: "anime",      tagline: "Where great stories bloom",    desc: "Spring", customNotes: "blooming cherry blossoms, fresh spring morning light, pastel colors, nature awakening and renewal" },
  { name: "SummerFlix",  emoji: "☀️", style: "epic",       tagline: "Blockbuster season is here",   desc: "Summer", customNotes: "blazing summer sun high overhead, golden warm light, bold bright saturated energy, heat shimmer" },
];

const HOLIDAYS: Preset[] = [
  { name: "SpringBloom",  emoji: "🐣", style: "lofi",      tagline: "Where stories bloom",           desc: "Easter",          customNotes: "sunrise spring morning, soft pastel wildflowers blooming, pale blue robin eggs, gentle birdsong warmth" },
  { name: "MomFlix",      emoji: "💐", style: "lofi",      tagline: "With love, always",              desc: "Mother's Day",    customNotes: "fresh garden roses and soft lavender blooms, warm golden morning sunlight, heartfelt and tender" },
  { name: "DadFlix",      emoji: "👨", style: "epic",      tagline: "Dad approved content",           desc: "Father's Day",    customNotes: "golden summer afternoon, classic americana warmth, amber light, the films he always wanted to share" },
  { name: "SpookFlix",    emoji: "🎃", style: "horror",    tagline: "Horror has a home",             desc: "Halloween",       customNotes: "jack-o-lanterns and cobwebs, haunted autumn night atmosphere, orange and black" },
  { name: "ChristmasFlix",emoji: "🎄", style: "cinematic", tagline: "The magic of Christmas",        desc: "Christmas",       customNotes: "Christmas tree with glowing lights and ornaments, snowfall, warm holiday red and green" },
  { name: "NightStream",  emoji: "🎆", style: "futuristic",tagline: "The future starts tonight",     desc: "New Year's Eve",  customNotes: "fireworks bursting overhead, countdown to midnight celebration, gold and silver confetti" },
  { name: "AwardsFlix",   emoji: "🏆", style: "cinematic", tagline: "And the award goes to...",      desc: "Oscar Night",     customNotes: "Hollywood red carpet, gleaming gold award statuettes, black-tie glamour, sequins and spotlights" },
  { name: "PrideFlix",    emoji: "🌈", style: "retro",     tagline: "Stream with pride",             desc: "Pride",           customNotes: "rainbow neon colors blazing, joyful pride parade energy, all colors vivid and electric" },
  { name: "LoveBox",      emoji: "💝", style: "retro",     tagline: "For the love of streaming",     desc: "Valentine's Day", customNotes: "hearts and red roses, romantic pink and crimson palette, love in the air" },
  { name: "LuckyStream",  emoji: "🍀", style: "nature",    tagline: "Stream your luck tonight",      desc: "St. Patrick's Day",customNotes: "shamrocks and clover, rich vivid Irish green, golden sunlight, festive spirit" },
  { name: "FreedomFlix",  emoji: "🗽", style: "epic",      tagline: "Independence from bad content", desc: "Fourth of July",  customNotes: "fireworks in red white and blue, patriotic summer night sky, stars and stripes energy" },
  { name: "HarvestFlix",  emoji: "🦃", style: "cinematic", tagline: "Gather and stream together",    desc: "Thanksgiving",    customNotes: "harvest cornucopia and autumn abundance, warm earthy tones, grateful gathering season" },
  { name: "LuminaryFlix", emoji: "🕎", style: "minimal",   tagline: "Eight nights of great picks",   desc: "Hanukkah",        customNotes: "menorah with glowing candles, blue and silver palette, Festival of Lights warmth" },
];

// Styles that skip Runway image generation and render the logo directly on canvas
const CANVAS_STYLES = new Set<Style>(["adultswim", "minimal", "prestige"]);

type LogoMode = "ai" | "upload";
type GenMode = "image-only" | "full";

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

const IMAGE_MODELS: { id: ImageModel; label: string; group: "Runway" | "OpenAI" | "Google"; crInfo: string; desc: string }[] = [
  { id: "gen4_image",        label: "Gen4 Image",         group: "Runway",  crInfo: "~30 cr",  desc: "Creative, artistic style" },
  { id: "gen4_image_turbo",  label: "Gen4 Turbo",         group: "Runway",  crInfo: "~15 cr",  desc: "Faster, great quality" },
  { id: "gpt_image_2",       label: "GPT Image 2",        group: "OpenAI",  crInfo: "~40 cr",  desc: "Precise instruction-following" },
  { id: "gemini_image3_pro", label: "Gemini Image 3 Pro", group: "Google",  crInfo: "~20 cr",  desc: "Vivid, instruction-aware" },
  { id: "gemini_2.5_flash",  label: "Gemini 2.5 Flash",   group: "Google",  crInfo: "~10 cr",  desc: "Fast, Google quality" },
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
  const router = useRouter();
  const [name, setName]         = useState("Joeflix");
  const [tagline, setTagline]   = useState("Where stories come alive");
  const [style, setStyle]       = useState<Style>("cinematic");
  const [duration, setDuration] = useState<Duration>(STYLE_DEFAULTS["cinematic"].duration);
  const [step, setStep]         = useState<GenStep>("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(true);
  const [showInstall, setShowInstall] = useState(false);
  const [logoMode, setLogoMode] = useState<LogoMode>("ai");
  const [imageModel, setImageModel] = useState<ImageModel>("gen4_image");
  const [videoModel, setVideoModel] = useState<VideoModel>(STYLE_DEFAULTS["cinematic"].videoModel);
  const [treatment, setTreatment] = useState<Treatment>(STYLE_DEFAULTS["cinematic"].treatment);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [customNotes, setCustomNotes] = useState("");
  const [uploadedUri, setUploadedUri] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [timings, setTimings] = useState<{ image: number; video: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [audio, setAudio] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [genMode, setGenMode] = useState<GenMode>("full");
  const [reviewNotes, setReviewNotes] = useState("");
  const [videoRegenNotes, setVideoRegenNotes] = useState("");
  const [sessionRestored, setSessionRestored] = useState(false);
  const [pollStatus, setPollStatus] = useState<string | null>(null);
  const [pollProgress, setPollProgress] = useState<number | null>(null);
  const [imagePromptOverride, setImagePromptOverride] = useState<string | null>(null);
  const [videoPromptOverride, setVideoPromptOverride] = useState<string | null>(null);
  const [cancelTaskId, setCancelTaskId] = useState("");
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [imageProgress, setImageProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const genStartRef = useRef(0);
  const imageTimeRef = useRef(0);
  const activeTaskIdRef = useRef<string | null>(null);
  const cancelRequestedRef = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (imageProgressRef.current) clearInterval(imageProgressRef.current);
  }, []);

  // Restore completed generation from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.step === "done" || p.step === "error" || p.step === "review") {
          if (p.name)    setName(p.name);
          if (p.style)   setStyle(p.style);
          if (p.tagline !== undefined) setTagline(p.tagline);
          if (p.imageUrl) setImageUrl(p.imageUrl);
          if (p.videoUrl) setVideoUrl(p.videoUrl);
          if (p.timings)  setTimings(p.timings);
          if (p.error)    setError(p.error);
          if (p.videoModel)  setVideoModel(p.videoModel);
          if (p.imageModel)  setImageModel(p.imageModel);
          if (p.treatment)   setTreatment(p.treatment);
          if (p.duration)    setDuration(p.duration);
          setStep(p.step);
        }
      }
    } catch {}
    setSessionRestored(true);
  }, []);

  // Persist completed/error state to sessionStorage so navigation doesn't wipe results
  useEffect(() => {
    if (!sessionRestored) return;
    if (step === "done" || step === "error" || step === "review") {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(
          { step, imageUrl, videoUrl, timings, error, name, style, tagline, videoModel, imageModel, treatment, duration }
        ));
      } catch {}
    } else if (step === "idle") {
      try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    }
  }, [step, imageUrl, videoUrl, timings, error, name, style, tagline, sessionRestored]);

  // Warn before browser-level unload (refresh/close) while a generation is running
  useEffect(() => {
    if (step !== "image" && step !== "video") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [step]);

  // Move focus to result when generation completes so keyboard/screen-reader users
  // don't have to discover the change by tabbing.
  useEffect(() => {
    if (step === "done") resultRef.current?.focus();
  }, [step]);

  const { key: apiKey, loaded: keyLoaded } = useApiKey();
  const preview = buildPrompts({ name, style, tagline, duration, treatment, videoModel, primaryColor: primaryColor ?? undefined, customNotes: customNotes || undefined });
  const isGenerating = step === "image" || step === "video";
  const selectedDuration = DURATIONS.find((d) => d.value === duration)!;
  const accentColor = STYLE_COLOR[style];
  const crPerSec = videoModel === "gen4.5" ? 12 : videoModel === "veo3" || videoModel === "veo3.1" ? 25 : videoModel === "veo3.1_fast" ? 15 : 5;
  const isVeoModel = videoModel === "veo3" || videoModel === "veo3.1" || videoModel === "veo3.1_fast";
  const activeDurations = isVeoModel ? VEO_DURATIONS : DURATIONS;

  function shuffleTagline() {
    const suggestions = STYLE_TAGLINES[style];
    const available = suggestions.filter(t => t !== tagline);
    if (!available.length) return;
    setTagline(available[Math.floor(Math.random() * available.length)]);
  }

  function startImageProgress() {
    setImageProgress(0);
    let ticks = 0;
    imageProgressRef.current = setInterval(() => {
      ticks++;
      setImageProgress(88 * (1 - Math.exp(-ticks / 150)));
    }, 200);
  }

  function stopImageProgress(complete: boolean) {
    if (imageProgressRef.current) { clearInterval(imageProgressRef.current); imageProgressRef.current = null; }
    setImageProgress(complete ? 100 : 0);
  }

  async function downloadPoster() {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = makeFilename(name, style).replace(".mp4", `.${ext}`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(imageUrl, "_blank");
    }
  }

  function applyInspo(i: Preset) {
    setName(i.name);
    setTagline(i.tagline);
    setStyle(i.style);
    const d = STYLE_DEFAULTS[i.style];
    setVideoModel(d.videoModel);
    setImageModel(d.imageModel);
    setTreatment(d.treatment);
    setDuration(d.duration);
    setCustomNotes(i.customNotes ?? "");
    setStep("idle");
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
  }

  function cancelActiveTask() {
    const taskId = activeTaskIdRef.current;
    if (!taskId) return;
    activeTaskIdRef.current = null;
    const headers: Record<string, string> = {};
    if (apiKey) headers["x-runway-key"] = apiKey;
    // Fire-and-forget — don't block the UI on this
    fetch(`/api/video/cancel?id=${encodeURIComponent(taskId)}`, { method: "DELETE", headers }).catch(() => {});
  }

  function handleCancelVideo() {
    cancelRequestedRef.current = true;
    cancelActiveTask();
  }

  function reset() {
    cancelActiveTask();
    stopImageProgress(false);
    setPollStatus(null);
    setPollProgress(null);
    setCancelMsg(null);
    setCancelTaskId("");
    setStep("idle");
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
    setTimings(null);
    setElapsedMs(0);
    setVideoRegenNotes("");
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  }

  function safeReset() {
    if (step === "done" && videoUrl && !window.confirm("Start over? Your generated video will be lost.")) return;
    reset();
  }

  function handleModelChange(m: VideoModel) {
    setVideoModel(m);
    const veo = m === "veo3" || m === "veo3.1" || m === "veo3.1_fast";
    if (veo && ![4, 6, 8].includes(duration)) setDuration(4 as Duration);
    else if (!veo && m !== "gen4.5" && ![2, 5, 10].includes(duration)) setDuration(5 as Duration);
  }

  function copyScript() {
    const durationLine = `    duration: ${duration},\n`;
    const audioLine = isVeoModel && audio ? `    audio: true,\n` : "";
    const script = `import RunwayML from "@runwayml/sdk";

const runway = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

// Step 1: Generate logo image
const imageTask = await runway.textToImage
  .create({
    model: "${imageModel}",
    promptText: \`${preview.imagePrompt}\`,
    ratio: "${imageRatio(imageModel)}",
  })
  .waitForTaskOutput();

const logoUrl = imageTask.output[0];

// Step 2: Animate into a ${duration}s intro
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
    setUploadError(null);
    setUploadedUri(null);
    setUploadPreview(URL.createObjectURL(file));

    const MAX_BYTES = 3 * 1024 * 1024; // 3 MB — keeps data URI under Vercel's 4.5 MB body limit
    if (file.size > MAX_BYTES) {
      setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 3 MB.`);
      return;
    }

    setIsUploading(true);
    try {
      // Read as base64 data URI — Runway's promptImage accepts data URIs directly,
      // so no server-side upload or API key needed for this step.
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      setUploadedUri(dataUri);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setIsUploading(false);
    }
  }

  function buildBody(overrideNotes?: string) {
    return {
      name: name.trim(), style, tagline: tagline.trim(), duration,
      imageModel, videoModel, treatment,
      primaryColor: primaryColor ?? undefined,
      customNotes: overrideNotes ?? (customNotes.trim() || undefined),
      audio: isVeoModel ? audio : undefined,
      imagePromptOverride: imagePromptOverride ?? undefined,
      videoPromptOverride: videoPromptOverride ?? undefined,
    };
  }

  function startTimer() {
    setElapsedMs(0);
    genStartRef.current = Date.now();
    timerRef.current = setInterval(() => setElapsedMs(Date.now() - genStartRef.current), 100);
  }

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function generateCanvasLogo(): Promise<string> {
    const W = 1280, H = 720;
    const cvs = document.createElement("canvas");
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext("2d")!;

    const displayName = name.trim().toUpperCase();
    const hasTagline = Boolean(tagline?.trim());

    // Helper: auto-fit text to a target pixel width
    function fitFontSize(fontSpec: (sz: number) => string, text: string, targetW: number, maxSz: number, minSz: number): number {
      ctx.font = fontSpec(maxSz);
      const measured = ctx.measureText(text).width;
      if (measured <= targetW) return maxSz;
      const scaled = Math.floor(maxSz * (targetW / measured));
      return Math.max(minSz, scaled);
    }

    if (style === "adultswim") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(0,0,0,0.18)";
      for (let y = 0; y < H; y += 2) ctx.fillRect(0, y, W, 1);

      const bracketName = `[${name.trim().toLowerCase()}]`;
      const fontSize = fitFontSize(sz => `400 ${sz}px "Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif`, bracketName, W * 0.80, 80, 24);
      ctx.font = `400 ${fontSize}px "Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(bracketName, W / 2, hasTagline ? H * 0.46 : H * 0.5);

      if (hasTagline) {
        const tagFontSize = Math.max(16, Math.floor(fontSize * 0.44));
        ctx.font = `400 ${tagFontSize}px "Arial Narrow","Helvetica Neue",Helvetica,Arial,sans-serif`;
        ctx.fillText(tagline!.trim().toLowerCase(), W / 2, H * 0.59);
      }

    } else if (style === "minimal") {
      await document.fonts.load(`300 100px "Geist"`);
      ctx.fillStyle = "#080808";
      ctx.fillRect(0, 0, W, H);

      const fontSize = fitFontSize(sz => `300 ${sz}px "Geist","Helvetica Neue",Helvetica,sans-serif`, displayName, W * 0.72, 200, 36);
      ctx.font = `300 ${fontSize}px "Geist","Helvetica Neue",Helvetica,sans-serif`;
      ctx.fillStyle = "#f0f0f0";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const centerY = hasTagline ? H * 0.44 : H * 0.5;
      ctx.fillText(displayName, W / 2, centerY);

      // Thin rule beneath
      const textWidth = ctx.measureText(displayName).width;
      ctx.strokeStyle = "#282828";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - textWidth / 2, centerY + fontSize * 0.62 + 10);
      ctx.lineTo(W / 2 + textWidth / 2, centerY + fontSize * 0.62 + 10);
      ctx.stroke();

      if (hasTagline) {
        const tagFontSize = Math.max(16, Math.floor(fontSize * 0.20));
        ctx.font = `300 ${tagFontSize}px "Geist","Helvetica Neue",Helvetica,sans-serif`;
        ctx.fillStyle = "#555555";
        ctx.fillText(tagline!.trim().toUpperCase(), W / 2, H * 0.62);
      }

    } else if (style === "prestige") {
      await document.fonts.load(`900 100px "Geist"`);
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, W, H);

      const fontSize = fitFontSize(sz => `900 ${sz}px "Geist","Helvetica Neue",Helvetica,sans-serif`, displayName, W * 0.78, 200, 40);
      ctx.font = `900 ${fontSize}px "Geist","Helvetica Neue",Helvetica,sans-serif`;
      ctx.fillStyle = "#E50914";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const centerY = hasTagline ? H * 0.44 : H * 0.5;
      ctx.fillText(displayName, W / 2, centerY);

      if (hasTagline) {
        const tagFontSize = Math.max(16, Math.floor(fontSize * 0.20));
        ctx.font = `400 ${tagFontSize}px "Geist","Helvetica Neue",Helvetica,sans-serif`;
        ctx.fillStyle = "#666666";
        ctx.fillText(tagline!.trim().toUpperCase(), W / 2, H * 0.62);
      }
    }

    return cvs.toDataURL("image/jpeg", 0.95);
  }

  async function generate() {
    if (!name.trim()) return;
    if (keyLoaded && !apiKey) { router.push("/setup"); return; }

    cancelRequestedRef.current = false;
    setImageUrl(null);
    setVideoUrl(null);
    setError(null);
    setTimings(null);
    setReviewNotes("");
    imageTimeRef.current = 0;

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
        startImageProgress();
        const imageStart = Date.now();
        const dataUri = await generateCanvasLogo();
        imageTimeRef.current = Date.now() - imageStart;
        stopImageProgress(true);
        setImageUrl(dataUri);
        if (genMode === "image-only") {
          setTimings({ image: imageTimeRef.current, video: 0 });
          setStep("done");
          return;
        }
        setStep("review");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Canvas render failed");
        setStep("error");
      } finally {
        stopTimer();
      }
      return;
    }

    // AI generation path
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["x-runway-key"] = apiKey;
    startTimer();

    try {
      setStep("image");
      startImageProgress();
      const imageStart = Date.now();
      const imageRes = await fetch("/api/image", { method: "POST", headers, body: JSON.stringify(buildBody()) });
      const imageData = await imageRes.json();
      if (!imageRes.ok) { stopImageProgress(false); throw new Error(imageData.error ?? "Image generation failed"); }
      imageTimeRef.current = Date.now() - imageStart;
      stopImageProgress(true);
      setImageUrl(imageData.imageUrl);

      if (genMode === "image-only") {
        setTimings({ image: imageTimeRef.current, video: 0 });
        setStep("done");
        return;
      }

      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    } finally {
      stopTimer();
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
    startImageProgress();

    try {
      const imageStart = Date.now();
      const imageRes = await fetch("/api/image", { method: "POST", headers, body: JSON.stringify(buildBody(combined || undefined)) });
      const imageData = await imageRes.json();
      if (!imageRes.ok) { stopImageProgress(false); throw new Error(imageData.error ?? "Image generation failed"); }
      imageTimeRef.current = Date.now() - imageStart;
      stopImageProgress(true);
      setImageUrl(imageData.imageUrl);
      setStep("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    } finally {
      stopTimer();
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
    startTimer();
    setStep("video");

    try {
      // Step 1: kick off the Runway task (fast, < 5s)
      setPollStatus("STARTING");
      const videoCombinedNotes = [customNotes.trim(), videoRegenNotes.trim()].filter(Boolean).join(". ");
      const startRes = await fetch("/api/video/start", {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({ ...buildBody(videoCombinedNotes || undefined), imageUrl: effectiveImageUrl }),
      });
      const startData = await startRes.json();
      if (!startRes.ok) throw new Error(startData.error ?? "Failed to start video generation");

      const taskId: string = startData.taskId;
      activeTaskIdRef.current = taskId;
      const videoStart = Date.now();
      const maxWaitMs = 15 * 60 * 1000; // 15 minutes

      // Step 2: poll every 8s until done (Runway updates no more than every 5s)
      while (Date.now() - videoStart < maxWaitMs) {
        await new Promise<void>(r => setTimeout(r, 8_000));

        if (cancelRequestedRef.current) {
          cancelRequestedRef.current = false;
          setPollStatus(null);
          setPollProgress(null);
          setStep("review");
          return;
        }

        const pollRes = await fetch(`/api/video/poll?id=${encodeURIComponent(taskId)}`, { headers: pollHeaders });
        const pollData = await pollRes.json();
        if (!pollRes.ok) throw new Error(pollData.error ?? "Status check failed");

        const { status, output, failure, progress } = pollData;
        setPollStatus(status);
        if (typeof progress === "number") setPollProgress(Math.round(progress * 100));
        else if (status !== "RUNNING") setPollProgress(null);

        if (status === "SUCCEEDED") {
          activeTaskIdRef.current = null;
          const videoTime = Date.now() - videoStart;
          setVideoUrl(output);
          setTimings({ image: imageTimeRef.current, video: videoTime });
          setPollStatus(null);
          setPollProgress(null);
          setStep("done");
          return;
        }
        if (status === "FAILED")    throw new Error(failure ?? "Video generation failed");
        if (status === "CANCELLED") throw new Error("Video generation was cancelled");
        // PENDING / THROTTLED / RUNNING → keep polling
      }

      throw new Error("Video generation timed out after 15 minutes. Check your Runway dashboard for task status.");
    } catch (e) {
      activeTaskIdRef.current = null;
      setPollStatus(null);
      setPollProgress(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStep("error");
    } finally {
      stopTimer();
    }
  }

  return (
    <main
      id="main-content"
      className="relative min-h-screen text-white flex flex-col items-center overflow-hidden"
      style={{ background: "#080808" }}
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
      <nav aria-label="Site navigation" className="w-full max-w-2xl px-4 flex justify-between items-center pt-6 pb-3 text-sm text-neutral-500">
        <span className="font-bold text-white tracking-tight text-lg">StreamRoll</span>
        <div className="flex items-center gap-5">
          <Link href="/how-it-works" className="hover:text-white transition-colors">How it&apos;s built</Link>
          <Link href="/setup" className="hover:text-white transition-colors">API key</Link>
          <a href={LINKS.runwaySignup} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
            Get Runway →
          </a>
        </div>
      </nav>

      {/* Full-bleed cinematic video hero */}
      <div className="w-full relative" style={{ height: "clamp(220px, 36vw, 500px)" }}>
        <h1 className="sr-only">StreamRoll — AI-generated streaming intros for Plex, Jellyfin, and Emby</h1>
        <VideoMontage />
        {/* top: blends nav into video */}
        <div className="absolute inset-x-0 top-0 pointer-events-none z-10" style={{ height: "35%", background: "linear-gradient(to bottom, #080808 0%, transparent 100%)" }} />
        {/* bottom: dissolves into page */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10" style={{ height: "50%", background: "linear-gradient(to top, #080808 0%, transparent 100%)" }} />
        {/* side vignettes */}
        <div className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10" style={{ background: "linear-gradient(to right, #080808, transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10" style={{ background: "linear-gradient(to left, #080808, transparent)" }} />
      </div>

      {/* Works with + API key — sits over the bottom fade of the video */}
      <div className="w-full max-w-2xl px-4 -mt-10 z-20 relative flex flex-col items-center gap-3 pb-8">
        <div className="flex items-center justify-center gap-5">
          <span className="text-xs text-neutral-600">Works with</span>
          {PLATFORMS.map((p) => (
            <div key={p.name} className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/logos/${p.slug}.svg`} alt="" aria-hidden="true" width={16} height={16} />
              <span className="text-xs font-medium" style={{ color: p.color }}>{p.name}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-neutral-700">
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

      <div className="w-full max-w-2xl px-4 space-y-8">

        {/* Style */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-300">
              {logoMode === "upload" ? "Motion style" : "Style"}
            </label>
            <button
              onClick={() => applyInspo(INSPO[Math.floor(Math.random() * INSPO.length)])}
              disabled={isGenerating}
              className="text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-3 py-1 rounded-full transition-colors disabled:opacity-40"
            >
              🎲 Surprise me
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {STYLES.map((s) => {
              const isActive = style === s.id;
              const color = STYLE_COLOR[s.id];
              return (
                <button
                  key={s.id}
                  aria-pressed={isActive}
                  onClick={() => {
                    setStyle(s.id);
                    const d = STYLE_DEFAULTS[s.id];
                    setVideoModel(d.videoModel);
                    setImageModel(d.imageModel);
                    setTreatment(d.treatment);
                    setDuration(d.duration);
                  }}
                  disabled={isGenerating}
                  className="flex flex-col items-start p-3 rounded-lg border transition-all disabled:opacity-50"
                  style={isActive
                    ? { borderColor: color + "70", backgroundColor: color + "15" }
                    : { borderColor: "#262626" }
                  }
                >
                  <span className="text-lg mb-1">{s.emoji}</span>
                  <div className="font-medium text-xs" style={isActive ? { color } : { color: "#e5e7eb" }}>{s.label}</div>
                  <div className="text-xs leading-tight mt-0.5 text-neutral-500">{s.desc}</div>
                </button>
              );
            })}
          </div>
          {STYLES.find(s => s.id === style)?.tip && (
            <p className="mt-2 text-xs text-neutral-600">
              💡 {STYLES.find(s => s.id === style)!.tip}
            </p>
          )}

          {/* Themed presets */}
          <div className="mt-4">
            <div className="text-xs mb-2 tracking-wide flex items-center gap-1.5">
              <span style={{ color: "#166534" }}>✦</span>
              <span className="text-neutral-600">Seasonal</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEASONAL.map((i) => {
                const isActive = name === i.name && style === i.style;
                const color = STYLE_COLOR[i.style];
                return (
                  <button
                    key={i.name}
                    onClick={() => applyInspo(i)}
                    disabled={isGenerating}
                    className="flex flex-col items-start p-2.5 rounded-lg border transition-all disabled:opacity-40"
                    style={isActive
                      ? { borderColor: color + "60", backgroundColor: color + "12" }
                      : { borderColor: "#1c2a1c" }
                    }
                  >
                    <span className="text-xl mb-1">{i.emoji}</span>
                    <div className="font-medium text-sm" style={isActive ? { color } : { color: "#e5e7eb" }}>{i.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#7aaa7a" }}>{i.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            <div className="text-xs mb-2 tracking-wide flex items-center gap-1.5">
              <span style={{ color: "#92400e" }}>✦</span>
              <span className="text-neutral-600">Holidays</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {HOLIDAYS.map((i) => {
                const isActive = name === i.name && style === i.style;
                const color = STYLE_COLOR[i.style];
                return (
                  <button
                    key={i.name}
                    onClick={() => applyInspo(i)}
                    disabled={isGenerating}
                    className="flex flex-col items-start p-2.5 rounded-lg border transition-all disabled:opacity-40"
                    style={isActive
                      ? { borderColor: color + "60", backgroundColor: color + "12" }
                      : { borderColor: "#2a1e0e" }
                    }
                  >
                    <span className="text-xl mb-1">{i.emoji}</span>
                    <div className="font-medium text-sm" style={isActive ? { color } : { color: "#e5e7eb" }}>{i.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "#b8895a" }}>{i.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Name & tagline */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="service-name" className="block text-sm font-medium text-neutral-300 mb-2">Service name</label>
            <input
              id="service-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Joeflix"
              maxLength={30}
              disabled={isGenerating}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 disabled:opacity-50 transition-colors"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-neutral-700">Short names render best</span>
              <span className={`text-xs tabular-nums ${name.length > 18 ? "text-amber-600" : "text-neutral-700"}`}>{name.length}/30</span>
            </div>
          </div>
          <div>
            <label htmlFor="tagline" className="block text-sm font-medium text-neutral-300 mb-2">
              Tagline <span className="text-neutral-600">(optional)</span>
            </label>
            <div className="relative">
              <input
                id="tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Where stories come alive"
                maxLength={60}
                disabled={isGenerating}
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 disabled:opacity-50 transition-colors pr-10"
              />
              <button
                onClick={shuffleTagline}
                disabled={isGenerating}
                aria-label="Shuffle tagline"
                title="Shuffle tagline"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300 transition-colors disabled:opacity-40 text-base leading-none"
              >
                ↺
              </button>
            </div>
          </div>
        </section>


        {/* Duration */}
        <section>
          <label className="block text-sm font-medium text-neutral-300 mb-3">Duration</label>
          <div className="flex gap-3">
            {activeDurations.map((d) => (
              <button
                key={d.value}
                aria-pressed={duration === d.value}
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

              {/* Image model */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Image model</label>
                <div className="space-y-1.5">
                  {(["Runway", "OpenAI", "Google"] as const).map((group) => {
                    const models = IMAGE_MODELS.filter(m => m.group === group);
                    if (!models.length) return null;
                    return (
                      <div key={group}>
                        <div className="text-xs text-neutral-700 mb-2">{group === "OpenAI" ? "OpenAI via Runway" : group === "Google" ? "Google via Runway" : "Runway"}</div>
                        <div className="grid grid-cols-2 gap-2">
                          {models.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => setImageModel(m.id)}
                              disabled={isGenerating}
                              className="flex flex-col items-start p-2.5 rounded-lg border text-xs transition-all disabled:opacity-50 text-left"
                              style={imageModel === m.id
                                ? { borderColor: accentColor + "70", backgroundColor: accentColor + "15" }
                                : { borderColor: "#262626" }
                              }
                            >
                              <div className="flex items-center justify-between w-full mb-0.5">
                                <span className="font-semibold" style={imageModel === m.id ? { color: accentColor } : { color: "#e5e7eb" }}>{m.label}</span>
                                <span className="text-neutral-700 text-[10px]">{m.crInfo}</span>
                              </div>
                              <span className="text-neutral-600 leading-tight">{m.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

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
                      role="switch"
                      aria-checked={audio}
                      onClick={() => setAudio((v) => !v)}
                      disabled={isGenerating}
                      aria-label="Generate audio"
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
                      aria-pressed={treatment === t.id}
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
                      aria-label={`Select ${c.label} color`}
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
                <label htmlFor="custom-details" className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                  Custom details <span className="text-neutral-700 font-normal normal-case">(optional)</span>
                </label>
                <input
                  id="custom-details"
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
              <EditablePromptBlock
                label={`Step 1 · ${IMAGE_MODELS.find(m => m.id === imageModel)?.label ?? imageModel} · ${imageRatio(imageModel).replace(":", "x")}`}
                generated={preview.imagePrompt}
                override={imagePromptOverride}
                onChange={setImagePromptOverride}
              />
              <EditablePromptBlock
                label={`Step 2 · ${videoModel} · 1280x720${isVeoModel && audio ? " · audio on" : ""}`}
                generated={preview.videoPrompt}
                override={videoPromptOverride}
                onChange={setVideoPromptOverride}
              />
            </div>
          )}
        </section>

        {/* Logo source */}
        <section>
          <label className="block text-sm font-medium text-neutral-300 mb-3">Logo source</label>
          <div className="flex gap-2">
            {(["ai", "upload"] as LogoMode[]).map((m) => (
              <button
                key={m}
                aria-pressed={logoMode === m}
                onClick={() => { setLogoMode(m); setUploadError(null); }}
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
            <div className="mt-4">
              <label
                aria-label={uploadedUri ? "Replace uploaded logo" : "Upload your logo image"}
                className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all"
                style={{ borderColor: uploadError ? "#ef4444" : uploadedUri ? accentColor + "60" : "#404040", backgroundColor: uploadedUri ? accentColor + "08" : "transparent" }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const f = e.dataTransfer.files?.[0];
                  if (f && !isGenerating && !isUploading) handleFileUpload(f);
                }}
              >
                {uploadPreview ? (
                  <div className="relative w-full h-full">
                    <Image src={uploadPreview} alt="Uploaded logo" fill className="object-contain p-3 rounded-xl" unoptimized />
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                        <span className="text-sm text-white animate-pulse">Uploading to Runway…</span>
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
              {uploadError && (
                <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                  <span>⚠</span> {uploadError}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Generation mode — AI path only */}
        {logoMode === "ai" && (
          <div className="flex gap-2">
            {(["image-only", "full"] as GenMode[]).map((m) => (
              <button
                key={m}
                aria-pressed={genMode === m}
                onClick={() => setGenMode(m)}
                disabled={isGenerating}
                className="flex-1 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-50"
                style={genMode === m
                  ? { borderColor: accentColor + "70", backgroundColor: accentColor + "15", color: accentColor }
                  : { borderColor: "#262626", color: "#a3a3a3" }
                }
              >
                {m === "image-only" ? "🖼 Logo only" : "🎬 Full intro (logo + video)"}
              </button>
            ))}
          </div>
        )}

        {/* Generate */}
        <button
          onClick={generate}
          disabled={isGenerating || !name.trim() || (keyLoaded && !apiKey) || isUploading || (logoMode === "upload" && !uploadedUri)}
          className="w-full font-semibold py-3.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-base"
          style={
            isGenerating || !name.trim() || (keyLoaded && !apiKey) || isUploading || (logoMode === "upload" && !uploadedUri)
              ? { background: "#fff", color: "#000" }
              : {
                  background: `linear-gradient(135deg, ${accentColor}22 0%, transparent 60%), #fff`,
                  color: "#000",
                  boxShadow: `0 0 24px ${accentColor}30`,
                }
          }
        >
          {isGenerating
            ? `Generating... ${(elapsedMs / 1000).toFixed(1)}s`
            : isUploading
            ? "Uploading..."
            : keyLoaded && !apiKey
            ? "Add API key to generate →"
            : logoMode === "upload" && !uploadedUri
            ? "Upload a logo first"
            : logoMode === "upload"
            ? "Animate My Logo"
            : genMode === "image-only"
            ? "Generate Logo"
            : "Generate Intro"}
        </button>
      </div>

      {/* Progress + results */}
      {(isGenerating || step === "review" || step === "done" || (step === "error" && imageUrl)) && (
        <div ref={resultRef} tabIndex={-1} className="mt-10 w-full max-w-2xl px-4 focus:outline-none">
          <div className="flex items-center gap-4 mb-6">
            <StepIndicator label="Scene 1 · Design poster" status={step === "image" ? "active" : "done"} color={accentColor} />
            {genMode === "full" && (
              <>
                <div className="flex-1 h-px bg-neutral-800" />
                <StepIndicator
                  label="Scene 2 · Roll camera"
                  status={step === "video" ? "active" : step === "done" ? "done" : step === "error" ? "error" : "pending"}
                  color={accentColor}
                />
              </>
            )}
            {step === "video" && (
              <button
                onClick={handleCancelVideo}
                className="ml-2 text-xs text-red-500 hover:text-red-400 transition-colors shrink-0"
              >
                ✕ Cancel
              </button>
            )}
            {!isGenerating && (
              <button
                onClick={safeReset}
                className="ml-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors shrink-0"
              >
                ✕ Start over
              </button>
            )}
          </div>

          <div className="space-y-4">
            {/* Image skeleton */}
            {step === "image" && !imageUrl && logoMode === "ai" && (
              <div className="rounded-xl overflow-hidden border border-neutral-800">
                <div className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                  <div className="h-3 w-44 rounded bg-neutral-800 animate-pulse" />
                  <span className="text-xs tabular-nums" style={{ color: accentColor }}>{Math.round(imageProgress)}%</span>
                </div>
                <div className="w-full bg-neutral-900 animate-pulse" style={{ aspectRatio: "16/9" }} />
                <div className="px-3 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${imageProgress}%`, backgroundColor: accentColor }}
                    />
                  </div>
                  <span className="text-xs text-neutral-500 shrink-0">Generating poster…</span>
                </div>
              </div>
            )}

            {imageUrl && (
              <div className="rounded-xl overflow-hidden border border-neutral-800" style={{ boxShadow: `0 0 40px ${accentColor}18` }}>
                <div className="px-3 py-2 text-xs text-neutral-500 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                  <span>Scene 1 · Logo · {imageRatio(imageModel).replace(":", "x")}</span>
                  <div className="flex items-center gap-3">
                    {timings && timings.image > 0 && <span className="tabular-nums">{(timings.image / 1000).toFixed(1)}s</span>}
                    <button
                      onClick={downloadPoster}
                      className="text-xs border px-2 py-0.5 rounded transition-colors hover:text-white hover:border-neutral-500"
                      style={{ borderColor: "#404040", color: "#737373" }}
                    >
                      ↓ Download poster
                    </button>
                  </div>
                </div>
                <Image src={imageUrl} alt="Generated logo" width={1920} height={1080} className="w-full" unoptimized />
              </div>
            )}

            {/* Logo-only done — offer to continue to video */}
            {step === "done" && genMode === "image-only" && imageUrl && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-neutral-200">Happy with the logo?</p>
                  <p className="text-xs text-neutral-500 mt-0.5">You can generate the full intro video from it.</p>
                </div>
                <button
                  onClick={() => { setGenMode("full"); proceedToVideo(); }}
                  className="py-2.5 px-5 rounded-lg text-sm font-semibold text-black shrink-0 transition-all"
                  style={{ background: accentColor }}
                >
                  Generate video →
                </button>
              </div>
            )}

            {/* Review step — approve or regenerate before animating */}
            {step === "review" && genMode === "full" && (
              <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 space-y-3">
                <p className="text-sm font-medium text-neutral-200">Happy with the logo?</p>
                <p className="text-xs text-neutral-500">Approve it to animate, or add notes and regenerate.</p>
                <input
                  type="text"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && reviewNotes.trim() && handleRegenerate()}
                  placeholder='e.g. "make text bolder", "brighter red", "less grain"'
                  aria-label="Notes for logo regeneration"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-500 text-sm"
                />
                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="py-2.5 px-4 rounded-lg border border-neutral-800 text-sm text-neutral-600 hover:text-neutral-400 hover:border-neutral-700 transition-colors"
                  >
                    Start over
                  </button>
                  <button
                    onClick={handleRegenerate}
                    className="flex-1 py-2.5 rounded-lg border border-neutral-700 text-sm text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
                  >
                    ↺ Regenerate
                  </button>
                  <button
                    onClick={() => proceedToVideo()}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black transition-all"
                    style={{ background: accentColor }}
                  >
                    Looks good → Make the video
                  </button>
                </div>
              </div>
            )}

            {/* Video skeleton */}
            {step === "video" && !videoUrl && (
              <div className="rounded-xl overflow-hidden border border-neutral-800">
                {/* Status bar */}
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="px-3 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-2"
                >
                  <div className="h-3 w-56 rounded bg-neutral-800 animate-pulse shrink-0" />
                  {pollStatus && (
                    <span className="text-xs shrink-0" style={{ color: pollStatus === "RUNNING" ? "#22C55E" : pollStatus === "THROTTLED" ? "#F59E0B" : "#6B7280" }}>
                      {pollStatus === "STARTING"  && "Submitting task…"}
                      {pollStatus === "PENDING"   && "Queued — waiting to start"}
                      {pollStatus === "RUNNING"   && `⚙ Generating frames…${pollProgress !== null ? ` ${pollProgress}%` : ""}`}
                      {pollStatus === "THROTTLED" && "⏳ Throttled — concurrent task limit reached"}
                    </span>
                  )}
                </div>

                {/* Progress bar (RUNNING only) */}
                {pollStatus === "RUNNING" && pollProgress !== null && (
                  <div className="px-3 py-2 bg-neutral-950 border-b border-neutral-800 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pollProgress}%`, backgroundColor: "#22C55E" }}
                      />
                    </div>
                    <span className="text-xs tabular-nums shrink-0" style={{ color: "#22C55E" }}>
                      {pollProgress}%
                    </span>
                  </div>
                )}

                {/* Placeholder area */}
                <div className="w-full bg-neutral-900 animate-pulse" style={{ aspectRatio: "16/9" }}>
                  {pollStatus === "THROTTLED" && (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-10 px-6">
                      <p className="text-sm text-neutral-400 text-center max-w-sm">
                        Another task is still running on your Runway account (concurrency limit: 1).
                        Copy a task ID from your{" "}
                        <span className="text-neutral-300">Runway dev portal → Request History</span>
                        {" "}and cancel it here, or cancel this queued task and try again later.
                      </p>

                      {/* Cancel-by-ID input */}
                      <div className="flex gap-2 w-full max-w-sm">
                        <input
                          type="text"
                          value={cancelTaskId}
                          onChange={e => { setCancelTaskId(e.target.value); setCancelMsg(null); }}
                          placeholder="Paste task ID to cancel…"
                          className="flex-1 text-xs bg-neutral-800 border border-neutral-700 rounded px-3 py-1.5 text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-amber-600"
                        />
                        <button
                          disabled={!cancelTaskId.trim()}
                          onClick={async () => {
                            const id = cancelTaskId.trim();
                            setCancelMsg("Cancelling…");
                            const h: Record<string, string> = {};
                            if (apiKey) h["x-runway-key"] = apiKey;
                            const res = await fetch(`/api/video/cancel?id=${encodeURIComponent(id)}`, { method: "DELETE", headers: h });
                            const data = await res.json();
                            if (res.ok) { setCancelMsg("Cancelled ✓ — polling will resume shortly."); setCancelTaskId(""); }
                            else setCancelMsg(`Error: ${data.error ?? "cancel failed"}`);
                          }}
                          className="text-xs px-3 py-1.5 rounded border border-amber-700 text-amber-400 hover:bg-amber-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                        >
                          Cancel task
                        </button>
                      </div>
                      {cancelMsg && (
                        <p className="text-xs" style={{ color: cancelMsg.startsWith("Error") ? "#EF4444" : "#22C55E" }}>
                          {cancelMsg}
                        </p>
                      )}

                      <button
                        onClick={reset}
                        className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        Cancel this queued task & start over
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {videoUrl && (
              <div className="rounded-xl overflow-hidden border border-neutral-800" style={{ boxShadow: `0 0 80px ${accentColor}30` }}>
                <div className="px-3 py-2 text-xs text-neutral-500 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between">
                  <span>Scene 2 · Intro video · {duration}s · 1280x720</span>
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
                <div className="px-3 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center gap-2">
                  <input
                    type="text"
                    value={videoRegenNotes}
                    onChange={(e) => setVideoRegenNotes(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && videoRegenNotes.trim()) { setVideoUrl(null); setStep("review"); } }}
                    placeholder='Notes for redo: e.g. "more energy", "darker background", "slower reveal"'
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                  />
                </div>
                <div className="px-3 py-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <button onClick={safeReset} className="text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 py-1.5 rounded transition-colors shrink-0">
                      Start over
                    </button>
                    <button
                      onClick={() => { setVideoUrl(null); setStep("review"); }}
                      className="text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 py-1.5 rounded transition-colors shrink-0"
                    >
                      Redo video
                    </button>
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
                      download={makeFilename(name, style)}
                      target="_blank"
                      rel="noopener noreferrer"
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
                          <img src={`/logos/${p.slug}.svg`} alt="" aria-hidden="true" width={12} height={12} />
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

      {step === "error" && !imageUrl && (
        <div className="mt-8 max-w-2xl w-full px-4 space-y-3">
          <div role="alert" className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">{error}</div>
          <button onClick={reset} className="text-sm text-neutral-400 hover:text-white transition-colors">Start over</button>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 w-full max-w-2xl px-4 border-t border-neutral-900 pt-8 pb-12 flex flex-col items-center gap-4 text-xs text-neutral-600">
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
      </footer>
    </main>
  );
}

const EXAMPLE_CLIPS = [
  "/examples/clip-netflix-v2.mp4",
  "/examples/clip-vhs.mp4",
  "/examples/clip-outrun.mp4",
  "/examples/clip-adultswim.mp4",
];

function VideoMontage() {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null, null]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      if (i === active) {
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [active]);

  return (
    <div className="absolute inset-0 bg-black" aria-hidden="true">
      {EXAMPLE_CLIPS.map((src, i) => (
        <video
          key={src}
          ref={(el) => { videoRefs.current[i] = el; }}
          src={src}
          muted
          playsInline
          preload={i === 0 ? "auto" : "none"}
          onEnded={() => {
            const next = (i + 1) % EXAMPLE_CLIPS.length;
            const nextVid = videoRefs.current[next];
            if (nextVid) nextVid.preload = "auto";
            setActive(next);
          }}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: active === i ? 1 : 0 }}
        />
      ))}
    </div>
  );
}

function makeFilename(name: string, style: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "intro";
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5).replace(":", "");
  return `${slug}-${style}-${date}-${time}.mp4`;
}

function StepIndicator({ label, status, color }: { label: string; status: "pending" | "active" | "done" | "error"; color: string }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all"
        style={
          status === "done"   ? { background: color, color: "#000" } :
          status === "active" ? { background: "#fff", color: "#000", animation: "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite" } :
          status === "error"  ? { background: "#7f1d1d", color: "#fca5a5" } :
                                { background: "#262626", color: "#737373" }
        }
      >
        {status === "done" ? "✓" : status === "active" ? "..." : status === "error" ? "✕" : "○"}
      </div>
      <span className="text-sm" style={
        status === "active" ? { color: "#fff" } :
        status === "done"   ? { color } :
        status === "error"  ? { color: "#fca5a5" } :
                              { color: "#525252" }
      }>
        {label}
      </span>
    </div>
  );
}

function EditablePromptBlock({
  label, generated, override, onChange,
}: {
  label: string;
  generated: string;
  override: string | null;
  onChange: (v: string | null) => void;
}) {
  const [copied, setCopied] = useState(false);
  const active = override ?? generated;
  const isEdited = override !== null && override !== generated;

  function copy() {
    navigator.clipboard.writeText(active);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: isEdited ? "#3f3f00" : "#262626" }}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b" style={{ backgroundColor: isEdited ? "#1a1a00" : "#171717", borderColor: isEdited ? "#3f3f00" : "#262626" }}>
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">{label}</span>
          {isEdited && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#3f3f00", color: "#facc15" }}>edited</span>}
        </div>
        <div className="flex items-center gap-3">
          {isEdited && (
            <button onClick={() => onChange(null)} className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors">
              Reset
            </button>
          )}
          <button onClick={copy} className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <textarea
        value={active}
        onChange={e => onChange(e.target.value === generated ? null : e.target.value)}
        rows={4}
        className="w-full px-3 py-2.5 text-xs font-mono leading-relaxed bg-neutral-950 text-neutral-400 resize-y focus:outline-none focus:text-neutral-200 transition-colors"
        style={{ minHeight: "5rem" }}
        spellCheck={false}
      />
    </div>
  );
}
