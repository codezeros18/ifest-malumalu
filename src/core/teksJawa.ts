/**
 * Kamus Basa Jawa (Krama Alus / Komunikatif) kagem "Lembar Janji".
 *
 * Dipun-anggo kagem nambah inklusivitas basa daerah tumrap para calon
 * Pekerja Migran Indonesia (PMI) saha kulawarganipun ing desa-desa
 * (Jawa Tengah, Jawa Timur, DIY).
 *
 * Tetep netepi CLAUDE.md 3.1: Tanpa tembung pandakwa, tanpa tembung bebaya.
 * Kosakata telung kahanan tetep ajeg:
 * - "sudah disebutkan"   -> "sampun kaserat"
 * - "disebutkan sebagian" -> "kaserat saperangan"
 * - "belum dijawab"       -> "dereng dipunwangsuli"
 */

import type { SlotId } from "./slot";
import { KodeGalat } from "./galat";
import { KAMUS_LEMBAR, TEKS_HALAMAN_UI } from "./teks";
import type { KamusLembar } from "./teks";

export const JUDUL_HALAMAN_UTAMA_JAWA = "Priksa tawaran nyambut damel ing luar negeri";
export const SUBJUDUL_HALAMAN_UTAMA_JAWA =
  "Kintun gambar tawaripun. Kula cathet punapa ingkang sampun kaserat, lan punapa ingkang dereng.";

export const TOMBOL_JALUR_GAMBAR_JAWA = "Tempel utawi unggah gambar";
export const TOMBOL_JALUR_MANUAL_JAWA = "Serat piyambak isinipun";
export const KETERANGAN_KESETARAAN_JAWA =
  "Kalih cara punika sami sagedipun dipunagem. Mangga pilih ingkang paling gampil kagem panjenengan.";

export const JUDUL_LAYAR_KOREKSI_JAWA = "Priksa rumiyin asil waosanipun";
export const KETERANGAN_KOREKSI_JAWA =
  "Mesin saged lepat anggenipun maos. Leresaken ingkang klintu saderengipun lajeng. Ingkang mboten panjenengan mangertosi, kajengaken suwung.";
export const LABEL_TIDAK_TAHU_JAWA = "Kula mboten mangertos";
export const SATUAN_KATA_JAWA = "tembung";
export const TOMBOL_LANJUT_JAWA = "Wedalaken lembar cathetan";
export const PERINGATAN_LENGKAPI_KETERANGAN_JAWA =
  'Isi katerangan menika, utawi tandhani "Kula mboten mangertos" menawi pancen dereng mangertos, saderengipun ngedalaken lembar.';

export const TOMBOL_UNDUH_JAWA = "Simpen gambar";
export const TOMBOL_BAGIKAN_JAWA = "Dum-dumaken (Bagikan)";
export const CATATAN_PRIVASI_JAWA =
  "Gambar panjenengan mboten kula simpen. Mboten wonten akun, mboten wonten data pribadi ingkang dipunsuwun.";

export const STATUS_SEDANG_MEMBACA_JAWA = "Nembe maos gambar tawaran...";
export const KETERANGAN_SEDANG_MEMBACA_JAWA =
  "Proses punika betahaken wekdal sawetawis detik. Nyuwun tengga sekedhap.";
export const TOMBOL_SEDANG_MENERBITKAN_JAWA = "Nembe ngedalaken lembar cathetan...";

export const TOMBOL_COBA_LAGI_JAWA = "Cobi malih";
export const TOMBOL_ULANGI_JAWA = "Wangsuli malih";

export const TOMBOL_MATIKAN_MODEL_JAWA = "Pejahi model (mode demo)";
export const TOMBOL_NYALAKAN_MODEL_JAWA = "Gesangaken model malih";
export const KETERANGAN_MODEL_DIMATIKAN_JAWA =
  "Mode demo: lapisan model dipun-pejahi. Gambar ingkang panjenengan kintun mboten dipun-waos mesin — isinipun panjenengan serat piyambak, lan lampahipun tetep mlampah ngantos lembar medal.";

