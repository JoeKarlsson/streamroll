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
export type ImageModel = "gen4_image" | "gen4_image_turbo" | "gpt_image_2" | "gemini_image3_pro" | "gemini_2.5_flash";
export type Treatment = "full-bleed" | "theatrical" | "minimal";

export function imageRatio(model: ImageModel): string {
  if (model === "gpt_image_2") return "1920:1088";
  if (model === "gemini_image3_pro" || model === "gemini_2.5_flash") return "1344:768";
  return "1920:1080";
}

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
    "bold crimson red wordmark — vivid saturated red (#E50914) primary faces with dark maroon shadow sides giving the letterforms subtle dimensional depth, clean geometric sans-serif, logo centered with generous negative space on all sides, premium streaming service identity",
};

// Motion descriptions use positive phrasing only — no "don't/no/never".
// Structure: logo entrance/animation → environment animates → camera motion → style.
const styleMotion: Record<Style, string> = {
  cinematic:
    "The logo pulses with a slow golden breath — warm light swells across the letterforms, brightening and dimming. Golden light particles drift upward around the glowing text. Atmospheric haze rolls slowly across the dark background. A subtle lens flare blooms from the right edge. Camera pushes slowly forward — slow dolly in. Cinematic, dramatic.",

  retro:
    "The logo flickers on like a neon sign — letterforms light up with intensity variations and electric buzz. A horizontal scanline sweep passes over the frame. Neon edge-glow pulses rhythmically around the letterforms. Electric sparks radiate from the corners of the text. CRT vignette pulses at the edges. Camera holds completely static. 80s synthwave.",

  futuristic:
    "The logo glitches and assembles — chromatic aberration ripples through the letterforms as they snap to clarity with a digital burst. Holographic scan lines sweep over the composition. Bright cyan particles radiate outward from the letterforms and drift away. Camera holds completely static. Sci-fi, sleek.",

  minimal:
    "The logo shimmers softly — a single white light sweep travels left to right across the letterforms, brightening them gently as it passes. The text pulses with a barely perceptible warmth. Gentle shadows at the edges. Camera holds completely static. Clean, minimal, unhurried.",

  horror:
    "The logo flickers and breathes — candleflicker lighting pulses across the letterforms with eerie warmth variations. Deep red smoke curls upward from the base of the frame. A creeping shadow vignette closes slowly inward from all four edges. Camera holds completely static. Gothic, eerie, atmospheric.",

  anime:
    "The logo blazes into frame — letterforms emerge from a brilliant burst of light with dramatic speed lines radiating outward. Cherry blossom petals swirl in a spiral vortex around the glowing animated text. The text shimmers with vivid energy. Camera holds completely static. Vivid, high-energy.",

  epic:
    "The logo rises into frame from below as if cresting a ridge — letterforms scale up and settle center. A golden sunburst erupts from directly behind the text, warm light intensifies and spreads outward. Dust and debris blast outward from around the text and drift into the foreground. Camera eases into a very slow dolly in. Bronze and amber tones. Cinematic widescreen.",

  nature:
    "The logo drifts softly into center frame, gently swaying as if carried by a breeze, then settles. Golden morning light washes slowly left to right across the letterforms. A few leaf particles drift lazily past the foreground. Soft atmospheric haze drifts in the background. Camera holds completely static. Organic, peaceful, documentary.",

  prestige:
    "The logo snaps into view — letterforms crisp, bold, vivid red with a pulse of light. One explosive visual beat: thin vertical bands of deep crimson and dark maroon burst outward from behind the letterforms simultaneously left and right — ribbons of color shooting to the edges of the frame, filling the full width in under one second. The bands hold for a half-beat, then dissolve away. Logo pulses with a final glow. Camera holds completely static throughout.",
};

// Gen4.5 supports timestamp-based sequencing for tighter control over pacing.
const styleMotionGen45: Record<Style, string> = {
  cinematic:
    "[00:00] Logo pulses with a slow golden breath — warm light swells across the letterforms. [00:01] Golden light particles drift upward around the glowing text. Atmospheric haze rolls across the dark background. [00:02] Subtle lens flare blooms from the right edge. Camera begins a slow dolly in. [00:04] Scene settles — logo warm and glowing, camera eases to rest. Cinematic, dramatic.",

  retro:
    "[00:00] Logo flickers on like a neon sign — letterforms light up with intensity variations and electric buzz. [00:01] Horizontal scanline sweep passes over the frame top to bottom. Neon edge-glow pulses rhythmically around the letterforms. [00:02] Electric sparks radiate from the corners of the text. CRT vignette pulses at the edges. [00:04] Scene settles — logo neon-bright and glowing. Camera completely static throughout. 80s synthwave.",

  futuristic:
    "[00:00] Logo glitches and assembles — chromatic aberration ripples through the letterforms as they snap to clarity. [00:01] Holographic scan lines sweep over the composition. Digital glitch burst then settles. [00:02] Cyan particles radiate outward from the letterforms. [00:04] Particles drift away — logo sharp and vivid. Camera completely static throughout. Sci-fi, sleek.",

  minimal:
    "[00:00] Logo shimmers softly — soft white light sweep enters from the left. [00:01] Light travels slowly right — letterforms brighten gently as it passes. [00:03] Light sweep exits frame right. Subtle warmth lingers on the letterforms. [00:05] Scene holds — logo softly illuminated. Camera completely static throughout.",

  horror:
    "[00:00] Logo flickers and breathes — candleflicker lighting pulses across the letterforms with eerie warmth variations. [00:01] Deep red smoke curls upward from the base of the frame. [00:02] Creeping shadow vignette begins closing inward from all four edges. [00:04] Vignette tightens — logo flickers through the darkness. Camera completely static throughout. Gothic, eerie.",

  anime:
    "[00:00] Logo blazes into frame — letterforms emerge from a burst of brilliant light. [00:01] Cherry blossom petals swirl in a spiral vortex around the glowing animated text. Speed lines radiate outward. [00:02] Flash ignites from behind the text and expands outward. [00:03] Flash settles — logo bold, sharp, glowing. [00:04] Scene holds. Camera completely static throughout.",

  epic:
    "[00:00] Logo rises into frame from below — letterforms scale up and settle center. [00:01] Golden sunburst erupts from directly behind the text — warm light intensifies and spreads. [00:02] Dust and debris blast outward and drift into the foreground. [00:03] Camera begins a very slow dolly in. [00:05] Scene settles — logo large, powerful, sharp. Bronze and amber tones.",

  nature:
    "[00:00] Logo drifts softly into center frame, gently swaying then settling. [00:01] Golden morning light enters from the left, washes slowly right across the letterforms. [00:02] Leaf particles drift lazily past the foreground. Soft atmospheric haze in the background. [00:04] Light settles — logo warm and grounded. Camera completely static throughout. Organic, peaceful.",

  prestige:
    "[00:00] Logo snaps into view — letterforms crisp, bold, vivid red with a pulse of light. [00:01] Explosive beat: thin vertical bands of deep crimson and dark maroon burst outward from behind the letterforms simultaneously left and right — ribbons of color shoot to the edges of the frame. [00:02] Color bands fill the full width of the frame. [00:03] Bands dissolve away. [00:04] Logo pulses with a final glow, then holds clean and sharp. Camera completely static throughout.",
};

