/**
 * Bentuk data yang mengalir antar-lapis, sesuai BLUEPRINT G.6.
 * Satu arah: Tawaran → HasilBaca → HasilBacaFinal → Penilaian → IsiLembar.
 *
 * Seluruh medan bertipe `string` di sini adalah PEMBAWA teks, bukan teksnya.
 * Isinya dirakit di S04 dari `src/core/teks.ts`.
 */

import type { SlotId } from "./slot";

/** Tepat tiga keadaan. Tidak ada keadaan keempat. */
export enum Keadaan {
  DISEBUTKAN = "DISEBUTKAN",
  DISEBUTKAN_SEBAGIAN = "DISEBUTKAN_SEBAGIAN",
  BELUM_DIJAWAB = "BELUM_DIJAWAB",
}

export type SumberTawaran = "gambar" | "manual";

export interface Tawaran {
  readonly sumber: SumberTawaran;
  readonly berkas?: Blob;
  readonly teks?: string;
}

/** Keluaran Pembaca. Belum boleh dinilai — wajib lewat koreksi manusia dulu. */
export interface HasilBaca {
  readonly nilai: Readonly<Record<SlotId, string | null>>;
  readonly keyakinan: Readonly<Record<SlotId, number>>;
}

/** Hasil setelah dikoreksi manusia. Hanya ini yang boleh masuk penilaian. */
export interface HasilBacaFinal {
  readonly nilai: Readonly<Record<SlotId, string | null>>;
  readonly ditandaiTidakTahu: readonly SlotId[];
}

export interface Penilaian {
  readonly keadaan: Readonly<Record<SlotId, Keadaan>>;
  readonly jumlahKosong: number;
}

export interface BarisBlok1 {
  readonly slot: SlotId;
  readonly label: string;
  readonly nilai: string;
  readonly keadaan: Keadaan;
}

export interface BarisBlok2 {
  readonly slot: SlotId;
  readonly kalimat: string;
  readonly dasarHukum: readonly string[];
}

export type KeluaranPencocokan = "ditemukan" | "mirip" | "tidak-ditemukan" | "dimatikan";

/** Lapis 1. Boleh mati — karena itu opsional di IsiLembar. */
export interface HasilLapis1 {
  readonly keluaran: KeluaranPencocokan;
  readonly kalimat: string;
  readonly tanggalSalinan: string;
  readonly namaTarget?: string;
}

export interface IsiLembar {
  readonly blok1: readonly BarisBlok1[];
  readonly blok2: readonly BarisBlok2[];
  readonly pertanyaan: readonly string[];
  readonly catatanHitungan?: string;
  readonly hasilLapis1?: HasilLapis1;
  readonly tanggal: string;
}
