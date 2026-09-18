import type { Metadata } from "next";
import "./globals.css";
import { JUDUL_HALAMAN_UTAMA, SUBJUDUL_HALAMAN_UTAMA } from "../core/teks";

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
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
