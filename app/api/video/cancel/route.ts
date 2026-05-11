import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";

export const maxDuration = 15;

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("id");

  if (!taskId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const apiKey = req.headers.get("x-runway-key") ?? process.env.RUNWAYML_API_SECRET ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "No Runway API key provided." }, { status: 401 });
  }

  try {
    const client = new RunwayML({ apiKey, timeout: 10_000 });
    await client.tasks.delete(taskId);
    return NextResponse.json({ cancelled: true });
  } catch (e: unknown) {
    // Don't fail hard — if it's already done/gone, that's fine
    const msg = e instanceof Error ? e.message : "Cancel failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
