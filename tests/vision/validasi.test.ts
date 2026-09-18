import { describe, expect, it } from "vitest";
import { SLOT_IDS } from "../../src/core/slot";
import { validasiKeluaranModel } from "../../src/vision/validasi";

/**
 * S06-3, S06-6: validasi keluaran model.
 *
 * Aturan (persis dari prompt sprint):
 *   - kunci yang tidak dikenal dibuang;
 *   - nilai yang bukan string dianggap kosong;
 *   - keyakinan di luar rentang 0..1 dianggap nol;
 *   - nilai yang memuat kata penilaian dibuang, tidak diteruskan.
 */

function keluaranPenuhValid(): unknown {
  const nilai: Record<string, string | null> = {};
  const keyakinan: Record<string, number> = {};
  for (const id of SLOT_IDS) {
    nilai[String(id)] = `nilai slot ${id}`;
    keyakinan[String(id)] = 0.8;
  }
  return { nilai, keyakinan };
}

describe("validasiKeluaranModel — bentuk dan tipe", () => {
  it("keluaran yang sepenuhnya sesuai skema dianggap valid dan seluruh 10 slot terisi", () => {
    const hasil = validasiKeluaranModel(keluaranPenuhValid());

    expect(hasil.valid).toBe(true);
    for (const id of SLOT_IDS) {
      expect(hasil.hasil.nilai[id]).toBe(`nilai slot ${id}`);
      expect(hasil.hasil.keyakinan[id]).toBe(0.8);
    }
  });

  it.each([null, undefined, "sebuah string", 42, true, ["array", "bukan", "objek"]])(
    "keluaran %p (bukan objek) dianggap tidak valid, bukan error",
    (mentah) => {
      const hasil = validasiKeluaranModel(mentah);
      expect(hasil.valid).toBe(false);
      for (const id of SLOT_IDS) {
        expect(hasil.hasil.nilai[id]).toBeNull();
        expect(hasil.hasil.keyakinan[id]).toBe(0);
      }
    },
  );

  it("objek tanpa kunci nilai/keyakinan dianggap tidak valid", () => {
    expect(validasiKeluaranModel({}).valid).toBe(false);
    expect(validasiKeluaranModel({ nilai: {} }).valid).toBe(false);
    expect(validasiKeluaranModel({ keyakinan: {} }).valid).toBe(false);
  });

  it("nilai atau keyakinan berbentuk array (bukan objek peta) dianggap tidak valid", () => {
    const hasil = validasiKeluaranModel({ nilai: [], keyakinan: [] });
    expect(hasil.valid).toBe(false);
  });

  it("kunci yang tidak dikenal (bukan '1'..'10') dibuang — tidak memengaruhi hasil maupun melempar", () => {
    const mentah = keluaranPenuhValid() as { nilai: Record<string, unknown>; keyakinan: Record<string, unknown> };
    mentah.nilai["11"] = "seharusnya diabaikan";
    mentah.nilai["nama_perusahaan"] = "kunci aneh lain";
    mentah.keyakinan["__proto__"] = 999;

    const hasil = validasiKeluaranModel(mentah);

    expect(hasil.valid).toBe(true);
    expect(hasil.hasil.nilai[1]).toBe("nilai slot 1");
  });

  it("nilai yang bukan string (angka, boolean, objek, array, null) dianggap kosong", () => {
    const mentah = keluaranPenuhValid() as { nilai: Record<string, unknown>; keyakinan: Record<string, unknown> };
    mentah.nilai["1"] = 12345;
    mentah.nilai["2"] = true;
    mentah.nilai["3"] = { bersarang: "objek" };
    mentah.nilai["4"] = ["array"];
    mentah.nilai["5"] = null;

    const hasil = validasiKeluaranModel(mentah);

    for (const id of [1, 2, 3, 4, 5] as const) {
      expect(hasil.hasil.nilai[id]).toBeNull();
      expect(hasil.hasil.keyakinan[id]).toBe(0);
    }
  });

  it("nilai string kosong atau hanya spasi dianggap kosong", () => {
    const mentah = keluaranPenuhValid() as { nilai: Record<string, unknown> };
    mentah.nilai["1"] = "";
    mentah.nilai["2"] = "    ";

    const hasil = validasiKeluaranModel(mentah);

    expect(hasil.hasil.nilai[1]).toBeNull();
    expect(hasil.hasil.nilai[2]).toBeNull();
  });

  it.each([-0.1, -1, 1.1, 2, NaN, Infinity, -Infinity])(
    "keyakinan %p di luar rentang 0..1 dianggap nol",
    (keyakinanTidakSah) => {
      const mentah = keluaranPenuhValid() as { keyakinan: Record<string, unknown> };
      mentah.keyakinan["1"] = keyakinanTidakSah;

      const hasil = validasiKeluaranModel(mentah);

      expect(hasil.hasil.keyakinan[1]).toBe(0);
    },
  );

  it.each(["0.5", null, undefined, {}, []])(
    "keyakinan bertipe bukan number (%p) dianggap nol",
    (keyakinanBukanAngka) => {
      const mentah = keluaranPenuhValid() as { keyakinan: Record<string, unknown> };
      mentah.keyakinan["1"] = keyakinanBukanAngka;

      const hasil = validasiKeluaranModel(mentah);

      expect(hasil.hasil.keyakinan[1]).toBe(0);
    },
  );

  it("keyakinan tepat di batas 0 dan 1 tetap diterima apa adanya", () => {
    const mentah = keluaranPenuhValid() as { keyakinan: Record<string, unknown> };
    mentah.keyakinan["1"] = 0;
    mentah.keyakinan["2"] = 1;

    const hasil = validasiKeluaranModel(mentah);

    expect(hasil.hasil.keyakinan[1]).toBe(0);
    expect(hasil.hasil.keyakinan[2]).toBe(1);
  });
});

