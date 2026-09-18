import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  HasilBaca,
  HasilBacaFinal,
  HasilLapis1,
  IsiLembar,
  Penilaian,
  Tawaran,
} from "../../src/core/tipe";
import { SLOT_IDS } from "../../src/core/slot";
import type { SlotId } from "../../src/core/slot";
import { manualProvider } from "../../src/vision/manualProvider";
import { pilihPembaca } from "../../src/vision/index";

/**
 * 🔴 BUKTI KLAIM ARSITEKTUR — CLAUDE.md §3.4, BLUEPRINT G.4 dan G.5.
 *
 * "Klaim 'lapisan model dapat dicabut dan sistem tetap berjalan' wajib dapat
 * dibuktikan satu tes. Test itu menjalankan seluruh alur dengan
 * manualProvider, tanpa menyentuh jaringan, dan harus lulus."
 *
 * Berkas ini TIDAK BOLEH dihapus, dilonggarkan, atau di-skip kapan pun
 * selama 24 jam. Bila suatu saat ia merah, yang diperbaiki adalah KODENYA,
 * bukan test ini — kecuali merahnya berasal dari ketiadaan
 * `src/core/penilaian.ts` (S03), yang didokumentasikan apa adanya di bawah
 * dan di PROGRESS.md.
 *
 * Jaringan disetel SELALU GAGAL (bukan sekadar "tidak dipanggil") lewat
 * `beforeEach` di bawah: `fetch` global diganti fungsi yang melempar begitu
 * dipanggil. Bila jalur manual diam-diam memanggil jaringan, test ini merah
 * karena itu, bukan karena logikanya salah.
 */

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("🔴 JARINGAN DIPANGGIL — jalur manual wajib bebas jaringan.");
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function tawaranManual(isian: Partial<Record<SlotId, string>>): Tawaran {
  return {
    sumber: "manual",
    teks: JSON.stringify(isian),
  };
}

