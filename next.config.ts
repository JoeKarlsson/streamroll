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
      // blob: needed for FFmpeg WASM module URLs; wasm-unsafe-eval needed to compile WASM
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} 'wasm-unsafe-eval' blob: https://plausible.joekarlsson.io`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      // https: needed so fetchFile() can pull the generated video from Runway's CDN
      "connect-src 'self' blob: https://plausible.joekarlsson.io https:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/ffmpeg/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/examples/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/logos/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/opengraph-image.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
