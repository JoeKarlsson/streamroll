import { VideoMontage } from "./VideoMontage";

/** Full-bleed cinematic video hero (kept per DECISIONS.md). */
export function HeroBand() {
  return (
    <div className="w-full relative" style={{ height: "clamp(220px, 36vw, 500px)" }}>
      <h1 className="sr-only">StreamRoll: AI-generated streaming intros for Plex, Jellyfin, and Emby</h1>
      <VideoMontage />
      {/* design-ok: hero band scrims, kept per DECISIONS.md */}
      <div className="absolute inset-x-0 top-0 pointer-events-none z-10" style={{ height: "35%", background: "linear-gradient(to bottom, #080808 0%, transparent 100%)" }} />
      {/* bottom: dissolves into page */}
      <div className="absolute inset-x-0 bottom-0 pointer-events-none z-10" style={{ height: "50%", background: "linear-gradient(to top, #080808 0%, transparent 100%)" }} />
      {/* side vignettes */}
      <div className="absolute inset-y-0 left-0 w-16 pointer-events-none z-10" style={{ background: "linear-gradient(to right, #080808, transparent)" }} />
      <div className="absolute inset-y-0 right-0 w-16 pointer-events-none z-10" style={{ background: "linear-gradient(to left, #080808, transparent)" }} />
    </div>
  );
}
