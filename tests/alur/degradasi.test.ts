import { describe, expect, it } from "vitest";
import { Keadaan } from "../../src/core/tipe";
import type { HasilBacaFinal } from "../../src/core/tipe";
import { SLOT_IDS } from "../../src/core/slot";
import type { SlotId } from "../../src/core/slot";
import { nilai as nilaiPenilaian } from "../../src/core/penilaian";
import { rakitIsiLembar } from "../../src/core/perakitan";
import { cocokkanNamaP3MI } from "../../src/core/pencocokan";
import { hitungCatatanBiaya } from "../../src/core/biaya";

/**
 * 🔴 S09-9 — Test degradasi. Membuktikan klaim BLUEPRINT G.5: "Bila Lapis 1
 * atau 2 tidak tersedia, kalimat pengganti ditampilkan, dan lembarnya tetap
 * terbit."
 *
 * "Hapus kedua berkas data" DISIMULASIKAN lewat argumen `null`, BUKAN
 * lewat `fs.unlinkSync` yang sungguhan menghapus
 * `data/p3mi-snapshot.json` / `data/komponen-biaya.json` dari disk. Dua
 * alasan, keduanya disengaja, bukan jalan pintas:
 *
 * 1. `src/core` (tempat `cocokkanNamaP3MI` dan `hitungCatatanBiaya` hidup)
 *    DILARANG menyentuh berkas sama sekali (CLAUDE.md §3.4). Pembacaan
 *    berkas yang sungguhan hanya terjadi SATU tempat di seluruh app:
 *    `muatSalinanP3MI`/`muatAcuanBiaya` di `src/app/periksa/page.tsx`,
 *    lewat `import()` dinamis yang dibungkus `try/catch` — keduanya thin
 *    wrapper yang jelas benar (coba muat, tangkap galat, kembalikan
 *    `null`), bukan tempat logika menarik berada. Yang menarik dan wajib
 *    diuji ketat adalah: APA YANG TERJADI ketika lapisan menerima `null`
 *    — dan itu persis yang test ini periksa, langsung di sumbernya.
 * 2. Direktori kerja ini dipakai BERSAMA oleh tiga window Claude Code
 *    paralel (lihat TASKS.md §Tabel jalur). Menghapus berkas sungguhan
 *    dari disk selama test berjalan — walau sebentar — berisiko
 *    mengganggu window lain yang mungkin sedang membaca berkas yang sama.
 *    Simulasi lewat parameter `null` mencapai jaminan yang identik tanpa
 *    risiko itu.
 */

function nilaiLulusSemua(): Record<SlotId, string | null> {
  return {
    1: "PT Karya Bersama Sejahtera",
    2: "SIP2MI nomor 1234/SIP/2026, negara tujuan Taiwan",
    3: "Hanwha Techwin Co., Ltd.",
    4: "Operator mesin injeksi plastik",
    5: "Rp9.500.000 per bulan, ditransfer ke rekening bank setiap tanggal 5",
    6: "8 jam per hari, libur setiap hari Minggu",
    7: "3 tahun",
    8: "BPJS Ketenagakerjaan dan asuransi kesehatan Taiwan (NHI)",
    9: "Total Rp18.000.000 — tiket pesawat Rp6.000.000, pelatihan Rp4.000.000",
    10: "Salinan perjanjian kerja diserahkan saat penandatanganan, sebelum keberangkatan",
  };
}

function keyakinanPenuh(): Record<SlotId, number> {
  return { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 1 };
}

