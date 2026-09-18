import type { InputHTMLAttributes } from "react";
import { useId } from "react";

type KolomIsianProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  keterangan?: string;
};

export default function KolomIsian({
  label,
  keterangan,
  id,
  className,
  ...props
}: KolomIsianProps) {
  const idFallback = useId();
  const idKolom = id ?? idFallback;
  const idKeterangan = keterangan ? `${idKolom}-keterangan` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={idKolom} className="text-base font-bold text-tinta-lembut">
        {label}
      </label>
      <input
        id={idKolom}
        aria-describedby={idKeterangan}
        className={[
          "min-h-14 rounded-xl border border-garis bg-kertas px-3 text-lg text-tinta focus:border-aksen",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {keterangan ? (
        <p id={idKeterangan} className="text-sm text-redup">
          {keterangan}
        </p>
      ) : null}
    </div>
  );
}
