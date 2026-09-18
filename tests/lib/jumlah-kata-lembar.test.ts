import { describe, expect, it } from "vitest";
import type { ReactNode } from "react";
import { isValidElement } from "react";
import { Keadaan } from "../../src/core/tipe";
import type { IsiLembar } from "../../src/core/tipe";
import { SLOT_IDS } from "../../src/core/slot";
import type { SlotId } from "../../src/core/slot";
import { rakitIsiLembar } from "../../src/core/perakitan";
import { cocokkanNamaP3MI } from "../../src/core/pencocokan";
import { hitungCatatanBiaya } from "../../src/core/biaya";
import { elemenLembar } from "../../src/lib/renderLembar";

/**
 * S12-6 — batas "Jumlah kata di lembar" (CLAUDE.md bagian 4), diukur pada
 * SELURUH lembar yang benar-benar dirender, bukan sebagian.
 *
 * Test lama (`tests/core/perakitan.test.ts` S04-6) hanya menghitung
 * blok1 + blok2 + pertanyaan, sehingga melewatkan judul, label, kalimat
 * pembuka, nomor pasal, kalimat penutup, dan kalimat Lapis 1/2 yang
 * ditambahkan S09. Diukur di S12: lembar SELURUH KOSONG saja sudah 436 kata,
 * kasus terberat 468 kata — batas 340 tidak pernah benar-benar ditegakkan.
 *
 * Batas dinaikkan 340 → 480 kata TEKS SISTEM (kata yang ditulis produk
 * sendiri), dengan alasan tertulis di PROGRESS.md [S12-W1] dan PERUBAHAN.md
 * PB-006. Kutipan isi tawaran tidak dihitung ke batas ini karena bukan teks
 * produk, dan sudah dibatasi terpisah: 130 karakter per baris
 * (`potongNilai` di renderLembar.tsx).
 *
 * Diperiksa pada SELURUH 1.024 kombinasi terisi/kosong kesepuluh keterangan,
 * termasuk seluruh keluaran Lapis 1 dan ada/tidaknya catatan hitungan.
 */

const BATAS_KATA_TEKS_SISTEM = 480;

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

function hitungKata(teks: string): number {
  return teks.trim().split(/\s+/).filter(Boolean).length;
}

function kataTeksSistem(isi: IsiLembar): number {
  const potongan: string[] = [];
  kumpulkanTeks(elemenLembar(isi), potongan);
  const total = hitungKata(potongan.join(" "));
  const kutipanTawaran = isi.blok1.reduce((n, baris) => n + hitungKata(baris.nilai), 0);
  return total - kutipanTawaran;
}

const SALINAN = {
  tanggalSalinan: "17 September 2026",
  daftar: [{ nama: "PT. AGESA ASA JAYA" }],
};
const ACUAN = { tanggalAcuan: "18 September 2026", komponen: [] };

function isiUntukPola(pola: number, namaSlot1: string): IsiLembar {
  const nilai = {} as Record<SlotId, string | null>;
  const keadaan = {} as Record<SlotId, Keadaan>;
  for (const id of SLOT_IDS) {
    const terisi = (pola >> (id - 1)) & 1;
    nilai[id] = terisi
      ? id === 1
        ? namaSlot1
        : id === 5
          ? "Rp9.500.000"
          : id === 9
            ? "Rp18.000.000"
            : "isi"
      : null;
    keadaan[id] = terisi ? Keadaan.DISEBUTKAN_SEBAGIAN : Keadaan.BELUM_DIJAWAB;
  }
  const lapis1 = cocokkanNamaP3MI(nilai[1], SALINAN);
  const lapis2 = hitungCatatanBiaya(nilai[5], nilai[9], ACUAN);
  return rakitIsiLembar({
    penilaian: {
      keadaan,
      jumlahKosong: SLOT_IDS.filter((id) => keadaan[id] === Keadaan.BELUM_DIJAWAB).length,
    },
    nilaiAsli: nilai,
    tanggal: "Dicatat pada: 18 September 2026, 14.00",
    hasilLapis1: lapis1.status === "aktif" ? lapis1.hasil : undefined,
    catatanHitungan: lapis2.status === "tersedia" ? lapis2.catatanHitungan : undefined,
  });
}

describe("S12-6 jumlah kata di seluruh lembar yang dirender", () => {
  it("pengukur benar-benar menghitung seluruh lembar, bukan hampa", () => {
    expect(kataTeksSistem(isiUntukPola(0, "x"))).toBeGreaterThan(300);
  });

  it.each([
    ["nama perusahaan tidak ditemukan", "PT Maju Mundur"],
    ["nama perusahaan mirip", "Agesa Ase Jaya"],
    ["nama perusahaan ditemukan", "Agesa Asa Jaya"],
  ])(
    `seluruh 1.024 kombinasi terisi/kosong (%s) — teks sistem ≤ ${BATAS_KATA_TEKS_SISTEM} kata`,
    (_nama, namaSlot1) => {
      let terberat = 0;
      for (let pola = 0; pola < 1024; pola += 1) {
        terberat = Math.max(terberat, kataTeksSistem(isiUntukPola(pola, namaSlot1)));
      }
      expect(terberat).toBeLessThanOrEqual(BATAS_KATA_TEKS_SISTEM);
    },
  );
});
