#!/usr/bin/env node
/**
 * Runway task manager — check status, cancel active tasks, download finished videos.
 *
 * Usage:
 *   node scripts/manage-tasks.mjs <task-id> [<task-id> ...]
 *
 * API key is read from RUNWAYML_API_SECRET env var or .env.local in the project root.
 * Downloaded videos are saved to ./downloads/
 *
 * How to get task IDs:
 *   1. Go to dev.runwayml.com → Request History
 *   2. Filter: POST | /v1/image_to_video
 *   3. Click each row → "Generation result" tab → copy the ID
 */

import { createWriteStream, readFileSync } from "fs";
import { mkdir } from "fs/promises";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import RunwayML from "@runwayml/sdk";

// ── API key resolution ────────────────────────────────────────────────────────
function loadEnvLocal() {
  try {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const raw = readFileSync(`${root}/.env.local`, "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch { /* no .env.local — that's fine */ }
}
loadEnvLocal();

const apiKey = process.env.RUNWAYML_API_SECRET;
if (!apiKey) {
  console.error("❌  Set RUNWAYML_API_SECRET in your environment or .env.local");
  process.exit(1);
}

// ── Task IDs from CLI args ────────────────────────────────────────────────────
const taskIds = process.argv.slice(2).filter(a => a.trim());
if (taskIds.length === 0) {
  console.error("Usage: node scripts/manage-tasks.mjs <task-id> [<task-id> ...]");
  console.error("\nGet IDs from: dev.runwayml.com → Request History → click a row → Generation result tab");
  process.exit(1);
}

const client = new RunwayML({ apiKey });
await mkdir("./downloads", { recursive: true });

console.log(`\nChecking ${taskIds.length} task(s)…\n`);

const results = { downloaded: 0, cancelled: 0, skipped: 0, errors: 0 };

for (const id of taskIds) {
  process.stdout.write(`  ${id}  →  `);
  try {
    const task = await client.tasks.retrieve(id);

    switch (task.status) {
      case "SUCCEEDED": {
        const url = task.output[0];
        const filename = `./downloads/${id}.mp4`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} downloading video`);
        await pipeline(Readable.fromWeb(res.body), createWriteStream(filename));
        console.log(`✅  downloaded  →  ${filename}`);
        results.downloaded++;
        break;
      }
      case "RUNNING":
      case "PENDING":
      case "THROTTLED": {
        await client.tasks.delete(id);
        console.log(`🗑   cancelled   (was ${task.status})`);
        results.cancelled++;
        break;
      }
      case "FAILED":
        console.log(`💀  failed      — ${task.failure ?? "unknown reason"}`);
        results.skipped++;
        break;
      case "CANCELLED":
        console.log(`⬜  already cancelled`);
        results.skipped++;
        break;
      default:
        console.log(`❓  unknown status: ${task.status}`);
        results.skipped++;
    }
  } catch (e) {
    console.log(`❌  error: ${e.message}`);
    results.errors++;
  }
}

console.log(`
────────────────────────────────────
  Downloaded : ${results.downloaded}
  Cancelled  : ${results.cancelled}
  Skipped    : ${results.skipped}
  Errors     : ${results.errors}
────────────────────────────────────
Downloads saved to: ./downloads/
`);
