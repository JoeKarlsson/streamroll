"use client";

import { useEffect, useState } from "react";
import { LINKS } from "@/lib/links";

/**
 * Warns when the saved Runway key has 0 credits, so the visitor tops up before Generate fails.
 * A failed lookup shows nothing: Generate still reports a credits error itself.
 */
export function NoCreditsNotice({ apiKey }: { apiKey: string }) {
  const [balance, setBalance] = useState<{ key: string; credits: number } | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    const controller = new AbortController();
    fetch("/api/credits", { headers: { "x-runway-key": apiKey }, signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { creditBalance?: unknown } | null) => {
        if (typeof body?.creditBalance === "number") setBalance({ key: apiKey, credits: body.creditBalance });
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) console.warn("Runway credit check failed", e);
      });
    return () => controller.abort();
  }, [apiKey]);

  if (!balance || balance.key !== apiKey || balance.credits > 0) return null;
  return (
    <p role="alert" className="rounded-lg border border-amber-700 bg-amber-950 px-3 py-2 text-sm text-amber-200 max-w-[65ch]">
      This Runway key has no credits, so generating will fail. Add credits in the{" "}
      <a href={LINKS.runwaySignup} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
        Runway developer portal
      </a>
      , then reload this page.
    </p>
  );
}
