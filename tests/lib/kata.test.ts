import { describe, expect, it } from "vitest";
import { MAKSIMAL_KATA, batasiKata, hitungKata } from "../../src/lib/kata";

/**
 * Batas kata kotak keterangan di `/periksa`. Dipicu permintaan pengguna:
 * kotak tumbuh mengikuti isi, jadi panjangnya harus ada batasnya.
 *
 * Yang paling penting diuji di sini bukan "seratus kata bisa dipotong", tapi
 * tiga hal yang mudah salah: spasi/baris baru tidak dihitung sebagai kata,
 * teks pas seratus kata TIDAK ikut dipotong, dan teks di bawah batas tidak
 * berubah sama sekali (tidak ada spasi yang hilang).
 */

const seratusKata = Array.from({ length: 100 }, (_, i) => `kata${i + 1}`).join(" ");
const seratusSatuKata = `${seratusKata} kata101`;

describe("hitungKata", () => {
  it("teks kosong = nol kata", () => {
    expect(hitungKata("")).toBe(0);
    expect(hitungKata("   \n  ")).toBe(0);
  });

  it("spasi berlebih dan baris baru tidak menambah hitungan", () => {
    expect(hitungKata("PT   Bina\n\nMandiri\tBerkah  ")).toBe(4);
  });

  it("tanda baca menempel tidak memecah kata", () => {
    expect(hitungKata("NT$ 27.470/bulan, dibayar.")).toBe(3);
  });
});

describe("batasiKata", () => {
  it("teks di bawah batas dikembalikan apa adanya — tidak ada satu karakter pun yang hilang", () => {
    const teks = "  PT Bina Mandiri Berkah\noperator mesin  ";
    expect(batasiKata(teks)).toBe(teks);
  });

  it("teks PAS seratus kata tidak dipotong", () => {
    expect(hitungKata(seratusKata)).toBe(MAKSIMAL_KATA);
    expect(batasiKata(seratusKata)).toBe(seratusKata);
  });

  it("teks seratus satu kata dipotong tepat di ujung kata ke-100", () => {
    const hasil = batasiKata(seratusSatuKata);
    expect(hitungKata(hasil)).toBe(MAKSIMAL_KATA);
    expect(hasil).toBe(seratusKata);
    expect(hasil.endsWith("kata100")).toBe(true);
  });

  it("kata yang sedang diketik melewati batas ikut terpotong, bukan tersimpan separuh", () => {
    expect(batasiKata(`${seratusKata} setengahkata`, 3)).toBe("kata1 kata2 kata3");
  });

  it("batas nol atau negatif berarti tidak ada yang tersimpan", () => {
    expect(batasiKata("apa saja", 0)).toBe("");
    expect(batasiKata("apa saja", -5)).toBe("");
  });

  it("pemanggilan berulang memberi hasil sama (tidak ada state yang tertinggal)", () => {
    expect(batasiKata(seratusSatuKata, 3)).toBe(batasiKata(seratusSatuKata, 3));
    expect(hitungKata("a b c")).toBe(hitungKata("a b c"));
  });
});
