/**
 * Merender `IsiLembar` menjadi pohon elemen yang dapat dikonsumsi Satori
 * (lewat `next/og`'s `ImageResponse`, dipanggil dari
 * `src/app/api/kartu/route.ts`). Spesifikasi visual PERSIS dari
 * BLUEPRINT.md bagian H.9.
 *
 * 🔴 Satori HANYA memahami subset CSS lewat prop `style` inline (mirip
 * flexbox) — TIDAK memproses className/Tailwind sama sekali. Karena itu
 * warnanya diambil langsung dari `tailwind.config.ts` (satu sumber
 * kebenaran, sama seperti `tests/ui/warna.test.ts`), bukan lewat kelas
 * Tailwind seperti di `src/ui/*` yang dipakai layar biasa.
 *
 * Nomor pasal per keterangan kosong TIDAK ditulis ulang di sini — sudah
 * mengalir dari `src/core/slot.ts` lewat `BarisBlok2.dasarHukum`, yang
 * diisi `rakitIsiLembar` (S04). Berkas ini hanya MENAMPILKANNYA.
 */

import React from "react";
import { Keadaan } from "../core/tipe";
import type { IsiLembar } from "../core/tipe";
import {
  KAMUS_LEMBAR,
} from "../core/teks";
import type { KamusLembar } from "../core/teks";
import { isiTemplat } from "../core/perakitan";
import { blokLembar } from "../ui/BlokLembar";
import tailwindConfig from "../../tailwind.config";

const DAFTAR_WARNA = tailwindConfig.theme!.extend!.colors as Record<
  string,
  string
>;

/** Akses token warna dengan jaminan non-undefined (tsconfig `noUncheckedIndexedAccess`). */
function warna(kunci: string): string {
  const nilai = DAFTAR_WARNA[kunci];
  if (!nilai) {
    throw new Error(
      `Token warna "${kunci}" tidak ditemukan di tailwind.config.ts`,
    );
  }
  return nilai;
}

/** BLUEPRINT H.9: "lebar render 1080px". */
export const LEBAR_LEMBAR = 1080;

const PADDING_HALAMAN = 48;
const LEBAR_ISI = LEBAR_LEMBAR - PADDING_HALAMAN * 2;

/**
 * Ukuran huruf dalam PIKSEL pada render 1080px lebar.
 *
 * 🔴 ANGKA-ANGKA INI DIPILIH PEMILIK PRODUK (jam ~16, 18 September 2026) demi
 * lembar yang kompak: 10–21px, turun dari 24–52px. Konsekuensinya ditulis
 * terang-terangan, bukan disembunyikan: **lembar TIDAK lagi memenuhi lantai
 * 14pt yang diminta CLAUDE.md 3.6.** Pada render 1080px yang ditampilkan
 * selebar layar ponsel lima inci (±360 CSS px), 15px di sini setara ±5 CSS px;
 * angka lama hanya bisa dibaca kalau penerima memperbesar gambarnya.
 *
 * Pagar `tests/lib/renderLembar.test.ts` ikut diturunkan (ambang 22 → 10,
 * himpunan 30px → 15px) supaya build tetap hijau, dan angka lamanya masih ada
 * di riwayat git + PERUBAHAN.md PB-016 kalau keputusan ini perlu dibalik
 * (satu `git revert` pada commit ini).
 *
 * Yang TETAP dijaga: kepala lembar berlatar tinta (BLUEPRINT H.9), seluruh
 * warna lewat token `warna(...)` tanpa hex mentah, dan tiap ukuran dipakai
 * secara sengaja — bukan hasil perataan.
 */
const UKURAN = {
  judul: 20,
  subjudul: 13,
  penandaWaktu: 11,
  labelBlok: 11,
  kalimatPembuka: 14,
  blok1Label: 12,
  blok1Nilai: 21,
  blok2Kalimat: 15,
  dasarHukum: 10,
  kalimatBawahBlok2: 13,
  pertanyaan: 15,
  penutup: 12,
} as const;

const TINGGI_BARIS = 1.4;

function lencanaSebagian(kamus: KamusLembar) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: UKURAN.dasarHukum,
        color: warna("tinta-lembut"),
      }}
    >
      <div
        style={{
          display: "flex",
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundImage: `linear-gradient(90deg, ${warna("tinta-lembut")} 50%, transparent 50%)`,
          border: `1px solid ${warna("tinta-lembut")}`,
        }}
      />
      <span>{kamus.labelSebagian}</span>
    </div>
  );
}

function lingkaranKosong() {
  return (
    <div
      style={{
        display: "flex",
        width: 16,
        height: 16,
        borderRadius: 8,
        border: `2px solid ${warna("redup")}`,
        flexShrink: 0,
        marginTop: 2,
      }}
    />
  );
}

