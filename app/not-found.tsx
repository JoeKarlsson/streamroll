import type { Metadata } from "next";
import Link from "next/link";
import { NotFoundTracker } from "./NotFoundTracker";

export const metadata: Metadata = {
  title: "Page not found — StreamRoll",
};

const LINK_CLASS =
  "min-h-11 inline-flex items-center text-neutral-300 hover:text-white underline underline-offset-4 transition-colors";

export default function NotFound() {
  return (
    <main id="main-content" className="flex-1 bg-background text-white flex flex-col items-center pt-10 pb-16">
      <NotFoundTracker />
      <div className="w-full max-w-2xl px-4">
        <h1 className="text-3xl font-bold mb-3">Page not found</h1>
        <p className="text-neutral-400 mb-8">There’s nothing at this address. Try one of these instead.</p>
        <ul className="flex flex-wrap gap-x-6 text-sm">
          <li><Link href="/" className={LINK_CLASS}>Make an intro</Link></li>
          <li><Link href="/how-it-works" className={LINK_CLASS}>How it’s built</Link></li>
          <li><Link href="/about" className={LINK_CLASS}>About</Link></li>
          <li><Link href="/setup" className={LINK_CLASS}>Get started</Link></li>
        </ul>
      </div>
    </main>
  );
}
