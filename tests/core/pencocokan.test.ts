import { describe, expect, it } from "vitest";
import { cocokkanNamaP3MI } from "../../src/core/pencocokan";
import type { SalinanP3MI, StatusLapis1 } from "../../src/core/pencocokan";
import {
  LAPIS1_DITEMUKAN_TEMPLAT,
  LAPIS1_MIRIP_TEMPLAT,
  LAPIS1_TIDAK_DITEMUKAN_TEMPLAT,
} from "../../src/core/teks";

const TANGGAL_UJI = "17 September 2026";

const SALINAN_UJI: SalinanP3MI = {
  tanggalSalinan: TANGGAL_UJI,
  daftar: [
    { nama: "PT. AGESA ASA JAYA" },
    { nama: "PT. AJI AYAHBUNDA SEJATI" },
    { nama: "PT. KARYA BERSAMA SEJAHTERA" },
  ],
};

function harapkanAktif(status: StatusLapis1) {
  if (status.status !== "aktif") {
    throw new Error(`Diharapkan status "aktif", didapat "${status.status}"`);
  }
  return status.hasil;
}

describe("S09-2 pencocokan toleran salah ketik — tiga keluaran", () => {
  it("nama persis (setelah normalisasi badan usaha) → ditemukan", () => {
    const hasil = harapkanAktif(cocokkanNamaP3MI("Karya Bersama Sejahtera", SALINAN_UJI));
    expect(hasil.keluaran).toBe("ditemukan");
  });

  it("nama dengan salah ketik kecil (toleran) → mirip", () => {
    // "Agesa Ase Jaya" — satu huruf tertukar dari "Agesa Asa Jaya".
    const hasil = harapkanAktif(cocokkanNamaP3MI("Agesa Ase Jaya", SALINAN_UJI));
    expect(hasil.keluaran).toBe("mirip");
  });

  it("nama yang sama sekali berbeda → tidak-ditemukan", () => {
    const hasil = harapkanAktif(cocokkanNamaP3MI("Maju Mundur Sentosa Abadi", SALINAN_UJI));
    expect(hasil.keluaran).toBe("tidak-ditemukan");
  });

  it("penanda badan usaha (PT/CV) diabaikan saat membandingkan", () => {
    const hasil = harapkanAktif(cocokkanNamaP3MI("CV Karya Bersama Sejahtera", SALINAN_UJI));
    expect(hasil.keluaran).toBe("ditemukan");
  });
});

describe("S09-3 🔴 kalimat 'tidak ditemukan' wajib memuat tiga bagian sekaligus", () => {
  it("templat mentah di teks.ts memuat ketiga bagian", () => {
    expect(LAPIS1_TIDAK_DITEMUKAN_TEMPLAT).toContain("{tanggal salinan}");
    expect(LAPIS1_TIDAK_DITEMUKAN_TEMPLAT).toContain(
      "tidak berarti perusahaan tersebut tidak berizin",
    );
    expect(LAPIS1_TIDAK_DITEMUKAN_TEMPLAT.toLowerCase()).toMatch(/cara memastikan|periksa/);
  });

  it("kalimat yang benar-benar dirakit memuat ketiga bagian: tanggal, pernyataan, dan langkah", () => {
    const hasil = harapkanAktif(cocokkanNamaP3MI("Nama Tidak Dikenal Sama Sekali", SALINAN_UJI));
    expect(hasil.keluaran).toBe("tidak-ditemukan");

    expect(hasil.kalimat).toContain(TANGGAL_UJI);
    expect(hasil.kalimat).toContain("tidak berarti perusahaan tersebut tidak berizin");
    expect(hasil.kalimat.toLowerCase()).toMatch(/cara memastikan|periksa/);
  });

  it("DILARANG memakai kata 'tidak terdaftar' di kalimat pencocokan", () => {
    const hasil = harapkanAktif(cocokkanNamaP3MI("Nama Tidak Dikenal Sama Sekali", SALINAN_UJI));
    expect(hasil.kalimat.toLowerCase()).not.toContain("tidak terdaftar");
  });

  it("tanggalSalinan pada hasil sama dengan tanggal salinan yang diberikan", () => {
    const hasil = harapkanAktif(cocokkanNamaP3MI("Nama Tidak Dikenal Sama Sekali", SALINAN_UJI));
    expect(hasil.tanggalSalinan).toBe(TANGGAL_UJI);
  });
});

describe("kalimat 'ditemukan' dan 'mirip' terisi dari teks.ts, bukan dikarang", () => {
  it("kalimat ditemukan memuat tanggal salinan dan cocok dengan templat F.6", () => {
    const hasil = harapkanAktif(cocokkanNamaP3MI("Karya Bersama Sejahtera", SALINAN_UJI));
    const diharapkan = LAPIS1_DITEMUKAN_TEMPLAT.replace("{tanggal salinan}", TANGGAL_UJI);
    expect(hasil.kalimat).toBe(diharapkan);
  });

  it("kalimat mirip menyisipkan nama kandidat dan tanggal salinan", () => {
    const hasil = harapkanAktif(cocokkanNamaP3MI("Agesa Ase Jaya", SALINAN_UJI));
    const diharapkan = LAPIS1_MIRIP_TEMPLAT.replace("{nama}", "PT. AGESA ASA JAYA").replace(
      "{tanggal salinan}",
      TANGGAL_UJI,
    );
    expect(hasil.kalimat).toBe(diharapkan);
  });
});

describe("S09-4 penonaktifan Lapis 1 — salinan tidak tersedia", () => {
  it("salinan null → status 'dimatikan', bukan galat yang dilempar", () => {
    const status = cocokkanNamaP3MI("Perusahaan Apa Saja", null);
    expect(status.status).toBe("dimatikan");
  });

  it("status 'dimatikan' tidak membawa HasilLapis1 apa pun", () => {
    const status = cocokkanNamaP3MI("Perusahaan Apa Saja", null);
    expect(status).not.toHaveProperty("hasil");
  });
});

describe("tidak ada nama untuk dicocokkan", () => {
  it("nama null → status 'tidak-ada-nama', bukan 'tidak-ditemukan'", () => {
    const status = cocokkanNamaP3MI(null, SALINAN_UJI);
    expect(status.status).toBe("tidak-ada-nama");
  });

  it("nama string kosong/spasi → status 'tidak-ada-nama'", () => {
    expect(cocokkanNamaP3MI("   ", SALINAN_UJI).status).toBe("tidak-ada-nama");
    expect(cocokkanNamaP3MI("", SALINAN_UJI).status).toBe("tidak-ada-nama");
  });
});

describe("nol agregasi lintas pengguna (CLAUDE.md §3.5)", () => {
  it("cocokkanNamaP3MI tidak mengubah salinan yang diberikan (murni, tanpa efek samping)", () => {
    const salinanSalinan = JSON.parse(JSON.stringify(SALINAN_UJI)) as SalinanP3MI;
    cocokkanNamaP3MI("Karya Bersama Sejahtera", SALINAN_UJI);
    expect(SALINAN_UJI).toEqual(salinanSalinan);
  });
});
