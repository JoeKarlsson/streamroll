import { useState } from "react";
import { PLATFORMS } from "@/lib/platforms";
import { Collapsible } from "../Collapsible";

/** How to add the intro to Plex, Jellyfin or Emby. */
export function InstallGuide() {
  const [showInstall, setShowInstall] = useState(false);
  return (
    <div className="rounded-xl border border-neutral-800 overflow-hidden">
      <h3>
        <button
          type="button"
          aria-expanded={showInstall}
          aria-controls="install-guide"
          onClick={() => setShowInstall((v) => !v)}
          className="w-full min-h-11 flex items-center justify-between gap-3 px-4 py-3 bg-neutral-900 text-left text-sm text-neutral-300 hover:text-white transition-colors"
        >
          <span>How to add this to your media server</span>
          <span aria-hidden="true" className={`inline-block text-neutral-400 transition-transform ${showInstall ? "rotate-90" : ""}`}>▸</span>
        </button>
      </h3>
      <Collapsible id="install-guide" open={showInstall}>
        <div className="divide-y divide-neutral-800">
          {PLATFORMS.map((p) => (
            <div key={p.name} className="px-4 py-3 flex flex-wrap gap-3 items-start bg-neutral-950">
              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/logos/${p.slug}.svg`} alt="" aria-hidden="true" width={12} height={12} />
                <span className="text-sm font-bold" style={{ color: p.color }}>{p.name}</span>
              </div>
              <div className="flex-1 min-w-48">
                <p className="text-sm text-neutral-300 leading-relaxed">{p.howTo}</p>
                <a
                  href={p.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm inline-flex items-center min-h-11 underline underline-offset-2 transition-colors hover:text-white"
                  style={{ color: p.color }}
                >
                  {p.name} docs
                </a>
              </div>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}
