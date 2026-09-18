"use client";

import { useEffect, useRef, useState } from "react";
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

const PILIHAN_BAHASA = [
  ["id", LABEL_GANTI_BAHASA_ID],
  ["jv", LABEL_GANTI_BAHASA_JV],
] as const;

export interface SitusNavbarProps {
  readonly bahasa: "id" | "jv";
  readonly onPilihBahasa: (bahasa: "id" | "jv") => void;
}

/**
 * Navbar yang sama dipakai di `/`, `/periksa`, `/hasil` — logo, dua pranala
 * ("Beranda" dan "Tentang Kami", yang selalu menuju halaman utama karena
 * bagian "Tentang Kami" hanya ada di sana), saklar bahasa berbentuk
 * dropdown (S13 polish — dipencet menampilkan dua pilihan, bukan langsung
 * bertukar), dan menu hamburger di bawah md. Palet warna disamakan dengan
 * desain halaman utama (biru `#0955d4` / kuning `#fac10b`), bukan token
 * `aksen` hijau — penyesuaian sadar mengikuti redesign home, dicatat di
 * PROGRESS.md.
 */
export default function SitusNavbar({
  bahasa,
  onPilihBahasa,
}: SitusNavbarProps) {
  const router = useRouter();
  const bahasaMenuRef = useRef<HTMLDivElement>(null);
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const [bahasaMenuTerbuka, setBahasaMenuTerbuka] = useState(false);
  const t = bahasa === "jv" ? TEKS_HALAMAN_UI_JAWA : TEKS_HALAMAN_UI;

  useEffect(() => {
    if (!bahasaMenuTerbuka) return;
    function tanganiKlikLuar(peristiwa: MouseEvent) {
      if (!bahasaMenuRef.current?.contains(peristiwa.target as Node)) {
        setBahasaMenuTerbuka(false);
      }
    }
    document.addEventListener("mousedown", tanganiKlikLuar);
    return () => document.removeEventListener("mousedown", tanganiKlikLuar);
  }, [bahasaMenuTerbuka]);

  function keBeranda() {
    setMenuTerbuka(false);
    router.push("/");
  }

  function keTentang() {
    setMenuTerbuka(false);
    router.push("/?tentang=1");
  }

  function pilihBahasa(baru: "id" | "jv") {
    onPilihBahasa(baru);
    setBahasaMenuTerbuka(false);
  }

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5 lg:px-44">
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
          <div ref={bahasaMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setBahasaMenuTerbuka((sebelumnya) => !sebelumnya)}
              aria-label={LABEL_PILIH_BAHASA}
              aria-haspopup="listbox"
              aria-expanded={bahasaMenuTerbuka}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe4fb] bg-white/70 px-5 py-2 text-[15px] font-semibold text-[#3f4657] backdrop-blur transition-colors hover:text-[#0955d4]"
            >
              🌐{" "}
              {bahasa === "id" ? LABEL_GANTI_BAHASA_ID : LABEL_GANTI_BAHASA_JV}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${bahasaMenuTerbuka ? "rotate-180" : ""}`}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {bahasaMenuTerbuka ? (
              <div
                role="listbox"
                className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-[190px] overflow-hidden rounded-xl border border-[#dbe4fb] bg-white p-1 shadow-[0_20px_50px_-25px_rgba(11,18,32,0.35)]"
              >
                {PILIHAN_BAHASA.map(([kode, label]) => (
                  <button
                    key={kode}
                    type="button"
                    role="option"
                    aria-selected={bahasa === kode}
                    onClick={() => pilihBahasa(kode)}
                    className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-left text-[14px] font-semibold transition-colors ${
                      bahasa === kode
                        ? "bg-[#e7f0ff] text-[#0955d4]"
                        : "text-[#3f4657] hover:bg-[#f2f6ff]"
                    }`}
                  >
                    {label}
                    {bahasa === kode ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
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
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          {PILIHAN_BAHASA.map(([kode, label]) => (
            <button
              key={kode}
              type="button"
              role="option"
              aria-selected={bahasa === kode}
              onClick={() => {
                pilihBahasa(kode);
                setMenuTerbuka(false);
              }}
              className={`flex items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] font-semibold transition-colors ${
                bahasa === kode
                  ? "bg-[#e7f0ff] text-[#0955d4]"
                  : "text-[#3f4657] hover:bg-[#f2f6ff]"
              }`}
            >
              🌐 {label}
              {bahasa === kode ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
