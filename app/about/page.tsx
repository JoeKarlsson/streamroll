import type { Metadata } from "next";
import Link from "next/link";
import { LINKS } from "@/lib/links";

export const metadata: Metadata = {
  title: "About — StreamRoll",
  description:
    "Artist statement for StreamRoll, which makes a Netflix-style intro for your own Plex, Jellyfin or Emby server from its name.",
  alternates: {
    canonical: "https://streamroll.vercel.app/about",
  },
  openGraph: {
    title: "About — StreamRoll",
    description: "Artist statement for StreamRoll, Netflix-style intros for your own media server.",
    url: "https://streamroll.vercel.app/about",
    type: "article",
    locale: "en_US",
    images: [{
      url: "/opengraph-image.png",
      width: 1376,
      height: 768,
      type: "image/png",
      alt: "StreamRoll — AI-generated streaming intros",
    }],
  },
};

export default function AboutPage() {
  return (
    <main id="main-content" className="flex-1 bg-background text-white flex flex-col items-center pt-10 pb-16">
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-3xl font-bold mb-10">Artist statement</h1>

        <div className="max-w-[65ch] space-y-5 text-neutral-300 leading-relaxed">
          <p>
            Netflix plays its sting before every show. Plex, Jellyfin and Emby will play a short video before every movie
            too, but you hit play on a home server and it could be anyone’s.
          </p>
          <p>
            StreamRoll makes one from your server’s name. You type a name like Joeflix, pick a style, and get back a
            title card that moves, ready to play before every movie.
          </p>
          <p>
            There’s no StreamRoll account and nothing to pay me, and it hands you the code that made your clip, so you
            can make the next one without my site.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-6 text-sm">
          <a href="https://www.joekarlsson.com/work/streamroll/" className={LINK_CLASS}>
            More about it, with how it’s made, on joekarlsson.com
          </a>
          <Link href="/how-it-works" className={LINK_CLASS}>
            How it’s built
          </Link>
          <a href={LINKS.repoGitHub} target="_blank" rel="noopener noreferrer" className={LINK_CLASS}>
            The code on GitHub
          </a>
        </div>

        <section id="privacy" aria-labelledby="privacy-heading" className="mt-16 max-w-[65ch]">
          <h2 id="privacy-heading" className="text-xl font-semibold mb-4">Privacy</h2>
          <div className="space-y-4 text-neutral-300 leading-relaxed">
            <p>
              Visits are counted with Plausible, a self-hosted analytics tool that sets no cookies and stores no
              personal data.
            </p>
            <p>
              You bring your own Runway API key, added on{" "}
              <Link href="/setup" className="underline underline-offset-4 hover:text-white">Get started</Link>. Your key
              stays in your browser. Each request passes it through this site’s server to Runway, which never saves or
              logs it.
            </p>
            <p>
              Your server’s name, your prompt and any logo you upload go to Runway to make the title card and video.
              Music you add is mixed into the video inside your browser and never leaves your device.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

const LINK_CLASS =
  "min-h-11 inline-flex items-center text-neutral-400 hover:text-white underline underline-offset-2 transition-colors";
