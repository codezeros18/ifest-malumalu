/**
 * Implementasi `Pembaca` untuk jalur pengetikan manual.
 *
 * TIDAK MENYENTUH JARINGAN SAMA SEKALI — tidak ada `fetch`, tidak ada modul
 * HTTP, tidak ada panggilan keluar apa pun. Ini yang membuat klaim "lapisan
 * model dapat dicabut dan sistem tetap berjalan" (CLAUDE.md §3.4) punya
 * bukti nyata, bukan sekadar pernyataan.
 *
 * Kontrak keyakinan: PENUH (1) untuk kolom yang diisi pengguna (setelah
 * `trim`, tidak kosong), NOL (0) untuk kolom yang dibiarkan kosong. Bukan
 * nilai tengah — S05 melarangnya secara eksplisit, karena nilai tengah akan
 * membuka celah pada aturan keraguan E.3 di lapisan penilaian.
 *
 * 🔴 Bentuk masukan `Tawaran.teks` untuk sumber 'manual' — KEPUTUSAN SPRINT
 * INI, dicatat di PROGRESS.md untuk Window 2 (S07):
 *
 *   `Tawaran.teks` berisi JSON string dari `Record<string, string>`, di mana
 *   kunci adalah SlotId sebagai string ("1" sampai "10") dan nilainya adalah
 *   isian pengguna untuk keterangan itu. Kunci yang tidak ada, atau yang
 *   nilainya bukan string, atau yang isinya hanya spasi, diperlakukan sama:
 *   keterangan itu dianggap TIDAK DIISI (nilai null, keyakinan 0).
 *
 *   Alasan bentuk ini: `Tawaran` (didefinisikan S01, milik Window 1) hanya
 *   punya satu medan teks datar, bukan sepuluh medan per-keterangan. Sprint
 *   ini dilarang mengubah `src/core`, sehingga JSON di dalam medan yang sudah
 *   ada adalah satu-satunya cara membawa sepuluh isian tanpa menambah tipe
 *   baru. Bila `teks` bukan JSON yang valid atau bukan objek, SELURUH
 *   keterangan dianggap tidak diisi — konsisten dengan aturan keraguan: ragu
 *   selalu jatuh ke arah "belum dijawab", tidak pernah dianggap terisi.
 *
 * Contoh: `JSON.stringify({ "1": "PT Karya Bersama Sejahtera", "4": "" })`
 * menghasilkan slot 1 terisi (keyakinan 1) dan slot 4 dianggap kosong
 * (keyakinan 0, karena string-nya kosong setelah trim).
 */

import type { SlotId } from "../core/slot";
import type { HasilBaca, Tawaran } from "../core/tipe";
import type { Pembaca } from "./pembaca";

/** Urutan tetap 1–10. Tidak diimpor dari `src/core` — lihat catatan di `pembaca.ts`. */
const URUTAN_SLOT: readonly SlotId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function isianDariTeks(teks: string | undefined): Partial<Record<SlotId, string>> {
  if (typeof teks !== "string" || teks.length === 0) {
    return {};
  }

  let terurai: unknown;
  try {
    terurai = JSON.parse(teks);
  } catch {
    return {};
  }

  if (typeof terurai !== "object" || terurai === null || Array.isArray(terurai)) {
    return {};
  }

  const objek = terurai as Record<string, unknown>;
  const isian: Partial<Record<SlotId, string>> = {};

  for (const id of URUTAN_SLOT) {
    const mentah = objek[String(id)];
    if (typeof mentah === "string") {
      isian[id] = mentah;
    }
  }

  return isian;
}

export const manualProvider: Pembaca = {
  async baca(tawaran: Tawaran): Promise<HasilBaca> {
    const isian = isianDariTeks(tawaran.teks);

    const nilai = {} as Record<SlotId, string | null>;
    const keyakinan = {} as Record<SlotId, number>;

    for (const id of URUTAN_SLOT) {
      const mentah = isian[id];
      const terisi = typeof mentah === "string" && mentah.trim().length > 0;

      nilai[id] = terisi ? mentah : null;
      keyakinan[id] = terisi ? 1 : 0;
    }

    return { nilai, keyakinan };
  },
};
