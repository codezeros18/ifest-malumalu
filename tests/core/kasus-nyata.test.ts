import { beforeAll, describe, expect, it } from "vitest";
import { Keadaan } from "../../src/core/tipe";
import type { HasilBacaFinal, Penilaian } from "../../src/core/tipe";
import { SLOT_IDS } from "../../src/core/slot";
import type { SlotId } from "../../src/core/slot";

/**
 * 🔴 TEST DITULIS SEBELUM IMPLEMENTASINYA ADA (S02).
 *
 * Verifikasi silang BLUEPRINT E.5. Ketiga sebaran hasil di bawah adalah angka
 * yang SUDAH DIKETAHUI dari pengujian manual tim terhadap poster nyata:
 *
 *   Kasus A — poster mencatut nama perusahaan berizin : 1 / 3 / 6
 *   Kasus B — gaji besar lewat lingkaran keluarga     : 0 / 3 / 7
 *   Kasus C — poster paling lengkap yang ditemukan    : 6 / 0 / 4
 *
 * 🔴 Angka-angka ini TIDAK BOLEH diubah supaya implementasinya lebih mudah
 * lulus. Bila S03 tidak dapat mencapainya, yang salah adalah aturannya atau
 * nilai contoh di bawah — keduanya dibahas dan dicatat, bukan ditumpulkan.
 */

interface ModulPenilaian {
  readonly AMBANG_KEYAKINAN: number;
  readonly nilai: (
    masukan: HasilBacaFinal,
    keyakinan: Readonly<Record<SlotId, number>>,
  ) => Penilaian;
}

const JALUR_PENILAIAN = "../../src/core/penilaian";

let penilaian: ModulPenilaian;

beforeAll(async () => {
  penilaian = (await import(JALUR_PENILAIAN)) as unknown as ModulPenilaian;
});

function keyakinanPenuh(): Record<SlotId, number> {
  return {
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    10: 1,
  };
}

interface Sebaran {
  readonly disebutkan: number;
  readonly sebagian: number;
  readonly belumDijawab: number;
}

function sebaranDari(hasil: Penilaian): Sebaran {
  const hitung = (keadaan: Keadaan): number =>
    SLOT_IDS.filter((id) => hasil.keadaan[id] === keadaan).length;

  return {
    disebutkan: hitung(Keadaan.DISEBUTKAN),
    sebagian: hitung(Keadaan.DISEBUTKAN_SEBAGIAN),
    belumDijawab: hitung(Keadaan.BELUM_DIJAWAB),
  };
}

/**
 * Kasus A — poster mencatut nama perusahaan berizin.
 * Nama perusahaan sah (slot 1) tercantum, sisanya sepi.
 */
const KASUS_A: Record<SlotId, string | null> = {
  1: "PT Amanah Putra Pratama",
  2: null,
  3: "Pabrik garmen di kawasan industri Taoyuan",
  4: "Bidang manufaktur elektronik",
  5: "Gaji Rp9.500.000 per bulan",
  6: null,
  7: "kontrak panjang",
  8: "dijamin aman",
  9: null,
  10: "dokumen diurus semua",
};

/** Kasus B — tawaran gaji besar lewat lingkaran keluarga. */
const KASUS_B: Record<SlotId, string | null> = {
  1: "Pak Haji Rahmat",
  2: null,
  3: "majikan baik",
  4: "kerja di luar negeri",
  5: "Gaji 15 juta rupiah per bulan",
  6: "8 jam per hari",
  7: null,
  8: null,
  9: null,
  10: "Perjanjian kerja akan diberikan",
};

/**
 * Kasus C — poster paling lengkap yang ditemukan.
 * Empat yang kosong menurut E.5: nomor izin perekrutan (2), jangka waktu
 * kontrak (7), jaminan sosial (8), dan rincian biaya (9).
 */
const KASUS_C: Record<SlotId, string | null> = {
  1: "PT Karya Bersama Sejahtera",
  2: null,
  3: "Hanwha Techwin Co., Ltd.",
  4: "Operator mesin injeksi plastik",
  5: "NT$ 27.470 per bulan, ditransfer ke rekening bank setiap tanggal 5",
  6: "8 jam per hari, libur setiap hari Minggu",
  7: null,
  8: null,
  9: null,
  10: "Salinan perjanjian kerja diserahkan saat penandatanganan, sebelum keberangkatan",
};

