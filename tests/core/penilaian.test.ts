import { beforeAll, describe, expect, it } from "vitest";
import { Keadaan } from "../../src/core/tipe";
import type { HasilBacaFinal, Penilaian } from "../../src/core/tipe";
import { SLOT_IDS } from "../../src/core/slot";
import type { SlotId } from "../../src/core/slot";

/**
 * 🔴 TEST DITULIS SEBELUM IMPLEMENTASINYA ADA (S02).
 *
 * Kontrak yang WAJIB dipenuhi S03 di `src/core/penilaian.ts`:
 *   export const AMBANG_KEYAKINAN: number            // 0 < ambang <= 1
 *   export function nilai(
 *     masukan: HasilBacaFinal,
 *     keyakinan: Readonly<Record<SlotId, number>>,
 *   ): Penilaian
 *
 * Modul dimuat lewat spesifier VARIABEL, bukan literal, supaya `tsc --noEmit`
 * tetap hijau selama berkasnya belum ada. Yang merah hanya test-nya.
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

/** Nilai yang memenuhi kolom "DISEBUTKAN bila ada…" pada BLUEPRINT E.2. */
function nilaiLulusSemua(): Record<SlotId, string | null> {
  return {
    1: "PT Karya Bersama Sejahtera",
    2: "SIP2MI nomor 1234/SIP/2026, negara tujuan Taiwan",
    3: "Hanwha Techwin Co., Ltd.",
    4: "Operator mesin injeksi plastik",
    5: "NT$ 27.470 per bulan, ditransfer ke rekening bank setiap tanggal 5",
    6: "8 jam per hari, libur setiap hari Minggu",
    7: "3 tahun",
    8: "BPJS Ketenagakerjaan dan asuransi kesehatan Taiwan (NHI)",
    9: "Total Rp18.000.000 — tiket pesawat Rp6.000.000, pelatihan Rp4.000.000, pengurusan dokumen Rp8.000.000",
    10: "Salinan perjanjian kerja diserahkan saat penandatanganan, sebelum keberangkatan",
  };
}

function semuaNull(): Record<SlotId, string | null> {
  return {
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
    9: null,
    10: null,
  };
}

function keyakinanSeragam(angka: number): Record<SlotId, number> {
  return {
    1: angka,
    2: angka,
    3: angka,
    4: angka,
    5: angka,
    6: angka,
    7: angka,
    8: angka,
    9: angka,
    10: angka,
  };
}

function masukan(
  nilai: Record<SlotId, string | null>,
  ditandaiTidakTahu: readonly SlotId[] = [],
): HasilBacaFinal {
  return { nilai, ditandaiTidakTahu };
}

describe("S02-1 tiga keadaan, tidak ada keadaan keempat", () => {
  it("enum Keadaan berisi tepat tiga anggota", () => {
    expect(Object.keys(Keadaan)).toEqual([
      "DISEBUTKAN",
      "DISEBUTKAN_SEBAGIAN",
      "BELUM_DIJAWAB",
    ]);
  });

  it("setiap keterangan bernilai salah satu dari tiga keadaan itu", () => {
    const hasil = penilaian.nilai(
      masukan(nilaiLulusSemua()),
      keyakinanSeragam(1),
    );

    const keadaanSah: readonly Keadaan[] = [
      Keadaan.DISEBUTKAN,
      Keadaan.DISEBUTKAN_SEBAGIAN,
      Keadaan.BELUM_DIJAWAB,
    ];

    for (const id of SLOT_IDS) {
      expect(keadaanSah, `slot ${id} berkeadaan di luar tiga yang sah`).toContain(
        hasil.keadaan[id],
      );
    }
  });

  it("kesepuluh keterangan selalu punya keadaan, tidak ada yang undefined", () => {
    const hasil = penilaian.nilai(masukan(semuaNull()), keyakinanSeragam(1));

    for (const id of SLOT_IDS) {
      expect(hasil.keadaan[id], `slot ${id} tidak dinilai`).toBeDefined();
    }
  });
});

