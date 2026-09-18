import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HasilBacaFinal } from "../../src/core/tipe";
import { nilai } from "../../src/core/penilaian";
import { rakitIsiLembar } from "../../src/core/perakitan";
import { manualProvider } from "../../src/vision/manualProvider";
import type { Tawaran } from "../../src/core/tipe";

/**
 * S10-4: 🔴 alur inti selesai dengan `DATABASE_URL` KOSONG.
 *
 * Pencatatan metrik BOLEH mati sepenuhnya (BLUEPRINT G.5 Lapis 0 — di
 * sini malah bukan lapis mana pun, murni metrik, lihat CLAUDE.md §3.5)
 * tanpa memengaruhi satu langkah pun dari alur menerbitkan lembar.
 */

const clientTiruan = {
  connect: vi.fn(async () => {}),
  query: vi.fn(async () => ({ rows: [] })),
  end: vi.fn(async () => {}),
};

vi.mock("pg", () => ({
  Client: vi.fn().mockImplementation(() => clientTiruan),
}));

// Diimpor SETELAH vi.mock — aman karena vi.mock di-hoist Vitest ke atas berkas.
const { POST } = await import("../../src/app/api/catat/route");
const { Client: ClientTiruanKonstruktor } = await import("pg");

const DATABASE_URL_LAMA = process.env["DATABASE_URL"];

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env["DATABASE_URL"];
});

afterEach(() => {
  if (DATABASE_URL_LAMA === undefined) {
    delete process.env["DATABASE_URL"];
  } else {
    process.env["DATABASE_URL"] = DATABASE_URL_LAMA;
  }
});

function permintaanPencatatan(): Request {
  return new Request("http://localhost/api/catat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jalur_masukan: "manual",
      jumlah_kosong: 3,
      dikoreksi: false,
      dibagikan: true,
      durasi_detik: 12,
    }),
  });
}

describe("endpoint /api/catat dengan DATABASE_URL kosong", () => {
  it("membalas cepat tanpa pernah mencoba tersambung ke basis data", async () => {
    const respons = await POST(permintaanPencatatan());

    expect(respons.status).toBe(204);
    expect(ClientTiruanKonstruktor).not.toHaveBeenCalled();
    expect(clientTiruan.connect).not.toHaveBeenCalled();
    expect(clientTiruan.query).not.toHaveBeenCalled();
  });

  it("tidak pernah melempar, walau badan permintaan aneh atau kosong", async () => {
    const permintaanKosong = new Request("http://localhost/api/catat", {
      method: "POST",
      body: "bukan json sama sekali {{{",
    });

    await expect(POST(permintaanKosong)).resolves.toBeInstanceOf(Response);
  });
});

describe("alur inti (manual → manualProvider → penilaian → perakitan) tetap selesai dengan DATABASE_URL kosong", () => {
  it("lembar tetap terbit walau pencatatan dipanggil di tengah alur, fire-and-forget, tanpa DATABASE_URL", async () => {
    const tawaran: Tawaran = {
      sumber: "manual",
      teks: JSON.stringify({ "1": "PT Karya Bersama Sejahtera" }),
    };

    const hasilBaca = await manualProvider.baca(tawaran);
    const hasilFinal: HasilBacaFinal = { nilai: hasilBaca.nilai, ditandaiTidakTahu: [] };
    const penilaian = nilai(hasilFinal, hasilBaca.keyakinan);

    // Titik yang setara dengan "alur penerbitan lembar" memanggil catat()
    // fire-and-forget di sini — TIDAK di-`await`, persis kontrak S10-3.
    void POST(permintaanPencatatan());

    const isiLembar = rakitIsiLembar({
      penilaian,
      nilaiAsli: hasilFinal.nilai,
      tanggal: new Date().toISOString(),
    });

    expect(isiLembar.blok1.length + isiLembar.blok2.length).toBe(10);
    expect(isiLembar.pertanyaan.length).toBeGreaterThan(0);
  });
});