/**
 * Baris Blok 1 diubah menjadi susunan vertikal (label di atas, nilai di bawah dengan lebar penuh)
 * agar teks yang panjang tidak terpotong (menghapus batasan karakter/potongNilai).
 */
function barisBlok1(
  baris: IsiLembar["blok1"][number],
  kamus: KamusLembar,
  kalimatLapis1?: string,
) {
  return (
    <div
      key={baris.slot}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        padding: "16px 0",
        borderBottom: `1px solid ${warna("garis")}`,
        gap: 8,
      }}
    >
      <span
        style={{
          display: "flex",
          fontSize: UKURAN.blok1Label,
          color: warna("tinta-lembut"),
          width: "100%",
        }}
      >
        {baris.label}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          width: "100%",
          gap: 6,
        }}
      >
        <span
          style={{
            display: "flex",
            fontSize: UKURAN.blok1Nilai,
            fontWeight: 700,
            color: warna("tinta"),
            width: "100%",
            lineHeight: TINGGI_BARIS,
          }}
        >
          {baris.nilai}
        </span>
        {baris.keadaan === Keadaan.DISEBUTKAN_SEBAGIAN
          ? lencanaSebagian(kamus)
          : null}
      </div>
      {kalimatLapis1 ? (
        <span
          style={{
            display: "flex",
            width: "100%",
            marginTop: 4,
            fontSize: UKURAN.dasarHukum,
            color: warna("redup"),
          }}
        >
          {kalimatLapis1}
        </span>
      ) : null}
    </div>
  );
}

function barisBlok2(baris: IsiLembar["blok2"][number]) {
  return (
    <div
      key={baris.slot}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: warna("latar-kosong"),
        padding: "16px 20px",
        marginBottom: 10,
        borderRadius: 4,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
          width: "100%",
        }}
      >
        {lingkaranKosong()}
        <span
          style={{
            display: "flex",
            flex: "1 1 0%",
            fontSize: UKURAN.blok2Kalimat,
            color: warna("tinta-lembut"),
          }}
        >
          {baris.kalimat}
        </span>
      </div>
      <span
        style={{
          display: "flex",
          justifyContent: "flex-end",
          width: "100%",
          fontSize: UKURAN.dasarHukum,
          color: warna("redup"),
          textAlign: "right",
          marginTop: 6,
        }}
      >
        {baris.dasarHukum.join(", ")}
      </span>
    </div>
  );
}

