import type { Duration, ImageModel, Style, Treatment, VideoModel } from "./runway";

export type GenStep = "idle" | "image" | "review" | "video" | "done" | "error";

// A finished, failed or in-review generation survives navigation in sessionStorage under this key.
export const GEN_SESSION_KEY = "streamroll_gen_state";

export type SavedGeneration = {
  step: "done" | "error" | "review";
  imageUrl?: string | null;
  videoUrl?: string | null;
  timings?: { image: number; video: number } | null;
  error?: string | null;
  name?: string;
  style?: Style;
  tagline?: string;
  videoModel?: VideoModel;
  imageModel?: ImageModel;
  treatment?: Treatment;
  duration?: Duration;
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
  return saved as SavedGeneration;
}
