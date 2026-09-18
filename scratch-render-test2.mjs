import { ImageResponse } from "next/og.js";
import fs from "node:fs";
import { nilai } from "./src/core/penilaian.ts";
import { rakitIsiLembar } from "./src/core/perakitan.ts";
import { elemenLembar, tinggiLembar, LEBAR_LEMBAR } from "./src/lib/renderLembar.tsx";

const SLOT_IDS = [1,2,3,4,5,6,7,8,9,10];
function semuaNilai(isi) { const n = {}; for (const id of SLOT_IDS) n[id] = isi; return n; }
function keyakinanSeragam(k) { const n = {}; for (const id of SLOT_IDS) n[id] = k; return n; }

const TINGGI_BESAR = 6000;

async function skenario(nama, nilaiInput) {
  const keyakinan = keyakinanSeragam(1);
  for (const id of SLOT_IDS) if (nilaiInput[id] === null) keyakinan[id] = 0;
  const penilaian = nilai({ nilai: nilaiInput, ditandaiTidakTahu: [] }, keyakinan);
  const isiLembar = rakitIsiLembar({ penilaian, nilaiAsli: nilaiInput, tanggal: "Dicatat pada: 18 September 2026, 09.15" });
  const estimasi = tinggiLembar(isiLembar);

  const resp = new ImageResponse(elemenLembar(isiLembar), { width: LEBAR_LEMBAR, height: TINGGI_BESAR });
  const buf = Buffer.from(await resp.arrayBuffer());
  fs.writeFileSync(`scratch-besar-${nama}.png`, buf);
  console.log(`${nama}: estimasi=${estimasi} (canvas besar=${TINGGI_BESAR} untuk cek visual)`);
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
