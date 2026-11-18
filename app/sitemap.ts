import type { MetadataRoute } from "next";

// lastModified is the date each page's files last changed in git. Hard-coded because
// Vercel builds from a shallow clone, where git history can't be read reliably. Update on edit.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://streamroll.vercel.app", lastModified: new Date("2026-11-18") },
    { url: "https://streamroll.vercel.app/how-it-works", lastModified: new Date("2026-11-18") },
    { url: "https://streamroll.vercel.app/about", lastModified: new Date("2026-11-18") },
  ];
}
