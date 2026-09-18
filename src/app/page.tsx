"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  TOMBOL_MATIKAN_MODEL,
  TOMBOL_NYALAKAN_MODEL,
  KETERANGAN_KESETARAAN,
  KETERANGAN_MODEL_DIMATIKAN,
  CATATAN_PRIVASI,
  PESAN_GALAT,
  STATUS_SEDANG_MEMBACA,
  KETERANGAN_SEDANG_MEMBACA,
  LABEL_GANTI_BAHASA_ID,
  LABEL_GANTI_BAHASA_JV,
  LABEL_PILIH_BAHASA,
} from "../core/teks";
import {
  JUDUL_HALAMAN_UTAMA_JAWA,
  SUBJUDUL_HALAMAN_UTAMA_JAWA,
  TOMBOL_JALUR_GAMBAR_JAWA,
  TOMBOL_JALUR_MANUAL_JAWA,
  TOMBOL_MATIKAN_MODEL_JAWA,
  TOMBOL_NYALAKAN_MODEL_JAWA,
  KETERANGAN_KESETARAAN_JAWA,
  KETERANGAN_MODEL_DIMATIKAN_JAWA,
  CATATAN_PRIVASI_JAWA,
  PESAN_GALAT_JAWA,
  STATUS_SEDANG_MEMBACA_JAWA,
  KETERANGAN_SEDANG_MEMBACA_JAWA,
} from "../core/teksJawa";

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
    const pembaca = pilihPembaca("gambar", { modelDimatikan: true, paksaManual: true });
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
  // S12-1 — tombol mematikan lapisan model. Bawaan MATI (model dipakai);
  // dinyalakan secara sadar oleh penyaji saat demo di depan juri.
  const [modelDimatikan, setModelDimatikan] = useState(false);
  const [bahasa, setBahasa] = useState<"id" | "jv">("id");
  const berkasTerakhirRef = useRef<File | null>(null);

  useEffect(() => {
    const simpanan = localStorage.getItem("lembar_janji_bahasa");
    if (simpanan === "jv" || simpanan === "id") {
      setBahasa(simpanan);
    }
  }, []);

  const gantiBahasa = useCallback(() => {
    setBahasa((sebelumnya) => {
      const baru = sebelumnya === "id" ? "jv" : "id";
      localStorage.setItem("lembar_janji_bahasa", baru);
      return baru;
    });
  }, []);

  const tanganiJalurManual = useCallback(() => {
    router.push("/periksa");
  }, [router]);

  const tanganiSaklarModel = useCallback(() => {
    setModelDimatikan((sebelumnya) => !sebelumnya);
    setGalat(null);
  }, []);

  const tanganiBerkasDitolak = useCallback((alasan: AlasanBerkasDitolak) => {
    setGalat(alasanKeKodeGalat(alasan));
  }, []);

  const tanganiBerkasDiterima = useCallback(
    async (berkas: File) => {
      if (sedangMemroses) return;
      berkasTerakhirRef.current = berkas;
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

  const tanganiCobaLagi = useCallback(() => {
    if (berkasTerakhirRef.current) {
      tanganiBerkasDiterima(berkasTerakhirRef.current);
    } else {
      setGalat(null);
    }
  }, [tanganiBerkasDiterima]);

  const tanganiUlangiGambar = useCallback(() => {
    setGalat(null);
  }, []);

  const kamusPesanGalat = bahasa === "jv" ? PESAN_GALAT_JAWA : PESAN_GALAT;
  const pesanGalatAktif = galat ? kamusPesanGalat[galat] : null;

  const aksiGalatUtama =
    galat === KodeGalat.E_JARINGAN
      ? tanganiCobaLagi
      : galat === KodeGalat.E_PEMBACAAN_KOSONG
        ? tanganiUlangiGambar
        : pesanGalatAktif?.tindakan
          ? tanganiJalurManual
          : undefined;

  const aksiGalatSekunder =
    galat === KodeGalat.E_PEMBACAAN_KOSONG ? tanganiJalurManual : undefined;

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col gap-8 px-5 py-10">
      {/* Sprint UI-inklusif: pita aksen tipis di atas memberi identitas
          visual tanpa menambah kata. */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 h-1.5 bg-aksen"
      />

      {/* Saklar Bahasa Daerah untuk inklusivitas keluarga PMI di desa */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={gantiBahasa}
          aria-label={LABEL_PILIH_BAHASA}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-garis bg-kertas px-4 text-base font-semibold text-tinta-lembut hover:bg-latar-kosong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen active:scale-[0.98] motion-reduce:transform-none"
        >
          <span>🌐 {bahasa === "id" ? LABEL_GANTI_BAHASA_JV : LABEL_GANTI_BAHASA_ID}</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-[32px] font-bold leading-tight text-tinta">
          {bahasa === "jv" ? JUDUL_HALAMAN_UTAMA_JAWA : JUDUL_HALAMAN_UTAMA}
        </h1>
        <p className="text-lg leading-relaxed text-tinta-lembut">
          {bahasa === "jv" ? SUBJUDUL_HALAMAN_UTAMA_JAWA : SUBJUDUL_HALAMAN_UTAMA}
        </p>
      </div>

      {pesanGalatAktif ? (
        <PesanGalat
          pesan={pesanGalatAktif.pesan}
          tindakan={pesanGalatAktif.tindakan}
          onTindakan={aksiGalatUtama}
          tindakanSekunder={pesanGalatAktif.tindakanSekunder}
          onTindakanSekunder={aksiGalatSekunder}
        />
      ) : null}

      {/* S12-1 — saklar mematikan lapisan model untuk demo. Keadaannya
          dinyatakan apa adanya lewat teks dari `src/core/teks.ts`, bukan
          disembunyikan: saat menyala, layar menyebut lapisan model memang
          dimatikan dan pembacaan gambar tidak dilakukan. */}
      <div className="flex flex-col items-center gap-2">
        <Tombol
          varian={modelDimatikan ? "utama" : "sekunder"}
          role="switch"
          aria-checked={modelDimatikan}
          onClick={tanganiSaklarModel}
          disabled={sedangMemroses}
        >
          {modelDimatikan
            ? bahasa === "jv"
              ? TOMBOL_NYALAKAN_MODEL_JAWA
              : TOMBOL_NYALAKAN_MODEL
            : bahasa === "jv"
              ? TOMBOL_MATIKAN_MODEL_JAWA
              : TOMBOL_MATIKAN_MODEL}
        </Tombol>
        {modelDimatikan ? (
          <p className="text-center text-base text-redup">
            {bahasa === "jv" ? KETERANGAN_MODEL_DIMATIKAN_JAWA : KETERANGAN_MODEL_DIMATIKAN}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AreaUnggah
          label={bahasa === "jv" ? TOMBOL_JALUR_GAMBAR_JAWA : TOMBOL_JALUR_GAMBAR}
          labelMemroses={bahasa === "jv" ? STATUS_SEDANG_MEMBACA_JAWA : STATUS_SEDANG_MEMBACA}
          keteranganMemroses={
            bahasa === "jv" ? KETERANGAN_SEDANG_MEMBACA_JAWA : KETERANGAN_SEDANG_MEMBACA
          }
          sedangMemroses={sedangMemroses}
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
          {bahasa === "jv" ? TOMBOL_JALUR_MANUAL_JAWA : TOMBOL_JALUR_MANUAL}
        </Tombol>
      </div>

      <div className="flex flex-col gap-2 text-center">
        <p className="text-base text-redup">
          {bahasa === "jv" ? KETERANGAN_KESETARAAN_JAWA : KETERANGAN_KESETARAAN}
        </p>
        {/* CATATAN_PRIVASI sudah ada di teks.ts tetapi belum pernah
            ditampilkan — bagi pengguna awam yang dimintai foto dokumen,
            kalimat ini penenang yang paling penting. */}
        <p className="text-base text-redup">
          {bahasa === "jv" ? CATATAN_PRIVASI_JAWA : CATATAN_PRIVASI}
        </p>
      </div>
    </main>
  );
}
