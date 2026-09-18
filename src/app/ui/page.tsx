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
import { simpanIsian, nilaiSlotKeRekaman } from "@/lib/simpananLokal";
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
} from "@/core/teksJawa";
import Tombol from "@/ui/Tombol";

/** CLAUDE.md bagian 4: ukuran berkas unggahan maksimal 8 MB. */
const UKURAN_MAKSIMAL_BYTE = 8 * 1024 * 1024;
const FORMAT_DIDUKUNG = ["image/jpeg", "image/png", "image/webp"];

const assetPathPrefix = "/assets";
const imgLogo = `${assetPathPrefix}/logo.svg`;

const nav = [
  { id: "beranda", label: "Beranda" },
  { id: "tentang", label: "Tentang Kami" },
];

// Metafora daftar periksa di panel kanan — murni ilustrasi statis, TIDAK
// terhubung ke hasil baca sungguhan.
const checklistContoh = [
  { label: "Gaji & mata uang", status: "ok", note: "Rp 4.500.000 / bulan" },
  { label: "Nama & alamat majikan", status: "ok", note: "Tercantum lengkap" },
  { label: "Biaya penempatan", status: "warn", note: "Belum disebutkan" },
  { label: "Agen resmi (P3MI)", status: "warn", note: "Perlu ditanyakan" },
  { label: "Masa & isi kontrak", status: "ask", note: "2 tahun — cek detail" },
];

const statusStyles: Record<
  string,
  { ring: string; dot: string; icon: string }
