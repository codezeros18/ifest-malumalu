import { LABEL_MEMUAT_HALAMAN } from "../../core/teks";

/**
 * Next.js App Router menampilkan berkas ini otomatis selama rute ini
 * disiapkan saat navigasi (S13: dipicu perpindahan `/` → `/periksa` dan
 * `/periksa` → `/hasil`). Murni visual, tanpa logika — tidak menyentuh
 * `src/core` sama sekali.
 */
export default function MemuatPeriksa() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-latar-kosong via-kertas to-kertas px-4">
      <div
        role="status"
        aria-label={LABEL_MEMUAT_HALAMAN}
        className="flex flex-col items-center gap-4 rounded-3xl border border-garis bg-kertas px-8 py-10 shadow-xl shadow-tinta/5"
      >
        <span
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-4 border-latar-blok border-t-aksen"
        />
        <p className="text-base font-medium text-redup">{LABEL_MEMUAT_HALAMAN}</p>
      </div>
    </main>
  );
}
