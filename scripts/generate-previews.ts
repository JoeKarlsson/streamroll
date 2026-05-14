#!/usr/bin/env tsx
// Generate static preview thumbnails for all preset cards.
// Usage: RUNWAYML_API_SECRET=sk-... npx tsx scripts/generate-previews.ts
// Re-run safely — skips files that already exist unless you pass --force.

import RunwayML from "@runwayml/sdk";
import { buildPrompts } from "../lib/runway";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const API_KEY = process.env.RUNWAYML_API_SECRET;
if (!API_KEY) {
  console.error("Set RUNWAYML_API_SECRET before running.");
  process.exit(1);
}

const force = process.argv.includes("--force");
const client = new RunwayML({ apiKey: API_KEY, timeout: 120_000 });

type Job = { key: string; name: string; style: string; tagline: string; customNotes?: string; rawPrompt?: string };

const JOBS: Job[] = [
  // Seasonal
  { key: "fall",   name: "Fall",   style: "cinematic",  tagline: "The season of great stories",   customNotes: "autumn leaves drifting down, warm amber and orange hues, golden light through turning foliage, crisp air" },
  { key: "winter", name: "Winter", style: "minimal",    tagline: "Crisp nights, great stories",    customNotes: "winter frost and fresh snowfall, cool blue-white palette, clean icy crisp quiet atmosphere" },
  { key: "spring", name: "Spring", style: "anime",      tagline: "Where great stories bloom",      customNotes: "blooming cherry blossoms, fresh spring morning light, pastel colors, nature awakening and renewal" },
  { key: "summer", name: "Summer", style: "epic",       tagline: "Blockbuster season is here",     customNotes: "blazing summer sun high overhead, golden warm light, bold bright saturated energy, heat shimmer" },
  // Holidays
  { key: "easter",          name: "Easter",           style: "lofi",       tagline: "Where stories bloom",            customNotes: "sunrise spring morning, soft pastel wildflowers blooming, pale blue robin eggs, gentle birdsong warmth" },
  { key: "mothers-day",     name: "Mother's Day",     style: "lofi",       tagline: "With love, always",               customNotes: "fresh garden roses and soft lavender blooms, warm golden morning sunlight, heartfelt and tender" },
  { key: "fathers-day",     name: "Father's Day",     style: "epic",       tagline: "Dad approved content",            customNotes: "golden summer afternoon, classic americana warmth, amber light, the films he always wanted to share" },
  { key: "halloween",       name: "Halloween",        style: "horror",     tagline: "Horror has a home",               customNotes: "jack-o-lanterns and cobwebs, haunted autumn night atmosphere, orange and black" },
  { key: "christmas",       name: "Christmas",        style: "cinematic",  tagline: "The magic of Christmas",          customNotes: "Christmas tree with glowing lights and ornaments, snowfall, warm holiday red and green" },
  { key: "new-years",       name: "New Year's Eve",   style: "futuristic", tagline: "The future starts tonight",       customNotes: "fireworks bursting overhead, countdown to midnight celebration, gold and silver confetti" },
  { key: "oscars",          name: "Oscar Night",      style: "cinematic",  tagline: "And the award goes to...",        customNotes: "Hollywood red carpet, gleaming gold award statuettes, black-tie glamour, sequins and spotlights" },
  { key: "pride",           name: "Pride",            style: "epic",       tagline: "Stream with pride",               customNotes: "rainbow pride flag spectrum, vivid red orange yellow green blue violet rays bursting outward from behind the logo, full saturated ROYGBIV color explosion, joyful pride parade celebration energy, love and joy radiating in every direction" },
  { key: "valentines",      name: "Valentine's Day",  style: "retro",      tagline: "For the love of streaming",      customNotes: "hearts and red roses, romantic pink and crimson palette, love in the air" },
  { key: "st-patricks",     name: "St. Patrick's Day",style: "nature",     tagline: "Stream your luck tonight",        customNotes: "shamrocks and clover, rich vivid Irish green, golden sunlight, festive spirit" },
  { key: "fourth-of-july",  name: "Fourth of July",   style: "epic",       tagline: "Independence from bad content",   customNotes: "fireworks in red white and blue, patriotic summer night sky, stars and stripes energy" },
  { key: "thanksgiving",    name: "Thanksgiving",      style: "cinematic",  tagline: "Gather and stream together",      customNotes: "harvest cornucopia and autumn abundance, warm earthy tones, grateful gathering season" },
  { key: "hanukkah",        name: "Hanukkah",          style: "minimal",    tagline: "Eight nights of great picks",     customNotes: "menorah with glowing candles, blue and silver palette, Festival of Lights warmth" },
  // Studios (only EBS — the others already have images in /public/studios/)
  { key: "ebs", name: "Emergency Broadcast", style: "ebs", tagline: "This is not a test",
    rawPrompt: "Classic SMPTE television color bars test pattern filling the upper two-thirds of the frame: seven precise vertical bands in exact left-to-right order — white, yellow, cyan, green, magenta, red, blue — with sharp clean edges and vivid saturated color. Black section in the bottom third containing bold white monospace uppercase text. Faint CRT phosphor scan lines across the entire frame. Vintage broadcast television emergency test card aesthetic. Wide 16:9 composition. No people." },
  // Custom
  { key: "blank-slate",     name: "My Service",  style: "cinematic",  tagline: "" },
  { key: "sci-fi",          name: "Sci-Fi",       style: "futuristic", tagline: "The future of entertainment" },
  { key: "lo-fi",           name: "Lo-Fi",        style: "lofi",       tagline: "Slow down and stream" },
  { key: "nature",          name: "Nature",       style: "nature",     tagline: "Stories from the wild" },
  // Styles
  { key: "style-prestige",   name: "Joeflix",     style: "prestige",   tagline: "Where stories come alive" },
  { key: "style-cinematic",  name: "Joeflix",     style: "cinematic",  tagline: "Where stories come alive" },
  { key: "style-retro",      name: "VibeTube",    style: "retro",      tagline: "Totally tubular" },
  { key: "style-futuristic", name: "SkyBox",      style: "futuristic", tagline: "Beyond the horizon" },
  { key: "style-minimal",    name: "WhiteRoom",   style: "minimal",    tagline: "Less is more" },
  { key: "style-horror",     name: "NightOwl",    style: "horror",     tagline: "Streaming after dark" },
  { key: "style-anime",      name: "SakuraTV",    style: "anime",      tagline: "Stories bloom here" },
  { key: "style-adultswim",  name: "LateNight",   style: "adultswim",  tagline: "on after dark" },
  { key: "style-cartoon",    name: "CheckerBox",  style: "cartoon",    tagline: "Serious about fun" },
  { key: "style-vhs",        name: "RewindFlix",  style: "vhs",        tagline: "Be kind, rewind" },
  { key: "style-grindhouse", name: "DriveIn",     style: "grindhouse", tagline: "NOW SHOWING" },
  { key: "style-lofi",       name: "ChillFlix",   style: "lofi",       tagline: "beats to stream to" },
  { key: "style-vaporwave",  name: "VaporFlix",   style: "vaporwave",  tagline: "aesthetic dreams" },
  { key: "style-cyberpunk",  name: "NeonCity",    style: "cyberpunk",  tagline: "The future is now" },
  { key: "style-hbo",        name: "StaticFlix",  style: "hbo",        tagline: "It's not TV" },
  { key: "style-epic",       name: "EpicQuest",   style: "epic",       tagline: "Every story is legendary" },
  { key: "style-nature",     name: "TerraDoc",    style: "nature",     tagline: "The world, unfiltered" },
  { key: "style-blockbuster",name: "VideoVault",  style: "blockbuster",tagline: "Make it a Blockbuster night" },
];

