import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockImageToVideoCreate = vi.fn().mockResolvedValue({ id: "task_xyz" });
const mockOrgRetrieve = vi.fn().mockResolvedValue({ creditBalance: 500 });

vi.mock("@runwayml/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    imageToVideo: { create: mockImageToVideoCreate },
    organization: { retrieve: mockOrgRetrieve },
  })),
}));

import { POST } from "@/app/api/video/start/route";

function makeRequest(body: object, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/video/start", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("POST /api/video/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockImageToVideoCreate.mockResolvedValue({ id: "task_xyz" });
    mockOrgRetrieve.mockResolvedValue({ creditBalance: 500 });
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

  it("returns 200 with taskId on success", async () => {
    const res = await POST(makeRequest(
      { imageUrl: "https://cdn.example.com/image.png", name: "Netflix" },
      { "x-runway-key": "key123" }
    ));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.taskId).toBe("task_xyz");
  });

  it("includes creditsBefore in response", async () => {
    const res = await POST(makeRequest(
      { imageUrl: "https://cdn.example.com/image.png" },
      { "x-runway-key": "key123" }
    ));
    const json = await res.json();
    expect(json.creditsBefore).toBe(500);
  });

  it("returns creditsBefore as null when org.retrieve fails", async () => {
    mockOrgRetrieve.mockRejectedValueOnce(new Error("org fetch failed"));
    const res = await POST(makeRequest(
      { imageUrl: "https://cdn.example.com/image.png" },
      { "x-runway-key": "key123" }
    ));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.creditsBefore).toBeNull();
  });

  it("enables audio param for veo models when audio=true", async () => {
    await POST(makeRequest(
      { imageUrl: "https://cdn.example.com/image.png", videoModel: "veo3", audio: true },
      { "x-runway-key": "key123" }
    ));
    expect(mockImageToVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ audio: true, model: "veo3" })
    );
  });

  it("does not set audio param for non-veo models", async () => {
    await POST(makeRequest(
      { imageUrl: "https://cdn.example.com/image.png", videoModel: "gen4_turbo", audio: true },
      { "x-runway-key": "key123" }
    ));
    const callArgs = mockImageToVideoCreate.mock.calls[0][0];
    expect(callArgs.audio).toBeUndefined();
  });

  it("uses videoPromptOverride when provided", async () => {
    await POST(makeRequest(
      { imageUrl: "https://cdn.example.com/image.png", videoPromptOverride: "custom prompt" },
      { "x-runway-key": "key123" }
    ));
    expect(mockImageToVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ promptText: "custom prompt" })
    );
  });

  it("returns 500 when imageToVideo.create throws", async () => {
    mockImageToVideoCreate.mockRejectedValueOnce(new Error("rate limited"));
    const res = await POST(makeRequest(
      { imageUrl: "https://cdn.example.com/image.png" },
      { "x-runway-key": "key123" }
    ));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("rate limited");
  });
});
