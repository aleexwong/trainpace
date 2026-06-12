import { createRequire as __hf_createRequire } from "node:module";
import { fileURLToPath as __hf_fileURLToPath } from "node:url";
import { dirname as __hf_dirname } from "node:path";
var require = __hf_createRequire(import.meta.url);
var __filename = __hf_fileURLToPath(import.meta.url);
var __dirname = __hf_dirname(__filename);

// ../producer/src/services/pngDecodeBlitWorker.ts
import { parentPort } from "worker_threads";

// ../engine/src/utils/alphaBlit.ts
import { inflateSync } from "zlib";
function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}
function decodePngRaw(buf, caller) {
  if (buf[0] !== 137 || buf[1] !== 80 || buf[2] !== 78 || buf[3] !== 71 || buf[4] !== 13 || buf[5] !== 10 || buf[6] !== 26 || buf[7] !== 10) {
    throw new Error(`${caller}: not a PNG file`);
  }
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let sawIhdr = false;
  const idatChunks = [];
  while (pos + 12 <= buf.length) {
    const chunkLen = buf.readUInt32BE(pos);
    const chunkType = buf.toString("ascii", pos + 4, pos + 8);
    const chunkData = buf.subarray(pos + 8, pos + 8 + chunkLen);
    if (chunkType === "IHDR") {
      width = chunkData.readUInt32BE(0);
      height = chunkData.readUInt32BE(4);
      bitDepth = chunkData[8] ?? 0;
      colorType = chunkData[9] ?? 0;
      interlace = chunkData[12] ?? 0;
      sawIhdr = true;
    } else if (chunkType === "IDAT") {
      idatChunks.push(Buffer.from(chunkData));
    } else if (chunkType === "IEND") {
      break;
    }
    pos += 12 + chunkLen;
  }
  if (!sawIhdr) {
    throw new Error(`${caller}: PNG missing IHDR chunk`);
  }
  if (colorType !== 2 && colorType !== 6) {
    throw new Error(`${caller}: unsupported color type ${colorType} (expected 2=RGB or 6=RGBA)`);
  }
  if (interlace !== 0) {
    throw new Error(
      `${caller}: Adam7-interlaced PNGs are not supported (interlace method ${interlace})`
    );
  }
  const channels = colorType === 6 ? 4 : 3;
  const bpp = channels * (bitDepth / 8);
  const stride = width * bpp;
  const compressed = Buffer.concat(idatChunks);
  const decompressed = inflateSync(compressed);
  const rawPixels = Buffer.allocUnsafe(height * stride);
  const prevRow = new Uint8Array(stride);
  const currRow = new Uint8Array(stride);
  let srcPos = 0;
  for (let y = 0; y < height; y++) {
    const filterType = decompressed[srcPos++] ?? 0;
    const rawRow = decompressed.subarray(srcPos, srcPos + stride);
    srcPos += stride;
    switch (filterType) {
      case 0:
        currRow.set(rawRow);
        break;
      case 1:
        for (let x = 0; x < stride; x++) {
          currRow[x] = (rawRow[x] ?? 0) + (x >= bpp ? currRow[x - bpp] ?? 0 : 0) & 255;
        }
        break;
      case 2:
        for (let x = 0; x < stride; x++) {
          currRow[x] = (rawRow[x] ?? 0) + (prevRow[x] ?? 0) & 255;
        }
        break;
      case 3:
        for (let x = 0; x < stride; x++) {
          const left = x >= bpp ? currRow[x - bpp] ?? 0 : 0;
          const up = prevRow[x] ?? 0;
          currRow[x] = (rawRow[x] ?? 0) + Math.floor((left + up) / 2) & 255;
        }
        break;
      case 4:
        for (let x = 0; x < stride; x++) {
          const left = x >= bpp ? currRow[x - bpp] ?? 0 : 0;
          const up = prevRow[x] ?? 0;
          const upLeft = x >= bpp ? prevRow[x - bpp] ?? 0 : 0;
          currRow[x] = (rawRow[x] ?? 0) + paeth(left, up, upLeft) & 255;
        }
        break;
      default:
        throw new Error(`${caller}: unknown filter type ${filterType} at row ${y}`);
    }
    rawPixels.set(currRow, y * stride);
    prevRow.set(currRow);
  }
  return { width, height, bitDepth, colorType, rawPixels };
}
function decodePng(buf) {
  const { width, height, bitDepth, colorType, rawPixels } = decodePngRaw(buf, "decodePng");
  if (bitDepth !== 8) {
    throw new Error(`decodePng: unsupported bit depth ${bitDepth} (expected 8)`);
  }
  const output = new Uint8Array(width * height * 4);
  if (colorType === 6) {
    output.set(rawPixels);
  } else {
    for (let i = 0; i < width * height; i++) {
      output[i * 4 + 0] = rawPixels[i * 3 + 0] ?? 0;
      output[i * 4 + 1] = rawPixels[i * 3 + 1] ?? 0;
      output[i * 4 + 2] = rawPixels[i * 3 + 2] ?? 0;
      output[i * 4 + 3] = 255;
    }
  }
  return { width, height, data: output };
}
function buildSrgbToSignalLut(transfer) {
  const lut = new Uint16Array(256);
  const hlgA = 0.17883277;
  const hlgB = 1 - 4 * hlgA;
  const hlgC = 0.5 - hlgA * Math.log(4 * hlgA);
  const pqM1 = 0.1593017578125;
  const pqM2 = 78.84375;
  const pqC1 = 0.8359375;
  const pqC2 = 18.8515625;
  const pqC3 = 18.6875;
  const pqMaxNits = 1e4;
  const sdrNits = 203;
  for (let i = 0; i < 256; i++) {
    if (transfer === "srgb") {
      lut[i] = i * 257;
      continue;
    }
    const v = i / 255;
    const linear = v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    let signal;
    if (transfer === "hlg") {
      signal = linear <= 1 / 12 ? Math.sqrt(3 * linear) : hlgA * Math.log(12 * linear - hlgB) + hlgC;
    } else {
      const Lp = Math.max(0, linear * sdrNits / pqMaxNits);
      const Lm1 = Math.pow(Lp, pqM1);
      signal = Math.pow((pqC1 + pqC2 * Lm1) / (1 + pqC3 * Lm1), pqM2);
    }
    lut[i] = Math.min(65535, Math.round(signal * 65535));
  }
  return lut;
}
var SRGB_TO_SRGB_16 = buildSrgbToSignalLut("srgb");
var SRGB_TO_HLG = buildSrgbToSignalLut("hlg");
var SRGB_TO_PQ = buildSrgbToSignalLut("pq");
function getSrgbToSignalLut(transfer) {
  if (transfer === "pq") return SRGB_TO_PQ;
  if (transfer === "hlg") return SRGB_TO_HLG;
  return SRGB_TO_SRGB_16;
}
function blitRgba8OverRgb48le(domRgba, canvas, width, height, transfer = "hlg") {
  const pixelCount = width * height;
  const lut = getSrgbToSignalLut(transfer);
  for (let i = 0; i < pixelCount; i++) {
    const da = domRgba[i * 4 + 3] ?? 0;
    if (da === 0) {
      continue;
    } else if (da === 255) {
      const r16 = lut[domRgba[i * 4 + 0] ?? 0] ?? 0;
      const g16 = lut[domRgba[i * 4 + 1] ?? 0] ?? 0;
      const b16 = lut[domRgba[i * 4 + 2] ?? 0] ?? 0;
      canvas.writeUInt16LE(r16, i * 6);
      canvas.writeUInt16LE(g16, i * 6 + 2);
      canvas.writeUInt16LE(b16, i * 6 + 4);
    } else {
      const alpha = da / 255;
      const invAlpha = 1 - alpha;
      const hdrR = (canvas[i * 6 + 0] ?? 0) | (canvas[i * 6 + 1] ?? 0) << 8;
      const hdrG = (canvas[i * 6 + 2] ?? 0) | (canvas[i * 6 + 3] ?? 0) << 8;
      const hdrB = (canvas[i * 6 + 4] ?? 0) | (canvas[i * 6 + 5] ?? 0) << 8;
      const domR = lut[domRgba[i * 4 + 0] ?? 0] ?? 0;
      const domG = lut[domRgba[i * 4 + 1] ?? 0] ?? 0;
      const domB = lut[domRgba[i * 4 + 2] ?? 0] ?? 0;
      canvas.writeUInt16LE(Math.round(domR * alpha + hdrR * invAlpha), i * 6);
      canvas.writeUInt16LE(Math.round(domG * alpha + hdrG * invAlpha), i * 6 + 2);
      canvas.writeUInt16LE(Math.round(domB * alpha + hdrB * invAlpha), i * 6 + 4);
    }
  }
}

// ../producer/src/services/pngDecodeBlitWorker.ts
if (!parentPort) {
  console.warn("[pngDecodeBlitWorker] no parentPort; module loaded on main thread");
} else {
  parentPort.on("message", (msg) => {
    const { png, pngOffset, pngLength, dest, destOffset, destLength, width, height, transfer } = msg;
    const pngBuf = Buffer.from(png, pngOffset, pngLength);
    const destBuf = Buffer.from(dest, destOffset, destLength);
    try {
      const decodeStart = Date.now();
      const { data: rgba } = decodePng(pngBuf);
      const decodeMs = Date.now() - decodeStart;
      const blitStart = Date.now();
      blitRgba8OverRgb48le(
        rgba,
        destBuf,
        width,
        height,
        transfer
      );
      const blitMs = Date.now() - blitStart;
      const reply = {
        ok: true,
        png,
        dest,
        decodeMs,
        blitMs
      };
      parentPort.postMessage(reply, [png, dest]);
    } catch (err) {
      const reply = {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        png,
        dest
      };
      parentPort.postMessage(reply, [png, dest]);
    }
  });
}
