"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LABEL_GANTI_BAHASA_ID,
  LABEL_GANTI_BAHASA_JV,
  LABEL_PILIH_BAHASA,
  TEKS_HALAMAN_UI,
  ALT_LOGO,
} from "../core/teks";
import { TEKS_HALAMAN_UI_JAWA } from "../core/teksJawa";

const assetPathPrefix = "/assets";
const imgLogo = `${assetPathPrefix}/logo.svg`;

export interface SitusNavbarProps {
  readonly bahasa: "id" | "jv";
  readonly onGantiBahasa: () => void;
}

/**
 * Navbar yang sama dipakai di `/`, `/periksa`, `/hasil` — logo, dua pranala
 * ("Beranda" dan "Tentang Kami", yang selalu menuju halaman utama karena
 * bagian "Tentang Kami" hanya ada di sana), saklar bahasa, dan menu
 * hamburger di bawah md. Palet warna disamakan dengan desain halaman utama
 * (biru `#0955d4` / kuning `#fac10b`), bukan token `aksen` hijau —
 * penyesuaian sadar mengikuti redesign home, dicatat di PROGRESS.md.
 */
export default function SitusNavbar({ bahasa, onGantiBahasa }: SitusNavbarProps) {
  const router = useRouter();
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const t = bahasa === "jv" ? TEKS_HALAMAN_UI_JAWA : TEKS_HALAMAN_UI;

  function keBeranda() {
    setMenuTerbuka(false);
    router.push("/");
  }

  function keTentang() {
    setMenuTerbuka(false);
    router.push("/?tentang=1");
  }

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-14">
        <button
          type="button"
          onClick={keBeranda}
          className="flex items-center gap-2 sm:gap-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- aset statis di public/, bukan konten dinamis */}
          <img src={imgLogo} alt={ALT_LOGO} className="h-9 w-auto sm:h-11" />
          <span className="text-[17px] font-bold tracking-tight text-[#0955d4] sm:text-[20px]">
            Lembar Janji
          </span>
        </button>

        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={onGantiBahasa}
            aria-label={LABEL_PILIH_BAHASA}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe4fb] bg-white/70 px-3.5 py-1.5 text-[13px] font-semibold text-[#3f4657] backdrop-blur transition-colors hover:text-[#0955d4]"
          >
            🌐 {bahasa === "id" ? LABEL_GANTI_BAHASA_JV : LABEL_GANTI_BAHASA_ID}
          </button>
          <nav className="flex items-center gap-1 rounded-full border border-[#dbe4fb] bg-white/70 p-1 backdrop-blur">
            <button
              onClick={keBeranda}
              className="rounded-full px-5 py-2 text-[15px] font-semibold text-[#3f4657] transition-colors hover:text-[#0955d4]"
            >
              {t.nav.beranda}
            </button>
            <button
              onClick={keTentang}
              className="rounded-full px-5 py-2 text-[15px] font-semibold text-[#3f4657] transition-colors hover:text-[#0955d4]"
            >
              {t.nav.tentang}
            </button>
          </nav>
        </div>

        <button
          type="button"
          onClick={() => setMenuTerbuka((sebelumnya) => !sebelumnya)}
          aria-label={t.ariaMenu}
          aria-expanded={menuTerbuka}
          aria-controls="menu-navbar-mobile-sub"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dbe4fb] bg-white/70 text-[#3f4657] backdrop-blur md:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            {menuTerbuka ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </header>

      {menuTerbuka ? (
        <div
          id="menu-navbar-mobile-sub"
          className="relative z-20 mx-4 mb-2 flex flex-col gap-1 rounded-2xl border border-[#dbe4fb] bg-white p-2 shadow-[0_20px_50px_-25px_rgba(11,18,32,0.35)] md:hidden"
        >
          <button
            onClick={keBeranda}
            className="rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-[#3f4657] hover:bg-[#f2f6ff]"
          >
            {t.nav.beranda}
          </button>
          <button
            onClick={keTentang}
            className="rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-[#3f4657] hover:bg-[#f2f6ff]"
          >
            {t.nav.tentang}
          </button>
          <div className="my-1 h-px bg-[#eef1f6]" />
          <button
            type="button"
            onClick={() => {
              onGantiBahasa();
              setMenuTerbuka(false);
            }}
            className="rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-[#3f4657] hover:bg-[#f2f6ff]"
          >
            🌐 {bahasa === "id" ? LABEL_GANTI_BAHASA_JV : LABEL_GANTI_BAHASA_ID}
          </button>
        </div>
      ) : null}
    </>
  );
}
