export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="w-full max-w-2xl px-4 mb-10">
      <h2 id="how-it-works-heading" className="text-base font-semibold text-neutral-200 mb-4">How it works</h2>
      <ol className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-6">
        {([
          { title: "Pick a style", desc: "Name your service and choose a look" },
          { title: "Add a Runway API key", desc: "Creating a key is free; generating uses paid Runway credits" },
          { title: "Generate", desc: "AI builds a title card and an animated intro" },
          { title: "Add to your server", desc: "Drop the MP4 into Plex, Jellyfin, or Emby" },
        ]).map((s, i, arr) => (
          <li key={s.title} className="relative flex flex-col gap-2">
            {i < arr.length - 1 && (
              <div aria-hidden="true" className="hidden sm:block absolute top-3 left-8 right-0 h-px bg-neutral-800" />
            )}
            <div aria-hidden="true" className="relative w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300 shrink-0">
              {i + 1}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-200 leading-snug">{s.title}</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mt-0.5">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
