import { describe, it, expect } from "vitest";
import { parseSavedGeneration } from "@/lib/genSession";

describe("parseSavedGeneration", () => {
  it("restores a finished, failed or in-review generation", () => {
    for (const step of ["done", "error", "review"]) {
      expect(parseSavedGeneration(JSON.stringify({ step, name: "Joeflix" }))).toEqual({ step, name: "Joeflix" });
    }
  });

  it("ignores a run that was still going, and nothing saved", () => {
    expect(parseSavedGeneration(JSON.stringify({ step: "video" }))).toBeNull();
    expect(parseSavedGeneration(JSON.stringify({ name: "x" }))).toBeNull();
    expect(parseSavedGeneration(null)).toBeNull();
  });

  it("drops a style or model this version doesn't offer and keeps the rest", () => {
    const saved = parseSavedGeneration(JSON.stringify({ step: "done", style: "gone", imageModel: "gen9_image", videoModel: "gen4.5", treatment: "minimal" }));
    expect(saved).toMatchObject({ step: "done", videoModel: "gen4.5", treatment: "minimal" });
    expect(saved?.style).toBeUndefined();
    expect(saved?.imageModel).toBeUndefined();
  });

  it("ignores unreadable storage", () => {
    expect(parseSavedGeneration("{not json")).toBeNull();
    expect(parseSavedGeneration("null")).toBeNull();
    expect(parseSavedGeneration('"done"')).toBeNull();
  });
});
