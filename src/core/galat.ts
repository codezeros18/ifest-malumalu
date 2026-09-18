/**
 * Tujuh kode galat, persis dari BLUEPRINT F.9.
 *
 * Hanya KODE-nya yang ada di sini. Teks pesan dan label tindakan yang dilihat
 * pengguna ada di `src/core/teks.ts` (S04), dipetakan dari kode ini.
 */

export enum KodeGalat {
  E_GAMBAR_TERLALU_BESAR = "E_GAMBAR_TERLALU_BESAR",
  E_FORMAT_TIDAK_DIDUKUNG = "E_FORMAT_TIDAK_DIDUKUNG",
  E_PEMBACAAN_GAGAL = "E_PEMBACAAN_GAGAL",
  E_PEMBACAAN_KOSONG = "E_PEMBACAAN_KOSONG",
  E_MODEL_TIDAK_TERSEDIA = "E_MODEL_TIDAK_TERSEDIA",
  E_JARINGAN = "E_JARINGAN",
  E_TIDAK_ADA_MASUKAN = "E_TIDAK_ADA_MASUKAN",
}

/** Bentuk respons galat tunggal. Dipakai SELURUH endpoint, tanpa kecuali. */
export interface ResponsGalat {
  readonly kode: KodeGalat;
  readonly pesan: string;
  readonly tindakan?: string;
}
