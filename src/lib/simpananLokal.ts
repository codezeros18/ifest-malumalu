/**
 * Penyimpanan sementara isian pengguna di localStorage peramban.
 *
 * Tujuannya supaya koneksi putus atau muat ulang halaman tidak menghapus
 * pekerjaan pengguna (BLUEPRINT H.7, CLAUDE.md 3.5) — BUKAN pengganti
 * basis data. Murni sisi klien, tidak pernah mengirim apa pun ke server.
 *
 * Kegagalan (mode privat, localStorage diblokir/penuh, dsb.) ditelan
 * diam-diam: penyimpanan ini kenyamanan, bukan syarat alur inti. Bila
 * tidak tersedia, halaman tetap berjalan — hanya isian yang tidak
 * bertahan lewat muat ulang.
 */

const KUNCI_ISIAN = "lembar-janji.isian-sementara.v1";

export interface IsianTersimpan {
  readonly sumber: "gambar" | "manual";
  readonly nilai: Readonly<Record<string, string>>;
  readonly ditandaiTidakTahu: readonly string[];
  /** Kode galat (dari src/core/galat.ts) yang terjadi sebelum halaman ini dibuka, bila ada. */
  readonly kodeGalatAwal?: string;
}

function ambilLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

function bentukIsianValid(nilai: unknown): nilai is IsianTersimpan {
  if (typeof nilai !== "object" || nilai === null || Array.isArray(nilai)) {
    return false;
  }
  const objek = nilai as Record<string, unknown>;
  return (
    (objek["sumber"] === "gambar" || objek["sumber"] === "manual") &&
    typeof objek["nilai"] === "object" &&
    objek["nilai"] !== null &&
    Array.isArray(objek["ditandaiTidakTahu"])
  );
}

export function simpanIsian(isian: IsianTersimpan): void {
  const penyimpanan = ambilLocalStorage();
  if (!penyimpanan) return;
  try {
    penyimpanan.setItem(KUNCI_ISIAN, JSON.stringify(isian));
  } catch {
    // Diam-diam gagal — lihat catatan berkas.
  }
}

export function ambilIsian(): IsianTersimpan | null {
  const penyimpanan = ambilLocalStorage();
  if (!penyimpanan) return null;
  try {
    const mentah = penyimpanan.getItem(KUNCI_ISIAN);
    if (!mentah) return null;
    const terurai: unknown = JSON.parse(mentah);
    return bentukIsianValid(terurai) ? terurai : null;
  } catch {
    return null;
  }
}

export function hapusIsian(): void {
  const penyimpanan = ambilLocalStorage();
  if (!penyimpanan) return;
  try {
    penyimpanan.removeItem(KUNCI_ISIAN);
  } catch {
    // Diam-diam gagal.
  }
}

/**
 * Mengubah rekaman bernilai per-slot (kunci angka, mis. `Record<SlotId, ...>`)
 * menjadi rekaman berkunci string yang aman disimpan sebagai JSON.
 * `null` diperlakukan sama seperti string kosong.
 */
export function nilaiSlotKeRekaman(
  nilai: Readonly<Record<number, string | null>>,
): Record<string, string> {
  const hasil: Record<string, string> = {};
  for (const [id, isi] of Object.entries(nilai)) {
    hasil[id] = typeof isi === "string" ? isi : "";
  }
  return hasil;
}

/**
 * Kebalikan `nilaiSlotKeRekaman` — mengisi setiap id di `daftarId` dari
 * `rekaman`, memakai string kosong bila kuncinya tidak ada atau bukan string.
 */
export function rekamanKeNilaiSlot(
  rekaman: Readonly<Record<string, string>>,
  daftarId: readonly number[],
): Record<number, string> {
  const hasil: Record<number, string> = {};
  for (const id of daftarId) {
    const mentah = rekaman[String(id)];
    hasil[id] = typeof mentah === "string" ? mentah : "";
  }
  return hasil;
}
