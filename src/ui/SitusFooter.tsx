import { TEKS_HALAMAN_UI } from "../core/teks";
import { TEKS_HALAMAN_UI_JAWA } from "../core/teksJawa";

export interface SitusFooterProps {
  readonly bahasa: "id" | "jv";
}

/** Footer yang sama dipakai di `/`, `/periksa`, `/hasil`. Lihat SitusNavbar.tsx. */
export default function SitusFooter({ bahasa }: SitusFooterProps) {
  const t = bahasa === "jv" ? TEKS_HALAMAN_UI_JAWA : TEKS_HALAMAN_UI;
  return (
    <footer className="relative z-10 flex flex-col items-center gap-1 px-4 pb-6 pt-4 text-center text-[12px] text-[#8890a0] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:text-left lg:px-44">
      <p>{t.footerKiri}</p>
      <p>{t.footerKanan}</p>
    </footer>
  );
}
