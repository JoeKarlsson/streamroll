import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useApiKey } from "@/hooks/useApiKey";

const STORAGE_KEY = "runway_api_key";

describe("useApiKey", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("starts with empty key and loaded=false, then loaded=true after mount", async () => {
    const { result } = renderHook(() => useApiKey());
    // After act flushes effects, loaded becomes true
    await act(async () => {});
    expect(result.current.key).toBe("");
    expect(result.current.loaded).toBe(true);
  });

  it("loads a pre-existing key from localStorage on mount", async () => {
    localStorage.setItem(STORAGE_KEY, "existing-key-123");
    const { result } = renderHook(() => useApiKey());
    await act(async () => {});
    expect(result.current.key).toBe("existing-key-123");
    expect(result.current.loaded).toBe(true);
  });

  it("saveKey stores trimmed key in localStorage and updates state", async () => {
    const { result } = renderHook(() => useApiKey());
    await act(async () => {});
    act(() => { result.current.saveKey("  mykey123  "); });
    expect(result.current.key).toBe("mykey123");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("mykey123");
  });

  it("saveKey with empty string removes the key from localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, "some-key");
    const { result } = renderHook(() => useApiKey());
    await act(async () => {});
    act(() => { result.current.saveKey(""); });
    expect(result.current.key).toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("saveKey with whitespace-only string removes the key from localStorage", async () => {
    localStorage.setItem(STORAGE_KEY, "some-key");
    const { result } = renderHook(() => useApiKey());
    await act(async () => {});
    act(() => { result.current.saveKey("   "); });
    expect(result.current.key).toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("clearKey removes the key from localStorage and resets state", async () => {
    localStorage.setItem(STORAGE_KEY, "a-key");
    const { result } = renderHook(() => useApiKey());
    await act(async () => {});
    act(() => { result.current.clearKey(); });
    expect(result.current.key).toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("saveKey then clearKey leaves state empty", async () => {
    const { result } = renderHook(() => useApiKey());
    await act(async () => {});
    act(() => { result.current.saveKey("temp-key"); });
    expect(result.current.key).toBe("temp-key");
    act(() => { result.current.clearKey(); });
    expect(result.current.key).toBe("");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
