"use client";

import { useRef, useState } from "react";
import type { Duration, ImageModel, Style, Treatment, VideoModel } from "@/lib/runway";
import { STYLE_DEFAULTS, nextTagline, type Preset } from "@/lib/styles";
import { durationForModel } from "@/lib/models";
import type { SavedGeneration } from "@/lib/genSession";

export type LogoMode = "ai" | "upload";
export type GenMode = "image-only" | "full";

/** Everything the visitor chooses before generating: name, style, models, card treatment, notes and prompt edits. */
export function useIntroSettings() {
  const [name, setName]         = useState("Joeflix");
  const [tagline, setTagline]   = useState("Where stories come alive");
  const [style, setStyle]       = useState<Style>("cinematic");
  const [duration, setDuration] = useState<Duration>(STYLE_DEFAULTS["cinematic"].duration);
  const [logoMode, setLogoMode] = useState<LogoMode>("ai");
  const [imageModel, setImageModel] = useState<ImageModel>("gen4_image");
  const [videoModel, setVideoModel] = useState<VideoModel>(STYLE_DEFAULTS["cinematic"].videoModel);
  const [treatment, setTreatment] = useState<Treatment>(STYLE_DEFAULTS["cinematic"].treatment);
  const [customNotes, setCustomNotes] = useState("");
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [audio, setAudio] = useState(false);
  const [genMode, setGenMode] = useState<GenMode>("full");
  const [imagePromptOverride, setImagePromptOverride] = useState<string | null>(null);
  const [videoPromptOverride, setVideoPromptOverride] = useState<string | null>(null);
  // What the visitor last picked, for analytics: a preset's name, or "direct" for a style tile.
  const activePresetRef = useRef<string>("direct");

  function applyStyleDefaults(s: Style) {
    const d = STYLE_DEFAULTS[s];
    setVideoModel(d.videoModel);
    setImageModel(d.imageModel);
    setTreatment(d.treatment);
    setDuration(d.duration);
  }

  function chooseStyle(s: Style) {
    activePresetRef.current = "direct";
    setStyle(s);
    applyStyleDefaults(s);
  }

  function applyPreset(p: Preset) {
    activePresetRef.current = p.name;
    setName(p.name);
    setTagline(p.tagline);
    setStyle(p.style);
    applyStyleDefaults(p.style);
    setCustomNotes(p.customNotes ?? "");
    setVideoPromptOverride(p.videoPromptOverride ?? null);
  }

  function changeVideoModel(m: VideoModel) {
    setVideoModel(m);
    setDuration(durationForModel(m, duration));
  }

  function shuffleTagline() {
    setTagline(nextTagline(style, tagline));
  }

  function restore(saved: SavedGeneration) {
    if (saved.name)    setName(saved.name);
    if (saved.style)   setStyle(saved.style);
    if (saved.tagline !== undefined) setTagline(saved.tagline);
    if (saved.videoModel)  setVideoModel(saved.videoModel);
    if (saved.imageModel)  setImageModel(saved.imageModel);
    if (saved.treatment)   setTreatment(saved.treatment);
    // A dropped model leaves the current one in place, which may not offer the saved length (Veo's 6s on a Runway model).
    if (saved.duration)    setDuration(durationForModel(saved.videoModel ?? videoModel, saved.duration));
  }

  return {
    name, setName, tagline, setTagline, style, duration, setDuration, logoMode, setLogoMode,
    imageModel, setImageModel, videoModel, treatment, setTreatment, customNotes, setCustomNotes,
    primaryColor, setPrimaryColor, audio, setAudio, genMode, setGenMode,
    imagePromptOverride, setImagePromptOverride, videoPromptOverride, setVideoPromptOverride,
    activePresetRef, chooseStyle, applyPreset, changeVideoModel, shuffleTagline, restore,
  };
}

export type IntroSettings = ReturnType<typeof useIntroSettings>;
