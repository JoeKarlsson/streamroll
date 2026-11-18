import { LINKS } from "@/lib/links";
import { PLATFORMS } from "@/lib/platforms";
import { KeyStatusLine } from "./KeyStatusLine";

/** Works with + key status, over the bottom fade of the video */
export function WorksWith() {
  return (
    <div className="w-full max-w-2xl px-4 -mt-10 z-20 relative flex flex-col items-center gap-2 pb-8 text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
        <span className="text-sm text-neutral-400">Works with</span>
        {PLATFORMS.map((p) => (
          <div key={p.name} className="flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/logos/${p.slug}.svg`} alt="" aria-hidden="true" width={16} height={16} loading="lazy" />
            <span className="text-sm font-medium" style={{ color: p.color }}>{p.name}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 text-sm text-neutral-400">
        <span>Community:</span>
        {[
          { href: LINKS.prerollSub, label: "r/plexprerolls" },
          { href: LINKS.plexSub, label: "r/PleX" },
          { href: LINKS.jellyfinSub, label: "r/jellyfin" },
          { href: LINKS.plexForums, label: "Plex Forums" },
        ].map((l) => (
          <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center whitespace-nowrap underline underline-offset-2 hover:text-white transition-colors">
            {l.label}
          </a>
        ))}
      </div>

      <p className="text-sm text-neutral-400">No install, no StreamRoll account needed</p>

      <KeyStatusLine />
    </div>
  );
}
