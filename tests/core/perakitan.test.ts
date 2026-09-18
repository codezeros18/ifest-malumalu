import { describe, expect, it } from "vitest";
import { isiTemplat, rakitIsiLembar } from "../../src/core/perakitan";
import { Keadaan } from "../../src/core/tipe";
import type { Penilaian } from "../../src/core/tipe";
import { SLOT_IDS } from "../../src/core/slot";
import type { SlotId } from "../../src/core/slot";
import { KodeGalat } from "../../src/core/galat";
import * as teks from "../../src/core/teks";

function semuaKeadaan(k: Keadaan): Record<SlotId, Keadaan> {
  const keadaan = {} as Record<SlotId, Keadaan>;
  for (const id of SLOT_IDS) {
    keadaan[id] = k;
  }
  return keadaan;
}

function semuaNilai(isi: string | null): Record<SlotId, string | null> {
  const nilai = {} as Record<SlotId, string | null>;
  for (const id of SLOT_IDS) {
    nilai[id] = isi;
  }
  return nilai;
}

function penilaianDari(keadaan: Record<SlotId, Keadaan>): Penilaian {
  const jumlahKosong = SLOT_IDS.filter(
    (id) => keadaan[id] === Keadaan.BELUM_DIJAWAB,
  ).length;
  return { keadaan, jumlahKosong };
}

function hitungKata(teksUtuh: string): number {
  return teksUtuh
    .trim()
    .split(/\s+/)
    .filter((kata) => kata.length > 0).length;
}

describe("S04-4 rakitIsiLembar — blok1 dan blok2", () => {
  it("slot BELUM_DIJAWAB masuk blok2 dengan kalimat dan dasar hukum dari sumbernya", () => {
    const hasil = rakitIsiLembar({
      penilaian: penilaianDari(semuaKeadaan(Keadaan.BELUM_DIJAWAB)),
      nilaiAsli: semuaNilai(null),
      tanggal: "18 September 2026",
    });

    expect(hasil.blok1).toHaveLength(0);
    expect(hasil.blok2).toHaveLength(10);
    expect(hasil.blok2.map((baris) => baris.slot)).toEqual(SLOT_IDS);

    for (const baris of hasil.blok2) {
      expect(baris.kalimat).toBe(teks.KALIMAT_KOSONG_PER_SLOT[baris.slot]);
      expect(baris.dasarHukum.length).toBeGreaterThan(0);
    }
  });

  it("slot DISEBUTKAN dan DISEBUTKAN_SEBAGIAN masuk blok1 dengan nilai asli tawaran", () => {
    const keadaan = semuaKeadaan(Keadaan.DISEBUTKAN);
    keadaan[9] = Keadaan.DISEBUTKAN_SEBAGIAN;

    const hasil = rakitIsiLembar({
      penilaian: penilaianDari(keadaan),
      nilaiAsli: semuaNilai("contoh nilai dari tawaran"),
      tanggal: "18 September 2026",
    });

    expect(hasil.blok2).toHaveLength(0);
    expect(hasil.blok1).toHaveLength(10);
    expect(hasil.blok1.map((baris) => baris.slot)).toEqual(SLOT_IDS);

    const barisSembilan = hasil.blok1.find((baris) => baris.slot === 9);
    expect(barisSembilan?.keadaan).toBe(Keadaan.DISEBUTKAN_SEBAGIAN);
    expect(barisSembilan?.nilai).toBe("contoh nilai dari tawaran");
  });

  it("urutan blok2 mengikuti nomor slot 1..10 apa pun hasilnya, tidak diurutkan ulang", () => {
    const keadaan = semuaKeadaan(Keadaan.DISEBUTKAN);
    keadaan[7] = Keadaan.BELUM_DIJAWAB;
    keadaan[2] = Keadaan.BELUM_DIJAWAB;

    const hasil = rakitIsiLembar({
      penilaian: penilaianDari(keadaan),
      nilaiAsli: semuaNilai("isi"),
      tanggal: "x",
    });

    expect(hasil.blok2.map((baris) => baris.slot)).toEqual([2, 7]);
  });

  it("hasilLapis1 dan catatanHitungan diteruskan apa adanya, tidak dihitung di sini (Lapis 1/2 = S09)", () => {
    const hasilLapis1 = {
      keluaran: "tidak-ditemukan" as const,
      kalimat: teks.LAPIS1_TIDAK_DITEMUKAN_TEMPLAT,
      tanggalSalinan: "17 September 2026",
    };

    const hasil = rakitIsiLembar({
      penilaian: penilaianDari(semuaKeadaan(Keadaan.DISEBUTKAN)),
      nilaiAsli: semuaNilai("isi"),
      tanggal: "x",
      hasilLapis1,
      catatanHitungan: "catatan contoh",
    });

    expect(hasil.hasilLapis1).toBe(hasilLapis1);
    expect(hasil.catatanHitungan).toBe("catatan contoh");
  });
});

