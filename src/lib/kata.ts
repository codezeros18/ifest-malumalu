/**
 * Batas kata untuk SATU kotak keterangan di layar koreksi (`/periksa`).
 *
 * Kenapa dibatasi: kotak isian yang tumbuh mengikuti isinya bisa jadi setinggi
 * layar kalau pengguna menempelkan satu halaman kontrak penuh. Tawaran kerja
 * yang diperiksa di sini dijawab dalam beberapa kalimat, bukan satu dokumen —
 * seratus kata per keterangan sudah jauh lebih longgar daripada contoh isian
 * yang disediakan.
 *
 * PENTING: `batasiKata` hanya dipanggil dari `onChange` (ketikan dan tempelan
 * pengguna). Nilai yang datang dari hasil pembacaan gambar, dari draf
 * tersimpan, atau dari mana pun selain ketikan TIDAK dipotong — isi tawaran
 * yang sudah terbaca tidak boleh hilang diam-diam di depan pengguna.
 */

export const MAKSIMAL_KATA = 100;

/** Sama seperti `\S+` : rangkaian tanpa spasi dihitung satu kata. */
const POLA_KATA = /\S+/g;

export function hitungKata(teks: string): number {
  const cocok = teks.match(POLA_KATA);
  return cocok ? cocok.length : 0;
}

/**
 * Memotong teks tepat di ujung kata ke-`maksimal`. Fungsi murni: masukan teks,
 * keluaran teks — tidak menyentuh DOM, jadi bisa diuji tanpa peramban.
 */
export function batasiKata(teks: string, maksimal: number = MAKSIMAL_KATA): string {
  if (maksimal <= 0) return "";

  POLA_KATA.lastIndex = 0;
  let cocok: RegExpExecArray | null;
  let ke = 0;

  while ((cocok = POLA_KATA.exec(teks)) !== null) {
    ke += 1;
    if (ke === maksimal) {
      return teks.slice(0, cocok.index + cocok[0].length);
    }
  }

  return teks;
}
