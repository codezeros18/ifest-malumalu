"use client";

import { useEffect, useState } from "react";
import BarisKeterangan from "../../ui/BarisKeterangan";
import PesanGalat from "../../ui/PesanGalat";
import Tombol from "../../ui/Tombol";
import Lencana from "../../ui/Lencana";
import {
  ambilIsian,
  nilaiSlotKeRekaman,
  rekamanKeNilaiSlot,
  simpanIsian,
} from "../../lib/simpananLokal";
import { SLOT_IDS, slotDenganId } from "../../core/slot";
import type { SlotId } from "../../core/slot";
import { Keadaan } from "../../core/tipe";
import type { HasilBacaFinal, IsiLembar, SumberTawaran } from "../../core/tipe";
import { nilai as nilaiPenilaian } from "../../core/penilaian";
import { rakitIsiLembar, isiTemplat } from "../../core/perakitan";
import { KodeGalat } from "../../core/galat";
import {
  JUDUL_LAYAR_KOREKSI,
  KETERANGAN_KOREKSI,
  LABEL_TIDAK_TAHU,
  TOMBOL_LANJUT,
  TOMBOL_UNDUH,
  TOMBOL_BAGIKAN,
  PENANDA_WAKTU_TEMPLAT,
  LABEL_BLOK_2_TEMPLAT,
  PESAN_GALAT,
  LABEL_BLOK_1,
  LABEL_BLOK_3,
  LABEL_SEBAGIAN,
  KALIMAT_PEMBUKA_BLOK_1,
  KALIMAT_PEMBUKA_BLOK_2,
  KALIMAT_PEMBUKA_BLOK_3,
  KALIMAT_BAWAH_BLOK_2,
  PENUTUP_LEMBAR,
} from "../../core/teks";

const NAMA_BERKAS_LEMBAR = "lembar-janji.png";

function tanggalJamSekarang(): { tanggal: string; jam: string } {
  const sekarang = new Date();
  const tanggal = sekarang.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const jam = sekarang.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  return { tanggal, jam };
}

function nilaiKosong(): Record<SlotId, string> {
  const hasil = {} as Record<SlotId, string>;
  for (const id of SLOT_IDS) {
    hasil[id] = "";
  }
  return hasil;
}

function tidakTahuDariRekaman(daftar: readonly string[]): Set<SlotId> {
  const hasil = new Set<SlotId>();
  for (const item of daftar) {
    const angka = Number(item);
    if ((SLOT_IDS as readonly number[]).includes(angka)) {
      hasil.add(angka as SlotId);
    }
  }
  return hasil;
}

function kodeGalatValid(nilai: string | undefined): KodeGalat | null {
  if (!nilai) return null;
  return (Object.values(KodeGalat) as string[]).includes(nilai)
    ? (nilai as KodeGalat)
    : null;
}