describe("S04-5 pertanyaan — ketujuhnya selalu tampil, urutan tetap", () => {
  it("ketujuh pertanyaan tampil sama persis apa pun keadaan penilaiannya", () => {
    const hasilKosong = rakitIsiLembar({
      penilaian: penilaianDari(semuaKeadaan(Keadaan.BELUM_DIJAWAB)),
      nilaiAsli: semuaNilai(null),
      tanggal: "x",
    });
    const hasilPenuh = rakitIsiLembar({
      penilaian: penilaianDari(semuaKeadaan(Keadaan.DISEBUTKAN)),
      nilaiAsli: semuaNilai("isi"),
      tanggal: "x",
    });

    expect(hasilKosong.pertanyaan).toHaveLength(7);
    expect(hasilKosong.pertanyaan).toEqual(teks.PERTANYAAN);
    expect(hasilPenuh.pertanyaan).toEqual(teks.PERTANYAAN);
  });

  it("pertanyaan tidak difilter berdasarkan slot mana yang kosong", () => {
    const keadaan = semuaKeadaan(Keadaan.DISEBUTKAN);
    keadaan[1] = Keadaan.BELUM_DIJAWAB; // hanya slot 1 (perusahaan) kosong

    const hasil = rakitIsiLembar({
      penilaian: penilaianDari(keadaan),
      nilaiAsli: semuaNilai("isi"),
      tanggal: "x",
    });

    // Ketujuh pertanyaan tetap tampil meski hanya satu slot yang kosong.
    expect(hasil.pertanyaan).toHaveLength(7);
  });
});

describe("S04-6 batas 340 kata pada keluaran perakitan", () => {
  it("kasus terberat — blok2 penuh (10 kalimat tetap) + ketujuh pertanyaan — tidak melebihi 340 kata", () => {
    const hasil = rakitIsiLembar({
      penilaian: penilaianDari(semuaKeadaan(Keadaan.BELUM_DIJAWAB)),
      nilaiAsli: semuaNilai(null),
      tanggal: "18 September 2026",
    });

    const seluruhTeks = [
      ...hasil.blok1.map((baris) => `${baris.label} ${baris.nilai}`),
      ...hasil.blok2.map((baris) => baris.kalimat),
      ...hasil.pertanyaan,
    ].join(" ");

    expect(hitungKata(seluruhTeks)).toBeLessThanOrEqual(340);
  });
});

describe("S04-7 tidak ada persentase, skor, atau angka selain hitungan 'n dari 10'", () => {
  it("kalimat blok2 (F.3) tidak memuat digit maupun tanda %", () => {
    for (const kalimat of Object.values(teks.KALIMAT_KOSONG_PER_SLOT)) {
      expect(kalimat).not.toContain("%");
      expect(/\d/.test(kalimat)).toBe(false);
    }
  });

  it("ketujuh pertanyaan (F.4) tidak memuat digit maupun tanda %", () => {
    for (const pertanyaan of teks.PERTANYAAN) {
      expect(pertanyaan).not.toContain("%");
      expect(/\d/.test(pertanyaan)).toBe(false);
    }
  });

  it("IsiLembar tidak punya medan bernama persentase, skor, peringkat, atau tingkat risiko", () => {
    const hasil = rakitIsiLembar({
      penilaian: penilaianDari(semuaKeadaan(Keadaan.DISEBUTKAN)),
      nilaiAsli: semuaNilai("isi"),
      tanggal: "x",
    });

    const terlarang = /persen|persentase|skor|score|rating|peringkat|bintang|risiko/i;
    const medanTerlarang = Object.keys(hasil).filter((kunci) =>
      terlarang.test(kunci),
    );

    expect(medanTerlarang).toEqual([]);
  });
});

