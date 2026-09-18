import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { isValidElement } from "react";
import { describe, expect, it } from "vitest";
import { SLOT_IDS, slotDenganId } from "../../src/core/slot";
import { NAMA_SLOT_JAWA, SATUAN_KATA_JAWA } from "../../src/core/teksJawa";
import { SATUAN_KATA } from "../../src/core/teks";
import { KAMUS_LEMBAR } from "../../src/core/teks";
import { KAMUS_LEMBAR_JAWA, kamusLembarUntuk } from "../../src/core/teksJawa";
import { Keadaan } from "../../src/core/tipe";
import type { IsiLembar } from "../../src/core/tipe";
import { rakitIsiLembar } from "../../src/core/perakitan";
import { cocokkanNamaP3MI } from "../../src/core/pencocokan";
import { hitungCatatanBiaya } from "../../src/core/biaya";
import type { KamusLembar } from "../../src/core/teks";
import { elemenLembar } from "../../src/lib/renderLembar";

/**
 * Dipicu bug sungguhan: di `/periksa`, mengganti bahasa ke Jawa mengubah
 * judul, keterangan, contoh isian, label "tidak tahu", dan tombol — TETAPI
 * kesepuluh label keterangannya tetap Indonesia, karena labelnya diambil
 * langsung dari `slotDenganId(id).nama` (`src/core/slot.ts`, data Indonesia)
 * tanpa cabang bahasa.
 *
 * Dua hal yang mudah rusak diam-diam karena itu dikunci di sini:
 *   1. Kamus Jawanya benar-benar lengkap dan benar-benar diterjemahkan —
 *      bukan salinan nama Indonesia yang tampak "sudah ada kamusnya".
 *   2. Berkas halamannya benar-benar MEMAKAI kamus itu. Kamus yang lengkap
 *      tapi tidak tersambung adalah persis bug yang dilaporkan.
 */

const JALUR_PERIKSA = join(process.cwd(), "src", "app", "periksa", "page.tsx");

describe("kamus label keterangan bahasa Jawa", () => {
  it("lengkap sepuluh keterangan", () => {
    expect(Object.keys(NAMA_SLOT_JAWA).map(Number).sort((a, b) => a - b)).toEqual([
      ...SLOT_IDS,
    ]);
  });

  it("setiap label benar-benar berbeda dari nama Indonesia — bukan salinan", () => {
    const belumDiterjemahkan = SLOT_IDS.filter(
      (id) => NAMA_SLOT_JAWA[id].trim() === slotDenganId(id).nama.trim(),
    );
    expect(
      belumDiterjemahkan,
      `label Jawa masih sama dengan nama Indonesia untuk keterangan: ${belumDiterjemahkan.join(", ")}`,
    ).toEqual([]);
  });

  it("tidak ada label yang kosong", () => {
    const kosong = SLOT_IDS.filter((id) => NAMA_SLOT_JAWA[id].trim().length === 0);
    expect(kosong).toEqual([]);
  });
});

describe("layar koreksi menyambungkan kamus Jawa ke labelnya", () => {
  const isi = readFileSync(JALUR_PERIKSA, "utf8");

  it("label tidak lagi diambil langsung dari slot.ts tanpa cabang bahasa", () => {
    expect(isi).not.toMatch(/label=\{slotDenganId\(id\)\.nama\}/);
  });

  it("label memakai NAMA_SLOT_JAWA", () => {
    expect(isi).toMatch(/NAMA_SLOT_JAWA\[id\]/);
  });

  it("satuan hitungan kata juga punya pasangan Jawa dan dipakai halaman itu", () => {
    expect(SATUAN_KATA_JAWA).not.toBe(SATUAN_KATA);
    expect(isi).toMatch(/SATUAN_KATA_JAWA/);
  });
});

// ---------------------------------------------------------------------------
// Lembar (gambar yang diterbitkan) dalam Basa Jawa
//
// Lembar dirakit `rakitIsiLembar` dan dirender `src/lib/renderLembar.tsx`
// (dipakai `/api/kartu`). Kamusnya `KAMUS_LEMBAR` / `KAMUS_LEMBAR_JAWA`,
// dipilih `kamusLembarUntuk(bahasa)`. Yang dikunci di sini adalah kelas bug
// yang sama dengan label /periksa: satu bagian lembar yang lupa diterjemahkan
// akan tampil sebagai lembar campur bahasa — dan lembar itulah artefak yang
// diteruskan ke percakapan.
// ---------------------------------------------------------------------------

