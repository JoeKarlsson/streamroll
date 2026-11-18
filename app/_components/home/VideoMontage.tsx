"use client";

import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";

const HERO_POSTER = "/examples/hero-poster.webp";

const EXAMPLE_CLIPS = [
  "/examples/clip-netflix-v2.mp4",
  "/examples/clip-vhs.mp4",
  "/examples/clip-outrun.mp4",
  "/examples/clip-adultswim.mp4",
];

export function VideoMontage() {
  // LCP: the hero poster is the first thing painted, so fetch it before the video.
  preload(HERO_POSTER, { as: "image", fetchPriority: "high" });
  const [active, setActive] = useState(0);
  // The clip that just ended holds its last frame underneath while the next one fades in on top of it.
  const [previous, setPrevious] = useState<number | null>(null);
  // null until known; until then the montage stays on its first frame.
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  // null until the visitor presses pause or play; reduced motion decides before that.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [onScreen, setOnScreen] = useState(true);
  const bandRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const paused = userPaused ?? reducedMotion ?? true;
  const playing = !paused && onScreen;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    // design-ok: pauses the montage while it is scrolled out of view; nothing animates on scroll
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    if (bandRef.current) observer.observe(bandRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const vid = videoRefs.current[active];
    if (!vid) return;
    if (!playing) { vid.pause(); return; }
    // Normally reset when it faded out; with reduced motion there was no fade to end.
    if (vid.ended) vid.currentTime = 0;
    // Muted autoplay can't be refused; a rejection here only means the element went away mid-call.
    vid.play().catch(() => {});
    const nextVid = videoRefs.current[(active + 1) % EXAMPLE_CLIPS.length];
    if (nextVid) nextVid.preload = "auto";
  }, [active, playing]);

  return (
    <>
      <div ref={bandRef} className="absolute inset-0 bg-black" aria-hidden="true">
        {EXAMPLE_CLIPS.map((src, i) => (
          <video
            key={src}
            ref={(el) => { videoRefs.current[i] = el; }}
            src={src}
            poster={i === 0 ? HERO_POSTER : undefined}
            muted
            playsInline
            preload={i === 0 ? "metadata" : "none"}
            onEnded={() => {
              setPrevious(i);
              setActive((i + 1) % EXAMPLE_CLIPS.length);
            }}
            onTransitionEnd={(e) => {
              if (e.target !== e.currentTarget) return;
              if (i === active) { setPrevious(null); return; }
              if (i !== previous) { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }
            }}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: i === active || i === previous ? 1 : 0, zIndex: i === active ? 2 : i === previous ? 1 : 0 }}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setUserPaused(!paused)}
        aria-label={paused ? "Play background video" : "Pause background video"}
        className="absolute top-3 right-3 z-20 grid place-items-center w-11 h-11 rounded-lg border border-neutral-700 bg-neutral-950 text-neutral-300 hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className={`[grid-area:1/1] transition-opacity duration-150 ${paused ? "opacity-0" : ""}`}>
          <rect x="3" y="2" width="3.5" height="12" /><rect x="9.5" y="2" width="3.5" height="12" />
        </svg>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className={`[grid-area:1/1] transition-opacity duration-150 ${paused ? "" : "opacity-0"}`}>
          <path d="M4 2l10 6-10 6z" />
        </svg>
      </button>
    </>
  );
}
