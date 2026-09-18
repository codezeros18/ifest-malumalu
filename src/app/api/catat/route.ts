/**
 * Pencatatan metrik anonim — satu-satunya tempat yang menulis ke basis
 * data (README.md § peta berkas). Fire-and-forget MURNI (CLAUDE.md §3.5):
 * kegagalan apa pun di sini DITELAN dan TIDAK PERNAH dilaporkan sebagai
 * galat berarti ke pemanggil. Endpoint ini SELALU membalas 204, apa pun
 * yang terjadi di dalamnya — badan permintaan tidak bisa dibaca, basis
 * data mati, kredensial salah, tabel belum ada, apa pun. Satu-satunya
 * yang boleh berbeda adalah SEBERAPA CEPAT ia membalas, tidak pernah
 * APAKAH ia membalas.
 *
 * Bila `DATABASE_URL` kosong, pencatatan dilewati diam-diam — tidak pernah
 * mencoba tersambung sama sekali (CLAUDE.md §3.5, BLUEPRINT G.1).
 *
 * Tepat SATU kueri langsung, tanpa ORM (CLAUDE.md bagian 5). Hanya membaca
 * kelima kunci yang dikenal dari badan permintaan (`waktu` diisi bawaan
 * basis data lewat `DEFAULT now()` di skema, tidak pernah dikirim klien) —
 * kunci lain pada badan permintaan, apa pun namanya, DIABAIKAN. Ini bukan
 * sekadar validasi tipe, ini pagar privasi: tidak ada jalur bagi kolom
 * yang tidak dikenal untuk pernah sampai ke kueri SQL.
 */

import { NextResponse } from "next/server";
import { Client } from "pg";

// `pg` memakai koneksi TCP — bukan edge.
export const runtime = "nodejs";

interface BadanPencatatan {
  readonly jalur_masukan: "gambar" | "manual";
  readonly jumlah_kosong: number;
  readonly dikoreksi: boolean;
  readonly dibagikan: boolean;
  readonly durasi_detik: number | null;
}

function responsSelaluBerhasil(): NextResponse {
  // 204: sengaja tanpa badan. Pemanggil (src/lib/catat.ts) tidak pernah
  // membaca maupun menunggu isi respons ini secara berarti.
  return new NextResponse(null, { status: 204 });
}

function uraiBadanPencatatan(mentah: unknown): BadanPencatatan | null {
  if (typeof mentah !== "object" || mentah === null) {
    return null;
  }

  const objek = mentah as Record<string, unknown>;

  const jalurMasukan = objek["jalur_masukan"];
  if (jalurMasukan !== "gambar" && jalurMasukan !== "manual") {
    return null;
  }

  const jumlahKosong = objek["jumlah_kosong"];
  if (typeof jumlahKosong !== "number" || !Number.isInteger(jumlahKosong)) {
    return null;
  }

  const dikoreksi = objek["dikoreksi"];
  if (typeof dikoreksi !== "boolean") {
    return null;
  }

  const dibagikan = objek["dibagikan"];
  if (typeof dibagikan !== "boolean") {
    return null;
  }

  const durasiDetikMentah = objek["durasi_detik"];
  const durasiDetik = typeof durasiDetikMentah === "number" ? durasiDetikMentah : null;

  // Dibentuk ulang field demi field — kunci lain apa pun pada `objek`
  // (mis. "nama_perusahaan") berhenti di sini, tidak pernah ikut terbawa.
  return {
    jalur_masukan: jalurMasukan,
    jumlah_kosong: jumlahKosong,
    dikoreksi,
    dibagikan,
    durasi_detik: durasiDetik,
  };
}

function perluSsl(databaseUrl: string): boolean {
  return !/localhost|127\.0\.0\.1/.test(databaseUrl);
}

export async function POST(request: Request): Promise<Response> {
  let mentah: unknown;
  try {
    mentah = await request.json();
  } catch {
    return responsSelaluBerhasil();
  }

  const badan = uraiBadanPencatatan(mentah);
  if (!badan) {
    return responsSelaluBerhasil();
  }

  const databaseUrl = process.env["DATABASE_URL"];
  if (typeof databaseUrl !== "string" || databaseUrl.trim().length === 0) {
    // Dilewati diam-diam — bukan kegagalan, ini keadaan yang didukung penuh.
    return responsSelaluBerhasil();
  }

  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5_000,
    ssl: perluSsl(databaseUrl) ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    await client.query(
      `INSERT INTO pemeriksaan (jalur_masukan, jumlah_kosong, dikoreksi, dibagikan, durasi_detik)
       VALUES ($1, $2, $3, $4, $5)`,
      [badan.jalur_masukan, badan.jumlah_kosong, badan.dikoreksi, badan.dibagikan, badan.durasi_detik],
    );
  } catch {
    // fire-and-forget: basis data mati, tabel belum ada, kredensial salah —
    // semuanya ditelan di sini, tidak pernah naik ke pemanggil.
  } finally {
    await client.end().catch(() => {});
  }

  return responsSelaluBerhasil();
}
