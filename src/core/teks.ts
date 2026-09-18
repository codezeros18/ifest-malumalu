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

export const ALT_LOGO = "Logo Lembar Janji";

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
export const PERINGATAN_LENGKAPI_KETERANGAN =
  'Isi keterangan ini, atau tandai "Saya tidak tahu" bila memang belum tahu, sebelum menerbitkan lembar.';

export const TOMBOL_UNDUH = "Simpan gambar";
export const TOMBOL_BAGIKAN = "Bagikan";
export const CATATAN_PRIVASI =
  "Gambar Anda tidak kami simpan. Tidak ada akun, tidak ada data pribadi yang diminta.";

export const STATUS_SEDANG_MEMBACA = "Sedang membaca gambar tawaran...";
export const KETERANGAN_SEDANG_MEMBACA =
  "Proses ini memakan waktu beberapa detik. Mohon tunggu sejenak.";
export const TOMBOL_SEDANG_MENERBITKAN = "Sedang menerbitkan lembar...";

export const LABEL_GANTI_BAHASA_ID = "Bahasa Indonesia";
export const LABEL_GANTI_BAHASA_JV = "Basa Jawa";
export const LABEL_PILIH_BAHASA = "Pilih bahasa";

/** Ditampilkan sesaat saat berpindah antar-layar (S13: layar hasil terpisah). */
export const LABEL_MEMUAT_HALAMAN = "Memuat...";

/**
 * Contoh isian per slot untuk mengubah layar koreksi dari "ujian" menjadi
 * "wawancara terpandu" bagi pengguna awam berliterasi rendah.
 * Seluruh string bebas dari kata terlarang (CLAUDE.md 3.1).
 */
export const CONTOH_ISIAN_PER_SLOT: Readonly<Record<SlotId, string>> = {
  1: "Misal: PT Bina Mandiri Berkah",
  2: "Misal: KEP.123/MEN/2023 tujuan Taiwan",
  3: "Misal: Formosa Plastic Corp atau nama majikan",
  4: "Misal: Operator mesin pabrik garmen",
  5: "Misal: NT$ 27.470 per bulan lewat rekening bank",
  6: "Misal: 8 jam sehari, 5 hari seminggu, libur akhir pekan",
  7: "Misal: 3 tahun dan dapat diperpanjang",
  8: "Misal: BPJS Ketenagakerjaan dan asuransi kecelakaan kerja",
  9: "Misal: Biaya paspor dan tiket ditanggung pemberi kerja",
  10: "Misal: Salinan perjanjian diserahkan sebelum keberangkatan",
};

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
 * 🟡 PENAMBAHAN S12 (sprint pembekuan) — teks saklar mematikan lapisan
 * model untuk peragaan di depan juri. Ditulis di sini karena pagar
 * S07-10 melarang literal di berkas halaman.
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
  readonly tindakanSekunder?: string;
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
    tindakanSekunder: TOMBOL_JALUR_MANUAL,
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

// ---------------------------------------------------------------------------
// F.11 — Teks halaman desain (/ui)
// ---------------------------------------------------------------------------

/**
 * Seluruh teks yang dilihat pengguna di `src/app/ui/page.tsx`.
 *
 * Dikumpulkan di sini, bukan ditulis di berkas halaman, supaya versi Basa
 * Jawa-nya (`TEKS_HALAMAN_UI_JAWA` di `teksJawa.ts`) bisa diwajibkan punya
 * kunci yang sama persis oleh TypeScript — kunci yang lupa diterjemahkan
 * jadi galat `tsc`, bukan teks Indonesia yang tertinggal di layar.
 *
 * Kelas Tailwind warna per baris/tombol tetap di berkas halaman: ini data
 * teks, bukan data tampilan.
 */
