# How it's built

StreamRoll chains two Runway API calls: one to generate a title card, one to animate it into video. The whole thing is about 20 lines of TypeScript. Here's exactly how it works so you can build something similar.

## 1. Install the SDK

```bash
npm install @runwayml/sdk
```

Official SDKs for Node.js, Python, and more: [SDK docs](https://docs.dev.runwayml.com/api-details/sdks/), [SDK on GitHub](https://github.com/runwayml/sdk-node).

## 2. Generate the title card

`gen4_image` turns a text prompt into a sharp 1920×1080 title card. Cost: ~30 credits.

```typescript
import RunwayML from "@runwayml/sdk";

const runway = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

// Step 1: Generate a 1080p logo image
const imageTask = await runway.textToImage
  .create({
    model: "gen4_image",
    promptText: `Streaming service logo for "JOEFLIX",
      cinematic style, deep navy and gold, film grain,
      professional logo design, centered composition`,
    ratio: "1920:1080",
  })
  .waitForTaskOutput();

const logoUrl = imageTask.output[0];
// → https://runway-cdn.com/...
```

## 3. Animate it into video

Feed the image URL directly into `gen4_turbo` image-to-video. The two calls chain together: output of step 1 is input to step 2. Cost: 25 credits for 5 seconds.

```typescript
// Step 2: Animate the logo into a 5-second intro
const videoTask = await runway.imageToVideo
  .create({
    model: "gen4_turbo",
    promptImage: logoUrl,
    promptText: `The JOEFLIX logo animates with a slow cinematic
      push-in, golden particles drift upward, subtle lens
      flare blooms, atmospheric fog`,
    ratio: "1280:720",
    duration: 5,
  })
  .waitForTaskOutput();

const videoUrl = videoTask.output[0];
// → download and drop into Plex as a pre-roll ✓
```

### The video is silent, so add music

Runway generates video only. For a full cinematic intro, generate royalty-free music with [Udio](https://www.udio.com) or [Suno](https://suno.com), then merge with ffmpeg:

```bash
ffmpeg -i intro.mp4 -i music.mp3 -shortest -c:v copy -map 0:v -map 1:a output.mp4
```

## 4. Add it to your media server

Download the .mp4 and add it to Plex, Jellyfin or Emby as a pre-roll. Here's where to find the setting.

Pro tip: generate 3–5 variants in different styles and point your server at the whole folder. Plex, Emby and the Jellyfin intro plugins can rotate them at random, so you get a different intro every session.

- **Plex:** Settings → Extras → Cinema Trailers → enable "Cinema Trailers" pre-roll, then place the .mp4 in your designated Extras folder. [Cinema Trailers & Extras](https://support.plex.tv/articles/202934883-cinema-trailers-extras/)
- **Jellyfin:** Jellyfin has no built-in pre-roll setting. Install an intros plugin from Dashboard → Plugins → Catalog, then point it at your .mp4 in the plugin's settings. It plays before every movie. [Jellyfin Plugins docs](https://jellyfin.org/docs/general/server/plugins/)
- **Emby:** Server Settings → Cinema Mode → Pre-Roll Videos → add the .mp4 file path. Toggle Cinema Mode on for playback sessions. [Pre-roll community thread](https://emby.media/community/index.php?/topic/86649-pre-roll-videos/)

## Links

- [Get a Runway API key at dev.runwayml.com](https://dev.runwayml.com/)
- [Browse the full API reference](https://docs.dev.runwayml.com/)
- [Join the Runway developer community on Discord](https://discord.gg/runwayml)

Built by [Joe Karlsson](https://joekarlsson.com), a developer advocate building tools that make APIs click.
