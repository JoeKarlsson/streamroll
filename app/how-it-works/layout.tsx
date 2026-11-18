import type { Metadata } from "next";
import { baseOpenGraph, baseTwitter } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "How it's built — StreamRoll",
  description:
    "A walkthrough of the Runway API pattern behind StreamRoll: textToImage chained into imageToVideo to produce custom animated pre-roll intros.",
  alternates: {
    canonical: "https://streamroll.vercel.app/how-it-works",
  },
  openGraph: {
    ...baseOpenGraph,
    title: "How it's built — StreamRoll",
    description:
      "A walkthrough of the Runway API pattern behind StreamRoll: textToImage chained into imageToVideo.",
    url: "https://streamroll.vercel.app/how-it-works",
    type: "article",
  },
  twitter: {
    ...baseTwitter,
    title: "How it's built — StreamRoll",
  },
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to generate a streaming intro with the Runway API",
  description:
    "Chain textToImage and imageToVideo Runway API calls to produce a custom animated pre-roll intro.",
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
      name: "Generate a title card",
      text: "Call runway.textToImage.create() with your service name and a style prompt to produce a 1920×1080 title card.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Animate it into video",
      text: "Pass the image URL to runway.imageToVideo.create() to produce a 2–10 second animated intro. The output URL from step 1 is the input to step 2.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Add to your media server",
      text: "Download the .mp4 and configure it as a pre-roll in Plex, Jellyfin, or Emby.",
    },
  ],
};

const faqSchema = {
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
      acceptedAnswer: { "@type": "Answer", text: "Jellyfin has no built-in pre-roll setting. Install an intros plugin from Dashboard → Plugins → Catalog, then point it at your .mp4 file." },
    },
    {
      "@type": "Question",
      name: "How do I add a pre-roll intro to Emby?",
      acceptedAnswer: { "@type": "Answer", text: "Go to Server Settings → Cinema Mode → Pre-Roll Videos → add the .mp4 file path, then enable Cinema Mode for playback sessions." },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {children}
    </>
  );
}