describe("S02-2 aturan keraguan diuji dari empat arah", () => {
  it("ambang keyakinan berada di rentang yang masuk akal", () => {
    expect(penilaian.AMBANG_KEYAKINAN).toBeGreaterThan(0);
    expect(penilaian.AMBANG_KEYAKINAN).toBeLessThanOrEqual(1);
  });

  it("arah 1 — nilai kosong menghasilkan BELUM_DIJAWAB", () => {
    const hasil = penilaian.nilai(masukan(semuaNull()), keyakinanSeragam(1));

    for (const id of SLOT_IDS) {
      expect(hasil.keadaan[id], `slot ${id} bernilai null`).toBe(
        Keadaan.BELUM_DIJAWAB,
      );
    }
  });

  it("arah 1b — string kosong menghasilkan BELUM_DIJAWAB", () => {
    const nilai = semuaNull();
    for (const id of SLOT_IDS) {
      nilai[id] = "";
    }

    const hasil = penilaian.nilai(masukan(nilai), keyakinanSeragam(1));

    for (const id of SLOT_IDS) {
      expect(hasil.keadaan[id], `slot ${id} bernilai ""`).toBe(
        Keadaan.BELUM_DIJAWAB,
      );
    }
  });

  it("arah 2 — nilai hanya spasi menghasilkan BELUM_DIJAWAB", () => {
    const nilai = semuaNull();
    for (const id of SLOT_IDS) {
      nilai[id] = "   \t  \n ";
    }

    const hasil = penilaian.nilai(masukan(nilai), keyakinanSeragam(1));

    for (const id of SLOT_IDS) {
      expect(hasil.keadaan[id], `slot ${id} hanya berisi spasi`).toBe(
        Keadaan.BELUM_DIJAWAB,
      );
    }
  });

  it("arah 3 — keyakinan di bawah ambang menghasilkan BELUM_DIJAWAB", () => {
    const dibawahAmbang = penilaian.AMBANG_KEYAKINAN - 0.01;
    const hasil = penilaian.nilai(
      masukan(nilaiLulusSemua()),
      keyakinanSeragam(dibawahAmbang),
    );

    for (const id of SLOT_IDS) {
      expect(
        hasil.keadaan[id],
        `slot ${id} berkeyakinan ${dibawahAmbang}, di bawah ambang`,
      ).toBe(Keadaan.BELUM_DIJAWAB);
    }
  });

  it("arah 4 — penanda 'tidak tahu' menghasilkan BELUM_DIJAWAB", () => {
    const hasil = penilaian.nilai(
      masukan(nilaiLulusSemua(), SLOT_IDS),
      keyakinanSeragam(1),
    );

    for (const id of SLOT_IDS) {
      expect(hasil.keadaan[id], `slot ${id} ditandai tidak tahu`).toBe(
        Keadaan.BELUM_DIJAWAB,
      );
    }
  });

  it("penanda 'tidak tahu' mengalahkan nilai yang sebenarnya lulus", () => {
    const hasil = penilaian.nilai(
      masukan(nilaiLulusSemua(), [3, 7]),
      keyakinanSeragam(1),
    );

    expect(hasil.keadaan[3]).toBe(Keadaan.BELUM_DIJAWAB);
    expect(hasil.keadaan[7]).toBe(Keadaan.BELUM_DIJAWAB);
    expect(hasil.keadaan[1]).not.toBe(Keadaan.BELUM_DIJAWAB);
  });
});

