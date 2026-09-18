import Link from "next/link";
import { JUDUL_HALAMAN_UTAMA } from "../core/teks";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-tinta">{JUDUL_HALAMAN_UTAMA}</h1>
      <Link href="/" className="mt-4 text-aksen underline">
        Beranda
      </Link>
    </main>
  );
}
