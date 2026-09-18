"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { catat } from "../../lib/catat";
import { SLOT_IDS, slotDenganId } from "../../core/slot";
import type { SlotId } from "../../core/slot";
import { Keadaan } from "../../core/tipe";
import type { HasilBacaFinal, IsiLembar, SumberTawaran } from "../../core/tipe";
import { nilai as nilaiPenilaian } from "../../core/penilaian";
import { rakitIsiLembar, isiTemplat } from "../../core/perakitan";
import { KodeGalat } from "../../core/galat";
import { cocokkanNamaP3MI } from "../../core/pencocokan";
import type { SalinanP3MI } from "../../core/pencocokan";
import { hitungCatatanBiaya } from "../../core/biaya";
import type { AcuanBiaya } from "../../core/biaya";
import {
  JUDUL_LAYAR_KOREKSI,
  KETERANGAN_KOREKSI,
  LABEL_TIDAK_TAHU,
  TOMBOL_LANJUT,
  TOMBOL_SEDANG_MENERBITKAN,
  TOMBOL_UNDUH,
  TOMBOL_BAGIKAN,
  PENANDA_WAKTU_TEMPLAT,
  LABEL_BLOK_2_TEMPLAT,
  PESAN_GALAT,
  CONTOH_ISIAN_PER_SLOT,
  LABEL_BLOK_1,
  LABEL_BLOK_3,
  LABEL_SEBAGIAN,
  LABEL_CATATAN_HITUNGAN,
  KALIMAT_PEMBUKA_BLOK_1,
  KALIMAT_PEMBUKA_BLOK_2,
  KALIMAT_PEMBUKA_BLOK_3,
  KALIMAT_BAWAH_BLOK_2,
  PENUTUP_LEMBAR,
  LAPIS1_DIMATIKAN,
  LAPIS2_ANGKA_TIDAK_ADA,
  LAPIS2_DIMATIKAN,
  LABEL_GANTI_BAHASA_ID,
  LABEL_GANTI_BAHASA_JV,
  LABEL_PILIH_BAHASA,
} from "../../core/teks";
import {
  JUDUL_LAYAR_KOREKSI_JAWA,
  KETERANGAN_KOREKSI_JAWA,
  LABEL_TIDAK_TAHU_JAWA,
  TOMBOL_LANJUT_JAWA,
  TOMBOL_SEDANG_MENERBITKAN_JAWA,
  TOMBOL_UNDUH_JAWA,
  TOMBOL_BAGIKAN_JAWA,
  CONTOH_ISIAN_PER_SLOT_JAWA,
  PESAN_GALAT_JAWA,
} from "../../core/teksJawa";

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

/**
 * Metrik anonim "apakah dikoreksi?" (CLAUDE.md §3.5) — murni membandingkan
 * teks, tidak pernah dipakai untuk penilaian. Jalur manual tidak punya
 * baseline pembacaan untuk dibandingkan, jadi selalu `false`.
 */
function apakahDikoreksi(
  bacaanAsli: Readonly<Record<string, string>> | null,
  nilaiSlotSekarang: Readonly<Record<SlotId, string>>,
  tidakTahu: ReadonlySet<SlotId>,
): boolean {
  if (!bacaanAsli) return false;
  if (tidakTahu.size > 0) return true;
  return SLOT_IDS.some((id) => (bacaanAsli[String(id)] ?? "").trim() !== nilaiSlotSekarang[id].trim());
}

/**
 * 🔴 S09 — Lapis 1 dan 2 boleh mati (BLUEPRINT G.5). `src/core/pencocokan.ts`
 * dan `src/core/biaya.ts` dilarang menyentuh berkas sama sekali (batas
 * modul `src/core`), jadi pembacaan `data/*.json` — SATU-SATUNYA tempat di
 * seluruh app yang menyentuhnya — terjadi di sini, lewat `import()` dinamis
 * yang di-bungkus `try/catch`. Bila berkasnya tidak ada atau rusak,
 * fungsi ini mengembalikan `null` dengan tenang; `cocokkanNamaP3MI` dan
 * `hitungCatatanBiaya` masing-masing menerjemahkan `null` itu menjadi
 * keadaan "dimatikan" — bukan galat yang menghentikan alur.
 */
