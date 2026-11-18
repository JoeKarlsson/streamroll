import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { JsErrorTracker, jsErrorMessage } from "@/app/_components/JsErrorTracker";

function rejection(reason: unknown) {
  const event = new Event("unhandledrejection") as PromiseRejectionEvent;
  Object.defineProperty(event, "reason", { value: reason });
  return event;
}

describe("JsErrorTracker", () => {
  afterEach(() => {
    delete (window as Window & { plausible?: unknown }).plausible;
  });

  it("sends an uncaught error with its message, source and path", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(<JsErrorTracker />);
    window.dispatchEvent(new ErrorEvent("error", { error: new Error("boom"), filename: "https://streamroll.vercel.app/_next/app.js" }));
    expect(plausible).toHaveBeenCalledWith("JS Error", {
      props: { message: "boom", source: "https://streamroll.vercel.app/_next/app.js", path: "/" },
    });
  });

  it("sends an unhandled rejection with source promise", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(<JsErrorTracker />);
    window.dispatchEvent(rejection("network down"));
    expect(plausible).toHaveBeenCalledWith("JS Error", { props: { message: "network down", source: "promise", path: "/" } });
  });

  it("reports only the first error on a page", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(<JsErrorTracker />);
    window.dispatchEvent(new ErrorEvent("error", { error: new Error("first") }));
    window.dispatchEvent(new ErrorEvent("error", { error: new Error("second") }));
    expect(plausible).toHaveBeenCalledTimes(1);
  });

  it("ignores errors from browser extensions and doesn't let them use up the report", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    render(<JsErrorTracker />);
    window.dispatchEvent(new ErrorEvent("error", { error: new Error("ext"), filename: "chrome-extension://abc/content.js" }));
    const mozError = new Error("ext");
    mozError.stack = "Error: ext\n    at moz-extension://abc/inject.js:1:1";
    window.dispatchEvent(rejection(mozError));
    window.dispatchEvent(new ErrorEvent("error", { message: "Refused to create a TrustedTypePolicy named 'x' (trusted-types-policy)" }));
    expect(plausible).not.toHaveBeenCalled();

    window.dispatchEvent(new ErrorEvent("error", { error: new Error("ours") }));
    expect(plausible).toHaveBeenCalledWith("JS Error", expect.objectContaining({ props: expect.objectContaining({ message: "ours" }) }));
  });

  it("truncates the message to 200 characters", () => {
    const event = new ErrorEvent("error", { message: "x".repeat(500) });
    expect(jsErrorMessage(event)).toHaveLength(200);
  });
});
