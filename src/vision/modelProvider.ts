/**
 * Implementasi `Pembaca` lewat panggilan API model penglihatan.
 *
 * TEPAT SATU panggilan `fetch` per pemeriksaan — satu di sini, tidak ada
 * panggilan kedua untuk memperbaiki atau menyimpulkan apa pun (CLAUDE.md
 * §3.3). Prompt di `promptEkstraksi.ts` melarang model memberi kesimpulan,
 * penilaian, saran, atau peringatan; `validasi.ts` membuang keluaran yang
 * tetap memuat itu.
 *
 * Memakai `fetch` bawaan (bukan `@anthropic-ai/sdk`) SENGAJA: menambah
 * dependensi berarti mengubah `package.json`, yang di tabel kepemilikan
 * berkas `TASKS.md` adalah milik Window 1, dan daftar berkas yang boleh
 * disentuh sprint ini tidak menyertakannya. Dicatat di PROGRESS.md sebagai
 * keputusan sadar, bukan kelalaian — bukan preferensi umum untuk proyek
 * lain.
 *
 * Gambar diproses di memori (base64 di badan permintaan) dan tidak pernah
 * ditulis ke disk atau penyimpanan mana pun (CLAUDE.md §3.5).
 *
 * `src/vision` hanya mengimpor TIPE dari `src/core` di berkas ini — kode
 * galat (`KodeGalat`) SENGAJA tidak diimpor sebagai nilai di sini.
 * Kegagalan disinyalkan lewat `GalatModelProvider` yang bertipe lokal
 * (`AlasanKegagalanModel`), dan pemetaannya ke `KodeGalat` + `ResponsGalat`
 * dilakukan di `src/app/api/baca/route.ts` — berkas itu berada di
 * `src/app`, yang memang boleh mengimpor nilai dari `src/core`.
 */

import type { HasilBaca, Tawaran } from "../core/tipe";
import type { SlotId } from "../core/slot";
import type { Pembaca } from "./pembaca";
import { PROMPT_EKSTRAKSI } from "./promptEkstraksi";
import { validasiKeluaranModel } from "./validasi";

/** Delapan cara kegagalan dari prompt sprint S06, dipetakan 1:1 ke sini. */
export type AlasanKegagalanModel =
  | "kunci-tidak-ada"
  | "format-tidak-didukung"
  | "panggilan-gagal"
  | "batas-waktu"
  | "struktur-tak-terduga"
  | "keluaran-kosong";

export class GalatModelProvider extends Error {
  constructor(
    readonly alasan: AlasanKegagalanModel,
    pesan: string,
  ) {
    super(pesan);
    this.name = "GalatModelProvider";
  }
}

const ENDPOINT_MODEL = "https://api.anthropic.com/v1/messages";
const VERSI_API_MODEL = "2023-06-01";

/**
 * Nilai bawaan bila `MODEL_NAMA` kosong (lihat README.md § variabel
 * lingkungan). Dipilih model paling mampu per pedoman tim — tugas ekstraksi
 * ini sederhana (baca gambar jadi data), tetapi kesalahan baca menular ke
 * seluruh penilaian, jadi keakuratan lebih diutamakan daripada biaya.
 * Ganti lewat `MODEL_NAMA` tanpa mengubah kode bila tim memutuskan
 * sebaliknya setelah melihat hasil uji sepuluh poster (lihat PROGRESS.md).
 */
const MODEL_DEFAULT = "claude-opus-5";

/**
 * 20 detik. Fungsi Vercel punya batas eksekusi; nilai ini dipilih supaya
 * kegagalan model tidak membuat pengguna menunggu tanpa kepastian, dan
 * tetap memberi ruang wajar untuk satu panggilan vision request.
 */
const BATAS_WAKTU_MS = 20_000;

const TIPE_GAMBAR_DIDUKUNG: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const URUTAN_SLOT: readonly SlotId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

async function blobKeBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

function ambilTeksDariResponsModel(json: unknown): string | null {
  if (typeof json !== "object" || json === null) {
    return null;
  }
  const content = (json as Record<string, unknown>)["content"];
  if (!Array.isArray(content)) {
    return null;
  }
  for (const blok of content) {
    if (
      typeof blok === "object" &&
      blok !== null &&
      (blok as Record<string, unknown>)["type"] === "text" &&
      typeof (blok as Record<string, unknown>)["text"] === "string"
    ) {
      return (blok as Record<string, unknown>)["text"] as string;
    }
  }
  return null;
}

