import type { IntroSettings } from "@/hooks/useIntroSettings";
import type { GenMode } from "@/hooks/useIntroSettings";

/** Title card only, or the full intro: AI path only. */
export function GenModePicker({ settings, isGenerating, accentColor }: { settings: IntroSettings; isGenerating: boolean; accentColor: string }) {
  const { genMode, setGenMode } = settings;
  return (
    <div role="group" aria-label="What to generate" className="flex gap-2">
      {(["image-only", "full"] as GenMode[]).map((m) => (
        <button
          type="button"
          key={m}
          aria-pressed={genMode === m}
          onClick={() => setGenMode(m)}
          disabled={isGenerating}
          className="flex-1 min-w-0 py-3 px-3 rounded-lg border text-left transition-colors disabled:opacity-50"
          style={genMode === m
            ? { borderColor: accentColor, backgroundColor: accentColor + "15", color: accentColor }
            : { borderColor: "#262626", color: "#a3a3a3" }
          }
        >
          <div className={`text-sm ${genMode === m ? "font-semibold" : "font-medium"}`}>
            {genMode === m && <span aria-hidden="true">✓ </span>}
            {m === "image-only" ? "Title card only" : "Full intro"}
          </div>
          <div className="text-sm mt-0.5 text-neutral-400">
            {m === "image-only"
              ? "Generate the title card, then choose what to do next"
              : "Title card and animated video, start to finish"}
          </div>
        </button>
      ))}
    </div>
  );
}
