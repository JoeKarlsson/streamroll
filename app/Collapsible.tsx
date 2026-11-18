import type { ReactNode } from "react";

/**
 * The body of a disclosure. It grows open (grid rows 0fr → 1fr, 220ms, entrance curve) and folds shut faster
 * (175ms: the height on ease-in-out, the fade on the exit curve). Put all padding on the children, inside the clip.
 *
 * Closed, it is display: none once the fold finishes (a discrete transition), so the browser lays out nothing inside
 * and lazy images there wait until it opens; a 0-row grid alone still lays them out within lazy-load distance.
 * Opening starts from the folded state through @starting-style.
 */
export function Collapsible({ id, open, children }: { id: string; open: boolean; children: ReactNode }) {
  return (
    <div
      id={id}
      inert={!open}
      className={`transition-[grid-template-rows,opacity,display] transition-discrete ${open ? "grid grid-rows-[1fr] opacity-100 starting:grid-rows-[0fr] starting:opacity-0" : "hidden grid-rows-[0fr] opacity-0"}`}
      style={open
        ? { transitionDuration: "220ms", transitionTimingFunction: "var(--ease-enter)" }
        : { transitionDuration: "175ms", transitionTimingFunction: "ease-in-out, var(--ease-exit)" }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
