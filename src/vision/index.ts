/**
 * Pemilih penyedia `Pembaca`.
 *
 * Aturan pemilihan (CLAUDE.md §3.3, prompt sprint S05) — KEDUANYA diperiksa,
 * bukan salah satu:
 *   - `manualProvider` dipakai bila sumber tawaran adalah 'manual', ATAU
 *   - `manualProvider` dipakai bila `MODEL_API_KEY` kosong.
 *
 * `src/vision/modelProvider.ts` belum ada di sprint ini (itu pekerjaan S06),
 * dan berkas ini tidak diizinkan menyentuhnya. Karena itu penyedia model
 * DISUNTIKKAN oleh pemanggil lewat `opsi.penyediaModel`, bukan diimpor
 * langsung dari sini. Begitu S06 menulis `modelProvider.ts`, pemanggil
 * (endpoint `src/app/api/baca`, atau S12 saat mematikan lapisan model)
 * tinggal mengoper `{ penyediaModel: modelProvider }` — berkas ini tidak
 * perlu diubah.
 */

import type { SumberTawaran } from "../core/tipe";
import type { Pembaca } from "./pembaca";
import { manualProvider } from "./manualProvider";

export type { Pembaca } from "./pembaca";
export { manualProvider } from "./manualProvider";

export interface OpsiPemilihPembaca {
  /** Untuk pengujian: menggantikan `process.env.MODEL_API_KEY`. */
  readonly kunciApiModel?: string;
  /** Penyedia jalur model, disuntikkan pemanggil begitu S06 tersedia. */
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
      "Lapisan model belum tersedia — sediakan opsi.penyediaModel (lihat S06 src/vision/modelProvider.ts).",
    );
  }

  return opsi.penyediaModel;
}
