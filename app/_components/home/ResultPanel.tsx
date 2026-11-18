import Image from "next/image";
import type { IntroSettings } from "@/hooks/useIntroSettings";
import type { Generation } from "@/hooks/useGeneration";
import { imageRatio } from "@/lib/runway";
import { redditShareUrl, tweetShareUrl } from "@/lib/links";
import { isEnterToSubmitNotes } from "@/lib/enterToSubmit";
import { track } from "@/lib/plausible";
import { AudioMixer } from "../AudioMixer";
import { ProgressBar } from "../ProgressBar";
import { StepIndicator } from "./StepIndicator";
import { ThrottledTaskHelp } from "./ThrottledTaskHelp";
import { InstallGuide } from "./InstallGuide";
import { INPUT_CLASS, PRESS } from "./classes";

/** Progress and results: the poster, the review step, the video with its controls, errors, the audio mixer and install guide. */
export function ResultPanel({ settings, gen, accentColor, crPerSec, imageCrCost, pendingAudioFile }: {
  settings: IntroSettings;
  gen: Generation;
  accentColor: string;
  crPerSec: number;
  imageCrCost: number;
  pendingAudioFile: File | undefined;
}) {
  const { name, style, duration, imageModel, logoMode, genMode, setGenMode } = settings;
  const {
    step, isGenerating, imageUrl, videoUrl, error, timings, credits, downloadError, posterDownloadError,
    reviewNotes, setReviewNotes, videoRegenNotes, setVideoRegenNotes, pollStatus, pollProgress,
    confirmingReset, setConfirmingReset, cancelling, cancelError, incomingVideoUrl, outgoingVideoUrl, revealPoster,
    currentVideoRef, resultRef, handleRegenerate, proceedToVideo, handleCancelVideo, cancelRunwayTask, reset, safeReset,
    downloadPoster, downloadVideo, showIncomingVideo, failIncomingVideo,
  } = gen;
  const ratioLabel = imageRatio(imageModel).replace(":", "×");
  return (
    <section aria-labelledby="result-heading" ref={resultRef} tabIndex={-1} className="mt-12 w-full max-w-2xl px-4 focus:outline-none">
      <h2 id="result-heading" className="sr-only">Your intro</h2>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        <StepIndicator label="Scene 1: Design poster" status={step === "image" ? "active" : "done"} color={accentColor} />
        {genMode === "full" && (
          <>
            <div className="flex-1 min-w-6 h-px bg-neutral-800" />
            <StepIndicator
              label="Scene 2: Roll camera"
              status={step === "video" ? "active" : step === "done" ? "done" : step === "error" ? "error" : "pending"}
              color={accentColor}
            />
          </>
        )}
        {step === "video" && pollStatus !== "SUCCEEDED" && (
          <button
            type="button"
            onClick={handleCancelVideo}
            disabled={cancelling}
            className="min-h-11 px-2 text-sm text-red-400 hover:text-red-300 transition-colors shrink-0 disabled:text-neutral-400 disabled:cursor-not-allowed"
          >
            {cancelling ? "Cancelling…" : "Cancel video"}
          </button>
        )}
        {!isGenerating && (
          confirmingReset ? (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm text-neutral-400">Video will be lost:</span>
              <button type="button" onClick={reset} className="min-h-11 px-2 text-sm text-red-400 hover:text-red-300 transition-colors">Confirm</button>
              <button type="button" onClick={() => setConfirmingReset(false)} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">Cancel</button>
            </div>
          ) : step === "error" && imageUrl && !videoUrl ? (
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" onClick={() => proceedToVideo()} className="min-h-11 px-2 text-sm text-white hover:text-neutral-300 transition-colors">
                Try again
              </button>
              <button type="button" onClick={safeReset} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors">
                Start over
              </button>
            </div>
          ) : (
            <button type="button" onClick={safeReset} className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors shrink-0">
              Start over
            </button>
          )
        )}
      </div>

      <div className="space-y-4">
        {cancelError && (
          <p role="alert" className="rounded-lg border border-red-800 bg-red-950 px-4 py-3 text-sm text-red-300">{cancelError}</p>
        )}

        {/* Image skeleton */}
        {step === "image" && !imageUrl && logoMode === "ai" && (
          <div className="rounded-xl overflow-hidden border border-neutral-800">
            <div className="w-full bg-neutral-900" style={{ aspectRatio: "16/9" }} />
            <div className="px-3 py-2 bg-neutral-950 border-t border-neutral-800 flex items-center gap-3">
              <ProgressBar label="Generating poster" value={null} color={accentColor} className="flex-1" />
              <span className="text-sm text-neutral-400 shrink-0">Generating poster…</span>
            </div>
          </div>
        )}

        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-neutral-800">
            <div className="px-3 text-sm text-neutral-400 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-2">
              <span>Scene 1: Logo, {ratioLabel}</span>
              <div className="flex items-center gap-3">
                {timings && timings.image > 0 && <span className="tabular-nums">{(timings.image / 1000).toFixed(1)}s</span>}
                <button
                  type="button"
                  onClick={downloadPoster}
                  className="min-h-11 px-2 text-sm text-neutral-300 hover:text-white transition-colors"
                >
                  Download poster
                </button>
              </div>
            </div>
            <Image
              src={imageUrl}
              alt="Generated logo"
              width={1920}
              height={1080}
              className={`w-full ${revealPoster ? "[clip-path:inset(0)] starting:[clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-400 ease-enter" : ""}`}
              unoptimized
            />
            {posterDownloadError && (
              <p role="alert" className="px-3 py-2 text-sm text-red-300 bg-red-950 border-t border-red-900">{posterDownloadError}</p>
            )}
          </div>
        )}

        {/* Logo-only done — offer to continue to video */}
        {step === "done" && genMode === "image-only" && imageUrl && (
          <div className="rounded-xl border p-5 space-y-4" style={{ borderColor: accentColor + "50", background: accentColor + "0a" }}>
            <div>
              <p className="text-base font-semibold text-white">Happy with the logo?</p>
              <p className="text-sm text-neutral-300 mt-1">Animate it into a full streaming intro, or download the poster above.</p>
            </div>
            <button
              type="button"
              onClick={() => { setGenMode("full"); proceedToVideo(); }}
              className={`w-full py-3.5 rounded-lg text-sm font-semibold text-black ${PRESS}`}
              style={{ background: accentColor }}
            >
              Animate into a video intro
            </button>
            <button
              type="button"
              onClick={reset}
              className="w-full min-h-11 rounded-lg text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Start over with a new style
            </button>
          </div>
        )}

        {/* Review step — approve or regenerate before animating */}
        {step === "review" && genMode === "full" && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 space-y-3">
            <p className="text-sm font-medium text-neutral-200">Happy with the logo?</p>
            <p className="text-sm text-neutral-400">Approve it to animate, or add notes and regenerate.</p>
            <div>
              <label htmlFor="review-notes" className="block text-sm text-neutral-300 mb-1.5">Notes for a new version (optional)</label>
              <input
                id="review-notes"
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                onKeyDown={(e) => { if (isEnterToSubmitNotes(e, reviewNotes)) handleRegenerate(); }}
                placeholder='e.g. "make text bolder", "brighter red", "less grain"'
                className={`${INPUT_CLASS} bg-neutral-950`}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="min-h-11 px-4 rounded-lg border border-neutral-700 text-sm text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="flex-1 min-h-11 px-4 rounded-lg border border-neutral-700 text-sm text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
              >
                Regenerate
              </button>
              <button
                type="button"
                onClick={() => proceedToVideo()}
                className={`flex-1 min-h-11 px-4 rounded-lg text-sm font-semibold text-black whitespace-nowrap ${PRESS}`}
                style={{ background: accentColor }}
              >
                Looks good, make the video
              </button>
            </div>
          </div>
        )}

        {/* Video: progress, then the new video fading in over the skeleton, or over the dimmed old one on a redo */}
        {(step === "video" || videoUrl) && (
          <div className="rounded-xl overflow-hidden border border-neutral-800">
            {step === "video" ? (
              // Status bar (announced via the page's status region, not here); same height as the header it replaces
              <div className="px-3 py-2 min-h-9 bg-neutral-900 border-b border-neutral-800 flex items-center gap-3">
                <ProgressBar label="Video progress" value={pollProgress} color={accentColor} className="flex-1" />
                <span className="text-sm shrink-0 tabular-nums" style={{ color: pollStatus === "RUNNING" ? "#22C55E" : pollStatus === "THROTTLED" ? "#F59E0B" : "#a3a3a3" }}>
                  {(pollStatus === null || pollStatus === "STARTING") && "Submitting task…"}
                  {pollStatus === "PENDING"   && "Queued, waiting to start"}
                  {pollStatus === "RUNNING"   && `Generating frames${pollProgress !== null ? ` ${pollProgress}%` : "…"}`}
                  {pollStatus === "THROTTLED" && "Throttled: concurrent task limit reached"}
                  {pollStatus === "SUCCEEDED" && "Loading video…"}
                </span>
              </div>
            ) : (
              <div className="px-3 py-2 min-h-9 text-sm text-neutral-400 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between gap-2">
                <span>Scene 2: Intro video, {duration}s, 1280×720</span>
                {timings && <span className="tabular-nums">{(timings.video / 1000).toFixed(1)}s</span>}
              </div>
            )}
            <div className="relative aspect-video bg-neutral-900">
              {[outgoingVideoUrl, videoUrl, incomingVideoUrl].map((url) => url && (
                <video
                  key={url}
                  ref={url === videoUrl ? currentVideoRef : undefined}
                  src={url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls={url === videoUrl && step !== "video"}
                  onLoadedData={url === incomingVideoUrl ? showIncomingVideo : undefined}
                  onError={url === incomingVideoUrl ? failIncomingVideo : undefined}
                  className={`absolute inset-0 w-full h-full bg-black transition-opacity duration-400 ease-enter ${
                    url === incomingVideoUrl ? "opacity-0" : url === videoUrl && step !== "video" ? "opacity-100" : "opacity-40"
                  }`}
                />
              ))}
            </div>
            {pollStatus === "THROTTLED" && <ThrottledTaskHelp cancelRunwayTask={cancelRunwayTask} onStartOver={reset} />}
            {videoUrl && (
              // Kept in place, but unusable, while a redo runs, so nothing collapses under the pointer
              <div inert={step === "video"} className={`transition-opacity ${step === "video" ? "opacity-50" : ""}`}>
                {/* Timing + cost strip */}
                {timings && (
                  <div className="px-3 py-1.5 bg-neutral-950 border-b border-neutral-800 flex gap-x-4 gap-y-1 text-sm text-neutral-400 tabular-nums flex-wrap">
                    <span>Scene 1: {(timings.image / 1000).toFixed(1)}s</span>
                    <span>Scene 2: {(timings.video / 1000).toFixed(1)}s</span>
                    <span className="text-neutral-300 font-medium">Total: {((timings.image + timings.video) / 1000).toFixed(1)}s</span>
                    <span className="ml-auto flex flex-wrap gap-x-3">
                      {(credits ? credits.image : imageCrCost) > 0 && (
                        <span>Poster: {credits ? `${credits.image} cr` : `~${imageCrCost} cr`}</span>
                      )}
                      {(credits?.video ?? 0) > 0 || !credits ? (
                        <span>Video: {credits ? `${credits.video} cr` : `~${crPerSec * duration} cr`}</span>
                      ) : null}
                      <span className="text-neutral-300 font-medium">
                        Total: {credits
                          ? `${credits.image + credits.video} cr`
                          : `~${imageCrCost + crPerSec * duration} cr`}
                      </span>
                    </span>
                  </div>
                )}
                <div className="px-3 py-2 bg-neutral-950 border-t border-neutral-800">
                  <label htmlFor="redo-notes" className="block text-sm text-neutral-300 mb-1.5">Notes for a redo (optional)</label>
                  <input
                    id="redo-notes"
                    type="text"
                    value={videoRegenNotes}
                    onChange={(e) => setVideoRegenNotes(e.target.value)}
                    onKeyDown={(e) => { if (isEnterToSubmitNotes(e, videoRegenNotes)) proceedToVideo(); }}
                    placeholder='e.g. "more energy", "darker background", "slower reveal"'
                    className={INPUT_CLASS}
                  />
                </div>
                <div className="px-3 py-2 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center gap-2">
                  {confirmingReset ? (
                    <>
                      <span className="text-sm text-neutral-300 shrink-0">Video will be lost:</span>
                      <button type="button" onClick={reset} className="min-h-11 text-sm text-red-400 border border-red-900 hover:border-red-700 px-4 rounded transition-colors shrink-0">
                        Confirm
                      </button>
                      <button type="button" onClick={() => setConfirmingReset(false)} className="min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors shrink-0">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={safeReset} className="min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors shrink-0">
                      Start over
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => proceedToVideo()}
                    className="min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors shrink-0"
                  >
                    Redo video
                  </button>
                  <a
                    href={redditShareUrl(name.trim())}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("Share Reddit", { style })}
                    className="inline-flex items-center min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors"
                  >
                    Post to r/plexprerolls
                  </a>
                  <a
                    href={tweetShareUrl(name.trim())}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("Share X", { style })}
                    className="inline-flex items-center min-h-11 text-sm text-neutral-300 border border-neutral-700 hover:border-neutral-500 px-4 rounded transition-colors"
                  >
                    Share on X
                  </a>
                  <button
                    type="button"
                    onClick={downloadVideo}
                    className={`min-h-11 text-sm text-black font-medium px-4 rounded ${PRESS}`}
                    style={{ background: accentColor }}
                  >
                    Download MP4
                  </button>
                </div>
                {downloadError && (
                  <p role="alert" className="px-3 py-2 text-sm text-red-300 bg-red-950 border-t border-red-900">{downloadError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Video generation error, with the poster (and any earlier video) still on screen */}
        {step === "error" && error && (
          <div role="alert" className="rounded-lg border border-red-800 bg-red-950 px-4 py-4 space-y-3">
            <p className="text-sm text-red-300">{error}</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => proceedToVideo()}
                className="min-h-11 px-4 rounded-lg text-sm font-semibold text-black bg-white hover:bg-neutral-200 transition-colors"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={safeReset}
                className="min-h-11 px-2 text-sm text-red-300 hover:text-red-200 transition-colors"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {/* Audio mixer */}
        {videoUrl && (
          <AudioMixer
            videoUrl={videoUrl}
            name={name}
            style={style}
            accentColor={accentColor}
            duration={duration}
            initialFile={pendingAudioFile ?? undefined}
          />
        )}

        {videoUrl && <InstallGuide />}
      </div>
    </section>
  );
}
