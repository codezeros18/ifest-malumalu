import { describe, expect, it } from "vitest";
import * as teks from "../../src/core/teks";

/**
 * 🔴 Test kosakata terlarang — CLAUDE.md bagian 3.1.
 *
 * Memindai SELURUH nilai string yang diekspor `src/core/teks.ts`, secara
 * rekursif (termasuk yang berada di dalam objek dan array), dan
 * menggagalkan build bila ada yang cocok dengan daftar kata terlarang.
 *
 * Daftar kata di bawah adalah salinan persis dari CLAUDE.md 3.1. Berkas
 * CLAUDE.md sendiri tidak ter-commit ke repositori (lihat CLAUDE.md
 * bagian 8), sehingga daftarnya WAJIB ditulis ulang di sini secara manual —
 * bila daftar di CLAUDE.md berubah, daftar ini harus disesuaikan juga.
 */

const KATA_TERLARANG: readonly string[] = [
  "penipu",
  "penipuan",
  "menipu",
  "mencurigakan",
  "curiga",
  "abal-abal",
  "bodong",
  "ilegal",
  "melanggar",
  "berisiko",
  "risiko tinggi",
  "waspada",
  "hati-hati",
  "bahaya",
  "aman",
  "tidak aman",
  "terpercaya",
  "tidak terpercaya",
  "valid",
  "tidak valid",
  "asli",
  "palsu",
  "resmi",
  "terverifikasi",
  "tidak terdaftar",
];

/**
 * "resmi" dikecualikan bila kemunculannya bagian dari salah satu frasa ini
 * (CLAUDE.md 3.1: `resmi (kecuali dalam frasa "daftar perusahaan berizin"
 * dan "kantor resmi")`).
 */
const FRASA_KECUALI_RESMI: readonly string[] = [
  "daftar perusahaan berizin",
  "kantor resmi",
];

interface StringTerkumpul {
  readonly jalur: string;
  readonly teks: string;
}

function kumpulkanString(
  nilai: unknown,
  jalur: string,
  keluaran: StringTerkumpul[],
): void {
  if (typeof nilai === "string") {
    keluaran.push({ jalur, teks: nilai });
    return;
  }
  if (Array.isArray(nilai)) {
    nilai.forEach((item, indeks) =>
      kumpulkanString(item, `${jalur}[${indeks}]`, keluaran),
    );
    return;
  }
  if (nilai !== null && typeof nilai === "object") {
    for (const [kunci, isi] of Object.entries(nilai)) {
      kumpulkanString(isi, `${jalur}.${kunci}`, keluaran);
    }
  }
  // Nilai lain (angka, fungsi, dst.) sengaja diabaikan — bukan teks pengguna.
}

function escapeRegex(kata: string): string {
  return kata.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function konteksSekitar(teks: string, indeks: number, panjang: number): string {
  const mulai = Math.max(0, indeks - 40);
  const akhir = Math.min(teks.length, indeks + panjang + 40);
  return teks.slice(mulai, akhir).toLowerCase();
}

interface Pelanggaran {
  readonly jalur: string;
  readonly kata: string;
  readonly cuplikan: string;
}

function periksaTeks(jalur: string, teks: string): Pelanggaran[] {
  const pelanggaran: Pelanggaran[] = [];

  for (const kata of KATA_TERLARANG) {
    const regex = new RegExp(`\\b${escapeRegex(kata)}\\b`, "giu");
    let cocok: RegExpExecArray | null;

    while ((cocok = regex.exec(teks)) !== null) {
      if (kata === "resmi") {
        const konteks = konteksSekitar(teks, cocok.index, cocok[0].length);
        const dikecualikan = FRASA_KECUALI_RESMI.some((frasa) =>
          konteks.includes(frasa.toLowerCase()),
        );
        if (dikecualikan) {
          continue;
        }
      }

      pelanggaran.push({
        jalur,
        kata,
        cuplikan: teks.slice(
          Math.max(0, cocok.index - 20),
          Math.min(teks.length, cocok.index + cocok[0].length + 20),
        ),
      });
    }
  }

  return pelanggaran;
}

const seluruhString: StringTerkumpul[] = [];
for (const [kunci, nilai] of Object.entries(teks)) {
  kumpulkanString(nilai, kunci, seluruhString);
}

describe("kosakata terlarang di src/core/teks.ts", () => {
  it("ada string yang dipindai — pagar ini tidak boleh lulus secara hampa", () => {
    expect(seluruhString.length).toBeGreaterThan(0);
  });

  it("tidak ada satu pun nilai string yang cocok dengan daftar kata terlarang", () => {
    const seluruhPelanggaran: Pelanggaran[] = [];

    for (const { jalur, teks: isi } of seluruhString) {
      seluruhPelanggaran.push(...periksaTeks(jalur, isi));
    }

    const pesan = seluruhPelanggaran
      .map((p) => `${p.jalur} mengandung "${p.kata}" — cuplikan: "…${p.cuplikan}…"`)
      .join("\n");

    expect(seluruhPelanggaran, pesan).toEqual([]);
  });
});
