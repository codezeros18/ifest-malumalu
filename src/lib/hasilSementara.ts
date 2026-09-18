import type { IsiLembar } from "../core/tipe";

/**
 * Jembatan client-side murni antara `/periksa` dan `/hasil` — singleton
 * modul di memori tab, BUKAN localStorage/sessionStorage/server. Hilang
 * saat tab ditutup atau `/hasil` dimuat ulang langsung (lihat guard di
 * `src/app/hasil/page.tsx`), konsisten dengan CLAUDE.md §3.5: nol gambar
 * dan nol hasil pemeriksaan disimpan melewati sesi peramban saat ini.
 *
 * `urlGambarLembar` adalah object URL (`blob:`) yang tetap valid karena
 * navigasi Next.js App Router antar-rute bersifat client-side (tidak
 * memuat ulang dokumen) — lihat BLUEPRINT arah alur satu jalur.
 */
export interface HasilSementara {
  readonly isiLembar: IsiLembar;
  readonly urlGambarLembar: string | null;
  readonly catatanLapis1: string | null;
  readonly catatanLapis2: string | null;
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
