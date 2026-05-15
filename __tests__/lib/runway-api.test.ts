import { describe, it, expect, vi, beforeEach } from "vitest";

const mockWaitForTaskOutput = vi.fn();
const mockTextToImageCreate = vi.fn().mockReturnValue({ waitForTaskOutput: mockWaitForTaskOutput });
const mockImageToVideoCreate = vi.fn().mockReturnValue({ waitForTaskOutput: mockWaitForTaskOutput });

vi.mock("@runwayml/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    textToImage: { create: mockTextToImageCreate },
    imageToVideo: { create: mockImageToVideoCreate },
  })),
}));

import { generateLogoImage, generateIntroVideo } from "@/lib/runway";
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

describe("generateIntroVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWaitForTaskOutput.mockResolvedValue({ output: ["https://cdn.example.com/video.mp4"] });
    mockImageToVideoCreate.mockReturnValue({ waitForTaskOutput: mockWaitForTaskOutput });
  });

  it("returns the first output URL on success", async () => {
    const url = await generateIntroVideo("https://cdn.example.com/image.png", baseParams, "api-key-123");
    expect(url).toBe("https://cdn.example.com/video.mp4");
  });

  it("throws when output array is empty", async () => {
    mockWaitForTaskOutput.mockResolvedValueOnce({ output: [] });
    await expect(
      generateIntroVideo("https://cdn.example.com/image.png", baseParams, "api-key-123")
    ).rejects.toThrow(/no output/i);
  });

  it("defaults to gen4_turbo model", async () => {
    await generateIntroVideo("https://cdn.example.com/image.png", baseParams, "api-key-123");
    expect(mockImageToVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gen4_turbo" })
    );
  });

  it("uses the videoModel from params when specified", async () => {
    await generateIntroVideo("https://cdn.example.com/image.png", { ...baseParams, videoModel: "gen4.5" }, "api-key-123");
    expect(mockImageToVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: "gen4.5" })
    );
  });

  it("passes promptImage as the image URL", async () => {
    await generateIntroVideo("https://cdn.example.com/image.png", baseParams, "api-key-123");
    expect(mockImageToVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ promptImage: "https://cdn.example.com/image.png" })
    );
  });

  it("sets audio=true for veo3 model when audio param is true", async () => {
    await generateIntroVideo("https://cdn.example.com/image.png", { ...baseParams, videoModel: "veo3", audio: true }, "api-key-123");
    expect(mockImageToVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ audio: true })
    );
  });

  it("does not set audio for non-veo models even when audio=true", async () => {
    await generateIntroVideo("https://cdn.example.com/image.png", { ...baseParams, videoModel: "gen4_turbo", audio: true }, "api-key-123");
    const call = mockImageToVideoCreate.mock.calls[0][0];
    expect(call.audio).toBeUndefined();
  });

  it("sets audio=true for veo3.1 model", async () => {
    await generateIntroVideo("https://cdn.example.com/image.png", { ...baseParams, videoModel: "veo3.1", audio: true }, "api-key-123");
    expect(mockImageToVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ audio: true })
    );
  });

  it("sets audio=true for veo3.1_fast model", async () => {
    await generateIntroVideo("https://cdn.example.com/image.png", { ...baseParams, videoModel: "veo3.1_fast", audio: true }, "api-key-123");
    expect(mockImageToVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ audio: true })
    );
  });

  it("passes the duration from params", async () => {
    await generateIntroVideo("https://cdn.example.com/image.png", { ...baseParams, duration: 10 }, "api-key-123");
    expect(mockImageToVideoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 10 })
    );
  });
});
