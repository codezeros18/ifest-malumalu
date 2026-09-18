import { describe, expect, it } from "vitest";
import {
  cocokanNamaPerusahaan,
  SNAPSHOT_BAWAAN,
} from "../../src/core/pencocokan";
import { hitungCatatanBiaya, ekstrakAngka } from "../../src/core/biaya";
import {
  LAPIS1_DITEMUKAN_TEMPLAT,
  LAPIS1_MIRIP_TEMPLAT,
  LAPIS1_TIDAK_DITEMUKAN_TEMPLAT,
  LAPIS1_DIMATIKAN,
  BARIS_HITUNGAN_LAPIS2_TEMPLAT,
  LAPIS2_ANGKA_TIDAK_ADA,
  LAPIS2_DIMATIKAN,
} from "../../src/core/teks";
import { TANGGAL_SNAPSHOT_P3MI } from "../../src/core/p3mi";
import { isiTemplat } from "../../src/core/perakitan";

describe("S09-2 Lapis 1 — Pencocokan toleran salah ketik (tiga keluaran)", () => {
  it("keluaran 'ditemukan' untuk nama yang persis sama atau hanya berbeda awalan gelar/kapitalisasi", () => {
    const hasil1 = cocokanNamaPerusahaan("PT. AGESA ASA JAYA");
    expect(hasil1.keluaran).toBe("ditemukan");
    expect(hasil1.kalimat).toBe(
      isiTemplat(LAPIS1_DITEMUKAN_TEMPLAT, { "tanggal salinan": TANGGAL_SNAPSHOT_P3MI }),
    );

    const hasil2 = cocokanNamaPerusahaan("agesa asa jaya");
    expect(hasil2.keluaran).toBe("ditemukan");

    const hasil3 = cocokanNamaPerusahaan("PT. AJI AYAHBUNDA SEJATI");
    expect(hasil3.keluaran).toBe("ditemukan");
    expect(hasil3.namaTarget).toContain("AJI AYAHBUNDA SEJATI");
  });

  it("keluaran 'mirip' untuk variasi salah ketik (typo) atau substring", () => {
    // 1. Salah ketik satu huruf (typo)
    const hasilTypo = cocokanNamaPerusahaan("PT AGESA ASA JAYO");
    expect(hasilTypo.keluaran).toBe("mirip");
    expect(hasilTypo.kalimat).toBe(
      isiTemplat(LAPIS1_MIRIP_TEMPLAT, {
        nama: "PT. AGESA ASA JAYA",
        "tanggal salinan": TANGGAL_SNAPSHOT_P3MI,
      }),
    );

    // 2. Substring atau nama sebagian
    const hasilSubstring = cocokanNamaPerusahaan("Agesa Asa");
    expect(hasilSubstring.keluaran).toBe("mirip");
    expect(hasilSubstring.namaTarget).toContain("AGESA ASA JAYA");

    // 3. Typo huruf hilang
    const hasilTypo2 = cocokanNamaPerusahaan("Aji Ayahbunda Sejat");
    expect(hasilTypo2.keluaran).toBe("mirip");
  });

  it("keluaran 'tidak-ditemukan' untuk nama perusahaan fiktif atau tidak terdaftar", () => {
    const hasilFiktif = cocokanNamaPerusahaan("PT Penyalur Fiktif Bodong Tanpa Izin");
    expect(hasilFiktif.keluaran).toBe("tidak-ditemukan");
    expect(hasilFiktif.kalimat).toBe(
      isiTemplat(LAPIS1_TIDAK_DITEMUKAN_TEMPLAT, {
        "tanggal salinan": TANGGAL_SNAPSHOT_P3MI,
      }),
    );

    const hasilKosong = cocokanNamaPerusahaan("");
    expect(hasilKosong.keluaran).toBe("tidak-ditemukan");

    const hasilSpasi = cocokanNamaPerusahaan("   ");
    expect(hasilSpasi.keluaran).toBe("tidak-ditemukan");

    const hasilNull = cocokanNamaPerusahaan(null);
    expect(hasilNull.keluaran).toBe("tidak-ditemukan");
  });
});

