import { describe, it, expect } from "vitest";
import { cariP3MI, DAFTAR_P3MI, TOTAL_P3MI } from "../../src/core/p3mi";

describe("Verifikasi Lapis 1 - Data Snapshot P3MI Resmi", () => {
  it("memiliki total 526 perusahaan terdaftar", () => {
    expect(DAFTAR_P3MI.length).toBe(TOTAL_P3MI);
    expect(TOTAL_P3MI).toBe(526);
  });

  it("menemukan perusahaan dengan nama persis", () => {
    const hasil = cariP3MI("PT. AGESA ASA JAYA");
    expect(hasil.keadaan).toBe("DITEMUKAN");
    expect(hasil.target?.nama).toBe("AGESA ASA JAYA");
    expect(hasil.target?.nomorIzin).toBe("9120307772741");
  });

  it("mendeteksi nama mirip dengan toleransi salah ketik atau variasi gelar PT", () => {
    const hasil = cariP3MI("Duta Wibawa Manda Putra");
    expect(["DITEMUKAN", "MIRIP"]).toContain(hasil.keadaan);
    expect(hasil.target?.nama).toContain("DUTA WIBAWA");
  });

  it("menyatakan TIDAK_DITEMUKAN bila nama perusahaan fiktif atau tidak terdaftar", () => {
    const hasil = cariP3MI("PT Penyalur Fiktif Tanpa Izin Internasional");
    expect(hasil.keadaan).toBe("TIDAK_DITEMUKAN");
    expect(hasil.target).toBeUndefined();
  });
});
