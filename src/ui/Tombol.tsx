import type { ButtonHTMLAttributes, ReactNode } from "react";

type Varian = "utama" | "sekunder";

type TombolProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  varian?: Varian;
  children: ReactNode;
};

const kelasDasar =
  "inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-base font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const kelasVarian: Record<Varian, string> = {
  utama: "bg-aksen text-kertas hover:bg-aksen/90",
  sekunder: "bg-kertas text-aksen border border-aksen hover:bg-latar-blok",
};

export default function Tombol({
  varian = "utama",
  className,
  children,
  ...props
}: TombolProps) {
  const kelasGabungan = [kelasDasar, kelasVarian[varian], className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={kelasGabungan} {...props}>
      {children}
    </button>
  );
}
