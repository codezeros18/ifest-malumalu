/**
 * Seluruh kalimat yang dilihat pengguna, disalin PERSIS dari BLUEPRINT.md
 * bagian F.1 sampai F.10. Jangan menulis ulang, memperbaiki, menyingkat,
 * atau memperindah kalimat apa pun di berkas ini — lihat CLAUDE.md 3.1 dan
 * BLUEPRINT.md bagian F untuk alasannya.
 *
 * Placeholder ditulis literal seperti di blueprint (mis. "{tanggal}",
 * "{tanggal salinan}", "{n}", "{nama}"). Pengisiannya dilakukan lewat
 * `isiTemplat` di `src/core/perakitan.ts` lewat penggantian string biasa,
 * bukan lewat template literal JavaScript — supaya teks di sini tetap
 * salinan harfiah, bukan kode.
 *
 * Uji kosakata terlarang memindai SELURUH nilai string yang diekspor
 * berkas ini secara rekursif — lihat tests/core/kosakata.test.ts.
 */

import { KodeGalat } from "./galat";
import type { SlotId } from "./slot";

// ---------------------------------------------------------------------------
// F.1 — Judul dan label lembar
// ---------------------------------------------------------------------------

export const JUDUL_LEMBAR = "LEMBAR JANJI";
export const SUBJUDUL_LEMBAR =
  "Catatan atas satu tawaran kerja ke luar negeri";
export const PENANDA_WAKTU_TEMPLAT = "Dicatat pada: {tanggal}, {jam}";

export const LABEL_BLOK_1 = "SUDAH DISEBUTKAN DALAM TAWARAN";
export const LABEL_BLOK_2_TEMPLAT = "BELUM DIJAWAB DALAM TAWARAN — {n} dari 10";
export const LABEL_BLOK_3 = "YANG BISA ANDA TANYAKAN";
export const LABEL_CATATAN_HITUNGAN = "CATATAN HITUNGAN";
export const LABEL_SEBAGIAN = "disebutkan sebagian";

// ---------------------------------------------------------------------------
// F.2 — Kalimat pembuka tiap blok
// ---------------------------------------------------------------------------

export const KALIMAT_PEMBUKA_BLOK_1 =
  "Berikut hal-hal yang sudah disebutkan di dalam tawaran ini.";

export const KALIMAT_PEMBUKA_BLOK_2 =
  "Berikut hal-hal yang menurut Undang-Undang Nomor 18 Tahun 2017 harus ada dalam perjanjian kerja pekerja migran, tetapi belum disebutkan dalam tawaran ini.";

export const KALIMAT_PEMBUKA_BLOK_3 =
  "Pertanyaan berikut boleh Anda ajukan kepada siapa pun yang menawarkan pekerjaan ini. Semuanya menanyakan hal yang memang diwajibkan ada.";

// ---------------------------------------------------------------------------
// F.3 — Kalimat per keterangan bila kosong
// ---------------------------------------------------------------------------

export const KALIMAT_KOSONG_PER_SLOT: Readonly<Record<SlotId, string>> = {
  1: "Tawaran ini belum menyebutkan nama perusahaan penempatan yang mengurus keberangkatan.",
  2: "Tawaran ini belum menyebutkan nomor izin perekrutan untuk penempatan ke negara ini.",
  3: "Tawaran ini belum menyebutkan nama dan alamat pihak yang akan mempekerjakan.",
  4: "Tawaran ini belum menyebutkan jabatan atau jenis pekerjaannya secara spesifik.",
  5: "Tawaran ini belum menyebutkan cara dan waktu pembayaran upah.",
  6: "Tawaran ini belum menyebutkan jam kerja dan hari libur.",
  7: "Tawaran ini belum menyebutkan berapa lama masa kontraknya.",
  8: "Tawaran ini belum menyebutkan jaminan sosial atau asuransi yang akan diperoleh.",
  9: "Tawaran ini belum menyebutkan rincian biaya dan bagian mana yang menjadi tanggungan pemberi kerja.",
  10: "Tawaran ini belum menyebutkan kapan Anda akan menerima salinan perjanjian penempatan dan perjanjian kerja.",
};

// ---------------------------------------------------------------------------
// F.4 — Tujuh pertanyaan, lengkap, siap diucapkan. Urutan tetap, selalu
// ditampilkan seluruhnya — lihat src/core/perakitan.ts.
// ---------------------------------------------------------------------------

export const PERTANYAAN: readonly string[] = [
  '"Perusahaan yang mengurus keberangkatan saya namanya apa? Boleh saya catat nama lengkapnya?"',
  '"Nanti saya bekerja pada siapa di sana — nama tempat kerjanya apa, dan alamatnya di mana?"',
  '"Pekerjaan saya nanti apa persisnya, dan kontraknya berapa lama?"',
  '"Gajinya berapa, dibayar berapa kali sebulan, dan lewat apa?"',
  '"Jam kerjanya berapa jam sehari, dan hari liburnya kapan?"',
  '"Uang yang diminta ini rinciannya untuk apa saja? Setahu saya sebagian biaya keberangkatan ditanggung pemberi kerja — yang mana saja?"',
  '"Boleh saya baca dan simpan salinan perjanjian penempatan dan perjanjian kerjanya sebelum saya membayar?"',
];

