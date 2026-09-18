import { ImageResponse } from "next/og.js";
import fs from "node:fs";
import { nilai } from "./src/core/penilaian.ts";
import { rakitIsiLembar } from "./src/core/perakitan.ts";
import { elemenLembar, tinggiLembar, LEBAR_LEMBAR } from "./src/lib/renderLembar.tsx";

const SLOT_IDS = [1,2,3,4,5,6,7,8,9,10];

function semuaNilai(isi) {
  const n = {};
  for (const id of SLOT_IDS) n[id] = isi;
  return n;
}
function keyakinanSeragam(k) {
  const n = {};
  for (const id of SLOT_IDS) n[id] = k;
  return n;
}

async function skenario(nama, nilaiInput) {
  const keyakinan = keyakinanSeragam(1);
  for (const id of SLOT_IDS) {
    if (nilaiInput[id] === null) keyakinan[id] = 0;
  }
  const penilaian = nilai({ nilai: nilaiInput, ditandaiTidakTahu: [] }, keyakinan);
  const isiLembar = rakitIsiLembar({
    penilaian,
    nilaiAsli: nilaiInput,
    tanggal: "Dicatat pada: 18 September 2026, 09.15",
  });

  const estimasi = tinggiLembar(isiLembar);
  const resp = new ImageResponse(elemenLembar(isiLembar), { width: LEBAR_LEMBAR, height: estimasi });
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(`scratch-${nama}.png`, buf);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  console.log(`${nama}: estimasi=${estimasi} aktual=${h}x${w} blok1=${isiLembar.blok1.length} blok2=${isiLembar.blok2.length}`);
}

await skenario("kosong", semuaNilai(null));
await skenario("terisi", {
  1: "PT Karya Bersama Sejahtera",
  2: "SIP2MI nomor 1234/SIP/2026, negara tujuan Taiwan",
  3: "Hanwha Techwin Co., Ltd., Kota Changwon, Provinsi Gyeongsang Selatan",
  4: "Operator mesin injeksi plastik",
  5: "NT$ 27.470 per bulan, ditransfer ke rekening bank setiap tanggal 5",
  6: "8 jam per hari, libur setiap hari Minggu",
  7: "3 tahun",
  8: "BPJS Ketenagakerjaan dan asuransi kesehatan Taiwan (NHI)",
  9: "Total Rp18.000.000 — tiket pesawat Rp6.000.000, pelatihan Rp4.000.000, pengurusan dokumen Rp8.000.000",
  10: "Salinan perjanjian kerja diserahkan saat penandatanganan, sebelum keberangkatan",
});
await skenario("campuran", {
  1: "PT Karya Bersama Sejahtera",
  2: null,
  3: "pabrik di Taiwan",
  4: "Operator mesin injeksi plastik",
  5: null,
  6: null,
  7: "3 tahun",
  8: null,
  9: "Total Rp18.000.000 tanpa rincian",
  10: null,
});
