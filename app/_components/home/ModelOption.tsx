export function ModelOption({ label, cost, desc, note, active, accentColor, disabled, onClick }: {
  label: string; cost: string; desc: string; note?: string; active: boolean; accentColor: string; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-start p-2.5 rounded-lg border text-sm transition-colors disabled:opacity-50 text-left"
      style={active
        ? { borderColor: accentColor, backgroundColor: accentColor + "15" }
        : { borderColor: "#262626" }
      }
    >
      <div className="flex items-center justify-between gap-2 w-full mb-0.5">
        <span className={`min-w-0 ${active ? "font-bold" : "font-semibold"}`} style={active ? { color: accentColor } : { color: "#e5e7eb" }}>
          {active && <span aria-hidden="true">✓ </span>}{label}
        </span>
        <span className="text-neutral-400 text-xs whitespace-nowrap shrink-0">{cost}</span>
      </div>
      <span className="text-neutral-400 leading-tight">{desc}</span>
      {note && <span className="mt-1.5 text-xs font-medium" style={{ color: accentColor }}>{note}</span>}
    </button>
  );
}
