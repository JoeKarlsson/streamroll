"use client";

import { useApiKey } from "@/hooks/useApiKey";

export function KeyStatusLine() {
  const { key: apiKey, loaded: keyLoaded } = useApiKey();
  return (
    <>
      {keyLoaded && (
        apiKey
          ? <p className="text-sm text-green-400">Runway API key active</p>
          : <p className="text-sm text-amber-400">Add your Runway API key below to start</p>
      )}
    </>
  );
}
