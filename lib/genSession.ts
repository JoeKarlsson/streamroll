import type { Duration, ImageModel, Style, Treatment, VideoModel } from "./runway";
import { STYLE_COLOR } from "./styles";
import { IMAGE_MODELS, TREATMENTS, VIDEO_MODELS } from "./models";

export type GenStep = "idle" | "image" | "review" | "video" | "done" | "error";

// A finished, failed or in-review generation survives navigation in sessionStorage under this key.
export const GEN_SESSION_KEY = "streamroll_gen_state";

export type SavedGeneration = {
  step: "done" | "error" | "review";
  imageUrl?: string | null;
  videoUrl?: string | null;
  timings?: { image: number; video: number } | null;
  error?: string | null;
  name?: string | undefined;
  style?: Style | undefined;
  tagline?: string | undefined;
  videoModel?: VideoModel | undefined;
  imageModel?: ImageModel | undefined;
  treatment?: Treatment | undefined;
  duration?: Duration | undefined;
};

export function isSavedStep(step: GenStep): step is SavedGeneration["step"] {
  return step === "done" || step === "error" || step === "review";
}

/** The saved generation, or null when there is none worth restoring (nothing saved, unreadable, or mid-run). */
export function parseSavedGeneration(raw: string | null): SavedGeneration | null {
  if (!raw) return null;
  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    // Corrupt or hand-edited storage: start fresh rather than fail the page.
    return null;
  }
  if (typeof saved !== "object" || saved === null) return null;
  const { step } = saved as { step?: unknown };
  if (step !== "done" && step !== "error" && step !== "review") return null;
  // Saved by another version, a choice may no longer exist: drop it and keep the default rather than fail to render.
  const { style, imageModel, videoModel, treatment } = saved as Record<string, unknown>;
  return {
    ...(saved as SavedGeneration),
    style: known(style, Object.keys(STYLE_COLOR) as Style[]),
    imageModel: known(imageModel, IMAGE_MODELS.map((m) => m.id)),
    videoModel: known(videoModel, VIDEO_MODELS.map((m) => m.id)),
    treatment: known(treatment, TREATMENTS.map((t) => t.id)),
  };
}

function known<T>(value: unknown, allowed: readonly T[]): T | undefined {
  return allowed.find((option) => option === value);
}
