import type { IntroSettings } from "@/hooks/useIntroSettings";
import Image from "next/image";
import type { LogoMode } from "@/hooks/useIntroSettings";
import type { useTitleCardUpload } from "@/hooks/useTitleCardUpload";

export function TitleCardSource({ settings, upload, isGenerating, accentColor }: {
  settings: IntroSettings; upload: ReturnType<typeof useTitleCardUpload>; isGenerating: boolean; accentColor: string;
}) {
  const { logoMode, setLogoMode } = settings;
  const { uploadedUri, uploadPreview, uploadError, setUploadError, isUploading, handleFileUpload } = upload;
  return (
    <section aria-labelledby="title-card-heading">
      <h2 id="title-card-heading" className="text-sm font-medium text-neutral-300 mb-3">Title card</h2>
      <div role="group" aria-labelledby="title-card-heading" className="flex gap-2">
        {(["ai", "upload"] as LogoMode[]).map((m) => (
          <button
            type="button"
            key={m}
            aria-pressed={logoMode === m}
            onClick={() => { setLogoMode(m); setUploadError(null); }}
            disabled={isGenerating}
            className={`flex-1 min-h-11 py-2.5 rounded-lg border text-sm transition-colors disabled:opacity-50 ${logoMode === m ? "font-semibold" : "font-medium"}`}
            style={logoMode === m
              ? { borderColor: accentColor, backgroundColor: accentColor + "15", color: accentColor }
              : { borderColor: "#262626", color: "#a3a3a3" }
            }
          >
            {logoMode === m && <span aria-hidden="true">✓ </span>}
            {m === "ai" ? "Generate with AI" : "Upload your own"}
          </button>
        ))}
      </div>

      {logoMode === "upload" && (
        <div className="mt-4">
          <label
            className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-white has-[:focus-visible]:outline-offset-2"
            style={{ borderColor: uploadError ? "#ef4444" : uploadedUri ? accentColor + "60" : "#404040", backgroundColor: uploadedUri ? accentColor + "08" : "transparent" }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const f = e.dataTransfer.files?.[0];
              if (f && !isGenerating && !isUploading) handleFileUpload(f);
            }}
          >
            {uploadPreview ? (
              <div className="relative w-full h-full">
                <Image src={uploadPreview} alt="Uploaded logo" fill className="object-contain p-3 rounded-xl" unoptimized />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl">
                    <span className="text-sm text-white">Uploading to Runway…</span>
                  </div>
                )}
                {uploadedUri && !isUploading && (
                  <div className="absolute top-2 right-2 text-sm px-2 py-0.5 rounded" style={{ background: "#000", color: accentColor }}>
                    Ready
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center px-4">
                <div className="text-sm text-neutral-300">Drop your title card image here or click to browse</div>
                <div className="text-sm text-neutral-400 mt-1">PNG, JPG or WebP, up to 3 MB, at most 2.36:1 (16:9 or squarer)</div>
              </div>
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label={uploadedUri ? "Replace uploaded title card" : "Upload your title card image"}
              className="sr-only"
              disabled={isGenerating || isUploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
            />
          </label>
          {uploadError && (
            <p role="alert" className="mt-2 text-sm text-red-400">{uploadError}</p>
          )}
        </div>
      )}
    </section>
  );
}
