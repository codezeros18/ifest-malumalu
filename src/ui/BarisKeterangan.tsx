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
  readonly tidakTahu: boolean;
  readonly labelTidakTahu: string;
  readonly onUbahNilai: (nilai: string) => void;
  readonly onUbahTidakTahu: (tidakTahu: boolean) => void;
}

export default function BarisKeterangan({
  nomor,
  label,
  nilai,
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
        "flex flex-col gap-2 border-b border-garis py-4 transition-colors",
        // Sprint UI-inklusif: baris "tidak tahu" diberi latar penuh supaya
        // keadaannya terbaca SEKILAS — bukan hanya dari kolom yang memudar.
        // Abu netral, tanpa warna merah maupun ikon peringatan (3.6).
        tidakTahu ? "-mx-3 rounded-xl bg-latar-kosong px-3" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <label htmlFor={idNilai} className="text-lg font-bold text-tinta-lembut">
        {nomor}. {label}
      </label>
      <textarea
        id={idNilai}
        value={nilai}
        disabled={tidakTahu}
        onChange={tanganiUbahNilai}
        rows={2}
        className="min-h-14 rounded-xl border border-garis bg-kertas px-3 py-2 text-lg text-tinta focus:border-aksen disabled:bg-latar-kosong disabled:text-tinta-lembut"
      />
      <label
        htmlFor={idTidakTahu}
        className="flex min-h-11 w-fit items-center gap-2 text-lg text-tinta-lembut"
      >
        <input
          id={idTidakTahu}
          type="checkbox"
          checked={tidakTahu}
          onChange={(peristiwa) => onUbahTidakTahu(peristiwa.target.checked)}
          className="h-6 w-6 rounded border-garis accent-aksen"
        />
        {labelTidakTahu}
      </label>
    </div>
  );
}
