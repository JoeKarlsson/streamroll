"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useApiKey } from "@/hooks/useApiKey";
import { LINKS } from "@/lib/links";

const STEPS = [
  {
    n: 1,
    title: "Create a Runway account",
    body: "Sign up on the Runway developer portal. The account and API key are free, but generating uses paid Runway credits (Runway no longer gives free trial credits), so buy credits or add a payment method first.",
    cta: { label: "Sign up at dev.runwayml.com", href: LINKS.runwaySignup },
  },
  {
    n: 2,
    title: "Generate an API key",
    body: "Once logged in, go to Settings, then API Keys, and click “Create new key”. Give it any name, like “StreamRoll”.",
    cta: { label: "Open API keys", href: LINKS.runwayApiKeys },
  },
  {
    n: 3,
    title: "Paste your key below",
    body: "No StreamRoll account needed. Each intro you generate uses credits from your own Runway account.",
    cta: null,
  },
];

// Every style drawn on a canvas skips Runway image generation (CANVAS_STYLES in lib/styles.ts).
const CANVAS_STYLE_NAMES = "Netflix, Minimal, Adult Swim, DreamWorks, TriStar, Hanna-Barbera, Columbia, MST3K, Emergency Broadcast";

// Mirrors IMAGE_MODELS and VIDEO_MODELS in lib/models.ts.
const CREDIT_COSTS = [
  { item: "Title card, Gen4 Image", cost: "~30 cr" },
  { item: "Title card, Gen4 Turbo", cost: "~15 cr" },
  { item: "Title card, GPT Image 2", cost: "~40 cr" },
  { item: "Title card, Gemini Image 3 Pro", cost: "~20 cr" },
  { item: "Title card, Gemini 2.5 Flash", cost: "~10 cr" },
  { item: `Title card, canvas styles (${CANVAS_STYLE_NAMES})`, cost: "0 cr" },
  { item: "2s video, Gen4 Turbo", cost: "10 cr" },
  { item: "5s video, Gen4 Turbo", cost: "25 cr" },
  { item: "5s video, Gen4.5", cost: "60 cr" },
  { item: "10s video, Gen4 Turbo", cost: "50 cr" },
];

export default function SetupPage() {
  const { key, saveKey, clearKey, loaded } = useApiKey();
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [remember, setRemember] = useState(true);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const savedKeyRef = useRef<HTMLDivElement>(null);
  // Set by Save and Remove so focus lands on the element that replaces the one just used.
  const focusAfterChange = useRef<"saved" | "input" | null>(null);

  const hasKey = loaded && !!key;

  useEffect(() => {
    if (focusAfterChange.current === "saved") savedKeyRef.current?.focus();
    if (focusAfterChange.current === "input") keyInputRef.current?.focus();
    focusAfterChange.current = null;
  }, [hasKey]);

  function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim()) return;
    focusAfterChange.current = "saved";
    saveKey(input.trim(), { remember });
    setSaved(true);
    setInput("");
  }

  function handleClear() {
    focusAfterChange.current = "input";
    clearKey();
    setSaved(false);
  }

  return (
    <main id="main-content" className="flex-1 bg-background text-white flex flex-col items-center pt-10 pb-16">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-3xl font-bold mb-3">Get started with Runway</h1>
        <p className="max-w-[65ch] text-neutral-400 leading-relaxed mb-12">
          StreamRoll uses the{" "}
          <a
            href={LINKS.runwayDocs}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white underline underline-offset-2 hover:text-neutral-300"
          >
            Runway API
          </a>{" "}
          to generate your intros. You’ll need your own API key; each generation uses credits from your account.
        </p>

        <ol className="list-decimal pl-6 space-y-10 mb-12 marker:text-neutral-500 marker:font-semibold">
          {STEPS.map((step) => (
            <li key={step.n} className="min-w-0">
              <h2 className="font-semibold mb-1">{step.title}</h2>
              <p className="max-w-[65ch] text-neutral-400 leading-relaxed mb-3">{step.body}</p>
              {step.cta && (
                <a
                  href={step.cta.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center min-h-11 text-sm text-white bg-neutral-800 hover:bg-neutral-700 px-4 rounded-lg transition-colors"
                >
                  {step.cta.label}
                </a>
              )}

              {step.n === 3 && loaded && (
                <div className="space-y-3">
                  {hasKey ? (
                    <div
                      ref={savedKeyRef}
                      tabIndex={-1}
                      className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                    >
                      <span className="text-green-400 text-sm whitespace-nowrap">✓ API key saved</span>
                      <span className="flex-1 min-w-0 text-neutral-500 text-sm truncate">
                        {key.slice(0, 12)}••••••••••••••••
                      </span>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="-my-3 -mr-3 min-h-11 px-3 text-sm text-neutral-400 hover:text-red-400 transition-colors shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSave} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          ref={keyInputRef}
                          type="password"
                          value={input}
                          onChange={(e) => { setInput(e.target.value); setSaved(false); }}
                          placeholder="key_…"
                          aria-label="Runway API key"
                          aria-describedby="api-key-privacy"
                          autoComplete="off"
                          className="flex-1 min-w-0 min-h-11 bg-neutral-900 border border-neutral-700 rounded-lg px-4 text-white text-base sm:text-sm placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                        />
                        <button
                          type="submit"
                          disabled={!input.trim()}
                          className="min-h-11 bg-white text-black font-semibold px-5 rounded-lg hover:bg-neutral-200 transition-[color,background-color,opacity,scale] duration-75 ease-out enabled:active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed text-sm shrink-0"
                        >
                          Save
                        </button>
                      </div>
                      <label className="flex items-center gap-2 min-h-11 w-fit cursor-pointer text-sm text-neutral-300">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="w-4 h-4"
                        />
                        Remember this key on this device
                      </label>
                    </form>
                  )}

                  <p role="status" className="text-sm text-green-400 empty:hidden">
                    {saved ? "Key saved. Your browser is ready to generate." : ""}
                  </p>

                  <p id="api-key-privacy" className="max-w-[65ch] text-sm text-neutral-500">
                    Your key stays in your browser. Each request passes it through this site’s server to Runway, which
                    never saves or logs it. Unchecked, the key is forgotten when you close this tab.
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>

        {hasKey && (
          <Link
            href="/"
            className="w-full flex items-center justify-center min-h-11 bg-white text-black font-semibold py-3 rounded-lg hover:bg-neutral-200 transition-colors text-base"
          >
            Start generating
          </Link>
        )}

        <section aria-labelledby="credit-costs-heading" className="mt-12">
          <h2 id="credit-costs-heading" className="font-semibold mb-3">Estimated credit costs</h2>
          <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm text-neutral-400">
            {CREDIT_COSTS.map((row) => (
              <div key={row.item} className="contents">
                <dt>{row.item}</dt>
                <dd className="text-right whitespace-nowrap tabular-nums text-neutral-300">{row.cost}</dd>
              </div>
            ))}
          </dl>
          <a
            href={LINKS.runwayPricing}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center min-h-11 mt-2 text-sm text-neutral-400 hover:text-white underline underline-offset-2 transition-colors"
          >
            Runway’s full pricing guide
          </a>
        </section>
      </div>
    </main>
  );
}
