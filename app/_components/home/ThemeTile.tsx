export function ThemeTile({ label, desc, image, active, color, disabled, onClick }: {
  label: string; desc: string; image: string; active: boolean; color: string; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className="group flex flex-col rounded-lg border overflow-hidden transition-colors disabled:opacity-50 text-left bg-neutral-950"
      style={{ borderColor: active ? color : "#262626", borderWidth: active ? 2 : 1 }}
    >
      {/* Caption sits under the image so it never covers the logo in it */}
      <span className="relative block w-full" style={{ aspectRatio: "16/9" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          width={640}
          height={360}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-100 delay-0 group-hover:opacity-100 group-hover:duration-200 group-hover:delay-150 group-focus-visible:opacity-100 group-focus-visible:delay-0 px-2.5 bg-black/80">
          <span className="text-sm text-center leading-snug text-neutral-100">{desc}</span>
        </span>
      </span>
      <span className={`block px-2 py-1.5 text-sm leading-tight ${active ? "font-bold text-white" : "font-medium text-neutral-300"}`}>
        {active && <span aria-hidden="true">✓ </span>}{label}
      </span>
    </button>
  );
}
