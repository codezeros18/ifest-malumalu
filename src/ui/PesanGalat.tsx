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
}

export default function PesanGalat({ pesan, tindakan, onTindakan }: PesanGalatProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-start gap-3 rounded-lg bg-latar-blok px-4 py-3"
    >
      <p className="text-base text-tinta-lembut">{pesan}</p>
      {tindakan && onTindakan ? (
        <button
          type="button"
          onClick={onTindakan}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-aksen bg-kertas px-4 text-base font-bold text-aksen hover:bg-latar-blok"
        >
          {tindakan}
        </button>
      ) : null}
    </div>
  );
}
