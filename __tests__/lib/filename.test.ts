import { describe, it, expect } from "vitest";
import { introFilename } from "@/lib/filename";

describe("introFilename", () => {
  const when = new Date(2026, 10, 18, 9, 5);

  it("slugs the name and stamps the date and time", () => {
    expect(introFilename("  Joe's Flix! ", "cinematic", "mp4", when)).toBe(`joe-s-flix-cinematic-${when.toISOString().slice(0, 10)}-0905.mp4`);
  });

  it("falls back to intro when the name has no letters or digits", () => {
    expect(introFilename("★★", "vhs", "png", when)).toMatch(/^intro-vhs-.*\.png$/);
  });
});