describe("S04-8 kondisi kosong dan kondisi penuh (BLUEPRINT F.10)", () => {
  it("teks F.10 tersalin persis di teks.ts", () => {
    expect(teks.SELURUH_KOSONG).toBe(
      "Tawaran ini belum menyebutkan satu pun dari sepuluh hal yang diwajibkan. Pertanyaan di bawah bisa Anda ajukan untuk melengkapinya.",
    );
    expect(teks.SELURUH_TERISI).toBe(
      "Tawaran ini menyebutkan kesepuluh hal yang diwajibkan. Anda tetap berhak meminta salinan perjanjiannya sebelum membayar.",
    );
  });

  it("kondisi seluruh kosong: blok1 kosong, blok2 berisi 10, jumlahKosong 10", () => {
    const hasil = rakitIsiLembar({
      penilaian: penilaianDari(semuaKeadaan(Keadaan.BELUM_DIJAWAB)),
      nilaiAsli: semuaNilai(null),
      tanggal: "x",
    });

    expect(hasil.blok1).toHaveLength(0);
    expect(hasil.blok2).toHaveLength(10);
  });

  it("kondisi seluruh terisi: blok2 kosong, blok1 berisi 10", () => {
    const hasil = rakitIsiLembar({
      penilaian: penilaianDari(semuaKeadaan(Keadaan.DISEBUTKAN)),
      nilaiAsli: semuaNilai("isi"),
      tanggal: "x",
    });

    expect(hasil.blok2).toHaveLength(0);
    expect(hasil.blok1).toHaveLength(10);
  });
});

describe("F.6 kalimat 'tidak ditemukan' memuat tiga bagian wajib (CLAUDE.md 3.1)", () => {
  it("memuat placeholder tanggal salinan, pernyataan bukan berarti tidak berizin, dan langkah memastikan", () => {
    const kalimat = teks.LAPIS1_TIDAK_DITEMUKAN_TEMPLAT;

    expect(kalimat).toContain("{tanggal salinan}");
    expect(kalimat).toContain("tidak berarti perusahaan tersebut tidak berizin");
    expect(kalimat).toContain("tanyakan nomor izinnya");
  });
});

describe("F.9 pesan galat mencakup seluruh tujuh kode", () => {
  it("PESAN_GALAT punya entri untuk setiap KodeGalat, tidak lebih tidak kurang", () => {
    const kodeYangAda = Object.keys(teks.PESAN_GALAT).sort();
    const kodeYangSeharusnya = Object.values(KodeGalat).sort();

    expect(kodeYangAda).toEqual(kodeYangSeharusnya);
  });
});

describe("isiTemplat", () => {
  it("mengganti placeholder literal pada templat teks dengan nilai sebenarnya", () => {
    expect(
      isiTemplat(teks.PENANDA_WAKTU_TEMPLAT, {
        tanggal: "18 September 2026",
        jam: "09.00",
      }),
    ).toBe("Dicatat pada: 18 September 2026, 09.00");

    expect(
      isiTemplat(teks.LAPIS1_TIDAK_DITEMUKAN_TEMPLAT, {
        "tanggal salinan": "17 September 2026",
      }),
    ).toContain("17 September 2026");

    expect(isiTemplat(teks.BARIS_HITUNGAN_LAPIS2_TEMPLAT, { n: "7" })).toBe(
      "Biaya yang diminta setara ± 7 bulan upah yang dijanjikan.",
    );
  });

  it("tidak mengubah templat bila kuncinya tidak ditemukan", () => {
    expect(isiTemplat("Halo {nama}", { lain: "x" })).toBe("Halo {nama}");
  });
});
