import { NextResponse } from "next/server";
import { APIConnectionError, APIConnectionTimeoutError, APIError, TaskFailedError, TaskTimedOutError } from "@runwayml/sdk";
import { kindForFailureCode, kindForHttpStatus, type ApiErrorBody, type ErrorKind } from "./generationError";

interface ClassifiedError extends ApiErrorBody {
  status: number;
}

// Each visitor brings their own Runway key, so an empty balance is theirs to top up.
export const OUT_OF_CREDITS_MESSAGE =
  "Runway refused this because your Runway account has no credits left. Add credits on the Billing tab at dev.runway.com (the minimum is $10), then try again.";

function runwayErrorText(body: unknown): string | undefined {
  const text = (body as { error?: unknown } | null | undefined)?.error;
  return typeof text === "string" && text.trim() ? text : undefined;
}

/**
 * Maps a Runway SDK error to the HTTP status and kind our API returns: Runway's own 4xx passes through,
 * an upstream outage is 502, a timeout is 504, and a moderation rejection is 422.
 */
export function classifyRunwayError(e: unknown, fallbackMessage: string): ClassifiedError {
  const error = e instanceof Error ? e.message : fallbackMessage;

  if (e instanceof TaskFailedError) {
    const code = e.taskDetails.status === "FAILED" ? e.taskDetails.failureCode ?? undefined : undefined;
    const kind = kindForFailureCode(code);
    return { status: kind === "moderation" ? 422 : 502, kind, error: code ? `${error} (${code})` : error, ...(code ? { code } : {}) };
  }
  if (e instanceof TaskTimedOutError || e instanceof APIConnectionTimeoutError) {
    return { status: 504, kind: "timeout", error };
  }
  if (e instanceof APIConnectionError) return { status: 502, kind: "network", error };
  if (e instanceof APIError && e.status !== undefined) {
    // Runway's error body is {"error": "...", "docUrl": "..."} (https://docs.dev.runwayml.com/errors/errors/).
    // The SDK only looks for a `message` field, so e.message is the status plus the raw JSON; use Runway's own text.
    const runwayMessage = runwayErrorText(e.error) ?? error;
    // Runway reports an empty balance as a 400: "You do not have enough credits to run this task."
    const credits = /credit/i.test(runwayMessage) && e.status < 500;
    const kind: ErrorKind = credits ? "credits" : kindForHttpStatus(e.status);
    // Runway's 502/503 mean it is shedding load; we pass that on as a bad gateway, keeping 504 as a timeout.
    return {
      status: e.status === 504 ? 504 : e.status >= 500 ? 502 : e.status,
      kind,
      error: credits ? OUT_OF_CREDITS_MESSAGE : runwayMessage,
    };
  }
  return { status: 500, kind: "other", error };
}

export function runwayErrorResponse(e: unknown, fallbackMessage: string) {
  const { status, ...body } = classifyRunwayError(e, fallbackMessage);
  return NextResponse.json(body, { status });
}
