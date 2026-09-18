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
  JUDUL_LEMBAR,
  SUBJUDUL_LEMBAR,
  LABEL_BLOK_1,
  LABEL_BLOK_2_TEMPLAT,
  LABEL_BLOK_3,
  LABEL_SEBAGIAN,
  KALIMAT_PEMBUKA_BLOK_1,
  KALIMAT_PEMBUKA_BLOK_2,
  KALIMAT_PEMBUKA_BLOK_3,
  KALIMAT_BAWAH_BLOK_2,
  PENUTUP_LEMBAR,
} from "../core/teks";
import { isiTemplat } from "../core/perakitan";
import { blokLembar } from "../ui/BlokLembar";
import tailwindConfig from "../../tailwind.config";

const DAFTAR_WARNA = tailwindConfig.theme!.extend!.colors as Record<string, string>;

/** Akses token warna dengan jaminan non-undefined (tsconfig `noUncheckedIndexedAccess`). */
function warna(kunci: string): string {
  const nilai = DAFTAR_WARNA[kunci];
  if (!nilai) {
    throw new Error(`Token warna "${kunci}" tidak ditemukan di tailwind.config.ts`);
  }
  return nilai;
}

/** BLUEPRINT H.9: "lebar render 1080px". */
export const LEBAR_LEMBAR = 1080;

const PADDING_HALAMAN = 56;
const LEBAR_ISI = LEBAR_LEMBAR - PADDING_HALAMAN * 2;

/**
 * Ukuran huruf dalam PIKSEL pada render 1080px lebar. CLAUDE.md bagian 4
 * mewajibkan isi minimal SETARA 14pt. Lembar ini dirancang dipakai penuh
 * lebar layar ponsel (bukan dilihat sekilas sebagai thumbnail) — pada
 * ponsel 5 inci beresolusi ~1080px lebar fisik (DPR umum ±3x), 14pt
 * (≈18,7px CSS) tampil setara ±56px pada render 1080px ini. Nilai di
 * bawah dipilih ≥30px untuk seluruh isi (jauh di atas ambang itu, dengan
 * marjin aman), dan ≥24px untuk teks sekunder (nomor pasal) yang secara
 * eksplisit wajib tetap terbaca (BLUEPRINT H.9, langkah verifikasi S08-8).
 */
export const UKURAN = {
  judul: 52,
  subjudul: 28,
  penandaWaktu: 24,
  labelBlok: 30,
  kalimatPembuka: 26,
  blok1Label: 26,
  blok1Nilai: 30,
  blok2Kalimat: 30,
  dasarHukum: 24,
  kalimatBawahBlok2: 26,
  pertanyaan: 30,
  penutup: 26,
} as const;

const TINGGI_BARIS = 1.4;

/** Batas tampilan nilai tawaran di blok1 — lihat catatan `tinggiLembar`. */
const MAKS_KARAKTER_NILAI = 130;

function potongNilai(nilai: string): string {
  if (nilai.length <= MAKS_KARAKTER_NILAI) {
    return nilai;
  }
  return `${nilai.slice(0, MAKS_KARAKTER_NILAI - 1).trimEnd()}…`;
}

function lencanaSebagian() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: UKURAN.dasarHukum,
        color: warna("tinta-lembut"),
      }}
    >
      <div
        style={{
          display: "flex",
          width: 18,
          height: 18,
          borderRadius: 9,
          backgroundImage: `linear-gradient(90deg, ${warna("tinta-lembut")} 50%, transparent 50%)`,
          border: `1px solid ${warna("tinta-lembut")}`,
        }}
      />
      <span>{LABEL_SEBAGIAN}</span>
    </div>
  );
}

function lingkaranKosong() {
  return (
    <div
      style={{
        display: "flex",
        width: 20,
        height: 20,
        borderRadius: 10,
        border: `2px solid ${warna("redup")}`,
        flexShrink: 0,
      }}
    />
  );
}

function barisBlok1(baris: IsiLembar["blok1"][number]) {
  return (
    <div
      key={baris.slot}
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 24,
        width: "100%",
        padding: "16px 0",
        borderBottom: `1px solid ${warna("garis")}`,
      }}
    >
      <span
        style={{
          display: "flex",
          fontSize: UKURAN.blok1Label,
          color: warna("tinta-lembut"),
          flex: "1 1 0%",
        }}
      >
        {baris.label}
      </span>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
          flex: "1 1 0%",
        }}
      >
        <span
          style={{
            display: "flex",
            fontSize: UKURAN.blok1Nilai,
            fontWeight: 700,
            color: warna("tinta"),
            textAlign: "right",
          }}
        >
          {potongNilai(baris.nilai)}
        </span>
        {baris.keadaan === Keadaan.DISEBUTKAN_SEBAGIAN ? lencanaSebagian() : null}
      </div>
    </div>
  );
}

