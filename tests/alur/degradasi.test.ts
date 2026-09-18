import { describe, expect, it } from "vitest";
import { manualProvider } from "../../src/vision/manualProvider";
import { nilai } from "../../src/core/penilaian";
import { rakitIsiLembar } from "../../src/core/perakitan";
import { cocokanNamaPerusahaan } from "../../src/core/pencocokan";
import { hitungCatatanBiaya } from "../../src/core/biaya";
import {
  muatSnapshotP3MIDariBerkas,
  muatSnapshotBiayaDariBerkas,
} from "../../src/lib/dataSnapshot";
import {
  LAPIS1_DIMATIKAN,
  LAPIS2_DIMATIKAN,
  PENUTUP_LEMBAR,
} from "../../src/core/teks";
import { elemenLembar, tinggiLembar } from "../../src/lib/renderLembar";
import type { HasilBacaFinal, Tawaran } from "../../src/core/tipe";
import { join } from "node:path";

/**
 * 🔴 S09-9 — Test degradasi anggun:
 * Menghapus/menonaktifkan kedua berkas data (Lapis 1 & Lapis 2),
 * menjalankan seluruh alur ujung ke ujung, dan membuktikan:
 * LEMBAR TETAP TERBIT DENGAN SUKSES.
 *
 * Arsitektur tiga lapis menjamin Lapis 1 dan Lapis 2 boleh mati sepenuhnya
 * tanpa menghentikan atau menggagalkan penerbitan lembar (BLUEPRINT G.5).
 */
describe("S09-9 Alur degradasi ketika kedua berkas data tidak ada atau dimatikan", () => {
  it("pemuat berkas mengembalikan null secara aman bila berkas data tidak ada atau rusak", () => {
    const jalurPalsu1 = join(process.cwd(), "data", "p3mi-snapshot-hilang.json");
    const jalurPalsu2 = join(process.cwd(), "data", "komponen-biaya-hilang.json");

    expect(muatSnapshotP3MIDariBerkas(jalurPalsu1)).toBeNull();
    expect(muatSnapshotBiayaDariBerkas(jalurPalsu2)).toBeNull();
  });

  it("seluruh alur ujung ke ujung berhasil menerbitkan lembar saat kedua data null/dimatikan", async () => {
    // 1. Jalur masukan manual
    const tawaran: Tawaran = {
      sumber: "manual",
      teks: JSON.stringify({
        1: "PT Karya Bersama Sejahtera",
        2: "SIP2MI 12345/2026",
        5: "Rp 6.000.000 per bulan",
        9: "Biaya Rp 18.000.000",
      }),
    };

    const hasilBaca = await manualProvider.baca(tawaran);
    const hasilFinal: HasilBacaFinal = {
      nilai: hasilBaca.nilai,
      ditandaiTidakTahu: [],
    };

    // 2. Penilaian (Lapis 0)
    const hasilPenilaian = nilai(hasilFinal, hasilBaca.keyakinan);

    // 3. Simulasi kedua berkas data hilang / tidak tersedia (null)
    const snapshotP3MI = muatSnapshotP3MIDariBerkas(
      join(process.cwd(), "data", "tidak-ada-p3mi.json"),
    );
    const snapshotBiaya = muatSnapshotBiayaDariBerkas(
      join(process.cwd(), "data", "tidak-ada-biaya.json"),
    );

    expect(snapshotP3MI).toBeNull();
    expect(snapshotBiaya).toBeNull();

    // 4. Lapis 1 & Lapis 2 dieksekusi dengan snapshot null
    const hasilLapis1 = cocokanNamaPerusahaan(hasilFinal.nilai[1], snapshotP3MI);
    const catatanHitungan = hitungCatatanBiaya(
      hasilFinal.nilai[5],
      hasilFinal.nilai[9],
      { acuan: snapshotBiaya },
    );

    expect(hasilLapis1.keluaran).toBe("dimatikan");
    expect(hasilLapis1.kalimat).toBe(LAPIS1_DIMATIKAN);
    expect(catatanHitungan).toBe(LAPIS2_DIMATIKAN);

    // 5. Perakit lembar dipanggil untuk menerbitkan lembar
    const tanggalLembar = "Dicatat pada: 18 September 2026, 12.00";
    const isiLembar = rakitIsiLembar({
      penilaian: hasilPenilaian,
      nilaiAsli: hasilFinal.nilai,
      tanggal: tanggalLembar,
      hasilLapis1,
      catatanHitungan,
    });

    // 6. Verifikasi lembar tetap terbit dengan seluruh komponen wajib
    // a. Blok 1 dan Blok 2 berjumlah tepat 10
    expect(isiLembar.blok1.length + isiLembar.blok2.length).toBe(10);
    expect(isiLembar.blok1.length).toBeGreaterThan(0);
    expect(isiLembar.blok2.length).toBeGreaterThan(0);

    // b. Blok 3 memuat tepat 7 pertanyaan
    expect(isiLembar.pertanyaan).toHaveLength(7);

    // c. Lapis 1 dan Lapis 2 menyertakan teks degradasi yang sopan
    expect(isiLembar.hasilLapis1?.kalimat).toBe(LAPIS1_DIMATIKAN);
    expect(isiLembar.catatanHitungan).toBe(LAPIS2_DIMATIKAN);

    // d. Render elemen lembar tidak melempar galat
    const elemen = elemenLembar(isiLembar);
    expect(elemen).toBeDefined();

    // e. Tinggi lembar terhitung dengan baik
    const tinggi = tinggiLembar(isiLembar);
    expect(tinggi).toBeGreaterThan(1080);
  });

  it("lembar tetap terbit ketika dinonaktifkan secara eksplisit via opsi aktif=false", async () => {
    const hasilFinal: HasilBacaFinal = {
      nilai: {
        1: "PT AGESA ASA JAYA",
        2: null,
        3: null,
        4: null,
        5: "5000000",
        6: null,
        7: null,
        8: null,
        9: "15000000",
        10: null,
      },
      ditandaiTidakTahu: [],
    };
    const keyakinan = {
      1: 1, 2: 0, 3: 0, 4: 0, 5: 1, 6: 0, 7: 0, 8: 0, 9: 1, 10: 0,
    };

    const hasilPenilaian = nilai(hasilFinal, keyakinan);

    // Setel eksplisit aktif: false
    const hasilLapis1 = cocokanNamaPerusahaan(hasilFinal.nilai[1], {
      aktif: false,
    });
    const catatanHitungan = hitungCatatanBiaya(
      hasilFinal.nilai[5],
      hasilFinal.nilai[9],
      { aktif: false },
    );

    expect(hasilLapis1.kalimat).toBe(LAPIS1_DIMATIKAN);
    expect(catatanHitungan).toBe(LAPIS2_DIMATIKAN);

    const isiLembar = rakitIsiLembar({
      penilaian: hasilPenilaian,
      nilaiAsli: hasilFinal.nilai,
      tanggal: "Dicatat pada: 18 September 2026, 12.00",
      hasilLapis1,
      catatanHitungan,
    });

    expect(isiLembar.blok1.length).toBeGreaterThan(0);
    expect(isiLembar.blok2.length).toBeGreaterThan(0);
    expect(isiLembar.pertanyaan).toHaveLength(7);

    // Buktikan penutup lembar wajib tetap hadir pada hasil render
    const elemen = elemenLembar(isiLembar);
    const teksTree = JSON.stringify(elemen);
    expect(teksTree).toContain(PENUTUP_LEMBAR);
  });
});
