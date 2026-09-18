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
import { KAMUS_LEMBAR } from "./teks";
import type { KamusLembar } from "./teks";

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

/**
 * Mengenali "Rp1.500.000", "IDR 1.500.000", "Rp 15 juta", atau "15 juta"
 * sebagai angka.
 *
 * 🔴 "Rp 15 juta" pernah terbaca sebagai 15 (bukan 15.000.000) karena cabang
 * "Rp"/"IDR" berhenti di angka sebelum kata pengali — akibatnya lembar
 * mencetak "± 0 bulan upah". Kata pengali "juta"/"ribu" sekarang ikut
 * ditangkap, baik setelah "Rp"/"IDR" maupun pada bentuk telanjang "15 juta".
 */
const POLA_ANGKA_RUPIAH =
  /(?:rp|idr)\.?\s?([\d][\d.,]*)\s*(juta|jt|ribu|rb)?|(\d+(?:[.,]\d+)?)\s*(juta|jt|ribu|rb)\b/i;

function pengali(kata: string | undefined): number {
  const k = kata?.toLowerCase();
  if (k === "juta" || k === "jt") return 1_000_000;
  if (k === "ribu" || k === "rb") return 1_000;
  return 1;
}

export function ekstrakAngkaRupiah(teks: string | null): number | null {
  if (!teks) return null;

  const cocok = teks.match(POLA_ANGKA_RUPIAH);
  if (!cocok) return null;

  // Cabang "Rp"/"IDR": pemisah ribuan dibuang ("5.000.000" → 5000000), sama
  // seperti sebelumnya. Cabang telanjang "15 juta": koma = desimal ("1,5").
  const angka = cocok[1]
    ? Number(cocok[1].replace(/[.,]/g, "")) * pengali(cocok[2])
    : Number((cocok[3] ?? "").replace(",", ".")) * pengali(cocok[4]);

  return Number.isFinite(angka) && angka > 0 ? angka : null;
}

/**
 * Baris catatan hitungan. Urutan pemeriksaan: acuan tersedia? → kedua
 * angka (upah dan biaya) berhasil diekstraksi? → hitung rasionya.
 */
export function hitungCatatanBiaya(
  nilaiUpah: string | null,
  nilaiBiaya: string | null,
  acuan: AcuanBiaya | null,
  kamus: KamusLembar = KAMUS_LEMBAR,
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
    catatanHitungan: isiTemplat(kamus.barisHitunganLapis2Templat, { n: String(n) }),
  };
}
