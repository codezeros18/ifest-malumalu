import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-poppins)", "Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        // Sprint UI-inklusif: palet warm-monochrome (kertas hangat, tinta
        // hangat) dengan aksen hijau-laut dalam. Warm-neutral dipakai
        // supaya antarmuka terasa ramah dan menenangkan untuk pengguna
        // awam; hijau-laut dipilih sebagai aksen tunggal karena tidak
        // membawa asosiasi "peringatan/larangan" (merah dilarang
        // CLAUDE.md 3.6) dan tidak terasa seperti biru SaaS generik.
        // Seluruh pasangan teks-di-atas-latar lolos WCAG AA 4,5:1 —
        // ditegakkan tests/ui/kontras.test.ts. Nama token TIDAK berubah
        // (test mengunci nama), hanya nilainya.
        tinta: "#1A1A18",
        "tinta-lembut": "#3F3F3A",
        redup: "#6B6A63",
        garis: "#E3E1DA",
        "latar-kosong": "#F1EFEA",
        "latar-blok": "#E9E6DE",
        kertas: "#FAF9F6",
        aksen: "#1B5E4B",
        // Latar kepala lembar yang dirender (`/api/kartu`) — biru pilihan
        // pemilik produk, sama dengan aksen biru halaman depan. Token
        // terpisah dari `tinta` supaya teks isi lembar TIDAK ikut biru.
        // Kontras: kertas 6,12:1 · garis 4,92:1 (ditegakkan kontras.test.ts).
        kepala: "#0955D4",
      },
    },
  },
  plugins: [],
};

export default config;
