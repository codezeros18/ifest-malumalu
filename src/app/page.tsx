"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import AreaUnggah from "../ui/AreaUnggah";
import type { AlasanBerkasDitolak } from "../ui/AreaUnggah";
import PesanGalat from "../ui/PesanGalat";
import Tombol from "../ui/Tombol";
import { simpanIsian, nilaiSlotKeRekaman } from "../lib/simpananLokal";
import { pilihPembaca } from "../vision";
import type { HasilBaca } from "../core/tipe";
import { KodeGalat } from "../core/galat";
import type { ResponsGalat } from "../core/galat";
import {
  JUDUL_HALAMAN_UTAMA,
  SUBJUDUL_HALAMAN_UTAMA,
  TOMBOL_JALUR_GAMBAR,
  TOMBOL_JALUR_MANUAL,
  TOMBOL_MATIKAN_PEMBACAAN_GAMBAR,
  KETERANGAN_KESETARAAN,
  PESAN_GALAT,
} from "../core/teks";

/** CLAUDE.md bagian 4: ukuran berkas unggahan maksimal 8 MB. */
const UKURAN_MAKSIMAL_BYTE = 8 * 1024 * 1024;

function alasanKeKodeGalat(alasan: AlasanBerkasDitolak): KodeGalat {
  return alasan === "terlalu-besar"
    ? KodeGalat.E_GAMBAR_TERLALU_BESAR
    : KodeGalat.E_FORMAT_TIDAK_DIDUKUNG;
}

type HasilBacaGambar =
  | { readonly jenis: "sukses"; readonly hasilBaca: HasilBaca }
  | { readonly jenis: "galat"; readonly kode: KodeGalat }
  | { readonly jenis: "fallback-manual"; readonly hasilBaca: HasilBaca };

/**
 * 🟡 `src/app/api/baca/route.ts` (milik Window 3, S06) muncul di
 * pertengahan sprint ini — kode di bawah memanggilnya sesuai kontrak
 * sungguhannya (`multipart/form-data`, kunci berkas `"berkas"`; galat
 * berupa JSON `ResponsGalat` dengan status non-2xx). Bila endpoint itu
 * menjawab dengan kode galat yang jelas (mis. model tidak tersedia,
 * format tidak didukung), kode itu dipakai APA ADANYA — tidak ditelan
 * jadi fallback diam-diam.
 *
 * Fallback ke `pilihPembaca` HANYA terjadi bila `fetch` gagal total
 * (jaringan putus, atau endpoint benar-benar tidak ada). Ini tetap aman
 * dipanggil dari klien: `pilihPembaca` membaca `MODEL_API_KEY` lewat
 * `process.env`, yang TIDAK PERNAH disuntikkan ke bundel peramban kecuali
 * berawalan `NEXT_PUBLIC_` — jadi di sisi klien kuncinya akan selalu
 * kosong, dan hasilnya SELALU jatuh ke `manualProvider` (nol jaringan,
 * nol risiko memanggil model sungguhan dari sini). Dicatat di PROGRESS.md.
 */
async function bacaGambarSementara(
  berkas: File,
  modelDimatikan: boolean,
): Promise<HasilBacaGambar> {
  // S12-1: saat tombol peragaan ditekan, `/api/baca` TIDAK dipanggil sama
  // sekali. Endpoint itu memanggil `modelProvider` langsung (tidak lewat
  // `pilihPembaca`), jadi satu-satunya cara menjamin model tidak tersentuh
  // adalah tidak mengirim permintaannya.
  if (modelDimatikan) {
    const pembaca = pilihPembaca("gambar", { modelDimatikan: true });
    const hasilBaca = await pembaca.baca({ sumber: "gambar", berkas });
    return { jenis: "fallback-manual", hasilBaca };
  }

  try {
    const formData = new FormData();
    formData.append("berkas", berkas);
    const respons = await fetch("/api/baca", { method: "POST", body: formData });

    if (respons.ok) {
      const hasilBaca = (await respons.json()) as HasilBaca;
      return { jenis: "sukses", hasilBaca };
    }

    const isiGalat = (await respons.json()) as ResponsGalat;
    return { jenis: "galat", kode: isiGalat.kode };
  } catch {
    // Endpoint belum menjawab sama sekali (tidak ada / jaringan putus
    // sebelum sempat merespons) — jatuh ke Pembaca langsung di bawah.
  }

  const pembaca = pilihPembaca("gambar");
  const hasilBaca = await pembaca.baca({ sumber: "gambar", berkas });
  return { jenis: "fallback-manual", hasilBaca };
}

