/**
 * Lapis 2 — pembandingan komponen biaya dan baris hitungan (BLUEPRINT G.5,
 * F.7). Fungsi murni, sama seperti `pencocokan.ts`: `data/komponen-biaya.json`
 * tidak pernah dibaca di sini — acuan yang sudah diuraikan pemanggil
 * diberikan lewat parameter, `null` berarti Lapis 2 dimatikan.
 *
 * Rumus F.7 ("biaya setara ± n bulan upah") hanya memerlukan DUA angka dari
 * tawaran itu sendiri (slot 5 dan slot 9) — tidak menghitung apa pun dari
 * `acuan`. Kehadiran `acuan` dipakai murni sebagai saklar aktif/mati Lapis 2,
 * simetris dengan arsitektur Lapis 1, sesuai BLUEPRINT G.5. Keputusan ini
 * dicatat di PROGRESS.md karena BLUEPRINT tidak merinci pemakaian lain atas
 * daftar komponennya.
 */

import { isiTemplat } from "./perakitan";
import { BARIS_HITUNGAN_LAPIS2_TEMPLAT } from "./teks";

export interface KomponenBiaya {
  readonly nama: string;
  readonly jumlahRupiah?: number;
}

/** Bentuk acuan yang SUDAH diuraikan oleh pemanggil — lihat catatan berkas. */
export interface AcuanBiaya {
  readonly tanggalAcuan: string;
  readonly komponen: readonly KomponenBiaya[];
}

export type StatusLapis2 =
  | { readonly status: "tersedia"; readonly catatanHitungan: string }
  | { readonly status: "data-kurang" }
  | { readonly status: "dimatikan" };

/** Mengenali "Rp1.500.000", "IDR 1.500.000", atau "15 juta" sebagai angka. */
const POLA_ANGKA_RUPIAH = /(?:rp|idr)\.?\s?([\d][\d.,]*)|(\d+(?:[.,]\d+)?)\s*juta\b/i;

export function ekstrakAngkaRupiah(teks: string | null): number | null {
  if (!teks) return null;

  const cocok = teks.match(POLA_ANGKA_RUPIAH);
  if (!cocok) return null;

  if (cocok[1]) {
    const angka = Number(cocok[1].replace(/[.,]/g, ""));
    return Number.isFinite(angka) && angka > 0 ? angka : null;
  }

  if (cocok[2]) {
    const angka = Number(cocok[2].replace(",", ".")) * 1_000_000;
    return Number.isFinite(angka) && angka > 0 ? angka : null;
  }

  return null;
}

/**
 * Baris catatan hitungan. Urutan pemeriksaan: acuan tersedia? → kedua
 * angka (upah dan biaya) berhasil diekstraksi? → hitung rasionya.
 */
export function hitungCatatanBiaya(
  nilaiUpah: string | null,
  nilaiBiaya: string | null,
  acuan: AcuanBiaya | null,
): StatusLapis2 {
  if (acuan === null) {
    return { status: "dimatikan" };
  }

  const upah = ekstrakAngkaRupiah(nilaiUpah);
  const biaya = ekstrakAngkaRupiah(nilaiBiaya);

  if (upah === null || biaya === null) {
    return { status: "data-kurang" };
  }

  const n = Math.round((biaya / upah) * 10) / 10;
  return {
    status: "tersedia",
    catatanHitungan: isiTemplat(BARIS_HITUNGAN_LAPIS2_TEMPLAT, { n: String(n) }),
  };
}
