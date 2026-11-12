import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { generateLogoImage, type GenerationParams } from "@/lib/runway";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const apiKey = req.headers.get("x-runway-key") ?? "";
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
    const client = new RunwayML({ apiKey, timeout: 25_000 });
    // Balance snapshots are best-effort: a failed lookup must not throw away an image already paid for
    const balance = () => client.organization.retrieve().then(r => r.creditBalance).catch(() => null);
    const [before, imageUrl] = await Promise.all([
      balance(),
      generateLogoImage(params, apiKey, body.imagePromptOverride ?? undefined),
    ]);
    const after = await balance();
    const creditCost = before !== null && after !== null ? Math.max(0, before - after) : 0;
    return NextResponse.json({ imageUrl, creditCost });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Image generation failed";
    // TaskFailedError carries Runway's failureCode (e.g. SAFETY.INPUT.TEXT for a moderation rejection)
    const code = (e as { taskDetails?: { failureCode?: string } })?.taskDetails?.failureCode;
    return NextResponse.json({ error: code ? `${msg} (${code})` : msg }, { status: 500 });
  }
}
