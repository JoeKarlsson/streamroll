export type PendingAudio = { file: File; previewUrl: string };

/** Audio track: queued before generating, mixed in after the video is done. */
export function AudioTrackPicker({ pendingAudio, setPendingAudio, isGenerating }: {
  pendingAudio: PendingAudio | null; setPendingAudio: (audio: PendingAudio | null) => void; isGenerating: boolean;
}) {
  const pendingAudioFile = pendingAudio?.file;
  const pendingAudioPreviewUrl = pendingAudio?.previewUrl;
  return (
    <section aria-labelledby="audio-track-heading">
      <div className="flex items-center justify-between mb-3">
        <h2 id="audio-track-heading" className="text-sm font-medium text-neutral-300">
          Audio track <span className="text-neutral-400 font-normal">(optional)</span>
        </h2>
        {pendingAudioFile && (
          <button
            type="button"
            onClick={() => {
              if (pendingAudioPreviewUrl) URL.revokeObjectURL(pendingAudioPreviewUrl);
              setPendingAudio(null);
            }}
            className="min-h-11 px-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      {!pendingAudioFile ? (
        <label
          className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-neutral-500 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white has-[:focus-visible]:outline-offset-2"
          style={{ borderColor: "#404040" }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const f = e.dataTransfer.files?.[0];
            if (f && f.type.startsWith("audio/")) setPendingAudio({ file: f, previewUrl: URL.createObjectURL(f) });
          }}
        >
          <div className="text-center px-4">
            <div className="text-sm text-neutral-300">Drop an audio file or click to browse</div>
            <div className="text-sm text-neutral-400 mt-0.5">MP3, WAV, AAC, OGG, FLAC or M4A, mixed in after the video generates</div>
          </div>
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            disabled={isGenerating}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setPendingAudio({ file: f, previewUrl: URL.createObjectURL(f) });
              e.target.value = "";
            }}
          />
        </label>
      ) : (
        <div className="flex flex-wrap items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
          <div className="flex-1 min-w-0">
            <div className="text-sm text-neutral-300 truncate">{pendingAudioFile.name}</div>
            <div className="text-sm text-neutral-400 mt-0.5">
              {pendingAudioFile.size < 1048576
                ? `${Math.round(pendingAudioFile.size / 1024)} KB`
                : `${(pendingAudioFile.size / 1048576).toFixed(1)} MB`}
              {", ready to mix after the video generates"}
            </div>
          </div>
          {pendingAudioPreviewUrl && (
            <audio
              src={pendingAudioPreviewUrl}
              controls
              aria-label={`Preview ${pendingAudioFile.name}`}
              className="h-8 w-40 shrink-0"
              style={{ colorScheme: "dark" }}
            />
          )}
        </div>
      )}
    </section>
  );
}