describe("validasiKeluaranModel — S06-6: kata penilaian dibuang, tidak diteruskan", () => {
  it('nilai yang memuat "tawaran ini mencurigakan" dibuang menjadi kosong', () => {
    const mentah = keluaranPenuhValid() as { nilai: Record<string, unknown> };
    mentah.nilai["4"] = "tawaran ini mencurigakan";

    const hasil = validasiKeluaranModel(mentah);

    expect(hasil.hasil.nilai[4]).toBeNull();
    expect(hasil.hasil.keyakinan[4]).toBe(0);
  });

  it.each([
    "sepertinya ini penipuan",
    "hati-hati dengan tawaran ini",
    "PT ini terlihat abal-abal",
    "kelihatannya bodong",
    "waspada, ini berisiko tinggi",
    "ini tidak terpercaya",
    "sebaiknya jangan percaya, ini palsu",
  ])("kata penilaian pada '%s' membuat slot itu dibuang (bukan slot lain)", (nilaiPenilaian) => {
    const mentah = keluaranPenuhValid() as { nilai: Record<string, unknown> };
    mentah.nilai["7"] = nilaiPenilaian;

    const hasil = validasiKeluaranModel(mentah);

    expect(hasil.hasil.nilai[7]).toBeNull();
    expect(hasil.hasil.keyakinan[7]).toBe(0);
    // Slot lain yang tidak disentuh tetap terisi apa adanya.
    expect(hasil.hasil.nilai[1]).toBe("nilai slot 1");
  });

  it("pencocokan kata penilaian tidak peka huruf besar/kecil", () => {
    const mentah = keluaranPenuhValid() as { nilai: Record<string, unknown> };
    mentah.nilai["1"] = "TAWARAN INI MENCURIGAKAN SEKALI";

    const hasil = validasiKeluaranModel(mentah);

    expect(hasil.hasil.nilai[1]).toBeNull();
  });

  it("kutipan asli poster yang memuat klaim netral (mis. \"aman dan terpercaya\") TIDAK dibuang", () => {
    // Kata seperti "aman"/"terpercaya" sengaja tidak masuk daftar saring —
    // itu klaim pemasaran yang wajar muncul di poster asli, bukan komentar
    // tambahan dari model. Lihat catatan di src/vision/validasi.ts.
    const mentah = keluaranPenuhValid() as { nilai: Record<string, unknown> };
    mentah.nilai["1"] = "PT Kerja Aman Terpercaya";

    const hasil = validasiKeluaranModel(mentah);

    expect(hasil.hasil.nilai[1]).toBe("PT Kerja Aman Terpercaya");
  });

  it("jika seluruh 10 slot dibuang karena penilaian, hasil() tetap berbentuk HasilBaca penuh (bukan objek kosong)", () => {
    const nilai: Record<string, string> = {};
    const keyakinan: Record<string, number> = {};
    for (const id of SLOT_IDS) {
      nilai[String(id)] = "tawaran ini mencurigakan";
      keyakinan[String(id)] = 0.9;
    }

    const hasil = validasiKeluaranModel({ nilai, keyakinan });

    expect(hasil.valid).toBe(true);
    expect(Object.keys(hasil.hasil.nilai)).toHaveLength(10);
    for (const id of SLOT_IDS) {
      expect(hasil.hasil.nilai[id]).toBeNull();
    }
  });
});
