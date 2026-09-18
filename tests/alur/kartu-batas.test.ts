import { describe, expect, it } from "vitest";
import { POST } from "../../src/app/api/kartu/route";
import type { IsiLembar } from "../../src/core/tipe";
import { Keadaan } from "../../src/core/tipe";
import { SLOT_IDS } from "../../src/core/slot";

/**
 * S16 — penjaga batas /api/kartu. Endpoint ini menerima `IsiLembar` dari
 * KLIEN (trust boundary): tanpa batas ukuran, klien dapat mengirim ribuan
 * baris dan `tinggiLembar` meledak → OOM. `Array.isArray` saja tidak cukup.
 */

function isiSah(): IsiLembar {
  return {
    blok1: SLOT_IDS.map((slot) => ({
      slot,
      label: `label ${slot}`,
      nilai: "nilai",
      keadaan: Keadaan.DISEBUTKAN,
    })),
    blok2: [],
    pertanyaan: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"],
    tanggal: "18 September 2026",
  };
}

function minta(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/kartu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

describe("/api/kartu — batas masukan", () => {
  it("menerima IsiLembar yang sah (10 baris) → 200 PNG", async () => {
    const respons = await minta({ isiLembar: isiSah(), bahasa: "id" });
    expect(respons.status).toBe(200);
    expect(respons.headers.get("content-type")).toContain("image/png");
  });

  it("MENOLAK blok1 dengan 10.000 baris (DoS) → 400, bukan render", async () => {
    const jahat = {
      ...isiSah(),
      blok1: Array.from({ length: 10_000 }, (_, i) => ({
        slot: (i % 10) + 1,
        label: "x",
        nilai: "y",
        keadaan: Keadaan.DISEBUTKAN,
      })),
    };
    const respons = await minta({ isiLembar: jahat });
    expect(respons.status).toBe(400);
  });

  it("MENOLAK pertanyaan berlebih dan tanggal non-string", async () => {
    expect((await minta({ isiLembar: { ...isiSah(), pertanyaan: new Array(100).fill("q") } })).status).toBe(400);
    expect((await minta({ isiLembar: { ...isiSah(), tanggal: 123 } })).status).toBe(400);
    expect((await minta({ isiLembar: { ...isiSah(), blok1: "bukan-array" } })).status).toBe(400);
  });

  it("MENOLAK baris tanpa bentuk yang benar", async () => {
    const respons = await minta({ isiLembar: { ...isiSah(), blok1: [null] } });
    expect(respons.status).toBe(400);
  });
});
