/**
 * Satu-satunya endpoint yang memanggil model (README.md § peta berkas).
 *
 * Menerima satu berkas gambar (`multipart/form-data`, kunci "berkas"),
 * memvalidasi ukuran dan format SEBELUM memanggil model (CLAUDE.md bagian 4
 * — "Ukuran berkas unggahan: maksimal 8 MB, ditegakkan di endpoint"), lalu
 * meneruskannya ke `modelProvider`. Gambar hanya ada di memori proses ini —
 * tidak pernah ditulis ke disk atau penyimpanan mana pun (CLAUDE.md §3.5).
 *
 * Berkas ini ada di `src/app`, sehingga BOLEH mengimpor nilai dari
 * `src/core` (lihat BLUEPRINT G.4) — beda dengan `src/vision`, yang hanya
 * boleh mengimpor tipenya. Karena itu pemetaan dari alasan kegagalan lokal
 * `src/vision` (`AlasanKegagalanModel`) ke `KodeGalat` dan `PESAN_GALAT`
 * (keduanya dari `src/core`) dilakukan DI SINI, bukan di `modelProvider.ts`.
 */

import { NextResponse } from "next/server";
import { KodeGalat } from "@/core/galat";
import type { ResponsGalat } from "@/core/galat";
import type { HasilBaca, Tawaran } from "@/core/tipe";
import { PESAN_GALAT } from "@/core/teks";
import { GalatModelProvider, modelProvider } from "@/vision/modelProvider";
import type { AlasanKegagalanModel } from "@/vision/modelProvider";

// Perlu Buffer (dipakai modelProvider) dan File/FormData Node — bukan edge.
export const runtime = "nodejs";

/** CLAUDE.md bagian 4: "Ukuran berkas unggahan: maksimal 8 MB". */
const BATAS_UKURAN_BYTE = 8 * 1024 * 1024;

const TIPE_GAMBAR_DIDUKUNG: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Status HTTP dipilih agar mesin (klien) dapat membedakan kelasnya, tetapi
 * PESAN yang dilihat pengguna selalu dari `PESAN_GALAT` di `teks.ts` —
 * tidak ada satu kalimat pun ditulis di berkas ini.
 */
const PEMETAAN_ALASAN_MODEL: Readonly<
  Record<AlasanKegagalanModel, { readonly kode: KodeGalat; readonly status: number }>
> = {
  "kunci-tidak-ada": { kode: KodeGalat.E_MODEL_TIDAK_TERSEDIA, status: 503 },
  "format-tidak-didukung": { kode: KodeGalat.E_FORMAT_TIDAK_DIDUKUNG, status: 415 },
  "panggilan-gagal": { kode: KodeGalat.E_PEMBACAAN_GAGAL, status: 502 },
  "batas-waktu": { kode: KodeGalat.E_PEMBACAAN_GAGAL, status: 504 },
  "struktur-tak-terduga": { kode: KodeGalat.E_PEMBACAAN_GAGAL, status: 502 },
  "keluaran-kosong": { kode: KodeGalat.E_PEMBACAAN_KOSONG, status: 422 },
};

function responsGalat(kode: KodeGalat, status: number): NextResponse<ResponsGalat> {
  const { pesan, tindakan } = PESAN_GALAT[kode];
  const body: ResponsGalat = { kode, pesan, tindakan };
  return NextResponse.json(body, { status });
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return responsGalat(KodeGalat.E_TIDAK_ADA_MASUKAN, 400);
  }

  const berkas = formData.get("berkas");
  if (!(berkas instanceof Blob) || berkas.size === 0) {
    return responsGalat(KodeGalat.E_TIDAK_ADA_MASUKAN, 400);
  }

  if (berkas.size > BATAS_UKURAN_BYTE) {
    return responsGalat(KodeGalat.E_GAMBAR_TERLALU_BESAR, 413);
  }

  if (!TIPE_GAMBAR_DIDUKUNG.has(berkas.type)) {
    return responsGalat(KodeGalat.E_FORMAT_TIDAK_DIDUKUNG, 415);
  }

  const tawaran: Tawaran = { sumber: "gambar", berkas };

  let hasil: HasilBaca;
  try {
    hasil = await modelProvider.baca(tawaran);
  } catch (kesalahan) {
    if (kesalahan instanceof GalatModelProvider) {
      console.error(`[api/baca] GalatModelProvider (${kesalahan.alasan}):`, kesalahan.message);
      const { kode, status } = PEMETAAN_ALASAN_MODEL[kesalahan.alasan];
      return responsGalat(kode, status);
    }
    console.error("[api/baca] Galat tak terduga:", kesalahan);
    return responsGalat(KodeGalat.E_PEMBACAAN_GAGAL, 500);
  }

  return NextResponse.json(hasil satisfies HasilBaca, { status: 200 });
}
