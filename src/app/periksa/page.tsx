"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BarisKeterangan from "../../ui/BarisKeterangan";
import PesanGalat from "../../ui/PesanGalat";
import SitusNavbar from "../../ui/SitusNavbar";
import SitusFooter from "../../ui/SitusFooter";
import {
  ambilIsian,
  nilaiSlotKeRekaman,
  rekamanKeNilaiSlot,
  simpanIsian,
} from "../../lib/simpananLokal";
import { catat } from "../../lib/catat";
import { simpanHasilSementara } from "../../lib/hasilSementara";
import { SLOT_IDS, slotDenganId } from "../../core/slot";
import type { SlotId } from "../../core/slot";
import type { HasilBacaFinal, SumberTawaran } from "../../core/tipe";
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
  PERINGATAN_LENGKAPI_KETERANGAN,
  PENANDA_WAKTU_TEMPLAT,
  PESAN_GALAT,
  CONTOH_ISIAN_PER_SLOT,
  LAPIS1_DIMATIKAN,
  LAPIS2_ANGKA_TIDAK_ADA,
  LAPIS2_DIMATIKAN,
  SATUAN_KATA,
} from "../../core/teks";
import {
  JUDUL_LAYAR_KOREKSI_JAWA,
  KETERANGAN_KOREKSI_JAWA,
  LABEL_TIDAK_TAHU_JAWA,
  TOMBOL_LANJUT_JAWA,
  TOMBOL_SEDANG_MENERBITKAN_JAWA,
  PERINGATAN_LENGKAPI_KETERANGAN_JAWA,
  CONTOH_ISIAN_PER_SLOT_JAWA,
  NAMA_SLOT_JAWA,
  SATUAN_KATA_JAWA,
  PESAN_GALAT_JAWA,
} from "../../core/teksJawa";

function tanggalJamSekarang(): { tanggal: string; jam: string } {
  const sekarang = new Date();
  const tanggal = sekarang.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const jam = sekarang.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  return SLOT_IDS.some(
    (id) =>
      (bacaanAsli[String(id)] ?? "").trim() !== nilaiSlotSekarang[id].trim(),
  );
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
        const { nama, nama_lengkap: namaLengkap } = entri as Record<
          string,
          unknown
        >;
        const namaTerpilih =
          typeof namaLengkap === "string" ? namaLengkap : nama;
        return typeof namaTerpilih === "string" &&
          namaTerpilih.trim().length > 0
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

    return {
      tanggalAcuan,
      komponen: Array.isArray(komponen) ? komponen : [],
    } as AcuanBiaya;
  } catch {
    return null;
  }
}