describe("S09-3 Kalimat 'tidak ditemukan' wajib memuat ketiga bagian sekaligus", () => {
  const hasil = cocokanNamaPerusahaan("PT Penyalur Fiktif Bodong Tanpa Izin");

  it("memuat bagian (1): tanggal salinan", () => {
    expect(hasil.kalimat).toContain(TANGGAL_SNAPSHOT_P3MI);
    expect(hasil.tanggalSalinan).toBe(TANGGAL_SNAPSHOT_P3MI);
  });

  it("memuat bagian (2): pernyataan bahwa ini TIDAK berarti perusahaan tersebut tidak berizin", () => {
    // 🔴 Kritis untuk verifikasi mutasi S09-8: test wajib merah bila frasa ini hilang
    expect(hasil.kalimat.toLowerCase()).toContain("tidak berarti");
    expect(hasil.kalimat.toLowerCase()).toContain("tidak berizin");
  });

  it("memuat bagian (3): langkah konkret untuk memastikan (kantor LTSA / tanyakan izin)", () => {
    expect(hasil.kalimat.toLowerCase()).toContain("cara memastikan");
    expect(hasil.kalimat.toLowerCase()).toContain("layanan terpadu satu atap");
  });

  it("gagal bila salah satu dari ketiga bagian tersebut hilang", () => {
    function verifikasiKetigaBagian(kalimat: string, tanggal: string): boolean {
      const bagian1 = kalimat.includes(tanggal);
      const bagian2 = kalimat.toLowerCase().includes("tidak berarti") &&
        kalimat.toLowerCase().includes("tidak berizin");
      const bagian3 = kalimat.toLowerCase().includes("layanan terpadu satu atap") &&
        kalimat.toLowerCase().includes("cara memastikan");
      return bagian1 && bagian2 && bagian3;
    }

    expect(verifikasiKetigaBagian(hasil.kalimat, TANGGAL_SNAPSHOT_P3MI)).toBe(true);

    // Buktikan assertion menggagalkan bila bagian (1) hilang
    const tanpaBagian1 = hasil.kalimat.replace(TANGGAL_SNAPSHOT_P3MI, "");
    expect(verifikasiKetigaBagian(tanpaBagian1, TANGGAL_SNAPSHOT_P3MI)).toBe(false);

    // Buktikan assertion menggagalkan bila bagian (2) hilang
    const tanpaBagian2 = hasil.kalimat.replace("tidak berarti perusahaan tersebut tidak berizin", "");
    expect(verifikasiKetigaBagian(tanpaBagian2, TANGGAL_SNAPSHOT_P3MI)).toBe(false);

    // Buktikan assertion menggagalkan bila bagian (3) hilang
    const tanpaBagian3 = hasil.kalimat.replace("kantor Layanan Terpadu Satu Atap", "");
    expect(verifikasiKetigaBagian(tanpaBagian3, TANGGAL_SNAPSHOT_P3MI)).toBe(false);
  });
});

describe("S09-4 Penonaktifan Lapis 1 (Degradasi anggun tanpa galat)", () => {
  it("mengembalikan LAPIS1_DIMATIKAN bila snapshot bernilai null", () => {
    expect(() => {
      const hasil = cocokanNamaPerusahaan("PT. AGESA ASA JAYA", null);
      expect(hasil.keluaran).toBe("dimatikan");
      expect(hasil.kalimat).toBe(LAPIS1_DIMATIKAN);
      expect(hasil.tanggalSalinan).toBe("");
    }).not.toThrow();
  });

  it("mengembalikan LAPIS1_DIMATIKAN bila snapshot bukan objek", () => {
    expect(() => {
      const hasil = cocokanNamaPerusahaan("PT. AGESA ASA JAYA", "string-bukan-objek");
      expect(hasil.keluaran).toBe("dimatikan");
      expect(hasil.kalimat).toBe(LAPIS1_DIMATIKAN);
    }).not.toThrow();

    expect(() => {
      const hasil = cocokanNamaPerusahaan("PT. AGESA ASA JAYA", 12345);
      expect(hasil.keluaran).toBe("dimatikan");
      expect(hasil.kalimat).toBe(LAPIS1_DIMATIKAN);
    }).not.toThrow();
  });

  it("mengembalikan LAPIS1_DIMATIKAN bila snapshot disetel aktif = false", () => {
    const hasil = cocokanNamaPerusahaan("PT. AGESA ASA JAYA", {
      ...SNAPSHOT_BAWAAN,
      aktif: false,
    });
    expect(hasil.keluaran).toBe("dimatikan");
    expect(hasil.kalimat).toBe(LAPIS1_DIMATIKAN);
  });

  it("mengembalikan LAPIS1_DIMATIKAN bila struktur snapshot rusak (tidak memiliki tanggal atau daftar)", () => {
    // Kosong tanpa field apa pun
    const hasilKosong = cocokanNamaPerusahaan("PT. AGESA ASA JAYA", {});
    expect(hasilKosong.keluaran).toBe("dimatikan");
    expect(hasilKosong.kalimat).toBe(LAPIS1_DIMATIKAN);

    // Memiliki tanggal tapi daftar perusahaan bukan array
    const hasilDaftarRusak = cocokanNamaPerusahaan("PT. AGESA ASA JAYA", {
      tanggalSalinan: "17 September 2026",
      perusahaan: "bukan-array",
    });
    expect(hasilDaftarRusak.keluaran).toBe("dimatikan");
    expect(hasilDaftarRusak.kalimat).toBe(LAPIS1_DIMATIKAN);

    // Memiliki perusahaan tapi tanggal kosong
    const hasilTanggalKosong = cocokanNamaPerusahaan("PT. AGESA ASA JAYA", {
      tanggalSalinan: "",
      perusahaan: [],
    });
    expect(hasilTanggalKosong.keluaran).toBe("dimatikan");
    expect(hasilTanggalKosong.kalimat).toBe(LAPIS1_DIMATIKAN);
  });
});

