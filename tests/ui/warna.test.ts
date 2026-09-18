import { describe, expect, it } from "vitest";
import tailwindConfig from "../../tailwind.config";

function hexKeRgb(hex: string): [number, number, number] {
  const bersih = hex.replace("#", "");
  const r = parseInt(bersih.slice(0, 2), 16);
  const g = parseInt(bersih.slice(2, 4), 16);
  const b = parseInt(bersih.slice(4, 6), 16);
  return [r, g, b];
}

function rgbKeHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const maks = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (maks + min) / 2;

  if (maks === min) {
    return [0, 0, l];
  }

  const d = maks - min;
  const s = l > 0.5 ? d / (2 - maks - min) : d / (maks + min);

  let h: number;
  switch (maks) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
      break;
    case gn:
      h = ((bn - rn) / d + 2) * 60;
      break;
    default:
      h = ((rn - gn) / d + 4) * 60;
  }

  return [h, s, l];
}

function apakahMerah(hex: string): boolean {
  const [r, g, b] = hexKeRgb(hex);
  const [h, s, l] = rgbKeHsl(r, g, b);
  const hueMerah = h <= 15 || h >= 345;
  const cukupJenuh = s >= 0.2;
  const tidakEkstrem = l >= 0.15 && l <= 0.85;
  return hueMerah && cukupJenuh && tidakEkstrem;
}

function ambilNilaiWarna(nilai: unknown, dikumpulkan: string[]): void {
  if (typeof nilai === "string") {
    dikumpulkan.push(nilai);
    return;
  }
  if (nilai && typeof nilai === "object") {
    for (const isi of Object.values(nilai)) {
      ambilNilaiWarna(isi, dikumpulkan);
    }
  }
}

describe("token warna tidak boleh memuat merah", () => {
  it("tidak ada nilai warna dalam rentang merah di tailwind.config.ts", () => {
    const warna = tailwindConfig.theme?.extend?.colors;
    expect(warna).toBeDefined();

    const nilaiHex: string[] = [];
    ambilNilaiWarna(warna, nilaiHex);
    expect(nilaiHex.length).toBeGreaterThan(0);

    const ditemukanMerah = nilaiHex.filter(
      (hex) => /^#[0-9a-fA-F]{6}$/.test(hex) && apakahMerah(hex),
    );

    expect(ditemukanMerah).toEqual([]);
  });
});
