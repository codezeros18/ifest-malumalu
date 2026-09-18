import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 🔴 S07-8 — penilaian TIDAK BOLEH dijalankan langsung dari keluaran
 * Pembaca tanpa melewati layar koreksi (CLAUDE.md 3.3).
 *
 * `nilai()` (src/core/penilaian.ts) menerima `HasilBacaFinal`, bukan
 * `HasilBaca` — secara tipe pun keduanya berbeda (`HasilBacaFinal` tidak
 * punya `keyakinan`, `HasilBaca` tidak punya `ditandaiTidakTahu`). Tapi
 * batas TIPE saja tidak menjamin batas ALUR: kode bisa saja membentuk
 * `HasilBacaFinal` palsu tepat setelah membaca, tanpa pernah menampilkannya
 * ke pengguna untuk dikoreksi. Karena itu pagar ini memeriksa KODE
 * APLIKASINYA secara statis, bukan cuma tipenya:
 *
 *   1. Halaman utama (`src/app/page.tsx`) tidak pernah menyentuh
 *      `src/core/penilaian` sama sekali — ia hanya membaca dan menyimpan
 *      draf, tidak pernah menilai.
 *   2. Hanya SATU tempat di seluruh `src/app` yang memanggil `nilai()`:
 *      layar koreksi (`src/app/periksa/page.tsx`).
 *   3. Di layar koreksi, panggilan itu TIDAK berada di dalam `useEffect`
 *      (yang berjalan otomatis saat halaman dimuat) — ia hanya boleh
 *      terjadi dari pemanggilan fungsi yang dipicu tombol.
 */

const JALUR_HALAMAN_UTAMA = join(process.cwd(), "src", "app", "page.tsx");
const JALUR_HALAMAN_PERIKSA = join(
  process.cwd(),
  "src",
  "app",
  "periksa",
  "page.tsx",
);

const isiHalamanUtama = readFileSync(JALUR_HALAMAN_UTAMA, "utf8");
const isiHalamanPeriksa = readFileSync(JALUR_HALAMAN_PERIKSA, "utf8");

/** Nama fungsi penilaian yang diimpor di periksa/page.tsx — lihat berkas itu. */
const NAMA_FUNGSI_PENILAIAN = "nilaiPenilaian";

function jangkauanPemanggilanBalans(
  isi: string,
  namaFungsi: string,
): Array<[number, number]> {
  const jangkauan: Array<[number, number]> = [];
  const pola = new RegExp(`\\b${namaFungsi}\\s*\\(`, "g");
  let cocok: RegExpExecArray | null;

  while ((cocok = pola.exec(isi)) !== null) {
    const mulai = cocok.index;
    let indeks = mulai + cocok[0].length - 1; // posisi '(' pembuka
    let kedalaman = 0;
    for (; indeks < isi.length; indeks++) {
      if (isi[indeks] === "(") kedalaman++;
      else if (isi[indeks] === ")") {
        kedalaman--;
        if (kedalaman === 0) break;
      }
    }
    jangkauan.push([mulai, indeks + 1]);
  }

  return jangkauan;
}

function diDalamJangkauan(indeks: number, jangkauan: Array<[number, number]>): boolean {
  return jangkauan.some(([mulai, akhir]) => indeks >= mulai && indeks < akhir);
}

