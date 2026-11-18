"use client";

import { useEffect } from "react";
import { track } from "@/lib/plausible";

export function jsErrorMessage(event: ErrorEvent | PromiseRejectionEvent): string {
  const reason = "reason" in event ? event.reason : event.error ?? event.message;
  const message = reason instanceof Error ? reason.message : String(reason);
  return message.slice(0, 200);
}

// Sends uncaught errors and unhandled promise rejections to Plausible as a "JS Error" event.
export function JsErrorTracker() {
  useEffect(() => {
    const report = (event: ErrorEvent | PromiseRejectionEvent) =>
      track("JS Error", { message: jsErrorMessage(event) });
    window.addEventListener("error", report);
    window.addEventListener("unhandledrejection", report);
    return () => {
      window.removeEventListener("error", report);
      window.removeEventListener("unhandledrejection", report);
    };
  }, []);
  return null;
}