describe("S02-3 🔴 tidak ada jalur mana pun menuju DISEBUTKAN dari keyakinan rendah", () => {
  it("nilai yang seharusnya lulus pun tidak pernah DISEBUTKAN bila keyakinannya rendah", () => {
    const ambang = penilaian.AMBANG_KEYAKINAN;
    const keyakinanRendah = [0, 0.01, ambang / 2, ambang - 0.001];

    for (const angka of keyakinanRendah) {
      const hasil = penilaian.nilai(
        masukan(nilaiLulusSemua()),
        keyakinanSeragam(angka),
      );

      for (const id of SLOT_IDS) {
        expect(
          hasil.keadaan[id],
          `slot ${id} berkeyakinan ${angka} tidak boleh DISEBUTKAN`,
        ).not.toBe(Keadaan.DISEBUTKAN);
      }
    }
  });

  it("keyakinan rendah pada satu slot tidak menular ke slot lain", () => {
    const keyakinan = keyakinanSeragam(1);
    keyakinan[5] = 0;

    const hasil = penilaian.nilai(masukan(nilaiLulusSemua()), keyakinan);

    expect(hasil.keadaan[5]).toBe(Keadaan.BELUM_DIJAWAB);
    expect(hasil.keadaan[4]).not.toBe(Keadaan.BELUM_DIJAWAB);
  });

  it("keyakinan negatif atau NaN diperlakukan sebagai ragu, bukan sebagai lolos", () => {
    for (const angka of [-1, Number.NaN]) {
      const hasil = penilaian.nilai(
        masukan(nilaiLulusSemua()),
        keyakinanSeragam(angka),
      );

      for (const id of SLOT_IDS) {
        expect(
          hasil.keadaan[id],
          `slot ${id} berkeyakinan ${String(angka)} tidak boleh DISEBUTKAN`,
        ).not.toBe(Keadaan.DISEBUTKAN);
      }
    }
  });

  it("tepat di ambang dianggap cukup, satu tingkat di bawahnya tidak", () => {
    const ambang = penilaian.AMBANG_KEYAKINAN;

    const tepat = penilaian.nilai(
      masukan(nilaiLulusSemua()),
      keyakinanSeragam(ambang),
    );
    expect(tepat.keadaan[1]).toBe(Keadaan.DISEBUTKAN);

    const kurang = penilaian.nilai(
      masukan(nilaiLulusSemua()),
      keyakinanSeragam(ambang - 0.001),
    );
    expect(kurang.keadaan[1]).toBe(Keadaan.BELUM_DIJAWAB);
  });
});

describe("S02-7 urutan keluaran tetap 1 sampai 10", () => {
  it("kunci keadaan berurutan 1..10 saat seluruhnya terisi", () => {
    const hasil = penilaian.nilai(
      masukan(nilaiLulusSemua()),
      keyakinanSeragam(1),
    );

    expect(Object.keys(hasil.keadaan)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ]);
  });

  it("urutannya tidak berubah saat sebagian kosong — yang kosong tidak naik ke atas", () => {
    const nilai = nilaiLulusSemua();
    nilai[1] = null;
    nilai[2] = null;
    nilai[9] = null;

    const hasil = penilaian.nilai(masukan(nilai), keyakinanSeragam(1));

    expect(Object.keys(hasil.keadaan)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ]);
  });

  it("urutannya tetap saat seluruhnya kosong", () => {
    const hasil = penilaian.nilai(masukan(semuaNull()), keyakinanSeragam(1));

    expect(Object.keys(hasil.keadaan)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ]);
  });
});

describe("S02-8 hitungan faktual, tanpa persentase", () => {
  it("jumlahKosong sama dengan banyaknya keterangan BELUM_DIJAWAB", () => {
    const nilai = nilaiLulusSemua();
    nilai[2] = null;
    nilai[6] = null;
    nilai[8] = null;

    const hasil = penilaian.nilai(masukan(nilai), keyakinanSeragam(1));

    const dihitungUlang = SLOT_IDS.filter(
      (id) => hasil.keadaan[id] === Keadaan.BELUM_DIJAWAB,
    ).length;

    expect(hasil.jumlahKosong).toBe(dihitungUlang);
  });

  it("jumlahKosong 10 saat seluruhnya kosong", () => {
    const hasil = penilaian.nilai(masukan(semuaNull()), keyakinanSeragam(1));

    expect(hasil.jumlahKosong).toBe(10);
  });

  it("jumlahKosong 0 saat seluruhnya lulus", () => {
    const hasil = penilaian.nilai(
      masukan(nilaiLulusSemua()),
      keyakinanSeragam(1),
    );

    expect(hasil.jumlahKosong).toBe(0);
  });

  it("keluaran hanya memuat keadaan dan jumlahKosong — tidak ada persentase atau skor", () => {
    const hasil: Penilaian = penilaian.nilai(
      masukan(nilaiLulusSemua()),
      keyakinanSeragam(1),
    );

    expect(Object.keys(hasil).sort()).toEqual(["jumlahKosong", "keadaan"]);
  });

  it("tidak ada medan bernama persentase, skor, peringkat, atau tingkat risiko", () => {
    const hasil = penilaian.nilai(
      masukan(nilaiLulusSemua()),
      keyakinanSeragam(1),
    );

    const terlarang = /persen|persentase|skor|score|rating|peringkat|bintang|risiko/i;
    const medanTerlarang = Object.keys(hasil).filter((kunci) =>
      terlarang.test(kunci),
    );

    expect(medanTerlarang).toEqual([]);
  });
});
