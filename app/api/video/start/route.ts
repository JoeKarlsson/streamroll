import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import type { ImageToVideoCreateParams } from "@runwayml/sdk/resources";
import { buildPrompts, type GenerationParams } from "@/lib/runway";
import { isVeoModel } from "@/lib/models";

export const maxDuration = 90;

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
  const { duration } = params;
  let createParams: ImageToVideoCreateParams;
  if (isVeoModel(model)) {
    if (duration !== 4 && duration !== 6 && duration !== 8) {
      return NextResponse.json({ error: `${model} makes 4, 6 or 8 second clips, not ${duration}` }, { status: 400 });
    }
    createParams = { model, promptImage: body.imageUrl, promptText: videoPrompt, ratio: "1280:720", duration, ...(params.audio ? { audio: true } : {}) };
  } else {
    createParams = { model, promptImage: body.imageUrl, promptText: videoPrompt, ratio: "1280:720", duration };
  }

  try {
    const client = new RunwayML({ apiKey, timeout: 25_000 });
    const task = await client.imageToVideo.create(createParams);
    // Balance snapshot is best-effort — don't let it block or fail the generation
    const creditsBefore = await client.organization.retrieve().then(r => r.creditBalance).catch(() => null);
    return NextResponse.json({ taskId: task.id, creditsBefore });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to start video generation";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
