import type { Metadata } from "next";

// Next replaces a parent's openGraph/twitter objects wholesale in a child segment,
// so every page spreads these to keep the site name, type, locale and card image.

const shareImage = {
  url: "/og-image.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "StreamRoll logo on a VHS tracking-noise screen, with the line “AI generated pre-roll intros”",
};

export const baseOpenGraph = {
  siteName: "StreamRoll",
  type: "website",
  locale: "en_US",
  images: [shareImage],
} satisfies Metadata["openGraph"];

export const baseTwitter = {
  card: "summary_large_image",
  site: "@joekarlsson1",
  creator: "@joekarlsson1",
  images: [shareImage],
} satisfies Metadata["twitter"];
