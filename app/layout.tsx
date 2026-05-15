import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#080808",
};

export const metadata: Metadata = {
  title: "StreamRoll — AI Streaming Intros",
  description:
    "Generate custom animated pre-roll intros for Plex, Jellyfin, and Emby using Runway AI. Type your service name, pick a style, get a downloadable MP4 in 30 seconds.",
  metadataBase: new URL("https://streamroll.vercel.app"),
  alternates: {
    canonical: "https://streamroll.vercel.app",
  },
  openGraph: {
    title: "StreamRoll — AI Streaming Intros",
    description:
      "Generate custom animated pre-roll intros for Plex, Jellyfin, and Emby using Runway AI. Type your service name, pick a style, get a downloadable MP4 in 30 seconds.",
    url: "https://streamroll.vercel.app",
    siteName: "StreamRoll",
    type: "website",
    locale: "en_US",
    images: [{
      url: "/opengraph-image.png",
      width: 1376,
      height: 768,
      type: "image/png",
      alt: "StreamRoll — AI-generated streaming intros for Plex, Jellyfin & Emby",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StreamRoll — AI Streaming Intros",
    description:
      "Generate custom animated pre-roll intros for Plex, Jellyfin, and Emby using Runway AI.",
    site: "@joekarlsson1",
    creator: "@joekarlsson1",
    images: ["/opengraph-image.png"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`,
          }}
        />
        <script
          defer
          data-domain="streamroll.vercel.app"
          src="https://plausible.joekarlsson.io/js/script.file-downloads.hash.outbound-links.pageview-props.tagged-events.js"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:font-medium focus:text-sm"
        >
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StreamRoll",
              url: "https://streamroll.vercel.app",
              description:
                "Generate custom animated pre-roll intros for Plex, Jellyfin, and Emby using Runway AI.",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web",
              author: {
                "@type": "Person",
                name: "Joe Karlsson",
                url: "https://joekarlsson.com",
              },
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "How do I add a pre-roll intro to Plex?",
                  acceptedAnswer: { "@type": "Answer", text: "Go to Settings → Extras → Cinema Trailers → enable pre-roll, then place the .mp4 in your designated Extras folder." },
                },
                {
                  "@type": "Question",
                  name: "How do I add a pre-roll video to Jellyfin?",
                  acceptedAnswer: { "@type": "Answer", text: "Go to Dashboard → Administration → Pre-Roll Video → browse and upload your .mp4 file." },
                },
                {
                  "@type": "Question",
                  name: "How do I add a pre-roll intro to Emby?",
                  acceptedAnswer: { "@type": "Answer", text: "Go to Server Settings → Cinema Mode → Pre-Roll Videos → add the .mp4 file path, then enable Cinema Mode for playback sessions." },
                },
              ],
            }),
          }}
        />
        {children}
      </body>
    </html>
  );
}
