import { NextResponse } from "next/server";
import { APIConnectionError, APIConnectionTimeoutError, APIError, TaskFailedError, TaskTimedOutError } from "@runwayml/sdk";
import { kindForFailureCode, kindForHttpStatus, type ApiErrorBody, type ErrorKind } from "./generationError";

interface ClassifiedError extends ApiErrorBody {
  status: number;
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
    // Runway reports an empty balance as a 400 whose message talks about credits.
    const kind: ErrorKind = /credit/i.test(error) && e.status < 500 ? "credits" : kindForHttpStatus(e.status);
    // Runway's 502/503 mean it is shedding load; we pass that on as a bad gateway, keeping 504 as a timeout.
    return { status: e.status === 504 ? 504 : e.status >= 500 ? 502 : e.status, kind, error };
  }
  return { status: 500, kind: "other", error };
}

export function runwayErrorResponse(e: unknown, fallbackMessage: string) {
  const { status, ...body } = classifyRunwayError(e, fallbackMessage);
  return NextResponse.json(body, { status });
}
