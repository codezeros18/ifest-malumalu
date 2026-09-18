/**
 * Lapis 1 — Pencocokan nama perusahaan ke salinan daftar bertanggal.
 * S09: Implementasi pencocokan toleran salah ketik, perakitan kalimat F.6,
 * dan penonaktifan degradasi anggun tanpa menghentikan alur utama.
 */

import type { HasilLapis1 } from "./tipe";
import {
  LAPIS1_DIMATIKAN,
  LAPIS1_DITEMUKAN_TEMPLAT,
  LAPIS1_MIRIP_TEMPLAT,
  LAPIS1_TIDAK_DITEMUKAN_TEMPLAT,
} from "./teks";
import { isiTemplat } from "./perakitan";
import { DAFTAR_P3MI, TANGGAL_SNAPSHOT_P3MI, normalisasiNama } from "./p3mi";

export interface ItemPerusahaanSnapshot {
  readonly nama: string;
  readonly nama_lengkap?: string;
  readonly namaLengkap?: string;
  readonly nomor_izin?: string;
  readonly nomorIzin?: string;
  readonly direktur?: string;
}

export interface SnapshotP3MIInput {
  readonly tanggal_snapshot?: string;
  readonly tanggalSalinan?: string;
  readonly perusahaan?: readonly ItemPerusahaanSnapshot[];
  readonly aktif?: boolean;
}

export const SNAPSHOT_BAWAAN: SnapshotP3MIInput = {
  tanggal_snapshot: TANGGAL_SNAPSHOT_P3MI,
  tanggalSalinan: TANGGAL_SNAPSHOT_P3MI,
  perusahaan: DAFTAR_P3MI,
  aktif: true,
};

function hitungBigram(str: string): Set<string> {
  const set = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    set.add(str.slice(i, i + 2));
  }
  return set;
}

/**
 * Mencocokkan nama perusahaan ke data snapshot P3MI.
 * Menghasilkan tiga kemungkinan bila aktif: 'ditemukan', 'mirip', atau 'tidak-ditemukan'.
 * Bila berkas salinan tidak ada atau rusak, menghasilkan 'dimatikan' dengan kalimat F.6.
 */
export function cocokanNamaPerusahaan(
  namaInput: string | null | undefined,
  snapshot: unknown = SNAPSHOT_BAWAAN,
): HasilLapis1 {
  // Bila berkas salinan tidak ada (null) atau bukan objek
  if (snapshot === null || typeof snapshot !== "object") {
    return {
      keluaran: "dimatikan",
      kalimat: LAPIS1_DIMATIKAN,
      tanggalSalinan: "",
    };
  }

  const snapshotObj = snapshot as Partial<SnapshotP3MIInput>;

  // Bila secara eksplisit dinonaktifkan
  if (snapshotObj.aktif === false) {
    return {
      keluaran: "dimatikan",
      kalimat: LAPIS1_DIMATIKAN,
      tanggalSalinan: "",
    };
  }

  // Validasi integritas berkas snapshot (bila rusak)
  const tanggalSalinanRaw =
    typeof snapshotObj.tanggalSalinan === "string" && snapshotObj.tanggalSalinan.trim()
      ? snapshotObj.tanggalSalinan.trim()
      : typeof snapshotObj.tanggal_snapshot === "string" && snapshotObj.tanggal_snapshot.trim()
        ? snapshotObj.tanggal_snapshot.trim()
        : null;

  const daftarPerusahaan = Array.isArray(snapshotObj.perusahaan)
    ? snapshotObj.perusahaan
    : null;

  if (!tanggalSalinanRaw || !daftarPerusahaan) {
    return {
      keluaran: "dimatikan",
      kalimat: LAPIS1_DIMATIKAN,
      tanggalSalinan: "",
    };
  }

  const tanggalSalinan = tanggalSalinanRaw;

  // Bila masukan nama kosong atau tidak memadai
  if (!namaInput || namaInput.trim() === "") {
    return {
      keluaran: "tidak-ditemukan",
      kalimat: isiTemplat(LAPIS1_TIDAK_DITEMUKAN_TEMPLAT, {
        "tanggal salinan": tanggalSalinan,
      }),
      tanggalSalinan,
    };
  }

  const inputBersih = normalisasiNama(namaInput);
  if (inputBersih.length < 2) {
    return {
      keluaran: "tidak-ditemukan",
      kalimat: isiTemplat(LAPIS1_TIDAK_DITEMUKAN_TEMPLAT, {
        "tanggal salinan": tanggalSalinan,
      }),
      tanggalSalinan,
    };
  }

  // 1. Pencocokan Persis (Exact Match)
  for (const item of daftarPerusahaan) {
    const normItemNama = normalisasiNama(item.nama);
    const normItemLengkap = item.nama_lengkap
      ? normalisasiNama(item.nama_lengkap)
      : item.namaLengkap
        ? normalisasiNama(item.namaLengkap)
        : "";

    if (normItemNama === inputBersih || normItemLengkap === inputBersih) {
      return {
        keluaran: "ditemukan",
        kalimat: isiTemplat(LAPIS1_DITEMUKAN_TEMPLAT, {
          "tanggal salinan": tanggalSalinan,
        }),
        tanggalSalinan,
        namaTarget: item.nama_lengkap ?? item.namaLengkap ?? item.nama,
      };
    }
  }

  // 2. Pencocokan Substring
  if (inputBersih.length >= 4) {
    for (const item of daftarPerusahaan) {
      const normItemNama = normalisasiNama(item.nama);
      if (normItemNama.length >= 4 && (normItemNama.includes(inputBersih) || inputBersih.includes(normItemNama))) {
        const targetName = item.nama_lengkap ?? item.namaLengkap ?? item.nama;
        return {
          keluaran: "mirip",
          kalimat: isiTemplat(LAPIS1_MIRIP_TEMPLAT, {
            nama: targetName,
            "tanggal salinan": tanggalSalinan,
          }),
          tanggalSalinan,
          namaTarget: targetName,
        };
      }
    }
  }

  // 3. Pencocokan Kemiripan (Bigram Fuzzy / Toleran Salah Ketik)
  const inputBigrams = hitungBigram(inputBersih);
  let bestScore = 0;
  let bestItem: ItemPerusahaanSnapshot | undefined;

  for (const item of daftarPerusahaan) {
    const normItem = normalisasiNama(item.nama);
    const targetBigrams = hitungBigram(normItem);

    let intersection = 0;
    for (const bg of inputBigrams) {
      if (targetBigrams.has(bg)) intersection++;
    }

    const total = inputBigrams.size + targetBigrams.size;
    const score = total === 0 ? 0 : (2.0 * intersection) / total;

    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  }

  if (bestScore >= 0.70 && bestItem) {
    const targetName = bestItem.nama_lengkap ?? bestItem.namaLengkap ?? bestItem.nama;
    return {
      keluaran: "mirip",
      kalimat: isiTemplat(LAPIS1_MIRIP_TEMPLAT, {
        nama: targetName,
        "tanggal salinan": tanggalSalinan,
      }),
      tanggalSalinan,
      namaTarget: targetName,
    };
  }

  // 4. Tidak Ditemukan
  return {
    keluaran: "tidak-ditemukan",
    kalimat: isiTemplat(LAPIS1_TIDAK_DITEMUKAN_TEMPLAT, {
      "tanggal salinan": tanggalSalinan,
    }),
    tanggalSalinan,
  };
}
