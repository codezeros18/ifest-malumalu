import type { IsiLembar } from "../core/tipe";

/**
 * Jembatan client-side murni antara `/periksa` dan `/hasil` — singleton
 * modul di memori tab, BUKAN localStorage/sessionStorage/server. Hilang
 * saat tab ditutup atau `/hasil` dimuat ulang langsung (lihat guard di
 * `src/app/hasil/page.tsx`), konsisten dengan CLAUDE.md §3.5: nol gambar
 * dan nol hasil pemeriksaan disimpan melewati sesi peramban saat ini.
 *
 * `urlGambarLembar` adalah data URL (`data:image/png;base64,...`) yang
 * aman dari masalah lifecycle blob/unmount dan tetap valid karena
 * navigasi Next.js App Router antar-rute bersifat client-side (tidak
 * memuat ulang dokumen) — lihat BLUEPRINT arah alur satu jalur.
 *
 * 🔴 Lembar disimpan dalam KEDUA bahasa (`perBahasa`), bukan hanya bahasa
 * yang aktif saat menerbitkan. Alasannya perilaku: pengguna yang berpindah
 * bahasa di `/hasil` harus melihat gambar yang benar-benar berganti — bukan
 * lembar berbahasa lama — dan perpindahan itu tidak boleh menunggu render
 * ulang. Konsekuensinya dua render PNG per penerbitan (dijalankan paralel)
 * dan dua data URL hidup di memori tab sampai tab ditutup. Teks lembar
 * dirakit PER BAHASA (bukan diterjemahkan saat menampilkan), supaya tidak
 * pernah ada lembar campuran — "dereng dipunwangsuli" bersanding dengan
 * kalimat Indonesia.
 */
export type BahasaLembar = "id" | "jv";

/** Satu lembar yang sudah terbit, lengkap dalam satu bahasa. */
export interface LembarTerbit {
  readonly isiLembar: IsiLembar;
  readonly urlGambarLembar: string | null;
  readonly catatanLapis1: string | null;
  readonly catatanLapis2: string | null;
}

export interface HasilSementara {
  readonly perBahasa: Readonly<Record<BahasaLembar, LembarTerbit>>;
}

let hasilTersimpan: HasilSementara | null = null;

export function simpanHasilSementara(hasil: HasilSementara): void {
  hasilTersimpan = hasil;
}

export function ambilHasilSementara(): HasilSementara | null {
  return hasilTersimpan;
}

export function hapusHasilSementara(): void {
  hasilTersimpan = null;
}
