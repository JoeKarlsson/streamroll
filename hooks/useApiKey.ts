"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "runway_api_key";

type SaveKeyOptions = {
  /** true (default): keep the key in localStorage across browser restarts.
   *  false: keep it in sessionStorage only, so it is forgotten when the tab closes. */
  remember?: boolean;
};

// Every component using the hook shares one key: saving it in the form updates the status line in the hero too.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function readStoredKey() {
  return localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY) ?? "";
}

// The server has no storage: null renders the "not loaded yet" state until the browser takes over.
const readServerKey = () => null;

function writeStoredKey(key: string, remember: boolean) {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  if (key) (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, key);
  listeners.forEach((listener) => listener());
}

export function useApiKey() {
  const stored = useSyncExternalStore<string | null>(subscribe, readStoredKey, readServerKey);

  function saveKey(k: string, { remember = true }: SaveKeyOptions = {}) {
    writeStoredKey(k.trim(), remember);
  }

  function clearKey() {
    writeStoredKey("", true);
  }

  return { key: stored ?? "", saveKey, clearKey, loaded: stored !== null };
}