export const TEKS_HALAMAN_UI = {
  nav: {
    beranda: "Beranda",
    tentang: "Tentang Kami",
  },
  heroLencana: "Periksa sebelum berangkat",
  heroJudulAwal: "Pastikan tawaran kerja itu",
  heroJudulSorot: "menepati janji.",
  heroSubjudul:
    "Kirim poster lowongannya. Kami ubah menjadi daftar periksa yang jelas, apa yang sudah dijanjikan, apa yang belum dijawab, dan apa yang wajib Anda tanyakan sebelum menandatangani.",
  seretBerkas: "Seret poster ke sini atau klik untuk pilih",
  keteranganFormat: "Format JPG atau PNG · maks. 8 MB",
  tombolMulai: "Mulai periksa tawaran",
  panel: {
    judul: "Lembar Periksa",
    loker: "Loker: Perawat, Taiwan",
    baris: [
      { label: "Gaji & mata uang", note: "Rp 4.500.000 / bulan" },
      { label: "Nama & alamat majikan", note: "Tercantum lengkap" },
      { label: "Biaya penempatan", note: "Belum disebutkan" },
      { label: "Agen berizin (P3MI)", note: "Perlu ditanyakan" },
      { label: "Masa & isi kontrak", note: "2 tahun — cek detail" },
    ],
    catatanSorot: "2 hal perlu ditanyakan",
    catatanSisa: "sebelum Anda menyetujui tawaran ini.",
  },
  modalMengerti: "Mengerti",
  ariaTutup: "Tutup",
  ariaMenu: "Menu",
  footerKiri: "© 2026 Lembar Janji",
  footerKanan: "Dibuat untuk melindungi pekerja migran Indonesia",
  tentang: {
    lencana: "Tentang kami",
    judul: "Satu lembar sebelum tanda tangan.",
    paragraf:
      "Lembar Janji menerima gambar tawaran kerja ke luar negeri — poster, tangkapan layar percakapan, atau foto brosur — lalu menerbitkan satu lembar berisi apa yang sudah disebutkan tawaran itu, apa yang belum dijawab menurut Undang-Undang Nomor 18 Tahun 2017, dan pertanyaan yang bisa Anda ajukan. Lembarnya berbentuk gambar, agar bisa diteruskan kembali ke percakapan tempat tawaran itu beredar.",
    judulKeputusan: "Tiap keterangan hanya punya tiga kemungkinan",
    keputusan: [
      {
        label: "sudah disebutkan",
        ket: "Tawaran menyebutkannya lengkap: angka, nama, atau rincian yang jelas.",
      },
      {
        label: "disebutkan sebagian",
        ket: "Sudah disebut, tetapi masih terlalu kabur untuk dipakai — misalnya nominal tanpa mata uang.",
      },
      {
        label: "belum dijawab",
        ket: "Belum disebut dalam tawaran, atau pembacaannya diragukan. Ragu selalu jatuh ke sini.",
      },
    ],
    judulCaraKerja: "Cara kerjanya",
    langkah: [
      {
        judul: "Kirim gambarnya",
        ket: "Seret, tempel, atau pilih poster dari galeri ponsel.",
      },
      {
        judul: "Periksa hasil bacaannya",
        ket: "Mesin bisa salah baca. Hasilnya ditampilkan kembali untuk Anda betulkan.",
      },
      {
        judul: "Terbitkan lembarnya",
        ket: "Simpan gambarnya, lalu teruskan ke percakapan tempat tawaran itu beredar.",
      },
    ],
    judulDisimpan: "Yang tidak kami simpan",
    tidakDisimpan: [
      "Tidak ada akun, tidak ada pendaftaran, dan tidak ada sesi pengguna.",
      "Gambar yang Anda kirim dibaca di memori lalu dibuang, tidak ditulis ke mana pun.",
      "Tidak ada riwayat pemeriksaan yang bisa dicari, dan tidak ada penghitungan yang menggabungkan data antar pengguna.",
    ],
    judulBatas: "Batas kami",
    batas: [
      "Yang dibaca adalah dokumen tawaran yang Anda kirim, bukan pihak yang menawarkannya.",
      "Tidak ada skor, peringkat, atau persentase kelengkapan. Yang ada hanya hitungan n dari 10 belum dijawab.",
      "Bila pencocokan ke daftar perusahaan penempatan berizin tidak menemukan apa pun, lembar tetap menyebutkan tanggal salinan datanya, cara memastikannya sendiri, dan bahwa hal itu bukan berarti perusahaannya tidak berizin.",
    ],
    tombolKembali: "Mulai periksa tawaran",
    catatanKembali: "Tidak perlu mendaftar, dan tidak ada yang perlu dipasang.",
  },
};