async function muatSalinanP3MI(): Promise<SalinanP3MI | null> {
  try {
    const modul = await import("../../../data/p3mi-snapshot.json");
    const mentah = (modul as { default?: unknown }).default ?? modul;
    if (typeof mentah !== "object" || mentah === null) return null;

    const { tanggal_snapshot: tanggalSnapshot, perusahaan } = mentah as Record<
      string,
      unknown
    >;
    if (typeof tanggalSnapshot !== "string" || !Array.isArray(perusahaan)) {
      return null;
    }

    const daftar = perusahaan
      .map((entri) => {
        if (typeof entri !== "object" || entri === null) return null;
        const { nama, nama_lengkap: namaLengkap } = entri as Record<string, unknown>;
        const namaTerpilih = typeof namaLengkap === "string" ? namaLengkap : nama;
        return typeof namaTerpilih === "string" && namaTerpilih.trim().length > 0
          ? { nama: namaTerpilih }
          : null;
      })
      .filter((entri): entri is { nama: string } => entri !== null);

    return { tanggalSalinan: tanggalSnapshot, daftar };
  } catch {
    return null;
  }
}

async function muatAcuanBiaya(): Promise<AcuanBiaya | null> {
  try {
    const modul = await import("../../../data/komponen-biaya.json");
    const mentah = (modul as { default?: unknown }).default ?? modul;
    if (typeof mentah !== "object" || mentah === null) return null;

    const { tanggalAcuan, komponen } = mentah as Record<string, unknown>;
    if (typeof tanggalAcuan !== "string") return null;

    return { tanggalAcuan, komponen: Array.isArray(komponen) ? komponen : [] } as AcuanBiaya;
  } catch {
    return null;
  }
}

