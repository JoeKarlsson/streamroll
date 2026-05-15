import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockTasksRetrieve = vi.fn();
const mockOrgRetrieve = vi.fn();

vi.mock("@runwayml/sdk", () => {
  const MockRunwayML = vi.fn().mockImplementation(() => ({
    tasks: { retrieve: mockTasksRetrieve },
    organization: { retrieve: mockOrgRetrieve },
  }));
  return { default: MockRunwayML };
});

import { GET } from "@/app/api/video/poll/route";

function makeRequest(params: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/video/poll");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { headers });
}

describe("GET /api/video/poll", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOrgRetrieve.mockResolvedValue({ creditBalance: 200 });
  });

  it("returns 400 when id param is missing", async () => {
    const res = await GET(makeRequest({}, { "x-runway-key": "key123" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/id is required/i);
  });

  it("returns 401 when x-runway-key header is absent", async () => {
    const res = await GET(makeRequest({ id: "task_abc" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/api key/i);
  });

  it("returns SUCCEEDED status with output and creditsAfter", async () => {
    mockTasksRetrieve.mockResolvedValue({ status: "SUCCEEDED", output: ["https://cdn.example.com/video.mp4"] });
    mockOrgRetrieve.mockResolvedValue({ creditBalance: 180 });

    const res = await GET(makeRequest({ id: "task_abc" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("SUCCEEDED");
    expect(json.output).toBe("https://cdn.example.com/video.mp4");
    expect(json.creditsAfter).toBe(180);
  });

  it("returns FAILED status with failure reason", async () => {
    mockTasksRetrieve.mockResolvedValue({ status: "FAILED", failure: "Content policy violation" });

    const res = await GET(makeRequest({ id: "task_abc" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("FAILED");
    expect(json.failure).toBe("Content policy violation");
  });

  it("returns RUNNING status with progress", async () => {
    mockTasksRetrieve.mockResolvedValue({ status: "RUNNING", progress: 0.42 });

    const res = await GET(makeRequest({ id: "task_abc" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("RUNNING");
    expect(json.progress).toBe(0.42);
  });

  it("returns RUNNING with null progress when progress is absent", async () => {
    mockTasksRetrieve.mockResolvedValue({ status: "RUNNING" });

    const res = await GET(makeRequest({ id: "task_abc" }, { "x-runway-key": "key123" }));
    const json = await res.json();
    expect(json.progress).toBeNull();
  });

  it("returns THROTTLED status", async () => {
    mockTasksRetrieve.mockResolvedValue({ status: "THROTTLED" });

    const res = await GET(makeRequest({ id: "task_abc" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe("THROTTLED");
  });

  it("returns PENDING status", async () => {
    mockTasksRetrieve.mockResolvedValue({ status: "PENDING" });

    const res = await GET(makeRequest({ id: "task_abc" }, { "x-runway-key": "key123" }));
    const json = await res.json();
    expect(json.status).toBe("PENDING");
  });

  it("returns 500 when SDK throws", async () => {
    mockTasksRetrieve.mockRejectedValue(new Error("Network timeout"));

    const res = await GET(makeRequest({ id: "task_abc" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Network timeout");
  });
});
