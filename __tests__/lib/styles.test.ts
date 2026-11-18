import { describe, it, expect } from "vitest";
import { nextTagline, STYLE_TAGLINES } from "@/lib/styles";

describe("nextTagline", () => {
  it("never repeats the current tagline", () => {
    const current = STYLE_TAGLINES.horror[0]!;
    for (const r of [0, 0.5, 0.999]) {
      const next = nextTagline("horror", current, () => r);
      expect(next).not.toBe(current);
      expect(STYLE_TAGLINES.horror).toContain(next);
    }
  });
});
