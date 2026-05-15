import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/runway", () => ({
  generateIntroVideo: vi.fn().mockResolvedValue("https://cdn.example.com/video.mp4"),
}));

import { POST } from "@/app/api/video/route";
import { generateIntroVideo } from "@/lib/runway";

function makeRequest(body: object, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/video", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("POST /api/video", () => {
  beforeEach(() => {
    vi.mocked(generateIntroVideo).mockResolvedValue("https://cdn.example.com/video.mp4");
  });

  it("returns 400 when imageUrl is missing", async () => {
    const res = await POST(makeRequest({ name: "Netflix" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/imageUrl is required/i);
  });

  it("returns 401 when x-runway-key header is absent", async () => {
    const res = await POST(makeRequest({ imageUrl: "https://cdn.example.com/image.png" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/api key/i);
  });

  it("uses RUNWAYML_API_SECRET env var as fallback for api key", async () => {
    process.env.RUNWAYML_API_SECRET = "env-key-456";
    const res = await POST(makeRequest({ imageUrl: "https://cdn.example.com/image.png" }));
    expect(res.status).toBe(200);
    expect(generateIntroVideo).toHaveBeenCalledWith(
      "https://cdn.example.com/image.png",
      expect.anything(),
      "env-key-456"
    );
    delete process.env.RUNWAYML_API_SECRET;
  });

  it("returns 200 with videoUrl on success", async () => {
    const res = await POST(makeRequest(
      { imageUrl: "https://cdn.example.com/image.png", name: "Netflix", style: "cinematic" },
      { "x-runway-key": "key123" }
    ));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.videoUrl).toBe("https://cdn.example.com/video.mp4");
  });

  it("defaults name to MY SERVICE when omitted", async () => {
    await POST(makeRequest({ imageUrl: "https://cdn.example.com/image.png" }, { "x-runway-key": "key123" }));
    expect(generateIntroVideo).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ name: "MY SERVICE" }),
      expect.anything()
    );
  });

  it("defaults style to cinematic when omitted", async () => {
    await POST(makeRequest({ imageUrl: "https://cdn.example.com/image.png" }, { "x-runway-key": "key123" }));
    expect(generateIntroVideo).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ style: "cinematic" }),
      expect.anything()
    );
  });

  it("returns 500 when generateIntroVideo throws", async () => {
    vi.mocked(generateIntroVideo).mockRejectedValueOnce(new Error("Runway timeout"));
    const res = await POST(makeRequest(
      { imageUrl: "https://cdn.example.com/image.png" },
      { "x-runway-key": "key123" }
    ));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Runway timeout");
  });
});
