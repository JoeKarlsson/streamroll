import type { IntroSettings } from "@/hooks/useIntroSettings";
import { INPUT_CLASS } from "./classes";

export function ServiceNameFields({ settings, isGenerating }: { settings: IntroSettings; isGenerating: boolean }) {
  const { name, setName, tagline, setTagline, shuffleTagline } = settings;
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="service-name" className="block text-sm font-medium text-neutral-300 mb-2">Service name</label>
        <input
          id="service-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Joeflix, Cinema Corner, The Movie Vault"
          maxLength={30}
          disabled={isGenerating}
          className={INPUT_CLASS}
        />
        <div className="flex justify-between mt-1">
          <span className="text-sm text-neutral-400">Short names render best</span>
          <span className={`text-sm tabular-nums ${name.length > 18 ? "text-amber-500" : "text-neutral-400"}`}>{name.length}/30</span>
        </div>
      </div>
      <div>
        <label htmlFor="tagline" className="block text-sm font-medium text-neutral-300 mb-2">
          Tagline <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <div className="relative">
          <input
            id="tagline"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Where stories come alive"
            maxLength={60}
            disabled={isGenerating}
            className={`${INPUT_CLASS} pr-12`}
          />
          <button
            type="button"
            onClick={shuffleTagline}
            disabled={isGenerating}
            aria-label="Shuffle tagline"
            title="Shuffle tagline"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-lg text-neutral-400 hover:text-white transition-colors disabled:opacity-40 text-base leading-none focus-visible:outline-2 focus-visible:outline-white"
          >
            <span aria-hidden="true">↺</span>
          </button>
        </div>
      </div>
    </section>
  );
}
