#!/usr/bin/env node
/**
 * PARALLEL — App Asset Generator
 * Generates icon.png, adaptive-icon.png, splash.png, favicon.png
 * using pure Node.js (no external dependencies).
 */

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// ── PNG Builder ────────────────────────────────────────────────────────────
function buildPNG(pixels, width, height) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB

  // Build scan lines: filter_byte(0) + R G B per pixel
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(height * rowSize);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const src = (y * width + x) * 3;
      const dst = y * rowSize + 1 + x * 3;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }

  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, makeChunk("IHDR", ihdr), makeChunk("IDAT", idat), makeChunk("IEND", Buffer.alloc(0))]);
}

// ── Pixel Helpers ──────────────────────────────────────────────────────────
function solidPixels(w, h, r, g, b) {
  const buf = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { buf[i * 3] = r; buf[i * 3 + 1] = g; buf[i * 3 + 2] = b; }
  return buf;
}

function lerp(a, b, t) { return Math.round(a + (b - a) * Math.max(0, Math.min(1, t))); }

// Creates dark bg with radial accent glow + hex ring
function iconPixels(size) {
  const buf = Buffer.alloc(size * size * 3);
  const cx = size / 2, cy = size / 2;
  const R = size / 2;

  // Brand colors
  const BG = [10, 11, 15];         // #0A0B0F
  const ACCENT = [123, 108, 246];  // #7B6CF6
  const SURFACE = [20, 22, 32];    // #141620

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const normDist = dist / R; // 0=center, 1=edge, >1=corner

      let r, g, b;

      if (normDist > 1) {
        // Outside circle — solid bg
        r = BG[0]; g = BG[1]; b = BG[2];
      } else {
        // Radial gradient: accent glow in center, surface ring, bg edge
        const glowFactor = Math.pow(Math.max(0, 1 - normDist / 0.55), 2.2);
        const ringFactor = normDist > 0.82 && normDist < 0.96 ? 0.6 : 0;

        r = lerp(BG[0], lerp(ACCENT[0], SURFACE[0], normDist / 0.6), glowFactor * 0.35 + ringFactor * 0.5);
        g = lerp(BG[1], lerp(ACCENT[1], SURFACE[1], normDist / 0.6), glowFactor * 0.35 + ringFactor * 0.5);
        b = lerp(BG[2], lerp(ACCENT[2], SURFACE[2], normDist / 0.6), glowFactor * 0.35 + ringFactor * 0.5);

        // Clamp
        r = Math.max(BG[0], Math.min(255, r));
        g = Math.max(BG[1], Math.min(255, g));
        b = Math.max(BG[2], Math.min(255, b));
      }

      const i = (y * size + x) * 3;
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
    }
  }

  // Draw "P" letterform (pixel rects) centered
  const unit = Math.round(size * 0.078); // ~80px at 1024
  const ox = Math.round(size * 0.31);    // x offset
  const oy = Math.round(size * 0.23);    // y offset

  // White (slightly blue-tinted)
  const W = [232, 233, 240]; // #E8E9F0

  function fillRect(x1, y1, x2, y2) {
    for (let py = Math.max(0, y1); py < Math.min(size, y2); py++) {
      for (let px = Math.max(0, x1); px < Math.min(size, x2); px++) {
        const i = (py * size + px) * 3;
        buf[i] = W[0]; buf[i + 1] = W[1]; buf[i + 2] = W[2];
      }
    }
  }

  // Vertical stem
  fillRect(ox, oy, ox + unit, oy + unit * 7);
  // Top bar
  fillRect(ox, oy, ox + unit * 5, oy + unit);
  // Right side top
  fillRect(ox + unit * 4, oy, ox + unit * 5, oy + unit * 4);
  // Middle bar
  fillRect(ox, oy + unit * 3, ox + unit * 5, oy + unit * 4);

  return buf;
}

// ── Generate Assets ────────────────────────────────────────────────────────
const OUT = path.join(__dirname, "../apps/mobile/assets");
fs.mkdirSync(OUT, { recursive: true });

const BG = [10, 11, 15];

// icon.png — 1024×1024
process.stdout.write("Generating icon.png …");
fs.writeFileSync(path.join(OUT, "icon.png"), buildPNG(iconPixels(1024), 1024, 1024));
console.log(" ✓");

// adaptive-icon.png — 1024×1024 (Android foreground, will be placed on bg)
process.stdout.write("Generating adaptive-icon.png …");
fs.writeFileSync(path.join(OUT, "adaptive-icon.png"), buildPNG(iconPixels(1024), 1024, 1024));
console.log(" ✓");

// splash.png — 1284×2778 (solid dark bg; text is rendered natively)
process.stdout.write("Generating splash.png …");
fs.writeFileSync(path.join(OUT, "splash.png"), buildPNG(solidPixels(1284, 2778, BG[0], BG[1], BG[2]), 1284, 2778));
console.log(" ✓");

// favicon.png — 48×48
process.stdout.write("Generating favicon.png …");
fs.writeFileSync(path.join(OUT, "favicon.png"), buildPNG(iconPixels(48), 48, 48));
console.log(" ✓");

console.log(`\n✅ All assets written to ${OUT}`);
