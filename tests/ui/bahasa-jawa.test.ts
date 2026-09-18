import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SLOT_IDS, slotDenganId } from "../../src/core/slot";
import { NAMA_SLOT_JAWA, SATUAN_KATA_JAWA } from "../../src/core/teksJawa";
import { SATUAN_KATA } from "../../src/core/teks";

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