/**
 * Nomor pasal (`baris.dasarHukum`) ditumpuk DI BAWAH kalimat, bukan
 * disandingkan sejajar di kanan — beberapa slot punya sampai 4 sitasi
 * pasal sekaligus (mis. slot 10: "Pasal 6 ayat (1) huruf m, Pasal 6 ayat
 * (3) huruf c, Pasal 13 huruf g, Pasal 13 huruf h", ~87 karakter), yang
 * akan meluber bila dipaksa satu baris sejajar dengan kalimatnya. Tetap
 * "rata kanan" (BLUEPRINT H.9) — hanya barisnya yang beda, supaya lebar
 * baris SELALU penuh dan dapat diperkirakan tingginya dengan aman
 * (lihat `tinggiLembar`), apa pun jumlah sitasi pasalnya.
 */
function barisBlok2(baris: IsiLembar["blok2"][number]) {
  return (
    <div
      key={baris.slot}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: warna("latar-kosong"),
        padding: "20px 24px",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 16, width: "100%" }}>
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
          marginTop: 8,
        }}
      >
        {baris.dasarHukum.join(", ")}
      </span>
    </div>
  );
}

export function elemenLembar(isiLembar: IsiLembar) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: LEBAR_LEMBAR,
        backgroundColor: warna("kertas"),
        fontFamily: "sans-serif",
        borderRadius: 0,
      }}
    >
      {/* 1. Kepala — BLUEPRINT H.9 butir 1 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          backgroundColor: warna("tinta"),
          padding: `40px ${PADDING_HALAMAN}px`,
          gap: 10,
        }}
      >
        <span style={{ display: "flex", fontSize: UKURAN.judul, fontWeight: 700, color: warna("kertas") }}>
          {JUDUL_LEMBAR}
        </span>
        <span style={{ display: "flex", fontSize: UKURAN.subjudul, color: warna("garis") }}>
          {SUBJUDUL_LEMBAR}
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

      {/* 2. Blok 1 — sudah disebutkan */}
      {blokLembar({
        labelTeks: LABEL_BLOK_1,
        warnaLatarLabel: warna("latar-blok"),
        warnaTeksLabel: warna("tinta-lembut"),
        ukuranLabel: UKURAN.labelBlok,
        children: (
          <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 0 }}>
            <span
              style={{
                display: "flex",
                fontSize: UKURAN.kalimatPembuka,
                color: warna("tinta-lembut"),
                marginBottom: 16,
              }}
            >
              {KALIMAT_PEMBUKA_BLOK_1}
            </span>
            {isiLembar.blok1.map((baris) => barisBlok1(baris))}
          </div>
        ),
      })}

      {/* 3. Garis pemisah */}
      <div style={{ display: "flex", width: "100%", height: 1, backgroundColor: warna("garis") }} />

      {/* 4. Blok 2 — belum dijawab */}
      {blokLembar({
        labelTeks: isiTemplat(LABEL_BLOK_2_TEMPLAT, { n: String(isiLembar.blok2.length) }),
        warnaLatarLabel: warna("tinta-lembut"),
        warnaTeksLabel: warna("kertas"),
        ukuranLabel: UKURAN.labelBlok,
        children: (
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <span
              style={{
                display: "flex",
                fontSize: UKURAN.kalimatPembuka,
                color: warna("redup"),
                marginBottom: 16,
              }}
            >
              {KALIMAT_PEMBUKA_BLOK_2}
            </span>
            {isiLembar.blok2.map((baris) => barisBlok2(baris))}
            {/* 5. Kalimat "belum disebutkan bukan berarti tidak ada" */}
            <span
              style={{
                display: "flex",
                fontSize: UKURAN.kalimatBawahBlok2,
                fontStyle: "italic",
                color: warna("redup"),
                marginTop: 8,
              }}
            >
              {KALIMAT_BAWAH_BLOK_2}
            </span>
          </div>
        ),
      })}

      {/* 7. Blok 3 — pertanyaan */}
      {blokLembar({
        labelTeks: LABEL_BLOK_3,
        warnaLatarLabel: warna("latar-blok"),
        warnaTeksLabel: warna("tinta-lembut"),
        ukuranLabel: UKURAN.labelBlok,
        children: (
          <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
            <span
              style={{
                display: "flex",
                fontSize: UKURAN.kalimatPembuka,
                color: warna("tinta-lembut"),
                marginBottom: 16,
              }}
            >
              {KALIMAT_PEMBUKA_BLOK_3}
            </span>
            {isiLembar.pertanyaan.map((pertanyaan, indeks) => (
              <span
                key={indeks}
                style={{
                  display: "flex",
                  fontSize: UKURAN.pertanyaan,
                  color: warna("tinta"),
                  marginBottom: 14,
                }}
              >
                {`${indeks + 1}. ${pertanyaan}`}
              </span>
            ))}
          </div>
        ),
      })}

      {/* 8. Kaki — kalimat penutup wajib, SELALU tercetak apa pun hasilnya */}
      <div
        style={{
          display: "flex",
          width: "100%",
          backgroundColor: warna("latar-blok"),
          padding: `28px ${PADDING_HALAMAN}px`,
        }}
      >
        <span style={{ display: "flex", fontSize: UKURAN.penutup, color: warna("tinta-lembut") }}>
          {PENUTUP_LEMBAR}
        </span>
      </div>
    </div>
  );
}

