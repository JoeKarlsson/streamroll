"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it’s built" },
  { href: "/about", label: "About" },
  { href: "/setup", label: "Get started" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="w-full flex justify-center bg-background">
      <nav
        aria-label="Site"
        className="w-full max-w-2xl px-4 pt-3 flex flex-wrap items-center justify-between gap-x-5 text-sm text-neutral-500"
      >
        <Link
          href="/"
          aria-current={pathname === "/" ? "page" : undefined}
          className="min-h-11 inline-flex items-center font-bold text-lg text-white"
        >
          StreamRoll
        </Link>
        <ul className="flex flex-wrap items-center gap-x-5">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="min-h-11 inline-flex items-center whitespace-nowrap underline-offset-4 transition-colors hover:text-white aria-[current=page]:text-white aria-[current=page]:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
