/**
 * Lapis 2 — Pembandingan komponen biaya dan baris catatan hitungan.
 * S09: Implementasi baris catatan hitungan berbasis perbandingan biaya terhadap upah bulanan.
 */

import {
  BARIS_HITUNGAN_LAPIS2_TEMPLAT,
  LAPIS2_ANGKA_TIDAK_ADA,
  LAPIS2_DIMATIKAN,
} from "./teks";
import { isiTemplat } from "./perakitan";

export interface OpsiLapis2 {
  readonly aktif?: boolean;
  readonly acuan?: unknown;
}

/**
 * Mengekstrak nilai numerik dari string atau angka input.
 * Mendukung format Rupiah, pemisah titik/koma, dan singkatan 'juta'/'jt'.
 */
export function ekstrakAngka(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") {
    return Number.isFinite(input) && input >= 0 ? input : null;
  }

  const teks = input.trim().toLowerCase();
  if (teks === "") return null;

  // Cek pola "X juta" / "X jt"
  const cocokJuta = teks.match(/([0-9]+(?:[.,][0-9]+)?)\s*(?:juta|jt)\b/);
  if (cocokJuta && cocokJuta[1]) {
    const angkaDasar = parseFloat(cocokJuta[1].replace(",", "."));
    if (!isNaN(angkaDasar) && angkaDasar >= 0) {
      return angkaDasar * 1_000_000;
    }
  }

  // Bersihkan karakter non-angka kecuali titik dan koma
  // Format Indonesia: 15.000.000 atau 15,000,000
  const hanyaDigitKomaTitik = teks.replace(/[^0-9.,]/g, "");
  if (!hanyaDigitKomaTitik) return null;

  // Bila format ribuan titik (mis. 5.000.000 atau 15.000.000)
  if (hanyaDigitKomaTitik.includes(".")) {
    const tanpaTitik = hanyaDigitKomaTitik.replace(/\./g, "").replace(",", ".");
    const angka = parseFloat(tanpaTitik);
    if (!isNaN(angka) && angka >= 0) return angka;
  }

  // Bila format koma ribuan (mis. 5,000,000)
  if (hanyaDigitKomaTitik.includes(",")) {
    const tanpaKoma = hanyaDigitKomaTitik.replace(/,/g, "");
    const angka = parseFloat(tanpaKoma);
    if (!isNaN(angka) && angka >= 0) return angka;
  }

  const angka = parseFloat(hanyaDigitKomaTitik);
  return !isNaN(angka) && angka >= 0 ? angka : null;
}

/**
 * Menghitung catatan hitungan perbandingan biaya terhadap upah.
 * Rumus: "Biaya yang diminta setara ± {n} bulan upah yang dijanjikan."
 */
export function hitungCatatanBiaya(
  upahInput: string | number | null | undefined,
  biayaInput: string | number | null | undefined,
  opsi?: OpsiLapis2 | null,
): string {
  // Bila Lapis 2 dimatikan atau berkas acuan dinyatakan rusak/tidak tersedia
  if (opsi === null || opsi?.aktif === false) {
    return LAPIS2_DIMATIKAN;
  }

  // Jika opsi dikirim tetapi nilai acuan dinyatakan rusak (mis. null)
  if (opsi && "acuan" in opsi && opsi.acuan === null) {
    return LAPIS2_DIMATIKAN;
  }

  const upah = ekstrakAngka(upahInput);
  const biaya = ekstrakAngka(biayaInput);

  // Bila salah satu atau kedua angka tidak ada atau upah nol
  if (upah === null || biaya === null || upah <= 0) {
    return LAPIS2_ANGKA_TIDAK_ADA;
  }

  const rasio = Math.round(biaya / upah);
  return isiTemplat(BARIS_HITUNGAN_LAPIS2_TEMPLAT, { n: String(rasio) });
}

export const hitungBarisHitungan = hitungCatatanBiaya;
