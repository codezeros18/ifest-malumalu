import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * S11-5: tidak ada informasi yang disampaikan lewat warna saja — setiap
 * keadaan (BLUEPRINT H.6: disebutkan · disebutkan sebagian · belum
 * dijawab) punya TEKS atau BENTUK yang membedakannya, bukan cuma warna.
 *
 * 🔴 Diperiksa lewat ANALISIS SUMBER (bukan merender komponennya): Vitest
 * di proyek ini belum pernah merender JSX sungguhan (semua test lain
 * hanya mengimpor tipe/fungsi murni) — `renderToStaticMarkup` gagal
 * dengan "React is not defined" karena transform esbuild default Vite
 * memakai JSX klasik, sementara `Lencana.tsx` ditulis untuk runtime JSX
 * otomatis (tanpa `import React`). Memperbaikinya butuh mengubah
 * `vitest.config.ts` (milik Window 1, di luar berkas yang boleh disentuh
 * sprint ini) atau menambah baris impor non-aksesibilitas ke komponen.
 * Dipilih jalan yang tidak menyentuh keduanya: memindai SUMBER
 * `Lencana.tsx` sebagai teks, pola yang sama dipakai pagar
 * `tests/core/batas-modul.test.ts`. Dicatat di PROGRESS.md untuk Window
 * lain — pola ini akan berulang bila sprint mendatang butuh benar-benar
 * merender komponen.
 */

const SUMBER_LENCANA = readFileSync(
  join(process.cwd(), "src", "ui", "Lencana.tsx"),
  "utf8",
);

describe("Lencana — bentuk sungguhan berbeda per keadaan, bukan cuma warna", () => {
  it('"tanpa-penanda" (disebutkan) tidak merender bentuk apa pun — return null', () => {
    const cocok = /bentuk === "tanpa-penanda"\)\s*\{\s*return null;/.exec(SUMBER_LENCANA);
    expect(cocok, "cabang tanpa-penanda harus persis `return null`").not.toBeNull();
  });

  it('"lingkaran-setengah" (disebutkan sebagian) memakai pola isian gradasi — beda BENTUK (area terisi 50%), bukan cuma beda warna', () => {
    const blokSetengah = /bentuk === "lingkaran-setengah"\)\s*\{([\s\S]*?)\n\s*\}/.exec(
      SUMBER_LENCANA,
    );
    expect(blokSetengah, "cabang lingkaran-setengah tidak ditemukan").not.toBeNull();
    expect(blokSetengah?.[1]).toMatch(/linear-gradient/);
    expect(blokSetengah?.[1]).toMatch(/aria-hidden="true"/);
  });

  it('"lingkaran-kosong" (belum dijawab) hanya bergaris (outline), TANPA pola isian — beda BENTUK (area terisi 0%) dari kedua keadaan lain', () => {
    // Cabang terakhir (fallback) fungsi Bulatan — setelah kedua `if` di atas.
    const indeksFungsiBulatan = SUMBER_LENCANA.indexOf("function Bulatan");
    const indeksTutupFungsi = SUMBER_LENCANA.indexOf("\n}\n", indeksFungsiBulatan);
    const tubuhBulatan = SUMBER_LENCANA.slice(indeksFungsiBulatan, indeksTutupFungsi);
    const indeksCabangTerakhir = tubuhBulatan.lastIndexOf("return (");
    const cabangKosong = tubuhBulatan.slice(indeksCabangTerakhir);

    expect(cabangKosong).toMatch(/aria-hidden="true"/);
    expect(cabangKosong).not.toMatch(/linear-gradient/);
    expect(cabangKosong).toMatch(/border/);
  });

  it("ketiga cabang bentuk (Bulatan) saling berbeda kode-nya — tidak ada dua keadaan yang kebetulan identik", () => {
    const cabangTanpaPenanda = "return null;";
    const cabangSetengah = /bentuk === "lingkaran-setengah"\)\s*\{([\s\S]*?)\n\s*\}/.exec(
      SUMBER_LENCANA,
    )?.[1];
    const indeksFungsiBulatan = SUMBER_LENCANA.indexOf("function Bulatan");
    const indeksTutupFungsi = SUMBER_LENCANA.indexOf("\n}\n", indeksFungsiBulatan);
    const cabangKosong = SUMBER_LENCANA.slice(indeksFungsiBulatan, indeksTutupFungsi).slice(
      SUMBER_LENCANA.slice(indeksFungsiBulatan, indeksTutupFungsi).lastIndexOf("return ("),
    );

    const bentukUnik = new Set([cabangTanpaPenanda, cabangSetengah, cabangKosong]);
    expect(bentukUnik.size).toBe(3);
  });

  it("teks (bila ada) dirender sebagai konten TERLIHAT (bukan aria-hidden) — makna keadaan tidak bergantung pada elemen dekoratif bentuknya", () => {
    const cocok = /\{teks \? <span>\{teks\}<\/span> : null\}/.exec(SUMBER_LENCANA);
    expect(
      cocok,
      "teks harus dirender lewat <span>{teks}</span> biasa, bukan di dalam elemen aria-hidden",
    ).not.toBeNull();
  });

  it("elemen bentuk (lingkaran) SELALU ditandai aria-hidden — tidak pernah jadi satu-satunya pembawa makna bagi pembaca layar", () => {
    const jumlahAriaHidden = (SUMBER_LENCANA.match(/aria-hidden="true"/g) ?? []).length;
    // Dua cabang bentuk (setengah, kosong) — cabang tanpa-penanda tidak
    // merender elemen sama sekali, jadi tidak butuh aria-hidden.
    expect(jumlahAriaHidden).toBe(2);
  });
});
