import { NextRequest, NextResponse } from "next/server";
import { generateIntroVideo, type GenerationParams } from "@/lib/runway";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.imageUrl) {
    return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
  }

  const apiKey = req.headers.get("x-runway-key") ?? process.env.RUNWAYML_API_SECRET ?? "";
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
  };

  try {
    const videoUrl = await generateIntroVideo(body.imageUrl, params, apiKey);
    return NextResponse.json({ videoUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Video generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