> = {
  ok: { ring: "bg-[#e7f0ff] text-[#0955d4]", dot: "bg-[#0955d4]", icon: "✓" },
  warn: { ring: "bg-[#fff4d6] text-[#a97400]", dot: "bg-[#fac10b]", icon: "!" },
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

  const [active, setActive] = useState("beranda");
  const [method, setMethod] = useState<"upload" | "manual">("upload");

  const [berkasTerpilih, setBerkasTerpilih] = useState<File | null>(null);
  const [tekstManual, setTekstManual] = useState("");
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

    if (method === "upload") {
      if (!berkasTerpilih) {
        setGalat(KodeGalat.E_FORMAT_TIDAK_DIDUKUNG);
        return;
      }
      void prosesGambar(berkasTerpilih);
      return;
    }

    // Jalur manual: sama seperti lama — arahkan ke /periksa dan biarkan
    // pengguna mengisi slot di sana. TODO: bila nanti ingin auto-mengisi
    // dari `tekstManual`, perlu fungsi parser teks bebas → slot terlebih
    // dulu (belum ada di kode lama).
    router.push("/periksa");
  }, [method, berkasTerpilih, sedangMemroses, prosesGambar, router]);

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
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#f2f6ff] text-[#0b1220]">
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
        className="pointer-events-none absolute -right-40 top-1/3 h-[420px] w-[420px] rounded-full bg-[#fac10b]/25 blur-[120px]"
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-14 pt-7">
        <div className="flex items-center gap-3">
          <img src={imgLogo} alt="Logo Lembar Janji" className="h-11 w-auto" />
          <span className="text-[20px] font-bold tracking-tight text-[#0955d4]">
            Lembar Janji
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Saklar Bahasa Daerah — inklusivitas keluarga PMI di desa */}
          <button
            type="button"
            onClick={gantiBahasa}
            aria-label={LABEL_PILIH_BAHASA}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe4fb] bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-[#3f4657] backdrop-blur transition-colors hover:text-[#0955d4]"
          >
            🌐 {bahasa === "id" ? LABEL_GANTI_BAHASA_JV : LABEL_GANTI_BAHASA_ID}
          </button>
          {/* Saklar demo S12-1 — sekarang di navbar; teks keterangannya
              muncul sebagai modal (lihat di bawah), bukan paragraf tetap. */}
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
          <nav className="flex items-center gap-1 rounded-full border border-[#dbe4fb] bg-white/70 p-1 backdrop-blur">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`rounded-full px-5 py-2 text-[15px] font-semibold transition-colors ${
                  active === item.id
                    ? "bg-[#0955d4] text-white"
                    : "text-[#3f4657] hover:text-[#0955d4]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

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
                aria-label="Tutup"
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
              Mengerti
            </button>
          </div>
        </div>
      ) : null}

      {/* Workspace: asymmetric split */}
      <main className="relative z-10 grid flex-1 grid-cols-1 items-center gap-10 px-14 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="max-w-[600px]">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#dbe4fb] bg-white/70 px-3 py-1 text-[12px] font-semibold uppercase tracking-wider text-[#0955d4]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fac10b]" />
            Periksa sebelum berangkat
          </span>

          <h1 className="mt-5 text-[46px] font-extrabold leading-[1.05] tracking-tight text-[#0b1220]">
            Pastikan tawaran kerja itu{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">menepati janji.</span>
              <span className="absolute inset-x-0 bottom-1 z-0 h-3 bg-[#fac10b]/60" />
            </span>
          </h1>

          <p className="mt-4 max-w-[480px] text-[15px] leading-relaxed text-[#52586b]">
            Kirim poster lowongannya. Kami ubah menjadi daftar periksa yang
            jelas, apa yang sudah dijanjikan, apa yang belum dijawab, dan apa
            yang wajib Anda tanyakan sebelum menandatangani.
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

          {/* Action module — satu alur kerja, dua titik masuk */}
          <div className="mt-7 rounded-2xl border border-[#dbe4fb] bg-white p-2 shadow-[0_24px_60px_-30px_rgba(9,85,212,0.45)]">
            <div className="flex gap-1 rounded-xl bg-[#f2f6ff] p-1">
              <button
                onClick={() => setMethod("upload")}
                disabled={sedangMemroses}
                className={`flex-1 rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  method === "upload"
                    ? "bg-white text-[#0955d4] shadow-sm"
                    : "text-[#6b7280] hover:text-[#0b1220]"
                }`}
              >
                Unggah / tempel gambar
              </button>
              {/* <button
                onClick={() => setMethod("manual")}
                disabled={sedangMemroses}
                className={`flex-1 rounded-lg px-4 py-2 text-[14px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  method === "manual"
                    ? "bg-white text-[#0955d4] shadow-sm"
                    : "text-[#6b7280] hover:text-[#0b1220]"
                }`}
              >
                Ketik sendiri
              </button> */}
            </div>

            <div className="p-3">
              {method === "upload" ? (
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
                          : (berkasTerpilih?.name ??
                            "Seret poster ke sini atau klik untuk pilih")}
                      </span>
                      <span className="block text-[12px] text-[#8890a0]">
                        {sedangMemroses
                          ? keteranganSedangMembaca
                          : "Format JPG atau PNG · maks. 8 MB"}
                      </span>
                    </span>
                  </button>
                </div>
              ) : (
                <textarea
                  rows={3}
                  value={tekstManual}
                  onChange={(e) => setTekstManual(e.target.value)}
                  disabled={sedangMemroses}
                  placeholder="Tempel atau ketik isi lowongan: gaji, negara, majikan, biaya, agen…"
                  className="w-full resize-none rounded-xl border-2 border-[#e3e9f5] bg-[#f7faff] px-4 py-3 text-[14px] text-[#0b1220] outline-none transition-colors placeholder:text-[#9aa2b4] focus:border-[#0955d4] disabled:cursor-not-allowed disabled:opacity-60"
                />
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={tanganiInputBerkas}
              />
              <div className="flex gap-2">
                <button
                  onClick={tanganiMulaiPeriksa}
                  disabled={
                    sedangMemroses || (method === "upload" && !berkasTerpilih)
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0955d4] px-6 py-4 text-[16px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(9,85,212,0.8)] transition-transform hover:-translate-y-0.5 hover:bg-[#0a4bbb] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 text-sm"
                >
                  {sedangMemroses
                    ? statusSedangMembaca
                    : "Mulai periksa tawaran"}
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
                  className="mt-3 flex w-2/4 items-center justify-center gap-2 rounded-xl bg-[#ffc508] px-6 py-4 text-[16px] font-bold text-white shadow-[0_14px_30px_-12px_#FFD346] transition-transform hover:-translate-y-0.5 hover:bg-[#ffc400] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 text-sm"
                >
                  {sedangMemroses
                    ? statusSedangMembaca
                    : bahasa === "jv"
                      ? TOMBOL_JALUR_MANUAL_JAWA
                      : TOMBOL_JALUR_MANUAL}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-1 text-center lg:text-left">
            <p className="text-[12px] text-[#8890a0]">{keteranganKesetaraan}</p>
            <p className="text-[12px] text-[#8890a0]">{catatanPrivasi}</p>
          </div>
        </section>

        {/* RIGHT — panel ilustrasi statis (bukan hasil sungguhan) */}
        <section className="relative hidden h-full items-center justify-center lg:flex">
          <div className="absolute right-6 top-14 h-[420px] w-[300px] rotate-6 rounded-2xl border border-[#dbe4fb] bg-white/60" />
          <div className="relative w-[360px] -rotate-2 rounded-2xl border border-[#dbe4fb] bg-white p-6 shadow-[0_40px_80px_-40px_rgba(11,18,32,0.4)]">
            <div className="flex items-center justify-between border-b border-[#eef1f6] pb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8890a0]">
                  Lembar Periksa
                </p>
                <p className="text-[16px] font-bold text-[#0b1220]">
                  Loker: Perawat, Taiwan
                </p>
              </div>
              <span className="rounded-full bg-[#e7f0ff] px-3 py-1 text-[12px] font-bold text-[#0955d4]">
                3 / 5
              </span>
            </div>

            <ul className="mt-4 space-y-3">
              {checklistContoh.map((item) => {
                const s = statusStyles[item.status] ?? statusStyles.ask!;
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
                2 hal perlu ditanyakan
              </span>{" "}
              sebelum Anda menyetujui tawaran ini.
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 flex items-center justify-between px-14 pb-6 pt-2 text-[12px] text-[#8890a0]">
        <p>© 2026 Lembar Janji. All rights reserved</p>
        <p className="hidden sm:block">
          Dibuat untuk melindungi pekerja migran Indonesia
        </p>
      </footer>
    </div>
  );
}
