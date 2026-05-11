import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StreamRoll — AI Streaming Intros",
  description:
    "Generate custom animated pre-roll intros for Plex, Jellyfin, and Emby using Runway AI. Type your service name, pick a style, get a downloadable MP4 in 30 seconds.",
  metadataBase: new URL("https://streamroll.vercel.app"),
  openGraph: {
    title: "StreamRoll — AI Streaming Intros",
    description:
      "Generate custom animated pre-roll intros for Plex, Jellyfin, and Emby using Runway AI. Type your service name, pick a style, get a downloadable MP4 in 30 seconds.",
    url: "https://streamroll.vercel.app",
    siteName: "StreamRoll",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StreamRoll — AI Streaming Intros",
    description:
      "Generate custom animated pre-roll intros for Plex, Jellyfin, and Emby using Runway AI.",
    creator: "@joekarlsson1",
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
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