describe("bukti statis: manualProvider.ts tidak menyebut primitif jaringan", () => {
  it("tidak ada fetch, XMLHttpRequest, atau modul http/https", () => {
    const isi = readFileSync(
      join(process.cwd(), "src", "vision", "manualProvider.ts"),
      "utf8",
    );

    expect(isi).not.toMatch(/\bfetch\s*\(/);
    expect(isi).not.toMatch(/XMLHttpRequest/);
    expect(isi).not.toMatch(/require\(\s*["']node:?https?/);
    expect(isi).not.toMatch(/from\s+["']node:?https?["']/);
  });
});

describe("lapisan vision: manualProvider tidak pernah menyentuh jaringan", () => {
  it("mengubah isian manual menjadi HasilBaca — keyakinan penuh untuk yang diisi, nol untuk yang kosong", async () => {
    const tawaran = tawaranManual({
      1: "PT Karya Bersama Sejahtera",
      4: "Operator mesin injeksi plastik",
      9: "   ",
    });

    const hasil: HasilBaca = await manualProvider.baca(tawaran);

    expect(Object.keys(hasil.nilai).map(Number).sort((a, b) => a - b)).toEqual([
      ...SLOT_IDS,
    ]);

    expect(hasil.nilai[1]).toBe("PT Karya Bersama Sejahtera");
    expect(hasil.keyakinan[1]).toBe(1);

    expect(hasil.nilai[4]).toBe("Operator mesin injeksi plastik");
    expect(hasil.keyakinan[4]).toBe(1);

    // hanya spasi dianggap TIDAK DIISI, bukan "diisi tapi kosong".
    expect(hasil.nilai[9]).toBeNull();
    expect(hasil.keyakinan[9]).toBe(0);

    for (const id of SLOT_IDS) {
      if (id === 1 || id === 4) continue;
      expect(hasil.nilai[id]).toBeNull();
      expect(hasil.keyakinan[id]).toBe(0);
    }
  });

  it("teks yang bukan JSON valid diperlakukan sebagai seluruh keterangan tidak diisi, bukan error", async () => {
    const tawaran: Tawaran = { sumber: "manual", teks: "ini bukan JSON {{{" };

    const hasil = await manualProvider.baca(tawaran);

    for (const id of SLOT_IDS) {
      expect(hasil.nilai[id]).toBeNull();
      expect(hasil.keyakinan[id]).toBe(0);
    }
  });

  it("pemilih penyedia memilih manualProvider untuk sumber manual, apa pun MODEL_API_KEY-nya", async () => {
    const pembaca = pilihPembaca("manual", { kunciApiModel: "kunci-tidak-relevan" });
    expect(pembaca).toBe(manualProvider);

    const hasil = await pembaca.baca(tawaranManual({ 2: "SIP2MI 1234, Taiwan" }));
    expect(hasil.nilai[2]).toBe("SIP2MI 1234, Taiwan");
  });

  it("pemilih penyedia memilih manualProvider ketika MODEL_API_KEY kosong, walau sumbernya gambar", () => {
    const pembaca = pilihPembaca("gambar", { kunciApiModel: "" });
    expect(pembaca).toBe(manualProvider);
  });

  it("pemilih penyedia melempar galat yang jelas bila sumber gambar, kunci ada, tapi penyediaModel belum disuntikkan", () => {
    expect(() => pilihPembaca("gambar", { kunciApiModel: "kunci-ada" })).toThrow();
  });
});

/**
 * Kontrak `nilai()` dikunci S02 di `tests/core/penilaian.test.ts`, dan
 * kontrak `rakitIsiLembar()` ditulis S04 di `src/core/perakitan.ts`:
 *   export function nilai(
 *     masukan: HasilBacaFinal,
 *     keyakinan: Readonly<Record<SlotId, number>>,
 *   ): Penilaian
 *   export function rakitIsiLembar(parameter: ParameterRakitan): IsiLembar
 *
 * Keduanya dimuat lewat spesifier VARIABEL, pola yang sama dipakai S02,
 * supaya `tsc --noEmit` tetap hijau meski salah satu berkasnya belum sampai
 * di checkout window lain (mis. belum di-*pull*). Bila salah satunya belum
 * ada, describe block di bawah MERAH — itu bukan kesalahan jalur manual,
 * itu dependensi lintas-sprint (S03, S04) yang belum sampai. Lihat
 * PROGRESS.md.
 */
interface ModulPenilaian {
  readonly nilai: (
    masukan: HasilBacaFinal,
    keyakinan: Readonly<Record<SlotId, number>>,
  ) => Penilaian;
}

interface ParameterRakitan {
  readonly penilaian: Penilaian;
  readonly nilaiAsli: Readonly<Record<SlotId, string | null>>;
  readonly tanggal: string;
  readonly hasilLapis1?: HasilLapis1;
  readonly catatanHitungan?: string;
}

interface ModulPerakitan {
  readonly rakitIsiLembar: (parameter: ParameterRakitan) => IsiLembar;
}

const JALUR_PENILAIAN = "../../src/core/penilaian";
const JALUR_PERAKITAN = "../../src/core/perakitan";

describe("alur penuh tanpa jaringan: manual → manualProvider → koreksi → penilaian → perakitan", () => {
  let modulPenilaian: ModulPenilaian;
  let modulPerakitan: ModulPerakitan;

  beforeAll(async () => {
    modulPenilaian = (await import(JALUR_PENILAIAN)) as unknown as ModulPenilaian;
    modulPerakitan = (await import(JALUR_PERAKITAN)) as unknown as ModulPerakitan;
  });

  it("seluruh alur sampai Penilaian selesai tanpa satu pun panggilan jaringan", async () => {
    const tawaran = tawaranManual({
      1: "PT Karya Bersama Sejahtera",
      2: "SIP2MI nomor 1234/SIP/2026, negara tujuan Taiwan",
    });

    const hasilBaca = await manualProvider.baca(tawaran);

    // Koreksi manusia pada jalur manual: apa yang diketik pengguna SUDAH
    // final, tidak ada langkah OCR yang perlu dibetulkan. HasilBacaFinal
    // dibentuk langsung dari HasilBaca, nol keterangan ditandai "tidak tahu".
    const hasilFinal: HasilBacaFinal = {
      nilai: hasilBaca.nilai,
      ditandaiTidakTahu: [],
    };

    const penilaian = modulPenilaian.nilai(hasilFinal, hasilBaca.keyakinan);

    expect(Object.keys(penilaian.keadaan)).toHaveLength(10);
    expect(typeof penilaian.jumlahKosong).toBe("number");
  });

  it("Penilaian dari jalur manual dirakit menjadi IsiLembar sungguhan (rakitIsiLembar S04), tanpa jaringan", async () => {
    const tawaran = tawaranManual({ 1: "PT Karya Bersama Sejahtera" });
    const hasilBaca = await manualProvider.baca(tawaran);
    const hasilFinal: HasilBacaFinal = {
      nilai: hasilBaca.nilai,
      ditandaiTidakTahu: [],
    };

    const penilaian = modulPenilaian.nilai(hasilFinal, hasilBaca.keyakinan);
    const isiLembar = modulPerakitan.rakitIsiLembar({
      penilaian,
      nilaiAsli: hasilFinal.nilai,
      tanggal: new Date().toISOString(),
    });

    expect(isiLembar.blok1.length + isiLembar.blok2.length).toBe(10);
    expect(isiLembar.pertanyaan.length).toBeGreaterThan(0);
    expect(typeof isiLembar.tanggal).toBe("string");

    // slot 1 diisi dan lulus uji kualitatif (nama badan hukum "PT ...") →
    // wajib muncul di blok1, bukan blok2, membuktikan alur penuh benar-benar
    // menyambung ujung ke ujung, bukan cuma bertipe cocok.
    expect(isiLembar.blok1.some((baris) => baris.slot === 1)).toBe(true);
  });
});
