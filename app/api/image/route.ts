import { NextRequest, NextResponse } from "next/server";
import { generateLogoImage, type GenerationParams } from "@/lib/runway";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const apiKey = req.headers.get("x-runway-key") ?? process.env.RUNWAYML_API_SECRET ?? "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Runway API key provided. Visit /setup to add yours." },
      { status: 401 }
    );
  }

  const params: GenerationParams = {
    name: body.name.trim(),
    style: body.style ?? "cinematic",
    tagline: body.tagline,
    duration: body.duration ?? 5,
    imageModel: body.imageModel,
    treatment: body.treatment,
    primaryColor: body.primaryColor,
    customNotes: body.customNotes,
  };

  try {
    const imageUrl = await generateLogoImage(params, apiKey, body.imagePromptOverride ?? undefined);
    return NextResponse.json({ imageUrl });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Image generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
