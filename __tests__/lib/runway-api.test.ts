import { describe, it, expect, vi, beforeEach } from "vitest";

const mockWaitForTaskOutput = vi.fn();
const mockTextToImageCreate = vi.fn().mockReturnValue({ waitForTaskOutput: mockWaitForTaskOutput });

vi.mock("@runwayml/sdk", () => ({
  default: vi.fn().mockImplementation(function () { return ({
    textToImage: { create: mockTextToImageCreate },
  }); }),
}));

import { generateLogoImage } from "@/lib/runway";
import type { GenerationParams } from "@/lib/runway";

const baseParams: GenerationParams = {
  name: "Netflix",
  style: "cinematic",
  duration: 5,
};

describe("generateLogoImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWaitForTaskOutput.mockResolvedValue({ output: ["https://cdn.example.com/image.png"] });
    mockTextToImageCreate.mockReturnValue({ waitForTaskOutput: mockWaitForTaskOutput });
  });

  it("returns the first output URL on success", async () => {
    const url = await generateLogoImage(baseParams, "api-key-123");
    expect(url).toBe("https://cdn.example.com/image.png");
  });

  it("throws when output array is empty", async () => {
    mockWaitForTaskOutput.mockResolvedValueOnce({ output: [] });
    await expect(generateLogoImage(baseParams, "api-key-123")).rejects.toThrow(/no output/i);
  });

  it("throws when output is undefined", async () => {
    mockWaitForTaskOutput.mockResolvedValueOnce({ output: undefined });
    await expect(generateLogoImage(baseParams, "api-key-123")).rejects.toThrow(/no output/i);
  });

  it("uses imagePromptOverride when provided", async () => {
    await generateLogoImage(baseParams, "api-key-123", "custom override prompt");
    expect(mockTextToImageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ promptText: "custom override prompt" })
    );
  });

  it("generates prompt from params when no override is given", async () => {
    await generateLogoImage(baseParams, "api-key-123");
    const call = mockTextToImageCreate.mock.calls[0][0];
    expect(call.promptText).toContain("NETFLIX");
  });

  it("defaults to gen4_image model", async () => {
    await generateLogoImage(baseParams, "api-key-123");
    expect(mockTextToImageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gen4_image" })
    );
  });

  it("uses the imageModel from params when specified", async () => {
    await generateLogoImage({ ...baseParams, imageModel: "gpt_image_2" }, "api-key-123");
    expect(mockTextToImageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gpt_image_2" })
    );
  });

  it("sets background=opaque for gpt_image_2", async () => {
    await generateLogoImage({ ...baseParams, imageModel: "gpt_image_2" }, "api-key-123");
    expect(mockTextToImageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ background: "opaque" })
    );
  });

  it("does not set background for non-gpt models", async () => {
    await generateLogoImage(baseParams, "api-key-123");
    const call = mockTextToImageCreate.mock.calls[0][0];
    expect(call.background).toBeUndefined();
  });

  it("uses correct ratio for gpt_image_2", async () => {
    await generateLogoImage({ ...baseParams, imageModel: "gpt_image_2" }, "api-key-123");
    expect(mockTextToImageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ ratio: "1920:1088" })
    );
  });

  it("uses correct ratio for gemini models", async () => {
    await generateLogoImage({ ...baseParams, imageModel: "gemini_image3_pro" }, "api-key-123");
    expect(mockTextToImageCreate).toHaveBeenCalledWith(
      expect.objectContaining({ ratio: "1344:768" })
    );
  });
});
