/**
 * Antarmuka Pembaca — satu-satunya jalan sebuah Tawaran menjadi HasilBaca.
 *
 * SATU fungsi, tidak lebih. Dua implementasi memenuhinya:
 *   - `manualProvider` (S05) — jalur pengetikan, tidak menyentuh jaringan.
 *   - `modelProvider`  (S06) — jalur model penglihatan, satu panggilan API.
 *
 * Karena keduanya memenuhi antarmuka yang sama, lapisan model dapat dicabut
 * dan diganti `manualProvider` tanpa mengubah satu baris pun di pemanggilnya.
 * Ini bentuk teknis dari klaim arsitektur CLAUDE.md §3.4 dan BLUEPRINT G.4.
 *
 * Hanya TIPE yang diimpor dari `src/core` di sini — tidak ada fungsi maupun
 * nilai. Lihat `tests/core/batas-modul.test.ts` untuk pagar yang menegakkannya.
 */

import type { Tawaran, HasilBaca } from "../core/tipe";

export interface Pembaca {
  baca(tawaran: Tawaran): Promise<HasilBaca>;
}
