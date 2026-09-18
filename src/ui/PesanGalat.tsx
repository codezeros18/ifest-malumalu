/**
 * Komponen presentasional murni — TIDAK mengimpor apa pun dari `src/core`
 * (BLUEPRINT G.4). Pemanggil (`src/app`) yang mengambil teks pesan dan
 * label tindakan dari `src/core/teks.ts` lalu mengopernya sebagai prop.
 *
 * Nol warna merah, nol ikon peringatan (CLAUDE.md 3.6) — kotak netral
 * dengan teks dan, bila ada, satu tombol tindakan.
 */
export interface PesanGalatProps {
  readonly pesan: string;
  readonly tindakan?: string;
  readonly onTindakan?: () => void;
  readonly tindakanSekunder?: string;
  readonly onTindakanSekunder?: () => void;
}

export default function PesanGalat({
  pesan,
  tindakan,
  onTindakan,
  tindakanSekunder,
  onTindakanSekunder,
}: PesanGalatProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-start gap-4 rounded-xl bg-latar-blok px-5 py-4"
    >
      <p className="text-lg leading-relaxed text-tinta-lembut">{pesan}</p>
      {tindakan && onTindakan ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onTindakan}
            className="inline-flex min-h-14 items-center justify-center rounded-full border-2 border-aksen bg-kertas px-6 text-lg font-bold text-aksen hover:bg-latar-kosong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none"
          >
            {tindakan}
          </button>
          {tindakanSekunder && onTindakanSekunder ? (
            <button
              type="button"
              onClick={onTindakanSekunder}
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-garis bg-kertas px-6 text-lg font-bold text-tinta-lembut hover:bg-latar-kosong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen focus-visible:ring-offset-2 active:scale-[0.98] motion-reduce:transform-none"
            >
              {tindakanSekunder}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
