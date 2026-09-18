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
    <div className="flex flex-col gap-2 border-b border-garis py-4">
      <label htmlFor={idNilai} className="text-base font-bold text-tinta-lembut">
        {nomor}. {label}
      </label>
      <textarea
        id={idNilai}
        value={nilai}
        disabled={tidakTahu}
        onChange={tanganiUbahNilai}
        rows={2}
        className="min-h-11 rounded-lg border border-garis bg-kertas px-3 py-2 text-base text-tinta disabled:bg-latar-kosong disabled:text-tinta-lembut"
      />
      <label
        htmlFor={idTidakTahu}
        className="flex w-fit items-center gap-2 text-base text-tinta-lembut"
      >
        <input
          id={idTidakTahu}
          type="checkbox"
          checked={tidakTahu}
          onChange={(peristiwa) => onUbahTidakTahu(peristiwa.target.checked)}
          className="h-5 w-5 rounded border-garis"
        />
        {labelTidakTahu}
      </label>
    </div>
  );
}
