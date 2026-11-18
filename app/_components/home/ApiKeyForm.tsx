import { useEffect, useRef, useState, type RefObject } from "react";
import { useApiKey } from "@/hooks/useApiKey";
import { LINKS } from "@/lib/links";
import { INPUT_CLASS, PRESS } from "./classes";

/** Inline API key entry, or the saved key's status with a way to remove it. */
export function ApiKeyForm({ apiKeyInputRef }: { apiKeyInputRef: RefObject<HTMLInputElement | null> }) {
  const { key: apiKey, saveKey, clearKey } = useApiKey();
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [rememberKey, setRememberKey] = useState(true);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const apiKeyStatusRef = useRef<HTMLDivElement>(null);
  const keyFocusAfterChangeRef = useRef(false);

  // After saving or removing the key, the control that was focused is gone: move focus to its replacement.
  useEffect(() => {
    if (!keyFocusAfterChangeRef.current) return;
    keyFocusAfterChangeRef.current = false;
    (apiKey ? apiKeyStatusRef.current : apiKeyInputRef.current)?.focus();
  }, [apiKey, apiKeyInputRef]);

  function saveApiKeyFromInput() {
    if (!apiKeyInput.trim()) return;
    keyFocusAfterChangeRef.current = true;
    saveKey(apiKeyInput, { remember: rememberKey });
    setApiKeyInput("");
    setApiKeySaved(true);
  }

  function removeApiKey() {
    keyFocusAfterChangeRef.current = true;
    clearKey();
    setApiKeySaved(false);
  }

  return (
    <section>
      {apiKey ? (
        <div
          ref={apiKeyStatusRef}
          tabIndex={-1}
          className="flex items-center gap-3 px-3 py-1 rounded-lg border focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          style={{ borderColor: "#14532d", backgroundColor: "#052e1620" }}
        >
          <p role="status" className="text-sm text-green-400 flex-1">
            {apiKeySaved ? "Key saved. You’re ready to generate." : "Runway API key active"}
          </p>
          <button type="button" onClick={removeApiKey} className="min-h-11 px-2 text-sm text-neutral-300 hover:text-white transition-colors shrink-0">
            Remove key
          </button>
        </div>
      ) : (
        <form
          className="space-y-2"
          onSubmit={(e) => { e.preventDefault(); saveApiKeyFromInput(); }}
        >
          <label htmlFor="runway-api-key" className="block text-sm font-medium text-neutral-300">
            Runway API key <span className="text-neutral-400 font-normal">(required to generate)</span>
          </label>
          <div className="flex gap-2">
            <input
              id="runway-api-key"
              ref={apiKeyInputRef}
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="key_••••••••••••••••••••••"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              className={`${INPUT_CLASS} flex-1 min-w-0 font-mono`}
            />
            <button
              type="submit"
              disabled={!apiKeyInput.trim()}
              className={`min-h-11 px-4 rounded-lg text-sm font-semibold bg-white text-black hover:bg-neutral-200 ${PRESS} disabled:opacity-40 disabled:cursor-not-allowed shrink-0`}
            >
              Save
            </button>
          </div>
          <label className="flex items-center gap-2 min-h-11 w-fit cursor-pointer text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={rememberKey}
              onChange={(e) => setRememberKey(e.target.checked)}
              className="w-4 h-4"
            />
            Remember this key on this device
          </label>
          <p className="text-sm text-neutral-400 max-w-[65ch]">
            Your key stays in your browser. Each request passes it through this site’s server to Runway; the server never saves or logs it. Unchecked, the key is forgotten when you close this tab.{" "}
            <a href={LINKS.runwayApiKeys} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white transition-colors">Get a Runway API key</a>
          </p>
        </form>
      )}
    </section>
  );
}
