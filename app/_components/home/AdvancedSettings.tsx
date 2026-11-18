import type { IntroSettings } from "@/hooks/useIntroSettings";
import { useState } from "react";
import { STYLE_DEFAULTS } from "@/lib/styles";
import { COLOR_SWATCHES, IMAGE_MODELS, TREATMENTS, VIDEO_MODELS, isVeoModel } from "@/lib/models";
import { Collapsible } from "../Collapsible";
import { ModelOption } from "./ModelOption";
import { INPUT_CLASS } from "./classes";

export function AdvancedSettings({ settings, isGenerating, accentColor }: { settings: IntroSettings; isGenerating: boolean; accentColor: string }) {
  const {
    style, imageModel, setImageModel, videoModel, changeVideoModel, audio, setAudio, treatment, setTreatment,
    primaryColor, setPrimaryColor, customNotes, setCustomNotes,
  } = settings;
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <section aria-labelledby="advanced-heading">
      <h2 id="advanced-heading">
        <button
          type="button"
          aria-expanded={showAdvanced}
          aria-controls="advanced-settings"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full min-h-11 flex items-center justify-between gap-3 text-left text-sm font-medium text-neutral-300 hover:text-white transition-colors"
        >
          <span>Advanced settings</span>
          <span aria-hidden="true" className={`inline-block text-neutral-400 transition-transform ${showAdvanced ? "rotate-90" : ""}`}>▸</span>
        </button>
      </h2>
      <p className="text-sm text-neutral-400">Each style sets recommended defaults; change them here.</p>

      <Collapsible id="advanced-settings" open={showAdvanced}>
        <div className="space-y-7 pt-5">

          {/* Image model */}
          <div>
            <h3 id="image-model-heading" className="text-sm font-medium text-neutral-300 mb-3">Image model</h3>
            <div role="group" aria-labelledby="image-model-heading" className="space-y-1.5">
              {(["Runway", "OpenAI", "Google"] as const).map((group) => {
                const models = IMAGE_MODELS.filter(m => m.group === group);
                if (!models.length) return null;
                return (
                  <div key={group}>
                    <div className="text-sm text-neutral-400 mb-2">{group === "OpenAI" ? "OpenAI via Runway" : group === "Google" ? "Google via Runway" : "Runway"}</div>
                    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2">
                      {models.map((m) => (
                        <ModelOption key={m.id} label={m.label} cost={m.crInfo} desc={m.desc} active={imageModel === m.id} accentColor={accentColor} disabled={isGenerating} onClick={() => setImageModel(m.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Video model */}
          <div>
            <h3 id="video-model-heading" className="text-sm font-medium text-neutral-300 mb-3">Video model</h3>
            <div role="group" aria-labelledby="video-model-heading" className="space-y-1.5">
              {(["Runway", "Google"] as const).map((group) => (
                <div key={group}>
                  <div className="text-sm text-neutral-400 mt-3 mb-2">{group === "Google" ? "Google via Runway" : "Runway"}</div>
                  <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 gap-2">
                    {VIDEO_MODELS.filter((m) => m.group === group).map((m) => (
                      <ModelOption
                        key={m.id}
                        label={m.label}
                        cost={m.crInfo}
                        desc={m.desc}
                        note={STYLE_DEFAULTS[style].videoModel === m.id ? "Recommended" : undefined}
                        active={videoModel === m.id}
                        accentColor={accentColor}
                        disabled={isGenerating}
                        onClick={() => changeVideoModel(m.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Audio toggle — Veo models only */}
            {isVeoModel(videoModel) && (
              <div
                className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                style={{ borderColor: "#262626" }}
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-300">Generate audio</div>
                  <div className="text-sm text-neutral-400 mt-0.5">Veo can auto-generate ambient sound &amp; music</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={audio}
                  onClick={() => setAudio((v) => !v)}
                  disabled={isGenerating}
                  aria-label="Generate audio"
                  className="relative w-11 h-6 rounded-full transition-colors disabled:opacity-50 shrink-0"
                  style={{ backgroundColor: audio ? accentColor : "#404040" }}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${audio ? "translate-x-5" : ""}`} />
                </button>
              </div>
            )}
          </div>

          {/* Card treatment */}
          <div>
            <h3 id="treatment-heading" className="text-sm font-medium text-neutral-300 mb-3">Card treatment</h3>
            <div role="group" aria-labelledby="treatment-heading" className="flex gap-2">
              {TREATMENTS.map((t) => {
                const active = treatment === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    aria-pressed={active}
                    onClick={() => setTreatment(t.id)}
                    disabled={isGenerating}
                    className="flex-1 min-w-0 flex flex-col items-start px-3 py-2.5 rounded-lg border text-sm text-left transition-colors disabled:opacity-50"
                    style={active
                      ? { borderColor: accentColor, backgroundColor: accentColor + "15" }
                      : { borderColor: "#262626" }
                    }
                  >
                    <span className={`mb-0.5 ${active ? "font-semibold" : "font-medium"}`} style={active ? { color: accentColor } : { color: "#e5e7eb" }}>
                      {active && <span aria-hidden="true">✓ </span>}{t.label}
                    </span>
                    <span className="text-neutral-400">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary color */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 id="primary-color-heading" className="text-sm font-medium text-neutral-300">
                Primary color <span className="text-neutral-400 font-normal">(optional)</span>
              </h3>
              {primaryColor && (
                <button type="button" onClick={() => setPrimaryColor(null)} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">Clear</button>
              )}
            </div>
            <div role="group" aria-labelledby="primary-color-heading" className="flex flex-wrap items-center gap-1">
              {COLOR_SWATCHES.map((c) => {
                const active = primaryColor === c.value;
                return (
                  <button
                    type="button"
                    key={c.value}
                    aria-pressed={active}
                    onClick={() => setPrimaryColor(active ? null : c.value)}
                    disabled={isGenerating}
                    aria-label={c.label}
                    title={c.label}
                    className="w-11 h-11 flex items-center justify-center rounded-full disabled:opacity-50"
                  >
                    <span
                      aria-hidden="true"
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: c.value,
                        color: c.label === "White" ? "#000" : "#fff",
                        outline: active ? `2px solid ${c.value}` : undefined,
                        outlineOffset: 2,
                      }}
                    >
                      {active && "✓"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom notes */}
          <div>
            <label htmlFor="custom-details" className="block text-sm font-medium text-neutral-300 mb-2">
              Custom details <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <input
              id="custom-details"
              type="text"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder='e.g. "wolf mascot", "slow burn reveal", "HBO Max aesthetic"'
              maxLength={120}
              disabled={isGenerating}
              className={INPUT_CLASS}
            />
          </div>

        </div>
      </Collapsible>
    </section>
  );
}