export default function HalamanPeriksa() {
  const [termuat, setTermuat] = useState(false);
  const [sumber, setSumber] = useState<SumberTawaran>("manual");
  const [nilaiSlot, setNilaiSlot] = useState<Record<SlotId, string>>(nilaiKosong);
  const [tidakTahu, setTidakTahu] = useState<Set<SlotId>>(new Set());
  const [galatAwal, setGalatAwal] = useState<KodeGalat | null>(null);
  const [hasilTerbit, setHasilTerbit] = useState<IsiLembar | null>(null);
  const [urlGambarLembar, setUrlGambarLembar] = useState<string | null>(null);

  // Object URL gambar lembar dibuang saat diganti atau saat halaman
  // ditinggalkan — gambar TIDAK PERNAH disimpan ke server (CLAUDE.md 3.5),
  // dan ini mencegah kebocoran memori blob di peramban.
  useEffect(() => {
    return () => {
      if (urlGambarLembar) {
        URL.revokeObjectURL(urlGambarLembar);
      }
    };
  }, [urlGambarLembar]);

  // Muat draf tersimpan (bila ada) sekali saat halaman dibuka — S07-6.
  useEffect(() => {
    const draf = ambilIsian();
    if (draf) {
      setSumber(draf.sumber);
      setNilaiSlot(rekamanKeNilaiSlot(draf.nilai, SLOT_IDS) as Record<SlotId, string>);
      setTidakTahu(tidakTahuDariRekaman(draf.ditandaiTidakTahu));
      setGalatAwal(kodeGalatValid(draf.kodeGalatAwal));
    }
    setTermuat(true);
  }, []);

  // Simpan setiap perubahan ke localStorage — dijaga `termuat` supaya tidak
  // menimpa draf yang baru saja dimuat dengan nilai kosong bawaan state.
  useEffect(() => {
    if (!termuat) return;
    simpanIsian({
      sumber,
      nilai: nilaiSlotKeRekaman(nilaiSlot),
      ditandaiTidakTahu: [...tidakTahu].map(String),
    });
  }, [termuat, sumber, nilaiSlot, tidakTahu]);

  function ubahNilai(id: SlotId, teks: string) {
    setNilaiSlot((sebelumnya) => ({ ...sebelumnya, [id]: teks }));
  }

  function ubahTidakTahu(id: SlotId, ditandai: boolean) {
    setTidakTahu((sebelumnya) => {
      const berikutnya = new Set(sebelumnya);
      if (ditandai) {
        berikutnya.add(id);
      } else {
        berikutnya.delete(id);
      }
      return berikutnya;
    });
  }

  // 🔴 SATU-SATUNYA tempat `nilai()` (penilaian) dipanggil di seluruh app —
  // dari sebuah handler tombol, bukan dari useEffect maupun dari keluaran
  // Pembaca secara langsung. Lihat tests/alur/koreksi-wajib.test.ts.
  async function tanganiTerbitkanLembar() {
    const nilaiFinal = {} as Record<SlotId, string | null>;
    const keyakinan = {} as Record<SlotId, number>;

    for (const id of SLOT_IDS) {
      const teks = nilaiSlot[id].trim();
      nilaiFinal[id] = teks.length > 0 ? teks : null;
      keyakinan[id] = teks.length > 0 ? 1 : 0;
    }

    const hasilBacaFinal: HasilBacaFinal = {
      nilai: nilaiFinal,
      ditandaiTidakTahu: [...tidakTahu],
    };

    const { tanggal, jam } = tanggalJamSekarang();
    const penilaian = nilaiPenilaian(hasilBacaFinal, keyakinan);
    const isiLembar = rakitIsiLembar({
      penilaian,
      nilaiAsli: nilaiFinal,
      tanggal: isiTemplat(PENANDA_WAKTU_TEMPLAT, { tanggal, jam }),
    });

    setHasilTerbit(isiLembar);
    if (urlGambarLembar) {
      URL.revokeObjectURL(urlGambarLembar);
    }
    setUrlGambarLembar(null);

    // S08: render gambar sungguhan sisi server (src/app/api/kartu). Bila
    // gagal apa pun sebabnya, LembarPratinjau (teks biasa) di bawah tetap
    // tampil sebagai jalan mundur — lembar tetap "terbit" meski gambarnya
    // tidak berhasil dibuat.
    try {
      const respons = await fetch("/api/kartu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isiLembar }),
      });
      if (!respons.ok) {
        throw new Error("kartu-gagal");
      }
      const blob = await respons.blob();
      setUrlGambarLembar(URL.createObjectURL(blob));
    } catch {
      // Diam-diam gagal — LembarPratinjau (teks biasa) tetap tampil di
      // bawah sebagai jalan mundur. Lembar tetap "terbit" apa adanya.
    }
  }

  function tanganiUnduh() {
    if (!urlGambarLembar) return;
    const tautan = document.createElement("a");
    tautan.href = urlGambarLembar;
    tautan.download = NAMA_BERKAS_LEMBAR;
    tautan.click();
  }

  async function tanganiBagikan() {
    if (!urlGambarLembar) return;
    try {
      const respons = await fetch(urlGambarLembar);
      const blob = await respons.blob();
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

  function teksAlternatifGambarLembar(isiLembar: IsiLembar): string {
    return `${isiTemplat(LABEL_BLOK_2_TEMPLAT, { n: String(isiLembar.blok2.length) })}. ${PENUTUP_LEMBAR}`;
  }

  const pesanGalatAwal = galatAwal ? PESAN_GALAT[galatAwal] : null;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-[28px] font-bold text-tinta">{JUDUL_LAYAR_KOREKSI}</h1>
        <p className="mt-2 text-base text-tinta-lembut">{KETERANGAN_KOREKSI}</p>
      </div>

      {pesanGalatAwal ? <PesanGalat pesan={pesanGalatAwal.pesan} /> : null}

      <div className="flex flex-col">
        {SLOT_IDS.map((id) => (
          <BarisKeterangan
            key={id}
            nomor={id}
            label={slotDenganId(id).nama}
            nilai={nilaiSlot[id]}
            tidakTahu={tidakTahu.has(id)}
            labelTidakTahu={LABEL_TIDAK_TAHU}
            onUbahNilai={(teks) => ubahNilai(id, teks)}
            onUbahTidakTahu={(ditandai) => ubahTidakTahu(id, ditandai)}
          />
        ))}
      </div>

      <Tombol onClick={tanganiTerbitkanLembar}>{TOMBOL_LANJUT}</Tombol>

      {hasilTerbit ? (
        <div className="flex flex-col gap-4">
          {urlGambarLembar ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL sisi klien, bukan aset next/image */}
              <img
                src={urlGambarLembar}
                alt={teksAlternatifGambarLembar(hasilTerbit)}
                className="w-full rounded-none border border-garis"
              />
              <div className="flex gap-3">
                <Tombol onClick={tanganiUnduh}>{TOMBOL_UNDUH}</Tombol>
                <Tombol varian="sekunder" onClick={tanganiBagikan}>
                  {TOMBOL_BAGIKAN}
                </Tombol>
              </div>
            </>
          ) : (
            <LembarPratinjau isiLembar={hasilTerbit} />
          )}
        </div>
      ) : null}
    </main>
  );
}