describe("S02-6 verifikasi silang terhadap kasus nyata (BLUEPRINT E.5)", () => {
  it("Kasus A — mencatut nama perusahaan berizin: 1 disebutkan, 3 sebagian, 6 belum dijawab", () => {
    const hasil = penilaian.nilai(
      { nilai: KASUS_A, ditandaiTidakTahu: [] },
      keyakinanPenuh(),
    );

    expect(sebaranDari(hasil)).toEqual({
      disebutkan: 1,
      sebagian: 3,
      belumDijawab: 6,
    });
  });

  it("Kasus A — yang DISEBUTKAN tepat slot 1, nama perusahaan yang dicatut itu sendiri", () => {
    const hasil = penilaian.nilai(
      { nilai: KASUS_A, ditandaiTidakTahu: [] },
      keyakinanPenuh(),
    );

    expect(hasil.keadaan[1]).toBe(Keadaan.DISEBUTKAN);
  });

  it("Kasus B — gaji besar lewat lingkaran keluarga: 0 disebutkan, 3 sebagian, 7 belum dijawab", () => {
    const hasil = penilaian.nilai(
      { nilai: KASUS_B, ditandaiTidakTahu: [] },
      keyakinanPenuh(),
    );

    expect(sebaranDari(hasil)).toEqual({
      disebutkan: 0,
      sebagian: 3,
      belumDijawab: 7,
    });
  });

  it("Kasus C — poster paling lengkap: 6 disebutkan, 0 sebagian, 4 belum dijawab", () => {
    const hasil = penilaian.nilai(
      { nilai: KASUS_C, ditandaiTidakTahu: [] },
      keyakinanPenuh(),
    );

    expect(sebaranDari(hasil)).toEqual({
      disebutkan: 6,
      sebagian: 0,
      belumDijawab: 4,
    });
  });

  it("Kasus C — keempat yang kosong tepat slot 2, 7, 8, dan 9", () => {
    const hasil = penilaian.nilai(
      { nilai: KASUS_C, ditandaiTidakTahu: [] },
      keyakinanPenuh(),
    );

    const kosong = SLOT_IDS.filter(
      (id) => hasil.keadaan[id] === Keadaan.BELUM_DIJAWAB,
    );

    expect(kosong).toEqual([2, 7, 8, 9]);
  });

  it("ketiga kasus tetap menjumlah sepuluh keterangan", () => {
    for (const [nama, kasus] of [
      ["A", KASUS_A],
      ["B", KASUS_B],
      ["C", KASUS_C],
    ] as const) {
      const hasil = penilaian.nilai(
        { nilai: kasus, ditandaiTidakTahu: [] },
        keyakinanPenuh(),
      );
      const sebaran = sebaranDari(hasil);

      expect(
        sebaran.disebutkan + sebaran.sebagian + sebaran.belumDijawab,
        `kasus ${nama} tidak menjumlah 10`,
      ).toBe(10);
    }
  });

  it("jumlahKosong ketiga kasus sejalan dengan sebarannya", () => {
    for (const [nama, kasus, harapan] of [
      ["A", KASUS_A, 6],
      ["B", KASUS_B, 7],
      ["C", KASUS_C, 4],
    ] as const) {
      const hasil = penilaian.nilai(
        { nilai: kasus, ditandaiTidakTahu: [] },
        keyakinanPenuh(),
      );

      expect(hasil.jumlahKosong, `jumlahKosong kasus ${nama}`).toBe(harapan);
    }
  });

  it("🎯 Kasus A membuktikan Lapis 0 tetap menyala walau nama perusahaannya sah", () => {
    const hasil = penilaian.nilai(
      { nilai: KASUS_A, ditandaiTidakTahu: [] },
      keyakinanPenuh(),
    );

    expect(hasil.keadaan[1]).toBe(Keadaan.DISEBUTKAN);
    expect(hasil.jumlahKosong).toBeGreaterThanOrEqual(6);
  });
});