/**
 * Rasio lebar-per-karakter untuk Noto Sans Regular (font bawaan
 * `next/og`, dibuktikan tanpa perlu memuat font sendiri — lihat komentar
 * berkas). Dipilih 0,62 (bukan rata-rata literal glyph Latin ±0,5-0,55)
 * SENGAJA lebih besar dari perkiraan "wajar", karena pembungkusan kata
 * (word-wrap) selalu menyisakan spasi kosong di ujung baris — perkiraan
 * berbasis pembagian lebar/lebar-karakter akan selalu MELEBIH-LEBIHKAN
 * jumlah karakter yang benar-benar muat per baris bila rasionya terlalu
 * kecil. Dikalibrasi empiris terhadap render sungguhan (skrip sekali
 * pakai, dibuang), lihat PROGRESS.md.
 */
const RASIO_LEBAR_KARAKTER = 0.62;

function estimasiJumlahBaris(teks: string, ukuranFont: number, lebarTersedia: number): number {
  const perkiraanLebarKarakter = ukuranFont * RASIO_LEBAR_KARAKTER;
  const karakterPerBaris = Math.max(8, Math.floor(lebarTersedia / perkiraanLebarKarakter));
  return Math.max(1, Math.ceil(teks.length / karakterPerBaris));
}

function tinggiTeks(teks: string, ukuranFont: number, lebarTersedia: number): number {
  return estimasiJumlahBaris(teks, ukuranFont, lebarTersedia) * ukuranFont * TINGGI_BARIS;
}

// Geometri berikut HARUS tetap sinkron dengan style di `elemenLembar`,
// `barisBlok1`, `barisBlok2`, dan `blokLembar` — bila salah satu style
// itu berubah, sesuaikan juga konstanta di sini.
const PADDING_LABEL_BLOK_VERTIKAL = 20;
const PADDING_ISI_BLOK_VERTIKAL = 28;
const LEBAR_ISI_BLOK = LEBAR_ISI; // blokLembar: padding horizontal 56px, sama seperti PADDING_HALAMAN

const BLOK1_PADDING_BARIS_VERTIKAL = 16;
const BLOK1_GAP_KOLOM = 24;
const BLOK1_LEBAR_KOLOM = (LEBAR_ISI_BLOK - BLOK1_GAP_KOLOM) / 2;

const BLOK2_PADDING_HORIZONTAL = 24;
const BLOK2_PADDING_VERTIKAL = 20;
const BLOK2_MARGIN_BAWAH = 12;
const BLOK2_LEBAR_BARIS = LEBAR_ISI_BLOK - BLOK2_PADDING_HORIZONTAL * 2;
const BLOK2_LEBAR_KALIMAT = BLOK2_LEBAR_BARIS - 20 - 16; // dikurangi lingkaran + gap

function tinggiBarisBlok1(baris: IsiLembar["blok1"][number]): number {
  const tinggiLabel = tinggiTeks(baris.label, UKURAN.blok1Label, BLOK1_LEBAR_KOLOM);
  const nilaiDipotong = potongNilai(baris.nilai);
  let tinggiKolomKanan = tinggiTeks(nilaiDipotong, UKURAN.blok1Nilai, BLOK1_LEBAR_KOLOM);
  if (baris.keadaan === Keadaan.DISEBUTKAN_SEBAGIAN) {
    tinggiKolomKanan += 8 + UKURAN.dasarHukum * TINGGI_BARIS; // gap + baris lencana
  }
  return BLOK1_PADDING_BARIS_VERTIKAL * 2 + Math.max(tinggiLabel, tinggiKolomKanan);
}

