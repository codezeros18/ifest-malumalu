import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HasilBacaFinal, Tawaran } from "../../src/core/tipe";
import { nilai } from "../../src/core/penilaian";
import { rakitIsiLembar } from "../../src/core/perakitan";
import { manualProvider } from "../../src/vision/manualProvider";
import { catat } from "../../src/lib/catat";

/**
 * S10-5: 🔴 alur inti selesai dengan endpoint pencatatan DISETEL SELALU
 * GAGAL — baik gagal di lapisan basis data (Client `pg` melempar) maupun
 * gagal total di lapisan jaringan (`fetch` yang dipakai `catat()` sendiri
 * melempar). Fire-and-forget berarti KEDUANYA harus tidak berdampak.
 */

const DATABASE_URL_LAMA = process.env["DATABASE_URL"];

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (DATABASE_URL_LAMA === undefined) {
    delete process.env["DATABASE_URL"];
  } else {
    process.env["DATABASE_URL"] = DATABASE_URL_LAMA;
  }
});

describe("endpoint /api/catat ketika basis data SELALU gagal", () => {
  beforeEach(() => {
    process.env["DATABASE_URL"] = "postgres://tiruan-selalu-gagal/db";
  });

  it("tetap membalas 204, tidak pernah melempar, walau connect() gagal", async () => {
    vi.doMock("pg", () => ({
      Client: vi.fn().mockImplementation(() => ({
        connect: vi.fn(async () => {
          throw new Error("ECONNREFUSED tiruan — basis data selalu gagal");
        }),
        query: vi.fn(async () => {
          throw new Error("tidak akan pernah dipanggil karena connect gagal duluan");
        }),
        end: vi.fn(async () => {}),
      })),
    }));
    vi.resetModules();
    const { POST } = await import("../../src/app/api/catat/route");

    const permintaan = new Request("http://localhost/api/catat", {
      method: "POST",
      body: JSON.stringify({
        jalur_masukan: "gambar",
        jumlah_kosong: 5,
        dikoreksi: true,
        dibagikan: false,
        durasi_detik: 30,
      }),
    });

    await expect(POST(permintaan)).resolves.toMatchObject({ status: 204 });
  });

  it("tetap membalas 204 walau query() gagal setelah connect() berhasil", async () => {
    vi.doMock("pg", () => ({
      Client: vi.fn().mockImplementation(() => ({
        connect: vi.fn(async () => {}),
        query: vi.fn(async () => {
          throw new Error("relation \"pemeriksaan\" does not exist — tiruan");
        }),
        end: vi.fn(async () => {}),
      })),
    }));
    vi.resetModules();
    const { POST } = await import("../../src/app/api/catat/route");

    const permintaan = new Request("http://localhost/api/catat", {
      method: "POST",
      body: JSON.stringify({
        jalur_masukan: "manual",
        jumlah_kosong: 0,
        dikoreksi: false,
        dibagikan: false,
        durasi_detik: null,
      }),
    });

    await expect(POST(permintaan)).resolves.toMatchObject({ status: 204 });
  });
});

describe("catat() (src/lib/catat.ts) ketika endpoint/jaringan SELALU gagal", () => {
  it("catat() tidak pernah melempar sinkron, walau fetch menolak", () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("jaringan mati — tiruan"))),
    );

    expect(() =>
      catat({
        jalur_masukan: "manual",
        jumlah_kosong: 2,
        dikoreksi: false,
        dibagikan: true,
        durasi_detik: 5,
      }),
    ).not.toThrow();
  });

  it("catat() tidak pernah melempar walau fetch itu sendiri tidak tersedia", () => {
    vi.stubGlobal("fetch", undefined);

    expect(() =>
      catat({
        jalur_masukan: "gambar",
        jumlah_kosong: 1,
        dikoreksi: true,
        dibagikan: false,
        durasi_detik: null,
      }),
    ).not.toThrow();
  });

  it("penolakan promise dari fetch yang gagal tidak pernah menjadi unhandled rejection", async () => {
    let tertolak = false;
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.reject(new Error("jaringan mati — tiruan")).catch((e: Error) => {
          tertolak = true;
          throw e;
        }),
      ),
    );

    catat({
      jalur_masukan: "manual",
      jumlah_kosong: 7,
      dikoreksi: false,
      dibagikan: false,
      durasi_detik: 99,
    });

    // Beri kesempatan microtask fetch tiruan berjalan sebelum test selesai.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(tertolak).toBe(true);
  });
});

describe("alur inti tetap selesai walau pencatatan dipastikan selalu gagal", () => {
  it("lembar tetap terbit ketika catat() dipanggil di tengah alur dengan jaringan yang selalu gagal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("jaringan mati — tiruan"))),
    );

    const tawaran: Tawaran = {
      sumber: "manual",
      teks: JSON.stringify({ "4": "Operator produksi" }),
    };

    const hasilBaca = await manualProvider.baca(tawaran);
    const hasilFinal: HasilBacaFinal = { nilai: hasilBaca.nilai, ditandaiTidakTahu: [] };
    const penilaian = nilai(hasilFinal, hasilBaca.keyakinan);

    catat({
      jalur_masukan: "manual",
      jumlah_kosong: penilaian.jumlahKosong,
      dikoreksi: false,
      dibagikan: true,
      durasi_detik: 8,
    });

    const isiLembar = rakitIsiLembar({
      penilaian,
      nilaiAsli: hasilFinal.nilai,
      tanggal: new Date().toISOString(),
    });

    expect(isiLembar.blok1.length + isiLembar.blok2.length).toBe(10);
  });
});
