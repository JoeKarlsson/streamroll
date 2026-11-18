import type { Duration, ImageModel, Style, Treatment, VideoModel } from "./runway";
import { CANVAS_STYLES } from "./styles";

export const DURATIONS: { value: Duration; label: string; est: string }[] = [
  { value: 2,  label: "2s",  est: "~20 sec" },
  { value: 4,  label: "4s",  est: "~30 sec" },
  { value: 5,  label: "5s",  est: "~35 sec" },
  { value: 10, label: "10s", est: "~60 sec" },
];

export const VEO_DURATIONS: { value: Duration; label: string; est: string }[] = [
  { value: 4, label: "4s", est: "~45 sec" },
  { value: 6, label: "6s", est: "~60 sec" },
  { value: 8, label: "8s", est: "~75 sec" },
];

export const IMAGE_MODELS: { id: ImageModel; label: string; group: "Runway" | "OpenAI" | "Google"; crInfo: string; crCost: number; desc: string }[] = [
  { id: "gen4_image",        label: "Gen4 Image",         group: "Runway",  crInfo: "~30 cr",  crCost: 30, desc: "Creative, artistic style" },
  { id: "gen4_image_turbo",  label: "Gen4 Turbo",         group: "Runway",  crInfo: "~15 cr",  crCost: 15, desc: "Faster, great quality" },
  { id: "gpt_image_2",       label: "GPT Image 2",        group: "OpenAI",  crInfo: "~40 cr",  crCost: 40, desc: "Precise instruction-following" },
  { id: "gemini_image3_pro", label: "Gemini Image 3 Pro", group: "Google",  crInfo: "~20 cr",  crCost: 20, desc: "Vivid, instruction-aware" },
  { id: "gemini_2.5_flash",  label: "Gemini 2.5 Flash",   group: "Google",  crInfo: "~10 cr",  crCost: 10, desc: "Fast, Google quality" },
];

export const VIDEO_MODELS: { id: VideoModel; label: string; group: "Runway" | "Google"; crInfo: string; crPerSec: number; desc: string }[] = [
  { id: "gen4_turbo",  label: "Gen4 Turbo",  group: "Runway", crInfo: "5 cr/s",   crPerSec: 5,  desc: "Fast, great quality" },
  { id: "gen4.5",      label: "Gen4.5",       group: "Runway", crInfo: "12 cr/s",  crPerSec: 12, desc: "Highest quality" },
  { id: "gen3a_turbo", label: "Gen3a Turbo",  group: "Runway", crInfo: "5 cr/s",   crPerSec: 5,  desc: "Previous generation" },
  { id: "veo3",        label: "Veo 3",        group: "Google", crInfo: "~25 cr/s", crPerSec: 25, desc: "Google video model" },
  { id: "veo3.1",      label: "Veo 3.1",      group: "Google", crInfo: "~25 cr/s", crPerSec: 25, desc: "Google latest" },
  { id: "veo3.1_fast", label: "Veo 3.1 Fast", group: "Google", crInfo: "~15 cr/s", crPerSec: 15, desc: "Fast Google model" },
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

export function isVeoModel(model: VideoModel): boolean {
  return model === "veo3" || model === "veo3.1" || model === "veo3.1_fast";
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

export function videoCreditsPerSecond(model: VideoModel): number {
  const row = VIDEO_MODELS.find((m) => m.id === model);
  if (!row) throw new Error(`Unknown video model: ${model}`);
  return row.crPerSec;
}

/** Credits for the title card: canvas styles are drawn in the browser and cost nothing. */
export function imageCreditCost(style: Style, model: ImageModel): number {
  if (CANVAS_STYLES.has(style)) return 0;
  const row = IMAGE_MODELS.find((m) => m.id === model);
  if (!row) throw new Error(`Unknown image model: ${model}`);
  return row.crCost;
}
