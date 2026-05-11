# StreamRoll

**StreamRoll generates custom animated pre-roll intros for home media servers — the same idea as Netflix's "Tudum" logo sting, but for your personal Plex, Jellyfin, or Emby setup.**

A pre-roll is a short video that plays before every movie in your library. Plex, Jellyfin, and Emby all support them natively — most people either skip the feature entirely or spend hours sourcing one. StreamRoll generates one from your service name and a text prompt in about 30 seconds.

Type a name like "Joeflix", pick a visual style, and get a downloadable `.mp4` ready to drop straight into your media server. Built on the [Runway API](https://dev.runwayml.com) as a demonstration of chaining image and video generation.

**[Live demo →](https://streamroll.vercel.app)**

---

## How it works

Two Runway API calls, chained:

1. **`gen4_image`** — turns a text prompt into a 1920×1080 title card (~8 credits)
2. **`gen4_turbo` / `gen4.5` / Veo 3.1** — animates that image into a 5-second video (~25 credits)

The output URL from step 1 is the input to step 2. That's the whole pattern.

```ts
const imageTask = await runway.textToImage.create({
  model: "gen4_image",
  promptText: `Streaming service logo for "JOEFLIX", pure black background,
    bold crimson red wordmark, clean minimal sans-serif typography`,
  ratio: "1920:1080",
}).waitForTaskOutput();

const videoTask = await runway.imageToVideo.create({
  model: "gen4_turbo",
  promptImage: imageTask.output[0],
  promptText: `Logo snaps into frame from pure darkness with a single bold
    confident reveal, clean authoritative impact`,
  ratio: "1280:720",
  duration: 5,
}).waitForTaskOutput();
```

See the [How it's built](https://streamroll.vercel.app/how-it-works) page for a full walkthrough with copyable code.

---

## Features

- 9 visual styles — Prestige, Cinematic, Retro, Futuristic, Minimal, Horror, Anime, Epic, Nature
- Seasonal presets and inspiration grid to get started fast
- Upload your own logo instead of generating one
- Advanced settings: all 6 Runway video models (including Veo 3.1 with audio), card treatment, accent color, custom prompt notes
- Live generation timer so you can see exactly how long each API step takes
- Copy-as-script button exports the exact Node.js code that produced your video
- One-click share to r/plexprerolls and X
- Install instructions for Plex, Jellyfin, and Emby built in

---

## Running locally

**1. Clone and install**

```bash
git clone https://github.com/JoeKarlsson/streamroll
cd streamroll
npm install
```

**2. Get a Runway API key**

Sign up at [dev.runwayml.com](https://dev.runwayml.com) — the free tier includes enough credits to generate several videos.

**3. Add your key**

```bash
cp .env.example .env.local
# edit .env.local and set RUNWAYML_API_SECRET=your_key_here
```

Or skip this and enter your key directly in the app at `/setup` — it's stored in your browser only, never sent to a server.

**4. Start the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Tech stack

- [Next.js 15](https://nextjs.org) App Router
- [`@runwayml/sdk`](https://github.com/runwayml/sdk-node) — official Runway Node.js SDK
- [Tailwind CSS](https://tailwindcss.com)
- Deployable to [Vercel](https://vercel.com) with zero config

---

## Runway API resources

- [SDK docs](https://docs.dev.runwayml.com/api-details/sdks/)
- [Image-to-video reference](https://docs.dev.runwayml.com)
- [Pricing](https://docs.dev.runwayml.com/guides/pricing/)
- [Developer community on Discord](https://discord.gg/runwayml)

---

Built by [Joe Karlsson](https://joekarlsson.com)
