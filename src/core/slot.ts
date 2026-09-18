/**
 * Sepuluh keterangan sebagai DATA, bukan kode.
 *
 * `nama` adalah label internal dari BLUEPRINT D.1 untuk mengenali slot.
 * Kalimat yang dilihat pengguna TIDAK ada di sini — sumbernya BLUEPRINT F.3
 * lewat `src/core/teks.ts` (S04).
 */

export type SlotId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type TingkatBukti = "eksplisit" | "tersirat";

/** Penanda aturan kualitatif per slot. Aturannya sendiri ditulis di S03. */
export type KunciKualitatif =
  | "nama-badan-hukum"
  | "nomor-izin-dan-negara"
  | "nama-pemberi-kerja"
  | "jabatan-spesifik"
  | "nominal-mata-uang-dan-tata-cara"
  | "jam-kerja-dan-libur"
  | "angka-dan-satuan-waktu"
  | "jaminan-konkret"
  | "angka-dan-rincian-biaya"
  | "waktu-penyerahan-salinan";

export interface Slot {
  readonly id: SlotId;
  readonly nama: string;
  readonly dasarHukum: readonly string[];
  readonly tingkatBukti: TingkatBukti;
  readonly kunciKualitatif: KunciKualitatif;
}

export const DAFTAR_SLOT: readonly Slot[] = [
  {
    id: 1,
    nama: "Perusahaan yang memberangkatkan",
    dasarHukum: ["Pasal 51 ayat (1)", "Pasal 69", "Pasal 81"],
    tingkatBukti: "eksplisit",
    kunciKualitatif: "nama-badan-hukum",
  },
  {
    id: 2,
    nama: "Izin untuk penempatan ini dan negara tujuannya",
    dasarHukum: ["Pasal 59 ayat (1)", "Pasal 59 ayat (3)"],
    tingkatBukti: "eksplisit",
    kunciKualitatif: "nomor-izin-dan-negara",
  },
  {
    id: 3,
    nama: "Siapa yang akan mempekerjakan",
    dasarHukum: ["Pasal 15 ayat (2) huruf a"],
    tingkatBukti: "eksplisit",
    kunciKualitatif: "nama-pemberi-kerja",
  },
  {
    id: 4,
    nama: "Pekerjaannya apa persisnya",
    dasarHukum: ["Pasal 15 ayat (2) huruf c"],
    tingkatBukti: "eksplisit",
    kunciKualitatif: "jabatan-spesifik",
  },
  {
    id: 5,
    nama: "Upah dan cara pembayarannya",
    dasarHukum: ["Pasal 15 ayat (2) huruf e"],
    tingkatBukti: "eksplisit",
    kunciKualitatif: "nominal-mata-uang-dan-tata-cara",
  },
  {
    id: 6,
    nama: "Jam kerja, cuti, dan waktu istirahat",
    dasarHukum: ["Pasal 15 ayat (2) huruf e"],
    tingkatBukti: "eksplisit",
    kunciKualitatif: "jam-kerja-dan-libur",
  },
  {
    id: 7,
    nama: "Lama kontrak",
    dasarHukum: ["Pasal 15 ayat (2) huruf f"],
    tingkatBukti: "eksplisit",
    kunciKualitatif: "angka-dan-satuan-waktu",
  },
  {
    id: 8,
    nama: "Jaminan sosial dan keselamatan",
    dasarHukum: [
      "Pasal 15 ayat (2) huruf e",
      "Pasal 15 ayat (2) huruf g",
      "Pasal 5 huruf d",
    ],
    tingkatBukti: "eksplisit",
    kunciKualitatif: "jaminan-konkret",
  },
  {
    id: 9,
    nama: "Biaya: yang diminta dan siapa menanggung",
    dasarHukum: ["Pasal 30 ayat (1)", "Pasal 72 huruf a", "Pasal 86"],
    tingkatBukti: "eksplisit",
    kunciKualitatif: "angka-dan-rincian-biaya",
  },
  {
    id: 10,
    nama: "Dokumen yang akan Anda pegang",
    dasarHukum: [
      "Pasal 6 ayat (1) huruf m",
      "Pasal 6 ayat (3) huruf c",
      "Pasal 13 huruf g",
      "Pasal 13 huruf h",
    ],
    tingkatBukti: "tersirat",
    kunciKualitatif: "waktu-penyerahan-salinan",
  },
];

/** Urutan tetap 1–10. Dipakai untuk menyusun keluaran tanpa mengurutkan ulang. */
export const SLOT_IDS: readonly SlotId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function adalahSlotId(nilai: unknown): nilai is SlotId {
  return (
    typeof nilai === "number" &&
    Number.isInteger(nilai) &&
    nilai >= 1 &&
    nilai <= 10
  );
}

export function slotDenganId(id: SlotId): Slot {
  const slot = DAFTAR_SLOT.find((kandidat) => kandidat.id === id);
  if (!slot) {
    throw new Error(`Slot ${id} tidak ada di DAFTAR_SLOT`);
  }
  return slot;
}