const styleBackground: Record<Style, string> = {
  cinematic:  "Background: deep dark navy, almost black.",
  retro:      "Background: very dark, near-black with subtle grid.",
  futuristic: "Background: space black, pure dark.",
  minimal:    "Background: clean soft white or very light grey.",
  horror:     "Background: pitch black.",
  anime:      "Background: soft light pastel.",
  epic:       "Background: dark warm amber-black.",
  nature:     "Background: deep dark natural green-black.",
  prestige:   "",
};

const treatmentImage: Record<Treatment, string> = {
  "full-bleed": "logo fills the entire frame edge to edge, bold full-bleed composition, dominant typography",
  "theatrical": "cinematic widescreen with black letterbox bars, movie poster composition, 2.39:1 aspect feel",
  "minimal":    "minimalist design, small refined logo centered on vast dark negative space, sparse and elegant",
};

const treatmentMotion: Record<Treatment, string> = {
  "full-bleed": "Logo fills the frame with bold presence.",
  "theatrical": "Black letterbox bars frame the composition. Cinematic widescreen energy.",
  "minimal":    "Logo surfaces quietly from deep darkness, restrained and elegant.",
};

export interface GenerationParams {
  name: string;
  style: Style;
  tagline?: string;
  duration: Duration;
  imageModel?: ImageModel;
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
  const { name, style, tagline, treatment = "full-bleed", primaryColor, customNotes, videoModel } = params;
  const upper = name.toUpperCase();
  const taglinePart = tagline?.trim()
    ? `, subtitle text "${tagline.trim().toUpperCase()}" below`
    : "";
  const colorPart = primaryColor ? `, key accent color: ${primaryColor}` : "";
  const notesPart = customNotes?.trim() ? `. ${customNotes.trim()}` : "";

  const bg = styleBackground[style] ? `${styleBackground[style]} ` : "";
  const imagePrompt = `${bg}Streaming service logo for "${upper}"${taglinePart}, ${treatmentImage[treatment]}, bold dramatic typography, ${styleDescriptions[style]}, professional logo design, no people${colorPart}${notesPart}`;

  // Gen4.5 supports timestamp-based sequencing — use the more precise version.
  const isGen45 = videoModel === "gen4.5";
  const motion = isGen45 ? styleMotionGen45[style] : styleMotion[style];

  // Positive-phrasing only — no "don't/no/never" (models ignore or invert negatives).
  // Structure: subject stillness declared first, then background animation, then camera.
  const videoPrompt = `The ${upper} streaming service logo is centered in frame. ${motion} ${treatmentMotion[treatment]} Logo text stays sharp and fully legible throughout. Animation begins immediately.${notesPart}`;

  return { imagePrompt, videoPrompt };
}

export async function generateLogoImage(params: GenerationParams, apiKey: string, imagePromptOverride?: string): Promise<string> {
  const { imagePrompt: generatedPrompt } = buildPrompts(params);
  const imagePrompt = imagePromptOverride ?? generatedPrompt;
  const imageModel = params.imageModel ?? "gen4_image";

  const ratio = imageRatio(imageModel);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createParams: Record<string, any> = imageModel === "gpt_image_2"
    ? { model: "gpt_image_2", promptText: imagePrompt, ratio, background: "opaque" }
    : { model: imageModel,    promptText: imagePrompt, ratio };

  const task = await getClient(apiKey).textToImage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .create(createParams as any)
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createParams: Record<string, any> = {
    model,
    promptImage: imageUrl,
    promptText: videoPrompt,
    ratio: "1280:720",
    duration: params.duration,
  };
  if (isVeoModel && params.audio) createParams.audio = true;

  const task = await getClient(apiKey).imageToVideo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .create(createParams as any)
    .waitForTaskOutput({ timeout: 270_000 });

  if (!task.output?.[0]) throw new Error("Video generation produced no output");
  return task.output[0];
}
