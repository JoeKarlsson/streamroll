/**
 * One 300ms scale pulse (1 → 1.12 → 1) to confirm a success. It runs through the Web Animations API,
 * which the global reduced-motion CSS can't reach, so it checks the preference itself.
 */
export function pulseOnce(el: HTMLElement | null) {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  el.animate(
    [{ transform: "scale(1)" }, { transform: "scale(1.12)" }, { transform: "scale(1)" }],
    { duration: 300, easing: "ease-out" },
  );
}
