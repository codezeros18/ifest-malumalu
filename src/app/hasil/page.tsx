"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LembarPratinjau from "../../ui/LembarPratinjau";
import SitusNavbar from "../../ui/SitusNavbar";
import SitusFooter from "../../ui/SitusFooter";
import { ambilHasilSementara } from "../../lib/hasilSementara";
import type { HasilSementara } from "../../lib/hasilSementara";
import { isiTemplat } from "../../core/perakitan";
import {
  TOMBOL_UNDUH,
  TOMBOL_BAGIKAN,
  LABEL_BLOK_2_TEMPLAT,
  PENUTUP_LEMBAR,
} from "../../core/teks";
import { TOMBOL_UNDUH_JAWA, TOMBOL_BAGIKAN_JAWA } from "../../core/teksJawa";

const NAMA_BERKAS_LEMBAR = "lembar-janji.png";

function teksAlternatifGambarLembar(hasil: HasilSementara): string {
  return `${isiTemplat(LABEL_BLOK_2_TEMPLAT, { n: String(hasil.isiLembar.blok2.length) })}. ${PENUTUP_LEMBAR}`;
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

  const gantiBahasa = () => {
    setBahasa((sebelumnya) => {
      const baru = sebelumnya === "id" ? "jv" : "id";
      localStorage.setItem("lembar_janji_bahasa", baru);
      return baru;
    });
  };

  useEffect(() => {
    const tersimpan = ambilHasilSementara();
    if (!tersimpan) {
      router.replace("/");
      return;
    }
    setHasil(tersimpan);
  }, [router]);

  function tanganiUnduh() {
    if (!hasil?.urlGambarLembar) return;
    const tautan = document.createElement("a");
    tautan.href = hasil.urlGambarLembar;
    tautan.download = NAMA_BERKAS_LEMBAR;
    tautan.click();
  }

  async function tanganiBagikan() {
    if (!hasil?.urlGambarLembar) return;
    try {
      const blob = await urlKeBlob(hasil.urlGambarLembar);
      const berkas = new File([blob], NAMA_BERKAS_LEMBAR, { type: "image/png" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [berkas] })) {
        await navigator.share({ files: [berkas] });
        return;
      }
    } catch {
      // Jatuh ke unduh di bawah — termasuk bila pengguna membatalkan berbagi.
    }
    tanganiUnduh();
  }

  if (!hasil) {
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
          maskImage: "radial-gradient(120% 80% at 20% 10%, #000 40%, transparent 80%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-[#fac10b]/25 blur-[120px]"
      />

      <SitusNavbar bahasa={bahasa} onGantiBahasa={gantiBahasa} />

      <main
        aria-live="polite"
        className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 sm:py-10 lg:px-14"
      >
        {/* S09: catatan Lapis 1/2 saat dimatikan/data kurang — selalu
            ditampilkan ke pengguna di layar, terlepas dari jalur gambar
            atau teks di bawahnya, karena keduanya tidak memuat kalimat
            ini (H.9 hanya menaruh kotak catatan hitungan saat aktif dan
            cukup). Abu netral, tanpa ikon peringatan. */}
        {hasil.catatanLapis1 ? (
          <p className="text-base text-[#52586b]">{hasil.catatanLapis1}</p>
        ) : null}
        {hasil.catatanLapis2 ? (
          <p className="text-base text-[#52586b]">{hasil.catatanLapis2}</p>
        ) : null}

        <div className="rounded-3xl border border-[#dbe4fb] bg-white p-5 shadow-[0_24px_60px_-30px_rgba(9,85,212,0.45)] sm:p-8">
          {hasil.urlGambarLembar ? (
            <div className="flex flex-col gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob/data URL sisi klien, bukan aset next/image */}
              <img
                src={hasil.urlGambarLembar}
                alt={teksAlternatifGambarLembar(hasil)}
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
              </div>
            </div>
          ) : (
            <LembarPratinjau isiLembar={hasil.isiLembar} />
          )}
        </div>
      </main>

      <SitusFooter bahasa={bahasa} />
    </div>
  );
}
