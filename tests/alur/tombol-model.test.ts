import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { manualProvider, pilihPembaca } from "../../src/vision";
import type { Pembaca } from "../../src/vision";

/**
 * S12-1 — tombol peragaan "matikan pembacaan gambar".
 *
 * Bukti tingkat unit. Bukti tingkat alur (nol permintaan ke `/api/baca`
 * saat tombol ditekan) dijalankan di peramban sungguhan terhadap tautan
 * penggelaran — lihat PROGRESS.md [S12-W1].
 */

const penyediaModelPalsu: Pembaca = {
  async baca() {
    throw new Error("penyedia model TIDAK boleh dipanggil saat model dimatikan");
  },
};

describe("S12-1 modelDimatikan memaksa manualProvider", () => {
  it("mengalahkan kunci API yang ada dan penyediaModel yang disuntikkan", () => {
    const pembaca = pilihPembaca("gambar", {
      modelDimatikan: true,
      kunciApiModel: "kunci-yang-sah",
      penyediaModel: penyediaModelPalsu,
    });
    expect(pembaca).toBe(manualProvider);
  });

  it("tanpa modelDimatikan, jalur gambar dengan kunci tetap memakai penyedia model", () => {
    const pembaca = pilihPembaca("gambar", {
      kunciApiModel: "kunci-yang-sah",
      penyediaModel: penyediaModelPalsu,
    });
    expect(pembaca).toBe(penyediaModelPalsu);
  });

  it("jalur yang dipaksa manual tetap menghasilkan HasilBaca lengkap, tanpa jaringan", async () => {
    const pembaca = pilihPembaca("gambar", { modelDimatikan: true });
    const hasil = await pembaca.baca({ sumber: "gambar", berkas: new Blob(["x"]) });
    expect(Object.keys(hasil.nilai)).toHaveLength(10);
    expect(Object.values(hasil.keyakinan).every((angka) => angka === 0)).toBe(true);
  });
});

describe("S12-1 halaman utama tidak mengirim ke /api/baca saat model dimatikan", () => {
  const isi = readFileSync(join(process.cwd(), "src", "app", "page.tsx"), "utf8");

  it("cabang modelDimatikan kembali SEBELUM baris fetch('/api/baca') di bacaGambarSementara", () => {
    const awalFungsi = isi.indexOf("async function bacaGambarSementara");
    const cabangMati = isi.indexOf("if (modelDimatikan)", awalFungsi);
    const barisFetch = isi.indexOf('fetch("/api/baca"', awalFungsi);

    expect(awalFungsi).toBeGreaterThan(-1);
    expect(cabangMati).toBeGreaterThan(awalFungsi);
    expect(barisFetch).toBeGreaterThan(cabangMati);
  });
});
