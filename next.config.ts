import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
  { key: "X-Content-Type-Options",          value: "nosniff" },
  { key: "X-Frame-Options",                 value: "DENY" },
  { key: "Referrer-Policy",                 value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control",          value: "on" },
  { key: "Permissions-Policy",              value: "camera=(), microphone=(), geolocation=()" },
  // Required for SharedArrayBuffer (FFmpeg.wasm). credentialless is less strict than
  // require-corp — cross-origin resources still load, just without credentials.
  { key: "Cross-Origin-Opener-Policy",      value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy",    value: "credentialless" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-inline': Next streams page data in inline scripts, and nonces would force every page to render dynamically.
      // blob: needed for FFmpeg WASM module URLs; wasm-unsafe-eval needed to compile WASM
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} 'wasm-unsafe-eval' blob:`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      // Runway serves generated images and videos from CloudFront; the browser fetches them to
      // download and to mix audio. data: covers posters drawn on canvas or uploaded by the visitor.
      "connect-src 'self' blob: data: https://*.cloudfront.net",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  // Plausible served from this origin, so ad blockers and the CSP treat it as first-party.
  async rewrites() {
    return [
      { source: "/js/:file", destination: "https://plausible.joekarlsson.io/js/:file" },
      { source: "/api/event", destination: "https://plausible.joekarlsson.io/api/event" },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      { source: "/ffmpeg/:path*", headers: immutable },
      { source: "/examples/:path*", headers: immutable },
      { source: "/previews/:path*", headers: immutable },
      { source: "/studios/:path*", headers: immutable },
      { source: "/logos/:path*", headers: immutable },
      { source: "/og-image.jpg", headers: immutable },
      { source: "/icons/:path*", headers: immutable },
    ];
  },
};

export default nextConfig;