export default function HalamanPeriksa() {
  const [termuat, setTermuat] = useState(false);
  const [sumber, setSumber] = useState<SumberTawaran>("manual");
  const [nilaiSlot, setNilaiSlot] = useState<Record<SlotId, string>>(nilaiKosong);
  const [tidakTahu, setTidakTahu] = useState<Set<SlotId>>(new Set());
  const [galatAwal, setGalatAwal] = useState<KodeGalat | null>(null);
  const [galatPeriksa, setGalatPeriksa] = useState<KodeGalat | null>(null);
  const [sedangMenerbitkan, setSedangMenerbitkan] = useState(false);
  const [hasilTerbit, setHasilTerbit] = useState<IsiLembar | null>(null);
  const [urlGambarLembar, setUrlGambarLembar] = useState<string | null>(null);
  const [bahasa, setBahasa] = useState<"id" | "jv">("id");
  const rujukanHasil = useRef<HTMLDivElement>(null);
  // S09: catatan Lapis 1/2 yang TIDAK ikut ke lembar yang dibagikan (dashed
  // box gambar hanya muncul saat aktif+cukup, BLUEPRINT H.9 butir 6) tetapi
  // tetap wajib ditampilkan ke pengguna di layar (CLAUDE.md §3.1) — supaya
  // pengguna tahu kenapa hasilnya tidak ada di gambar, bukan dibuat diam.
  const [catatanLapis1, setCatatanLapis1] = useState<string | null>(null);
  const [catatanLapis2, setCatatanLapis2] = useState<string | null>(null);
  // Baseline hasil pembacaan gambar SEBELUM dikoreksi, dan jam halaman ini
  // dibuka — keduanya murni untuk metrik anonim (CLAUDE.md §3.5): "apakah
  // dikoreksi?" dan "berapa detik sampai lembar terbit?". Tidak pernah
  // dipakai untuk penilaian maupun ditampilkan ke pengguna.
  const [bacaanAsli, setBacaanAsli] = useState<Readonly<Record<string, string>> | null>(null);
  const [waktuBukaMs] = useState<number>(() => Date.now());

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

  // Muat preferensi bahasa pengguna bila tersimpan
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

  // Muat draf tersimpan (bila ada) sekali saat halaman dibuka — S07-6.
  useEffect(() => {
    const draf = ambilIsian();
    if (draf) {
      setSumber(draf.sumber);
      setNilaiSlot(rekamanKeNilaiSlot(draf.nilai, SLOT_IDS) as Record<SlotId, string>);
      setTidakTahu(tidakTahuDariRekaman(draf.ditandaiTidakTahu));
      setGalatAwal(kodeGalatValid(draf.kodeGalatAwal));
      setBacaanAsli(draf.nilaiAsli ?? null);
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
    if (galatPeriksa) setGalatPeriksa(null);
    setNilaiSlot((sebelumnya) => ({ ...sebelumnya, [id]: teks }));
  }

  function ubahTidakTahu(id: SlotId, ditandai: boolean) {
    if (galatPeriksa) setGalatPeriksa(null);
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
    if (sedangMenerbitkan) return;

    // F.9 E_TIDAK_ADA_MASUKAN: bila belum ada satu pun keterangan yang diisi
    // dan belum ada satu pun yang ditandai tidak tahu, tampilkan galat F.9
    // daripada menerbitkan lembar hampa.
    const adaMasukan =
      SLOT_IDS.some((id) => nilaiSlot[id].trim().length > 0) || tidakTahu.size > 0;
    if (!adaMasukan) {
      setGalatPeriksa(KodeGalat.E_TIDAK_ADA_MASUKAN);
      return;
    }

    setGalatPeriksa(null);
    setSedangMenerbitkan(true);

    try {
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

      // S09: Lapis 1 dan 2 dijalankan di sini — SATU-SATUNYA titik di app yang
      // memuat data/*.json (lihat komentar muatSalinanP3MI/muatAcuanBiaya di
      // atas). Kegagalan memuat berkas apa pun TIDAK PERNAH menghentikan
      // penerbitan lembar (BLUEPRINT G.5) — hanya membuat hasilnya "dimatikan".
      const [salinanP3MI, acuanBiaya] = await Promise.all([
        muatSalinanP3MI(),
        muatAcuanBiaya(),
      ]);

      const statusLapis1 = cocokkanNamaP3MI(nilaiFinal[1], salinanP3MI);
      const statusLapis2 = hitungCatatanBiaya(nilaiFinal[5], nilaiFinal[9], acuanBiaya);

      setCatatanLapis1(statusLapis1.status === "dimatikan" ? LAPIS1_DIMATIKAN : null);
      setCatatanLapis2(
        statusLapis2.status === "dimatikan"
          ? LAPIS2_DIMATIKAN
          : statusLapis2.status === "data-kurang"
            ? LAPIS2_ANGKA_TIDAK_ADA
            : null,
      );

      const isiLembar = rakitIsiLembar({
        penilaian,
        nilaiAsli: nilaiFinal,
        tanggal: isiTemplat(PENANDA_WAKTU_TEMPLAT, { tanggal, jam }),
        hasilLapis1: statusLapis1.status === "aktif" ? statusLapis1.hasil : undefined,
        catatanHitungan:
          statusLapis2.status === "tersedia" ? statusLapis2.catatanHitungan : undefined,
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

      // Gulir ramah ke hasil terbit agar pengguna langsung melihat lembar
      setTimeout(() => {
        rujukanHasil.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        rujukanHasil.current?.focus();
      }, 100);
    } finally {
      setSedangMenerbitkan(false);
    }

    // S10: pencatatan metrik anonim, fire-and-forget, persis di titik
    // lembar selesai dirender (lihat komentar desain di src/lib/catat.ts).
    // `dibagikan` selalu `false` di sini karena tombol bagikan belum bisa
    // ditekan pada titik ini — satu-satunya titik panggilan yang dijamin
    // "satu baris = satu pemeriksaan" (CLAUDE.md §3.5: nol agregasi lintas
    // pengguna, tidak ada baris kedua yang menyusul untuk sesi yang sama).
    catat({
      jalur_masukan: sumber,
      jumlah_kosong: penilaian.jumlahKosong,
      dikoreksi: apakahDikoreksi(bacaanAsli, nilaiSlot, tidakTahu),
      dibagikan: false,
      durasi_detik: Math.round((Date.now() - waktuBukaMs) / 1000),
    });
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

  const kamusPesanGalat = bahasa === "jv" ? PESAN_GALAT_JAWA : PESAN_GALAT;
  const pesanGalatAwal = galatAwal ? kamusPesanGalat[galatAwal] : null;
  const pesanGalatPeriksa = galatPeriksa ? kamusPesanGalat[galatPeriksa] : null;
  const contohIsianAktif =
    bahasa === "jv" ? CONTOH_ISIAN_PER_SLOT_JAWA : CONTOH_ISIAN_PER_SLOT;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-5 py-8">
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 h-1.5 bg-aksen"
      />

      {/* Saklar Bahasa Daerah untuk kenyamanan musyawarah keluarga PMI */}
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

      <div>
        <h1 className="text-[32px] font-bold leading-tight text-tinta">
          {bahasa === "jv" ? JUDUL_LAYAR_KOREKSI_JAWA : JUDUL_LAYAR_KOREKSI}
        </h1>
        <p className="mt-2 text-lg leading-relaxed text-tinta-lembut">
          {bahasa === "jv" ? KETERANGAN_KOREKSI_JAWA : KETERANGAN_KOREKSI}
        </p>
      </div>

      {pesanGalatAwal ? <PesanGalat pesan={pesanGalatAwal.pesan} /> : null}
      {pesanGalatPeriksa ? <PesanGalat pesan={pesanGalatPeriksa.pesan} /> : null}

      <div className="flex flex-col">
        {SLOT_IDS.map((id) => (
          <BarisKeterangan
            key={id}
            nomor={id}
            label={slotDenganId(id).nama}
            nilai={nilaiSlot[id]}
            placeholder={contohIsianAktif[id]}
            tidakTahu={tidakTahu.has(id)}
            labelTidakTahu={bahasa === "jv" ? LABEL_TIDAK_TAHU_JAWA : LABEL_TIDAK_TAHU}
            onUbahNilai={(teks) => ubahNilai(id, teks)}
            onUbahTidakTahu={(ditandai) => ubahTidakTahu(id, ditandai)}
          />
        ))}
      </div>

      <Tombol onClick={tanganiTerbitkanLembar} disabled={sedangMenerbitkan}>
        {sedangMenerbitkan
          ? bahasa === "jv"
            ? TOMBOL_SEDANG_MENERBITKAN_JAWA
            : TOMBOL_SEDANG_MENERBITKAN
          : bahasa === "jv"
            ? TOMBOL_LANJUT_JAWA
            : TOMBOL_LANJUT}
      </Tombol>

      {hasilTerbit ? (
        <div
          ref={rujukanHasil}
          tabIndex={-1}
          aria-live="polite"
          className="flex flex-col gap-4 focus:outline-none"
        >
          {/* S09: catatan Lapis 1/2 saat dimatikan/data kurang — selalu
              ditampilkan ke pengguna di layar, terlepas dari jalur gambar
              atau teks di bawahnya, karena keduanya tidak memuat kalimat
              ini (H.9 hanya menaruh kotak catatan hitungan saat aktif dan
              cukup). Abu netral, tanpa ikon peringatan. */}
          {catatanLapis1 ? (
            <p className="text-base text-redup">{catatanLapis1}</p>
          ) : null}
          {catatanLapis2 ? (
            <p className="text-base text-redup">{catatanLapis2}</p>
          ) : null}

          {urlGambarLembar ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: URL sisi klien, bukan aset next/image */}
              <img
                src={urlGambarLembar}
                alt={teksAlternatifGambarLembar(hasilTerbit)}
                className="w-full rounded-none border border-garis"
              />
              <div className="flex gap-3">
                <Tombol onClick={tanganiUnduh}>
                  {bahasa === "jv" ? TOMBOL_UNDUH_JAWA : TOMBOL_UNDUH}
                </Tombol>
                <Tombol varian="sekunder" onClick={tanganiBagikan}>
                  {bahasa === "jv" ? TOMBOL_BAGIKAN_JAWA : TOMBOL_BAGIKAN}
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
    <section className="flex flex-col gap-6 rounded-2xl border border-garis bg-kertas p-5 shadow-sm">
      <div>
        <h2 className="rounded-lg bg-latar-blok px-3 py-2 text-lg font-bold text-tinta-lembut">
          {LABEL_BLOK_1}
        </h2>
        <p className="mt-2 text-lg text-tinta-lembut">{KALIMAT_PEMBUKA_BLOK_1}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {isiLembar.blok1.map((baris) => (
            <li key={baris.slot} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <span className="text-lg text-tinta-lembut">{baris.label}</span>
                <span className="flex items-center gap-2 text-right text-lg font-bold text-tinta">
                  {baris.nilai}
                  {baris.keadaan === Keadaan.DISEBUTKAN_SEBAGIAN ? (
                    <Lencana bentuk="lingkaran-setengah" teks={LABEL_SEBAGIAN} />
                  ) : null}
                </span>
              </div>
              {/* S09: hasil Lapis 1 melekat pada baris slot 1 (nama
                  perusahaan) — bukan blok terpisah, karena itulah satu-satunya
                  keterangan yang dicocokkan. Abu netral, tanpa lencana warna
                  atau ikon peringatan (CLAUDE.md §3.6). */}
              {baris.slot === 1 && isiLembar.hasilLapis1 ? (
                <p className="text-right text-sm text-redup">
                  {isiLembar.hasilLapis1.kalimat}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="rounded-lg bg-tinta-lembut px-3 py-2 text-lg font-bold text-kertas">
          {isiTemplat(LABEL_BLOK_2_TEMPLAT, { n: String(isiLembar.blok2.length) })}
        </h2>
        <p className="mt-2 text-lg text-redup">{KALIMAT_PEMBUKA_BLOK_2}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {isiLembar.blok2.map((baris) => (
            <li
              key={baris.slot}
              className="flex items-start justify-between gap-3 rounded-xl bg-latar-kosong p-3"
            >
              <span className="flex items-center gap-2 text-lg text-tinta-lembut">
                <Lencana bentuk="lingkaran-kosong" />
                {baris.kalimat}
              </span>
              {/* S11: tinta-lembut, bukan redup — redup di atas latar-kosong
                  hanya ±4,39:1, di bawah ambang 4,5:1 (BLUEPRINT H.7). */}
              <span className="shrink-0 text-base text-tinta-lembut">
                {baris.dasarHukum.join(", ")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-lg italic text-redup">{KALIMAT_BAWAH_BLOK_2}</p>
      </div>

      {/* 6. Catatan hitungan — BLUEPRINT H.9 butir 6: HANYA muncul bila
          Lapis 2 aktif dan datanya cukup. Kotak bergaris putus-putus, abu
          netral, tanpa warna merah maupun ikon peringatan. */}
      {isiLembar.catatanHitungan ? (
        <div className="rounded-xl border-2 border-dashed border-garis p-4">
          <h3 className="text-lg font-bold text-tinta-lembut">{LABEL_CATATAN_HITUNGAN}</h3>
          <p className="mt-2 text-lg text-tinta-lembut">{isiLembar.catatanHitungan}</p>
        </div>
      ) : null}

      <div>
        <h2 className="rounded-lg bg-latar-blok px-3 py-2 text-lg font-bold text-tinta-lembut">
          {LABEL_BLOK_3}
        </h2>
        <p className="mt-2 text-lg text-tinta-lembut">{KALIMAT_PEMBUKA_BLOK_3}</p>
        <ol className="mt-2 flex flex-col gap-2">
          {isiLembar.pertanyaan.map((pertanyaan, indeks) => (
            <li key={indeks} className="text-lg text-tinta">
              {indeks + 1}. {pertanyaan}
            </li>
          ))}
        </ol>
      </div>

      <p className="border-t border-garis pt-4 text-lg text-tinta-lembut">
        {PENUTUP_LEMBAR}
      </p>
    </section>
  );
}
