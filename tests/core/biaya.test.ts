import { describe, expect, it } from "vitest";
import { ekstrakAngkaRupiah, hitungCatatanBiaya } from "../../src/core/biaya";
import { ujiKualitatif } from "../../src/core/kualitatif";

/**
 * Regresi bug uang yang ditemukan lewat review adversarial (18 Sep 2026,
 * sesi ponytail). Dulu `ekstrakAngkaRupiah("Rp 15 juta")` mengembalikan 15
 * (bukan 15.000.000) karena cabang "Rp"/"IDR" berhenti di angka sebelum kata
 * pengali — lembar lalu mencetak "Biaya setara ± 0 bulan upah".
 */
describe("ekstrakAngkaRupiah — kata pengali juta/ribu", () => {
  it("menghargai kata pengali setelah Rp/IDR", () => {
    expect(ekstrakAngkaRupiah("Rp 15 juta")).toBe(15_000_000);
    expect(ekstrakAngkaRupiah("Rp15 juta")).toBe(15_000_000);
    expect(ekstrakAngkaRupiah("Rp 500 ribu")).toBe(500_000);
  });

  it("tetap benar untuk bentuk bertitik dan bentuk telanjang", () => {
    expect(ekstrakAngkaRupiah("Rp 5.000.000")).toBe(5_000_000);
    expect(ekstrakAngkaRupiah("Rp 1.234.567")).toBe(1_234_567);
    expect(ekstrakAngkaRupiah("15 juta rupiah")).toBe(15_000_000);
    expect(ekstrakAngkaRupiah("1,5 juta")).toBe(1_500_000);
  });

  it("menolak nol, negatif, dan teks tanpa angka", () => {
    expect(ekstrakAngkaRupiah("Rp 0")).toBeNull();
    expect(ekstrakAngkaRupiah("Rp -1.000.000")).toBeNull();
    expect(ekstrakAngkaRupiah("gaji menarik")).toBeNull();
  });
});

describe("hitungCatatanBiaya — rasio bulan upah tidak lagi 0", () => {
  const acuan = { tanggalAcuan: "x", komponen: [] };

  it("upah 'Rp 2.000.000' + biaya 'Rp 15 juta' → 7,5 bulan, bukan 0", () => {
    const hasil = hitungCatatanBiaya("Rp 2.000.000", "Rp 15 juta", acuan);
    expect(hasil.status).toBe("tersedia");
    if (hasil.status === "tersedia") {
      expect(hasil.catatanHitungan).toContain("± 7.5 bulan");
      expect(hasil.catatanHitungan).not.toContain("0 bulan");
    }
  });
});

describe("slot 9 — angka kembar bukan rincian", () => {
  it("angka yang sama dua kali tetap 'sebagian'", () => {
    expect(ujiKualitatif(9, "Rp 15 juta Rp 15 juta")).toBe("sebagian");
    expect(ujiKualitatif(9, "Total Rp15 juta, dibayar Rp15 juta")).toBe("sebagian");
  });

  it("angka berbeda tetap 'lulus'", () => {
    expect(ujiKualitatif(9, "Total Rp18.000.000 — tiket Rp6.000.000")).toBe("lulus");
  });
});
