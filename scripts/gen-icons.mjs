// Generate PWA icons (no image dependency) — a teal app-mark with a white "F".
// Run: npm run gen:icons
//
// Hand-rolled RGBA PNG encoder via node:zlib. Outputs:
//   public/icon-192.png, public/icon-512.png        (purpose: any, rounded)
//   public/icon-512-maskable.png                    (purpose: maskable, full-bleed)
//   app/apple-icon.png                               (180, opaque — Next links it)

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const TEAL = [20, 184, 166];
const WHITE = [255, 255, 255];

// ---- PNG encoding ----------------------------------------------------------
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePng(size, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- drawing ---------------------------------------------------------------
function inRounded(x, y, size, r) {
  const nx = Math.min(Math.max(x, r), size - 1 - r);
  const ny = Math.min(Math.max(y, r), size - 1 - r);
  const dx = x - nx;
  const dy = y - ny;
  return dx * dx + dy * dy <= r * r;
}

function drawIcon(size, { rounded, markFrac }) {
  const buf = Buffer.alloc(size * size * 4); // transparent
  const r = Math.round(size * 0.22);
  const set = (x, y, [rr, gg, bb]) => {
    const i = (y * size + x) * 4;
    buf[i] = rr;
    buf[i + 1] = gg;
    buf[i + 2] = bb;
    buf[i + 3] = 255;
  };

  // background
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!rounded || inRounded(x, y, size, r)) set(x, y, TEAL);
    }
  }

  // white "F" inside the central mark box
  const m = (size * (1 - markFrac)) / 2;
  const w = size * markFrac;
  const h = size * markFrac;
  const inF = (x, y) => {
    const lx = x - m;
    const ly = y - m;
    if (lx < 0 || ly < 0 || lx > w || ly > h) return false;
    const stem = lx <= w * 0.24;
    const top = ly <= h * 0.24;
    const mid = ly >= h * 0.42 && ly <= h * 0.66 && lx <= w * 0.7;
    return stem || top || mid;
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (inF(x, y)) set(x, y, WHITE);
    }
  }
  return encodePng(size, buf);
}

const root = process.cwd();
const out = [
  ["public/icon-192.png", 192, { rounded: true, markFrac: 0.6 }],
  ["public/icon-512.png", 512, { rounded: true, markFrac: 0.6 }],
  ["public/icon-512-maskable.png", 512, { rounded: false, markFrac: 0.5 }],
  ["app/apple-icon.png", 180, { rounded: false, markFrac: 0.58 }],
];
for (const [rel, size, opts] of out) {
  writeFileSync(join(root, rel), drawIcon(size, opts));
  console.log("✓", rel);
}
