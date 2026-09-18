import { describe, expect, it } from "vitest";
import { ekstrakAngkaRupiah, hitungCatatanBiaya } from "../../src/core/biaya";
import type { AcuanBiaya, StatusLapis2 } from "../../src/core/biaya";
import { BARIS_HITUNGAN_LAPIS2_TEMPLAT } from "../../src/core/teks";
import { ujiKualitatif } from "../../src/core/kualitatif";

const TANGGAL_UJI = "17 September 2026";

const ACUAN_UJI: AcuanBiaya = {
  tanggalAcuan: TANGGAL_UJI,
  komponen: [{ nama: "Biaya penempatan" }],
};

function harapkanTersedia(status: StatusLapis2) {
  if (status.status !== "tersedia") {
    throw new Error(`Diharapkan status "tersedia", didapat "${status.status}"`);
  }
  return status.catatanHitungan;
}

describe("ekstrakAngkaRupiah — pengenalan format angka", () => {
  it("mengenali \"Rp5.000.000\"", () => {
    expect(ekstrakAngkaRupiah("Rp5.000.000")).toBe(5_000_000);
  });

  it("mengenali \"Rp 1.500.000\" (dengan spasi)", () => {
    expect(ekstrakAngkaRupiah("Rp 1.500.000")).toBe(1_500_000);
  });

  it("mengenali \"IDR 4.500.000\"", () => {
    expect(ekstrakAngkaRupiah("IDR 4.500.000")).toBe(4_500_000);
  });

  it("mengenali \"15 juta\" (tanpa Rp/IDR di depan)", () => {
    expect(ekstrakAngkaRupiah("biaya penempatan 15 juta")).toBe(15_000_000);
  });

  it("mengenali \"1,5 juta\" (koma sebagai desimal)", () => {
    expect(ekstrakAngkaRupiah("1,5 juta")).toBe(1_500_000);
  });

  it("mengenali singkatan poster nyata: jt / rb", () => {
    expect(ekstrakAngkaRupiah("Gaji 15jt")).toBe(15_000_000);
    expect(ekstrakAngkaRupiah("Gaji 15 jt")).toBe(15_000_000);
    expect(ekstrakAngkaRupiah("mulai 20 juta")).toBe(20_000_000);
    expect(ekstrakAngkaRupiah("Rp 500rb")).toBe(500_000);
  });

  it("tetap benar untuk bentuk bertitik dan bentuk telanjang", () => {
    expect(ekstrakAngkaRupiah("Rp 5.000.000")).toBe(5_000_000);
    expect(ekstrakAngkaRupiah("Rp 1.234.567")).toBe(1_234_567);
    expect(ekstrakAngkaRupiah("15 juta rupiah")).toBe(15_000_000);
  });

  it("angka ditulis dalam huruf (\"lima juta\") → null, bukan crash", () => {
    expect(ekstrakAngkaRupiah("gaji sekitar lima juta rupiah")).toBeNull();
  });

  it("teks tanpa angka sama sekali → null", () => {
    expect(ekstrakAngkaRupiah("belum disebutkan")).toBeNull();
  });

  it("teks kosong / null → null", () => {
    expect(ekstrakAngkaRupiah("")).toBeNull();
    expect(ekstrakAngkaRupiah(null)).toBeNull();
  });

  it("angka nol atau negatif tidak dianggap valid", () => {
    expect(ekstrakAngkaRupiah("Rp0")).toBeNull();
    expect(ekstrakAngkaRupiah("Rp -1.000.000")).toBeNull();
  });

  /**
   * Regresi bug uang yang ditemukan lewat review adversarial (18 Sep 2026,
   * sesi ponytail). Dulu `ekstrakAngkaRupiah("Rp 15 juta")` mengembalikan 15
   * (bukan 15.000.000) karena cabang "Rp"/"IDR" berhenti di angka sebelum
   * kata pengali — lembar lalu mencetak "Biaya setara ± 0 bulan upah".
   */
  it("menghargai kata pengali (\"juta\"/\"ribu\") SETELAH Rp/IDR, bukan cuma pada bentuk telanjang", () => {
    expect(ekstrakAngkaRupiah("Rp 15 juta")).toBe(15_000_000);
    expect(ekstrakAngkaRupiah("Rp15 juta")).toBe(15_000_000);
    expect(ekstrakAngkaRupiah("Rp 500 ribu")).toBe(500_000);
    expect(ekstrakAngkaRupiah("Rp 1.234.567")).toBe(1_234_567);
    expect(ekstrakAngkaRupiah("15 juta rupiah")).toBe(15_000_000);
  });
});