describe("S07-8 penilaian wajib lewat layar koreksi", () => {
  it("halaman utama tidak mengimpor maupun memanggil src/core/penilaian sama sekali", () => {
    expect(isiHalamanUtama).not.toMatch(/core\/penilaian/);
    expect(isiHalamanUtama).not.toMatch(/\bnilaiPenilaian\s*\(/);
  });

  it("layar koreksi (periksa/page.tsx) adalah satu-satunya yang mengimpor fungsi nilai() dari src/core/penilaian", () => {
    expect(isiHalamanPeriksa).toMatch(
      /import\s*\{[^}]*\bnilai\s+as\s+nilaiPenilaian\b[^}]*\}\s*from\s*["'].*core\/penilaian["']/,
    );
  });

  it("panggilan nilai() di layar koreksi TIDAK berada di dalam useEffect", () => {
    const jangkauanEffect = jangkauanPemanggilanBalans(isiHalamanPeriksa, "useEffect");
    expect(jangkauanEffect.length).toBeGreaterThan(0); // pagar ini tidak boleh lulus hampa

    const pola = new RegExp(`\\b${NAMA_FUNGSI_PENILAIAN}\\s*\\(`, "g");
    const titikPanggilan: number[] = [];
    let cocok: RegExpExecArray | null;
    while ((cocok = pola.exec(isiHalamanPeriksa)) !== null) {
      titikPanggilan.push(cocok.index);
    }

    expect(titikPanggilan.length).toBeGreaterThan(0); // pagar ini tidak boleh lulus hampa
    for (const titik of titikPanggilan) {
      expect(
        diDalamJangkauan(titik, jangkauanEffect),
        "panggilan nilai() ditemukan di dalam useEffect — itu berarti penilaian berjalan otomatis, bukan dari aksi pengguna menekan tombol",
      ).toBe(false);
    }
  });

  it("panggilan nilai() di layar koreksi terjadi di dalam sebuah fungsi penangan (handler), bukan di scope modul", () => {
    // Heuristik: nama fungsi penangan yang memanggilnya harus mengandung
    // kata "Terbitkan", sesuai TOMBOL_LANJUT ("Terbitkan lembar") di teks.ts.
    expect(isiHalamanPeriksa).toMatch(
      /function\s+tanganiTerbitkanLembar\s*\([^)]*\)\s*\{[\s\S]*?\bnilaiPenilaian\s*\(/,
    );
  });
});

/**
 * S07-10 — seluruh teks yang dilihat pengguna diambil dari
 * `src/core/teks.ts` (atau `src/core/slot.ts` untuk label per-keterangan,
 * yang juga data terpusat, bukan literal yang ditulis di berkas halaman).
 * DILARANG menulis literal string berbahasa Indonesia langsung di berkas
 * halaman/komponen.
 *
 * Karena tidak ada parser JSX di sini, deteksinya berbasis regex seperti
 * pola yang sudah dipakai `tests/core/batas-modul.test.ts`:
 *   - String literal (di luar `import ...`, `className="..."`, komentar)
 *     yang memuat dua kata atau lebih dianggap MENCURIGAKAN.
 *   - Teks JSX polos di antara `>` dan `<` (bukan `{ekspresi}`) yang memuat
 *     dua kata atau lebih juga dianggap MENCURIGAKAN.
 *
 * `slot.nama` dan seluruh konstanta `teks.ts` diakses lewat ekspresi
 * (`{sesuatu}`), bukan literal yang ditulis di berkas ini — sehingga
 * otomatis tidak pernah tertangkap pagar ini, konsisten dengan maksud
 * aturannya: jangan MENGARANG kalimat di berkas halaman.
 */

const BERKAS_DIPINDAI = [
  join(process.cwd(), "src", "app", "page.tsx"),
  join(process.cwd(), "src", "app", "layout.tsx"),
  join(process.cwd(), "src", "app", "periksa", "page.tsx"),
  join(process.cwd(), "src", "ui", "AreaUnggah.tsx"),
  join(process.cwd(), "src", "ui", "PesanGalat.tsx"),
  join(process.cwd(), "src", "ui", "BarisKeterangan.tsx"),
];

const POLA_KATA_GANDA = /[A-Za-zÀ-ÿ]+[ \t]+[A-Za-zÀ-ÿ]+/;

function lucutiUntukPemindaian(isi: string): string {
  let hasil = isi;
  hasil = hasil.replace(/\/\*[\s\S]*?\*\//g, ""); // komentar blok
  hasil = hasil.replace(/\/\/[^\n]*/g, ""); // komentar baris
  hasil = hasil.replace(/^import[^\n]*\n/gm, ""); // baris import
  hasil = hasil.replace(/className=\{[^}]*\}/g, "className={}");
  hasil = hasil.replace(/className="[^"]*"/g, 'className=""');
  return hasil;
}

const POLA_STRING = /(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const POLA_TEKS_JSX = />([^<>{}\n]*[A-Za-zÀ-ÿ][^<>{}\n]*)</g;

/** Direktif build JavaScript/Next.js, bukan teks yang dilihat pengguna. */
const DIREKTIF_DIKECUALIKAN = new Set(["use client", "use server"]);

function literalMencurigakan(isiAsli: string): string[] {
  const isi = lucutiUntukPemindaian(isiAsli);
  const ditemukan: string[] = [];

  for (const cocok of isi.matchAll(POLA_STRING)) {
    const nilaiTeks = cocok[2] ?? "";
    if (DIREKTIF_DIKECUALIKAN.has(nilaiTeks)) {
      continue;
    }
    if (POLA_KATA_GANDA.test(nilaiTeks)) {
      ditemukan.push(nilaiTeks);
    }
  }

  for (const cocok of isi.matchAll(POLA_TEKS_JSX)) {
    const nilaiTeks = (cocok[1] ?? "").trim();
    if (POLA_KATA_GANDA.test(nilaiTeks)) {
      ditemukan.push(nilaiTeks);
    }
  }

  return ditemukan;
}

describe("S07-10 nol literal teks Indonesia di berkas halaman/komponen", () => {
  it("ada berkas yang dipindai — pagar ini tidak boleh lulus secara hampa", () => {
    expect(BERKAS_DIPINDAI.length).toBeGreaterThan(0);
  });

  it.each(BERKAS_DIPINDAI)("%s tidak memuat literal string/JSX dua kata atau lebih", (jalur) => {
    const isi = readFileSync(jalur, "utf8");
    const pelanggaran = literalMencurigakan(isi);
    expect(pelanggaran, `literal mencurigakan: ${JSON.stringify(pelanggaran)}`).toEqual([]);
  });
});
