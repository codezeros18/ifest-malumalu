import { beforeAll, describe, expect, it } from "vitest";
import type { SlotId } from "../../src/core/slot";

/**
 * 🔴 TEST DITULIS SEBELUM IMPLEMENTASINYA ADA (S02).
 *
 * Kontrak yang WAJIB dipenuhi S03 di `src/core/kualitatif.ts`:
 *   export function ujiKualitatif(
 *     slot: SlotId,
 *     nilai: string,
 *   ): "lulus" | "sebagian" | "gagal"
 *
 * Pemetaan ke tiga kolom BLUEPRINT E.2:
 *   "lulus"    → kolom "DISEBUTKAN bila ada…"
 *   "gagal"    → kolom "Tetap BELUM_DIJAWAB bila hanya…"
 *   "sebagian" → kolom "DISEBUTKAN_SEBAGIAN bila…"
 *
 * Fungsi ini HANYA menguji mutu nilainya. Aturan keraguan (kosong, spasi,
 * keyakinan rendah, penanda tidak tahu) bukan urusannya — itu di penilaian.ts.
 */

type HasilUji = "lulus" | "sebagian" | "gagal";

interface ModulKualitatif {
  readonly ujiKualitatif: (slot: SlotId, nilai: string) => HasilUji;
}

const JALUR_KUALITATIF = "../../src/core/kualitatif";

let kualitatif: ModulKualitatif;

beforeAll(async () => {
  kualitatif = (await import(JALUR_KUALITATIF)) as unknown as ModulKualitatif;
});

interface KasusSlot {
  readonly slot: SlotId;
  readonly judul: string;
  readonly lulus: readonly string[];
  readonly gagal: readonly string[];
  readonly sebagian: readonly string[];
  /** Diisi bila contohnya TIDAK harfiah dari E.2, beserta alasannya. */
  readonly catatan?: string;
}

const KASUS: readonly KasusSlot[] = [
  {
    slot: 1,
    judul: "perusahaan yang memberangkatkan",
    lulus: ["PT Karya Bersama Sejahtera", "CV Mitra Tenaga Mandiri"],
    gagal: [
      "Pak Haji Rahmat",
      "@lowongan.taiwan.resmi",
      "0812-3456-7890",
      "PT resmi",
      // Poster nyata: nama orang asing + label kontak (S16, dari probe korpus)
      "Mr. Chen / pabrik garmen",
      "agen: 0812-3456-7890",
    ],
    sebagian: ["Karya Bersama Sejahtera"],
    catatan:
      "Contoh sebagian diturunkan dari frasa E.2 'Nama disebut tetapi tidak lengkap': nama ada tetapi tanpa penanda badan usaha.",
  },
  {
    slot: 2,
    judul: "izin penempatan dan negara tujuan",
    lulus: ["SIP2MI nomor 1234/SIP/2026, negara tujuan Taiwan"],
    gagal: ["izin lengkap", "resmi"],
    sebagian: ["Negara tujuan Taiwan"],
  },
  {
    slot: 3,
    judul: "siapa yang akan mempekerjakan",
    lulus: ["Hanwha Techwin Co., Ltd.", "Chang Hwa Electronics Corporation", "PT. Garmen Tekstil Indonesia"],
    gagal: ["perusahaan besar", "pabrik di Taiwan", "majikan baik"],
    sebagian: ["Pabrik garmen di kawasan industri Taoyuan"],
    catatan:
      "E.2 baris 3 saling bertabrakan: 'pabrik di Taiwan' terdaftar di kolom GAGAL, padahal kolom SEBAGIAN berbunyi 'Jenis tempat kerja disebut, namanya tidak' yang persis menggambarkannya. Daftar contoh harfiah dimenangkan untuk kolom gagal; contoh sebagian diturunkan sebagai jenis tempat kerja yang lebih spesifik namun tetap tanpa nama entitas.",
  },
  {
    slot: 4,
    judul: "pekerjaannya apa persisnya",
    lulus: ["Operator mesin injeksi plastik", "Perawat lansia di panti jompo"],
    gagal: ["kerja pabrik", "kerja di luar negeri"],
    sebagian: ["Bidang manufaktur elektronik"],
    catatan:
      "Contoh sebagian diturunkan dari frasa E.2 'Bidang disebut, jabatan tidak'.",
  },
  {
    slot: 5,
    judul: "upah dan cara pembayarannya",
    lulus: [
      "NT$ 27.470 per bulan, ditransfer ke rekening bank setiap tanggal 5",
      "Rp9.500.000 per bulan, dibayar tunai setiap akhir bulan",
    ],
    gagal: ["gaji besar", "gaji menarik", "sampai puluhan juta"],
    sebagian: ["Gaji Rp9.500.000 per bulan", "Gaji 15jt"],
  },
  {
    slot: 6,
    judul: "jam kerja, cuti, dan waktu istirahat",
    lulus: ["8 jam per hari, libur setiap hari Minggu"],
    gagal: ["jam kerja normal", "libur sesuai aturan"],
    sebagian: ["8 jam per hari", "Libur setiap hari Minggu"],
  },
  {
    slot: 7,
    judul: "lama kontrak",
    lulus: ["3 tahun", "24 bulan"],
    gagal: ["kontrak panjang", "bisa diperpanjang"],
    sebagian: ["Kontrak 2 periode"],
    catatan:
      "Contoh sebagian diturunkan dari frasa E.2 'Angka ada, satuan tidak jelas'.",
  },
  {
    slot: 8,
    judul: "jaminan sosial dan keselamatan",
    lulus: ["BPJS Ketenagakerjaan dan asuransi kesehatan Taiwan (NHI)"],
    gagal: ["dijamin aman", "ada asuransi"],
    sebagian: ["Asuransi kesehatan disediakan perusahaan"],
    catatan:
      "E.2 baris 8 nyaris bertabrakan: kolom gagal berbunyi '\"ada asuransi\" tanpa keterangan', kolom sebagian berbunyi 'Disebut ada, jenisnya tidak'. Pembedanya diambil dari frasa 'tanpa keterangan': sebutan telanjang → gagal; ada kategorinya tetapi skema konkretnya tidak disebut → sebagian.",
  },
  {
    slot: 9,
    judul: "biaya: yang diminta dan siapa menanggung",
    lulus: [
      "Total Rp18.000.000 — tiket pesawat Rp6.000.000, pelatihan Rp4.000.000, pengurusan dokumen Rp8.000.000",
    ],
    gagal: ["biaya terjangkau", "biaya ringan, bisa dicicil"],
    sebagian: ["Biaya total Rp18.000.000", "Rp18.000.000", "Biaya 15 juta, bisa dicicil"],
    catatan:
      "🔴 E.2 baris 9 bertabrakan langsung: kolom gagal berbunyi 'Angka total tanpa rincian sama sekali', kolom sebagian berbunyi 'Angka total ada, rinciannya tidak → selalu SEBAGIAN, tidak pernah DISEBUTKAN'. Masukan yang sama, dua keluaran. Dimenangkan oleh kolom sebagian karena S02-5 menyebutnya eksplisit. Akibatnya contoh gagal untuk baris ini diturunkan: frasa kabur tanpa angka sama sekali.",
  },
  {
    slot: 10,
    judul: "dokumen yang akan Anda pegang",
    lulus: [
      "Salinan perjanjian kerja diserahkan saat penandatanganan, sebelum keberangkatan",
    ],
    gagal: ["dokumen diurus semua"],
    sebagian: ["Perjanjian kerja akan diberikan"],
    catatan:
      "Contoh sebagian diturunkan dari frasa E.2 'Disebut akan diberikan, waktunya tidak'.",
  },
];

