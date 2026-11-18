"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/plausible";

const EXTENSION_URL = /(chrome|moz|safari-web)-extension:\/\//;
// The site creates no Trusted Types policies, so a policy error always comes from an extension.
const TRUSTED_TYPES_POLICY = /trusted-?types-?policy/i;

function errorOf(event: ErrorEvent | PromiseRejectionEvent): unknown {
  return "reason" in event ? event.reason : event.error ?? event.message;
}

export function jsErrorMessage(event: ErrorEvent | PromiseRejectionEvent): string {
  const reason = errorOf(event);
  const message = reason instanceof Error ? reason.message : String(reason);
  return message.slice(0, 200);
}

/** Props for the JS Error event, or null for an error a browser extension caused. */
function jsErrorProps(event: ErrorEvent | PromiseRejectionEvent): Record<string, string> | null {
  const reason = errorOf(event);
  const stack = reason instanceof Error ? reason.stack ?? "" : "";
  const filename = "filename" in event ? event.filename : "";
  const message = jsErrorMessage(event);
  if (EXTENSION_URL.test(filename) || EXTENSION_URL.test(stack) || TRUSTED_TYPES_POLICY.test(message)) return null;
  return {
    message,
    source: filename || (event.type === "unhandledrejection" ? "promise" : "unknown"),
    path: window.location.pathname,
  };
}

// Sends each page's first uncaught error or unhandled rejection to Plausible as a "JS Error" event.
export function JsErrorTracker() {
  // The tracker lives in the root layout; a new path re-arms it for the next page.
  const pathname = usePathname();
  useEffect(() => {
    let reported = false;
    const report = (event: ErrorEvent | PromiseRejectionEvent) => {
      if (reported) return;
      const props = jsErrorProps(event);
      if (!props) return;
      reported = true;
      track("JS Error", props);
    };
    window.addEventListener("error", report);
    window.addEventListener("unhandledrejection", report);
    return () => {
      window.removeEventListener("error", report);
      window.removeEventListener("unhandledrejection", report);
    };
  }, [pathname]);
  return null;
}
