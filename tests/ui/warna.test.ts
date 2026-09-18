import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
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

/**
 * S12-4 — ditambahkan setelah verifikasi mutasi membuktikan celah: kelas
 * bawaan Tailwind `text-red-600` di sebuah komponen LULUS seluruh test,
 * karena `theme.extend` tidak menghapus palet bawaan dan test di atas hanya
 * memeriksa token. CLAUDE.md bagian 4 menyatakan batas "0 elemen merah"
 * ditegakkan oleh "test token warna DAN KELAS" — separuh "kelas" itulah
 * yang belum ada. Memindai seluruh `src/` untuk tiga jalan masuk merah:
 * kelas palet bawaan, literal hex/rgb di rentang merah, dan nama warna CSS.
 */
const AKAR_SRC = join(process.cwd(), "src");

function berkasSumber(direktori: string): string[] {
  const terkumpul: string[] = [];
  for (const entri of readdirSync(direktori, { withFileTypes: true })) {
    const jalur = join(direktori, entri.name);
    if (entri.isDirectory()) {
      terkumpul.push(...berkasSumber(jalur));
    } else if (/\.(tsx?|css)$/.test(entri.name)) {
      terkumpul.push(jalur);
    }
  }
  return terkumpul;
}

const POLA_KELAS_MERAH = /(?<![\w-])(?:[a-z0-9]+:)*[a-z]+(?:-[a-z]+)*-(?:red|rose)-\d{2,3}\b/g;
const POLA_HEX = /#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;
const POLA_RGB = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/g;
const POLA_NAMA_MERAH =
  /(?:["'`]|:\s*)(red|darkred|crimson|firebrick|indianred|maroon|tomato)(?=["'`;\s])/gi;

function hexPanjang(hex: string): string {
  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((c) => c + c)
      .join("")}`;
  }
  return `#${hex}`;
}

function rgbKeHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

function pelanggaranMerah(isi: string): string[] {
  const temuan: string[] = [];
  for (const cocok of isi.matchAll(POLA_KELAS_MERAH)) {
    temuan.push(`kelas ${cocok[0]}`);
  }
  for (const cocok of isi.matchAll(POLA_HEX)) {
    const hex = hexPanjang(cocok[1] ?? "");
    if (apakahMerah(hex)) temuan.push(`hex ${cocok[0]}`);
  }
  for (const cocok of isi.matchAll(POLA_RGB)) {
    const hex = rgbKeHex(Number(cocok[1]), Number(cocok[2]), Number(cocok[3]));
    if (apakahMerah(hex)) temuan.push(`rgb ${cocok[0]}`);
  }
  for (const cocok of isi.matchAll(POLA_NAMA_MERAH)) {
    temuan.push(`nama warna ${cocok[1]}`);
  }
  return temuan;
}

describe("nol merah di kode sumber — kelas, literal, dan nama warna (S12-4)", () => {
  const berkas = berkasSumber(AKAR_SRC);

  it("ada berkas yang dipindai — pagar ini tidak boleh lulus secara hampa", () => {
    expect(berkas.length).toBeGreaterThan(0);
  });

  it("pemindai benar-benar mengenali ketiga jalan masuk merah", () => {
    expect(pelanggaranMerah('className="text-red-600"')).toHaveLength(1);
    expect(pelanggaranMerah('className="hover:bg-rose-50"')).toHaveLength(1);
    expect(pelanggaranMerah("color: `#DC2626`")).toHaveLength(1);
    expect(pelanggaranMerah("color: '#f00'")).toHaveLength(1);
    expect(pelanggaranMerah("color: rgb(220, 38, 38)")).toHaveLength(1);
    expect(pelanggaranMerah('color: "crimson"')).toHaveLength(1);
    expect(pelanggaranMerah('className="text-redup bg-latar-kosong"')).toEqual([]);
    expect(pelanggaranMerah("border: `2px solid #374151`")).toEqual([]);
  });

  it("tidak ada satu pun berkas di src/ yang memuat warna merah", () => {
    const seluruh: string[] = [];
    for (const jalur of berkas) {
      for (const temuan of pelanggaranMerah(readFileSync(jalur, "utf8"))) {
        seluruh.push(`${relative(process.cwd(), jalur)} → ${temuan}`);
      }
    }
    expect(seluruh).toEqual([]);
  });
});
