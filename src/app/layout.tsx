import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { JUDUL_HALAMAN_UTAMA, SUBJUDUL_HALAMAN_UTAMA } from "../core/teks";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: JUDUL_HALAMAN_UTAMA,
  description: SUBJUDUL_HALAMAN_UTAMA,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={poppins.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
