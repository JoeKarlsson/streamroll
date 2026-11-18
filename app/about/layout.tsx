import type { Metadata } from "next";
import { baseOpenGraph, baseTwitter } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "About — StreamRoll",
  description:
    "Artist statement for StreamRoll, which makes a Netflix-style intro for your own Plex, Jellyfin or Emby server from its name.",
  alternates: {
    canonical: "https://streamroll.vercel.app/about",
  },
  openGraph: {
    ...baseOpenGraph,
    title: "About — StreamRoll",
    description: "Artist statement for StreamRoll, Netflix-style intros for your own media server.",
    url: "https://streamroll.vercel.app/about",
    type: "article",
  },
  twitter: {
    ...baseTwitter,
    title: "About — StreamRoll",
    description: "Artist statement for StreamRoll, Netflix-style intros for your own media server.",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "StreamRoll", item: "https://streamroll.vercel.app" },
    { "@type": "ListItem", position: 2, name: "About", item: "https://streamroll.vercel.app/about" },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
