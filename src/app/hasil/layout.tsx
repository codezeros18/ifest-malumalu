import { Poppins } from "next/font/google";

// Lihat catatan di src/app/periksa/layout.tsx — pola yang sama, dipasang
// terpisah per rute supaya `next/font` tidak menganggapnya font bersama.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export default function LayoutHasil({ children }: { children: React.ReactNode }) {
  return (
    <div className={poppins.variable} style={{ fontFamily: "var(--font-poppins)" }}>
      {children}
    </div>
  );
}
