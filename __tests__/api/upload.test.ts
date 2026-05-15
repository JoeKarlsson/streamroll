import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockCreateEphemeral, mockToFile } = vi.hoisted(() => ({
  mockCreateEphemeral: vi.fn().mockResolvedValue({ uri: "https://upload.runwayml.com/ephemeral/abc123" }),
  mockToFile: vi.fn().mockImplementation(async (file: File) => file),
}));

vi.mock("@runwayml/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    uploads: { createEphemeral: mockCreateEphemeral },
  })),
  toFile: mockToFile,
}));

import { POST } from "@/app/api/upload/route";

function makeFileRequest(file: File | null, headers: Record<string, string> = {}) {
  const req = new NextRequest("http://localhost/api/upload", {
    method: "POST",
    headers,
  });
  // Override formData() — the Node/jsdom environment can't parse multipart bodies natively
  req.formData = async () => {
    if (file === null) throw new Error("No form data");
    const fd = new FormData();
    fd.append("file", file);
    return fd;
  };
  return req;
}

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type });
}

describe("POST /api/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateEphemeral.mockResolvedValue({ uri: "https://upload.runwayml.com/ephemeral/abc123" });
    mockToFile.mockImplementation(async (file: File) => file);
  });

  it("returns 401 when x-runway-key header is absent", async () => {
    const file = makeFile("image.png", "image/png", 100);
    const res = await POST(makeFileRequest(file));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/api key/i);
  });

  it("returns 400 when formData parsing fails (no body)", async () => {
    const res = await POST(makeFileRequest(null, { "x-runway-key": "key123" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/no file/i);
  });

  it("returns 400 when form has no file field", async () => {
    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      headers: { "x-runway-key": "key123" },
    });
    req.formData = async () => new FormData(); // empty form, no "file" key
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/no file/i);
  });

  it("returns 413 when file exceeds 10 MB", async () => {
    const bigFile = makeFile("big.png", "image/png", 11 * 1024 * 1024);
    const res = await POST(makeFileRequest(bigFile, { "x-runway-key": "key123" }));
    expect(res.status).toBe(413);
    const json = await res.json();
    expect(json.error).toMatch(/too large/i);
  });

  it("returns 415 for unsupported file type", async () => {
    const gifFile = makeFile("anim.gif", "image/gif", 1024);
    const res = await POST(makeFileRequest(gifFile, { "x-runway-key": "key123" }));
    expect(res.status).toBe(415);
    const json = await res.json();
    expect(json.error).toMatch(/unsupported file type/i);
  });

  it("accepts image/png and returns uri on success", async () => {
    const file = makeFile("logo.png", "image/png", 1024);
    const res = await POST(makeFileRequest(file, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.uri).toBe("https://upload.runwayml.com/ephemeral/abc123");
  });

  it("accepts image/jpeg", async () => {
    const file = makeFile("photo.jpg", "image/jpeg", 2048);
    const res = await POST(makeFileRequest(file, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
  });

  it("accepts image/webp", async () => {
    const file = makeFile("image.webp", "image/webp", 2048);
    const res = await POST(makeFileRequest(file, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
  });

  it("returns 500 when createEphemeral throws", async () => {
    mockCreateEphemeral.mockRejectedValueOnce(new Error("Storage quota exceeded"));
    const file = makeFile("logo.png", "image/png", 1024);
    const res = await POST(makeFileRequest(file, { "x-runway-key": "key123" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Storage quota exceeded");
  });

  it("file exactly at 10 MB limit is accepted", async () => {
    const file = makeFile("exact.png", "image/png", 10 * 1024 * 1024);
    const res = await POST(makeFileRequest(file, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
  });
});