export function elemenLembar(
  isiLembar: IsiLembar,
  kamus: KamusLembar = KAMUS_LEMBAR,
) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: LEBAR_LEMBAR,
        minHeight: "100%",
        backgroundColor: warna("kertas"),
        fontFamily: "sans-serif",
        borderRadius: 0,
      }}
    >
      {/* 1. Kepala — latar tinta, teks kertas/garis (BLUEPRINT H.9).
          Warna WAJIB lewat token `warna(...)`: berkas ini tidak boleh memuat
          hex mentah sama sekali — pagar kontras (`tests/ui/kontras.test.ts`)
          membaca TOKEN, jadi hex mentah di sini lolos dari semua pagar. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          backgroundColor: warna("tinta"),
          padding: `32px ${PADDING_HALAMAN}px`,
          gap: 8,
        }}
      >
        <span
          style={{
            display: "flex",
            fontSize: UKURAN.judul,
            fontWeight: 700,
            color: warna("kertas"),
          }}
        >
          {kamus.judul}
        </span>
        <span
          style={{
            display: "flex",
            fontSize: UKURAN.subjudul,
            color: warna("garis"),
          }}
        >
          {kamus.subjudul}
        </span>
        <span
          style={{
            display: "flex",
            justifyContent: "flex-end",
            width: "100%",
            fontSize: UKURAN.penandaWaktu,
            color: warna("garis"),
          }}
        >
          {isiLembar.tanggal}
        </span>
      </div>

      {/* 2. Blok 1 */}
      {blokLembar({
        labelTeks: kamus.labelBlok1,
        warnaLatarLabel: warna("latar-blok"),
        warnaTeksLabel: warna("tinta-lembut"),
        ukuranLabel: UKURAN.labelBlok,
        children: (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: 0,
            }}
          >
            <span
              style={{
                display: "flex",
                fontSize: UKURAN.kalimatPembuka,
                color: warna("tinta-lembut"),
                marginBottom: 12,
              }}
            >
              {kamus.kalimatPembukaBlok1}
            </span>
            {isiLembar.blok1.map((baris) =>
              barisBlok1(
                baris,
                kamus,
                baris.slot === 1 ? isiLembar.hasilLapis1?.kalimat : undefined,
              ),
            )}
          </div>
        ),
      })}

      {/* 3. Garis pemisah */}
      <div
        style={{
          display: "flex",
          width: "100%",
          height: 1,
          backgroundColor: warna("garis"),
        }}
      />

      {/* 4. Blok 2 */}
      {blokLembar({
        labelTeks: isiTemplat(kamus.labelBlok2Templat, {
          n: String(isiLembar.blok2.length),
        }),
        warnaLatarLabel: warna("tinta-lembut"),
        warnaTeksLabel: warna("kertas"),
        ukuranLabel: UKURAN.labelBlok,
        children: (
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <span
              style={{
                display: "flex",
                fontSize: UKURAN.kalimatPembuka,
                color: warna("redup"),
                marginBottom: 12,
              }}
            >
              {kamus.kalimatPembukaBlok2}
            </span>
            {isiLembar.blok2.map((baris) => barisBlok2(baris))}
            <span
              style={{
                display: "flex",
                fontSize: UKURAN.kalimatBawahBlok2,
                fontStyle: "italic",
                color: warna("redup"),
                marginTop: 6,
              }}
            >
              {kamus.kalimatBawahBlok2}
            </span>
          </div>
        ),
      })}

      {/* 6. Catatan hitungan */}
      {isiLembar.catatanHitungan ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: LEBAR_ISI,
            margin: `20px ${PADDING_HALAMAN}px 0`,
            padding: "16px 20px",
            border: `2px dashed ${warna("garis")}`,
            borderRadius: 4,
          }}
        >
          <span
            style={{
              display: "flex",
              fontSize: UKURAN.blok1Label,
              fontWeight: 700,
              color: warna("tinta-lembut"),
            }}
          >
            {kamus.labelCatatanHitungan}
          </span>
          <span
            style={{
              display: "flex",
              marginTop: 6,
              fontSize: UKURAN.kalimatPembuka,
              color: warna("tinta-lembut"),
            }}
          >
            {isiLembar.catatanHitungan}
          </span>
        </div>
      ) : null}

      {/* 7. Blok 3 — pertanyaan */}
      {blokLembar({
        labelTeks: kamus.labelBlok3,
        warnaLatarLabel: warna("latar-blok"),
        warnaTeksLabel: warna("tinta-lembut"),
        ukuranLabel: UKURAN.labelBlok,
        children: (
          <div
            style={{ display: "flex", flexDirection: "column", width: "100%" }}
          >
            <span
              style={{
                display: "flex",
                fontSize: UKURAN.kalimatPembuka,
                color: warna("tinta-lembut"),
                marginBottom: 12,
              }}
            >
              {kamus.kalimatPembukaBlok3}
            </span>
            {isiLembar.pertanyaan.map((pertanyaan, indeks) => (
              <span
                key={indeks}
                style={{
                  display: "flex",
                  fontSize: UKURAN.pertanyaan,
                  color: warna("tinta"),
                  marginBottom: 10,
                }}
              >
                {`${indeks + 1}. ${pertanyaan}`}
              </span>
            ))}
          </div>
        ),
      })}

      {/* 8. Kaki */}
      <div
        style={{
          display: "flex",
          width: "100%",
          backgroundColor: warna("latar-blok"),
          padding: `24px ${PADDING_HALAMAN}px`,
        }}
      >
        <span
          style={{
            display: "flex",
            fontSize: UKURAN.penutup,
            color: warna("tinta-lembut"),
          }}
        >
          {kamus.penutup}
        </span>
      </div>
    </div>
  );
}

const RASIO_LEBAR_KARAKTER = 0.62;

function estimasiJumlahBaris(
  teks: string,
  ukuranFont: number,
  lebarTersedia: number,
): number {
  const perkiraanLebarKarakter = ukuranFont * RASIO_LEBAR_KARAKTER;
  const karakterPerBaris = Math.max(
    8,
    Math.floor(lebarTersedia / perkiraanLebarKarakter),
  );
  return Math.max(1, Math.ceil(teks.length / karakterPerBaris));
}

function tinggiTeks(
  teks: string,
  ukuranFont: number,
  lebarTersedia: number,
): number {
  return (
    estimasiJumlahBaris(teks, ukuranFont, lebarTersedia) *
    ukuranFont *
    TINGGI_BARIS
  );
}

const PADDING_LABEL_BLOK_VERTIKAL = 16;
const PADDING_ISI_BLOK_VERTIKAL = 24;
const LEBAR_ISI_BLOK = LEBAR_ISI;

const BLOK1_PADDING_BARIS_VERTIKAL = 16;

