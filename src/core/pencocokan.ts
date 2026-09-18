/**
 * Lapis 1 — pencocokan nama perusahaan ke salinan daftar bertanggal
 * (BLUEPRINT G.5, F.6). Fungsi murni: `src/core` dilarang menyentuh berkas,
 * jaringan, atau variabel lingkungan (CLAUDE.md §3.4) — karena itu berkas
 * ini TIDAK PERNAH membaca `data/p3mi-snapshot.json` sendiri. Salinan yang
 * sudah dibaca-dan-diuraikan diberikan lewat parameter `salinan`, dan
 * `null` berarti "berkas tidak ada atau rusak" — keputusan itu diambil di
 * pemanggil (`src/app/periksa/page.tsx`), bukan di sini.
 *
 * 🔴 "Penonaktifan Lapis 1" (S09-4) diimplementasikan DI SINI sebagai
 * cabang `salinan === null`, bukan sebagai pembacaan berkas — itulah cara
 * memenuhi instruksi sprint tanpa melanggar batas modul `src/core`.
 *
 * Algoritma toleran salah ketik dipilih PALING SEDIKIT bergantung pustaka
 * luar (keputusan terbuka sejak `[S00-pra]`, ditutup di sprint ini): jarak
 * Levenshtein ditulis sendiri, nol dependensi baru.
 */

import type { HasilLapis1, KeluaranPencocokan } from "./tipe";
import { KAMUS_LEMBAR } from "./teks";
import type { KamusLembar } from "./teks";
import { isiTemplat } from "./perakitan";

export interface EntriP3MI {
  readonly nama: string;
}

/** Bentuk salinan yang SUDAH diuraikan oleh pemanggil — lihat catatan berkas. */
export interface SalinanP3MI {
  readonly tanggalSalinan: string;
  readonly daftar: readonly EntriP3MI[];
}

/**
 * Tiga keadaan nyata dari S09-2, PLUS dua keadaan "tidak ada yang
 * dicocokkan" yang bukan bagian dari `KeluaranPencocokan` (S01) — karena
 * keduanya tidak menghasilkan `HasilLapis1` sama sekali, sejalan dengan
 * medan `IsiLembar.hasilLapis1` yang memang opsional.
 *
 * - `dimatikan`      → salinan tidak tersedia. Pemanggil menampilkan
 *                       `LAPIS1_DIMATIKAN` dari `teks.ts` sendiri.
 * - `tidak-ada-nama`  → tidak ada nama untuk dicocokkan (slot 1 kosong).
 *                       Tidak ada kalimat F.6 yang cocok untuk ini — diam,
 *                       bukan kegagalan.
 */
export type StatusLapis1 =
  | { readonly status: "aktif"; readonly hasil: HasilLapis1 }
  | { readonly status: "dimatikan" }
  | { readonly status: "tidak-ada-nama" };

const PENANDA_BADAN_USAHA = /\b(pt|cv|ud|pd|firma|koperasi)\b\.?/gi;

function normalisasiNama(nama: string): string {
  return nama
    .toUpperCase()
    .replace(PENANDA_BADAN_USAHA, "")
    .replace(/[.,()"'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Jarak Levenshtein baku — ditulis sendiri, lihat catatan berkas. */
function jarakLevenshtein(a: string, b: string): number {
  const baris = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) {
    baris[j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    let diagonalSebelumnya = baris[0] ?? 0;
    baris[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const atas = baris[j] ?? 0;
      const biaya = a[i - 1] === b[j - 1] ? 0 : 1;
      baris[j] = Math.min(atas + 1, (baris[j - 1] ?? 0) + 1, diagonalSebelumnya + biaya);
      diagonalSebelumnya = atas;
    }
  }

  return baris[b.length] ?? Math.max(a.length, b.length);
}

/** Ambang toleransi salah ketik: skala mengikuti panjang nama, minimum 1. */
function ambangToleransi(panjang: number): number {
  return Math.max(1, Math.floor(panjang * 0.2));
}

function cariPalingMirip(
  namaDinormalisasi: string,
  daftar: readonly EntriP3MI[],
): { entri: EntriP3MI; jarak: number } | null {
  let terbaik: { entri: EntriP3MI; jarak: number } | null = null;

  for (const entri of daftar) {
    const jarak = jarakLevenshtein(namaDinormalisasi, normalisasiNama(entri.nama));
    if (terbaik === null || jarak < terbaik.jarak) {
      terbaik = { entri, jarak };
    }
  }

  return terbaik;
}

function rakitHasilLapis1(
  keluaran: KeluaranPencocokan,
  tanggalSalinan: string,
  kamus: KamusLembar,
  namaMirip?: string,
): HasilLapis1 {
  const kalimat =
    keluaran === "ditemukan"
      ? isiTemplat(kamus.lapis1DitemukanTemplat, { "tanggal salinan": tanggalSalinan })
      : keluaran === "mirip"
        ? isiTemplat(kamus.lapis1MiripTemplat, {
            nama: namaMirip ?? "",
            "tanggal salinan": tanggalSalinan,
          })
        : isiTemplat(kamus.lapis1TidakDitemukanTemplat, { "tanggal salinan": tanggalSalinan });

  return { keluaran, kalimat, tanggalSalinan };
}

/**
 * Pencocokan toleran salah ketik terhadap salinan daftar P3MI.
 *
 * Urutan pemeriksaan: salinan tersedia? → nama ada? → cocok persis? →
 * cocok mirip (Levenshtein dalam ambang)? → tidak ditemukan.
 */
export function cocokkanNamaP3MI(
  nama: string | null,
  salinan: SalinanP3MI | null,
  kamus: KamusLembar = KAMUS_LEMBAR,
): StatusLapis1 {
  if (salinan === null) {
    return { status: "dimatikan" };
  }

  const namaBersih = nama?.trim() ?? "";
  if (namaBersih.length === 0) {
    return { status: "tidak-ada-nama" };
  }

  const namaDinormalisasi = normalisasiNama(namaBersih);

  const cocokPersis = salinan.daftar.find(
    (entri) => normalisasiNama(entri.nama) === namaDinormalisasi,
  );
  if (cocokPersis) {
    return {
      status: "aktif",
      hasil: rakitHasilLapis1("ditemukan", salinan.tanggalSalinan, kamus),
    };
  }

  const kandidat = cariPalingMirip(namaDinormalisasi, salinan.daftar);
  if (kandidat && namaDinormalisasi.length >= 3 && kandidat.jarak <= ambangToleransi(namaDinormalisasi.length)) {
    return {
      status: "aktif",
      hasil: rakitHasilLapis1(
        "mirip",
        salinan.tanggalSalinan,
        kamus,
        kandidat.entri.nama,
      ),
    };
  }

  return {
    status: "aktif",
    hasil: rakitHasilLapis1("tidak-ditemukan", salinan.tanggalSalinan, kamus),
  };
}