describe("S02-4 aturan kualitatif untuk kesepuluh keterangan", () => {
  it("kesepuluh keterangan punya blok kasusnya sendiri", () => {
    expect(KASUS.map((kasus) => kasus.slot)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("setiap keterangan punya minimal satu kasus lulus, gagal, dan sebagian", () => {
    for (const kasus of KASUS) {
      expect(kasus.lulus.length, `slot ${kasus.slot} tanpa kasus lulus`).toBeGreaterThan(0);
      expect(kasus.gagal.length, `slot ${kasus.slot} tanpa kasus gagal`).toBeGreaterThan(0);
      expect(
        kasus.sebagian.length,
        `slot ${kasus.slot} tanpa kasus sebagian`,
      ).toBeGreaterThan(0);
    }
  });

  for (const kasus of KASUS) {
    describe(`keterangan ${kasus.slot} — ${kasus.judul}`, () => {
      for (const contoh of kasus.lulus) {
        it(`lulus: "${contoh}"`, () => {
          expect(kualitatif.ujiKualitatif(kasus.slot, contoh)).toBe("lulus");
        });
      }

      for (const contoh of kasus.gagal) {
        it(`gagal: "${contoh}"`, () => {
          expect(kualitatif.ujiKualitatif(kasus.slot, contoh)).toBe("gagal");
        });
      }

      for (const contoh of kasus.sebagian) {
        it(`sebagian: "${contoh}"`, () => {
          expect(kualitatif.ujiKualitatif(kasus.slot, contoh)).toBe("sebagian");
        });
      }
    });
  }
});

describe("S02-5 keterangan 9 — angka total tanpa rincian", () => {
  const angkaTotalTanpaRincian = [
    "Biaya total Rp18.000.000",
    "Rp18.000.000",
    "Biaya keberangkatan 25 juta",
    "Total biaya: IDR 30.000.000",
  ];

  for (const contoh of angkaTotalTanpaRincian) {
    it(`"${contoh}" SELALU sebagian, tidak pernah lulus`, () => {
      const hasil = kualitatif.ujiKualitatif(9, contoh);

      expect(hasil).toBe("sebagian");
      expect(hasil).not.toBe("lulus");
    });
  }

  it("baru lulus bila ada minimal satu komponen rincian", () => {
    expect(
      kualitatif.ujiKualitatif(
        9,
        "Total Rp18.000.000 — tiket pesawat Rp6.000.000, sisanya biaya pelatihan",
      ),
    ).toBe("lulus");
  });
});
