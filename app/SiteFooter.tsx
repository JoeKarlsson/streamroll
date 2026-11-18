import Link from "next/link";
import { LINKS, BUILDER } from "@/lib/links";

const LINK_CLASS =
  "min-h-11 inline-flex items-center whitespace-nowrap underline underline-offset-4 decoration-neutral-700 transition-colors hover:text-white hover:decoration-white";

export function SiteFooter() {
  return (
    <footer className="w-full flex justify-center bg-background">
      <div className="w-full max-w-2xl px-4 pt-6 pb-12 border-t border-neutral-900 text-sm text-neutral-500">
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5">
            <li><Link href="/how-it-works" className={LINK_CLASS}>How it’s built</Link></li>
            <li><Link href="/about" className={LINK_CLASS}>About</Link></li>
            <li><Link href="/setup" className={LINK_CLASS}>Get started</Link></li>
            <li><a href={LINKS.repoGitHub} className={LINK_CLASS}>GitHub</a></li>
          </ul>
        </nav>
        <p className="flex flex-wrap gap-x-5">
          <a href="https://runwayml.com" className={LINK_CLASS}>Powered by Runway</a>
          <span className="min-h-11 inline-flex items-center whitespace-nowrap">
            Built by&nbsp;<a href={BUILDER.website} className={LINK_CLASS}>{BUILDER.name}</a>
          </span>
        </p>
        <p className="mt-3 max-w-[65ch]">
          Cookieless analytics only. Your Runway key stays in your browser; each request passes it through this
          site’s server to Runway, which never saves or logs it.
        </p>
      </div>
    </footer>
  );
}
