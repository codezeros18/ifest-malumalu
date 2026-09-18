import { Poppins } from "next/font/google";

// Poppins hanya dipasang di sini dan di src/app/hasil/layout.tsx — TIDAK
// di root layout (src/app/layout.tsx) atau tailwind.config.ts (keduanya
// berkas bersama/milik Window lain), supaya tidak mengubah tampilan `/`.
// Dibundel `next`, bukan dependensi npm baru (batas §4 tetap utuh).
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export default function LayoutPeriksa({ children }: { children: React.ReactNode }) {
  return (
    <div className={poppins.variable} style={{ fontFamily: "var(--font-poppins)" }}>
      {children}
    </div>
  );
}
