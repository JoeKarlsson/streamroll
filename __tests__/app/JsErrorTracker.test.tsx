import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { JsErrorTracker, jsErrorMessage } from "@/app/JsErrorTracker";

describe("JsErrorTracker", () => {
  afterEach(() => {
    delete (window as Window & { plausible?: unknown }).plausible;
  });

  it("sends uncaught errors to Plausible as JS Error", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(<JsErrorTracker />);
    window.dispatchEvent(new ErrorEvent("error", { error: new Error("boom"), message: "Uncaught Error: boom" }));
    expect(plausible).toHaveBeenCalledWith("JS Error", { props: { message: "boom" } });
  });

  it("sends unhandled rejections to Plausible as JS Error", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(<JsErrorTracker />);
    const event = new Event("unhandledrejection") as PromiseRejectionEvent;
    Object.defineProperty(event, "reason", { value: "network down" });
    window.dispatchEvent(event);
    expect(plausible).toHaveBeenCalledWith("JS Error", { props: { message: "network down" } });
  });

  it("truncates the message to 200 characters", () => {
    const event = new ErrorEvent("error", { message: "x".repeat(500) });
    expect(jsErrorMessage(event)).toHaveLength(200);
  });
});
