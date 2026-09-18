"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ClipboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import SitusFooter from "@/ui/SitusFooter";
import {
  simpanIsian,
  nilaiSlotKeRekaman,
  ambilBahasaTersimpan,
  atributLang,
  simpanBahasa,
} from "@/lib/simpananLokal";
import { pilihPembaca } from "@/vision";
import type { HasilBaca } from "@/core/tipe";
import { KodeGalat } from "@/core/galat";
import type { ResponsGalat } from "@/core/galat";
import {
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
  TOMBOL_JALUR_MANUAL,
  TEKS_HALAMAN_UI,
  ALT_LOGO,
} from "@/core/teks";
import {
  KETERANGAN_KESETARAAN_JAWA,
  TOMBOL_MATIKAN_MODEL_JAWA,
  TOMBOL_NYALAKAN_MODEL_JAWA,
  KETERANGAN_MODEL_DIMATIKAN_JAWA,
  CATATAN_PRIVASI_JAWA,
  PESAN_GALAT_JAWA,
  STATUS_SEDANG_MEMBACA_JAWA,
  KETERANGAN_SEDANG_MEMBACA_JAWA,
  TOMBOL_JALUR_MANUAL_JAWA,
  TEKS_HALAMAN_UI_JAWA,
} from "@/core/teksJawa";

/** CLAUDE.md bagian 4: ukuran berkas unggahan maksimal 8 MB. */
const UKURAN_MAKSIMAL_BYTE = 8 * 1024 * 1024;
const FORMAT_DIDUKUNG = ["image/jpeg", "image/png", "image/webp"];

const assetPathPrefix = "/assets";
const imgLogo = `${assetPathPrefix}/logo.svg`;

// Id menu — labelnya datang dari kamus per bahasa (TEKS_HALAMAN_UI).
const nav = ["beranda", "tentang"] as const;

/**
 * Saklar untuk MENYEMBUNYIKAN tombol peragaan "matikan pembacaan gambar"
 * (S12-1) dari tampilan, atas permintaan tim — demo kini berupa video
 * rekaman, bukan sesi live, sehingga tombol ini dianggap tidak perlu
 * terlihat pengguna untuk saat ini. LOGIKANYA TETAP UTUH dan tetap
 * diuji (`tests/alur/tombol-model.test.ts`, `pilihPembaca` di
 * `src/vision/index.ts`) — hanya elemen UI-nya yang disembunyikan lewat
 * flag ini, bukan di-comment manual di banyak tempat, supaya `modelDimatikan`
 * dan fungsi penanganannya tidak dianggap "tidak terpakai" oleh TypeScript.
 * Set kembali ke `true` kapan saja untuk memunculkannya lagi. Dicatat di
 * PROGRESS.md.
 */
const TOMBOL_MATIKAN_MODEL_TAMPIL = false;

// Metafora daftar periksa di panel kanan — murni ilustrasi statis, TIDAK
// terhubung ke hasil baca sungguhan. Warna dan ikonnya bukan teks, jadi
// tetap di sini; label dan catatannya ikut kamus per bahasa.
const statusPanel = ["ok", "ok", "warn", "warn", "ask"] as const;

// Warna chip tiga kemungkinan keterangan di bagian "Tentang Kami", sesuai
// urutan `TEKS_HALAMAN_UI.tentang.keputusan`.
const warnaKeputusan = [
  "bg-[#e7f0ff] text-[#0955d4]",
  "bg-[#fff4d6] text-[#a97400]",
  "bg-[#eef0f4] text-[#52525b]",
];

