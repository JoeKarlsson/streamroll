import { describe, it, expect, vi, beforeEach } from "vitest";
import { track } from "@/lib/plausible";

describe("track", () => {
  beforeEach(() => {
    delete (window as Window & { plausible?: unknown }).plausible;
  });

  it("calls window.plausible with the event name when present", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    track("Mix Audio");
    expect(plausible).toHaveBeenCalledWith("Mix Audio", undefined);
  });

  it("passes props object when provided", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    track("Download Poster", { style: "cinematic" });
    expect(plausible).toHaveBeenCalledWith("Download Poster", { props: { style: "cinematic" } });
  });

  it("does not throw when window.plausible is undefined", () => {
    expect(() => track("Mix Audio")).not.toThrow();
  });

  it("does not throw with props when window.plausible is undefined", () => {
    expect(() => track("Mix Audio Error", { reason: "timeout" })).not.toThrow();
  });
});