/** Nama produk ("LEMBAR JANJI") memang tidak diterjemahkan. */
const KUNCI_TAK_DITERJEMAHKAN = new Set<string>(["judul"]);

describe("kamus lembar Basa Jawa", () => {
  it("kuncinya sama persis dengan kamus Indonesia — tidak ada bagian yang lupa", () => {
    expect(Object.keys(KAMUS_LEMBAR_JAWA).sort()).toEqual(
      Object.keys(KAMUS_LEMBAR).sort(),
    );
  });

  it("tidak ada nilai yang masih sama dengan versi Indonesia (kecuali nama produk)", () => {
    const masihIndonesia = Object.entries(KAMUS_LEMBAR)
      .filter(([kunci, nilai]) => {
        if (KUNCI_TAK_DITERJEMAHKAN.has(kunci)) return false;
        if (typeof nilai !== "string") return false;
        return KAMUS_LEMBAR_JAWA[kunci as keyof KamusLembar] === nilai;
      })
      .map(([kunci]) => kunci);
    expect(masihIndonesia, `kunci yang belum diterjemahkan: ${masihIndonesia.join(", ")}`).toEqual([]);
  });

  it("tidak ada teks yang kosong, termasuk kalimat per keterangan dan nama keterangan", () => {
    const kamus = KAMUS_LEMBAR_JAWA;
    const semuaTeks: string[] = [
      kamus.judul,
      kamus.subjudul,
      kamus.labelBlok1,
      kamus.labelBlok2Templat,
      kamus.labelBlok3,
      kamus.labelCatatanHitungan,
      kamus.labelSebagian,
      kamus.kalimatPembukaBlok1,
      kamus.kalimatPembukaBlok2,
      kamus.kalimatPembukaBlok3,
      kamus.kalimatBawahBlok2,
      kamus.penutup,
      kamus.lapis1DitemukanTemplat,
      kamus.lapis1MiripTemplat,
      kamus.lapis1TidakDitemukanTemplat,
      kamus.lapis1Dimatikan,
      kamus.barisHitunganLapis2Templat,
      kamus.lapis2AngkaTidakAda,
      kamus.lapis2Dimatikan,
      ...SLOT_IDS.map((id) => kamus.kalimatKosongPerSlot[id]),
      ...SLOT_IDS.map((id) => kamus.namaSlot[id]),
      ...kamus.pertanyaan,
    ];
    expect(semuaTeks.filter((t) => t.trim().length === 0)).toEqual([]);
    expect(kamus.pertanyaan).toHaveLength(7);
  });

  it("placeholder templat tidak hilang saat diterjemahkan", () => {
    expect(KAMUS_LEMBAR_JAWA.labelBlok2Templat).toContain("{n}");
    expect(KAMUS_LEMBAR_JAWA.barisHitunganLapis2Templat).toContain("{n}");
    expect(KAMUS_LEMBAR_JAWA.lapis1DitemukanTemplat).toContain("{tanggal salinan}");
    expect(KAMUS_LEMBAR_JAWA.lapis1TidakDitemukanTemplat).toContain("{tanggal salinan}");
    expect(KAMUS_LEMBAR_JAWA.lapis1MiripTemplat).toContain("{nama}");
  });

  it("kalimat 'tidak ditemukan' tetap memuat tiga bagian wajib (CLAUDE.md 3.1)", () => {
    const kalimat = KAMUS_LEMBAR_JAWA.lapis1TidakDitemukanTemplat.toLowerCase();
    expect(kalimat).toContain("{tanggal salinan}"); // 1. tanggal salinan
    expect(kalimat).toContain("sanes ateges"); // 2. bukan berarti tidak berizin
    expect(kalimat).toContain("mboten berizin");
    expect(kalimat).toContain("kantor layanan terpadu satu atap"); // 3. langkah konkret
  });

  it("kamusLembarUntuk memilih sesuai bahasa, bawaannya Indonesia", () => {
    expect(kamusLembarUntuk("jv")).toBe(KAMUS_LEMBAR_JAWA);
    expect(kamusLembarUntuk("id")).toBe(KAMUS_LEMBAR);
  });
});

