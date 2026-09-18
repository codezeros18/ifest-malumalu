import type { ClipboardEvent, DragEvent, KeyboardEvent } from "react";
import { useCallback, useId, useRef, useState } from "react";

/**
 * Komponen presentasional murni — TIDAK mengimpor apa pun dari `src/core`
 * atau `src/vision` (BLUEPRINT G.4: `src/ui` boleh impor TIDAK ADA APA PUN
 * dari `src/`). Alasan sebuah berkas ditolak dilaporkan sebagai penanda
 * generik, bukan `KodeGalat` — pemanggil (`src/app`) yang menerjemahkannya.
 */
export type AlasanBerkasDitolak = "terlalu-besar" | "format-tidak-didukung";

export interface AreaUnggahProps {
  readonly label: string;
  readonly keterangan?: string;
  readonly ukuranMaksimalByte: number;
  readonly disabled?: boolean;
  readonly onBerkasDiterima: (berkas: File) => void;
  readonly onBerkasDitolak: (alasan: AlasanBerkasDitolak) => void;
}

function alasanPenolakan(
  berkas: File,
  ukuranMaksimalByte: number,
): AlasanBerkasDitolak | null {
  if (!berkas.type.startsWith("image/")) {
    return "format-tidak-didukung";
  }
  if (berkas.size > ukuranMaksimalByte) {
    return "terlalu-besar";
  }
  return null;
}

export default function AreaUnggah({
  label,
  keterangan,
  ukuranMaksimalByte,
  disabled = false,
  onBerkasDiterima,
  onBerkasDitolak,
}: AreaUnggahProps) {
  const idDasar = useId();
  const idKeterangan = keterangan ? `${idDasar}-keterangan` : undefined;
  const rujukanMasukan = useRef<HTMLInputElement>(null);
  const [diseret, setDiseret] = useState(false);

  const tanganiBerkas = useCallback(
    (berkas: File | null | undefined) => {
      if (disabled || !berkas) return;
      const alasan = alasanPenolakan(berkas, ukuranMaksimalByte);
      if (alasan) {
        onBerkasDitolak(alasan);
        return;
      }
      onBerkasDiterima(berkas);
    },
    [disabled, onBerkasDiterima, onBerkasDitolak, ukuranMaksimalByte],
  );

  const bukaDialogBerkas = useCallback(() => {
    if (disabled) return;
    rujukanMasukan.current?.click();
  }, [disabled]);

  const tanganiTempel = useCallback(
    (peristiwa: ClipboardEvent<HTMLDivElement>) => {
      const butir = Array.from(peristiwa.clipboardData?.items ?? []).find(
        (satu) => satu.type.startsWith("image/"),
      );
      const berkas = butir?.getAsFile();
      if (berkas) {
        peristiwa.preventDefault();
        tanganiBerkas(berkas);
      }
    },
    [tanganiBerkas],
  );

  const tanganiJatuh = useCallback(
    (peristiwa: DragEvent<HTMLDivElement>) => {
      peristiwa.preventDefault();
      setDiseret(false);
      tanganiBerkas(peristiwa.dataTransfer?.files?.[0]);
    },
    [tanganiBerkas],
  );

  const tanganiPapanTik = useCallback(
    (peristiwa: KeyboardEvent<HTMLDivElement>) => {
      if (peristiwa.key === "Enter" || peristiwa.key === " ") {
        peristiwa.preventDefault();
        bukaDialogBerkas();
      }
    },
    [bukaDialogBerkas],
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={idKeterangan}
        onClick={bukaDialogBerkas}
        onKeyDown={tanganiPapanTik}
        onPaste={tanganiTempel}
        onDragOver={(peristiwa) => {
          peristiwa.preventDefault();
          if (!disabled) setDiseret(true);
        }}
        onDragLeave={() => setDiseret(false)}
        onDrop={tanganiJatuh}
        className={[
          "flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors",
          disabled
            ? "cursor-not-allowed border-garis bg-latar-kosong opacity-50"
            : "cursor-pointer bg-kertas hover:bg-latar-kosong",
          !disabled && diseret ? "border-aksen bg-latar-kosong" : "",
          !disabled && !diseret ? "border-garis" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <span className="text-lg font-bold text-aksen">{label}</span>
      </div>
      <input
        ref={rujukanMasukan}
        type="file"
        accept="image/*"
        tabIndex={-1}
        disabled={disabled}
        className="sr-only"
        onChange={(peristiwa) => {
          tanganiBerkas(peristiwa.target.files?.[0]);
          peristiwa.target.value = "";
        }}
      />
      {keterangan ? (
        <p id={idKeterangan} className="text-sm text-redup">
          {keterangan}
        </p>
      ) : null}
    </div>
  );
}
