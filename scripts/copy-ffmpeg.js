#!/usr/bin/env node
// Copies @ffmpeg/core WASM assets and @ffmpeg/ffmpeg worker scripts into public/ffmpeg/
// so they are served from the same origin. Run automatically before `next build`.
const { copyFileSync, mkdirSync } = require("fs");
const { join } = require("path");

const dest = join(__dirname, "../public/ffmpeg");
mkdirSync(dest, { recursive: true });

// ESM WASM runtime (kept for the .wasm binary, shared between ESM and UMD)
const coreEsm = join(__dirname, "../node_modules/@ffmpeg/core/dist/esm");
copyFileSync(join(coreEsm, "ffmpeg-core.wasm"), join(dest, "ffmpeg-core.wasm"));

// UMD core — used by the classic worker via importScripts (no import.meta.url, works in Firefox)
const coreUmd = join(__dirname, "../node_modules/@ffmpeg/core/dist/umd");
copyFileSync(join(coreUmd, "ffmpeg-core.js"), join(dest, "ffmpeg-core-umd.js"));

// Classic (UMD) worker bundle — uses importScripts instead of dynamic import()
const ffmpegUmd = join(__dirname, "../node_modules/@ffmpeg/ffmpeg/dist/umd");
copyFileSync(join(ffmpegUmd, "814.ffmpeg.js"), join(dest, "classic-worker.js"));

console.log("✓ Copied @ffmpeg assets to public/ffmpeg/");
