import type { IntroSettings } from "@/hooks/useIntroSettings";
import { useState } from "react";
import { imageRatio, type PromptPreview as Prompts } from "@/lib/runway";
import { IMAGE_MODELS, isVeoModel } from "@/lib/models";
import { Collapsible } from "../Collapsible";
import { EditablePromptBlock } from "./EditablePromptBlock";

export function PromptPreview({ settings, preview }: { settings: IntroSettings; preview: Prompts }) {
  const { imageModel, videoModel, audio, imagePromptOverride, setImagePromptOverride, videoPromptOverride, setVideoPromptOverride } = settings;
  const [showPrompt, setShowPrompt] = useState(false);
  const ratioLabel = imageRatio(imageModel).replace(":", "×");
  return (
    <section aria-labelledby="prompt-heading">
      <h2 id="prompt-heading">
        <button
          type="button"
          aria-expanded={showPrompt}
          aria-controls="prompt-preview"
          onClick={() => setShowPrompt((v) => !v)}
          className="w-full min-h-11 flex items-center justify-between gap-3 text-left text-sm font-medium text-neutral-300 hover:text-white transition-colors"
        >
          <span>Prompt preview</span>
          <span aria-hidden="true" className={`inline-block text-neutral-400 transition-transform ${showPrompt ? "rotate-90" : ""}`}>▸</span>
        </button>
      </h2>
      <p className="text-sm text-neutral-400">See and edit what gets sent to the AI.</p>
      <Collapsible id="prompt-preview" open={showPrompt}>
        <div className="space-y-3 pt-4">
          <EditablePromptBlock
            label="Step 1: title card"
            meta={`${IMAGE_MODELS.find(m => m.id === imageModel)?.label ?? imageModel}, ${ratioLabel}`}
            generated={preview.imagePrompt}
            override={imagePromptOverride}
            onChange={setImagePromptOverride}
          />
          <EditablePromptBlock
            label="Step 2: video"
            meta={`${videoModel}, 1280×720${isVeoModel(videoModel) && audio ? ", audio on" : ""}`}
            generated={preview.videoPrompt}
            override={videoPromptOverride}
            onChange={setVideoPromptOverride}
          />
        </div>
      </Collapsible>
    </section>
  );
}
