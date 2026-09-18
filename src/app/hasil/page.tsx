"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import LembarPratinjau from "../../ui/LembarPratinjau";
import SitusNavbar from "../../ui/SitusNavbar";
import SitusFooter from "../../ui/SitusFooter";
import { ambilHasilSementara } from "../../lib/hasilSementara";
import type { HasilSementara, LembarTerbit } from "../../lib/hasilSementara";
import { isiTemplat } from "../../core/perakitan";
import { TOMBOL_UNDUH, TOMBOL_BAGIKAN, TOMBOL_UNDUH_PDF } from "../../core/teks";
import type { KamusLembar } from "../../core/teks";
import {
  kamusLembarUntuk,
  TOMBOL_UNDUH_JAWA,
  TOMBOL_BAGIKAN_JAWA,
  TOMBOL_UNDUH_PDF_JAWA,
} from "../../core/teksJawa";

const NAMA_BERKAS_LEMBAR = "lembar-janji.png";
const NAMA_BERKAS_LEMBAR_PDF = "lembar-janji.pdf";

/**
 * Ukuran kertas PDF mengikuti rasio gambar lembar apa adanya (bukan
 * dipotong/diregangkan ke A4 baku) — lebar tetap 210mm (lebar A4), tinggi
 * menyesuaikan supaya gambar tidak terdistorsi.
 */
const LEBAR_PDF_MM = 210;

/**
 * Teks alternatif gambar lembar (dibaca pembaca layar). Memakai kamus yang
 * sama dengan gambar dan pratinjaunya supaya tidak pernah berbeda bahasa.
 */
function teksAlternatifGambarLembar(
  lembar: LembarTerbit,
  kamus: KamusLembar,
): string {
  return `${isiTemplat(kamus.labelBlok2Templat, { n: String(lembar.isiLembar.blok2.length) })}. ${kamus.penutup}`;
}

function urlKeBlob(url: string): Promise<Blob> {
  if (url.startsWith("data:")) {
    const bagian = url.split(",");
    const header = bagian[0] ?? "";
    const mentah = bagian[1] ?? "";
    const cocokTipe = /:(.*?);/.exec(header);
    const tipe = cocokTipe?.[1] ?? "image/png";
    const bstr = atob(mentah);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      u8arr[i] = bstr.charCodeAt(i);
    }
    return Promise.resolve(new Blob([u8arr], { type: tipe }));
  }
  return fetch(url).then((r) => r.blob());
}

/**
 * S13: layar hasil terpisah dari layar koreksi (`/periksa`) — 3 layar
 * total (`/`, `/periksa`, `/hasil`), masih dalam batas §4 "maks 3 layar".
 * Data lewat `src/lib/hasilSementara.ts` (singleton di memori tab, bukan
 * storage) — bila kosong (mis. `/hasil` dimuat ulang langsung), tidak ada
 * apa pun untuk ditampilkan, jadi diarahkan balik ke `/` alih-alih
 * menampilkan layar kosong atau membangun ulang penilaian dari draf
 * (yang akan melanggar S07-8: penilaian wajib lewat layar koreksi).
 */
