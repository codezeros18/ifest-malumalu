import { Keadaan } from "./tipe";
import type { HasilBacaFinal, Penilaian } from "./tipe";
import { SLOT_IDS } from "./slot";
import type { SlotId } from "./slot";
import { ujiKualitatif } from "./kualitatif";

/**
 * Ambang keyakinan minimum. Nilai SEMENTARA (masih terbuka per S00-pra,
 * dikunci ulang setelah S06 mengumpulkan sebaran keyakinan pada poster
 * nyata). Dipilih konservatif — lebih baik terlalu banyak BELUM_DIJAWAB.
 */
export const AMBANG_KEYAKINAN = 0.7;

function nilaiKosongAtauSpasi(nilai: string | null): boolean {
  return nilai === null || nilai.trim() === "";
}

function keyakinanDibawahAmbang(keyakinan: number): boolean {
  // !Number.isFinite menolak NaN dan ±Infinity. Tanpa ini, `NaN < AMBANG`
  // bernilai false di JavaScript, sehingga nilai ber-NaN akan LOLOS jadi
  // DISEBUTKAN alih-alih jatuh ke ragu — pelanggaran langsung E.3.
  return !Number.isFinite(keyakinan) || keyakinan < AMBANG_KEYAKINAN;
}

/**
 * 🔴 SATU titik keputusan tunggal untuk aturan keraguan (BLUEPRINT E.3).
 * Tiga baris pertama pseudocode E.1 disatukan di sini secara sengaja, supaya
 * pagar ini dapat diverifikasi dengan melepas SATU baris (S03-6), bukan
 * mencari-cari beberapa cabang tersebar.
 */
function raguKeBelumDijawab(
  ditandaiTidakTahu: boolean,
  kosong: boolean,
  keyakinanRendah: boolean,
): boolean {
  return ditandaiTidakTahu || kosong || keyakinanRendah;
}

/**
 * Urutan pemeriksaan PERSIS pseudocode BLUEPRINT E.1. Urutan ini menentukan
 * hasilnya — jangan disusun ulang.
 */
export function nilai(
  masukan: HasilBacaFinal,
  keyakinan: Readonly<Record<SlotId, number>>,
): Penilaian {
  const keadaan = {} as Record<SlotId, Keadaan>;
  let jumlahKosong = 0;

  for (const id of SLOT_IDS) {
    const nilaiSlot = masukan.nilai[id];
    const ditandaiTidakTahu = masukan.ditandaiTidakTahu.includes(id);
    const kosong = nilaiKosongAtauSpasi(nilaiSlot);
    const keyakinanRendah = keyakinanDibawahAmbang(keyakinan[id]);

    if (raguKeBelumDijawab(ditandaiTidakTahu, kosong, keyakinanRendah)) {
      keadaan[id] = Keadaan.BELUM_DIJAWAB;
      jumlahKosong += 1;
      continue;
    }

    // Titik ini hanya tercapai bila `kosong` sudah false di atas, jadi
    // nilaiSlot pasti string, bukan null.
    const hasilUji = ujiKualitatif(id, nilaiSlot as string);

    if (hasilUji === "gagal") {
      keadaan[id] = Keadaan.BELUM_DIJAWAB;
      jumlahKosong += 1;
    } else if (hasilUji === "sebagian") {
      keadaan[id] = Keadaan.DISEBUTKAN_SEBAGIAN;
    } else {
      keadaan[id] = Keadaan.DISEBUTKAN;
    }
  }

  return { keadaan, jumlahKosong };
}
