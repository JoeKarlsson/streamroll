"use client";

import { useState } from "react";
import Link from "next/link";
import { useApiKey } from "@/hooks/useApiKey";
import { LINKS } from "@/lib/links";

const STEPS = [
  {
    n: 1,
    title: "Create a free Runway account",
    body: "Head to the Runway developer portal and sign up. The free tier gives you credits to start experimenting right away.",
    cta: { label: "Sign up at dev.runwayml.com →", href: LINKS.runwaySignup },
  },
  {
    n: 2,
    title: "Generate an API key",
    body: 'Once logged in, go to Settings, then API Keys, and click "Create new key". Give it any name like "StreamRoll".',
    cta: { label: "Open API Keys →", href: LINKS.runwayApiKeys },
  },
  {
    n: 3,
    title: "Paste your key below",
    body: "Your key stays in your browser only. It is never stored on a server. Each video you generate uses credits from your own account.",
    cta: null,
  },
];

export default function SetupPage() {
  const { key, saveKey, clearKey, loaded } = useApiKey();
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!input.trim()) return;
    saveKey(input.trim());
    setSaved(true);
    setInput("");
  }

  function handleClear() {
    clearKey();
    setSaved(false);
  }

  const hasKey = loaded && !!key;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-xl">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-10"
        >
          ← Back to StreamRoll
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Get started with Runway</h1>
          <p className="text-neutral-400">
            StreamRoll uses the{" "}
            <a
              href="https://docs.dev.runwayml.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline underline-offset-2 hover:text-neutral-300"
            >
              Runway API
            </a>{" "}
            to generate your intros. You&apos;ll need your own API key; each generation uses
            credits from your account.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-10">
          {STEPS.map((step) => (
            <div key={step.n} className="flex gap-4">
              <div className="shrink-0 w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-400">
                {step.n}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="font-medium mb-1">{step.title}</div>
                <p className="text-sm text-neutral-400 leading-relaxed mb-3">{step.body}</p>
                {step.cta && (
                  <a
                    href={step.cta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-white bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    {step.cta.label}
                  </a>
                )}

                {/* Key input on step 3 */}
                {step.n === 3 && loaded && (
                  <div className="space-y-3">
                    {hasKey ? (
                      <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3">
                        <span className="text-green-400 text-sm">✓ API key saved</span>
                        <span className="flex-1 text-neutral-600 text-sm font-mono truncate">
                          {key.slice(0, 12)}••••••••••••••••
                        </span>
                        <button
                          onClick={handleClear}
                          className="text-xs text-neutral-500 hover:text-red-400 transition-colors shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={input}
                          onChange={(e) => { setInput(e.target.value); setSaved(false); }}
                          placeholder="key_••••••••••••••••••••••"
                          aria-label="Runway API key"
                          aria-describedby="api-key-privacy"
                          autoComplete="off"
                          className="flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm placeholder:text-neutral-700 focus:outline-none focus:border-neutral-400"
                          onKeyDown={(e) => e.key === "Enter" && handleSave()}
                        />
                        <button
                          onClick={handleSave}
                          disabled={!input.trim()}
                          className="bg-white text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm shrink-0"
                        >
                          Save
                        </button>
                      </div>
                    )}

                    {saved && (
                      <p className="text-sm text-green-400">
                        Key saved! Your browser is ready to generate.
                      </p>
                    )}

                    <p id="api-key-privacy" className="text-xs text-neutral-600">
                      Your key is stored only in your browser&apos;s localStorage and sent directly
                      to Runway&apos;s API. It is never logged or stored on any server.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {hasKey && (
          <Link
            href="/"
            className="w-full flex items-center justify-center bg-white text-black font-semibold py-3 rounded-lg hover:bg-neutral-200 transition-colors text-base"
          >
            Start generating →
          </Link>
        )}

        {/* Pricing note */}
        <div className="mt-10 p-4 rounded-lg border border-neutral-800 bg-neutral-900/50 text-sm text-neutral-400 space-y-1">
          <div className="font-medium text-neutral-300">Estimated credit costs</div>
          <div className="flex justify-between"><span>Logo image (Gen4 Image)</span><span className="text-neutral-500">~30 cr</span></div>
          <div className="flex justify-between"><span>Logo image (Gen4 Image Turbo)</span><span className="text-neutral-500">~15 cr</span></div>
          <div className="flex justify-between"><span>Logo image (Gemini 2.5 Flash)</span><span className="text-neutral-500">~10 cr</span></div>
          <div className="flex justify-between text-neutral-600"><span>canvas styles (Adult Swim, Minimal, Prestige)</span><span>0 cr</span></div>
          <div className="mt-2 flex justify-between"><span>2s video (Gen4 Turbo)</span><span className="text-neutral-500">10 cr</span></div>
          <div className="flex justify-between"><span>5s video (Gen4 Turbo)</span><span className="text-neutral-500">25 cr</span></div>
          <div className="flex justify-between"><span>5s video (Gen4.5)</span><span className="text-neutral-500">60 cr</span></div>
          <div className="flex justify-between"><span>10s video (Gen4 Turbo)</span><span className="text-neutral-500">50 cr</span></div>
          <a
            href={LINKS.runwayPricing}
            target="_blank"
            rel="noopener noreferrer"
            className="block pt-1 text-neutral-500 hover:text-neutral-300 underline underline-offset-2 transition-colors"
          >
            Full pricing guide →
          </a>
        </div>
      </div>
    </main>
  );
}
