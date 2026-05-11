import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it's built — StreamRoll",
  description:
    "A walkthrough of the Runway API pattern behind StreamRoll: textToImage chained into imageToVideo to produce custom animated pre-roll intros in about 30 seconds.",
  openGraph: {
    title: "How it's built — StreamRoll",
    description:
      "A walkthrough of the Runway API pattern behind StreamRoll: textToImage chained into imageToVideo.",
    url: "https://streamroll.vercel.app/how-it-works",
    type: "article",
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
    title: "How it's built — StreamRoll",
    site: "@joekarlsson1",
    creator: "@joekarlsson1",
    images: ["/opengraph-image.png"],
  },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to generate a streaming intro with the Runway API",
  description:
    "Chain textToImage and imageToVideo Runway API calls to produce a custom animated pre-roll intro in about 30 seconds.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Install the SDK",
      text: "Run: npm install @runwayml/sdk",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Generate a logo image",
      text: "Call runway.textToImage.create() with your service name and a style prompt to produce a 1920×1080 title card.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Animate it into video",
      text: "Pass the image URL to runway.imageToVideo.create() to produce a 4–5 second animated intro. The output URL from step 1 is the input to step 2.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Add to your media server",
      text: "Download the .mp4 and configure it as a pre-roll in Plex, Jellyfin, or Emby.",
    },
  ],
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "StreamRoll", item: "https://streamroll.vercel.app" },
    { "@type": "ListItem", position: 2, name: "How it's built", item: "https://streamroll.vercel.app/how-it-works" },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
