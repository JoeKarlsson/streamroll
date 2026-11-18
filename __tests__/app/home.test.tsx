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
    vi.stubGlobal("IntersectionObserver", class { observe() {} disconnect() {} });
    vi.stubGlobal("CSS", { supports: () => true });
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

  it("Cancel video stops waiting at once, cancels the Runway task and goes back to the poster", async () => {
    localStorage.setItem("runway_api_key", "key_test");
    seedSession({ step: "review" });
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/video/start") return new Response(JSON.stringify({ taskId: "task_1", creditsBefore: 100 }));
      if (url.startsWith("/api/video/cancel")) return new Response(JSON.stringify({ ok: true }));
      throw new Error(`unexpected fetch ${url}`);
    });
    render(<Home />);
    fireEvent.click(await screen.findByRole("button", { name: "Looks good, make the video" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel video" }));

    const cancelling = screen.getByRole<HTMLButtonElement>("button", { name: "Cancelling…" });
    expect(cancelling.disabled).toBe(true);
    // Without the abortable sleep this waits out the 8s poll interval and the find times out.
    await screen.findByText("Happy with the logo?");
    expect(fetchMock).toHaveBeenCalledWith("/api/video/cancel?id=task_1", expect.objectContaining({ method: "DELETE" }));
    expect(fetchMock.mock.calls.some(([u]) => String(u).startsWith("/api/video/poll"))).toBe(false);
  });
});