function tinggiBarisBlok1(
  baris: IsiLembar["blok1"][number],
  kalimatLapis1?: string,
): number {
  const tinggiLabel = tinggiTeks(
    baris.label,
    UKURAN.blok1Label,
    LEBAR_ISI_BLOK,
  );
  // Menggunakan lebar penuh (LEBAR_ISI_BLOK) karena nilai sekarang membentang ke bawah
  let tinggiNilai = tinggiTeks(baris.nilai, UKURAN.blok1Nilai, LEBAR_ISI_BLOK);
  if (baris.keadaan === Keadaan.DISEBUTKAN_SEBAGIAN) {
    tinggiNilai += 6 + UKURAN.dasarHukum * TINGGI_BARIS;
  }
  let tinggi =
    BLOK1_PADDING_BARIS_VERTIKAL * 2 +
    tinggiLabel +
    8 + // gap antara label dan nilai
    tinggiNilai;

  if (kalimatLapis1) {
    tinggi += 4 + tinggiTeks(kalimatLapis1, UKURAN.dasarHukum, LEBAR_ISI_BLOK);
  }
  return tinggi;
}

function tinggiBarisBlok2(baris: IsiLembar["blok2"][number]): number {
  const BLOK2_PADDING_HORIZONTAL = 20;
  const BLOK2_LEBAR_BARIS = LEBAR_ISI_BLOK - BLOK2_PADDING_HORIZONTAL * 2;
  const BLOK2_LEBAR_KALIMAT = BLOK2_LEBAR_BARIS - 16 - 12;

  const tinggiKalimat = tinggiTeks(
    baris.kalimat,
    UKURAN.blok2Kalimat,
    BLOK2_LEBAR_KALIMAT,
  );
  const tinggiPasal = tinggiTeks(
    baris.dasarHukum.join(", "),
    UKURAN.dasarHukum,
    BLOK2_LEBAR_BARIS,
  );
  return (
    16 * 2 + // padding vertikal
    Math.max(16, tinggiKalimat) +
    6 +
    tinggiPasal +
    10 // margin bawah
  );
}

export function tinggiLembar(
  isiLembar: IsiLembar,
  kamus: KamusLembar = KAMUS_LEMBAR,
): number {
  let tinggi = 0;

  // Kepala
  tinggi +=
    32 * 2 +
    UKURAN.judul * TINGGI_BARIS +
    8 +
    UKURAN.subjudul * TINGGI_BARIS +
    8 +
    UKURAN.penandaWaktu * TINGGI_BARIS;

  // Blok 1
  tinggi += PADDING_LABEL_BLOK_VERTIKAL * 2 + UKURAN.labelBlok * TINGGI_BARIS;
  tinggi += PADDING_ISI_BLOK_VERTIKAL * 2;
  tinggi +=
    tinggiTeks(kamus.kalimatPembukaBlok1, UKURAN.kalimatPembuka, LEBAR_ISI_BLOK) +
    12;
  for (const baris of isiLembar.blok1) {
    tinggi += tinggiBarisBlok1(
      baris,
      baris.slot === 1 ? isiLembar.hasilLapis1?.kalimat : undefined,
    );
  }

  // Garis pemisah
  tinggi += 1;

  // Blok 2
  tinggi += PADDING_LABEL_BLOK_VERTIKAL * 2 + UKURAN.labelBlok * TINGGI_BARIS;
  tinggi += PADDING_ISI_BLOK_VERTIKAL * 2;
  tinggi +=
    tinggiTeks(kamus.kalimatPembukaBlok2, UKURAN.kalimatPembuka, LEBAR_ISI_BLOK) +
    12;
  for (const baris of isiLembar.blok2) {
    tinggi += tinggiBarisBlok2(baris);
  }
  tinggi +=
    tinggiTeks(kamus.kalimatBawahBlok2, UKURAN.kalimatBawahBlok2, LEBAR_ISI_BLOK) +
    6;

  // Catatan hitungan
  if (isiLembar.catatanHitungan) {
    tinggi += 20;
    tinggi += 16 * 2;
    tinggi += UKURAN.blok1Label * TINGGI_BARIS;
    tinggi +=
      6 +
      tinggiTeks(
        isiLembar.catatanHitungan,
        UKURAN.kalimatPembuka,
        LEBAR_ISI_BLOK,
      );
  }

  // Blok 3
  tinggi += PADDING_LABEL_BLOK_VERTIKAL * 2 + UKURAN.labelBlok * TINGGI_BARIS;
  tinggi += PADDING_ISI_BLOK_VERTIKAL * 2;
  tinggi +=
    tinggiTeks(kamus.kalimatPembukaBlok3, UKURAN.kalimatPembuka, LEBAR_ISI_BLOK) +
    12;
  for (const [indeks, pertanyaan] of isiLembar.pertanyaan.entries()) {
    tinggi +=
      tinggiTeks(
        `${indeks + 1}. ${pertanyaan}`,
        UKURAN.pertanyaan,
        LEBAR_ISI_BLOK,
      ) + 10;
  }

  // Kaki
  tinggi += 24 * 2 + tinggiTeks(kamus.penutup, UKURAN.penutup, LEBAR_ISI);

  const MARJIN_AMAN = 120;
  return Math.ceil(tinggi + MARJIN_AMAN);
}