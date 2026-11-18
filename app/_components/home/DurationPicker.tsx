import type { IntroSettings } from "@/hooks/useIntroSettings";
import { durationsFor } from "@/lib/models";

export function DurationPicker({ settings, isGenerating, accentColor, crPerSec, imageCrCost }: {
  settings: IntroSettings; isGenerating: boolean; accentColor: string; crPerSec: number; imageCrCost: number;
}) {
  const { duration, setDuration, videoModel } = settings;
  return (
    <section aria-labelledby="duration-heading">
      <h2 id="duration-heading" className="text-sm font-medium text-neutral-300 mb-3">Duration</h2>
      <div role="group" aria-labelledby="duration-heading" className="flex gap-2">
        {durationsFor(videoModel).map((d) => {
          const active = duration === d.value;
          return (
            <button
              type="button"
              key={d.value}
              aria-pressed={active}
              onClick={() => setDuration(d.value)}
              disabled={isGenerating}
              className="flex-1 min-w-0 flex flex-col items-center gap-1 py-3 rounded-lg border text-xs transition-colors disabled:opacity-50"
              style={active
                ? { borderColor: accentColor, backgroundColor: accentColor + "15" }
                : { borderColor: "#262626" }
              }
            >
              <span className="text-base font-bold" style={active ? { color: accentColor } : { color: "#e5e7eb" }}>
                {active && <span aria-hidden="true">✓ </span>}{d.label}
              </span>
              <span className="text-neutral-400 whitespace-nowrap">
                {d.value * crPerSec + imageCrCost} cr<span className="hidden sm:inline">, {d.est}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
