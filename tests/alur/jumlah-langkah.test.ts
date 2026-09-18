import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * S07-9, direvisi S13 — batas langkah dari membuka halaman sampai lembar
 * terbit (CLAUDE.md bagian 4, ditegakkan lewat "peninjauan rute + test
 * alur ujung ke ujung").
 *
 * 🔴 S13: batas dinaikkan dari 5 → 6, karena layar hasil dipisah dari
 * layar koreksi (`/hasil` sebagai rute ketiga, lihat `PERUBAHAN.md`).
 * Perpindahan otomatis `/periksa` → `/hasil` menambah satu langkah.
 * Batas lama (5) diverifikasi sebelumnya mendekati langit-langit (S12-6:
 * "4 tindakan pengguna, 5 bila menghitung perpindahan otomatis") — jadi
 * kenaikan ini eksplisit dan dicatat, bukan longgar diam-diam. Jumlah
 * TINDAKAN PENGGUNA sendiri tidak berubah (masih 4 klik); yang bertambah
 * murni perpindahan rute otomatis yang tidak butuh aksi tambahan.
 *
 * Tidak ada harness end-to-end (Playwright/Cypress dsb.) di stack ini —
 * itu akan menambah dependensi baru di luar yang dikunci CLAUDE.md bagian
 * 5, dan tidak ada anggaran waktu untuk memasangnya. Kepatuhan
 * diverifikasi lewat daftar langkah yang ditulis manual di sini, DIPADUKAN
 * dengan pemeriksaan bahwa tiap langkah punya bukti nyata di kode —
 * supaya daftar ini tidak bisa diam-diam menyimpang dari implementasi
 * tanpa membuat test ini merah. Polanya sama seperti
 * `tests/core/kosakata.test.ts` yang menyalin daftar kata terlarang
 * CLAUDE.md apa adanya karena CLAUDE.md sendiri tidak dapat dibaca
 * program saat runtime.
 */

const BATAS_LANGKAH = 6;

const isiHalamanUtama = readFileSync(
  join(process.cwd(), "src", "app", "page.tsx"),
  "utf8",
);
const isiHalamanPeriksa = readFileSync(
  join(process.cwd(), "src", "app", "periksa", "page.tsx"),
  "utf8",
);
const isiHalamanHasil = readFileSync(
  join(process.cwd(), "src", "app", "hasil", "page.tsx"),
  "utf8",
);
const gabunganKode = `${isiHalamanUtama}\n${isiHalamanPeriksa}\n${isiHalamanHasil}`;

interface Langkah {
  readonly nama: string;
  readonly buktiKode: RegExp;
}

const LANGKAH_ALUR: readonly Langkah[] = [
  {
    nama: "buka halaman utama (/) — jalur masukan gambar dan tombol jalur manual terlihat sekaligus",
    buktiKode: /export default function App/,
  },
  {
    nama: "pilih jalur (tempel/seret/unggah gambar, atau tombol jalur manual) dan isi tawaran",
    buktiKode: /onDrop=\{tanganiDrop\}/,
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
    nama: "tekan tombol Terbitkan Lembar — penilaian dijalankan dan lembar dirakit",
    buktiKode: /function\s+tanganiTerbitkanLembar\b/,
  },
  {
    nama: "berpindah otomatis ke layar hasil (/hasil) — lembar tampil untuk diunduh/dibagikan",
    buktiKode: /router\.push\(\s*["']\/hasil["']\s*\)/,
  },
];

describe("S07-9/S13 jumlah langkah dari membuka halaman sampai lembar terbit", () => {
  it(`daftar langkah tidak melebihi ${BATAS_LANGKAH} (CLAUDE.md bagian 4, dinaikkan S13 — lihat PERUBAHAN.md)`, () => {
    expect(LANGKAH_ALUR.length).toBeLessThanOrEqual(BATAS_LANGKAH);
  });

  it("daftar langkah tidak kosong — pagar ini tidak boleh lulus secara hampa", () => {
    expect(LANGKAH_ALUR.length).toBeGreaterThan(0);
  });

  it.each(LANGKAH_ALUR.map((langkah) => [langkah.nama, langkah] as const))(
    "langkah %s punya bukti nyata di kode halaman",
    (_nama, langkah) => {
      expect(
        langkah.buktiKode.test(gabunganKode),
        `pola ${langkah.buktiKode} tidak ditemukan di src/app/page.tsx, src/app/periksa/page.tsx, maupun src/app/hasil/page.tsx`,
      ).toBe(true);
    },
  );

  it("ada TEPAT DUA jenis perpindahan halaman (router.push) di seluruh alur inti — konsisten dengan tiga layar (utama, periksa, hasil)", () => {
    const jumlahRouterPush = (gabunganKode.match(/router\.push\(/g) ?? []).length;
    // "/periksa" dipanggil dari dua tempat berbeda (jalur manual & jalur
    // gambar di halaman utama) — dihitung sebagai SATU jenis perpindahan.
    // "/hasil" dipanggil dari satu tempat (tombol Terbitkan). Totalnya dua
    // TUJUAN berbeda, bukan langkah tambahan per pemanggilan.
    expect(jumlahRouterPush).toBeGreaterThan(0);
    const tujuanBerbeda = new Set(
      [...gabunganKode.matchAll(/router\.push\(\s*["']([^"']+)["']\s*\)/g)].map(
        (cocok) => cocok[1],
      ),
    );
    expect(tujuanBerbeda).toEqual(new Set(["/periksa", "/hasil"]));
  });
});
