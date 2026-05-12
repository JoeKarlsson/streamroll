"use client";

import { useState } from "react";

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <span className="text-xs text-neutral-500">{lang}</span>
        <button
          onClick={copy}
          aria-label={copied ? "Copied to clipboard" : "Copy code"}
          aria-live="polite"
          className="text-xs text-neutral-600 hover:text-neutral-300 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs text-neutral-300 font-mono leading-relaxed overflow-x-auto bg-neutral-950 whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