describe("S09-6 Lapis 2 — Baris Catatan Hitungan Biaya", () => {
  it("menghitung rasio perbandingan bila upah dan biaya keduanya tersedia", () => {
    // Biaya 15 juta, upah 5 juta -> 3 bulan upah
    const catatan1 = hitungCatatanBiaya("5000000", "15000000");
    expect(catatan1).toBe(
      isiTemplat(BARIS_HITUNGAN_LAPIS2_TEMPLAT, { n: "3" }),
    );

    // Format dengan Rp dan titik
    const catatan2 = hitungCatatanBiaya("Rp 6.000.000", "Rp 12.000.000");
    expect(catatan2).toBe("Biaya yang diminta setara ± 2 bulan upah yang dijanjikan.");

    // Format 'juta' / 'jt'
    const catatan3 = hitungCatatanBiaya("7 juta", "28 jt");
    expect(catatan3).toBe("Biaya yang diminta setara ± 4 bulan upah yang dijanjikan.");

    // Format numerik langsung
    const catatan4 = hitungCatatanBiaya(4_000_000, 20_000_000);
    expect(catatan4).toBe("Biaya yang diminta setara ± 5 bulan upah yang dijanjikan.");
  });

  it("mengembalikan LAPIS2_ANGKA_TIDAK_ADA bila salah satu atau kedua angka tidak ada", () => {
    // Upah ada, biaya tidak ada
    expect(hitungCatatanBiaya("5.000.000", null)).toBe(LAPIS2_ANGKA_TIDAK_ADA);
    expect(hitungCatatanBiaya("5.000.000", "")).toBe(LAPIS2_ANGKA_TIDAK_ADA);
    expect(hitungCatatanBiaya("5.000.000", undefined)).toBe(LAPIS2_ANGKA_TIDAK_ADA);

    // Upah tidak ada, biaya ada
    expect(hitungCatatanBiaya(null, "15.000.000")).toBe(LAPIS2_ANGKA_TIDAK_ADA);
    expect(hitungCatatanBiaya("", "15.000.000")).toBe(LAPIS2_ANGKA_TIDAK_ADA);
    expect(hitungCatatanBiaya(undefined, "15.000.000")).toBe(LAPIS2_ANGKA_TIDAK_ADA);

    // Keduanya tidak ada
    expect(hitungCatatanBiaya(null, null)).toBe(LAPIS2_ANGKA_TIDAK_ADA);
    expect(hitungCatatanBiaya("", "")).toBe(LAPIS2_ANGKA_TIDAK_ADA);

    // Upah bernilai 0 (menghindari pembagian dengan nol)
    expect(hitungCatatanBiaya("0", "15.000.000")).toBe(LAPIS2_ANGKA_TIDAK_ADA);
  });

  it("mengembalikan LAPIS2_DIMATIKAN bila Lapis 2 dimatikan atau acuan rusak/null", () => {
    // opsi null
    expect(hitungCatatanBiaya("5.000.000", "15.000.000", null)).toBe(LAPIS2_DIMATIKAN);

    // opsi aktif = false
    expect(hitungCatatanBiaya("5.000.000", "15.000.000", { aktif: false })).toBe(LAPIS2_DIMATIKAN);

    // acuan dinyatakan rusak/null
    expect(hitungCatatanBiaya("5.000.000", "15.000.000", { acuan: null })).toBe(LAPIS2_DIMATIKAN);
  });

  it("ekstrakAngka membaca berbagai variasi format angka dengan benar", () => {
    expect(ekstrakAngka("Rp 5.000.000")).toBe(5000000);
    expect(ekstrakAngka("5,000,000")).toBe(5000000);
    expect(ekstrakAngka("10.5 juta")).toBe(10500000);
    expect(ekstrakAngka("3 jt")).toBe(3000000);
    expect(ekstrakAngka(7500000)).toBe(7500000);
    expect(ekstrakAngka("tidak ada angka")).toBeNull();
    expect(ekstrakAngka(null)).toBeNull();
    expect(ekstrakAngka(undefined)).toBeNull();
  });
});
