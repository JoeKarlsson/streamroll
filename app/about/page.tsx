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
    <main className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors mb-10"
        >
          ← Back to StreamRoll
        </Link>

        <h1 className="text-3xl font-bold tracking-tight mb-10">Artist statement</h1>

        <div className="space-y-5 text-neutral-300 leading-relaxed">
          <p>
            Plex, Jellyfin and Emby will all play a short video before every movie, the way Netflix plays its sting,
            but most people who run their own server skip it or spend hours finding one.
          </p>
          <p>
            Streamroll makes one from your server&apos;s name. You type a name like Joeflix, pick a style, and about 30
            seconds later you have a title card that moves, ready to drop in. You approve the still before it turns into
            video, and you can mix in your own audio right in the browser.
          </p>
          <p>
            It runs on your own Runway API key, so there&apos;s no account and nothing to pay me.{" "}
            <code className="text-white">Copy as script</code> gives you the Node.js code that made your clip, so you can
            make the next one without my site.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <a
            href="https://www.joekarlsson.com/work/streamroll/"
            className="text-neutral-400 hover:text-white underline underline-offset-2 transition-colors"
          >
            More about it, with how it&apos;s made, on joekarlsson.com
          </a>
          <Link href="/how-it-works" className="text-neutral-400 hover:text-white underline underline-offset-2 transition-colors">
            How it&apos;s built
          </Link>
          <a
            href={LINKS.repoGitHub}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-400 hover:text-white underline underline-offset-2 transition-colors"
          >
            The code on GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