function tinggiBarisBlok2(baris: IsiLembar["blok2"][number]): number {
  const tinggiKalimat = tinggiTeks(baris.kalimat, UKURAN.blok2Kalimat, BLOK2_LEBAR_KALIMAT);
  const tinggiPasal = tinggiTeks(baris.dasarHukum.join(", "), UKURAN.dasarHukum, BLOK2_LEBAR_BARIS);
  return (
    BLOK2_PADDING_VERTIKAL * 2 +
    Math.max(20, tinggiKalimat) + // 20 = tinggi lingkaran kosong
    8 + // marginTop sebelum baris pasal
    tinggiPasal +
    BLOK2_MARGIN_BAWAH
  );
}

/**
 * Menghitung tinggi render yang dibutuhkan SEBELUM memanggil `ImageResponse`
 * — Satori/`next/og` TIDAK mendukung tinggi otomatis mengikuti konten
 * (dibuktikan lewat percobaan manual: tanpa `height` eksplisit, hasilnya
 * diam-diam terpotong pada tinggi bawaan 630px). Perkiraan ini SENGAJA
 * konservatif (melebih-lebihkan — dikalibrasi lewat perbandingan terhadap
 * render sungguhan, lihat PROGRESS.md), supaya bila meleset, arahnya
 * adalah ruang kosong tambahan di bawah — BUKAN kalimat penutup wajib
 * terpotong. Nilai `nilai` di blok1 dipotong `MAKS_KARAKTER_NILAI` (lihat
 * `potongNilai`) justru supaya tinggi baris blok1 punya batas atas yang
 * pasti walau pengguna menempelkan teks yang sangat panjang ke satu
 * keterangan.
 */
export function tinggiLembar(isiLembar: IsiLembar): number {
  let tinggi = 0;

  // Kepala
  tinggi +=
    40 * 2 +
    UKURAN.judul * TINGGI_BARIS +
    10 +
    UKURAN.subjudul * TINGGI_BARIS +
    10 +
    UKURAN.penandaWaktu * TINGGI_BARIS;

  // Blok 1
  tinggi += PADDING_LABEL_BLOK_VERTIKAL * 2 + UKURAN.labelBlok * TINGGI_BARIS; // label bar
  tinggi += PADDING_ISI_BLOK_VERTIKAL * 2; // padding isi
  tinggi += tinggiTeks(KALIMAT_PEMBUKA_BLOK_1, UKURAN.kalimatPembuka, LEBAR_ISI_BLOK) + 16;
  for (const baris of isiLembar.blok1) {
    tinggi += tinggiBarisBlok1(baris);
  }

  // Garis pemisah
  tinggi += 1;

  // Blok 2
  tinggi += PADDING_LABEL_BLOK_VERTIKAL * 2 + UKURAN.labelBlok * TINGGI_BARIS;
  tinggi += PADDING_ISI_BLOK_VERTIKAL * 2;
  tinggi += tinggiTeks(KALIMAT_PEMBUKA_BLOK_2, UKURAN.kalimatPembuka, LEBAR_ISI_BLOK) + 16;
  for (const baris of isiLembar.blok2) {
    tinggi += tinggiBarisBlok2(baris);
  }
  tinggi += tinggiTeks(KALIMAT_BAWAH_BLOK_2, UKURAN.kalimatBawahBlok2, LEBAR_ISI_BLOK) + 8;

  // Blok 3
  tinggi += PADDING_LABEL_BLOK_VERTIKAL * 2 + UKURAN.labelBlok * TINGGI_BARIS;
  tinggi += PADDING_ISI_BLOK_VERTIKAL * 2;
  tinggi += tinggiTeks(KALIMAT_PEMBUKA_BLOK_3, UKURAN.kalimatPembuka, LEBAR_ISI_BLOK) + 16;
  for (const [indeks, pertanyaan] of isiLembar.pertanyaan.entries()) {
    tinggi += tinggiTeks(`${indeks + 1}. ${pertanyaan}`, UKURAN.pertanyaan, LEBAR_ISI_BLOK) + 14;
  }

  // Kaki
  tinggi += 28 * 2 + tinggiTeks(PENUTUP_LEMBAR, UKURAN.penutup, LEBAR_ISI);

  // Marjin aman tambahan — lihat catatan di atas.
  const MARJIN_AMAN = 160;
  return Math.ceil(tinggi + MARJIN_AMAN);
}
