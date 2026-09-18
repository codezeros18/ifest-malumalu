/**
 * Pemilih penyedia `Pembaca`.
 *
 * Aturan pemilihan (CLAUDE.md §3.3) — KEDUANYA diperiksa, bukan salah satu:
 *   - `manualProvider` dipakai bila sumber tawaran adalah 'manual', ATAU
 *   - `manualProvider` dipakai bila `MODEL_API_KEY` kosong.
 *
 * `modelProvider` (S06, `./modelProvider.ts`) sekarang ada, tetapi tetap
 * DISUNTIKKAN pemanggil lewat `opsi.penyediaModel`, bukan dijadikan default
 * diam-diam di sini — `src/app/api/baca/route.ts` yang mengimpor dan
 * mengopernya (`pilihPembaca(sumber, { penyediaModel: modelProvider })`).
 * Sengaja tidak diubah menjadi default otomatis: `tests/alur/tanpa-model.test.ts`
 * (milik S05, di luar berkas yang boleh disentuh sprint ini) mengunci
 * perilaku "melempar bila sumber gambar dan penyediaModel belum disuntikkan"
 * sebagai bukti bahwa jalur gambar hanya aktif ketika pemanggil secara
 * eksplisit menyediakannya — bukan celah yang menyala sendiri.
 */

import type { SumberTawaran } from "../core/tipe";
import type { Pembaca } from "./pembaca";
import { manualProvider } from "./manualProvider";

export type { Pembaca } from "./pembaca";
export { manualProvider } from "./manualProvider";
export { modelProvider } from "./modelProvider";

export interface OpsiPemilihPembaca {
  /** Untuk pengujian: menggantikan `process.env.MODEL_API_KEY`. */
  readonly kunciApiModel?: string;
  /** Penyedia jalur model — pemanggil mengoper `modelProvider` (S06). */
  readonly penyediaModel?: Pembaca;
}

export function pilihPembaca(
  sumber: SumberTawaran,
  opsi: OpsiPemilihPembaca = {},
): Pembaca {
  const kunciApiModel = opsi.kunciApiModel ?? process.env["MODEL_API_KEY"];
  const kunciKosong = typeof kunciApiModel !== "string" || kunciApiModel.trim().length === 0;

  if (sumber === "manual" || kunciKosong) {
    return manualProvider;
  }

  if (!opsi.penyediaModel) {
    throw new Error(
      "Jalur gambar memerlukan opsi.penyediaModel — oper modelProvider dari src/vision/modelProvider.ts.",
    );
  }

  return opsi.penyediaModel;
}
