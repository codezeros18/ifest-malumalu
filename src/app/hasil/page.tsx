"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Tombol from "../../ui/Tombol";
import LembarPratinjau from "../../ui/LembarPratinjau";
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
    <main className="min-h-screen bg-gradient-to-b from-latar-kosong via-kertas to-kertas">
      <div aria-hidden="true" className="fixed inset-x-0 top-0 h-1.5 bg-aksen" />

      <div
        aria-live="polite"
        className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8 sm:px-6 sm:py-12"
      >
        {/* S09: catatan Lapis 1/2 saat dimatikan/data kurang — selalu
            ditampilkan ke pengguna di layar, terlepas dari jalur gambar
            atau teks di bawahnya, karena keduanya tidak memuat kalimat
            ini (H.9 hanya menaruh kotak catatan hitungan saat aktif dan
            cukup). Abu netral, tanpa ikon peringatan. */}
        {hasil.catatanLapis1 ? (
          <p className="text-base text-redup">{hasil.catatanLapis1}</p>
        ) : null}
        {hasil.catatanLapis2 ? (
          <p className="text-base text-redup">{hasil.catatanLapis2}</p>
        ) : null}

        <div className="rounded-3xl border border-garis bg-kertas p-5 shadow-xl shadow-tinta/5 sm:p-8">
          {hasil.urlGambarLembar ? (
            <div className="flex flex-col gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL sisi klien, bukan aset next/image */}
              <img
                src={hasil.urlGambarLembar}
                alt={teksAlternatifGambarLembar(hasil)}
                className="w-full rounded-2xl border border-garis shadow-lg"
              />
              <div className="flex gap-3">
                <Tombol className="flex-1" onClick={tanganiUnduh}>
                  {bahasa === "jv" ? TOMBOL_UNDUH_JAWA : TOMBOL_UNDUH}
                </Tombol>
                <Tombol className="flex-1" varian="sekunder" onClick={tanganiBagikan}>
                  {bahasa === "jv" ? TOMBOL_BAGIKAN_JAWA : TOMBOL_BAGIKAN}
                </Tombol>
              </div>
            </div>
          ) : (
            <LembarPratinjau isiLembar={hasil.isiLembar} />
          )}
        </div>
      </div>
    </main>
  );
}
