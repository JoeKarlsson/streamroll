import { describe, it, expect } from "vitest";
import { isEnterToSubmitNotes } from "@/lib/enterToSubmit";

const enter = (over: Partial<{ isComposing: boolean; keyCode: number }> = {}) => ({
  key: "Enter",
  nativeEvent: { isComposing: false, keyCode: 13, ...over },
});

describe("isEnterToSubmitNotes", () => {
  it("submits on a plain Enter with notes", () => {
    expect(isEnterToSubmitNotes(enter(), "more energy")).toBe(true);
  });

  it("does not start a paid redo when the notes are empty or blank", () => {
    expect(isEnterToSubmitNotes(enter(), "")).toBe(false);
    expect(isEnterToSubmitNotes(enter(), "   ")).toBe(false);
  });

  it("ignores the Enter that confirms an IME composition", () => {
    expect(isEnterToSubmitNotes(enter({ isComposing: true }), "暗い背景")).toBe(false);
    expect(isEnterToSubmitNotes(enter({ keyCode: 229 }), "暗い背景")).toBe(false);
  });

  it("ignores other keys", () => {
    expect(isEnterToSubmitNotes({ ...enter(), key: "a" }, "notes")).toBe(false);
  });
});