function BagianTentang({
  t,
  onKembali,
}: {
  t: typeof TEKS_HALAMAN_UI;
  onKembali: () => void;
}) {
  return (
    <main className="relative z-10 w-full flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-44 lg:py-10">
      <div className="mx-auto flex  flex-col gap-8">
        <header>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dbe4fb] bg-white/70 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-[#0955d4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fac10b]" />
            {t.tentang.lencana}
          </span>
          <h2 className="mt-5 text-[24px] font-extrabold leading-[1.15] tracking-tight text-[#0b1220] sm:text-[28px] lg:text-[34px] lg:leading-[1.1]">
            {t.tentang.judul}
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-[#52586b]">
            {t.tentang.paragraf}
          </p>
        </header>

        <section>
          <h3 className="text-[18px] font-bold text-[#0b1220]">
            {t.tentang.judulKeputusan}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {t.tentang.keputusan.map((k, i) => (
              <div
                key={k.label}
                className="rounded-2xl border border-[#dbe4fb] bg-white p-5"
              >
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[13px] font-bold ${warnaKeputusan[i]}`}
                >
                  {k.label}
                </span>
                <p className="mt-3 text-[15px] leading-relaxed text-[#52586b]">
                  {k.ket}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#dbe4fb] bg-white p-6">
          <h3 className="text-[18px] font-bold text-[#0b1220]">
            {t.tentang.judulCaraKerja}
          </h3>
          <ol className="mt-5 grid gap-5 sm:grid-cols-3">
            {t.tentang.langkah.map((l, i) => (
              <li key={l.judul} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0955d4] text-[14px] font-bold text-white">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-[15px] font-semibold text-[#0b1220]">
                    {l.judul}
                  </span>
                  <span className="mt-1 block text-[15px] leading-relaxed text-[#52586b]">
                    {l.ket}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#dbe4fb] bg-white p-6">
            <h3 className="text-[18px] font-bold text-[#0b1220]">
              {t.tentang.judulDisimpan}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {t.tentang.tidakDisimpan.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0955d4]" />
                  <span className="text-[15px] leading-relaxed text-[#52586b]">
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[#dbe4fb] bg-white p-6">
            <h3 className="text-[18px] font-bold text-[#0b1220]">
              {t.tentang.judulBatas}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {t.tentang.batas.map((b) => (
                <li key={b} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fac10b]" />
                  <span className="text-[15px] leading-relaxed text-[#52586b]">
                    {b}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#dbe4fb] bg-white p-6">
          <button
            type="button"
            onClick={onKembali}
            className="rounded-xl bg-[#0955d4] px-6 py-3 text-[15px] font-bold text-white transition-colors hover:bg-[#0a4bbb]"
          >
            {t.tentang.tombolKembali}
          </button>
          <p className="text-[15px] text-[#52586b]">
            {t.tentang.catatanKembali}
          </p>
        </div>
      </div>
    </main>
  );
}

const statusStyles: Record<
  string,
  { ring: string; dot: string; icon: string }
> = {
  ok: { ring: "bg-[#e7f0ff] text-[#0955d4]", dot: "bg-[#0955d4]", icon: "✓" },
  warn: { ring: "bg-[#fff4d6] text-[#a97400]", dot: "bg-[#fac10b]", icon: "–" },
  ask: { ring: "bg-[#eef0f4] text-[#52525b]", dot: "bg-[#a1a1aa]", icon: "?" },
};

type AlasanBerkasDitolak = "terlalu-besar" | "format-tidak-didukung";

function alasanKeKodeGalat(alasan: AlasanBerkasDitolak): KodeGalat {
  return alasan === "terlalu-besar"
    ? KodeGalat.E_GAMBAR_TERLALU_BESAR
    : KodeGalat.E_FORMAT_TIDAK_DIDUKUNG;
}

function validasiBerkas(berkas: File): AlasanBerkasDitolak | null {
  if (berkas.size > UKURAN_MAKSIMAL_BYTE) return "terlalu-besar";
  if (!FORMAT_DIDUKUNG.includes(berkas.type)) return "format-tidak-didukung";
  return null;
}

type HasilBacaGambar =
  | { readonly jenis: "sukses"; readonly hasilBaca: HasilBaca }
  | { readonly jenis: "galat"; readonly kode: KodeGalat }
  | { readonly jenis: "fallback-manual"; readonly hasilBaca: HasilBaca };

/**
 * Sama persis dengan logika lama: memanggil `/api/baca` (multipart/form-data,
 * kunci "berkas"); galat dari endpoint dipakai apa adanya, dan HANYA jatuh ke
 * `pilihPembaca` bila fetch gagal total. Saat `modelDimatikan`, endpoint
 * tidak pernah dipanggil sama sekali.
 */
async function bacaGambarSementara(
  berkas: File,
  modelDimatikan: boolean,
): Promise<HasilBacaGambar> {
  if (modelDimatikan) {
    const pembaca = pilihPembaca("gambar", {
      modelDimatikan: true,
      paksaManual: true,
    });
    const hasilBaca = await pembaca.baca({ sumber: "gambar", berkas });
    return { jenis: "fallback-manual", hasilBaca };
  }

  try {
    const formData = new FormData();
    formData.append("berkas", berkas);
    const respons = await fetch("/api/baca", {
      method: "POST",
      body: formData,
    });

    if (respons.ok) {
      const hasilBaca = (await respons.json()) as HasilBaca;
      return { jenis: "sukses", hasilBaca };
    }

    const isiGalat = (await respons.json()) as ResponsGalat;
    return { jenis: "galat", kode: isiGalat.kode };
  } catch {
    // endpoint tidak menjawab sama sekali → jatuh ke pembaca lokal
  }

  const pembaca = pilihPembaca("gambar");
  const hasilBaca = await pembaca.baca({ sumber: "gambar", berkas });
  return { jenis: "fallback-manual", hasilBaca };
}

export default function App() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const berkasTerakhirRef = useRef<File | null>(null);
  const bahasaMenuRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState("beranda");
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [bahasaMenuTerbuka, setBahasaMenuTerbuka] = useState(false);

  const [berkasTerpilih, setBerkasTerpilih] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [sedangMemroses, setSedangMemroses] = useState(false);
  const [galat, setGalat] = useState<KodeGalat | null>(null);
  // Saklar demo S12-1 — bawaan MATI (model dipakai), dinyalakan sadar oleh
  // penyaji saat presentasi agar lapisan model sungguhan tidak tersentuh.
  const [modelDimatikan, setModelDimatikan] = useState(false);
  // Modal yang menampilkan KETERANGAN_MODEL_DIMATIKAN saat saklar dinyalakan,
  // menggantikan paragraf yang tadinya selalu tampil di bawah saklar.
  const [modalModelTerbuka, setModalModelTerbuka] = useState(false);
  // Bahasa daerah — inklusivitas keluarga PMI di desa.
  const [bahasa, setBahasa] = useState<"id" | "jv">("id");

  useEffect(() => {
    const simpanan = ambilBahasaTersimpan();
    if (simpanan) {
      setBahasa(simpanan);
      document.documentElement.lang = atributLang(simpanan);
    }
  }, []);

  // Dibuka dari SitusNavbar di /periksa atau /hasil ("Tentang Kami" hanya
  // ada di halaman ini) — bukan pengganti nav Beranda/Tentang yang sudah ada.
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("tentang=1")
    ) {
      setActive("tentang");
    }
  }, []);

  const pilihBahasa = useCallback((baru: "id" | "jv") => {
    setBahasa(baru);
    simpanBahasa(baru);
    setBahasaMenuTerbuka(false);
  }, []);

  // Tutup dropdown bahasa saat pengguna mengklik di luar area saklarnya.
  useEffect(() => {
    if (!bahasaMenuTerbuka) return;
    function tanganiKlikLuar(peristiwa: MouseEvent) {
      if (!bahasaMenuRef.current?.contains(peristiwa.target as Node)) {
        setBahasaMenuTerbuka(false);
      }
    }
    document.addEventListener("mousedown", tanganiKlikLuar);
    return () => document.removeEventListener("mousedown", tanganiKlikLuar);
  }, [bahasaMenuTerbuka]);

  const tanganiJalurManual = useCallback(() => {
    router.push("/periksa");
  }, [router]);

  const tanganiSaklarModel = useCallback(() => {
    setModelDimatikan((sebelumnya) => {
      const baru = !sebelumnya;
      // Hanya keadaan "dimatikan" yang punya teks keterangan (dari
      // teks.ts/teksJawa.ts) — jadi modal hanya muncul saat dinyalakan ke
      // mode ini, bukan saat kembali ke mode model aktif.
      setModalModelTerbuka(baru);
      return baru;
    });
    setGalat(null);
  }, []);

  const tanganiTutupModalModel = useCallback(() => {
    setModalModelTerbuka(false);
  }, []);

  const terimaBerkas = useCallback((berkas: File) => {
    const alasanDitolak = validasiBerkas(berkas);
    if (alasanDitolak) {
      setGalat(alasanKeKodeGalat(alasanDitolak));
      setBerkasTerpilih(null);
      return;
    }
    setGalat(null);
    setBerkasTerpilih(berkas);
  }, []);

  const tanganiInputBerkas = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const berkas = e.target.files?.[0];
      if (berkas) terimaBerkas(berkas);
    },
    [terimaBerkas],
  );

  const tanganiDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const berkas = e.dataTransfer.files?.[0];
      if (berkas) terimaBerkas(berkas);
    },
    [terimaBerkas],
  );

  const tanganiPaste = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      const item = Array.from(e.clipboardData.items).find((i) =>
        i.type.startsWith("image/"),
      );
      const berkas = item?.getAsFile();
      if (berkas) terimaBerkas(berkas);
    },
    [terimaBerkas],
  );

  const prosesGambar = useCallback(
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
            hasil.jenis === "fallback-manual"
              ? KodeGalat.E_MODEL_TIDAK_TERSEDIA
              : undefined,
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
      void prosesGambar(berkasTerakhirRef.current);
    } else {
      setGalat(null);
    }
  }, [prosesGambar]);

  const tanganiUlangiGambar = useCallback(() => {
    setGalat(null);
    setBerkasTerpilih(null);
    berkasTerakhirRef.current = null;
  }, []);

  const tanganiMulaiPeriksa = useCallback(() => {
    if (sedangMemroses) return;
    if (!berkasTerpilih) {
      // Bukan galat format: pengguna belum memilih berkas sama sekali. Kode
      // yang benar adalah "belum ada masukan", bukan "berkas tak terbaca" —
      // kalimat E_FORMAT_TIDAK_DIDUKUNG menyalahkan berkas yang tidak ada.
      setGalat(KodeGalat.E_TIDAK_ADA_MASUKAN);
      return;
    }
    void prosesGambar(berkasTerpilih);
  }, [berkasTerpilih, sedangMemroses, prosesGambar]);

  const t = bahasa === "jv" ? TEKS_HALAMAN_UI_JAWA : TEKS_HALAMAN_UI;
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

  const tombolMatikanModel =
    bahasa === "jv" ? TOMBOL_MATIKAN_MODEL_JAWA : TOMBOL_MATIKAN_MODEL;
  const tombolNyalakanModel =
    bahasa === "jv" ? TOMBOL_NYALAKAN_MODEL_JAWA : TOMBOL_NYALAKAN_MODEL;
  const keteranganModelDimatikan =
    bahasa === "jv"
      ? KETERANGAN_MODEL_DIMATIKAN_JAWA
      : KETERANGAN_MODEL_DIMATIKAN;
  const keteranganKesetaraan =
    bahasa === "jv" ? KETERANGAN_KESETARAAN_JAWA : KETERANGAN_KESETARAAN;
  const catatanPrivasi =
    bahasa === "jv" ? CATATAN_PRIVASI_JAWA : CATATAN_PRIVASI;
  const statusSedangMembaca =
    bahasa === "jv" ? STATUS_SEDANG_MEMBACA_JAWA : STATUS_SEDANG_MEMBACA;
  const keteranganSedangMembaca =
    bahasa === "jv"
      ? KETERANGAN_SEDANG_MEMBACA_JAWA
      : KETERANGAN_SEDANG_MEMBACA;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f2f6ff] text-[#0b1220]">
      <div
        aria-hidden
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
        aria-hidden
        className="animasi-denyut pointer-events-none absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-[#fac10b]/25 blur-[120px]"
      />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-44 lg:pt-7">
        <button
          type="button"
          onClick={() => setActive("beranda")}
          aria-label={t.nav.beranda}
          className="flex items-center gap-2 sm:gap-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- aset statis di public/, bukan konten dinamis */}
          <img src={imgLogo} alt={ALT_LOGO} className="h-9 w-auto sm:h-11" />
          <span className="text-[17px] font-bold tracking-tight text-[#0955d4] sm:text-[20px]">
            Lembar Janji
          </span>
        </button>

        {/* Kontrol navbar — baris penuh dari md ke atas */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Saklar Bahasa Daerah — inklusivitas keluarga PMI di desa.
              Dipencet membuka dropdown berisi kedua pilihan, bukan langsung
              bertukar (S13 polish). */}
          <div ref={bahasaMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setBahasaMenuTerbuka((sebelumnya) => !sebelumnya)}
              aria-label={LABEL_PILIH_BAHASA}
              aria-haspopup="listbox"
              aria-expanded={bahasaMenuTerbuka}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe4fb] bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-[#3f4657] backdrop-blur transition-colors hover:text-[#0955d4]"
            >
              🌐{" "}
              {bahasa === "id" ? LABEL_GANTI_BAHASA_ID : LABEL_GANTI_BAHASA_JV}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${bahasaMenuTerbuka ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {bahasaMenuTerbuka ? (
              <div
                role="listbox"
                className="absolute right-0 top-[calc(100%+8px)] z-30 w-44 overflow-hidden rounded-xl border border-[#dbe4fb] bg-white p-1 shadow-[0_20px_50px_-25px_rgba(11,18,32,0.35)]"
              >
                {(
                  [
                    ["id", LABEL_GANTI_BAHASA_ID],
                    ["jv", LABEL_GANTI_BAHASA_JV],
                  ] as const
                ).map(([kode, label]) => (
                  <button
                    key={kode}
                    type="button"
                    role="option"
                    aria-selected={bahasa === kode}
                    onClick={() => pilihBahasa(kode)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-semibold transition-colors ${
                      bahasa === kode
                        ? "bg-[#e7f0ff] text-[#0955d4]"
                        : "text-[#3f4657] hover:bg-[#f2f6ff]"
                    }`}
                  >
                    {label}
                    {bahasa === kode ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {/* Saklar demo S12-1 — sekarang di navbar; teks keterangannya
              muncul sebagai modal (lihat di bawah), bukan paragraf tetap.
              Disembunyikan sementara lewat TOMBOL_MATIKAN_MODEL_TAMPIL. */}
          {TOMBOL_MATIKAN_MODEL_TAMPIL ? (
            <button
              type="button"
              role="switch"
              aria-checked={modelDimatikan}
              onClick={tanganiSaklarModel}
              disabled={sedangMemroses}
              title={modelDimatikan ? tombolNyalakanModel : tombolMatikanModel}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                modelDimatikan
                  ? "border-[#fac10b] bg-[#fff4d6] text-[#a97400]"
                  : "border-[#dbe4fb] bg-white/70 text-[#3f4657] hover:text-[#0955d4]"
              }`}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v10" />
                <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
              </svg>
              {modelDimatikan ? tombolNyalakanModel : tombolMatikanModel}
            </button>
          ) : null}
          <nav className="flex items-center gap-1 rounded-full border border-[#dbe4fb] bg-white/70 p-1 backdrop-blur">
            {nav.map((id) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`rounded-full px-5 py-2 text-[15px] font-semibold transition-colors ${
                  active === id
                    ? "bg-[#0955d4] text-white"
                    : "text-[#3f4657] hover:text-[#0955d4]"
                }`}
              >
                {t.nav[id]}
              </button>
            ))}
          </nav>
        </div>

        {/* Tombol hamburger — di bawah md, menggantikan seluruh baris kontrol */}
        <button
          type="button"
          onClick={() => setMenuTerbuka((sebelumnya) => !sebelumnya)}
          aria-label={t.ariaMenu}
          aria-expanded={menuTerbuka}
          aria-controls="menu-navbar-mobile"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dbe4fb] bg-white/70 text-[#3f4657] backdrop-blur md:hidden"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {menuTerbuka ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </header>

      {/* Panel menu mobile — muncul di bawah header, hanya di bawah md */}
      {menuTerbuka ? (
        <div
          id="menu-navbar-mobile"
          className="relative z-20 mx-4 mb-2 flex flex-col gap-1 rounded-2xl border border-[#dbe4fb] bg-white p-2 shadow-[0_20px_50px_-25px_rgba(11,18,32,0.35)] md:hidden"
        >
          {nav.map((id) => (
            <button
              key={id}
              onClick={() => {
                setActive(id);
                setMenuTerbuka(false);
              }}
              className={`rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition-colors ${
                active === id
                  ? "bg-[#0955d4] text-white"
                  : "text-[#3f4657] hover:bg-[#f2f6ff]"
              }`}
            >
              {t.nav[id]}
            </button>
          ))}
          <div className="my-1 h-px bg-[#eef1f6]" />
          {(
            [
              ["id", LABEL_GANTI_BAHASA_ID],
              ["jv", LABEL_GANTI_BAHASA_JV],
            ] as const
          ).map(([kode, label]) => (
            <button
              key={kode}
              type="button"
              role="option"
              aria-selected={bahasa === kode}
              onClick={() => {
                pilihBahasa(kode);
                setMenuTerbuka(false);
              }}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition-colors ${
                bahasa === kode
                  ? "bg-[#e7f0ff] text-[#0955d4]"
                  : "text-[#3f4657] hover:bg-[#f2f6ff]"
              }`}
            >
              🌐 {label}
              {bahasa === kode ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : null}
            </button>
          ))}
          {TOMBOL_MATIKAN_MODEL_TAMPIL ? (
            <button
              type="button"
              role="switch"
              aria-checked={modelDimatikan}
              disabled={sedangMemroses}
              onClick={() => {
                tanganiSaklarModel();
                setMenuTerbuka(false);
              }}
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-[#3f4657] hover:bg-[#f2f6ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v10" />
                <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
              </svg>
              {modelDimatikan ? tombolNyalakanModel : tombolMatikanModel}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Modal keterangan saklar model — muncul saat model dimatikan */}
      {modalModelTerbuka ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b1220]/40 px-6"
          onClick={tanganiTutupModalModel}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[#dbe4fb] bg-white p-5 shadow-[0_40px_80px_-30px_rgba(11,18,32,0.45)]"
          >
            <div className="flex items-start justify-between gap-4">
              <p className="text-[15px] font-bold text-[#0b1220]">
                {tombolNyalakanModel}
              </p>
              <button
                type="button"
                onClick={tanganiTutupModalModel}
                aria-label={t.ariaTutup}
                className="shrink-0 rounded-full p-1 text-[#8890a0] hover:bg-[#f2f6ff] hover:text-[#0b1220]"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#52586b]">
              {keteranganModelDimatikan}
            </p>
            <button
              type="button"
              onClick={tanganiTutupModalModel}
              className="mt-4 w-full rounded-xl bg-[#0955d4] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#0a4bbb]"
            >
              {t.modalMengerti}
            </button>
          </div>
        </div>
      ) : null}

      {/* Workspace: asymmetric split */}
      {active === "tentang" ? (
        <BagianTentang t={t} onKembali={() => setActive("beranda")} />
      ) : (
        <main className="relative z-10 grid flex-1 grid-cols-1 items-center gap-10 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-44 lg:py-0">
          <section className="max-w-[600px]">
            <span className="animasi-muncul inline-flex items-center gap-2 rounded-full border border-[#dbe4fb] bg-white/70 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-[#0955d4]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#fac10b]" />
              {t.heroLencana}
            </span>

            <h1 className="animasi-muncul animasi-tunda-1 mt-5 text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#0b1220] sm:text-[38px] lg:text-[46px] lg:leading-[1.05]">
              {t.heroJudulAwal}{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">{t.heroJudulSorot}</span>
                <span className="animasi-garis absolute inset-x-0 bottom-1 z-0 h-3 bg-[#fac10b]/60" />
              </span>
            </h1>

            <p className="animasi-muncul animasi-tunda-2 mt-4 max-w-[480px] text-[15px] leading-relaxed text-[#52586b]">
              {t.heroSubjudul}
            </p>

            {pesanGalatAktif ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-[#f7d7a1] bg-[#fff4d6] px-4 py-3 text-[13px] text-[#a97400]"
              >
                <p className="font-semibold">{pesanGalatAktif.pesan}</p>
                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                  {pesanGalatAktif.tindakan && aksiGalatUtama ? (
                    <button
                      type="button"
                      onClick={aksiGalatUtama}
                      className="font-semibold underline underline-offset-2"
                    >
                      {pesanGalatAktif.tindakan}
                    </button>
                  ) : null}
                  {pesanGalatAktif.tindakanSekunder && aksiGalatSekunder ? (
                    <button
                      type="button"
                      onClick={aksiGalatSekunder}
                      className="font-semibold underline underline-offset-2"
                    >
                      {pesanGalatAktif.tindakanSekunder}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Action module — satu alur kerja, satu titik masuk gambar */}
            <div className="animasi-muncul animasi-tunda-3 mt-7 rounded-2xl border border-[#dbe4fb] bg-white p-2 shadow-[0_24px_60px_-30px_rgba(9,85,212,0.45)]">
              <div className="p-3">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={tanganiDrop}
                  onPaste={tanganiPaste}
                  tabIndex={0}
                >
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sedangMemroses}
                    aria-busy={sedangMemroses}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 border-dashed px-4 py-5 text-left transition-colors disabled:cursor-not-allowed ${
                      sedangMemroses
                        ? "border-[#c3d4f7] bg-[#f7faff] opacity-90"
                        : dragOver
                          ? "border-[#0955d4] bg-[#eef4ff]"
                          : "border-[#c3d4f7] bg-[#f7faff] hover:border-[#0955d4] hover:bg-[#eef4ff]"
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#0955d4]/10 text-[#0955d4]">
                      {sedangMemroses ? (
                        <svg
                          className="animate-spin"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="9"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeOpacity="0.25"
                          />
                          <path
                            d="M21 12a9 9 0 0 0-9-9"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <path d="M12 3v13" />
                          <path d="m7 8 5-5 5 5" />
                        </svg>
                      )}
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold text-[#0b1220]">
                        {sedangMemroses
                          ? statusSedangMembaca
                          : (berkasTerpilih?.name ?? t.seretBerkas)}
                      </span>
                      <span className="block text-[12px] text-[#8890a0]">
                        {sedangMemroses
                          ? keteranganSedangMembaca
                          : t.keteranganFormat}
                      </span>
                    </span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={tanganiInputBerkas}
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    onClick={tanganiMulaiPeriksa}
                    disabled={sedangMemroses || !berkasTerpilih}
                    className="mt-3 flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0955d4] px-6 py-4 text-[16px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(9,85,212,0.8)] transition-transform hover:-translate-y-0.5 hover:bg-[#0a4bbb] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 text-sm"
                  >
                    {sedangMemroses ? statusSedangMembaca : t.tombolMulai}
                    {!sedangMemroses ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    ) : null}
                  </button>
                  <button
                    onClick={tanganiJalurManual}
                    disabled={sedangMemroses}
                    className="mt-3 flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ffc508] px-6 py-4 text-[16px] font-bold text-white shadow-[0_14px_30px_-12px_#FFD346] transition-transform hover:-translate-y-0.5 hover:bg-[#ffc400] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 text-sm"
                  >
                    {/* Label TIDAK diganti saat memroses: tombol ini tidak
                        membaca gambar, jadi jangan mengaku sedang membacanya. */}
                    {bahasa === "jv" ? TOMBOL_JALUR_MANUAL_JAWA : TOMBOL_JALUR_MANUAL}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT — panel ilustrasi statis (bukan hasil sungguhan). Kembali
              ke perilaku semula atas permintaan pengguna: disembunyikan
              total di bawah lg, tidak perlu tampil di mobile sama sekali
              (percobaan reorder/interleave sebelumnya dibalik). */}
          <section className="relative hidden lg:flex lg:h-full lg:items-center lg:justify-center">
            <div className="absolute right-6 top-14 h-[420px] w-[300px] rotate-6 rounded-2xl border border-[#dbe4fb] bg-white/60" />
            <div className="animasi-mengapung relative w-[360px] -rotate-2 rounded-2xl border border-[#dbe4fb] bg-white p-6 shadow-[0_40px_80px_-40px_rgba(11,18,32,0.4)]">
              <div className="flex items-center justify-between border-b border-[#eef1f6] pb-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8890a0]">
                    {t.panel.judul}
                  </p>
                  <p className="text-[16px] font-bold text-[#0b1220]">
                    {t.panel.loker}
                  </p>
                </div>
                <span className="rounded-full bg-[#eef0f4] px-3 py-1 text-[12px] font-bold uppercase tracking-wide text-[#52525b]">
                  {t.panel.lencanaContoh}
                </span>
              </div>

              <ul className="mt-4 space-y-3">
                {t.panel.baris.map((item, i) => {
                  const s =
                    statusStyles[statusPanel[i] ?? "ask"] ?? statusStyles.ask!;
                  return (
                    <li key={item.label} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${s.ring}`}
                      >
                        {s.icon}
                      </span>
                      <span className="flex-1">
                        <span className="block text-[14px] font-semibold text-[#0b1220]">
                          {item.label}
                        </span>
                        <span className="block text-[12px] text-[#8890a0]">
                          {item.note}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 rounded-xl bg-[#f2f6ff] p-3 text-[12px] leading-relaxed text-[#52586b]">
                <span className="font-semibold text-[#0955d4]">
                  {t.panel.catatanSorot}
                </span>{" "}
                {t.panel.catatanSisa}
              </div>
            </div>
          </section>
        </main>
      )}

      <SitusFooter bahasa={bahasa} />
    </div>
  );
}
