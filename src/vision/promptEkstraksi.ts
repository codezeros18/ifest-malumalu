/**
 * Prompt ekstraksi untuk satu-satunya panggilan model per pemeriksaan.
 *
 * Model HANYA mengubah gambar menjadi data terstruktur (CLAUDE.md §3.3).
 * Prompt ini melarang eksplisit setiap bentuk kesimpulan, penilaian, saran,
 * atau peringatan — dan lapisan validasi (`validasi.ts`) membuang keluaran
 * yang tetap memuat kata penilaian, sebagai jaring pengaman kedua bila
 * model tidak patuh.
 *
 * Kesepuluh keterangan ditulis ULANG di sini secara lokal (bukan diimpor
 * dari `src/core/slot`), karena `src/vision` hanya boleh mengimpor TIPE dari
 * `src/core`, bukan nilai seperti `DAFTAR_SLOT` — lihat pagar di
 * `tests/core/batas-modul.test.ts` (S05-5). Duplikasi ini disengaja dan
 * dicatat di PROGRESS.md; bila deskripsi D.1 berubah, perbarui juga di sini.
 */

interface DeskripsiKeterangan {
  readonly id: number;
  readonly deskripsi: string;
}

const KETERANGAN: readonly DeskripsiKeterangan[] = [
  {
    id: 1,
    deskripsi:
      "Nama badan hukum perusahaan yang mengurus keberangkatan (harus memuat penanda badan usaha seperti PT, CV, atau sejenisnya — nama orang, akun media sosial, atau nomor telepon saja BUKAN nama badan hukum).",
  },
  {
    id: 2,
    deskripsi:
      "Nomor izin perekrutan untuk penempatan ini DAN negara tujuan penempatan.",
  },
  {
    id: 3,
    deskripsi:
      "Nama DAN alamat pihak yang akan mempekerjakan (pemberi kerja) di negara tujuan.",
  },
  {
    id: 4,
    deskripsi: "Jabatan atau jenis pekerjaan secara spesifik.",
  },
  {
    id: 5,
    deskripsi:
      "Besaran upah (angka nominal dan mata uang) DAN cara/waktu pembayarannya.",
  },
  {
    id: 6,
    deskripsi: "Jam kerja per hari DAN keterangan hari libur/istirahat.",
  },
  {
    id: 7,
    deskripsi:
      "Lama masa kontrak kerja, berupa angka dan satuan waktunya (misalnya \"2 tahun\").",
  },
  {
    id: 8,
    deskripsi:
      "Jaminan sosial atau asuransi yang konkret (nama atau jenis programnya, bukan sekadar klaim umum).",
  },
  {
    id: 9,
    deskripsi:
      "Besaran total biaya yang diminta DAN rincian komponennya, atau bagian mana yang menjadi tanggungan pemberi kerja.",
  },
  {
    id: 10,
    deskripsi:
      "Pernyataan kapan salinan perjanjian penempatan dan perjanjian kerja akan diberikan kepada calon pekerja.",
  },
];

const DAFTAR_KETERANGAN = KETERANGAN.map(
  (k) => `${k.id}. ${k.deskripsi}`,
).join("\n");

export const PROMPT_EKSTRAKSI = `Gambar ini adalah tawaran kerja ke luar negeri asal Indonesia — bisa berupa poster, tangkapan layar percakapan, atau foto brosur.

Tugas Anda HANYA SATU: baca gambar ini dan ubah menjadi data terstruktur. Anda TIDAK melakukan hal lain apa pun selain itu.

Untuk SETIAP dari sepuluh keterangan berikut, cari apakah keterangan itu disebutkan di dalam gambar:

${DAFTAR_KETERANGAN}

Untuk setiap keterangan, kembalikan:
- "nilai": kutipan atau ringkasan singkat dari apa yang TERTULIS di gambar untuk keterangan itu, dalam Bahasa Indonesia. Gunakan null bila keterangan itu sama sekali tidak disebutkan.
- "keyakinan": angka 0 sampai 1 yang menyatakan seberapa jelas dan eksplisit keterangan itu dinyatakan di gambar (0 bila null, mendekati 1 bila dinyatakan sangat jelas dan tidak ambigu).

ATURAN YANG WAJIB DIPATUHI, TANPA KECUALI:
- JANGAN menyimpulkan, menilai, memberi saran, memberi peringatan, atau menyatakan pendapat apa pun tentang tawaran ini, perusahaannya, atau pihak yang menawarkannya.
- JANGAN menuliskan kata-kata seperti "penipuan", "mencurigakan", "aman", "berisiko", "waspada", "hati-hati", "disarankan", "sebaiknya", "palsu", "resmi", "terpercaya", atau kata sejenis yang menyiratkan penilaian — baik di dalam nilai keterangan maupun di luar itu.
- JANGAN menambahkan keterangan di luar sepuluh yang diminta.
- JANGAN menambahkan kalimat pembuka, penutup, permintaan maaf, atau penjelasan apa pun di luar data yang diminta.
- Nilai HANYA berisi apa yang benar-benar tertulis atau tergambar di dalam gambar — jangan mengarang, jangan menebak dari pengetahuan umum di luar gambar.

Kembalikan HANYA satu objek JSON, tanpa blok kode markdown, tanpa teks lain apa pun sebelum atau sesudahnya, persis dengan bentuk berikut (contoh nilai di bawah hanya ilustrasi bentuk, bukan isi yang harus disalin):

{"nilai":{"1":"PT Contoh Sejahtera","2":null,"3":null,"4":"Operator produksi","5":null,"6":null,"7":null,"8":null,"9":null,"10":null},"keyakinan":{"1":0.9,"2":0,"3":0,"4":0.8,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0}}`;
