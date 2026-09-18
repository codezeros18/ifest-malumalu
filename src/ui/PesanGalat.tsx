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
      className="flex flex-col items-start gap-3 rounded-xl bg-latar-blok px-4 py-4"
    >
      <p className="text-lg text-tinta-lembut">{pesan}</p>
      {tindakan && onTindakan ? (
        <button
          type="button"
          onClick={onTindakan}
          className="inline-flex min-h-14 items-center justify-center rounded-full border-2 border-aksen bg-kertas px-6 text-lg font-bold text-aksen hover:bg-latar-kosong"
        >
          {tindakan}
        </button>
      ) : null}
    </div>
  );
}
