"use client";

import { useState } from "react";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB — keeps data URI under Vercel's 4.5 MB body limit

/** The visitor's own title card image: checked, previewed and read into a data URI that Runway accepts as promptImage. */
export function useTitleCardUpload() {
  const [uploadedUri, setUploadedUri] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileUpload(file: File) {
    setUploadError(null);
    setUploadedUri(null);

    if (file.size > MAX_BYTES) {
      setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 3 MB.`);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setUploadPreview(previewUrl);
    setIsUploading(true);
    try {
      // Runway rejects promptImage with width/height > 2.358 — validate before burning credits.
      await new Promise<void>((resolve, reject) => {
        const img = new window.Image();
        img.onload = () => {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio > 2.358) {
            reject(new Error(
              `Image too wide (${img.naturalWidth}×${img.naturalHeight}, ratio ${ratio.toFixed(2)}:1). ` +
              `Runway requires a width-to-height ratio of at most 2.36:1. Try cropping to 16:9 or squarer.`
            ));
          } else {
            resolve();
          }
        };
        img.onerror = () => reject(new Error("Failed to load image for dimension check"));
        img.src = previewUrl;
      });

      // Read as base64 data URI — Runway's promptImage accepts data URIs directly,
      // so no server-side upload or API key needed for this step.
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      setUploadedUri(dataUri);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Failed to read file");
    } finally {
      setIsUploading(false);
    }
  }

  return { uploadedUri, uploadPreview, uploadError, setUploadError, isUploading, handleFileUpload };
}
