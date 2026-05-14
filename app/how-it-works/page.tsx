import Link from "next/link";
import { LINKS, BUILDER } from "@/lib/links";
import { CodeBlock } from "./CodeBlock";

const IMAGE_CODE = `import RunwayML from "@runwayml/sdk";

const runway = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

// Step 1: Generate a 1080p logo image
const imageTask = await runway.textToImage
  .create({
    model: "gen4_image",
    promptText: \`Streaming service logo for "JOEFLIX",
      cinematic style, deep navy and gold, film grain,
      professional logo design, centered composition\`,
    ratio: "1920:1080",
  })
  .waitForTaskOutput();

const logoUrl = imageTask.output[0];
// → https://runway-cdn.com/...`;

const VIDEO_CODE = `// Step 2: Animate the logo into a 5-second intro
const videoTask = await runway.imageToVideo
  .create({
    model: "gen4_turbo",
    promptImage: logoUrl,
    promptText: \`The JOEFLIX logo animates with a slow cinematic
      push-in, golden particles drift upward, subtle lens
      flare blooms, atmospheric fog\`,
    ratio: "1280:720",
    duration: 5,
  })
  .waitForTaskOutput();

const videoUrl = videoTask.output[0];
// → download and drop into Plex as a pre-roll ✓`;

const INSTALL_CODE = `npm install @runwayml/sdk`;

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl">

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-10"
        >
          ← Back to StreamRoll
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-3">How it&apos;s built</h1>
          <p className="text-neutral-400 leading-relaxed">
            StreamRoll chains two Runway API calls: one to generate a logo image,
            one to animate it into video. The whole thing is{" "}
            <span className="text-white font-medium">about 20 lines of TypeScript</span>.
            Here&apos;s exactly how it works so you can build something similar.
          </p>
        </div>

        {/* Install */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-4">
            1 · Install the SDK
          </h2>
          <CodeBlock code={INSTALL_CODE} lang="bash" />
          <p className="mt-3 text-sm text-neutral-500">
            Official SDKs for Node.js, Python, and more.{" "}
            <a
              href={LINKS.runwaySDK}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white underline underline-offset-2 transition-colors"
            >
              SDK docs →
            </a>
            {" · "}
            <a
              href={LINKS.runwayGitHub}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-white underline underline-offset-2 transition-colors"
            >
              SDK on GitHub →
            </a>
          </p>
        </section>

        {/* Image generation */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-1">
            2 · Generate the logo image
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            <code className="text-neutral-400">gen4_image</code> turns a text prompt into a sharp 1920×1080 title card.
            Cost: ~8 credits.
          </p>
          <CodeBlock code={IMAGE_CODE} lang="typescript" />
        </section>

        {/* Video generation */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-1">
            3 · Animate it into video
          </h2>
          <p className="text-sm text-neutral-500 mb-4">
            Feed the image URL directly into{" "}
            <code className="text-neutral-400">gen4_turbo</code> image-to-video.
            The two calls chain together: output of step 1 is input to step 2.
            Cost: 25 credits for 5 seconds.
          </p>
          <CodeBlock code={VIDEO_CODE} lang="typescript" />
        </section>

        {/* Audio tip */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 mb-10">
          <div className="font-semibold mb-1 text-sm">The video is silent: add music</div>
          <p className="text-sm text-neutral-400 leading-relaxed mb-3">
            Runway generates video only. For a full cinematic intro, generate royalty-free music with{" "}
            <a href="https://www.udio.com" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-neutral-300">Udio</a>
            {" "}or{" "}
            <a href="https://suno.com" target="_blank" rel="noopener noreferrer" className="text-white underline underline-offset-2 hover:text-neutral-300">Suno</a>
            , then merge with ffmpeg:
          </p>
          <CodeBlock code={`ffmpeg -i intro.mp4 -i music.mp3 -shortest -c:v copy -map 0:v -map 1:a output.mp4`} lang="bash" />
        </div>

        {/* That's it callout */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-5 mb-10">
          <div className="font-semibold mb-1">That&apos;s it.</div>
          <p className="text-sm text-neutral-400 leading-relaxed">
            No ML infrastructure, no model hosting, no GPU management.
            Two API calls and you have a broadcast-quality animated logo.
            The same pattern works for product demo videos, social content,
            e-commerce clips, social content, anything where you need to turn a static image into motion.
          </p>
        </div>

        {/* Add to media server */}
        <section className="mb-10">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider mb-1">
            4 · Add to your media server
          </h2>
          <p className="text-sm text-neutral-500 mb-3">
            Download the .mp4 and drop it into Plex, Jellyfin, or Emby. Each platform has a pre-roll setting. Here&apos;s where to find it.
          </p>
          <div className="text-xs text-neutral-600 bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 mb-5">
            <span className="text-neutral-400 font-medium">Pro tip:</span> Generate 3–5 variants with different styles and point your server at the whole folder. Plex, Jellyfin, and Emby all support random rotation, so you get a different intro every session.
          </div>
          <div className="space-y-3">
            {[
              {
                name: "Plex", slug: "plex", color: "#EBAF00",
                steps: "Settings → Extras → Cinema Trailers → enable \"Cinema Trailers\" pre-roll, then place the .mp4 in your designated Extras folder.",
                docs: "https://support.plex.tv/articles/202934883-cinema-trailers-extras/",
                docsLabel: "Cinema Trailers & Extras →",
              },
              {
                name: "Jellyfin", slug: "jellyfin", color: "#00A4DC",
                steps: "Dashboard → Administration → Pre-Roll Video → browse and upload your .mp4. It will play before every movie.",
                docs: "https://jellyfin.org/docs/general/server/plugins/",
                docsLabel: "Jellyfin Plugins docs →",
              },
              {
                name: "Emby", slug: "emby", color: "#52B54B",
                steps: "Server Settings → Cinema Mode → Pre-Roll Videos → add the .mp4 file path. Toggle Cinema Mode on for playback sessions.",
                docs: "https://emby.media/community/index.php?/topic/86649-pre-roll-videos/",
                docsLabel: "Pre-roll community thread →",
              },
            ].map((p) => (
              <div key={p.name} className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                <div className="flex items-center gap-2 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/logos/${p.slug}.svg`} alt={p.name} width={16} height={16} loading="lazy" />
                  <span className="text-sm font-semibold" style={{ color: p.color }}>{p.name}</span>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed mb-2">{p.steps}</p>
                <a
                  href={p.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs transition-colors hover:opacity-100 opacity-70"
                  style={{ color: p.color }}
                >
                  {p.docsLabel}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12 space-y-3">
          <a
            href={LINKS.runwaySignup}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-white text-black font-semibold px-5 py-3.5 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            <span>Get your free API key at dev.runwayml.com</span>
            <span>→</span>
          </a>
          <a
            href={LINKS.runwayDocs}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full border border-neutral-700 text-neutral-300 px-5 py-3.5 rounded-lg hover:border-neutral-500 hover:text-white transition-colors"
          >
            <span>Browse the full API reference</span>
            <span>→</span>
          </a>
          <a
            href={LINKS.runwayCommunity}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full border border-neutral-700 text-neutral-300 px-5 py-3.5 rounded-lg hover:border-neutral-500 hover:text-white transition-colors"
          >
            <span>Join the Runway developer community on Discord</span>
            <span>→</span>
          </a>
        </section>

        {/* Builder card */}
        <div className="border-t border-neutral-800 pt-8">
          <div className="text-xs text-neutral-600 mb-3 uppercase tracking-wider">Built by</div>
          <div className="flex items-center justify-between">
            <div>
              <a href={BUILDER.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-lg hover:text-neutral-300 transition-colors">{BUILDER.name}</a>
              <div className="text-sm text-neutral-500 mt-0.5">
                Developer Advocate · building tools that make APIs click
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={BUILDER.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                𝕏
              </a>
              <a
                href={BUILDER.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                GitHub
              </a>
              <a
                href={BUILDER.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-neutral-500 hover:text-white transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

