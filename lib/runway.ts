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
  | "nature";

export type Duration = 2 | 5 | 10;

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
};

export interface GenerationParams {
  name: string;
  style: Style;
  tagline?: string;
  duration: Duration;
}

export interface PromptPreview {
  imagePrompt: string;
  videoPrompt: string;
}

export function buildPrompts(params: GenerationParams): PromptPreview {
  const { name, style, tagline } = params;
  const upper = name.toUpperCase();
  const taglinePart = tagline?.trim()
    ? `, subtitle text "${tagline.trim().toUpperCase()}" below`
    : "";

  const imagePrompt = `Streaming service logo for "${upper}"${taglinePart}, bold dramatic typography, ${styleDescriptions[style]}, professional logo design, no people, centered composition`;
  const videoPrompt = `The ${upper} streaming service logo animates: ${styleMotion[style]}. Dramatic, high-quality intro video.`;

  return { imagePrompt, videoPrompt };
}

export async function generateLogoImage(params: GenerationParams, apiKey: string): Promise<string> {
  const { imagePrompt } = buildPrompts(params);

  // Use 1920:1080 for a sharp 1080p logo image
  const task = await getClient(apiKey).textToImage
    .create({
      model: "gen4_image",
      promptText: imagePrompt,
      ratio: "1920:1080",
    })
    .waitForTaskOutput({ timeout: 120_000 });

  if (!task.output?.[0]) throw new Error("Image generation produced no output");
  return task.output[0];
}

export async function generateIntroVideo(
  imageUrl: string,
  params: GenerationParams,
  apiKey: string
): Promise<string> {
  const { videoPrompt } = buildPrompts(params);

  // gen4_turbo max widescreen is 1280:720, still great on TV via Plex
  const task = await getClient(apiKey).imageToVideo
    .create({
      model: "gen4_turbo",
      promptImage: imageUrl,
      promptText: videoPrompt,
      ratio: "1280:720",
      duration: params.duration,
    })
    .waitForTaskOutput({ timeout: 120_000 });

  if (!task.output?.[0]) throw new Error("Video generation produced no output");
  return task.output[0];
}
