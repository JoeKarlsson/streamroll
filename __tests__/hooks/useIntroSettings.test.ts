import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIntroSettings } from "@/hooks/useIntroSettings";
import { parseSavedGeneration } from "@/lib/genSession";
import { durationsFor } from "@/lib/models";

function restoreFromStorage(raw: object) {
  const { result } = renderHook(() => useIntroSettings());
  const saved = parseSavedGeneration(JSON.stringify(raw));
  if (!saved) throw new Error("expected a restorable session");
  act(() => result.current.restore(saved));
  return result.current;
}

describe("useIntroSettings restore", () => {
  it("restores a session saved with a model Runway retired onto the default model", () => {
    const settings = restoreFromStorage({ step: "done", name: "Oldflix", videoModel: "gen3a_turbo", duration: 10 });
    expect(settings.name).toBe("Oldflix");
    expect(settings.videoModel).toBe("gen4.5");
    expect(settings.duration).toBe(10);
  });

  it("swaps a saved length the default model doesn't offer for that model's default", () => {
    const settings = restoreFromStorage({ step: "done", videoModel: "veo3", duration: 6 });
    expect(settings.videoModel).toBe("gen4.5");
    expect(durationsFor(settings.videoModel).map((d) => d.value)).toContain(settings.duration);
    expect(settings.duration).toBe(5);
  });

  it("keeps a saved model and its length", () => {
    const settings = restoreFromStorage({ step: "done", videoModel: "veo3.1", duration: 8 });
    expect(settings.videoModel).toBe("veo3.1");
    expect(settings.duration).toBe(8);
  });
});
