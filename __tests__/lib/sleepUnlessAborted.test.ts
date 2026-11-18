import { describe, it, expect, vi, afterEach } from "vitest";
import { sleepUnlessAborted } from "@/lib/sleepUnlessAborted";

describe("sleepUnlessAborted", () => {
  afterEach(() => { vi.useRealTimers(); });

  it("resolves after the full wait when nobody aborts", async () => {
    vi.useFakeTimers();
    let done = false;
    sleepUnlessAborted(8000, new AbortController().signal).then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(7999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toBe(true);
  });

  it("resolves at once when the signal aborts mid-wait", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    let done = false;
    sleepUnlessAborted(8000, controller.signal).then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(100);
    controller.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(true);
  });

  it("resolves at once when the signal was already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(sleepUnlessAborted(60_000, controller.signal)).resolves.toBeUndefined();
  });
});