export const CONTOH_ISIAN_PER_SLOT_JAWA: Readonly<Record<SlotId, string>> = {
  1: "Tuladha: PT Bina Mandiri Berkah",
  2: "Tuladha: KEP.123/MEN/2023 tujuwan Taiwan",
  3: "Tuladha: Formosa Plastic Corp utawi nama juragan",
  4: "Tuladha: Operator mesin pabrik garmen",
  5: "Tuladha: NT$ 27.470 saben wulan lumantar rekening bank",
  6: "Tuladha: 8 jam sedinten, 5 dinten seminggu, prei pungkasan minggu",
  7: "Tuladha: 3 taun lan saged dipun-panjangaken",
  8: "Tuladha: BPJS Ketenagakerjaan lan asuransi kacilakan damel",
  9: "Tuladha: Wragad paspor lan tiket dipun-tanggung juragan",
  10: "Tuladha: Salinan prajanjian dipun-paringaken saderengipun budhal",
};

/**
 * Label sepuluh katrangan ing basa Jawa — pasanganipun `slotDenganId(id).nama`
 * ing `src/core/slot.ts`, kagem layar koreksi (`/periksa`) nalika basa
 * dipun-gantos dhateng `jv`. Tipe `Record<SlotId, string>` njamin sedasa
 * kunci wonten sedayanipun: menawi wonten ingkang lali, `tsc` ingkang gagal,
 * sanes pangangge ingkang manggihaken label Indonesia ing layar Jawa.
 */
export const NAMA_SLOT_JAWA: Readonly<Record<SlotId, string>> = {
  1: "Perusahaan ingkang mberangkataken panjenengan",
  2: "Idin penempatan menika lan negaranipun",
  3: "Sinten ingkang badhe maringi padamelan",
  4: "Padamelanipun punapa cethanipun",
  5: "Bayaranipun lan caranipun dipun-paringaken",
  6: "Jam damel, prei, lan wekdal ngaso",
  7: "Laminipun prajanjian",
  8: "Jaminan sosial lan kaslametan",
  9: "Wragad: ingkang dipun-suwesti lan sinten ingkang nanggung",
  10: "Dokumen ingkang badhe panjenengan genggem",
};

export const PESAN_GALAT_JAWA: Readonly<Record<KodeGalat, { pesan: string; tindakan?: string; tindakanSekunder?: string }>> = {
  [KodeGalat.E_GAMBAR_TERLALU_BESAR]: {
    pesan:
      "Gambarnipun ageng sanget. Cobi kintun malih kanthi ukuran langkung alit, utawi serat piyambak isinipun.",
    tindakan: TOMBOL_JALUR_MANUAL_JAWA,
  },
  [KodeGalat.E_FORMAT_TIDAK_DIDUKUNG]: {
    pesan:
      "Berkas punika dereng saged dipun-waos. Cobi kintun awujud foto utawi tangkapan layar, utawi serat piyambak isinipun.",
    tindakan: TOMBOL_JALUR_MANUAL_JAWA,
  },
  [KodeGalat.E_PEMBACAAN_GAGAL]: {
    pesan:
      "Kula dereng kasil maos gambar punika. Panjenengan tetep saged nglajengaken kanthi nyerat piyambak isinipun.",
    tindakan: TOMBOL_JALUR_MANUAL_JAWA,
  },
  [KodeGalat.E_PEMBACAAN_KOSONG]: {
    pesan:
      "Gambar punika kawaos, nanging kula mboten manggihaken katrangan tawaran nyambut damel wonten lebetipun. Mesthekaken ingkang dipun-kintun punika gambar tawaripun.",
    tindakan: TOMBOL_ULANGI_JAWA,
    tindakanSekunder: TOMBOL_JALUR_MANUAL_JAWA,
  },
  [KodeGalat.E_MODEL_TIDAK_TERSEDIA]: {
    pesan:
      "Pamaosan gambar saweg mboten sumadya. Panjenengan tetep saged nglajengaken kanthi nyerat piyambak isinipun.",
    tindakan: TOMBOL_JALUR_MANUAL_JAWA,
  },
  [KodeGalat.E_JARINGAN]: {
    pesan:
      "Sambungan pedhot. Isen-isen ingkang sampun panjenengan serat taksih kasimpen wonten ing piranti punika.",
    tindakan: TOMBOL_COBA_LAGI_JAWA,
  },
  [KodeGalat.E_TIDAK_ADA_MASUKAN]: {
    pesan:
      "Dereng wonten ingkang saged dipun-priksa. Kintun gambar tawaripun, utawi serat piyambak isinipun.",
  },
};

