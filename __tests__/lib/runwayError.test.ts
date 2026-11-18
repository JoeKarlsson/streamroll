import { describe, it, expect } from "vitest";
import {
  APIConnectionError, APIConnectionTimeoutError, APIError, TaskFailedError, TaskTimedOutError,
} from "@runwayml/sdk";
import { classifyRunwayError } from "@/lib/runwayError";

const apiError = (status: number, message: string) => APIError.generate(status, { error: message }, message, new Headers());
const failedTask = (failureCode?: string) =>
  new TaskFailedError({ id: "t1", status: "FAILED", createdAt: "", failure: "Task failed", failureCode } as never);

describe("classifyRunwayError", () => {
  it.each([
    ["an invalid key (401)", apiError(401, "Invalid API key"), 401, "auth"],
    ["an empty balance (400 about credits)", apiError(400, "You do not have enough credits to run this task."), 400, "credits"],
    ["any other 400", apiError(400, "promptText is too long"), 400, "other"],
    ["a rate limit (429)", apiError(429, "Too many requests"), 429, "rate_limit"],
    ["Runway shedding load (503)", apiError(503, "Service unavailable"), 502, "other"],
    ["Runway overloaded (504)", apiError(504, "Gateway timeout"), 504, "timeout"],
    ["a request timeout", new APIConnectionTimeoutError(), 504, "timeout"],
    ["a task that outlived its wait", new TaskTimedOutError({ id: "t1", status: "RUNNING" } as never), 504, "timeout"],
    ["an unreachable Runway", new APIConnectionError({ message: "ECONNRESET" }), 502, "network"],
    ["a task moderation rejected", failedTask("SAFETY.INPUT.TEXT"), 422, "moderation"],
    ["a prompt moderation rejected in preprocessing", failedTask("INPUT_PREPROCESSING.SAFETY.TEXT"), 422, "moderation"],
    ["a task with a bad output", failedTask("INTERNAL.BAD_OUTPUT.CODE01"), 502, "runway_failed"],
    ["a task failed without a code", failedTask(), 502, "runway_failed"],
    ["an unknown error", new Error("boom"), 500, "other"],
  ])("maps %s to HTTP %i, kind %s", (_label, error, status, kind) => {
    expect(classifyRunwayError(error, "fallback")).toMatchObject({ status, kind });
  });

  it("carries the failure code in its own field and in the message", () => {
    expect(classifyRunwayError(failedTask("ASSET.INVALID"), "fallback")).toEqual({
      status: 502, kind: "runway_failed", code: "ASSET.INVALID", error: "Task failed (ASSET.INVALID)",
    });
  });
});
