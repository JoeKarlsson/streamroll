import type { Metadata } from "next";
import { baseOpenGraph, baseTwitter } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "Get started — StreamRoll",
  description:
    "Add your Runway API key to start generating custom animated pre-roll intros for your Plex, Jellyfin, or Emby media server.",
  alternates: {
    canonical: "https://streamroll.vercel.app/setup",
  },
  robots: { index: false, follow: true },
  openGraph: {
    ...baseOpenGraph,
    title: "Get started — StreamRoll",
    description:
      "Add your Runway API key to start generating custom animated pre-roll intros for your media server.",
    url: "https://streamroll.vercel.app/setup",
  },
  twitter: {
    ...baseTwitter,
    title: "Get started — StreamRoll",
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "StreamRoll", item: "https://streamroll.vercel.app" },
    { "@type": "ListItem", position: 2, name: "Get started", item: "https://streamroll.vercel.app/setup" },
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
