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
  PESAN_GALAT,
  LABEL_BLOK_1,
  LABEL_BLOK_2_TEMPLAT,
  LABEL_BLOK_3,
  LABEL_SEBAGIAN,
  KALIMAT_PEMBUKA_BLOK_1,
  KALIMAT_PEMBUKA_BLOK_2,
  KALIMAT_PEMBUKA_BLOK_3,
  KALIMAT_BAWAH_BLOK_2,
  PENUTUP_LEMBAR,
} from "../../core/teks";
import { catat } from "../../lib/catat";

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

async function mintaBlobGambar(dataLembar: IsiLembar): Promise<Blob | null> {
  try {
    const respons = await fetch("/api/kartu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isiLembar: dataLembar }),
    });
    if (!respons.ok) return null;
    return await respons.blob();
  } catch {
    return null;
  }
}

function simpanBerkasGambar(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.download = "lembar-janji.png";
  document.body.appendChild(tautan);
  tautan.click();
  document.body.removeChild(tautan);
  URL.revokeObjectURL(url);
}

export default function HalamanPeriksa() {
  const [waktuMulai] = useState<number>(() => Date.now());
  const [termuat, setTermuat] = useState(false);
  const [sumber, setSumber] = useState<SumberTawaran>("manual");
  const [nilaiSlot, setNilaiSlot] = useState<Record<SlotId, string>>(nilaiKosong);
  const [nilaiAwal, setNilaiAwal] = useState<Record<SlotId, string> | null>(null);
  const [tidakTahu, setTidakTahu] = useState<Set<SlotId>>(new Set());
  const [galatAwal, setGalatAwal] = useState<KodeGalat | null>(null);
  const [hasilTerbit, setHasilTerbit] = useState<IsiLembar | null>(null);
  const [sedangUnduh, setSedangUnduh] = useState(false);

  // Muat draf tersimpan (bila ada) sekali saat halaman dibuka — S07-6.
  useEffect(() => {
    const draf = ambilIsian();
    if (draf) {
      setSumber(draf.sumber);
      const slotAwal = rekamanKeNilaiSlot(draf.nilai, SLOT_IDS) as Record<SlotId, string>;
      setNilaiSlot(slotAwal);
      setNilaiAwal(slotAwal);
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

  function cekDikoreksi(): boolean {
    if (sumber !== "gambar" || !nilaiAwal) {
      return false;
    }
    for (const id of SLOT_IDS) {
      if ((nilaiAwal[id] ?? "").trim() !== (nilaiSlot[id] ?? "").trim()) {
        return true;
      }
    }
    return tidakTahu.size > 0;
  }

  function hitungDurasi(): number {
    return Math.max(1, Math.round((Date.now() - waktuMulai) / 1000));
  }

  // 🔴 SATU-SATUNYA tempat `nilai()` (penilaian) dipanggil di seluruh app —
  // dari sebuah handler tombol, bukan dari useEffect maupun dari keluaran
  // Pembaca secara langsung. Lihat tests/alur/koreksi-wajib.test.ts.
  function tanganiTerbitkanLembar() {
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

    const sekarang = new Date();
    const formatTanggal = sekarang.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formatJam = sekarang
      .toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(":", ".");
    const teksWaktu = isiTemplat(PENANDA_WAKTU_TEMPLAT, {
      tanggal: formatTanggal,
      jam: formatJam,
    });

    const penilaian = nilaiPenilaian(hasilBacaFinal, keyakinan);
    const isiLembar = rakitIsiLembar({
      penilaian,
      nilaiAsli: nilaiFinal,
      tanggal: teksWaktu,
    });

    setHasilTerbit(isiLembar);

    catat({
      jalur_masukan: sumber,
      jumlah_kosong: isiLembar.blok2.length,
      dikoreksi: cekDikoreksi(),
      dibagikan: false,
      durasi_detik: hitungDurasi(),
    });
  }

  async function tanganiUnduh() {
    if (!hasilTerbit || sedangUnduh) return;
    setSedangUnduh(true);
    catat({
      jalur_masukan: sumber,
      jumlah_kosong: hasilTerbit.blok2.length,
      dikoreksi: cekDikoreksi(),
      dibagikan: false,
      durasi_detik: hitungDurasi(),
    });
    try {
      const blob = await mintaBlobGambar(hasilTerbit);
      if (blob) {
        simpanBerkasGambar(blob);
      }
    } finally {
      setSedangUnduh(false);
    }
  }

  async function tanganiBagikan() {
    if (!hasilTerbit || sedangUnduh) return;
    setSedangUnduh(true);
    catat({
      jalur_masukan: sumber,
      jumlah_kosong: hasilTerbit.blok2.length,
      dikoreksi: cekDikoreksi(),
      dibagikan: true,
      durasi_detik: hitungDurasi(),
    });
    try {
      const blob = await mintaBlobGambar(hasilTerbit);
      if (!blob) return;

      let dibagikanSelesai = false;
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function"
      ) {
        try {
          const berkas = new File([blob], "lembar-janji.png", { type: "image/png" });
          if (navigator.canShare({ files: [berkas] })) {
            await navigator.share({ files: [berkas] });
            dibagikanSelesai = true;
          }
        } catch (galatBagikan) {
          if (galatBagikan instanceof Error && galatBagikan.name === "AbortError") {
            dibagikanSelesai = true;
          }
        }
      }

      if (!dibagikanSelesai) {
        simpanBerkasGambar(blob);
      }
    } finally {
      setSedangUnduh(false);
    }
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
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Tombol
              onClick={tanganiUnduh}
              disabled={sedangUnduh}
              className="flex-1"
            >
              {TOMBOL_UNDUH}
            </Tombol>
            <Tombol
              varian="sekunder"
              onClick={tanganiBagikan}
              disabled={sedangUnduh}
              className="flex-1"
            >
              {TOMBOL_BAGIKAN}
            </Tombol>
          </div>
          <LembarPratinjau isiLembar={hasilTerbit} />
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
