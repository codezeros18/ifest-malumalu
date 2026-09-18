import type { SlotId } from "./slot";

export type HasilUjiKualitatif = "lulus" | "sebagian" | "gagal";

/**
 * Aturan "hanya kualitatif" per keterangan, BLUEPRINT E.2.
 *
 * "lulus"    → kolom "DISEBUTKAN bila ada…"
 * "gagal"    → kolom "Tetap BELUM_DIJAWAB bila hanya…"
 * "sebagian" → kolom "DISEBUTKAN_SEBAGIAN bila…"
 *
 * Fungsi ini HANYA menilai mutu sebuah nilai yang SUDAH ADA (bukan kosong).
 * Aturan keraguan (kosong, spasi, keyakinan, tidak tahu) adalah urusan
 * `penilaian.ts`, bukan di sini — supaya pagar keraguan tetap satu titik.
 *
 * 🔴 Tiga baris E.2 (slot 3, 8, 9) mencantumkan masukan yang sama di dua
 * kolom keluaran berbeda — kontradiksi tabel itu sendiri, bukan salah baca.
 * Resolusinya didokumentasikan di `tests/core/kualitatif.test.ts` lewat
 * medan `catatan`, dan tercermin di komentar tiap fungsi slot di bawah.
 */

const PENANDA_BADAN_USAHA = /\b(pt|cv|ud|pd|firma|koperasi|perseroan terbatas)\b\.?/i;
const KATA_GENERIK_TANPA_NAMA = /^(resmi|lengkap|terpercaya|berizin|besar)$/i;
const PENANDA_ORANG = /\b(bapak|ibu|pak|bu|tuan|nyonya|nona|haji|hj)\b\.?/i;
const HANYA_TELEPON = /^[\d\s+()-]+$/;
const AKUN_MEDSOS = /^[@#]/;

function ujiSlot1PerusahaanMemberangkatkan(teks: string): HasilUjiKualitatif {
  if (HANYA_TELEPON.test(teks) || AKUN_MEDSOS.test(teks) || PENANDA_ORANG.test(teks)) {
    return "gagal";
  }

  const cocok = teks.match(PENANDA_BADAN_USAHA);
  if (cocok) {
    const sisanya = teks.slice(cocok.index! + cocok[0].length).trim();
    if (!sisanya || KATA_GENERIK_TANPA_NAMA.test(sisanya)) {
      return "gagal";
    }
    return "lulus";
  }

  // Nama disebut (bukan orang, bukan telepon, bukan akun) tetapi tanpa
  // penanda badan usaha → "tidak lengkap" menurut kolom sebagian E.2.
  return "sebagian";
}

const POLA_NOMOR_IZIN = /(\b(nomor|no\.?)\b.{0,10}\d|sip2mi.{0,10}\d|\bsip\b.{0,10}\d)/i;
const POLA_NEGARA_TUJUAN =
  /\b(taiwan|hong ?kong|malaysia|singapura|arab saudi|saudi|jepang|korea( selatan)?|brunei|qatar|uni emirat arab|uea|kuwait)\b/i;

function ujiSlot2IzinDanNegara(teks: string): HasilUjiKualitatif {
  const adaIzin = POLA_NOMOR_IZIN.test(teks);
  const adaNegara = POLA_NEGARA_TUJUAN.test(teks);

  if (adaIzin && adaNegara) return "lulus";
  if (adaIzin || adaNegara) return "sebagian";
  return "gagal";
}

const PENANDA_ENTITAS_PEMBERI_KERJA =
  /\b(co\.?,?\s*ltd\.?|corporation|corp\.?|inc\.?|company|group|enterprise|gmbh|sdn\.?\s*bhd\.?|pte\.?\s*ltd\.?)\b/i;
const PENANDA_KAWASAN_INDUSTRI = /\bkawasan industri\b/i;
const PENANDA_JENIS_INDUSTRI =
  /\b(garmen|elektronik|otomotif|tekstil|makanan|farmasi|logam|manufaktur|konstruksi|pertanian|perikanan|perkebunan)\b/i;

function ujiSlot3NamaPemberiKerja(teks: string): HasilUjiKualitatif {
  if (PENANDA_ENTITAS_PEMBERI_KERJA.test(teks)) return "lulus";
  // Baris E.2 #3 bertabrakan: "pabrik di Taiwan" dicontohkan gagal, padahal
  // deskripsinya persis kolom sebagian ("jenis tempat kerja disebut, nama
  // tidak"). Dimenangkan kolom gagal untuk frasa generik semacam itu; jenis
  // tempat kerja yang lebih spesifik (kawasan industri, jenis industri
  // konkret) dianggap sebagian.
  if (PENANDA_KAWASAN_INDUSTRI.test(teks) || PENANDA_JENIS_INDUSTRI.test(teks)) {
    return "sebagian";
  }
  return "gagal";
}

const PENANDA_JABATAN_SPESIFIK =
  /\b(operator|perawat|teknisi|sopir|supir|juru masak|koki|pembantu rumah tangga|asisten rumah tangga|buruh|tukang|petugas|pengasuh|cleaning service|satpam|pelayan|kasir|montir)\b/i;
const PENANDA_BIDANG = /\b(bidang|sektor)\b/i;
const POLA_KERJA_GENERIK = /^kerja\b/i;

function ujiSlot4JenisPekerjaan(teks: string): HasilUjiKualitatif {
  if (PENANDA_JABATAN_SPESIFIK.test(teks)) return "lulus";
  if (PENANDA_BIDANG.test(teks)) return "sebagian";
  if (POLA_KERJA_GENERIK.test(teks)) return "gagal";
  return "gagal";
}

function adaNominalMataUang(teks: string): boolean {
  if (/(rp\.?\s?\d|nt\$\s?\d|usd\s?\d|\$\s?\d|idr\s?\d)/i.test(teks)) return true;
  // "15 juta rupiah" — angka dan kata mata uang terpisah, bukan berdempet
  // dengan simbol seperti "Rp".
  return /\d+\s*(juta|ribu)\b/i.test(teks) && /\brupiah\b/i.test(teks);
}

const POLA_TATA_CARA_PEMBAYARAN = /\b(ditransfer|transfer|dibayar|pembayaran|rekening|tunai|cash)\b/i;

function ujiSlot5UpahDanCaraBayar(teks: string): HasilUjiKualitatif {
  const adaNominal = adaNominalMataUang(teks);
  const adaTataCara = POLA_TATA_CARA_PEMBAYARAN.test(teks);

  if (adaNominal && adaTataCara) return "lulus";
  if (adaNominal) return "sebagian";
  return "gagal";
}

const POLA_JAM_SPESIFIK = /\d+\s*jam\b/i;
const POLA_LIBUR_SPESIFIK =
  /\blibur\b[\s\S]{0,20}\b(senin|selasa|rabu|kamis|jumat|sabtu|minggu|\d+\s*hari)\b/i;

function ujiSlot6JamDanLibur(teks: string): HasilUjiKualitatif {
  const adaJam = POLA_JAM_SPESIFIK.test(teks);
  const adaLibur = POLA_LIBUR_SPESIFIK.test(teks);

  if (adaJam && adaLibur) return "lulus";
  if (adaJam || adaLibur) return "sebagian";
  return "gagal";
}

const POLA_ANGKA = /\d+/;
const POLA_SATUAN_WAKTU_JELAS = /\d+\s*(tahun|bulan|minggu|hari)\b/i;

function ujiSlot7LamaKontrak(teks: string): HasilUjiKualitatif {
  if (POLA_SATUAN_WAKTU_JELAS.test(teks)) return "lulus";
  if (POLA_ANGKA.test(teks)) return "sebagian";
  return "gagal";
}

const PENANDA_SKEMA_JAMINAN_BERNAMA = /\b(bpjs|nhi|jamsostek)\b/i;
const PENANDA_JENIS_ASURANSI = /\basuransi\s+(kesehatan|jiwa|kecelakaan|ketenagakerjaan)\b/i;

function ujiSlot8JaminanSosial(teks: string): HasilUjiKualitatif {
  if (PENANDA_SKEMA_JAMINAN_BERNAMA.test(teks)) return "lulus";
  // Baris E.2 #8 nyaris bertabrakan: '"ada asuransi" tanpa keterangan' (gagal)
  // vs "Disebut ada, jenisnya tidak" (sebagian). Pembedanya frasa "tanpa
  // keterangan": sebutan telanjang → gagal, ada kategori tapi skema
  // konkretnya tidak → sebagian.
  if (PENANDA_JENIS_ASURANSI.test(teks)) return "sebagian";
  return "gagal";
}

/**
 * 🔴 Baris E.2 #9 bertabrakan langsung dengan dirinya sendiri: "angka total
 * tanpa rincian" tercantum sebagai GAGAL di satu kolom dan sebagai SELALU
 * SEBAGIAN di kolom lain. S02-5 menyebutnya eksplisit — kolom sebagian
 * dimenangkan. Konsekuensinya: satu kemunculan angka biaya = sebagian,
 * dua atau lebih (total + minimal satu rincian) = lulus, nol = gagal.
 */
const POLA_ANGKA_BIAYA = /(rp\.?\s?\d[\d.,]*|idr\.?\s?\d[\d.,]*|\d+\s*juta\b)/gi;

function ujiSlot9BiayaDanTanggungan(teks: string): HasilUjiKualitatif {
  const cocok = teks.match(POLA_ANGKA_BIAYA) ?? [];

  if (cocok.length === 0) return "gagal";
  if (cocok.length === 1) return "sebagian";
  return "lulus";
}

const PENANDA_PENYERAHAN_DOKUMEN =
  /\b(diserahkan|diberikan|akan diberikan|akan diserahkan|dipegang)\b/i;
const POLA_WAKTU_PENYERAHAN_SPESIFIK =
  /\b(saat|sebelum|sesudah|setelah|pada saat)\b.{0,30}\b(penandatanganan|keberangkatan|kedatangan|kontrak|berangkat)\b/i;

function ujiSlot10DokumenYangDipegang(teks: string): HasilUjiKualitatif {
  const adaPenyerahan = PENANDA_PENYERAHAN_DOKUMEN.test(teks);
  const adaWaktu = POLA_WAKTU_PENYERAHAN_SPESIFIK.test(teks);

  if (adaPenyerahan && adaWaktu) return "lulus";
  if (adaPenyerahan) return "sebagian";
  return "gagal";
}

const ATURAN_PER_SLOT: Readonly<Record<SlotId, (teks: string) => HasilUjiKualitatif>> = {
  1: ujiSlot1PerusahaanMemberangkatkan,
  2: ujiSlot2IzinDanNegara,
  3: ujiSlot3NamaPemberiKerja,
  4: ujiSlot4JenisPekerjaan,
  5: ujiSlot5UpahDanCaraBayar,
  6: ujiSlot6JamDanLibur,
  7: ujiSlot7LamaKontrak,
  8: ujiSlot8JaminanSosial,
  9: ujiSlot9BiayaDanTanggungan,
  10: ujiSlot10DokumenYangDipegang,
};

export function ujiKualitatif(slot: SlotId, nilai: string): HasilUjiKualitatif {
  return ATURAN_PER_SLOT[slot](nilai.trim());
}
