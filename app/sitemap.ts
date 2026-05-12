import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://streamroll.vercel.app",
      lastModified: new Date("2026-05-12"),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://streamroll.vercel.app/how-it-works",
      lastModified: new Date("2026-05-12"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://streamroll.vercel.app/setup",
      lastModified: new Date("2026-05-12"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
