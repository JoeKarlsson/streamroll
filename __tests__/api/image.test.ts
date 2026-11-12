import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@runwayml/sdk", () => {
  const mockOrganization = {
    retrieve: vi.fn().mockResolvedValue({ creditBalance: 100 }),
  };
  const MockRunwayML = vi.fn().mockImplementation(function () { return ({ organization: mockOrganization }); });
  return { default: MockRunwayML };
});

vi.mock("@/lib/runway", () => ({
  generateLogoImage: vi.fn().mockResolvedValue("https://cdn.example.com/image.png"),
}));

import { POST } from "@/app/api/image/route";
import { generateLogoImage } from "@/lib/runway";
import RunwayML from "@runwayml/sdk";

function makeRequest(body: object, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/image", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("POST /api/image", () => {
  beforeEach(() => {
    vi.mocked(generateLogoImage).mockResolvedValue("https://cdn.example.com/image.png");
    const mockInstance = { organization: { retrieve: vi.fn().mockResolvedValue({ creditBalance: 100 }) } };
    vi.mocked(RunwayML).mockImplementation(function () { return mockInstance as never; });
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(makeRequest({ style: "cinematic" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/name is required/i);
  });

  it("returns 400 when name is whitespace only", async () => {
    const res = await POST(makeRequest({ name: "   " }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when x-runway-key header is absent", async () => {
    const res = await POST(makeRequest({ name: "Netflix" }));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/api key/i);
  });

  it("returns 200 with imageUrl and creditCost on success", async () => {
    const mockOrg = { retrieve: vi.fn().mockResolvedValueOnce({ creditBalance: 100 }).mockResolvedValueOnce({ creditBalance: 85 }) };
    vi.mocked(RunwayML).mockImplementation(function () { return ({ organization: mockOrg }) as never; });

    const res = await POST(makeRequest({ name: "Netflix", style: "cinematic" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.imageUrl).toBe("https://cdn.example.com/image.png");
    expect(json.creditCost).toBe(15);
  });

  it("passes imagePromptOverride through to generateLogoImage", async () => {
    const mockOrg = { retrieve: vi.fn().mockResolvedValue({ creditBalance: 100 }) };
    vi.mocked(RunwayML).mockImplementation(function () { return ({ organization: mockOrg }) as never; });

    await POST(makeRequest(
      { name: "Netflix", imagePromptOverride: "custom prompt here" },
      { "x-runway-key": "key123" }
    ));

    expect(generateLogoImage).toHaveBeenCalledWith(
      expect.anything(),
      "key123",
      "custom prompt here"
    );
  });

  it("returns 500 when generateLogoImage throws", async () => {
    vi.mocked(generateLogoImage).mockRejectedValueOnce(new Error("Runway API error"));
    const mockOrg = { retrieve: vi.fn().mockResolvedValue({ creditBalance: 100 }) };
    vi.mocked(RunwayML).mockImplementation(function () { return ({ organization: mockOrg }) as never; });

    const res = await POST(makeRequest({ name: "Netflix" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Runway API error");
  });

  it("returns the image when the credit-balance lookup fails", async () => {
    const mockOrg = { retrieve: vi.fn().mockRejectedValue(new Error("timeout")) };
    vi.mocked(RunwayML).mockImplementation(function () { return ({ organization: mockOrg }) as never; });

    const res = await POST(makeRequest({ name: "Netflix" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.imageUrl).toBe("https://cdn.example.com/image.png");
    expect(json.creditCost).toBe(0);
  });

  it("adds Runway's failure code to the error", async () => {
    vi.mocked(generateLogoImage).mockRejectedValueOnce(
      Object.assign(new Error("Prompt was rejected"), { taskDetails: { failureCode: "SAFETY.INPUT.TEXT" } })
    );

    const res = await POST(makeRequest({ name: "Netflix" }, { "x-runway-key": "key123" }));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Prompt was rejected (SAFETY.INPUT.TEXT)");
  });

  it("creditCost is at least 0 even if credits went up", async () => {
    const mockOrg = { retrieve: vi.fn().mockResolvedValueOnce({ creditBalance: 50 }).mockResolvedValueOnce({ creditBalance: 100 }) };
    vi.mocked(RunwayML).mockImplementation(function () { return ({ organization: mockOrg }) as never; });

    const res = await POST(makeRequest({ name: "Netflix" }, { "x-runway-key": "key123" }));
    const json = await res.json();
    expect(json.creditCost).toBeGreaterThanOrEqual(0);
  });
});