/**
 * Basa Jawa kagem halaman desain (`src/app/ui/page.tsx`). Jinisipun
 * dipun-cundhuk dhateng `TEKS_HALAMAN_UI` (teks.ts): kunci ingkang lali
 * dipun-jarwakaken dados galat `tsc`, sanes teks Indonesia ingkang kantun.
 */
export const TEKS_HALAMAN_UI_JAWA: typeof TEKS_HALAMAN_UI = {
  nav: {
    beranda: "Kaca Utami",
    tentang: "Bab Kula",
  },
  heroLencana: "Priksa saderengipun bidhal",
  heroJudulAwal: "Mesthekaken tawaran nyambut damel punika",
  heroJudulSorot: "netepi janjinipun.",
  heroSubjudul:
    "Kintun poster tawaripun. Kula owahi dados daftar priksa ingkang cetha: punapa ingkang sampun dipun-janjekaken, punapa ingkang dereng dipun-wangsuli, lan punapa ingkang wajib panjenengan tangletaken saderengipun nandhatangani.",
  seretBerkas: "Seret poster mriki utawi klik kagem milih",
  keteranganFormat: "Format JPG utawi PNG · maks. 8 MB",
  tombolMulai: "Miwiti priksa tawaran",
  panel: {
    judul: "Lembar Priksa",
    loker: "Tawaran: Perawat, Taiwan",
    baris: [
      { label: "Bayaran & mata yatra", note: "Rp 4.500.000 / saben wulan" },
      { label: "Nama & alamat juragan", note: "Kaserat jangkep" },
      { label: "Wragad penempatan", note: "Dereng kaserat" },
      { label: "Agen berizin (P3MI)", note: "Perlu dipun-tangletaken" },
      { label: "Laminipun & isi prajanjian", note: "2 taun — priksa rincian" },
    ],
    catatanSorot: "2 bab perlu dipun-tangletaken",
    catatanSisa: "saderengipun panjenengan nyarujuki tawaran punika.",
  },
  modalMengerti: "Mangertos",
  ariaTutup: "Nutup",
  ariaMenu: "Menu",
  footerKiri: "© 2026 Lembar Janji",
  footerKanan: "Dipun-damel kagem ngayomi para Pekerja Migran Indonesia",
  tentang: {
    lencana: "Bab kula",
    judul: "Setunggal lembar saderengipun nandhatangani.",
    paragraf:
      "Lembar Janji nampi gambar tawaran nyambut damel ing luar negeri — poster, tangkapan layar, utawi foto brosur — lajeng medalaken setunggal lembar ingkang ngemot punapa ingkang sampun kaserat wonten tawaran punika, punapa ingkang dereng dipun-wangsuli miturut Undang-Undang Nomer 18 Taun 2017, lan pitakenan ingkang saged panjenengan aturaken. Lembaripun awujud gambar, supados saged dipun-kintun malih dhateng percakapan panggenan tawaran punika sumebar.",
    judulKeputusan: "Saben katrangan namung gadhah tigang kamungkinan",
    keputusan: [
      {
        label: "sampun kaserat",
        ket: "Tawaranipun nyerat kanthi jangkep: angka, nama, utawi rincian ingkang cetha.",
      },
      {
        label: "kaserat saperangan",
        ket: "Sampun kaserat, nanging taksih kirang cetha kagem dipun-ginakaken — tuladhanipun nominal tanpa mata yatra.",
      },
      {
        label: "dereng dipunwangsuli",
        ket: "Dereng kaserat wonten tawaran, utawi pamaosanipun kirang yakni. Menawi kirang yakni, mesthi kagolong ing kene.",
      },
    ],
    judulCaraKerja: "Caranipun makarya",
    langkah: [
      {
        judul: "Kintun gambarnipun",
        ket: "Seret, tempel, utawi pilih poster saking galeri ponsel.",
      },
      {
        judul: "Priksa asil waosanipun",
        ket: "Mesin saged lepat maos. Asilipun dipun-tampilaken malih supados panjenengan leresaken.",
      },
      {
        judul: "Wedalaken lembaripun",
        ket: "Simpen gambarnipun, lajeng kintun malih dhateng percakapan panggenan tawaran punika sumebar.",
      },
    ],
    judulDisimpan: "Ingkang mboten kula simpen",
    tidakDisimpan: [
      "Mboten wonten akun, mboten wonten pendhaftaran, lan mboten wonten sesi pangangge.",
      "Gambar ingkang panjenengan kintun dipun-waos wonten memori lajeng dipun-bucal, mboten dipun-serat wonten pundi kemawon.",
      "Mboten wonten riwayat pameriksan ingkang saged dipun-padosi, lan mboten wonten etangan ingkang nyawijiaken data antawisipun pangangge.",
    ],
    judulBatas: "Wates kula",
    batas: [
      "Ingkang dipun-waos inggih punika dokumen tawaran ingkang panjenengan kintun, sanes tiyang ingkang nawaraken.",
      "Mboten wonten skor, peringkat, utawi persentase kajangkepan. Ingkang wonten namung etangan n saking 10 dereng dipun-wangsuli.",
      "Menawi panyocokan dhateng daftar perusahaan penempatan berizin mboten manggihaken punapa kemawon, lembaripun tetep nyerat tanggal salinan datanipun, cara mesthekaken piyambak, lan bilih bab punika sanes ateges perusahaanipun mboten berizin.",
    ],
    tombolKembali: "Miwiti priksa tawaran",
    catatanKembali: "Mboten perlu ndhaftar, lan mboten wonten ingkang perlu dipun-pasang.",
  },
};