export default function HalamanHasil() {
  const router = useRouter();
  const [hasil, setHasil] = useState<HasilSementara | null>(null);
  const [bahasa, setBahasa] = useState<"id" | "jv">("id");

  useEffect(() => {
    const simpanan = localStorage.getItem("lembar_janji_bahasa");
    if (simpanan === "jv" || simpanan === "id") {
      setBahasa(simpanan);
    }
  }, []);

  const pilihBahasa = (baru: "id" | "jv") => {
    setBahasa(baru);
    localStorage.setItem("lembar_janji_bahasa", baru);
  };

  // Lembar yang terbit disimpan dalam KEDUA bahasa (`perBahasa`, lihat
  // `src/lib/hasilSementara.ts`) — jadi berpindah bahasa di layar ini hanya
  // menukar gambar/pratinjau yang sudah siap, bukan merender ulang.
  const kamusLembar = kamusLembarUntuk(bahasa);
  const lembar = hasil === null ? null : hasil.perBahasa[bahasa];

  useEffect(() => {
    const tersimpan = ambilHasilSementara();
    if (!tersimpan) {
      router.replace("/");
      return;
    }
    setHasil(tersimpan);
  }, [router]);

  function tanganiUnduh() {
    if (!lembar?.urlGambarLembar) return;
    const tautan = document.createElement("a");
    tautan.href = lembar.urlGambarLembar;
    tautan.download = NAMA_BERKAS_LEMBAR;
    tautan.click();
  }

  async function tanganiBagikan() {
    if (!lembar?.urlGambarLembar) return;
    try {
      const blob = await urlKeBlob(lembar.urlGambarLembar);
      const berkas = new File([blob], NAMA_BERKAS_LEMBAR, {
        type: "image/png",
      });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [berkas] })
      ) {
        await navigator.share({ files: [berkas] });
        return;
      }
    } catch {
      // Jatuh ke unduh di bawah — termasuk bila pengguna membatalkan berbagi.
    }
    tanganiUnduh();
  }

  /**
   * Fitur TAMBAHAN (bukan pengganti gambar) — BLUEPRINT/CLAUDE.md tetap
   * mewajibkan lembar berbentuk gambar sebagai format utama agar dapat
   * diteruskan lewat percakapan (§5). PDF ini cuma membungkus PNG yang
   * sama persis apa adanya, dihasilkan sepenuhnya di peramban (tidak
   * menyentuh server, tidak ada penyimpanan objek) — sejalan CLAUDE.md
   * §3.5. Tidak menyelesaikan blur (raster yang sama), hanya kemudahan
   * simpan/bagikan dalam format lain.
   */
  async function tanganiUnduhPdf() {
    if (!lembar?.urlGambarLembar) return;
    try {
      const gambar = new window.Image();
      gambar.src = lembar.urlGambarLembar;
      await new Promise<void>((resolve, reject) => {
        gambar.onload = () => resolve();
        gambar.onerror = () => reject(new Error("gagal"));
      });

      // jsPDF tidak mempertahankan kompresi PNG asli — menempelkan data URL
      // PNG apa adanya pernah menghasilkan berkas puluhan MB dari sumber
      // ~0,5 MB (diverifikasi manual). Dikonversi ke JPEG kualitas tinggi
      // lewat kanvas dulu; latar diisi putih karena JPEG tidak punya alfa.
      const kanvas = document.createElement("canvas");
      kanvas.width = gambar.naturalWidth;
      kanvas.height = gambar.naturalHeight;
      const konteks = kanvas.getContext("2d");
      if (!konteks) return;
      konteks.fillStyle = "#ffffff";
      konteks.fillRect(0, 0, kanvas.width, kanvas.height);
      konteks.drawImage(gambar, 0, 0);
      const dataUrlJpeg = kanvas.toDataURL("image/jpeg", 0.9);

      const tinggiMm = (gambar.naturalHeight / gambar.naturalWidth) * LEBAR_PDF_MM;
      const dok = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [LEBAR_PDF_MM, tinggiMm],
      });
      dok.addImage(dataUrlJpeg, "JPEG", 0, 0, LEBAR_PDF_MM, tinggiMm);
      dok.save(NAMA_BERKAS_LEMBAR_PDF);
    } catch {
      // Diam-diam gagal — tombol gambar (wajib) tetap berfungsi normal.
      // PDF murni tambahan, kegagalannya tidak boleh mengganggu alur inti.
    }
  }

  if (!hasil || !lembar) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f2f6ff] text-[#0b1220]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "linear-gradient(#d9e4fb 1px, transparent 1px), linear-gradient(90deg, #d9e4fb 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(120% 80% at 20% 10%, #000 40%, transparent 80%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-[#fac10b]/25 blur-[120px]"
      />

      <SitusNavbar bahasa={bahasa} onPilihBahasa={pilihBahasa} />

      <main
        aria-live="polite"
        className="relative z-10 mx-auto flex w-full flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10 lg:px-44"
      >
        {/* S09: catatan Lapis 1/2 saat dimatikan/data kurang — selalu
            ditampilkan ke pengguna di layar, terlepas dari jalur gambar
            atau teks di bawahnya, karena keduanya tidak memuat kalimat
            ini (H.9 hanya menaruh kotak catatan hitungan saat aktif dan
            cukup). Abu netral, tanpa ikon peringatan. */}
        {lembar.catatanLapis1 ? (
          <p className="text-base text-[#52586b]">{lembar.catatanLapis1}</p>
        ) : null}
        {lembar.catatanLapis2 ? (
          <p className="text-base text-[#52586b]">{lembar.catatanLapis2}</p>
        ) : null}

        <div className="rounded-3xl border border-[#dbe4fb] bg-white p-5 shadow-[0_24px_60px_-30px_rgba(9,85,212,0.45)] sm:p-8">
          {lembar.urlGambarLembar ? (
            <div className="flex flex-col gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob/data URL sisi klien, bukan aset next/image */}
              <img
                src={lembar.urlGambarLembar}
                alt={teksAlternatifGambarLembar(lembar, kamusLembar)}
                className="w-full rounded-2xl border border-[#dbe4fb] shadow-lg"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={tanganiUnduh}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0955d4] px-6 py-4 text-[16px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(9,85,212,0.8)] transition-transform hover:-translate-y-0.5 hover:bg-[#0a4bbb]"
                >
                  {bahasa === "jv" ? TOMBOL_UNDUH_JAWA : TOMBOL_UNDUH}
                </button>
                <button
                  type="button"
                  onClick={tanganiBagikan}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ffc508] px-6 py-4 text-[16px] font-bold text-white shadow-[0_14px_30px_-12px_#FFD346] transition-transform hover:-translate-y-0.5 hover:bg-[#ffc400]"
                >
                  {bahasa === "jv" ? TOMBOL_BAGIKAN_JAWA : TOMBOL_BAGIKAN}
                </button>
                <button
                  type="button"
                  onClick={tanganiUnduhPdf}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#dbe4fb] bg-white px-6 py-4 text-[16px] font-bold text-[#0955d4] transition-transform hover:-translate-y-0.5 hover:bg-[#f2f6ff]"
                >
                  {bahasa === "jv" ? TOMBOL_UNDUH_PDF_JAWA : TOMBOL_UNDUH_PDF}
                </button>
              </div>
            </div>
          ) : (
            <LembarPratinjau isiLembar={lembar.isiLembar} kamus={kamusLembar} />
          )}
        </div>
      </main>

      <SitusFooter bahasa={bahasa} />
    </div>
  );
}
