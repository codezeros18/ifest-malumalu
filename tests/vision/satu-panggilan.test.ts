import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Tawaran } from "../../src/core/tipe";
import { SLOT_IDS } from "../../src/core/slot";
import { GalatModelProvider, modelProvider } from "../../src/vision/modelProvider";

/**
 * S06-5: TEPAT SATU panggilan model per pemeriksaan — bukan satu per
 * keterangan, bukan satu panggilan pembacaan lalu satu panggilan
 * perbaikan (CLAUDE.md §3.3). Berkas ini juga menguji kedelapan cara
 * kegagalan yang wajib ditangani, masing-masing berujung pada
 * `GalatModelProvider` (dipetakan ke `KodeGalat` di `route.ts`), TIDAK
 * PERNAH pada crash atau hang tanpa hasil.
 */

const KUNCI_LAMA = process.env["MODEL_API_KEY"];
const NAMA_LAMA = process.env["MODEL_NAMA"];

function tawaranGambar(tipe = "image/png"): Tawaran {
  return {
    sumber: "gambar",
    berkas: new Blob([new Uint8Array([1, 2, 3, 4])], { type: tipe }),
  };
}

function responsModelBerhasil(teksJson: string): Response {
  return new Response(
    JSON.stringify({ content: [{ type: "text", text: teksJson }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function jsonPenuhValid(): string {
  const nilai: Record<string, string> = {};
  const keyakinan: Record<string, number> = {};
  for (const id of SLOT_IDS) {
    nilai[String(id)] = `nilai ${id}`;
    keyakinan[String(id)] = 0.9;
  }
  return JSON.stringify({ nilai, keyakinan });
}

beforeEach(() => {
  process.env["MODEL_API_KEY"] = "kunci-uji-tidak-nyata";
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (KUNCI_LAMA === undefined) {
    delete process.env["MODEL_API_KEY"];
  } else {
    process.env["MODEL_API_KEY"] = KUNCI_LAMA;
  }
  if (NAMA_LAMA === undefined) {
    delete process.env["MODEL_NAMA"];
  } else {
    process.env["MODEL_NAMA"] = NAMA_LAMA;
  }
});

describe("modelProvider — tepat satu panggilan model per pemeriksaan", () => {
  it("memanggil fetch TEPAT SATU KALI pada pembacaan yang berhasil", async () => {
    const fetchTiruan = vi.fn(async () => responsModelBerhasil(jsonPenuhValid()));
    vi.stubGlobal("fetch", fetchTiruan);

    const hasil = await modelProvider.baca(tawaranGambar());

    expect(fetchTiruan).toHaveBeenCalledTimes(1);
    expect(hasil.nilai[1]).toBe("nilai 1");
  });

  it("memanggil fetch TEPAT SATU KALI walau keluaran model gagal divalidasi — tidak ada percobaan ulang otomatis", async () => {
    const fetchTiruan = vi.fn(async () => responsModelBerhasil("bukan json { { {"));
    vi.stubGlobal("fetch", fetchTiruan);

    await expect(modelProvider.baca(tawaranGambar())).rejects.toThrow(GalatModelProvider);
    expect(fetchTiruan).toHaveBeenCalledTimes(1);
  });

  it("tidak memanggil fetch sama sekali bila MODEL_API_KEY kosong", async () => {
    delete process.env["MODEL_API_KEY"];
    const fetchTiruan = vi.fn();
    vi.stubGlobal("fetch", fetchTiruan);

    await expect(modelProvider.baca(tawaranGambar())).rejects.toMatchObject({
      alasan: "kunci-tidak-ada",
    });
    expect(fetchTiruan).not.toHaveBeenCalled();
  });
});

describe("modelProvider — delapan cara kegagalan, masing-masing berujung GalatModelProvider", () => {
  it("MODEL_API_KEY tidak ada → alasan kunci-tidak-ada", async () => {
    delete process.env["MODEL_API_KEY"];
    await expect(modelProvider.baca(tawaranGambar())).rejects.toMatchObject({
      alasan: "kunci-tidak-ada",
    });
  });

  it("format berkas tidak didukung → alasan format-tidak-didukung", async () => {
    const fetchTiruan = vi.fn();
    vi.stubGlobal("fetch", fetchTiruan);

    await expect(modelProvider.baca(tawaranGambar("application/pdf"))).rejects.toMatchObject({
      alasan: "format-tidak-didukung",
    });
    expect(fetchTiruan).not.toHaveBeenCalled();
  });

  it("tawaran tanpa berkas sama sekali → alasan format-tidak-didukung, tidak crash", async () => {
    const tawaran: Tawaran = { sumber: "gambar" };
    await expect(modelProvider.baca(tawaran)).rejects.toMatchObject({
      alasan: "format-tidak-didukung",
    });
  });

  it("panggilan gagal (fetch melempar) → alasan panggilan-gagal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNRESET tiruan");
      }),
    );

    await expect(modelProvider.baca(tawaranGambar())).rejects.toMatchObject({
      alasan: "panggilan-gagal",
    });
  });

  it("panggilan mengembalikan status non-2xx → alasan panggilan-gagal", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Internal Server Error", { status: 500 })),
    );

    await expect(modelProvider.baca(tawaranGambar())).rejects.toMatchObject({
      alasan: "panggilan-gagal",
    });
  });

  it("panggilan melewati batas waktu (AbortError) → alasan batas-waktu", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, opsi: { signal?: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          opsi.signal?.addEventListener("abort", () => {
            const galat = new Error("Aborted");
            galat.name = "AbortError";
            reject(galat);
          });
        });
      }),
    );

    // Pernyataan `.rejects` dipasang SEBELUM timer dimajukan, supaya promise
    // sudah punya penangan saat penolakannya terjadi — memajukan dulu baru
    // memasang assertion membuat penolakannya sempat tanpa penangan
    // (unhandled rejection) walau test tetap lulus.
    const janji = modelProvider.baca(tawaranGambar());
    const pernyataan = expect(janji).rejects.toMatchObject({ alasan: "batas-waktu" });
    await vi.advanceTimersByTimeAsync(25_000);
    await pernyataan;
    vi.useRealTimers();
  });

  it("keluaran bukan struktur yang diharapkan (bukan JSON) → alasan struktur-tak-terduga", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => responsModelBerhasil("ini bukan JSON sama sekali")));

    await expect(modelProvider.baca(tawaranGambar())).rejects.toMatchObject({
      alasan: "struktur-tak-terduga",
    });
  });

  it("respons model tanpa blok teks sama sekali → alasan struktur-tak-terduga", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ content: [] }), { status: 200 })),
    );

    await expect(modelProvider.baca(tawaranGambar())).rejects.toMatchObject({
      alasan: "struktur-tak-terduga",
    });
  });

  it("keluaran kosong (seluruh nilai null) → alasan keluaran-kosong", async () => {
    const nilai: Record<string, null> = {};
    const keyakinan: Record<string, number> = {};
    for (const id of SLOT_IDS) {
      nilai[String(id)] = null;
      keyakinan[String(id)] = 0;
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => responsModelBerhasil(JSON.stringify({ nilai, keyakinan }))),
    );

    await expect(modelProvider.baca(tawaranGambar())).rejects.toMatchObject({
      alasan: "keluaran-kosong",
    });
  });

  it("model mengembalikan penilaian di SEMUA kolom (bukan data) → tervalidasi jadi kosong semua → alasan keluaran-kosong", async () => {
    const nilai: Record<string, string> = {};
    const keyakinan: Record<string, number> = {};
    for (const id of SLOT_IDS) {
      nilai[String(id)] = "tawaran ini mencurigakan dan sebaiknya dihindari";
      keyakinan[String(id)] = 0.95;
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => responsModelBerhasil(JSON.stringify({ nilai, keyakinan }))),
    );

    await expect(modelProvider.baca(tawaranGambar())).rejects.toMatchObject({
      alasan: "keluaran-kosong",
    });
  });

  it("model membungkus JSON dalam pagar kode markdown — tetap berhasil diuraikan", async () => {
    const teksBerpagar = "```json\n" + jsonPenuhValid() + "\n```";
    vi.stubGlobal("fetch", vi.fn(async () => responsModelBerhasil(teksBerpagar)));

    const hasil = await modelProvider.baca(tawaranGambar());
    expect(hasil.nilai[1]).toBe("nilai 1");
  });
});
