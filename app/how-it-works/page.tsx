import Link from "next/link";
import { LINKS, BUILDER } from "@/lib/links";

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
              <div className="font-semibold text-lg">{BUILDER.name}</div>
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

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-neutral-800">
        <span className="text-xs text-neutral-500">{lang}</span>
      </div>
      <pre className="p-4 text-xs text-neutral-300 font-mono leading-relaxed overflow-x-auto bg-neutral-950 whitespace-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}
