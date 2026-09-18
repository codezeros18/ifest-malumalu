import { describe, expect, it } from "vitest";
import { ekstrakAngkaRupiah, hitungCatatanBiaya } from "../../src/core/biaya";
import type { AcuanBiaya, StatusLapis2 } from "../../src/core/biaya";
import { BARIS_HITUNGAN_LAPIS2_TEMPLAT } from "../../src/core/teks";

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

  it("mengenali \"15 juta\"", () => {
    expect(ekstrakAngkaRupiah("biaya penempatan 15 juta")).toBe(15_000_000);
  });

  it("mengenali \"1,5 juta\" (koma sebagai desimal)", () => {
    expect(ekstrakAngkaRupiah("1,5 juta")).toBe(1_500_000);
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
});
