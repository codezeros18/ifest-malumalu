import fs from "node:fs";
import zlib from "node:zlib";

function bacaPng(jalur) {
  const buf = fs.readFileSync(jalur);
  let off = 8;
  let width, height, bitDepth, colorType;
  const idatChunks = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data.readUInt8(8);
      colorType = data.readUInt8(9);
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
    off += 8 + len + 4;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : null;
  if (!channels || bitDepth !== 8) {
    throw new Error(`format tidak didukung: colorType=${colorType} bitDepth=${bitDepth}`);
  }
  const bpp = channels;
  const stride = width * bpp;
  const pixels = Buffer.alloc(height * stride);

  function paeth(a, b, c) {
    const p = a + b - c;
    const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    if (pa <= pb && pa <= pc) return a;
    if (pb <= pc) return b;
    return c;
  }

  let srcOff = 0;
  for (let y = 0; y < height; y++) {
    const filterType = raw[srcOff]; srcOff += 1;
    const rowStart = y * stride;
    const prevRowStart = (y - 1) * stride;
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[srcOff + x];
      const a = x >= bpp ? pixels[rowStart + x - bpp] : 0;
      const b = y > 0 ? pixels[prevRowStart + x] : 0;
      const c = y > 0 && x >= bpp ? pixels[prevRowStart + x - bpp] : 0;
      let val;
      switch (filterType) {
        case 0: val = rawByte; break;
        case 1: val = rawByte + a; break;
        case 2: val = rawByte + b; break;
        case 3: val = rawByte + Math.floor((a + b) / 2); break;
        case 4: val = rawByte + paeth(a, b, c); break;
        default: throw new Error(`filter tidak dikenal: ${filterType}`);
      }
      pixels[rowStart + x] = val & 0xff;
    }
    srcOff += stride;
  }

  return { width, height, channels, pixels };
}

function barisPutihSemua(pixels, y, width, channels) {
  const rowStart = y * width * channels;
  for (let x = 0; x < width; x++) {
    const i = rowStart + x * channels;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    const a = channels === 4 ? pixels[i + 3] : 255;
    if (a < 10) continue; // transparan — bukan konten yang tampak
    if (r < 250 || g < 250 || b < 250) return false;
  }
  return true;
}

function cariBatasBawahKonten(jalur) {
  const { width, height, channels, pixels } = bacaPng(jalur);
  let batas = 0;
  for (let y = height - 1; y >= 0; y--) {
    if (!barisPutihSemua(pixels, y, width, channels)) {
      batas = y + 1;
      break;
    }
  }
  return { width, height, batasBawahKonten: batas };
}

for (const nama of ["kosong", "terisi"]) {
  const jalur = `scratch-besar-${nama}.png`;
  const hasil = cariBatasBawahKonten(jalur);
  console.log(nama, JSON.stringify(hasil));
}
