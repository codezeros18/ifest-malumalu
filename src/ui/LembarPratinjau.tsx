import { Keadaan } from "../core/tipe";
import type { IsiLembar } from "../core/tipe";
import { isiTemplat } from "../core/perakitan";
import Lencana from "./Lencana";
import {
  KAMUS_LEMBAR,
} from "../core/teks";
import type { KamusLembar } from "../core/teks";

/**
 * 🟡 Pratinjau teks sementara — BUKAN lembar akhir. Render menjadi gambar
 * (BLUEPRINT H.9, `src/lib/renderLembar.tsx`) adalah jalur utama; ini jalan
 * mundur bila `/api/kartu` gagal, supaya lembar tetap "terbit" apa adanya.
 * Dipindahkan dari `src/app/periksa/page.tsx` ke sini (S13: layar hasil
 * terpisah) supaya bisa dipakai `src/app/hasil/page.tsx` tanpa duplikasi.
 */
export default function LembarPratinjau({
  isiLembar,
  kamus = KAMUS_LEMBAR,
}: {
  isiLembar: IsiLembar;
  /** Bahasa teks sistem pratinjau — dioper pemanggil, sama seperti render
   * gambar (`elemenLembar`), supaya pratinjau dan gambar tidak pernah
   * berbeda bahasa. */
  kamus?: KamusLembar;
}) {
  return (
    <section className="flex flex-col gap-6 rounded-2xl border border-garis bg-kertas p-5 shadow-sm">
      <div>
        <h2 className="rounded-lg bg-latar-blok px-3 py-2 text-lg font-bold text-tinta-lembut">
          {kamus.labelBlok1}
        </h2>
        <p className="mt-2 text-lg text-tinta-lembut">{kamus.kalimatPembukaBlok1}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {isiLembar.blok1.map((baris) => (
            <li key={baris.slot} className="flex flex-col gap-1">
              <div className="flex items-start justify-between gap-3">
                <span className="text-lg text-tinta-lembut">{baris.label}</span>
                <span className="flex items-center gap-2 text-right text-lg font-bold text-tinta">
                  {baris.nilai}
                  {baris.keadaan === Keadaan.DISEBUTKAN_SEBAGIAN ? (
                    <Lencana bentuk="lingkaran-setengah" teks={kamus.labelSebagian} />
                  ) : null}
                </span>
              </div>
              {/* S09: hasil Lapis 1 melekat pada baris slot 1 (nama
                  perusahaan) — bukan blok terpisah, karena itulah satu-satunya
                  keterangan yang dicocokkan. Abu netral, tanpa lencana warna
                  atau ikon peringatan (CLAUDE.md §3.6). */}
              {baris.slot === 1 && isiLembar.hasilLapis1 ? (
                <p className="text-right text-sm text-redup">
                  {isiLembar.hasilLapis1.kalimat}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="rounded-lg bg-tinta-lembut px-3 py-2 text-lg font-bold text-kertas">
          {isiTemplat(kamus.labelBlok2Templat, { n: String(isiLembar.blok2.length) })}
        </h2>
        <p className="mt-2 text-lg text-redup">{kamus.kalimatPembukaBlok2}</p>
        <ul className="mt-2 flex flex-col gap-2">
          {isiLembar.blok2.map((baris) => (
            <li
              key={baris.slot}
              className="flex items-start justify-between gap-3 rounded-xl bg-latar-kosong p-3"
            >
              <span className="flex items-center gap-2 text-lg text-tinta-lembut">
                <Lencana bentuk="lingkaran-kosong" />
                {baris.kalimat}
              </span>
              {/* S11: tinta-lembut, bukan redup — redup di atas latar-kosong
                  hanya ±4,39:1, di bawah ambang 4,5:1 (BLUEPRINT H.7). */}
              <span className="shrink-0 text-base text-tinta-lembut">
                {baris.dasarHukum.join(", ")}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-lg italic text-redup">{kamus.kalimatBawahBlok2}</p>
      </div>

      {/* 6. Catatan hitungan — BLUEPRINT H.9 butir 6: HANYA muncul bila
          Lapis 2 aktif dan datanya cukup. Kotak bergaris putus-putus, abu
          netral, tanpa warna merah maupun ikon peringatan. */}
      {isiLembar.catatanHitungan ? (
        <div className="rounded-xl border-2 border-dashed border-garis p-4">
          <h3 className="text-lg font-bold text-tinta-lembut">{kamus.labelCatatanHitungan}</h3>
          <p className="mt-2 text-lg text-tinta-lembut">{isiLembar.catatanHitungan}</p>
        </div>
      ) : null}

      <div>
        <h2 className="rounded-lg bg-latar-blok px-3 py-2 text-lg font-bold text-tinta-lembut">
          {kamus.labelBlok3}
        </h2>
        <p className="mt-2 text-lg text-tinta-lembut">{kamus.kalimatPembukaBlok3}</p>
        <ol className="mt-2 flex flex-col gap-2">
          {isiLembar.pertanyaan.map((pertanyaan, indeks) => (
            <li key={indeks} className="text-lg text-tinta">
              {indeks + 1}. {pertanyaan}
            </li>
          ))}
        </ol>
      </div>

      <p className="border-t border-garis pt-4 text-lg text-tinta-lembut">
        {kamus.penutup}
      </p>
    </section>
  );
}
