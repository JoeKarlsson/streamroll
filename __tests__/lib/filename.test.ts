import { describe, it, expect } from "vitest";
import { introFilename } from "@/lib/filename";

// West of UTC, so a late-evening local time is already tomorrow in UTC.
process.env.TZ = "America/Chicago";

describe("introFilename", () => {
  const when = new Date(2026, 10, 18, 23, 30);

  it("slugs the name and stamps the date and time", () => {
    expect(introFilename("  Joe's Flix! ", "cinematic", "mp4", when)).toBe("joe-s-flix-cinematic-2026-11-18-2330.mp4");
  });

  it("falls back to intro when the name has no letters or digits", () => {
    expect(introFilename("★★", "vhs", "png", when)).toMatch(/^intro-vhs-.*\.png$/);
  });
});
