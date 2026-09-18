import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lembar Janji",
  description:
    "Memeriksa apa yang sudah disebutkan dan apa yang belum dijawab pada tawaran kerja ke luar negeri.",
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
