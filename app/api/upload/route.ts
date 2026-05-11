import { NextRequest, NextResponse } from "next/server";
import RunwayML, { toFile } from "@runwayml/sdk";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-runway-key") ?? process.env.RUNWAYML_API_SECRET ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "No Runway API key provided." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` },
      { status: 413 }
    );
  }

  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type "${file.type}". Upload a PNG, JPEG, or WebP.` },
      { status: 415 }
    );
  }

  const client = new RunwayML({ apiKey, timeout: 60_000 });

  try {
    const uploadable = await toFile(file, file.name, { type: file.type });
    const result = await client.uploads.createEphemeral({ file: uploadable });
    return NextResponse.json({ uri: result.uri });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
