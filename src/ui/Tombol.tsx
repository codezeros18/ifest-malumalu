import type { ButtonHTMLAttributes, ReactNode } from "react";

type Varian = "utama" | "sekunder";

type TombolProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  varian?: Varian;
  children: ReactNode;
};

/**
 * Sprint UI-inklusif — tombol diperbesar untuk target sentuh jempol:
 * min-h-14 (56px, di atas pedoman 48px), radius membulat penuh (pil)
 * supaya terasa ramah dan jelas-jelas "bisa ditekan", dan bayangan
 * tinta-aksen halus pada varian utama. `active:scale-[0.98]` memberi
 * umpan balik fisik saat ditekan.
 */
const kelasDasar =
  "inline-flex min-h-14 items-center justify-center rounded-full px-6 text-lg font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aksen focus-visible:ring-offset-2 motion-reduce:transform-none";

const kelasVarian: Record<Varian, string> = {
  utama: "bg-aksen text-kertas hover:bg-aksen/90 shadow-sm",
  sekunder: "bg-kertas text-aksen border-2 border-aksen hover:bg-latar-kosong",
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