describe("S09-9 🔴 degradasi: kedua berkas data tidak tersedia, lembar tetap terbit", () => {
  it("alur ujung ke ujung selesai tanpa melempar galat apa pun", () => {
    const nilaiSlot = nilaiLulusSemua();
    const masukan: HasilBacaFinal = { nilai: nilaiSlot, ditandaiTidakTahu: [] };

    expect(() => {
      const penilaian = nilaiPenilaian(masukan, keyakinanPenuh());
      const statusLapis1 = cocokkanNamaP3MI(nilaiSlot[1], null);
      const statusLapis2 = hitungCatatanBiaya(nilaiSlot[5], nilaiSlot[9], null);

      rakitIsiLembar({
        penilaian,
        nilaiAsli: nilaiSlot,
        tanggal: "Dicatat pada: 18 September 2026, 10:00",
        hasilLapis1: statusLapis1.status === "aktif" ? statusLapis1.hasil : undefined,
        catatanHitungan:
          statusLapis2.status === "tersedia" ? statusLapis2.catatanHitungan : undefined,
      });
    }).not.toThrow();
  });

  it("IsiLembar yang dihasilkan lengkap dan sah — lembar 'terbit'", () => {
    const nilaiSlot = nilaiLulusSemua();
    const masukan: HasilBacaFinal = { nilai: nilaiSlot, ditandaiTidakTahu: [] };
    const penilaian = nilaiPenilaian(masukan, keyakinanPenuh());

    const statusLapis1 = cocokkanNamaP3MI(nilaiSlot[1], null);
    const statusLapis2 = hitungCatatanBiaya(nilaiSlot[5], nilaiSlot[9], null);

    const isiLembar = rakitIsiLembar({
      penilaian,
      nilaiAsli: nilaiSlot,
      tanggal: "Dicatat pada: 18 September 2026, 10:00",
      hasilLapis1: statusLapis1.status === "aktif" ? statusLapis1.hasil : undefined,
      catatanHitungan:
        statusLapis2.status === "tersedia" ? statusLapis2.catatanHitungan : undefined,
    });

    // Lapis 0 tidak bergantung data eksternal — tetap penuh, apa pun
    // keadaan Lapis 1/2.
    expect(isiLembar.blok1.length + isiLembar.blok2.length).toBe(10);
    expect(isiLembar.pertanyaan.length).toBeGreaterThan(0);
    expect(isiLembar.tanggal).toBeTruthy();

    // Lapis 1 dan 2 mati bersih — undefined, BUKAN nilai palsu/kosong-string
    // yang bisa disalahartikan sebagai hasil sungguhan.
    expect(isiLembar.hasilLapis1).toBeUndefined();
    expect(isiLembar.catatanHitungan).toBeUndefined();
  });

  it("kedua lapis benar-benar melaporkan 'dimatikan', bukan 'tidak ditemukan'/'data-kurang'", () => {
    const statusLapis1 = cocokkanNamaP3MI("PT Karya Bersama Sejahtera", null);
    const statusLapis2 = hitungCatatanBiaya("Rp9.500.000", "Rp18.000.000", null);

    // 🔴 Ini pembeda pentingnya: berkas yang tidak ada BUKAN kesimpulan
    // "tidak ditemukan dalam salinan" — itu klaim yang berbeda dan lebih
    // kuat daripada yang bisa dibuktikan saat lapisnya sendiri tidak
    // berjalan. Mencampur keduanya melanggar CLAUDE.md §3.1.
    expect(statusLapis1.status).toBe("dimatikan");
    expect(statusLapis2.status).toBe("dimatikan");
  });

  it("penilaian Lapis 0 pada kasus seluruhnya kosong pun tetap menghasilkan lembar", () => {
    const semuaKosong = {} as Record<SlotId, string | null>;
    for (const id of SLOT_IDS) {
      semuaKosong[id] = null;
    }
    const masukan: HasilBacaFinal = { nilai: semuaKosong, ditandaiTidakTahu: [] };
    const keyakinanNol = {} as Record<SlotId, number>;
    for (const id of SLOT_IDS) {
      keyakinanNol[id] = 0;
    }

    const penilaian = nilaiPenilaian(masukan, keyakinanNol);
    const statusLapis1 = cocokkanNamaP3MI(semuaKosong[1], null);
    const statusLapis2 = hitungCatatanBiaya(semuaKosong[5], semuaKosong[9], null);

    const isiLembar = rakitIsiLembar({
      penilaian,
      nilaiAsli: semuaKosong,
      tanggal: "Dicatat pada: 18 September 2026, 10:00",
      hasilLapis1: statusLapis1.status === "aktif" ? statusLapis1.hasil : undefined,
      catatanHitungan:
        statusLapis2.status === "tersedia" ? statusLapis2.catatanHitungan : undefined,
    });

    expect(isiLembar.blok2.length).toBe(10);
    expect(penilaian.jumlahKosong).toBe(10);
    for (const id of SLOT_IDS) {
      expect(penilaian.keadaan[id]).toBe(Keadaan.BELUM_DIJAWAB);
    }
  });
});
