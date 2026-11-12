import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';

function crc32(buf) {
  let table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  const rowLen = 1 + width * 4;
  const rawData = Buffer.alloc(rowLen * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.36 : width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowLen;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dx = (x - cx) / radius;
      const dy = (y - cy) / radius;
      const d = Math.sqrt(dx * dx + dy * dy);

      // Default Obsidian background: #0b0c0e
      let r = 11, g = 12, b = 14, a = 255;

      // Hexagon check: abs(dx) + abs(dy)*0.577 <= 1 && abs(dy) <= 0.866
      const inHex = (Math.abs(dx) * 0.866 + Math.abs(dy) * 0.5 <= 0.866) && (Math.abs(dy) <= 0.866);
      const hexDist = Math.max(Math.abs(dx) * 0.866 + Math.abs(dy) * 0.5, Math.abs(dy) / 0.866);

      if (hexDist <= 0.98) {
        // Hexagon interior #121419
        r = 18; g = 20; b = 25;
        // Gold hexagon border
        if (hexDist >= 0.86) {
          // Metallic Gold gradient
          const goldFactor = (x + y) / (width * 2);
          r = Math.floor(212 + 35 * goldFactor);
          g = Math.floor(175 + 30 * goldFactor);
          b = Math.floor(55 + 25 * goldFactor);
        } else if (hexDist >= 0.78 && hexDist <= 0.80) {
          // Inner thin gold filete
          r = 212; g = 175; b = 55;
        }

        // Horizontal gold bars
        const ny = (y - cy) / (radius * 0.866);
        const nx = Math.abs(dx);
        if ((Math.abs(ny - (-0.35)) < 0.04 || Math.abs(ny - 0.35) < 0.04) && nx < 0.6) {
          r = 247; g = 229; b = 168; // Light Gold
        }

        // Center letters TOL-K approx emblem glow
        if (Math.abs(ny) < 0.18 && nx < 0.5) {
          // Gold text area
          r = 235; g = 195; b = 75;
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const pubDir = path.resolve('public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(pubDir, 'favicon.ico'), createPng(64, 64, false));

console.log('PWA PNG icons created successfully.');
