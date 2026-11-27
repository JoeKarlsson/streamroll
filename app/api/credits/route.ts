import { NextRequest, NextResponse } from "next/server";
import RunwayML from "@runwayml/sdk";
import { runwayErrorResponse } from "@/lib/runwayError";

export const maxDuration = 15;

/** The saved key's Runway credit balance (GET /v1/organization), so the page can warn before a paid task fails. */
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-runway-key") ?? "";
  if (!apiKey) {
    return NextResponse.json({ error: "No Runway API key provided." }, { status: 401 });
  }

  try {
    const { creditBalance } = await new RunwayML({ apiKey, timeout: 10_000 }).organization.retrieve();
    return NextResponse.json({ creditBalance });
  } catch (e: unknown) {
    return runwayErrorResponse(e, "Credit balance lookup failed");
  }
}
