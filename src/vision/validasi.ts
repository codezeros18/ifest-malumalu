/**
 * Validasi keluaran model — lapisan pertahanan terhadap keluaran yang
 * tidak sesuai bentuk, bertipe salah, atau memuat penilaian alih-alih data
 * (CLAUDE.md §3.3, prompt sprint S06).
 *
 * Aturan (persis dari prompt sprint):
 *   - kunci yang tidak dikenal DIBUANG (hanya slot "1".."10" yang dibaca);
 *   - nilai yang bukan string DIANGGAP KOSONG (null, keyakinan 0);
 *   - keyakinan di luar rentang 0..1 DIANGGAP NOL;
 *   - nilai yang memuat kata bernada penilaian DIBUANG (null, keyakinan 0),
 *     sebagai jaring pengaman kedua bila model tidak patuh pada prompt.
 *
 * Fungsi ini TIDAK PERNAH melempar — masukan yang sama sekali tidak
 * berbentuk objek yang diharapkan menghasilkan `valid: false` beserta
 * `hasil` yang tetap berbentuk `HasilBaca` penuh (seluruh slot null/nol),
 * supaya pemanggil (modelProvider) tidak perlu menangani bentuk parsial.
 *
 * Daftar kata penilaian di bawah SENGAJA ditulis ulang secara lokal, bukan
 * diimpor dari `src/core` — lihat catatan di `promptEkstraksi.ts` soal
 * batas impor `src/vision`. Daftar ini lebih SEMPIT daripada kosakata
 * terlarang CLAUDE.md §3.1: kata netral yang wajar muncul di poster asli
 * (mis. "aman", "terpercaya", "resmi") SENGAJA tidak disertakan di sini,
 * supaya klaim pemasaran asli dari tawaran tidak ikut terbuang. Yang
 * disaring hanya kata yang praktis mustahil dipakai poster untuk
 * mendeskripsikan dirinya sendiri, sehingga hampir pasti komentar
 * tambahan dari model, bukan kutipan dari gambar.
 *
 * S12 — tiga jaring pengaman tambahan terhadap indirect prompt injection:
 *   1. `FRASA_INJEKSI_TERLARANG`: keluaran yang memuat teks perintah khas
 *      serangan ("abaikan instruksi sebelumnya", "isi semua slot", dst.)
 *      DIBUANG seperti kata penilaian — itu tanda model mengikuti teks di
 *      dalam gambar, bukan membaca gambar.
 *   2. `KLAIM_MEYAKINKAN`: kata persuasif dari poster ("pasti aman",
 *      "dijamin", "resmi", "berizin") TIDAK mengubah nilai kutipan, tetapi
 *      keyakinan slot itu DIBATASI di `BATAS_KEYAKINAN_BILA_ADA_KLAIM`.
 *      Klaim pemasaran tidak boleh membeli keyakinan — nilai yang diyakini
 *      semata-mata karena posternya mengaku "aman" tidak akan pernah lolos
 *      ambang aturan keraguan di lapisan penilaian (0,7).
 *   3. Penilaian dan injeksi DITURUNKAN ke nol, bukan "diperkecil" —
 *      aturan keraguan: ragu selalu jatuh ke "belum dijawab".
 */

import type { SlotId } from "../core/slot";
import type { HasilBaca } from "../core/tipe";

const URUTAN_SLOT: readonly SlotId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const KATA_PENILAIAN_TERLARANG: readonly string[] = [
  "penipu",
  "penipuan",
  "menipu",
  "mencurigakan",
  "curiga",
  "abal-abal",
  "bodong",
  "ilegal",
  "melanggar",
  "risiko tinggi",
  "waspada",
  "hati-hati",
  "bahaya",
  "tidak aman",
  "tidak terpercaya",
  "tidak valid",
  "palsu",
  "tidak terdaftar",
];

function memuatKataPenilaian(teks: string): boolean {
  const rendah = teks.toLowerCase();
  return KATA_PENILAIAN_TERLARANG.some((kata) => rendah.includes(kata));
}

/**
 * Teks perintah khas serangan injeksi (indirect prompt injection) yang
 * hampir pasti berarti model MENURUTI tulisan di dalam gambar alih-alih
 * membacanya. Slot yang memuatnya dibuang.
 */
