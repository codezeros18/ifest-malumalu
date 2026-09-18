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
import { elemenLembar, LEBAR_LEMBAR, tinggiLembar } from "@/lib/renderLembar";

// Perlu API Node lengkap (dipakai next/og secara internal) — bukan edge.
export const runtime = "nodejs";

function isiLembarValid(nilai: unknown): nilai is IsiLembar {
  if (typeof nilai !== "object" || nilai === null) {
    return false;
  }
  const objek = nilai as Record<string, unknown>;
  return (
    Array.isArray(objek["blok1"]) &&
    Array.isArray(objek["blok2"]) &&
    Array.isArray(objek["pertanyaan"]) &&
    typeof objek["tanggal"] === "string"
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

  return new ImageResponse(elemenLembar(isiLembar), {
    width: LEBAR_LEMBAR,
    height: tinggiLembar(isiLembar),
  });
}
