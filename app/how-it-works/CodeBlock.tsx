"use client";

import { useRef, useState } from "react";

type CopyState = "idle" | "copied" | "failed";

const LABELS: Record<CopyState, string> = { idle: "Copy", copied: "Copied", failed: "Copy failed" };
const ANNOUNCEMENTS: Record<CopyState, string> = { idle: "", copied: "Copied to clipboard", failed: "Copy failed" };

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState("copied");
    } catch {
      // The clipboard can be blocked by permissions or an insecure context; say so instead of claiming success.
      setCopyState("failed");
    }
    // A second click restarts the 2s window instead of being cut short by the first click's timer.
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState("idle"), 2000);
  }

  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <span className="text-xs text-neutral-500">{lang}</span>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${lang} code`}
          className="-my-3 -mr-3 px-3 min-h-11 grid items-center text-xs text-neutral-400 hover:text-white transition-colors"
        >
          {/* Every label sits in the same grid cell so the button keeps the widest label's width and never jumps. */}
          {(Object.keys(LABELS) as CopyState[]).map((state) => (
            <span
              key={state}
              aria-hidden="true"
              className={`col-start-1 row-start-1 text-right transition-opacity duration-150 ${state === copyState ? "opacity-100" : "opacity-0"}`}
            >
              {LABELS[state]}
            </span>
          ))}
        </button>
        <span role="status" className="sr-only">{ANNOUNCEMENTS[copyState]}</span>
      </div>
      {/* Focusable so keyboard users can scroll code that overflows on narrow screens. */}
      <pre
        tabIndex={0}
        aria-label={`${lang} code`}
        className="p-4 text-xs text-neutral-300 font-mono leading-relaxed overflow-x-auto bg-neutral-950 whitespace-pre focus-visible:outline-2 focus-visible:outline-white focus-visible:-outline-offset-2"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
