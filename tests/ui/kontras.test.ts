import { describe, expect, it } from "vitest";
import tailwindConfig from "../../tailwind.config";

/**
 * S11-4: kontras dihitung dari TOKEN WARNA sungguhan (`tailwind.config.ts`),
 * bukan diperiksa dengan mata dan bukan angka yang ditulis ulang di sini.
 * Rumus luminansi relatif dan rasio kontras persis WCAG 2.1 (SC 1.4.3),
 * ambang minimal 4,5:1 (BLUEPRINT H.7).
 *
 * 🔴 TEMUAN S11 — dicatat di sini, bukan disembunyikan: `redup` di atas
 * `latar-kosong` (±4,39:1) dan di atas `latar-blok` (±3,90:1) SAMA-SAMA
 * GAGAL ambang 4,5:1, walau BLUEPRINT H.1 menuliskan "redup: 5,1:1" tanpa
 * menyebut latar mana yang dipakai — angka itu hanya benar terhadap
 * `kertas` (putih), tidak terhadap `latar-kosong`/`latar-blok`. Ditemukan
 * saat menulis test ini karena `BarisKeterangan.tsx` (kolom nonaktif) dan
 * `periksa/page.tsx` (kutipan pasal blok 2) sebelumnya memasangkan
 * `redup` dengan `latar-kosong` — SUDAH DIPERBAIKI sprint ini menjadi
 * `tinta-lembut` (±9,37:1). `src/lib/renderLembar.tsx` (S08, di luar
 * berkas yang boleh disentuh sprint ini) memasangkan kombinasi yang SAMA
 * (`redup` pada `latar-kosong` untuk kutipan pasal, baris ~202/226) —
 * dicatat untuk Window 2 di PROGRESS.md, tidak diperbaiki di sini.
 */

type TokenWarna = keyof (typeof tailwindConfig)["theme"] extends never
  ? Record<string, string>
  : Record<string, string>;

const TOKEN: TokenWarna = (
  tailwindConfig as { theme: { extend: { colors: Record<string, string> } } }
).theme.extend.colors;

const AMBANG_MINIMAL = 4.5;

function uraiHex(hex: string): readonly [number, number, number] {
  const bersih = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(bersih.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

/** Luminansi relatif WCAG 2.1 — https://www.w3.org/TR/WCAG21/#dfn-relative-luminance */
function luminansiRelatif([r, g, b]: readonly [number, number, number]): number {
  const linierkan = (kanal: number): number => {
    const s = kanal / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const [rl, gl, bl] = [r, g, b].map(linierkan);
  return 0.2126 * (rl ?? 0) + 0.7152 * (gl ?? 0) + 0.0722 * (bl ?? 0);
}

/** Rasio kontras WCAG 2.1 — https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio */
function rasioKontras(hexA: string, hexB: string): number {
  const lA = luminansiRelatif(uraiHex(hexA));
  const lB = luminansiRelatif(uraiHex(hexB));
  const lebihTerang = Math.max(lA, lB);
  const lebihGelap = Math.min(lA, lB);
  return (lebihTerang + 0.05) / (lebihGelap + 0.05);
}

interface PasanganWarna {
  readonly teks: string;
  readonly latar: string;
  /** Di mana pasangan ini sungguhan dipakai di antarmuka. */
  readonly dipakaiDi: string;
}

/**
 * Pasangan yang SUNGGUHAN dipakai sebagai teks-di-atas-latar di seluruh
 * `src/app` dan `src/ui` (diverifikasi lewat pencarian teks `text-<token>`
 * berdampingan dengan `bg-<token>`), setelah perbaikan S11. Bukan seluruh
 * kombinasi 8×8 token — `garis` tidak pernah dipakai sebagai teks maupun
 * latar (ia warna garis pemisah), jadi tidak relevan untuk test kontras.
 */
const PASANGAN_DIPAKAI: readonly PasanganWarna[] = [
  { teks: "tinta", latar: "kertas", dipakaiDi: "teks utama, judul halaman" },
  { teks: "tinta-lembut", latar: "kertas", dipakaiDi: "label, teks sekunder" },
  { teks: "redup", latar: "kertas", dipakaiDi: "keterangan kecil" },
  { teks: "aksen", latar: "kertas", dipakaiDi: "Tombol sekunder, tautan" },
  { teks: "kertas", latar: "aksen", dipakaiDi: "Tombol utama" },
  { teks: "kertas", latar: "tinta-lembut", dipakaiDi: "label blok 2 (LembarPratinjau)" },
  {
    teks: "tinta-lembut",
    latar: "latar-blok",
    dipakaiDi: "label blok, PesanGalat",
  },
  {
    teks: "tinta-lembut",
    latar: "latar-kosong",
    dipakaiDi:
      "kalimat keterangan kosong (blok 2), kolom nonaktif 'tidak tahu' (S11, sebelumnya redup)",
  },
];

describe("kontras token warna — WCAG 2.1 minimal 4,5:1 (BLUEPRINT H.7)", () => {
  it("daftar pasangan yang diuji tidak kosong — pagar ini tidak boleh lulus secara hampa", () => {
    expect(PASANGAN_DIPAKAI.length).toBeGreaterThan(0);
  });

  it.each(PASANGAN_DIPAKAI)(
    "$teks di atas $latar ($dipakaiDi) — minimal 4,5:1",
    ({ teks, latar, dipakaiDi }) => {
      const hexTeks = TOKEN[teks];
      const hexLatar = TOKEN[latar];
      expect(hexTeks, `token "${teks}" tidak ditemukan di tailwind.config.ts`).toBeTruthy();
      expect(hexLatar, `token "${latar}" tidak ditemukan di tailwind.config.ts`).toBeTruthy();

      const rasio = rasioKontras(hexTeks as string, hexLatar as string);

      expect(
        rasio,
        `${teks} (${hexTeks}) di atas ${latar} (${hexLatar}) dipakai untuk "${dipakaiDi}" — rasio ${rasio.toFixed(2)}:1, harus >= ${AMBANG_MINIMAL}:1`,
      ).toBeGreaterThanOrEqual(AMBANG_MINIMAL);
    },
  );

  it("🔴 dibuktikan (bukan diasumsikan): redup di atas latar-kosong SUNGGUHAN gagal ambang — inilah kenapa pasangan itu tidak ada di daftar PASANGAN_DIPAKAI", () => {
    const rasio = rasioKontras(TOKEN["redup"] as string, TOKEN["latar-kosong"] as string);
    expect(rasio).toBeLessThan(AMBANG_MINIMAL);
  });

  it("🔴 dibuktikan: redup di atas latar-blok juga gagal ambang", () => {
    const rasio = rasioKontras(TOKEN["redup"] as string, TOKEN["latar-blok"] as string);
    expect(rasio).toBeLessThan(AMBANG_MINIMAL);
  });
});