export const PERTANYAAN_JAWA: readonly string[] = [
  '"Perusahaan ingkang ngurus budhal kula namanipun punapa? Pareng kula cathet nama jangkepipun?"',
  '"Mangke kula nyambut damel dhateng sinten ing mrika — nama papan damelipun punapa, lan alamatipun wonten pundi?"',
  '"Padamelan kula mangke punapa cethanipun, lan kontrakipun pinten laminipun?"',
  '"Bayaranipun pinten, dipunparingaken pinten ambalan sesasi, lan lumantar punapa?"',
  '"Jam damelipun pinten jam sedinten, lan dinten preinipun kapan?"',
  '"Yatra ingkang dipunsuwun punika rincianipun kagem punapa kemawon? Sabarang ingkang kula mangertosi, saperangan wragad budhal dipuntanggung juragan — ingkang pundi kemawon?"',
  '"Pareng kula maos lan nyimpen salinan prajanjian penempatan kaliyan prajanjian damelipun saderengipun kula bayar?"',
];

// ---------------------------------------------------------------------------
// Kamus Lembar Basa Jawa
//
// Pasangan `KAMUS_LEMBAR` (teks.ts bagian F.9): seluruh teks SISTEM yang masuk
// ke lembar, dipakai ketika pengguna memilih Jawa — dirakit oleh
// `rakitIsiLembar`, dirender oleh `src/lib/renderLembar.tsx` (gambar) dan
// `src/ui/LembarPratinjau.tsx` (teks). Dipilih lewat `kamusLembarUntuk()`.
//
// Tipe `KamusLembar` menutup daftar kuncinya: terjemahan yang lupa satu bagian
// jadi galat `tsc`, bukan lembar campur bahasa di tangan pengguna.
//
// Dua pantangan yang berlaku sama seperti versi Indonesia:
// - kosakata tiga keadaan tetap (CLAUDE.md 3.1): "sampun kaserat" ·
//   "kaserat saperangan" · "dereng dipunwangsuli" — tanpa kata pandakwa;
// - kalimat "tidak ditemukan" WAJIB tetap memuat tiga bagian sekaligus:
//   tanggal salinan, pernyataan bahwa itu bukan berarti perusahaannya tidak
//   berizin, dan langkah konkret untuk memastikan (CLAUDE.md 3.1).
// ---------------------------------------------------------------------------

