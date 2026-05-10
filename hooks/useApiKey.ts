"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "runway_api_key";

export function useApiKey() {
  const [key, setKeyState] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setKeyState(localStorage.getItem(STORAGE_KEY) ?? "");
    setLoaded(true);
  }, []);

  function saveKey(k: string) {
    const trimmed = k.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setKeyState(trimmed);
  }

  function clearKey() {
    localStorage.removeItem(STORAGE_KEY);
    setKeyState("");
  }

  return { key, saveKey, clearKey, loaded };
}
