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

const PLATFORM_GUIDES = [
  {
    name: "Plex", slug: "plex", color: "#EBAF00",
    steps: "Settings → Extras → Cinema Trailers → enable “Cinema Trailers” pre-roll, then place the .mp4 in your designated Extras folder.",
    docs: "https://support.plex.tv/articles/202934883-cinema-trailers-extras/",
    docsLabel: "Plex guide to Cinema Trailers and Extras",
  },
  {
    name: "Jellyfin", slug: "jellyfin", color: "#00A4DC",
    steps: "Jellyfin has no built-in pre-roll setting. Install an intros plugin from Dashboard → Plugins → Catalog, then point it at your .mp4 in the plugin’s settings. It plays before every movie.",
    docs: "https://jellyfin.org/docs/general/server/plugins/",
    docsLabel: "Jellyfin plugin docs",
  },
  {
    name: "Emby", slug: "emby", color: "#52B54B",
    steps: "Server Settings → Cinema Mode → Pre-Roll Videos → add the .mp4 file path. Toggle Cinema Mode on for playback sessions.",
    docs: "https://emby.media/community/index.php?/topic/86649-pre-roll-videos/",
    docsLabel: "Emby pre-roll community thread",
  },
];

const H2_CLASS = "text-lg font-semibold text-white mb-2";
const BODY_CLASS = "max-w-[65ch] text-neutral-400 leading-relaxed";
const INLINE_LINK_CLASS = "text-neutral-300 hover:text-white underline underline-offset-2 transition-colors";

export default function HowItWorksPage() {
  return (
    <main id="main-content" className="flex-1 bg-background text-white flex flex-col items-center pt-10 pb-16">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-3xl font-bold mb-3">How it’s built</h1>
        <p className={`${BODY_CLASS} mb-12`}>
          StreamRoll chains two Runway API calls: one to generate a title card, one to animate it into video. The whole
          thing is <span className="text-white font-medium">about 20 lines of TypeScript</span>. Here’s exactly how it
          works so you can build something similar.
        </p>

        <ol className="list-decimal pl-6 space-y-14 marker:text-neutral-500 marker:font-semibold marker:text-lg">
          <li className="min-w-0">
            <h2 className={H2_CLASS}>Install the SDK</h2>
            <p className={`${BODY_CLASS} mb-4`}>
              Official SDKs for Node.js, Python and more. Read the{" "}
              <a href={LINKS.runwaySDK} target="_blank" rel="noopener noreferrer" className={INLINE_LINK_CLASS}>SDK docs</a>
              {" "}or the{" "}
              <a href={LINKS.runwayGitHub} target="_blank" rel="noopener noreferrer" className={INLINE_LINK_CLASS}>SDK on GitHub</a>.
            </p>
            <CodeBlock code={INSTALL_CODE} lang="bash" />
          </li>

          <li className="min-w-0">
            <h2 className={H2_CLASS}>Generate the title card</h2>
            <p className={`${BODY_CLASS} mb-4`}>
              <code className="text-neutral-300">gen4_image</code> turns a text prompt into a sharp 1920×1080 title
              card. Cost: about 30 credits.
            </p>
            <CodeBlock code={IMAGE_CODE} lang="typescript" />
          </li>

          <li className="min-w-0">
            <h2 className={H2_CLASS}>Animate it into video</h2>
            <p className={`${BODY_CLASS} mb-4`}>
              Feed the image URL straight into <code className="text-neutral-300">gen4_turbo</code> image-to-video. The
              two calls chain together: the output of step 1 is the input to step 2. Cost: 25 credits for 5 seconds.
            </p>
            <CodeBlock code={VIDEO_CODE} lang="typescript" />
            <h3 className="font-semibold text-white mt-8 mb-2">The video is silent, so add music</h3>
            <p className={`${BODY_CLASS} mb-4`}>
              Runway generates video only. For a full cinematic intro, generate royalty-free music with{" "}
              <a href="https://www.udio.com" target="_blank" rel="noopener noreferrer" className={INLINE_LINK_CLASS}>Udio</a>
              {" "}or{" "}
              <a href="https://suno.com" target="_blank" rel="noopener noreferrer" className={INLINE_LINK_CLASS}>Suno</a>,
              then merge it in with ffmpeg:
            </p>
            <CodeBlock code={`ffmpeg -i intro.mp4 -i music.mp3 -shortest -c:v copy -map 0:v -map 1:a output.mp4`} lang="bash" />
          </li>

          <li className="min-w-0">
            <h2 className={H2_CLASS}>Add it to your media server</h2>
            <p className={`${BODY_CLASS} mb-6`}>
              Download the .mp4 and add it to Plex, Jellyfin or Emby as a pre-roll. Here’s where to find the setting.
            </p>
            <div className="space-y-8">
              {PLATFORM_GUIDES.map((p) => (
                <div key={p.name}>
                  <h3 className="flex items-center gap-2 mb-2 font-semibold" style={{ color: p.color }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/logos/${p.slug}.svg`} alt="" width={16} height={16} loading="lazy" />
                    {p.name}
                  </h3>
                  <p className={BODY_CLASS}>{p.steps}</p>
                  <a
                    href={p.docs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-11 inline-flex items-center text-sm underline underline-offset-2 transition-opacity opacity-80 hover:opacity-100"
                    style={{ color: p.color }}
                  >
                    {p.docsLabel}
                  </a>
                </div>
              ))}
            </div>
            <p className={`${BODY_CLASS} mt-6`}>
              <span className="text-neutral-300 font-medium">Pro tip:</span> generate 3–5 variants in different styles
              and point your server at the whole folder. Plex, Emby and the Jellyfin intro plugins can rotate them at
              random, so you get a different intro every session.
            </p>
          </li>
        </ol>

        <section aria-label="Next steps" className="mt-14 space-y-3">
          <a
            href={LINKS.runwaySignup}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full min-h-11 bg-white text-black font-semibold px-5 py-3 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            Get a Runway API key
          </a>
          <p className="flex flex-wrap gap-x-6">
            <a href={LINKS.runwayDocs} target="_blank" rel="noopener noreferrer" className={`min-h-11 inline-flex items-center ${INLINE_LINK_CLASS}`}>
              Browse the full API reference
            </a>
            <a href={LINKS.runwayCommunity} target="_blank" rel="noopener noreferrer" className={`min-h-11 inline-flex items-center ${INLINE_LINK_CLASS}`}>
              Join Runway’s developer Discord
            </a>
          </p>
        </section>

        <p className={`${BODY_CLASS} mt-12`}>
          Built by{" "}
          <a href={BUILDER.website} target="_blank" rel="noopener noreferrer" className={INLINE_LINK_CLASS}>{BUILDER.name}</a>,
          a developer advocate building tools that make APIs click. Find him on{" "}
          <a href={BUILDER.twitter} target="_blank" rel="noopener noreferrer" className={INLINE_LINK_CLASS} aria-label="Joe on X">X</a>,{" "}
          <a href={BUILDER.github} target="_blank" rel="noopener noreferrer" className={INLINE_LINK_CLASS}>GitHub</a> and{" "}
          <a href={BUILDER.linkedin} target="_blank" rel="noopener noreferrer" className={INLINE_LINK_CLASS}>LinkedIn</a>.
        </p>
      </div>
    </main>
  );
}
