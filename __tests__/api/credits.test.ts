import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const retrieve = vi.fn();
vi.mock("@runwayml/sdk", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@runwayml/sdk")>()),
  default: vi.fn().mockImplementation(function () { return { organization: { retrieve } }; }),
}));

import { GET } from "@/app/api/credits/route";
import { AuthenticationError } from "@runwayml/sdk";

const request = (headers: Record<string, string> = {}) => new NextRequest("http://localhost/api/credits", { headers });

describe("GET /api/credits", () => {
  it("returns 401 without a key", async () => {
    expect((await GET(request())).status).toBe(401);
  });

  it("returns the key's balance, including 0", async () => {
    retrieve.mockResolvedValueOnce({ creditBalance: 0 });
    const res = await GET(request({ "x-runway-key": "key_test" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ creditBalance: 0 });
  });

  it("passes Runway's 401 for a bad key through", async () => {
    retrieve.mockRejectedValueOnce(new AuthenticationError(401, { error: "Invalid API key" }, undefined, new Headers()));
    expect((await GET(request({ "x-runway-key": "key_bad" }))).status).toBe(401);
  });
});
