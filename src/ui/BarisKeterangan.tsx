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
  readonly id?: string;
  readonly nomor: number;
  readonly label: string;
  readonly nilai: string;
  readonly placeholder?: string;
  readonly tidakTahu: boolean;
  readonly labelTidakTahu: string;
  readonly onUbahNilai: (nilai: string) => void;
  readonly onUbahTidakTahu: (tidakTahu: boolean) => void;
  /** Sorotan sementara — dipakai pemanggil untuk menunjuk baris yang belum
   * diisi/ditandai saat pengguna mencoba menerbitkan lembar. Abu-kuning
   * netral, bukan merah (CLAUDE.md 3.6). */
  readonly disorot?: boolean;
}

export default function BarisKeterangan({
  id,
  nomor,
  label,
  nilai,
  placeholder,
  tidakTahu,
  labelTidakTahu,
  onUbahNilai,
  onUbahTidakTahu,
  disorot = false,
}: BarisKeteranganProps) {
  const idDasar = useId();
  const idNilai = `${idDasar}-nilai`;
  const idTidakTahu = `${idDasar}-tidak-tahu`;

  function tanganiUbahNilai(peristiwa: ChangeEvent<HTMLTextAreaElement>) {
    onUbahNilai(peristiwa.target.value);
  }

  return (
    <div
      id={id}
      className={[
        "flex flex-col gap-3 rounded-2xl border p-4 transition-colors sm:p-5",
        // Sprint UI-inklusif: baris "tidak tahu" diberi latar penuh supaya
        // keadaannya terbaca SEKILAS — bukan hanya dari kolom yang memudar.
        // Abu netral, tanpa warna merah maupun ikon peringatan (3.6).
        tidakTahu
          ? "border-garis bg-latar-kosong"
          : "border-[#e3e9f5] bg-kertas focus-within:border-[#0955d4]",
        disorot ? "ring-2 ring-[#fac10b] ring-offset-2" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap lg:flex-nowrap">
        <label
          htmlFor={idNilai}
          className="text-sm font-semibold text-[#0b1220] text-wrap order-2 lg:order-1"
        >
          <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e7f0ff] text-sm font-bold text-[#0955d4]">
            {nomor}
          </span>
          {label}
        </label>

        {/* Saklar "tidak tahu" — abu netral, tanpa warna merah (3.6) */}
        <label
          htmlFor={idTidakTahu}
          className="flex shrink-0 cursor-pointer select-none items-center gap-2 text-right text-xs font-medium text-redup ms-auto order-1 lg:order-2 mb-5 lg:mb-0"
        >
          <span>{labelTidakTahu}</span>
          <span className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-[#dbe4fb] bg-[#eef1f6] px-1 transition-colors has-[:checked]:border-[#0955d4] has-[:checked]:bg-[#0955d4]">
            <input
              id={idTidakTahu}
              type="checkbox"
              checked={tidakTahu}
              onChange={(peristiwa) =>
                onUbahTidakTahu(peristiwa.target.checked)
              }
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
        className="min-h-14 w-full rounded-xl border border-[#e3e9f5] bg-[#f7faff] px-4 py-3 text-xs text-[#0b1220] placeholder:text-[#9aa2b4] focus:border-[#0955d4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0955d4]/30 disabled:bg-latar-kosong disabled:text-tinta-lembut"
      />
    </div>
  );
}
