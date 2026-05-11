import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get started — StreamRoll",
  description:
    "Add your Runway API key to start generating custom animated pre-roll intros for your Plex, Jellyfin, or Emby media server.",
  openGraph: {
    title: "Get started — StreamRoll",
    description:
      "Add your Runway API key to start generating custom animated pre-roll intros for your media server.",
    url: "https://streamroll.vercel.app/setup",
    locale: "en_US",
    images: [{
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      type: "image/png",
      alt: "StreamRoll — AI-generated streaming intros",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Get started — StreamRoll",
    site: "@joekarlsson1",
    creator: "@joekarlsson1",
    images: ["/opengraph-image.png"],
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