void (async () => {
mkdirSync("public/previews", { recursive: true });

let generated = 0;
let skipped = 0;

for (const job of JOBS) {
  const outPath = join("public/previews", `${job.key}.png`);

  if (!force && existsSync(outPath)) {
    console.log(`  skip  ${job.key} (already exists — pass --force to regenerate)`);
    skipped++;
    continue;
  }

  console.log(`  gen   ${job.key}...`);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { imagePrompt: builtPrompt } = buildPrompts({ name: job.name, style: job.style as any, tagline: job.tagline, duration: 5, treatment: "full-bleed", customNotes: job.customNotes, videoModel: "gen4_turbo" });
    const imagePrompt = job.rawPrompt ?? builtPrompt;

    const task = await client.textToImage
      .create({ model: "gen4_image", promptText: imagePrompt, ratio: "1920:1080" })
      .waitForTaskOutput();

    const url = task.output[0];
    const res = await fetch(url);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const buf = await res.arrayBuffer();
    writeFileSync(outPath, Buffer.from(buf));
    console.log(`  ✓     saved ${outPath}`);
    generated++;
  } catch (err) {
    console.error(`  ✗     ${job.key}:`, err);
  }
}

console.log(`\nDone. ${generated} generated, ${skipped} skipped.`);
})();
