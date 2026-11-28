/** Why a generation failed, in buckets the UI and analytics can act on. */
export type ErrorKind =
  | "auth"
  | "credits"
  | "rate_limit"
  | "moderation"
  | "timeout"
  | "runway_failed"
  | "network"
  | "other";

// Each visitor brings their own Runway key, so an empty balance is theirs to top up.
// The result panel matches on it to offer an "Add credits" link.
export const OUT_OF_CREDITS_MESSAGE =
  "Runway refused this because your Runway account has no credits left. Add credits on the Billing tab at dev.runway.com (the minimum is $10), then try again.";

/** Where in the run it failed. */
export type GenerationStage = "image" | "regenerate" | "video" | "poster" | "canvas";

/** The JSON an API route sends with a failure status. */
export interface ApiErrorBody {
  error: string;
  kind: ErrorKind;
  /** Runway's task failureCode, when Runway gave one. */
  code?: string;
}

export function kindForHttpStatus(status: number): ErrorKind {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";
  if (status === 408 || status === 504) return "timeout";
  return "other";
}

// Runway's task failure codes: https://docs.dev.runwayml.com/errors/task-failures/
export function kindForFailureCode(code: string | null | undefined): ErrorKind {
  if (code && /(^|\.)SAFETY(\.|$)/.test(code)) return "moderation";
  return "runway_failed";
}

/** A failure that already knows its kind (and HTTP status and Runway code, when there was one). */
export class GenerationError extends Error {
  readonly kind: ErrorKind;
  readonly status: number | undefined;
  readonly code: string | undefined;
  readonly stage: GenerationStage | undefined;

  constructor(
    message: string,
    { kind, status, code, stage }: { kind: ErrorKind; status?: number; code?: string | null; stage?: GenerationStage },
  ) {
    super(message);
    this.name = "GenerationError";
    this.kind = kind;
    this.status = status;
    this.code = code ?? undefined;
    this.stage = stage;
  }
}

/**
 * Parses an API route's JSON response, or throws a GenerationError carrying the route's kind and code.
 * A body that isn't JSON (a platform timeout page, say) is classified from the HTTP status alone.
 */
export async function readApiJson<T>(res: Response, fallbackMessage: string): Promise<T> {
  const data: unknown = await res.json().catch(() => null);
  if (res.ok && data !== null) return data as T;
  const body = (data ?? {}) as Partial<ApiErrorBody>;
  throw new GenerationError(body.error ?? `${fallbackMessage} (HTTP ${res.status})`, {
    kind: body.kind ?? kindForHttpStatus(res.status),
    status: res.status,
    code: body.code ?? null,
  });
}

/** Plausible props for a Generation Error event. Never includes the message, which can quote the prompt. */
export function generationErrorProps(
  error: unknown,
  stage: GenerationStage,
  models: { imageModel: string; videoModel: string },
): Record<string, string> {
  const known = error instanceof GenerationError ? error : null;
  // fetch() rejects with a TypeError when the request never reached the server.
  const kind: ErrorKind = known?.kind ?? (error instanceof TypeError ? "network" : "other");
  return {
    stage: known?.stage ?? stage,
    kind,
    status: known?.status === undefined ? "none" : String(known.status),
    code: known?.code ?? "none",
    image_model: models.imageModel,
    video_model: models.videoModel,
  };
}
