/**
 * Satu-satunya endpoint yang merender `IsiLembar` menjadi gambar PNG.
 *
 * Menerima `IsiLembar` (dirakit di `src/app/periksa/page.tsx` lewat
 * `rakitIsiLembar`, S04) sebagai JSON, mengembalikan `image/png`. Tidak
 * ada apa pun yang ditulis ke disk atau penyimpanan mana pun (CLAUDE.md
 * §3.5) — gambar dibentuk di memori proses ini dan langsung dikirim.
 *
 * Berkas ini ada di `src/app`, sehingga BOLEH mengimpor dari `src/core`
 * dan `src/lib` (BLUEPRINT G.4).
 */

import { NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import type { IsiLembar } from "@/core/tipe";
import { kamusLembarUntuk } from "@/core/teksJawa";
import { elemenLembar, LEBAR_LEMBAR, tinggiLembar } from "@/lib/renderLembar";

// Perlu API Node lengkap (dipakai next/og secara internal) — bukan edge.
export const runtime = "nodejs";

/**
 * Batas atas yang PERSIS sama dengan bentuk sah `IsiLembar` (10 keterangan,
 * 7 pertanyaan). Tanpa ini, klien dapat mengirim `blok1` berisi ribuan baris
 * dan `tinggiLembar` meledak → OOM. `Array.isArray` saja tidak cukup: itu
 * hanya memeriksa jenis, bukan ukuran.
 */
const MAKS_BARIS = 10;
const MAKS_PERTANYAAN = 7;
const MAKS_PANJANG_TEKS = 2_000;

function teksPendek(nilai: unknown): boolean {
  return typeof nilai === "string" && nilai.length <= MAKS_PANJANG_TEKS;
}

/** Baris blok1 punya `label`; baris blok2 punya `kalimat`. Keduanya punya `slot`. */
function barisValid(baris: unknown): boolean {
  if (typeof baris !== "object" || baris === null) {
    return false;
  }
  const o = baris as Record<string, unknown>;
  if (typeof o["slot"] !== "number") {
    return false;
  }
  return teksPendek(o["label"]) || teksPendek(o["kalimat"]);
}

function isiLembarValid(nilai: unknown): nilai is IsiLembar {
  if (typeof nilai !== "object" || nilai === null) {
    return false;
  }
  const objek = nilai as Record<string, unknown>;
  const blok1 = objek["blok1"];
  const blok2 = objek["blok2"];
  const pertanyaan = objek["pertanyaan"];

  return (
    Array.isArray(blok1) &&
    blok1.length <= MAKS_BARIS &&
    blok1.every(barisValid) &&
    Array.isArray(blok2) &&
    blok2.length <= MAKS_BARIS &&
    blok2.every(barisValid) &&
    Array.isArray(pertanyaan) &&
    pertanyaan.length <= MAKS_PERTANYAAN &&
    pertanyaan.every(teksPendek) &&
    teksPendek(objek["tanggal"])
  );
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ pesan: "Permintaan tidak dapat dibaca." }, { status: 400 });
  }

  const isiLembar = (body as { isiLembar?: unknown } | null)?.isiLembar;
  if (!isiLembarValid(isiLembar)) {
    return NextResponse.json({ pesan: "Data lembar tidak lengkap." }, { status: 400 });
  }

  // Bahasa gambar mengikuti bahasa antarmuka saat lembar diterbitkan; apa pun
  // selain "jv" jatuh ke Indonesia (bawaan), jadi permintaan lama tanpa medan
  // ini tidak berubah perilakunya.
  const bahasa =
    (body as { bahasa?: unknown } | null)?.bahasa === "jv" ? "jv" : "id";
  const kamus = kamusLembarUntuk(bahasa);

  return new ImageResponse(elemenLembar(isiLembar, kamus), {
    width: LEBAR_LEMBAR,
    // Batas keras kedua setelah `isiLembarValid`: walau validasi lolos,
    // jangan pernah meminta Satori merender kanvas absurd (jaga-jaga bila
    // bentuk sah berubah tanpa memperbarui pagar). 20.000px jauh di atas
    // tinggi nyata (kasus penuh ~4.000px).
    height: Math.min(20_000, Math.max(1, tinggiLembar(isiLembar, kamus))),
  });
}