// ---------------------------------------------------------------------------
// F.5 — Kalimat wajib yang selalu tercetak, apa pun hasilnya
// ---------------------------------------------------------------------------

export const KALIMAT_BAWAH_BLOK_2 =
  "Belum disebutkan bukan berarti tidak ada. Bisa jadi hal-hal ini sudah disiapkan tetapi belum dituliskan. Pertanyaan di bawah dibuat untuk menanyakannya.";

export const PENUTUP_LEMBAR =
  "Lembar ini mencatat isi sebuah tawaran. Lembar ini tidak menilai siapa pun dan tidak menyatakan sebuah tawaran benar atau salah. Untuk memastikan, datangi Layanan Terpadu Satu Atap atau kantor Badan Pelindungan Pekerja Migran Indonesia di provinsi Anda.";

// ---------------------------------------------------------------------------
// F.6 — Kalimat Lapis 1 (logikanya S09; teksnya sudah wajib ada sejak S04)
// ---------------------------------------------------------------------------

export const LAPIS1_DITEMUKAN_TEMPLAT =
  "Nama ini ditemukan dalam salinan daftar perusahaan penempatan berizin per {tanggal salinan}.";

/**
 * 🔴 Wajib memuat tiga bagian sekaligus: tanggal salinan, pernyataan bahwa
 * ini tidak berarti perusahaan tersebut tidak berizin, dan langkah konkret
 * untuk memastikan. Lihat CLAUDE.md 3.1 dan tests/core/perakitan.test.ts.
 */
export const LAPIS1_TIDAK_DITEMUKAN_TEMPLAT =
  "Nama ini tidak ditemukan dalam salinan daftar perusahaan penempatan berizin per {tanggal salinan}. Daftar dapat berubah dan nama dapat tertulis berbeda, sehingga hal ini tidak berarti perusahaan tersebut tidak berizin. Cara memastikan: tanyakan nomor izinnya, lalu periksa di kantor Layanan Terpadu Satu Atap terdekat.";

export const LAPIS1_MIRIP_TEMPLAT =
  'Nama yang Anda masukkan mirip dengan "{nama}" dalam salinan daftar per {tanggal salinan}. Periksa kembali ejaan namanya kepada pihak yang menawarkan.';

export const LAPIS1_DIMATIKAN =
  "Pemeriksaan terhadap daftar perusahaan berizin sedang tidak tersedia. Isi lembar ini tetap dapat digunakan. Untuk memeriksa nama perusahaan, hubungi kantor Layanan Terpadu Satu Atap atau Badan Pelindungan Pekerja Migran Indonesia di provinsi Anda.";

// ---------------------------------------------------------------------------
// F.7 — Kalimat Lapis 2 (logikanya S09; teksnya sudah wajib ada sejak S04)
// ---------------------------------------------------------------------------

export const BARIS_HITUNGAN_LAPIS2_TEMPLAT =
  "Biaya yang diminta setara ± {n} bulan upah yang dijanjikan.";

export const LAPIS2_ANGKA_TIDAK_ADA =
  "Perhitungan ini memerlukan besaran upah dan besaran biaya. Salah satunya belum disebutkan dalam tawaran ini.";

export const LAPIS2_DIMATIKAN =
  "Pembandingan komponen biaya sedang tidak tersedia.";

// ---------------------------------------------------------------------------
// F.8 — Teks antarmuka
// ---------------------------------------------------------------------------

export const JUDUL_HALAMAN_UTAMA = "Periksa tawaran kerja luar negeri";
export const SUBJUDUL_HALAMAN_UTAMA =
  "Kirim gambar tawarannya. Kami catat apa yang sudah disebutkan, dan apa yang belum.";

export const TOMBOL_JALUR_GAMBAR = "Tempel atau unggah gambar";
export const TOMBOL_JALUR_MANUAL = "Ketik sendiri isinya";
export const KETERANGAN_KESETARAAN =
  "Dua cara ini sama-sama bisa dipakai. Pilih yang paling mudah buat Anda.";

export const JUDUL_LAYAR_KOREKSI = "Periksa dulu hasil bacaannya";
export const KETERANGAN_KOREKSI =
  "Mesin bisa salah baca. Betulkan yang keliru sebelum lanjut. Yang tidak Anda ketahui, biarkan kosong.";
export const LABEL_TIDAK_TAHU = "Saya tidak tahu";
export const TOMBOL_LANJUT = "Terbitkan lembar";

export const TOMBOL_UNDUH = "Simpan gambar";
export const TOMBOL_BAGIKAN = "Bagikan";
export const CATATAN_PRIVASI =
  "Gambar Anda tidak kami simpan. Tidak ada akun, tidak ada data pribadi yang diminta.";

