import { useEffect, useRef } from "react";
import { pulseOnce } from "@/lib/pulseOnce";

export function StepIndicator({ label, status, color }: { label: string; status: "pending" | "active" | "done" | "error"; color: string }) {
  const circleRef = useRef<HTMLDivElement>(null);
  const previousStatusRef = useRef(status);
  // Pulse once when a step finishes while you watch; a step that was already done when it appeared stays still.
  useEffect(() => {
    if (status === "done" && previousStatusRef.current !== "done") pulseOnce(circleRef.current);
    previousStatusRef.current = status;
  }, [status]);
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div
        ref={circleRef}
        aria-hidden="true"
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
        style={
          status === "done"   ? { background: color, color: "#000" } :
          status === "active" ? { background: "#fff", color: "#000" } :
          status === "error"  ? { background: "#7f1d1d", color: "#fca5a5" } :
                                { background: "#262626", color: "#a3a3a3" }
        }
      >
        {status === "done" ? "✓" : status === "active" ? "…" : status === "error" ? "✕" : "○"}
      </div>
      <span
        className={`text-sm ${status === "pending" ? "text-neutral-400" : ""}`}
        style={
          status === "active" ? { color: "#fff" } :
          status === "done"   ? { color } :
          status === "error"  ? { color: "#fca5a5" } :
                                undefined
        }
      >
        {label}
      </span>
    </div>
  );
}
