import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get("id");

  if (!taskId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const apiKey = req.headers.get("x-runway-key") ?? "";
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Runway API key provided." },
      { status: 401 }
    );
  }

  try {
    const client = new RunwayML({ apiKey, timeout: 25_000 });
    const task = await client.tasks.retrieve(taskId);

    if (task.status === "SUCCEEDED") {
      return NextResponse.json({ status: "SUCCEEDED", output: task.output[0] });
    }
    if (task.status === "FAILED") {
      return NextResponse.json({ status: "FAILED", failure: task.failure });
    }
    if (task.status === "RUNNING") {
      return NextResponse.json({ status: "RUNNING", progress: task.progress ?? null });
    }
    // PENDING, THROTTLED, CANCELLED
    return NextResponse.json({ status: task.status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Status check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