/**
 * 🟡 PENAMBAHAN DI LUAR F.1–F.10 — dicatat sesuai instruksi sprint S04:
 * tabel F.9 mewajibkan tombol "coba lagi" (E_JARINGAN) dan "ulangi"
 * (E_PEMBACAAN_KOSONG), tetapi blueprint belum menuliskan label persisnya
 * di bagian F mana pun. Ditulis di sini sebagai teks baru, dilaporkan di
 * PROGRESS.md, BUKAN diputuskan sepihak sebagai final tanpa dicatat.
 */
export const TOMBOL_COBA_LAGI = "Coba lagi";
export const TOMBOL_ULANGI = "Ulangi";

/**
 * 🟡 PENAMBAHAN S12 (sprint pembekuan) — satu-satunya teks baru di sprint
 * itu, wajib ada karena S12-1 mewajibkan tombol dan `tests/alur/koreksi-wajib`
 * melarang literal di `page.tsx`. Ditulis di BLUEPRINT F.8 lebih dulu,
 * dicatat di PERUBAHAN.md PB-005. Status saat ditekan memakai pesan F.9
 * `E_MODEL_TIDAK_TERSEDIA` yang sudah ada — bukan kalimat baru.
 */
export const TOMBOL_MATIKAN_PEMBACAAN_GAMBAR = "Matikan pembacaan gambar";
export const TOMBOL_MATIKAN_MODEL = "Matikan model (mode demo)";
export const TOMBOL_NYALAKAN_MODEL = "Nyalakan model lagi";
export const KETERANGAN_MODEL_DIMATIKAN =
  "Mode demo: lapisan model dimatikan. Gambar yang Anda kirim tidak dibaca mesin sama sekali — isiannya Anda ketik sendiri, dan alurnya tetap berjalan sampai lembar terbit.";

// ---------------------------------------------------------------------------
// F.9 — Pesan galat
// ---------------------------------------------------------------------------

export interface PesanGalat {
  readonly pesan: string;
  readonly tindakan?: string;
}

/**
 * Kolom "Tindakan yang ditawarkan" pada F.9 mendeskripsikan AKSI (tombol
 * mana yang ditampilkan), bukan label baru. Untuk aksi "ke jalur ketik
 * manual", nilainya memakai `TOMBOL_JALUR_MANUAL` yang sudah ada di F.8 —
 * jalur manual memang selalu terlihat sejak layar pertama (CLAUDE.md 3.3),
 * jadi field ini hanya menandai aksi tambahan yang relevan untuk galat itu.
 */
export const PESAN_GALAT: Readonly<Record<KodeGalat, PesanGalat>> = {
  [KodeGalat.E_GAMBAR_TERLALU_BESAR]: {
    pesan:
      "Gambarnya terlalu besar. Coba kirim ulang dengan ukuran lebih kecil, atau ketik sendiri isinya.",
    tindakan: TOMBOL_JALUR_MANUAL,
  },
  [KodeGalat.E_FORMAT_TIDAK_DIDUKUNG]: {
    pesan:
      "Berkas ini belum bisa kami baca. Coba kirim berupa foto atau tangkapan layar, atau ketik sendiri isinya.",
    tindakan: TOMBOL_JALUR_MANUAL,
  },
  [KodeGalat.E_PEMBACAAN_GAGAL]: {
    pesan:
      "Kami tidak berhasil membaca gambar ini. Anda tetap bisa melanjutkan dengan mengetik sendiri isinya.",
    tindakan: TOMBOL_JALUR_MANUAL,
  },
  [KodeGalat.E_PEMBACAAN_KOSONG]: {
    pesan:
      "Gambar ini terbaca, tetapi kami tidak menemukan keterangan tawaran kerja di dalamnya. Pastikan yang dikirim adalah gambar tawarannya.",
    tindakan: TOMBOL_ULANGI,
  },
  [KodeGalat.E_MODEL_TIDAK_TERSEDIA]: {
    pesan:
      "Pembacaan gambar sedang tidak tersedia. Anda tetap bisa melanjutkan dengan mengetik sendiri isinya.",
    tindakan: TOMBOL_JALUR_MANUAL,
  },
  [KodeGalat.E_JARINGAN]: {
    pesan:
      "Sambungan terputus. Isi yang sudah Anda ketik masih tersimpan di perangkat ini.",
    tindakan: TOMBOL_COBA_LAGI,
  },
  [KodeGalat.E_TIDAK_ADA_MASUKAN]: {
    pesan: "Belum ada yang bisa diperiksa. Kirim gambar tawarannya, atau ketik sendiri isinya.",
  },
};

// ---------------------------------------------------------------------------
// F.10 — Teks kondisi kosong
// ---------------------------------------------------------------------------

export const SELURUH_KOSONG =
  "Tawaran ini belum menyebutkan satu pun dari sepuluh hal yang diwajibkan. Pertanyaan di bawah bisa Anda ajukan untuk melengkapinya.";

export const SELURUH_TERISI =
  "Tawaran ini menyebutkan kesepuluh hal yang diwajibkan. Anda tetap berhak meminta salinan perjanjiannya sebelum membayar.";