/** Membuang pagar blok kode markdown ```json ... ``` bila model tetap menambahkannya. */
function uraiJsonKeluaranModel(teksMentah: string): unknown {
  const bersih = teksMentah
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(bersih);
}

export const modelProvider: Pembaca = {
  async baca(tawaran: Tawaran): Promise<HasilBaca> {
    const kunciApi = process.env["MODEL_API_KEY"];
    if (typeof kunciApi !== "string" || kunciApi.trim().length === 0) {
      throw new GalatModelProvider("kunci-tidak-ada", "MODEL_API_KEY tidak diisi.");
    }

    const berkas = tawaran.berkas;
    if (!berkas) {
      throw new GalatModelProvider(
        "format-tidak-didukung",
        "Tawaran tidak menyertakan berkas gambar.",
      );
    }

    const tipeMime = berkas.type;
    if (!TIPE_GAMBAR_DIDUKUNG.has(tipeMime)) {
      throw new GalatModelProvider(
        "format-tidak-didukung",
        `Tipe berkas "${tipeMime || "(tidak diketahui)"}" tidak didukung.`,
      );
    }

    const base64 = await blobKeBase64(berkas);
    const namaModel = process.env["MODEL_NAMA"]?.trim() || MODEL_DEFAULT;

    const pengontrol = new AbortController();
    const pewaktu = setTimeout(() => pengontrol.abort(), BATAS_WAKTU_MS);

    let responsMentah: Response;
    try {
      responsMentah = await fetch(ENDPOINT_MODEL, {
        method: "POST",
        headers: {
          "x-api-key": kunciApi,
          "anthropic-version": VERSI_API_MODEL,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: namaModel,
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "base64", media_type: tipeMime, data: base64 },
                },
                { type: "text", text: PROMPT_EKSTRAKSI },
              ],
            },
          ],
        }),
        signal: pengontrol.signal,
      });
    } catch (kesalahan) {
      if (kesalahan instanceof Error && kesalahan.name === "AbortError") {
        throw new GalatModelProvider("batas-waktu", "Panggilan model melewati batas waktu.");
      }
      const pesan = kesalahan instanceof Error ? kesalahan.message : String(kesalahan);
      throw new GalatModelProvider("panggilan-gagal", `Panggilan model gagal: ${pesan}`);
    } finally {
      clearTimeout(pewaktu);
    }

    if (!responsMentah.ok) {
      throw new GalatModelProvider(
        "panggilan-gagal",
        `Model mengembalikan status HTTP ${responsMentah.status}.`,
      );
    }

    let json: unknown;
    try {
      json = await responsMentah.json();
    } catch {
      throw new GalatModelProvider(
        "panggilan-gagal",
        "Respons model tidak dapat diuraikan sebagai JSON.",
      );
    }

    const teksModel = ambilTeksDariResponsModel(json);
    if (teksModel === null) {
      throw new GalatModelProvider(
        "struktur-tak-terduga",
        "Respons model tidak memuat blok teks yang diharapkan.",
      );
    }

    let keluaranTerurai: unknown;
    try {
      keluaranTerurai = uraiJsonKeluaranModel(teksModel);
    } catch {
      throw new GalatModelProvider(
        "struktur-tak-terduga",
        "Keluaran model bukan JSON yang dapat diuraikan.",
      );
    }

    const hasilValidasi = validasiKeluaranModel(keluaranTerurai);
    if (!hasilValidasi.valid) {
      throw new GalatModelProvider(
        "struktur-tak-terduga",
        "Bentuk keluaran model tidak sesuai skema yang diharapkan.",
      );
    }

    const semuaKosong = URUTAN_SLOT.every((id) => hasilValidasi.hasil.nilai[id] === null);
    if (semuaKosong) {
      throw new GalatModelProvider(
        "keluaran-kosong",
        "Tidak ada keterangan yang berhasil diekstraksi dari gambar.",
      );
    }

    return hasilValidasi.hasil;
  },
};
