import { describe, expect, it } from "vitest";
import {
  DAFTAR_SLOT,
  SLOT_IDS,
  adalahSlotId,
  slotDenganId,
} from "../../src/core/slot";

describe("sepuluh keterangan sebagai data", () => {
  it("jumlahnya tepat 10", () => {
    expect(DAFTAR_SLOT).toHaveLength(10);
  });

  it("id-nya tepat 1 sampai 10, berurutan, tanpa duplikat", () => {
    expect(DAFTAR_SLOT.map((slot) => slot.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it("setiap keterangan punya dasarHukum yang tidak kosong", () => {
    for (const slot of DAFTAR_SLOT) {
      expect(
        slot.dasarHukum.length,
        `slot ${slot.id} tidak punya dasar hukum`,
      ).toBeGreaterThan(0);
      for (const pasal of slot.dasarHukum) {
        expect(pasal.trim(), `slot ${slot.id} punya pasal kosong`).not.toBe("");
      }
    }
  });

  it("setiap keterangan punya nama yang tidak kosong", () => {
    for (const slot of DAFTAR_SLOT) {
      expect(slot.nama.trim(), `slot ${slot.id} tidak punya nama`).not.toBe("");
    }
  });

  it("tepat 9 eksplisit dan 1 tersirat", () => {
    const eksplisit = DAFTAR_SLOT.filter(
      (slot) => slot.tingkatBukti === "eksplisit",
    );
    const tersirat = DAFTAR_SLOT.filter(
      (slot) => slot.tingkatBukti === "tersirat",
    );

    expect(eksplisit).toHaveLength(9);
    expect(tersirat).toHaveLength(1);
  });

  it("keterangan 10 adalah satu-satunya yang tersirat", () => {
    const tersirat = DAFTAR_SLOT.filter(
      (slot) => slot.tingkatBukti === "tersirat",
    );

    expect(tersirat.map((slot) => slot.id)).toEqual([10]);
  });

  it("kunciKualitatif unik untuk tiap keterangan", () => {
    const kunci = DAFTAR_SLOT.map((slot) => slot.kunciKualitatif);

    expect(new Set(kunci).size).toBe(10);
  });

  it("SLOT_IDS sejalan dengan DAFTAR_SLOT", () => {
    expect(SLOT_IDS).toEqual(DAFTAR_SLOT.map((slot) => slot.id));
  });
});

describe("pembantu slot", () => {
  it("adalahSlotId menerima 1 sampai 10 saja", () => {
    for (const id of SLOT_IDS) {
      expect(adalahSlotId(id)).toBe(true);
    }

    for (const bukanId of [0, 11, -1, 1.5, "1", null, undefined, NaN]) {
      expect(adalahSlotId(bukanId)).toBe(false);
    }
  });

  it("slotDenganId mengembalikan keterangan yang benar", () => {
    for (const id of SLOT_IDS) {
      expect(slotDenganId(id).id).toBe(id);
    }
  });
});
