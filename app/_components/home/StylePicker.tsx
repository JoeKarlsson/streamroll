import type { IntroSettings } from "@/hooks/useIntroSettings";
import { useState } from "react";
import { INSPO, STYLES, STYLE_COLOR, BLANK_SLATE, THEME_GROUPS, type Preset } from "@/lib/styles";
import { Collapsible } from "../Collapsible";
import { ThemeTile } from "./ThemeTile";

export function StylePicker({ settings, isGenerating, onPreset }: {
  settings: IntroSettings;
  isGenerating: boolean;
  onPreset: (preset: Preset) => void;
}) {
  const { name, style, logoMode, chooseStyle } = settings;
  const [showThemes, setShowThemes] = useState(false);
  const activeStyle = STYLES.find(s => s.id === style);
  return (
    <section aria-labelledby="style-heading">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 id="style-heading" className="text-sm font-medium text-neutral-300">
          {logoMode === "upload" ? "Motion style" : "Style"}
        </h2>
        <button
          type="button"
          onClick={() => onPreset(INSPO[Math.floor(Math.random() * INSPO.length)]!)}
          disabled={isGenerating}
          className="min-h-11 px-3 text-sm text-neutral-300 hover:text-white border border-neutral-700 hover:border-neutral-500 rounded-lg transition-colors disabled:opacity-40"
        >
          Surprise me
        </button>
      </div>
      <div role="group" aria-labelledby="style-heading" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {STYLES.map((s) => (
          <ThemeTile
            key={s.id}
            label={s.label}
            desc={s.desc}
            image={s.image!}
            active={style === s.id && name !== "My Service"}
            color={STYLE_COLOR[s.id]}
            disabled={isGenerating}
            onClick={() => chooseStyle(s.id)}
          />
        ))}
        <ThemeTile
          label="Blank Slate"
          desc="Cinematic base, your name and brand"
          image="/previews/blank-slate.jpg"
          active={name === "My Service" && style === "cinematic"}
          color={STYLE_COLOR.cinematic}
          disabled={isGenerating}
          onClick={() => onPreset(BLANK_SLATE)}
        />
      </div>
      {activeStyle && (
        <p className="mt-2 text-sm text-neutral-400">
          <span className="text-neutral-200">{activeStyle.label}:</span> {activeStyle.desc}. {activeStyle.tip}
        </p>
      )}

      <button
        type="button"
        aria-expanded={showThemes}
        aria-controls="more-themes"
        onClick={() => setShowThemes((v) => !v)}
        className="mt-6 min-h-11 inline-flex items-center gap-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
      >
        <span aria-hidden="true" className={`inline-block text-neutral-400 transition-transform ${showThemes ? "rotate-90" : ""}`}>▸</span>
        More themes
      </button>
      <Collapsible id="more-themes" open={showThemes}>
        <div className="pt-3 space-y-6">
          {THEME_GROUPS.map((group) => {
            const activePreset = group.presets.find((p) => name === p.name && style === p.style);
            return (
              <section key={group.id} aria-labelledby={`${group.id}-heading`}>
                <h3 id={`${group.id}-heading`} className="text-sm font-medium text-neutral-300 mb-2">{group.title}</h3>
                <div role="group" aria-labelledby={`${group.id}-heading`} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {group.presets.map((p) => (
                    <ThemeTile
                      key={p.name}
                      label={p.desc}
                      desc={p.vibe}
                      image={p.image!}
                      active={p === activePreset}
                      color={STYLE_COLOR[p.style]}
                      disabled={isGenerating}
                      onClick={() => onPreset(p)}
                    />
                  ))}
                </div>
                {activePreset && (
                  <p className="mt-2 text-sm text-neutral-400">
                    <span className="text-neutral-200">{activePreset.desc}:</span> {activePreset.vibe}
                  </p>
                )}
              </section>
            );
          })}
        </div>
      </Collapsible>
    </section>
  );
}
