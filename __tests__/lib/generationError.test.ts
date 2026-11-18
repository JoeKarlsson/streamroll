import { describe, it, expect } from "vitest";
import { GenerationError, generationErrorProps, readApiJson } from "@/lib/generationError";

const models = { imageModel: "gen4_image", videoModel: "gen4_turbo" };
const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("readApiJson", () => {
  it("returns the body of a successful response", async () => {
    await expect(readApiJson(jsonResponse({ taskId: "t1" }, 200), "failed")).resolves.toEqual({ taskId: "t1" });
  });

  it("throws the route's kind, status and code", async () => {
    const error = await readApiJson(jsonResponse({ error: "Rejected (SAFETY.INPUT.TEXT)", kind: "moderation", code: "SAFETY.INPUT.TEXT" }, 422), "failed")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GenerationError);
    expect(error).toMatchObject({ message: "Rejected (SAFETY.INPUT.TEXT)", kind: "moderation", status: 422, code: "SAFETY.INPUT.TEXT" });
  });

  it("classifies a non-JSON failure page from its status", async () => {
    const error = await readApiJson(new Response("<html>timeout</html>", { status: 504 }), "Image generation failed")
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ message: "Image generation failed (HTTP 504)", kind: "timeout", status: 504 });
  });

  it("falls back to the status's kind when the route sent none", async () => {
    await expect(readApiJson(jsonResponse({ error: "No key" }, 401), "failed")).rejects.toMatchObject({ kind: "auth" });
  });
});

describe("generationErrorProps", () => {
  it("reports a GenerationError's kind, status and code with both models", () => {
    const error = new GenerationError("Rate limited", { kind: "rate_limit", status: 429 });
    expect(generationErrorProps(error, "video", models)).toEqual({
      stage: "video", kind: "rate_limit", status: "429", code: "none", image_model: "gen4_image", video_model: "gen4_turbo",
    });
  });

  it("lets the error's own stage win over the caller's", () => {
    const error = new GenerationError("Couldn't load", { kind: "other", stage: "poster" });
    expect(generationErrorProps(error, "image", models).stage).toBe("poster");
  });

  it("treats a fetch TypeError as a network failure", () => {
    expect(generationErrorProps(new TypeError("Failed to fetch"), "image", models)).toMatchObject({ kind: "network", status: "none" });
  });

  it("never sends the error message", () => {
    const props = generationErrorProps(new Error("a prompt about MY SECRET SERVICE"), "canvas", models);
    expect(props.kind).toBe("other");
    expect(Object.values(props).join(" ")).not.toContain("SECRET");
  });
});
