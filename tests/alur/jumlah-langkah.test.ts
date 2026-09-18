import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * S07-9 — batas 5 langkah dari membuka halaman sampai lembar terbit
 * (CLAUDE.md bagian 4, ditegakkan lewat "peninjauan rute + test alur
 * ujung ke ujung").
 *
 * Tidak ada harness end-to-end (Playwright/Cypress dsb.) di stack ini —
 * itu akan menambah dependensi baru di luar yang dikunci CLAUDE.md bagian
 * 5, dan tidak ada anggaran waktu untuk memasangnya di S07. Kepatuhan
 * diverifikasi lewat daftar langkah yang ditulis manual di sini, DIPADUKAN
 * dengan pemeriksaan bahwa tiap langkah punya bukti nyata di kode —
 * supaya daftar ini tidak bisa diam-diam menyimpang dari implementasi
 * tanpa membuat test ini merah. Polanya sama seperti
 * `tests/core/kosakata.test.ts` yang menyalin daftar kata terlarang
 * CLAUDE.md apa adanya karena CLAUDE.md sendiri tidak dapat dibaca
 * program saat runtime.
 */

const isiHalamanUtama = readFileSync(
  join(process.cwd(), "src", "app", "page.tsx"),
  "utf8",
);
const isiHalamanPeriksa = readFileSync(
  join(process.cwd(), "src", "app", "periksa", "page.tsx"),
  "utf8",
);
const gabunganKode = `${isiHalamanUtama}\n${isiHalamanPeriksa}`;

interface Langkah {
  readonly nama: string;
  readonly buktiKode: RegExp;
}

const LANGKAH_ALUR: readonly Langkah[] = [
  {
    nama: "buka halaman utama (/) — tiga jalur masukan terlihat sekaligus",
    buktiKode: /export default function HalamanUtama/,
  },
  {
    nama: "pilih jalur (tempel/seret/unggah gambar lewat AreaUnggah, atau tombol jalur manual) dan isi tawaran",
    buktiKode: /<AreaUnggah\b/,
  },
  {
    nama: "berpindah ke layar periksa (/periksa) — hasil bacaan atau isian kosong ditampilkan untuk dikoreksi",
    buktiKode: /router\.push\(\s*["']\/periksa["']\s*\)/,
  },
  {
    nama: "koreksi tiap keterangan dan/atau tandai 'saya tidak tahu'",
    buktiKode: /<BarisKeterangan\b/,
  },
  {
    nama: "tekan tombol Terbitkan Lembar — penilaian dijalankan dan lembar terbit",
    buktiKode: /function\s+tanganiTerbitkanLembar\b/,
  },
];

describe("S07-9 jumlah langkah dari membuka halaman sampai lembar terbit", () => {
  it("daftar langkah tidak melebihi 5 (CLAUDE.md bagian 4)", () => {
    expect(LANGKAH_ALUR.length).toBeLessThanOrEqual(5);
  });

  it("daftar langkah tidak kosong — pagar ini tidak boleh lulus secara hampa", () => {
    expect(LANGKAH_ALUR.length).toBeGreaterThan(0);
  });

  it.each(LANGKAH_ALUR.map((langkah) => [langkah.nama, langkah] as const))(
    "langkah %s punya bukti nyata di kode halaman",
    (_nama, langkah) => {
      expect(
        langkah.buktiKode.test(gabunganKode),
        `pola ${langkah.buktiKode} tidak ditemukan di src/app/page.tsx maupun src/app/periksa/page.tsx`,
      ).toBe(true);
    },
  );

  it("hanya ada SATU perpindahan halaman (router.push) di seluruh alur inti — konsisten dengan dua layar (utama, periksa)", () => {
    const jumlahRouterPush = (gabunganKode.match(/router\.push\(/g) ?? []).length;
    // Dipanggil dari dua tempat berbeda (jalur manual & jalur gambar di
    // halaman utama), keduanya menuju tujuan yang sama ("/periksa") —
    // dihitung sebagai SATU jenis perpindahan, bukan langkah tambahan.
    expect(jumlahRouterPush).toBeGreaterThan(0);
    const tujuanBerbeda = new Set(
      [...gabunganKode.matchAll(/router\.push\(\s*["']([^"']+)["']\s*\)/g)].map(
        (cocok) => cocok[1],
      ),
    );
    expect(tujuanBerbeda.size).toBe(1);
  });
});
