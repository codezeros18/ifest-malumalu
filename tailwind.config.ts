import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        tinta: "#111827",
        "tinta-lembut": "#374151",
        redup: "#6B7280",
        garis: "#D1D5DB",
        "latar-kosong": "#F3F4F6",
        "latar-blok": "#E5E7EB",
        kertas: "#FFFFFF",
        aksen: "#1D4ED8",
      },
    },
  },
  plugins: [],
};

export default config;