describe("hitungCatatanBiaya — urutan pemeriksaan dan hasil rasio", () => {
  it("acuan null → \"dimatikan\", MENANG lebih dulu meski kedua angka ada", () => {
    const status = hitungCatatanBiaya("Rp5.000.000", "Rp1.500.000", null);
    expect(status.status).toBe("dimatikan");
  });

  it("acuan tersedia tapi upah tidak disebutkan → \"data-kurang\"", () => {
    const status = hitungCatatanBiaya(null, "Rp1.500.000", ACUAN_UJI);
    expect(status.status).toBe("data-kurang");
  });

  it("acuan tersedia tapi biaya tidak disebutkan → \"data-kurang\"", () => {
    const status = hitungCatatanBiaya("Rp5.000.000", null, ACUAN_UJI);
    expect(status.status).toBe("data-kurang");
  });

  it("acuan tersedia tapi upah ditulis dalam huruf → \"data-kurang\", bukan crash", () => {
    const status = hitungCatatanBiaya("sekitar lima juta", "Rp2.000.000", ACUAN_UJI);
    expect(status.status).toBe("data-kurang");
  });

  it("kedua angka tersedia → \"tersedia\" dengan rasio biaya/upah yang benar", () => {
    // 1.500.000 / 5.000.000 = 0,3
    const kalimat = harapkanTersedia(
      hitungCatatanBiaya("Rp5.000.000", "Rp1.500.000", ACUAN_UJI),
    );
    expect(kalimat).toBe(
      BARIS_HITUNGAN_LAPIS2_TEMPLAT.replace("{n}", "0.3"),
    );
  });

  it("biaya lebih besar dari upah → rasio > 1 dihitung benar", () => {
    // 15.000.000 / 5.000.000 = 3
    const kalimat = harapkanTersedia(
      hitungCatatanBiaya("gaji 5 juta", "biaya 15 juta", ACUAN_UJI),
    );
    expect(kalimat).toBe(BARIS_HITUNGAN_LAPIS2_TEMPLAT.replace("{n}", "3"));
  });

  it("rasio dibulatkan satu angka desimal", () => {
    // 2.250.000 / 4.500.000 = 0,5 tepat
    const kalimat = harapkanTersedia(
      hitungCatatanBiaya("IDR 4.500.000", "Rp 2.250.000", ACUAN_UJI),
    );
    expect(kalimat).toBe(BARIS_HITUNGAN_LAPIS2_TEMPLAT.replace("{n}", "0.5"));
  });

  it("kalimat tidak pernah menyebut kata terlarang (netral, bukan penilaian)", () => {
    const kalimat = harapkanTersedia(
      hitungCatatanBiaya("Rp5.000.000", "Rp1.500.000", ACUAN_UJI),
    );
    expect(kalimat).not.toMatch(/mahal|wajar|risiko|waspada|bahaya/i);
  });

  it("upah 'Rp 2.000.000' + biaya 'Rp 15 juta' → 7,5 bulan, bukan 0 (regresi kata pengali)", () => {
    const kalimat = harapkanTersedia(
      hitungCatatanBiaya("Rp 2.000.000", "Rp 15 juta", ACUAN_UJI),
    );
    expect(kalimat).toContain("7.5 bulan");
    expect(kalimat).not.toContain("0 bulan");
  });
});

describe("slot 9 — angka kembar bukan rincian (ujiKualitatif, terkait erat dengan pembacaan Lapis 2)", () => {
  it("angka yang sama dua kali tetap 'sebagian'", () => {
    expect(ujiKualitatif(9, "Rp 15 juta Rp 15 juta")).toBe("sebagian");
    expect(ujiKualitatif(9, "Total Rp15 juta, dibayar Rp15 juta")).toBe("sebagian");
  });

  it("angka berbeda tetap 'lulus'", () => {
    expect(ujiKualitatif(9, "Total Rp18.000.000 — tiket Rp6.000.000")).toBe("lulus");
  });
});
