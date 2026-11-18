import type { Duration, ImageModel, Style, Treatment, VideoModel } from "./runway";
import { CANVAS_STYLES } from "./styles";

const DURATIONS: { value: Duration; label: string; est: string }[] = [
  { value: 2,  label: "2s",  est: "~20 sec" },
  { value: 4,  label: "4s",  est: "~30 sec" },
  { value: 5,  label: "5s",  est: "~35 sec" },
  { value: 10, label: "10s", est: "~60 sec" },
];

const VEO_DURATIONS: { value: Duration; label: string; est: string }[] = [
  { value: 4, label: "4s", est: "~45 sec" },
  { value: 6, label: "6s", est: "~60 sec" },
  { value: 8, label: "8s", est: "~75 sec" },
];

// Credit prices from https://docs.dev.runwayml.com/guides/pricing/ at the size and quality this app requests
// (lib/runway.ts imageRatio): gen4_image at 1080p, gpt_image_2 at its default high quality and 1K/2K size, gemini_image3_pro at 1K.
export const IMAGE_MODELS: { id: ImageModel; label: string; group: "Runway" | "OpenAI" | "Google"; crCost: number; desc: string }[] = [
  { id: "gen4_image",        label: "Gen4 Image",         group: "Runway",  crCost: 8,  desc: "Creative, artistic style" },
  { id: "gen4_image_turbo",  label: "Gen4 Turbo",         group: "Runway",  crCost: 2,  desc: "Faster, great quality" },
  { id: "gpt_image_2",       label: "GPT Image 2",        group: "OpenAI",  crCost: 20, desc: "Precise instruction-following" },
  { id: "gemini_image3_pro", label: "Gemini Image 3 Pro", group: "Google",  crCost: 20, desc: "Vivid, instruction-aware" },
  { id: "gemini_2.5_flash",  label: "Gemini 2.5 Flash",   group: "Google",  crCost: 5,  desc: "Fast, Google quality" },
];

// Credits per second from https://docs.dev.runwayml.com/guides/pricing/. Veo charges more when it also generates audio.
export const VIDEO_MODELS: { id: VideoModel; label: string; group: "Runway" | "Google"; crPerSec: number; crPerSecWithAudio?: number; desc: string }[] = [
  { id: "gen4_turbo",  label: "Gen4 Turbo",  group: "Runway", crPerSec: 5,  desc: "Fast, great quality" },
  { id: "gen4.5",      label: "Gen4.5",       group: "Runway", crPerSec: 12, desc: "Highest quality" },
  { id: "veo3.1",      label: "Veo 3.1",      group: "Google", crPerSec: 20, crPerSecWithAudio: 40, desc: "Google latest" },
  { id: "veo3.1_fast", label: "Veo 3.1 Fast", group: "Google", crPerSec: 10, crPerSecWithAudio: 15, desc: "Fast Google model" },
];

export const TREATMENTS: { id: Treatment; label: string; desc: string }[] = [
  { id: "full-bleed",  label: "Full Bleed",  desc: "Logo fills the frame" },
  { id: "theatrical",  label: "Theatrical",  desc: "Black letterbox bars" },
  { id: "minimal",     label: "Minimal",     desc: "Small logo, vast space" },
];

export const COLOR_SWATCHES = [
  { label: "Gold",    value: "#F59E0B" },
  { label: "Crimson", value: "#EF4444" },
  { label: "Blue",    value: "#3B82F6" },
  { label: "Purple",  value: "#8B5CF6" },
  { label: "Cyan",    value: "#06B6D4" },
  { label: "Green",   value: "#22C55E" },
  { label: "Pink",    value: "#EC4899" },
  { label: "White",   value: "#F9FAFB" },
];

export function isVeoModel(model: VideoModel): model is "veo3.1" | "veo3.1_fast" {
  return model === "veo3.1" || model === "veo3.1_fast";
}

/** The clip lengths a video model offers. */
export function durationsFor(model: VideoModel) {
  return isVeoModel(model) ? VEO_DURATIONS : DURATIONS;
}

/** Keeps the chosen length when the new model offers it; otherwise that model's default (Veo 4s, Runway 5s). */
export function durationForModel(model: VideoModel, current: Duration): Duration {
  if (durationsFor(model).some((d) => d.value === current)) return current;
  return isVeoModel(model) ? 4 : 5;
}

/** Credits per second of video; `audio` only changes the price on models that can generate it (Veo). */
export function videoCreditsPerSecond(model: VideoModel, audio: boolean): number {
  const row = VIDEO_MODELS.find((m) => m.id === model);
  if (!row) throw new Error(`Unknown video model: ${model}`);
  return audio ? (row.crPerSecWithAudio ?? row.crPerSec) : row.crPerSec;
}

/** Credits for the title card: canvas styles are drawn in the browser and cost nothing. */
export function imageCreditCost(style: Style, model: ImageModel): number {
  if (CANVAS_STYLES.has(style)) return 0;
  const row = IMAGE_MODELS.find((m) => m.id === model);
  if (!row) throw new Error(`Unknown image model: ${model}`);
  return row.crCost;
}
