import { describe, it, expect } from "vitest";
import { imageRatio, buildPrompts } from "@/lib/runway";
import type { Style } from "@/lib/runway";

describe("imageRatio", () => {
  it("returns 1920:1080 for gen4_image", () => {
    expect(imageRatio("gen4_image")).toBe("1920:1080");
  });

  it("returns 1920:1080 for gen4_image_turbo", () => {
    expect(imageRatio("gen4_image_turbo")).toBe("1920:1080");
  });

  it("returns 1920:1088 for gpt_image_2", () => {
    expect(imageRatio("gpt_image_2")).toBe("1920:1088");
  });

  it("returns 1344:768 for gemini_image3_pro", () => {
    expect(imageRatio("gemini_image3_pro")).toBe("1344:768");
  });

  it("returns 1344:768 for gemini_2.5_flash", () => {
    expect(imageRatio("gemini_2.5_flash")).toBe("1344:768");
  });
});

describe("buildPrompts", () => {
  const baseParams = {
    name: "Netflix",
    style: "cinematic" as Style,
    duration: 5 as const,
  };

  describe("imagePrompt", () => {
    it("includes the uppercased service name", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, name: "netflix" });
      expect(imagePrompt).toContain("NETFLIX");
    });

    it("includes tagline in subtitle when provided", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, tagline: "Watch Together" });
      expect(imagePrompt).toContain("WATCH TOGETHER");
    });

    it("suppresses subtitle when tagline is empty string", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, tagline: "" });
      expect(imagePrompt).toContain("no subtitle text");
    });

    it("suppresses subtitle when tagline is whitespace only", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, tagline: "   " });
      expect(imagePrompt).toContain("no subtitle text");
    });

    it("suppresses subtitle when tagline is omitted", () => {
      const { imagePrompt } = buildPrompts(baseParams);
      expect(imagePrompt).toContain("no subtitle text");
    });

    it("appends primaryColor when provided", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, primaryColor: "#FF0000" });
      expect(imagePrompt).toContain("#FF0000");
    });

    it("omits primaryColor line when not provided", () => {
      const { imagePrompt } = buildPrompts(baseParams);
      expect(imagePrompt).not.toContain("key accent color");
    });

    it("appends customNotes when provided", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, customNotes: "Add a dragon" });
      expect(imagePrompt).toContain("Add a dragon");
    });

    it("omits customNotes when empty", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, customNotes: "" });
      // Notes only appear when non-empty
      expect(imagePrompt).not.toMatch(/\.\s*$/); // no trailing period from notes
    });

    it("includes treatment description for non-adultswim styles", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, treatment: "theatrical" });
      expect(imagePrompt).toContain("cinematic widescreen");
    });

    describe("adultswim style", () => {
      const adultSwimParams = { ...baseParams, style: "adultswim" as Style };

      it("uses lowercase bracket name instead of uppercase", () => {
        const { imagePrompt } = buildPrompts({ ...adultSwimParams, name: "My Service" });
        expect(imagePrompt).toContain("[my service]");
        expect(imagePrompt).not.toContain("MY SERVICE");
      });

      it("does not apply treatment string", () => {
        const { imagePrompt } = buildPrompts({ ...adultSwimParams, treatment: "theatrical" });
        expect(imagePrompt).not.toContain("cinematic widescreen");
      });

      it("uses lowercase tagline when provided", () => {
        const { imagePrompt } = buildPrompts({ ...adultSwimParams, tagline: "Original Programming" });
        expect(imagePrompt).toContain("original programming");
      });
    });
  });

  describe("videoPrompt", () => {
    it("includes the uppercased service name", () => {
      const { videoPrompt } = buildPrompts({ ...baseParams, name: "hulu" });
      expect(videoPrompt).toContain("HULU");
    });

    it("uses plain motion for gen4_turbo", () => {
      const { videoPrompt } = buildPrompts({ ...baseParams, videoModel: "gen4_turbo" });
      // Plain motion does not have timestamp markers
      expect(videoPrompt).not.toMatch(/\[00:\d\d\]/);
    });

    it("uses timestamp-based motion for gen4.5", () => {
      const { videoPrompt } = buildPrompts({ ...baseParams, videoModel: "gen4.5" });
      expect(videoPrompt).toMatch(/\[00:\d\d\]/);
    });

    it("does not use timestamp motion for gen3a_turbo", () => {
      const { videoPrompt } = buildPrompts({ ...baseParams, videoModel: "gen3a_turbo" });
      expect(videoPrompt).not.toMatch(/\[00:\d\d\]/);
    });

    it("appends customNotes to video prompt", () => {
      const { videoPrompt } = buildPrompts({ ...baseParams, customNotes: "Add a rocket" });
      expect(videoPrompt).toContain("Add a rocket");
    });

    it("includes treatment motion text", () => {
      const { videoPrompt } = buildPrompts({ ...baseParams, treatment: "theatrical" });
      expect(videoPrompt).toContain("letterbox");
    });

    it("always declares animation begins immediately", () => {
      const { videoPrompt } = buildPrompts(baseParams);
      expect(videoPrompt).toContain("Animation begins immediately");
    });
  });

  describe("all styles produce non-empty prompts", () => {
    const allStyles: Style[] = [
      "cinematic", "retro", "futuristic", "minimal", "horror", "anime", "epic",
      "nature", "prestige", "adultswim", "cartoon", "vhs", "grindhouse", "lofi",
      "vaporwave", "cyberpunk", "hbo", "blockbuster", "dreamworks", "tristar",
      "hannabarbera", "columbia", "mst3k", "ebs",
    ];

    allStyles.forEach((style) => {
      it(`produces non-empty prompts for style: ${style}`, () => {
        const { imagePrompt, videoPrompt } = buildPrompts({ name: "Test", style, duration: 5 });
        expect(imagePrompt.length).toBeGreaterThan(20);
        expect(videoPrompt.length).toBeGreaterThan(20);
      });
    });
  });

  describe("edge cases", () => {
    it("handles names with special characters", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, name: "A&E Network" });
      expect(imagePrompt).toContain("A&E NETWORK");
    });

    it("handles very long names", () => {
      const longName = "A".repeat(100);
      const { imagePrompt, videoPrompt } = buildPrompts({ ...baseParams, name: longName });
      expect(imagePrompt).toContain(longName.toUpperCase());
      expect(videoPrompt).toContain(longName.toUpperCase());
    });

    it("trims whitespace from tagline", () => {
      const { imagePrompt } = buildPrompts({ ...baseParams, tagline: "  Hello World  " });
      expect(imagePrompt).toContain("HELLO WORLD");
    });
  });
});
