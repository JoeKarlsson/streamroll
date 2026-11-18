import { describe, it, expect } from "vitest";
import { durationForModel, durationsFor, imageCreditCost, videoCreditsPerSecond } from "@/lib/models";

describe("durationForModel", () => {
  it("keeps a length the new model offers", () => {
    expect(durationForModel("veo3.1", 8)).toBe(8);
    expect(durationForModel("gen4_turbo", 10)).toBe(10);
    expect(durationForModel("veo3", 4)).toBe(4);
  });

  it("falls back to 4s on Veo and 5s on Runway models", () => {
    expect(durationForModel("veo3.1_fast", 5)).toBe(4);
    expect(durationForModel("gen4.5", 6)).toBe(5);
  });

  it("offers Veo and Runway lengths", () => {
    expect(durationsFor("veo3").map((d) => d.value)).toEqual([4, 6, 8]);
    expect(durationsFor("gen3a_turbo").map((d) => d.value)).toEqual([2, 4, 5, 10]);
  });
});

describe("credit costs", () => {
  it("prices video per second by model", () => {
    expect(videoCreditsPerSecond("gen4_turbo")).toBe(5);
    expect(videoCreditsPerSecond("gen4.5")).toBe(12);
    expect(videoCreditsPerSecond("veo3.1")).toBe(25);
    expect(videoCreditsPerSecond("veo3.1_fast")).toBe(15);
  });

  it("charges nothing for canvas-drawn title cards", () => {
    expect(imageCreditCost("prestige", "gpt_image_2")).toBe(0);
  });

  it("charges the image model's price otherwise", () => {
    expect(imageCreditCost("cinematic", "gen4_image")).toBe(30);
    expect(imageCreditCost("retro", "gemini_2.5_flash")).toBe(10);
  });
});