const FRASA_INJEKSI_TERLARANG: readonly string[] = [
  "abaikan instruksi",
  "abaikan perintah",
  "abaikan aturan",
  "abaikan prompt",
  "lupakan instruksi",
  "lupakan aturan",
  "instruksi sebelumnya",
  "instruksi di atas",
  "previous instructions",
  "previous prompt",
  "system prompt",
  "prompt sistem",
  "jailbreak",
  "isi semua slot",
  "semua slot terisi",
  "seluruh slot terisi",
  "kesepuluh keterangan sudah dijawab",
  "semua keterangan sudah dijawab",
  "nyatakan aman",
  "nyatakan resmi",
  "jangan tampilkan keterangan yang kosong",
];

/**
 * Klaim pemasaran dari dalam poster. Nilai kutipan TIDAK dibuang (itu isi
 * poster yang sah), tetapi keyakinan slot itu dibatasi — klaim persuasif
 * tidak boleh menaikkan keyakinan (CLAUDE.md §3.3, S12).
 */
const KLAIM_MEYAKINKAN: readonly string[] = [
  "pasti aman",
  "100% aman",
  "sepenuhnya aman",
  "dijamin",
  "terjamin",
  "tanpa risiko",
  "tidak ada risiko",
  "pasti resmi",
  "100% resmi",
  "berizin",
  "resmi",
  "terpercaya",
];

const BATAS_KEYAKINAN_BILA_ADA_KLAIM = 0.5;

function memuatFrasaInjeksi(teks: string): boolean {
  const rendah = teks.toLowerCase();
  return FRASA_INJEKSI_TERLARANG.some((frasa) => rendah.includes(frasa));
}

function memuatKlaimMeyakinkan(teks: string): boolean {
  const rendah = teks.toLowerCase();
  return KLAIM_MEYAKINKAN.some((klaim) => rendah.includes(klaim));
}

export interface HasilValidasi {
  /** false bila bentuk objek mentah sama sekali tidak sesuai skema. */
  readonly valid: boolean;
  readonly hasil: HasilBaca;
}

function hasilKosong(): HasilBaca {
  const nilai = {} as Record<SlotId, string | null>;
  const keyakinan = {} as Record<SlotId, number>;
  for (const id of URUTAN_SLOT) {
    nilai[id] = null;
    keyakinan[id] = 0;
  }
  return { nilai, keyakinan };
}

function keyakinanAman(mentah: unknown): number {
  if (typeof mentah !== "number" || !Number.isFinite(mentah)) {
    return 0;
  }
  if (mentah < 0 || mentah > 1) {
    return 0;
  }
  return mentah;
}

/**
 * Mengubah keluaran model yang SUDAH di-`JSON.parse` menjadi `HasilBaca`
 * yang aman. Menerima `unknown` karena keluaran model tidak pernah
 * dipercaya bentuknya.
 */
export function validasiKeluaranModel(mentah: unknown): HasilValidasi {
  if (typeof mentah !== "object" || mentah === null || Array.isArray(mentah)) {
    return { valid: false, hasil: hasilKosong() };
  }

  const objek = mentah as Record<string, unknown>;
  const nilaiMentah = objek["nilai"];
  const keyakinanMentah = objek["keyakinan"];

  if (
    typeof nilaiMentah !== "object" ||
    nilaiMentah === null ||
    Array.isArray(nilaiMentah) ||
    typeof keyakinanMentah !== "object" ||
    keyakinanMentah === null ||
    Array.isArray(keyakinanMentah)
  ) {
    return { valid: false, hasil: hasilKosong() };
  }

  const petaNilai = nilaiMentah as Record<string, unknown>;
  const petaKeyakinan = keyakinanMentah as Record<string, unknown>;

  const nilai = {} as Record<SlotId, string | null>;
  const keyakinan = {} as Record<SlotId, number>;

  for (const id of URUTAN_SLOT) {
    const kunci = String(id);
    const nilaiSlotMentah = petaNilai[kunci];

    if (typeof nilaiSlotMentah !== "string" || nilaiSlotMentah.trim().length === 0) {
      nilai[id] = null;
      keyakinan[id] = 0;
      continue;
    }

    if (memuatKataPenilaian(nilaiSlotMentah) || memuatFrasaInjeksi(nilaiSlotMentah)) {
      // Model mengembalikan penilaian atau menuruti instruksi di dalam
      // gambar, bukan data — dibuang, bukan diteruskan.
      nilai[id] = null;
      keyakinan[id] = 0;
      continue;
    }

    const keyakinanSlot = keyakinanAman(petaKeyakinan[kunci]);

    nilai[id] = nilaiSlotMentah;
    keyakinan[id] = memuatKlaimMeyakinkan(nilaiSlotMentah)
      ? Math.min(keyakinanSlot, BATAS_KEYAKINAN_BILA_ADA_KLAIM)
      : keyakinanSlot;
  }

  return { valid: true, hasil: { nilai, keyakinan } };
}
