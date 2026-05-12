import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { buildPrompts, type GenerationParams } from "@/lib/runway";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const apiKey = req.headers.get("x-runway-key") ?? "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Runway API key provided. Visit /setup to add yours." },
      { status: 401 }
    );
  }

  const params: GenerationParams = {
    name: body.name ?? "MY SERVICE",
    style: body.style ?? "cinematic",
    tagline: body.tagline,
    duration: body.duration ?? 5,
    videoModel: body.videoModel,
    treatment: body.treatment,
    primaryColor: body.primaryColor,
    customNotes: body.customNotes,
    audio: body.audio,
  };

  const { videoPrompt: generatedVideoPrompt } = buildPrompts(params);
  const videoPrompt = body.videoPromptOverride ?? generatedVideoPrompt;
  const model = params.videoModel ?? "gen4_turbo";
  const isVeoModel = model === "veo3" || model === "veo3.1" || model === "veo3.1_fast";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createParams: Record<string, any> = {
    model,
    promptImage: body.imageUrl,
    promptText: videoPrompt,
    ratio: "1280:720",
    duration: params.duration,
  };
  if (isVeoModel && params.audio) createParams.audio = true;

  try {
    const client = new RunwayML({ apiKey, timeout: 25_000 });
    const [{ creditBalance: creditsBefore }, task] = await Promise.all([
      client.organization.retrieve(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      client.imageToVideo.create(createParams as any),
    ]);
    return NextResponse.json({ taskId: task.id, creditsBefore });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to start video generation";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