describe("lembar dirender dalam bahasa yang dipilih", () => {
  function kumpulkanTeks(simpul: ReactNode, keluaran: string[]): void {
    if (simpul === null || simpul === undefined || typeof simpul === "boolean") return;
    if (typeof simpul === "string" || typeof simpul === "number") {
      keluaran.push(String(simpul));
      return;
    }
    if (Array.isArray(simpul)) {
      for (const anak of simpul) kumpulkanTeks(anak, keluaran);
      return;
    }
    if (isValidElement(simpul)) {
      kumpulkanTeks((simpul.props as { children?: ReactNode }).children, keluaran);
    }
  }

  /** Lembar campuran: satu keterangan "sebagian", satu terisi, Lapis 1 & 2 aktif. */
  function isiCampuran(kamus: KamusLembar): IsiLembar {
    const nilai = {} as Record<(typeof SLOT_IDS)[number], string | null>;
    const keadaan = {} as Record<(typeof SLOT_IDS)[number], Keadaan>;
    for (const id of SLOT_IDS) {
      const terisi = id === 1 || id === 4;
      nilai[id] = terisi ? "contoh isi" : null;
      keadaan[id] = terisi
        ? Keadaan.DISEBUTKAN_SEBAGIAN
        : Keadaan.BELUM_DIJAWAB;
    }
    const lapis1 = cocokkanNamaP3MI(nilai[1], {
      tanggalSalinan: "17 September 2026",
      daftar: [{ nama: "cont" }],
    }, kamus);
    const lapis2 = hitungCatatanBiaya("Rp9.500.000", "Rp19.000.000", {
      tanggalAcuan: "18 September 2026",
      komponen: [],
    }, kamus);
    return rakitIsiLembar({
      penilaian: {
        keadaan,
        jumlahKosong: SLOT_IDS.filter((id) => keadaan[id] === Keadaan.BELUM_DIJAWAB).length,
      },
      nilaiAsli: nilai,
      tanggal: "Dicatat pada: 18 September 2026, 14.00",
      hasilLapis1: lapis1.status === "aktif" ? lapis1.hasil : undefined,
      catatanHitungan: lapis2.status === "tersedia" ? lapis2.catatanHitungan : undefined,
      kamus,
    });
  }

  function teksLembar(kamus: KamusLembar): string {
    const potongan: string[] = [];
    kumpulkanTeks(elemenLembar(isiCampuran(kamus), kamus), potongan);
    return potongan.join(" ");
  }

  it("judul, label blok, subjudul, dan penutup memakai kamus Jawa", () => {
    const teks = teksLembar(KAMUS_LEMBAR_JAWA);
    expect(teks).toContain(KAMUS_LEMBAR_JAWA.judul);
    expect(teks).toContain(KAMUS_LEMBAR_JAWA.subjudul);
    expect(teks).toContain(KAMUS_LEMBAR_JAWA.labelBlok1);
    // judul blok 2 memuat angka ("{n} saking 10") sehingga yang dicek awalan
    // tetapnya, bukan templat mentahnya.
    expect(teks).toContain(KAMUS_LEMBAR_JAWA.labelBlok2Templat.split("{n}")[0]!.trim());
    expect(teks).toContain(KAMUS_LEMBAR_JAWA.penutup);
  });

  it("nol kalimat sistem Indonesia yang tertinggal di lembar Jawa", () => {
    const teks = teksLembar(KAMUS_LEMBAR_JAWA);
    const sisa: string[] = [];
    for (const [kunci, nilai] of Object.entries(KAMUS_LEMBAR)) {
      if (KUNCI_TAK_DITERJEMAHKAN.has(kunci)) continue;
      if (typeof nilai !== "string") continue;
      const bagian = nilai.split("{n}").join("").split("{tanggal salinan}").join("").split("{nama}").join("");
      if (bagian.trim().length > 0 && teks.includes(bagian)) sisa.push(kunci);
    }
    for (const id of SLOT_IDS) {
      if (teks.includes(KAMUS_LEMBAR.namaSlot[id])) sisa.push(`namaSlot.${id}`);
    }
    expect(sisa, `masih berbahasa Indonesia di lembar Jawa: ${sisa.join(", ")}`).toEqual([]);
  });

  it("tetap Indonesia saat kamus Indonesia yang dipakai (bawaan tidak bergeser)", () => {
    const teks = teksLembar(KAMUS_LEMBAR);
    expect(teks).toContain(KAMUS_LEMBAR.subjudul);
    expect(teks).toContain(KAMUS_LEMBAR.penutup);
    expect(teks).not.toContain(KAMUS_LEMBAR_JAWA.penutup);
    expect(teks).not.toContain(KAMUS_LEMBAR_JAWA.subjudul);
  });
});
