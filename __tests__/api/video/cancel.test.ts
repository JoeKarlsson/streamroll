import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockTasksDelete = vi.fn().mockResolvedValue(undefined);

vi.mock("@runwayml/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    tasks: { delete: mockTasksDelete },
  })),
}));

import { DELETE } from "@/app/api/video/cancel/route";

function makeRequest(params: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/video/cancel");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method: "DELETE", headers });
}

describe("DELETE /api/video/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTasksDelete.mockResolvedValue(undefined);
  });

  it("returns 400 when id param is missing", async () => {
    const res = await DELETE(makeRequest({}, { "x-runway-key": "key123" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/id is required/i);
  });

  it("returns 401 when x-runway-key header is absent", async () => {
    const res = await DELETE(makeRequest({ id: "task_abc" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/api key/i);
  });

  it("returns 200 with cancelled=true on success", async () => {
    const res = await DELETE(makeRequest({ id: "task_abc" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cancelled).toBe(true);
  });

  it("calls tasks.delete with the correct taskId", async () => {
    await DELETE(makeRequest({ id: "task_abc123" }, { "x-runway-key": "key123" }));
    expect(mockTasksDelete).toHaveBeenCalledWith("task_abc123");
  });

  it("returns 500 when tasks.delete throws", async () => {
    mockTasksDelete.mockRejectedValueOnce(new Error("Task not found"));
    const res = await DELETE(makeRequest({ id: "task_abc" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Task not found");
  });
});
