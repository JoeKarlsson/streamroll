import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "@/app/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const scrollIntoView = vi.fn();
const fetchMock = vi.fn();

function seedSession(state: Record<string, unknown>) {
  sessionStorage.setItem("streamroll_gen_state", JSON.stringify({
    name: "Joeflix", style: "cinematic", tagline: "Where stories come alive",
    imageUrl: "https://example.com/poster.jpg", timings: { image: 1000, video: 2000 },
    videoModel: "gen4_turbo", imageModel: "gen4_image", treatment: "full-bleed", duration: 5,
    ...state,
  }));
}

describe("Home with a restored session", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    scrollIntoView.mockClear();
    fetchMock.mockClear();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }));
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => {};
  });

  it("does not scroll the page to a result restored from sessionStorage", async () => {
    seedSession({ step: "review" });
    render(<Home />);
    await screen.findByText("Happy with the logo?");
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("Enter in empty redo notes does not start a paid regeneration", async () => {
    localStorage.setItem("runway_api_key", "key_test");
    seedSession({ step: "done", videoUrl: "https://example.com/intro.mp4" });
    render(<Home />);
    const notes = await screen.findByLabelText("Notes for a redo (optional)");
    fireEvent.keyDown(notes, { key: "Enter", keyCode: 13 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
