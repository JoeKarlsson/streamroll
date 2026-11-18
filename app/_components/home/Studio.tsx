"use client";

import { useRef, useState } from "react";
import { buildPrompts } from "@/lib/runway";
import { STYLE_COLOR, type Preset } from "@/lib/styles";
import { imageCreditCost, videoCreditsPerSecond } from "@/lib/models";
import { useApiKey } from "@/hooks/useApiKey";
import { useIntroSettings } from "@/hooks/useIntroSettings";
import { useTitleCardUpload } from "@/hooks/useTitleCardUpload";
import { useGeneration } from "@/hooks/useGeneration";
import { ServiceNameFields } from "./ServiceNameFields";
import { StylePicker } from "./StylePicker";
import { DurationPicker } from "./DurationPicker";
import { AdvancedSettings } from "./AdvancedSettings";
import { PromptPreview } from "./PromptPreview";
import { TitleCardSource } from "./TitleCardSource";
import { GenModePicker } from "./GenModePicker";
import { AudioTrackPicker, type PendingAudio } from "./AudioTrackPicker";
import { ApiKeyForm } from "./ApiKeyForm";
import { ElapsedSeconds } from "./ElapsedSeconds";
import { ResultPanel } from "./ResultPanel";
import { PRESS } from "./classes";

/** The intro builder: the settings form, the generate button and the result. */
export function Studio() {
  const settings = useIntroSettings();
  const { name, style, duration, imageModel, videoModel, audio, logoMode, genMode, customNotes, primaryColor, tagline, treatment } = settings;
  const { key: apiKey, loaded: keyLoaded } = useApiKey();
  const upload = useTitleCardUpload();
  const { uploadedUri, isUploading } = upload;
  const [pendingAudio, setPendingAudio] = useState<PendingAudio | null>(null);
  const apiKeyInputRef = useRef<HTMLInputElement>(null);
  const gen = useGeneration({
    settings, apiKey, keyLoaded, uploadedUri,
    onMissingKey: () => apiKeyInputRef.current?.focus(),
  });
  const { step, imageUrl, error, isGenerating, genStartedAt, generate, reset } = gen;

  const preview = buildPrompts({ name, style, tagline, duration, treatment, videoModel, primaryColor: primaryColor ?? undefined, customNotes: customNotes || undefined });
  const accentColor = STYLE_COLOR[style];
  const imageCrCost = imageCreditCost(style, imageModel);
  const crPerSec = videoCreditsPerSecond(videoModel, audio);
  const generateBlocked = isGenerating || !name.trim() || isUploading || (logoMode === "upload" && !uploadedUri);
  const statusMessage =
    step === "image" ? "Generating the poster"
    : step === "review" ? "Poster ready. Review it, then make the video."
    : step === "video" ? (gen.pollStatus === "THROTTLED" ? "Video queued: another Runway task is still running" : "Generating the video")
    : step === "done" ? (gen.videoUrl ? "Your intro video is ready" : "Your title card is ready")
    : "";

  function applyPreset(preset: Preset) {
    settings.applyPreset(preset);
    gen.clearResult();
  }

  return (
    <>
      <div className="w-full max-w-2xl px-4 space-y-10">
        <ServiceNameFields settings={settings} isGenerating={isGenerating} />
        <StylePicker settings={settings} isGenerating={isGenerating} onPreset={applyPreset} />
        <DurationPicker settings={settings} isGenerating={isGenerating} accentColor={accentColor} crPerSec={crPerSec} imageCrCost={imageCrCost} />
        <AdvancedSettings settings={settings} isGenerating={isGenerating} accentColor={accentColor} />
        <PromptPreview settings={settings} preview={preview} />
        <TitleCardSource settings={settings} upload={upload} isGenerating={isGenerating} accentColor={accentColor} />
        {logoMode === "ai" && <GenModePicker settings={settings} isGenerating={isGenerating} accentColor={accentColor} />}
        {(genMode === "full" || logoMode === "upload") && (
          <AudioTrackPicker pendingAudio={pendingAudio} setPendingAudio={setPendingAudio} isGenerating={isGenerating} />
        )}
        {keyLoaded && <ApiKeyForm apiKeyInputRef={apiKeyInputRef} />}

        {/* Credit cost estimate */}
        {!isGenerating && name.trim() && apiKey && (
          <p className="text-sm text-neutral-400 text-center -mb-6">
            {logoMode === "upload"
              ? `~${crPerSec * duration} Runway credits for the animated video`
              : genMode === "image-only"
              ? `~${imageCrCost} Runway credits for the title card`
              : `~${imageCrCost + crPerSec * duration} Runway credits total`}
          </p>
        )}

        {/* Generate */}
        <button
          type="button"
          onClick={generate}
          disabled={generateBlocked}
          className={`w-full min-h-11 font-semibold py-3.5 rounded-lg ${PRESS} disabled:cursor-not-allowed text-base bg-white text-black hover:bg-neutral-200 tabular-nums ${isGenerating ? "" : "disabled:opacity-40"}`}
        >
          {isGenerating
            ? <>Generating… <ElapsedSeconds since={genStartedAt} /></>
            : isUploading
            ? "Uploading…"
            : keyLoaded && !apiKey
            ? "Add your API key above to generate"
            : logoMode === "upload" && !uploadedUri
            ? "Upload a title card first"
            : logoMode === "upload"
            ? "Animate my title card"
            : genMode === "image-only"
            ? "Generate title card"
            : "Generate intro"}
        </button>

        {/* Disabled reason hint */}
        {keyLoaded && !isGenerating && (!name.trim() || (logoMode === "upload" && !uploadedUri)) && (
          <p className="text-sm text-center text-neutral-400 -mt-7">
            {!name.trim()
              ? "Enter a service name above to continue"
              : "Upload a title card image above to continue"}
          </p>
        )}
      </div>


      {/* One live region for generation progress; errors use role="alert" below */}
      <p role="status" className="sr-only">{statusMessage}</p>

      {/* Progress + results */}
      {(isGenerating || step === "review" || step === "done" || (step === "error" && imageUrl)) && (
        <ResultPanel settings={settings} gen={gen} accentColor={accentColor} crPerSec={crPerSec} imageCrCost={imageCrCost} pendingAudioFile={pendingAudio?.file} />
      )}

      {step === "error" && !imageUrl && (
        <div className="mt-8 max-w-2xl w-full px-4 space-y-3">
          <div role="alert" className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">{error}</div>
          <button type="button" onClick={reset} className="min-h-11 text-sm text-neutral-300 hover:text-white transition-colors">Start over</button>
        </div>
      )}

      <div className="pb-16" />
    </>
  );
}