export const KAMUS_LEMBAR_JAWA: KamusLembar = {
  // Nama produk — tetap, bukan terjemahan.
  judul: "LEMBAR JANJI",
  subjudul: "Cathetan tumrap setunggal tawaran damel ing luar nagari",
  labelBlok1: "SAMPUN KASERAT WONTEN TAWARAN",
  labelBlok2Templat: "DERENG DIPUNWANGSULI WONTEN TAWARAN — {n} saking 10",
  labelBlok3: "INGKANG SAGED DIPUN-TANGLETAKEN",
  labelCatatanHitungan: "CATHETAN ETANGAN",
  labelSebagian: "kaserat saperangan",
  kalimatPembukaBlok1:
    "Menika bab-bab ingkang sampun kaserat wonten tawaran punika.",
  kalimatPembukaBlok2:
    "Menika bab-bab ingkang miturut Undang-Undang Nomer 18 Taun 2017 kedah wonten ing prajanjian damel PMI, nanging dereng kaserat wonten tawaran punika.",
  kalimatPembukaBlok3:
    "Pitakenan ing ngandhap menika saged panjenengan aturaken dhateng sinten kemawon ingkang nawaraken padamelan punika. Sedayanipun nangletaken bab ingkang wajib wonten.",
  kalimatBawahBlok2:
    "Dereng kaserat sanes ateges mboten wonten. Saged kemawon bab-bab menika sampun dipun-cawisaken nanging dereng dipun-serat. Pitakenan ing ngandhap dipun-damel kagem nangletaken.",
  penutup:
    "Lembar punika nyathet isinipun setunggal tawaran. Lembar punika mboten nilai sinten kemawon lan mboten nyatakaken tawaran punika leres utawi lepat. Kagem mesthekaken, sowan dhateng Layanan Terpadu Satu Atap utawi kantor Badan Pelindungan Pekerja Migran Indonesia ing provinsi panjenengan.",
  kalimatKosongPerSlot: {
    1: "Tawaran punika dereng nyerataken nama perusahaan penempatan ingkang ngurus budhal panjenengan.",
    2: "Tawaran punika dereng nyerataken nomer izin perekrutan kagem penempatan dhateng nagari punika.",
    3: "Tawaran punika dereng nyerataken nama lan alamat tiyang ingkang badhe maringi padamelan.",
    4: "Tawaran punika dereng nyerataken jabatan utawi jinising padamelanipun kanthi cetha.",
    5: "Tawaran punika dereng nyerataken cara lan wekdalipun paring bayaran.",
    6: "Tawaran punika dereng nyerataken jam damel lan dinten preinipun.",
    7: "Tawaran punika dereng nyerataken pinten laminipun prajanjianipun.",
    8: "Tawaran punika dereng nyerataken jaminan sosial utawi asuransi ingkang badhe dipun-caos.",
    9: "Tawaran punika dereng nyerataken rincian wragad lan perangan punapa ingkang dipun-tanggung pemberi kerja.",
    10: "Tawaran punika dereng nyerataken kapan panjenengan badhe nampi salinan prajanjian penempatan lan prajanjian damel.",
  },
  pertanyaan: PERTANYAAN_JAWA,
  namaSlot: NAMA_SLOT_JAWA,
  lapis1DitemukanTemplat:
    "Nama punika kapanggih wonten salinan daftar perusahaan penempatan berizin per {tanggal salinan}.",
  lapis1MiripTemplat:
    'Nama ingkang panjenengan serat mirip kaliyan "{nama}" wonten salinan daftar per {tanggal salinan}. Priksa malih ejaanipun dhateng ingkang nawaraken.',
  lapis1TidakDitemukanTemplat:
    "Nama punika mboten kapanggih wonten salinan daftar perusahaan penempatan berizin per {tanggal salinan}. Daftaripun saged ewah lan nama saged kaserat beda, dados bab punika sanes ateges perusahaanipun mboten berizin. Cara mesthekaken: tangletaken nomer izinipun, lajeng priksa wonten kantor Layanan Terpadu Satu Atap ingkang paling caket.",
  lapis1Dimatikan:
    "Pamriksan dhateng daftar perusahaan berizin saweg mboten sumadya. Isinipun lembar punika tetep saged dipun-ginakaken. Kagem mriksa nama perusahaanipun, sowan dhateng kantor Layanan Terpadu Satu Atap utawi Badan Pelindungan Pekerja Migran Indonesia ing provinsi panjenengan.",
  barisHitunganLapis2Templat:
    "Wragad ingkang dipun-suwesti sami kaliyan ± {n} wulan bayaran ingkang dipun-janjekaken.",
  lapis2AngkaTidakAda:
    "Etangan punika betahaken agengipun bayaran lan agengipun wragad. Salah setunggalipun dereng kaserat wonten tawaran punika.",
  lapis2Dimatikan: "Pandhingan komponen wragad saweg mboten sumadya.",
};

/** Pilih kamus lembar sesuai bahasa antarmuka. Bawaannya Indonesia. */
export function kamusLembarUntuk(bahasa: "id" | "jv"): KamusLembar {
  return bahasa === "jv" ? KAMUS_LEMBAR_JAWA : KAMUS_LEMBAR;
}