export default function HalamanPeriksa() {
  const router = useRouter();
  const [termuat, setTermuat] = useState(false);
  const [sumber, setSumber] = useState<SumberTawaran>("manual");
  const [nilaiSlot, setNilaiSlot] =
    useState<Record<SlotId, string>>(nilaiKosong);
  const [tidakTahu, setTidakTahu] = useState<Set<SlotId>>(new Set());
  const [galatAwal, setGalatAwal] = useState<KodeGalat | null>(null);
  const [galatPeriksa, setGalatPeriksa] = useState<KodeGalat | null>(null);
  const [sedangMenerbitkan, setSedangMenerbitkan] = useState(false);
  // Keterangan pertama yang belum diisi/ditandai saat pengguna mencoba
  // menerbitkan — dipakai untuk menyorot baris itu dan menggulir ke sana,
  // supaya pengguna tidak perlu mencari sendiri baris mana yang terlewat.
  const [slotBelumLengkap, setSlotBelumLengkap] = useState<SlotId | null>(null);
  const [bahasa, setBahasa] = useState<"id" | "jv">("id");
  // Baseline hasil pembacaan gambar SEBELUM dikoreksi, dan jam halaman ini
  // dibuka — keduanya murni untuk metrik anonim (CLAUDE.md §3.5): "apakah
  // dikoreksi?" dan "berapa detik sampai lembar terbit?". Tidak pernah
  // dipakai untuk penilaian maupun ditampilkan ke pengguna.
  const [bacaanAsli, setBacaanAsli] = useState<Readonly<
    Record<string, string>
  > | null>(null);
  const [waktuBukaMs] = useState<number>(() => Date.now());

  // Muat preferensi bahasa pengguna bila tersimpan
  useEffect(() => {
    const simpanan = localStorage.getItem("lembar_janji_bahasa");
    if (simpanan === "jv" || simpanan === "id") {
      setBahasa(simpanan);
    }
  }, []);

  const pilihBahasa = useCallback((baru: "id" | "jv") => {
    setBahasa(baru);
    localStorage.setItem("lembar_janji_bahasa", baru);
  }, []);

  // Muat draf tersimpan (bila ada) sekali saat halaman dibuka — S07-6.
  useEffect(() => {
    const draf = ambilIsian();
    if (draf) {
      setSumber(draf.sumber);
      setNilaiSlot(
        rekamanKeNilaiSlot(draf.nilai, SLOT_IDS) as Record<SlotId, string>,
      );
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
    if (slotBelumLengkap === id && teks.trim().length > 0)
      setSlotBelumLengkap(null);
    setNilaiSlot((sebelumnya) => ({ ...sebelumnya, [id]: teks }));
  }

  function ubahTidakTahu(id: SlotId, ditandai: boolean) {
    if (galatPeriksa) setGalatPeriksa(null);
    if (slotBelumLengkap === id && ditandai) setSlotBelumLengkap(null);
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
      SLOT_IDS.some((id) => nilaiSlot[id].trim().length > 0) ||
      tidakTahu.size > 0;
    if (!adaMasukan) {
      setSlotBelumLengkap(null);
      setGalatPeriksa(KodeGalat.E_TIDAK_ADA_MASUKAN);
      return;
    }

    // Setiap keterangan wajib diisi ATAU ditandai "Saya tidak tahu" — bukan
    // aturan penilaian (aturan keraguan §3.2 tetap sama: kosong = belum
    // dijawab), murni memastikan pengguna sadar meninggalkan sebuah
    // keterangan kosong, bukan lupa. Berhenti di keterangan PERTAMA yang
    // belum lengkap dan gulir ke sana, supaya urutan tetap 1–10 (3.2).
    const idBelumLengkap = SLOT_IDS.find(
      (id) => nilaiSlot[id].trim().length === 0 && !tidakTahu.has(id),
    );
    if (idBelumLengkap !== undefined) {
      setGalatPeriksa(null);
      setSlotBelumLengkap(idBelumLengkap);
      document
        .getElementById(`keterangan-${idBelumLengkap}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setGalatPeriksa(null);
    setSlotBelumLengkap(null);
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
      const statusLapis2 = hitungCatatanBiaya(
        nilaiFinal[5],
        nilaiFinal[9],
        acuanBiaya,
      );

      const catatanLapis1 =
        statusLapis1.status === "dimatikan" ? LAPIS1_DIMATIKAN : null;
      const catatanLapis2 =
        statusLapis2.status === "dimatikan"
          ? LAPIS2_DIMATIKAN
          : statusLapis2.status === "data-kurang"
            ? LAPIS2_ANGKA_TIDAK_ADA
            : null;

      const isiLembar = rakitIsiLembar({
        penilaian,
        nilaiAsli: nilaiFinal,
        tanggal: isiTemplat(PENANDA_WAKTU_TEMPLAT, { tanggal, jam }),
        hasilLapis1:
          statusLapis1.status === "aktif" ? statusLapis1.hasil : undefined,
        catatanHitungan:
          statusLapis2.status === "tersedia"
            ? statusLapis2.catatanHitungan
            : undefined,
      });

      // S08: render gambar sungguhan sisi server (src/app/api/kartu). Bila
      // gagal apa pun sebabnya, `/hasil` jatuh ke LembarPratinjau (teks
      // biasa) sebagai jalan mundur — lembar tetap "terbit" meski gambarnya
      // tidak berhasil dibuat.
      let urlGambarLembar: string | null = null;
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
        urlGambarLembar = await new Promise<string>((resolve, reject) => {
          const pembaca = new FileReader();
          pembaca.onloadend = () => {
            if (typeof pembaca.result === "string") {
              resolve(pembaca.result);
            } else {
              reject(new Error("pembaca-gagal"));
            }
          };
          pembaca.onerror = reject;
          pembaca.readAsDataURL(blob);
        });
      } catch {
        // Diam-diam gagal — LembarPratinjau di /hasil tetap tampil sebagai
        // jalan mundur. Lembar tetap "terbit" apa adanya.
      }

      // S13: hasil dipindah ke layar terpisah (`/hasil`) — data URL aman
      // dari lifecycle blob/unmount dan tetap valid lintas navigasi.
      simpanHasilSementara({
        isiLembar,
        urlGambarLembar,
        catatanLapis1,
        catatanLapis2,
      });

      // S10: pencatatan metrik anonim, fire-and-forget, persis di titik
      // lembar selesai dirakit (lihat komentar desain di src/lib/catat.ts).
      // `dibagikan` selalu `false` di sini karena tombol bagikan ada di
      // `/hasil`, belum bisa ditekan pada titik ini — satu-satunya titik
      // panggilan yang dijamin "satu baris = satu pemeriksaan" (CLAUDE.md
      // §3.5: nol agregasi lintas pengguna, tidak ada baris kedua yang
      // menyusul untuk sesi yang sama).
      catat({
        jalur_masukan: sumber,
        jumlah_kosong: penilaian.jumlahKosong,
        dikoreksi: apakahDikoreksi(bacaanAsli, nilaiSlot, tidakTahu),
        dibagikan: false,
        durasi_detik: Math.round((Date.now() - waktuBukaMs) / 1000),
      });

      router.push("/hasil");
    } finally {
      setSedangMenerbitkan(false);
    }
  }

  const kamusPesanGalat = bahasa === "jv" ? PESAN_GALAT_JAWA : PESAN_GALAT;
  const pesanGalatAwal = galatAwal ? kamusPesanGalat[galatAwal] : null;
  const pesanGalatPeriksa = galatPeriksa ? kamusPesanGalat[galatPeriksa] : null;
  const contohIsianAktif =
    bahasa === "jv" ? CONTOH_ISIAN_PER_SLOT_JAWA : CONTOH_ISIAN_PER_SLOT;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f2f6ff] text-[#0b1220]">
      {/* Dekorasi latar — persis pola di halaman utama, supaya /periksa
          terasa satu situs yang sama, bukan halaman terpisah. */}
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

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10 lg:px-14">
        {/* Kartu utama — satu permukaan yang menampung judul, kesepuluh
            keterangan, dan tombol terbitkan, supaya alurnya terasa seperti
            satu formulir yang mengalir, bukan daftar lepas di halaman. */}
        <div className="rounded-3xl border border-[#dbe4fb] bg-white p-5 shadow-[0_24px_60px_-30px_rgba(9,85,212,0.45)] sm:p-8">
          <div>
            <h1 className="text-[18px] md:text-[24px] font-extrabold leading-tight tracking-tight text-[#0b1220]">
              {bahasa === "jv" ? JUDUL_LAYAR_KOREKSI_JAWA : JUDUL_LAYAR_KOREKSI}
            </h1>
            <p className="mt-2 max-w-2xl text-[12px] md:text-[14px] leading-relaxed text-[#52586b]">
              {bahasa === "jv" ? KETERANGAN_KOREKSI_JAWA : KETERANGAN_KOREKSI}
            </p>
          </div>

          {pesanGalatAwal ? (
            <div className="mt-5">
              <PesanGalat pesan={pesanGalatAwal.pesan} />
            </div>
          ) : null}
          {pesanGalatPeriksa ? (
            <div className="mt-5">
              <PesanGalat pesan={pesanGalatPeriksa.pesan} />
            </div>
          ) : null}
          {slotBelumLengkap !== null ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-[#f7d7a1] bg-[#fff4d6] px-4 py-3 text-[14px] font-medium text-[#a97400]"
            >
              {bahasa === "jv"
                ? PERINGATAN_LENGKAPI_KETERANGAN_JAWA
                : PERINGATAN_LENGKAPI_KETERANGAN}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {SLOT_IDS.map((id) => (
              <BarisKeterangan
                key={id}
                id={`keterangan-${id}`}
                nomor={id}
                label={
                  bahasa === "jv" ? NAMA_SLOT_JAWA[id] : slotDenganId(id).nama
                }
                nilai={nilaiSlot[id]}
                placeholder={contohIsianAktif[id]}
                tidakTahu={tidakTahu.has(id)}
                labelTidakTahu={
                  bahasa === "jv" ? LABEL_TIDAK_TAHU_JAWA : LABEL_TIDAK_TAHU
                }
                satuanKata={
                  bahasa === "jv" ? SATUAN_KATA_JAWA : SATUAN_KATA
                }
                onUbahNilai={(teks) => ubahNilai(id, teks)}
                onUbahTidakTahu={(ditandai) => ubahTidakTahu(id, ditandai)}
                disorot={slotBelumLengkap === id}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={tanganiTerbitkanLembar}
            disabled={sedangMenerbitkan}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0955d4] px-6 py-4 text-[14px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(9,85,212,0.8)] transition-transform hover:-translate-y-0.5 hover:bg-[#0a4bbb] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {sedangMenerbitkan
              ? bahasa === "jv"
                ? TOMBOL_SEDANG_MENERBITKAN_JAWA
                : TOMBOL_SEDANG_MENERBITKAN
              : bahasa === "jv"
                ? TOMBOL_LANJUT_JAWA
                : TOMBOL_LANJUT}
          </button>
        </div>
      </main>

      <SitusFooter bahasa={bahasa} />
    </div>
  );
}