export default function HalamanUtama() {
  const router = useRouter();
  const [galat, setGalat] = useState<KodeGalat | null>(null);
  const [sedangMemroses, setSedangMemroses] = useState(false);
  const [modelDimatikan, setModelDimatikan] = useState(false);

  const tanganiJalurManual = useCallback(() => {
    router.push("/periksa");
  }, [router]);

  const tanganiBerkasDitolak = useCallback((alasan: AlasanBerkasDitolak) => {
    setGalat(alasanKeKodeGalat(alasan));
  }, []);

  const tanganiBerkasDiterima = useCallback(
    async (berkas: File) => {
      if (sedangMemroses) return;
      setGalat(null);
      setSedangMemroses(true);

      try {
        const hasil = await bacaGambarSementara(berkas, modelDimatikan);

        if (hasil.jenis === "galat") {
          setGalat(hasil.kode);
          return;
        }

        simpanIsian({
          sumber: "gambar",
          nilai: nilaiSlotKeRekaman(hasil.hasilBaca.nilai),
          ditandaiTidakTahu: [],
          kodeGalatAwal:
            hasil.jenis === "fallback-manual" ? KodeGalat.E_MODEL_TIDAK_TERSEDIA : undefined,
        });
        router.push("/periksa");
      } catch {
        setGalat(KodeGalat.E_PEMBACAAN_GAGAL);
      } finally {
        setSedangMemroses(false);
      }
    },
    [router, sedangMemroses, modelDimatikan],
  );

  const pesanGalatAktif = galat ? PESAN_GALAT[galat] : null;
  const pesanModelDimatikan = PESAN_GALAT[KodeGalat.E_MODEL_TIDAK_TERSEDIA];

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-4 py-10">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-[28px] font-bold text-tinta">{JUDUL_HALAMAN_UTAMA}</h1>
        <p className="text-base text-tinta-lembut">{SUBJUDUL_HALAMAN_UTAMA}</p>
      </div>

      {/* S12-1: saat tombol peragaan aktif, layar menyatakannya apa adanya
          lewat pesan F.9 yang sudah ada — bukan kalimat baru. */}
      {modelDimatikan ? (
        <PesanGalat
          pesan={pesanModelDimatikan.pesan}
          tindakan={pesanModelDimatikan.tindakan}
          onTindakan={tanganiJalurManual}
        />
      ) : null}

      {pesanGalatAktif ? (
        <PesanGalat
          pesan={pesanGalatAktif.pesan}
          tindakan={pesanGalatAktif.tindakan}
          onTindakan={pesanGalatAktif.tindakan ? tanganiJalurManual : undefined}
        />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AreaUnggah
          label={TOMBOL_JALUR_GAMBAR}
          ukuranMaksimalByte={UKURAN_MAKSIMAL_BYTE}
          disabled={sedangMemroses}
          onBerkasDiterima={tanganiBerkasDiterima}
          onBerkasDitolak={tanganiBerkasDitolak}
        />
        <Tombol
          varian="sekunder"
          onClick={tanganiJalurManual}
          disabled={sedangMemroses}
          className="min-h-40"
        >
          {TOMBOL_JALUR_MANUAL}
        </Tombol>
      </div>

      <p className="text-center text-base text-redup">{KETERANGAN_KESETARAAN}</p>

      {/* S12-1: tombol peragaan. `aria-pressed` membawa keadaannya, labelnya
          tetap (pola tombol-toggle WAI-ARIA), keadaan juga terlihat lewat
          pesan di atas — tidak lewat warna saja (CLAUDE.md §3.6). */}
      <div className="flex justify-center">
        <Tombol
          varian="sekunder"
          aria-pressed={modelDimatikan}
          onClick={() => setModelDimatikan((sebelumnya) => !sebelumnya)}
          disabled={sedangMemroses}
        >
          {TOMBOL_MATIKAN_PEMBACAAN_GAMBAR}
        </Tombol>
      </div>
    </main>
  );
}
