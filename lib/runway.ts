import RunwayML from "@runwayml/sdk";

function getClient(apiKey: string) {
  return new RunwayML({ apiKey, timeout: 120_000 });
}

export type Style =
  | "cinematic"
  | "retro"
  | "futuristic"
  | "minimal"
  | "horror"
  | "anime"
  | "epic"
  | "nature"
  | "prestige";

export type Duration = 2 | 4 | 5 | 6 | 8 | 10;
export type VideoModel = "gen4_turbo" | "gen4.5" | "gen3a_turbo" | "veo3" | "veo3.1" | "veo3.1_fast";
export type Treatment = "full-bleed" | "theatrical" | "minimal";

const styleDescriptions: Record<Style, string> = {
  cinematic:
    "deep navy and gold color palette, dramatic god rays, film grain, epic atmosphere, dark background",
  retro:
    "80s neon synthwave aesthetic, hot pink and electric blue, CRT glow, retro grid, dark background",
  futuristic:
    "holographic chrome, electric cyan and white, sci-fi glitch effects, lens flare, space black background",
  minimal:
    "clean white sans-serif typography, soft gradient background, understated elegant design",
  horror:
    "blood red and pitch black, gothic serif font, creeping fog, dark shadows, candle-lit atmosphere",
  anime:
    "vibrant Japanese animation style, cherry blossom petals, bold outline typography, pastel and vivid colors",
  epic:
    "golden hour light, sweeping dust, monumental scale, bronze and amber tones, cinematic widescreen",
  nature:
    "earthy organic tones, lush green, soft natural light, documentary aesthetic, clean sans-serif",
  prestige:
    "pure black background, bold crimson red wordmark, clean minimal modern sans-serif typography, stark negative space, no grain or particles, high contrast, prestige streaming service aesthetic",
};

const styleMotion: Record<Style, string> = {
  cinematic:
    "slow cinematic push-in, golden particles drift upward, subtle lens flare blooms, atmospheric fog",
  retro:
    "neon lights flicker on one by one, scanline sweep effect, retro zoom-in, electric sparks fly",
  futuristic:
    "holographic glitch reveal, digital particles assemble the logo, chromatic aberration pulse",
  minimal:
    "clean fade-in, logo gently scales up, soft white light sweep across the text",
  horror:
    "logo bleeds into frame from darkness, red smoke curls upward, candles flicker, eerie silence",
  anime:
    "cherry blossom petals swirl and form the logo, bright flash of light, dramatic anime-style reveal",
  epic:
    "dust clouds part to reveal the logo, golden sunlight erupts behind it, massive cinematic scale",
  nature:
    "logo grows organically like a vine, soft morning light washes across it, gentle leaf particles",
  prestige:
    "logo snaps into frame from pure darkness with a single bold confident reveal, bold red wordmark appears decisively from black, no particles or atmospheric haze, clean authoritative impact, holds on the logo",
};

const treatmentImage: Record<Treatment, string> = {
  "full-bleed": "logo fills the entire frame edge to edge, bold full-bleed composition, dominant typography",
  "theatrical": "cinematic widescreen with black letterbox bars, movie poster composition, 2.39:1 aspect feel",
  "minimal":    "minimalist design, small refined logo centered on vast dark negative space, sparse and elegant",
};

const treatmentMotion: Record<Treatment, string> = {
  "full-bleed": "logo dramatically fills the entire frame with bold presence",
  "theatrical": "cinematic widescreen reveal, black bars frame the sequence, movie-trailer energy",
  "minimal":    "subtle restrained reveal, logo surfaces quietly from deep darkness",
};

export interface GenerationParams {
  name: string;
  style: Style;
  tagline?: string;
  duration: Duration;
  videoModel?: VideoModel;
  treatment?: Treatment;
  primaryColor?: string;
  customNotes?: string;
  audio?: boolean;
}

export interface PromptPreview {
  imagePrompt: string;
  videoPrompt: string;
}

export function buildPrompts(params: GenerationParams): PromptPreview {
  const { name, style, tagline, treatment = "full-bleed", primaryColor, customNotes } = params;
  const upper = name.toUpperCase();
  const taglinePart = tagline?.trim()
    ? `, subtitle text "${tagline.trim().toUpperCase()}" below`
    : "";
  const colorPart = primaryColor ? `, key accent color: ${primaryColor}` : "";
  const notesPart = customNotes?.trim() ? `, ${customNotes.trim()}` : "";

  const imagePrompt = `Streaming service logo for "${upper}"${taglinePart}, ${treatmentImage[treatment]}, bold dramatic typography, ${styleDescriptions[style]}, professional logo design, no people${colorPart}${notesPart}`;
  const videoPrompt = `The ${upper} streaming service logo animates: ${styleMotion[style]}. ${treatmentMotion[treatment]}. Dramatic, high-quality intro video.${notesPart}`;

  return { imagePrompt, videoPrompt };
}

export async function generateLogoImage(params: GenerationParams, apiKey: string): Promise<string> {
  const { imagePrompt } = buildPrompts(params);

  const task = await getClient(apiKey).textToImage
    .create({
      model: "gen4_image",
      promptText: imagePrompt,
      ratio: "1920:1080",
    })
    .waitForTaskOutput({ timeout: 270_000 });

  if (!task.output?.[0]) throw new Error("Image generation produced no output");
  return task.output[0];
}

export async function generateIntroVideo(
  imageUrl: string,
  params: GenerationParams,
  apiKey: string
): Promise<string> {
  const { videoPrompt } = buildPrompts(params);
  const model = params.videoModel ?? "gen4_turbo";

  const isVeoModel = model === "veo3" || model === "veo3.1" || model === "veo3.1_fast";
  const hasNoDuration = model === "gen4.5";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createParams: Record<string, any> = {
    model,
    promptImage: imageUrl,
    promptText: videoPrompt,
    ratio: "1280:720",
  };
  if (!hasNoDuration) createParams.duration = params.duration;
  if (isVeoModel && params.audio) createParams.audio = true;

  const task = await getClient(apiKey).imageToVideo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .create(createParams as any)
    .waitForTaskOutput({ timeout: 270_000 });

  if (!task.output?.[0]) throw new Error("Video generation produced no output");
  return task.output[0];
}
