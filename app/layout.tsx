import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { baseOpenGraph, baseTwitter } from "@/lib/metadata";
import { JsErrorTracker } from "./JsErrorTracker";
import "./globals.css";
import { siteDescription as description } from "@/lib/metadata";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Only code samples use it, below the fold, so it isn't preloaded.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

export const viewport: Viewport = {
  themeColor: "#080808",
};

export const metadata: Metadata = {
  title: "StreamRoll — AI Streaming Intros",
  description,
  metadataBase: new URL("https://streamroll.vercel.app"),
  alternates: {
    canonical: "https://streamroll.vercel.app",
  },
  authors: [{ name: "Joe Karlsson", url: "https://joekarlsson.com" }],
  openGraph: {
    ...baseOpenGraph,
    title: "StreamRoll — AI Streaming Intros",
    description,
    url: "https://streamroll.vercel.app",
  },
  twitter: {
    ...baseTwitter,
    title: "StreamRoll — AI Streaming Intros",
    description,
  },
  // The site is dark-only. Viewport's colorScheme type has no "only dark", and darkreader-lock stops Dark Reader re-theming it.
  other: {
    "color-scheme": "only dark",
    "darkreader-lock": "true",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`,
          }}
        />
        {/* Served from this origin through the /js and /api/event rewrites in next.config.ts */}
        <script
          defer
          data-domain="streamroll.vercel.app"
          data-api="/api/event"
          src="/js/script.file-downloads.hash.outbound-links.pageview-props.tagged-events.js"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-3 focus:bg-white focus:text-black focus:rounded-lg focus:font-medium focus:text-sm"
        >
          Skip to main content
        </a>
        {/* Home-page-only schema: belongs in app/page.tsx (Agent C's file); move it there at merge. */}
        <JsErrorTracker />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
