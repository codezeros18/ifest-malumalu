import { describe, expect, it } from "vitest";
import { atributLang } from "../../src/lib/simpananLokal";

/**
 * S16 — `<html lang>` harus mengikuti bahasa yang dipilih. Dulu atribut itu
 * dipaku `"id"` di `layout.tsx`, sehingga pembaca layar membaca lembar
 * berbahasa Jawa sebagai bahasa Indonesia (WCAG 3.1.1).
 */
describe("atributLang", () => {
  it("memetakan bahasa antarmuka ke kode BCP-47", () => {
    expect(atributLang("id")).toBe("id");
    expect(atributLang("jv")).toBe("jv");
  });
});
