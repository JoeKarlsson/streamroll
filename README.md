# Streamroll

[![Website](https://img.shields.io/badge/website-streamroll.vercel.app-ff4fd8)](https://streamroll.vercel.app)
[![CI](https://github.com/JoeKarlsson/streamroll/actions/workflows/ci.yml/badge.svg)](https://github.com/JoeKarlsson/streamroll/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

![A Streamroll intro in the neon outrun style: STREAMROLL in glowing pink and blue chrome letters over a dark neon grid, with smoke drifting behind it](.github/readme/2026-11-recording.gif)

Netflix plays its sting before every show, and Plex, Jellyfin and Emby will play
a short video before every movie too. Streamroll makes yours from your server's
name. There's no account and nothing to pay me, and it hands you the code that
made your clip, so you can make the next one without my site.

[Try it at streamroll.vercel.app](https://streamroll.vercel.app) ·
[Read the full statement](https://www.joekarlsson.com/work/streamroll/)

## Quick start

You need a Runway API key from [dev.runwayml.com](https://dev.runwayml.com).
Runway no longer gives free trial credits, so add credits or a payment method
first.

```bash
git clone https://github.com/JoeKarlsson/streamroll.git
cd streamroll
npm install
npm run dev     # http://localhost:3000
```

Enter your key at `/setup`. It stays in your browser and rides along with each
request to the app's API routes, which pass it to Runway. The server never
stores it. `RUNWAYML_API_SECRET` (see `.env.example`) is optional: the video
route falls back to it, and the scripts in `scripts/` need it.

## Development

```bash
npm test              # Vitest
npm run test:coverage
npm run lint
npm run build
```

Tests live in `__tests__/` and cover the API routes, `lib/` and `hooks/`. The
page and `app/AudioMixer.tsx` need browser APIs and aren't unit tested. Audio
mixing runs client-side with FFmpeg.wasm, served from the gitignored
`public/ffmpeg/`. `npm run build` fills it; under `npm run dev`, run
`node scripts/copy-ffmpeg.js` once first or the mixer has nothing to load.

It deploys to Vercel with `vercel`. No environment variables are needed there,
since every visitor brings their own key.

## License

MIT. See [LICENSE](LICENSE).
