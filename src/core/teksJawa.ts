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
export const TOMBOL_LANJUT_JAWA = "Wedalaken lembar cathetan";

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

export const PERTANYAAN_JAWA: readonly string[] = [
  '"Perusahaan ingkang ngurus budhal kula namanipun punapa? Pareng kula cathet nama jangkepipun?"',
  '"Mangke kula nyambut damel dhateng sinten ing mrika — nama papan damelipun punapa, lan alamatipun wonten pundi?"',
  '"Padamelan kula mangke punapa cethanipun, lan kontrakipun pinten laminipun?"',
  '"Bayaranipun pinten, dipunparingaken pinten ambalan sesasi, lan lumantar punapa?"',
  '"Jam damelipun pinten jam sedinten, lan dinten preinipun kapan?"',
  '"Yatra ingkang dipunsuwun punika rincianipun kagem punapa kemawon? Sabarang ingkang kula mangertosi, saperangan wragad budhal dipuntanggung juragan — ingkang pundi kemawon?"',
  '"Pareng kula maos lan nyimpen salinan prajanjian penempatan kaliyan prajanjian damelipun saderengipun kula bayar?"',
];
