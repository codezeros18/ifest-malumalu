import type { ChangeEvent } from "react";
import { useId } from "react";

/**
 * Komponen presentasional murni — TIDAK mengimpor apa pun dari `src/core`
 * (BLUEPRINT G.4). Nomor, label, dan seluruh teks dioper sebagai prop oleh
 * pemanggil (`src/app/periksa/page.tsx`), yang mengambilnya dari
 * `src/core/slot.ts` dan `src/core/teks.ts`.
 *
 * Menandai "tidak tahu" menonaktifkan kolom nilai dan memakai latar
 * `latar-kosong` — TANPA warna merah maupun ikon peringatan apa pun
 * (CLAUDE.md 3.6).
 *
 * 🔴 S11: teks pada kolom nonaktif memakai `tinta-lembut`, BUKAN `redup`.
 * `redup` di atas `latar-kosong` hanya mencapai ±4,39:1 kontras — di bawah
 * ambang 4,5:1 (BLUEPRINT H.7). Diperiksa `tests/ui/kontras.test.ts`.
 */
export interface BarisKeteranganProps {
  readonly nomor: number;
  readonly label: string;
  readonly nilai: string;
  readonly placeholder?: string;
  readonly tidakTahu: boolean;
  readonly labelTidakTahu: string;
  readonly onUbahNilai: (nilai: string) => void;
  readonly onUbahTidakTahu: (tidakTahu: boolean) => void;
}

export default function BarisKeterangan({
  nomor,
  label,
  nilai,
  placeholder,
  tidakTahu,
  labelTidakTahu,
  onUbahNilai,
  onUbahTidakTahu,
}: BarisKeteranganProps) {
  const idDasar = useId();
  const idNilai = `${idDasar}-nilai`;
  const idTidakTahu = `${idDasar}-tidak-tahu`;

  function tanganiUbahNilai(peristiwa: ChangeEvent<HTMLTextAreaElement>) {
    onUbahNilai(peristiwa.target.value);
  }

  return (
    <div
      className={[
        "flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:p-5",
        // Sprint UI-inklusif: baris "tidak tahu" diberi latar penuh supaya
        // keadaannya terbaca SEKILAS — bukan hanya dari kolom yang memudar.
        // Abu netral, tanpa warna merah maupun ikon peringatan (3.6).
        tidakTahu
          ? "border-garis bg-latar-kosong"
          : "border-garis bg-kertas focus-within:border-aksen",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={idNilai} className="text-base font-semibold text-tinta-lembut sm:text-lg">
          <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-latar-blok text-sm font-bold text-tinta-lembut">
            {nomor}
          </span>
          {label}
        </label>

        {/* Saklar "tidak tahu" — abu netral, tanpa warna merah (3.6) */}
        <label
          htmlFor={idTidakTahu}
          className="flex shrink-0 cursor-pointer select-none items-center gap-2 text-right text-sm font-medium text-redup"
        >
          <span>{labelTidakTahu}</span>
          <span className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-garis bg-latar-blok px-1 transition-colors has-[:checked]:border-aksen has-[:checked]:bg-aksen">
            <input
              id={idTidakTahu}
              type="checkbox"
              checked={tidakTahu}
              onChange={(peristiwa) => onUbahTidakTahu(peristiwa.target.checked)}
              className="peer sr-only"
            />
            <span className="pointer-events-none h-5 w-5 rounded-full bg-kertas shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
      </div>

      <textarea
        id={idNilai}
        value={nilai}
        disabled={tidakTahu}
        placeholder={placeholder}
        onChange={tanganiUbahNilai}
        rows={2}
        className="min-h-14 w-full rounded-xl border border-garis bg-kertas px-4 py-3 text-lg text-tinta placeholder:text-redup focus:border-aksen focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen/40 disabled:bg-latar-kosong disabled:text-tinta-lembut"
      />
    </div>
  );
}