/**
 * 🟡 Pratinjau teks sementara — BUKAN lembar akhir. Render menjadi gambar
 * (BLUEPRINT H.9) adalah pekerjaan S08; bagian ini hanya membuktikan alur
 * baca → koreksi → nilai → rakit selesai ujung ke ujung di S07.
 */
function LembarPratinjau({ isiLembar }: { isiLembar: IsiLembar }) {
  return (
    <section className="flex flex-col gap-6 rounded-lg border border-garis p-4">
      <div>
        <h2 className="rounded bg-latar-blok px-3 py-2 text-base font-bold text-tinta-lembut">
          {LABEL_BLOK_1}
        </h2>
        <p className="mt-2 text-base text-tinta-lembut">{KALIMAT_PEMBUKA_BLOK_1}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {isiLembar.blok1.map((baris) => (
            <li key={baris.slot} className="flex items-start justify-between gap-3">
              <span className="text-base text-tinta-lembut">{baris.label}</span>
              <span className="flex items-center gap-2 text-right text-base font-bold text-tinta">
                {baris.nilai}
                {baris.keadaan === Keadaan.DISEBUTKAN_SEBAGIAN ? (
                  <Lencana bentuk="lingkaran-setengah" teks={LABEL_SEBAGIAN} />
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="rounded bg-tinta-lembut px-3 py-2 text-base font-bold text-kertas">
          {isiTemplat(LABEL_BLOK_2_TEMPLAT, { n: String(isiLembar.blok2.length) })}
        </h2>
        <p className="mt-2 text-base text-redup">{KALIMAT_PEMBUKA_BLOK_2}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {isiLembar.blok2.map((baris) => (
            <li
              key={baris.slot}
              className="flex items-start justify-between gap-3 rounded bg-latar-kosong p-3"
            >
              <span className="flex items-center gap-2 text-base text-tinta-lembut">
                <Lencana bentuk="lingkaran-kosong" />
                {baris.kalimat}
              </span>
              <span className="shrink-0 text-sm text-redup">
                {baris.dasarHukum.join(", ")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-base italic text-redup">{KALIMAT_BAWAH_BLOK_2}</p>
      </div>

      <div>
        <h2 className="rounded bg-latar-blok px-3 py-2 text-base font-bold text-tinta-lembut">
          {LABEL_BLOK_3}
        </h2>
        <p className="mt-2 text-base text-tinta-lembut">{KALIMAT_PEMBUKA_BLOK_3}</p>
        <ol className="mt-2 flex flex-col gap-2">
          {isiLembar.pertanyaan.map((pertanyaan, indeks) => (
            <li key={indeks} className="text-base text-tinta">
              {indeks + 1}. {pertanyaan}
            </li>
          ))}
        </ol>
      </div>

      <p className="border-t border-garis pt-4 text-base text-tinta-lembut">
        {PENUTUP_LEMBAR}
      </p>
    </section>
  );
}
