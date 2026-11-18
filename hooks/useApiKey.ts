"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "runway_api_key";

type SaveKeyOptions = {
  /** true (default): keep the key in localStorage across browser restarts.
   *  false: keep it in sessionStorage only, so it is forgotten when the tab closes. */
  remember?: boolean;
};

export function useApiKey() {
  const [key, setKeyState] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  // Reading from storage on mount is the standard SSR-safe pattern.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setKeyState(localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY) ?? "");
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  function saveKey(k: string, { remember = true }: SaveKeyOptions = {}) {
    const trimmed = k.trim();
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    if (trimmed) {
      (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, trimmed);
    }
    setKeyState(trimmed);
  }

  function clearKey() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    setKeyState("");
  }

  return { key, saveKey, clearKey, loaded };
}
