/**
 * Progress for long waits. Unknown progress is the native indeterminate <progress>; known progress keeps an
 * accessible <progress> for assistive tech and draws a fill that grows with transform: scaleX, never width.
 */
export function ProgressBar({ label, value, color, className = "" }: {
  label: string; value: number | null; color: string; className?: string;
}) {
  if (value === null) {
    return <progress aria-label={label} className={`h-1.5 ${className}`} style={{ accentColor: color }} />;
  }
  return (
    // design-ok: a rounded progress track matching the native <progress>, not a pill label
    <div className={`relative h-1.5 overflow-hidden rounded-full bg-neutral-800 ${className}`}>
      <progress aria-label={label} max={100} value={value} className="sr-only" />
      <div
        aria-hidden="true"
        className="absolute inset-0 origin-left transition-transform duration-300 ease-out"
        style={{ transform: `scaleX(${Math.min(100, Math.max(0, value)) / 100})`, backgroundColor: color }}
      />
    </div>
  );
}
