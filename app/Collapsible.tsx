import type { ReactNode } from "react";

/**
 * The body of a disclosure. It grows open (grid rows 0fr → 1fr, 220ms, entrance curve) and folds shut faster
 * (175ms: the height on ease-in-out, the fade on the exit curve). Put all padding on the children, inside the clip.
 */
export function Collapsible({ id, open, children }: { id: string; open: boolean; children: ReactNode }) {
  return (
    <div
      id={id}
      inert={!open}
      className={`grid transition-[grid-template-rows,opacity] ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      style={open
        ? { transitionDuration: "220ms", transitionTimingFunction: "var(--ease-enter)" }
        : { transitionDuration: "175ms", transitionTimingFunction: "ease-in-out, var(--ease-exit)" }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
