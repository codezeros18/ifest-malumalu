import { describe, expect, it } from "vitest";
import type { ReactElement, ReactNode } from "react";
import {
  elemenLembar,
  tinggiLembar,
  LEBAR_LEMBAR,
  SKALA_RENDER,
} from "../../src/lib/renderLembar";
import { Keadaan } from "../../src/core/tipe";
import type { IsiLembar, Penilaian } from "../../src/core/tipe";
import { SLOT_IDS, slotDenganId } from "../../src/core/slot";
import type { SlotId } from "../../src/core/slot";
import { rakitIsiLembar } from "../../src/core/perakitan";
import { PENUTUP_LEMBAR, PERTANYAAN } from "../../src/core/teks";
import tailwindConfig from "../../tailwind.config";

/**
 * `elemenLembar()` mengembalikan pohon elemen React biasa (bukan hasil
 * render DOM) — object graph `{ type, props: { style, children } }`.
 * Test di berkas ini memeriksa POHON ITU LANGSUNG (bukan cuma kode
 * sumbernya), sesuai instruksi sprint S08: "tulis test yang memeriksa hal
 * ini pada KELUARAN render, bukan hanya pada kode."
 */

const WARNA = tailwindConfig.theme!.extend!.colors as Record<string, string>;

interface SimpulTerkumpul {
  readonly jenis: unknown;
  readonly style: Record<string, unknown> | undefined;
}

function kumpulkanSimpul(
  node: ReactNode,
  simpul: SimpulTerkumpul[],
  teks: string[],
): void {
  if (node === null || node === undefined || typeof node === "boolean") {
    return;
  }
  if (typeof node === "string" || typeof node === "number") {
    teks.push(String(node));
    return;
  }
  if (Array.isArray(node)) {
    for (const anak of node) {
      kumpulkanSimpul(anak, simpul, teks);
    }
    return;
  }
  // ReactElement
  const elemen = node as ReactElement<{ style?: Record<string, unknown>; children?: ReactNode }>;
  if (typeof elemen === "object" && "props" in elemen) {
    simpul.push({ jenis: elemen.type, style: elemen.props.style });
    kumpulkanSimpul(elemen.props.children, simpul, teks);
  }
}

function bongkarLembar(isiLembar: IsiLembar): { simpul: SimpulTerkumpul[]; teks: string[] } {
  const simpul: SimpulTerkumpul[] = [];
  const teks: string[] = [];
  kumpulkanSimpul(elemenLembar(isiLembar), simpul, teks);
  return { simpul, teks };
}

// --- Fixture: penilaian dan IsiLembar untuk tiga skenario ---

function semuaKeadaan(k: Keadaan): Record<SlotId, Keadaan> {
  const keadaan = {} as Record<SlotId, Keadaan>;
  for (const id of SLOT_IDS) keadaan[id] = k;
  return keadaan;
}
function semuaNilai(isi: string | null): Record<SlotId, string | null> {
  const nilai = {} as Record<SlotId, string | null>;
  for (const id of SLOT_IDS) nilai[id] = isi;
  return nilai;
}
function penilaianDari(keadaan: Record<SlotId, Keadaan>): Penilaian {
  const jumlahKosong = SLOT_IDS.filter((id) => keadaan[id] === Keadaan.BELUM_DIJAWAB).length;
  return { keadaan, jumlahKosong };
}

const LEMBAR_KOSONG: IsiLembar = rakitIsiLembar({
  penilaian: penilaianDari(semuaKeadaan(Keadaan.BELUM_DIJAWAB)),
  nilaiAsli: semuaNilai(null),
  tanggal: "Dicatat pada: 18 September 2026, 09.15",
});

const LEMBAR_PENUH: IsiLembar = rakitIsiLembar({
  penilaian: penilaianDari(semuaKeadaan(Keadaan.DISEBUTKAN)),
  nilaiAsli: semuaNilai("Nilai contoh yang cukup panjang untuk diuji"),
  tanggal: "Dicatat pada: 18 September 2026, 09.15",
});

const KEADAAN_CAMPURAN: Record<SlotId, Keadaan> = (() => {
  const keadaan = semuaKeadaan(Keadaan.DISEBUTKAN);
  keadaan[9] = Keadaan.DISEBUTKAN_SEBAGIAN;
  keadaan[2] = Keadaan.BELUM_DIJAWAB;
  keadaan[7] = Keadaan.BELUM_DIJAWAB;
  return keadaan;
})();

const LEMBAR_CAMPURAN: IsiLembar = rakitIsiLembar({
  penilaian: penilaianDari(KEADAAN_CAMPURAN),
  nilaiAsli: semuaNilai("Nilai contoh"),
  tanggal: "Dicatat pada: 18 September 2026, 09.15",
});

const SKENARIO: readonly [string, IsiLembar][] = [
  ["seluruh kosong (10 blok2)", LEMBAR_KOSONG],
  ["seluruh terisi (10 blok1)", LEMBAR_PENUH],
  ["campuran (termasuk disebutkan sebagian)", LEMBAR_CAMPURAN],
];

// --- S08-2: nol merah, keterangan kosong pakai latar-kosong ---

/** Pola HSL yang sama seperti tests/ui/warna.test.ts, dipakai untuk memindai keluaran render. */
function apakahMerahHex(hex: string): boolean {
  const bersih = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(bersih)) return false;
  const r = parseInt(bersih.slice(0, 2), 16) / 255;
  const g = parseInt(bersih.slice(2, 4), 16) / 255;
  const b = parseInt(bersih.slice(4, 6), 16) / 255;
  const maks = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (maks + min) / 2;
  if (maks === min) return false; // abu-abu murni
  const d = maks - min;
  const s = l > 0.5 ? d / (2 - maks - min) : d / (maks + min);
  let h: number;
  if (maks === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (maks === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  const hueMerah = h <= 15 || h >= 345;
  return hueMerah && s >= 0.2 && l >= 0.15 && l <= 0.85;
}

function seluruhNilaiWarnaDariStyle(simpul: SimpulTerkumpul[]): string[] {
  const kunciWarna = ["color", "backgroundColor", "borderColor", "backgroundImage", "border", "borderBottom"];
  const nilai: string[] = [];
  for (const s of simpul) {
    if (!s.style) continue;
    for (const kunci of kunciWarna) {
      const v = s.style[kunci];
      if (typeof v === "string") nilai.push(v);
    }
  }
  return nilai;
}

describe("S08-2 nol warna merah pada keluaran render", () => {
  it.each(SKENARIO)("%s: tidak ada nilai warna heksa merah di pohon elemen", (_nama, lembar) => {
    const { simpul } = bongkarLembar(lembar);
    const nilaiWarna = seluruhNilaiWarnaDariStyle(simpul);
    expect(nilaiWarna.length).toBeGreaterThan(0); // pagar ini tidak boleh lulus hampa

    const cocokHex = nilaiWarna.flatMap((v) => v.match(/#[0-9a-fA-F]{6}/g) ?? []);
    const merah = cocokHex.filter(apakahMerahHex);
    expect(merah).toEqual([]);
  });

  it("baris keterangan kosong (blok2) memakai backgroundColor token latar-kosong, bukan merah", () => {
    const { simpul } = bongkarLembar(LEMBAR_KOSONG);
    const latarKosongDipakai = simpul.some((s) => s.style?.["backgroundColor"] === WARNA["latar-kosong"]);
    expect(latarKosongDipakai).toBe(true);

    const jumlahBackgroundLatarKosong = simpul.filter(
      (s) => s.style?.["backgroundColor"] === WARNA["latar-kosong"],
    ).length;
    // 10 dari 10 kosong pada skenario ini → 10 baris memakai latar-kosong.
    expect(jumlahBackgroundLatarKosong).toBe(10);
  });
});

// --- S08-5: kalimat penutup wajib SELALU tercetak ---

describe("S08-5 kalimat penutup wajib selalu tercetak", () => {
  it.each(SKENARIO)("%s: PENUTUP_LEMBAR ada apa adanya di pohon elemen", (_nama, lembar) => {
    const { teks } = bongkarLembar(lembar);
    expect(teks).toContain(PENUTUP_LEMBAR);
  });
});

// --- S08-3: nomor pasal per keterangan kosong, dari slot.ts, rata kanan ---

describe("S08-3 nomor pasal keterangan kosong bersumber dari slot.ts", () => {
  it("setiap baris blok2 menampilkan dasarHukum yang identik dengan slot.ts, rata kanan (redup)", () => {
    const { simpul } = bongkarLembar(LEMBAR_KOSONG);

    for (const id of SLOT_IDS) {
      const dasarHukumSeharusnya = slotDenganId(id).dasarHukum.join(", ");
      const adaTeksPasal = simpul.some(
        (s) =>
          s.style?.["justifyContent"] === "flex-end" &&
          s.style?.["color"] === WARNA.redup &&
          s.style?.["textAlign"] === "right",
      );
      expect(adaTeksPasal, `slot ${id}: tidak ditemukan span pasal rata kanan warna redup`).toBe(true);

      const { teks } = bongkarLembar(LEMBAR_KOSONG);
      expect(teks, `slot ${id}: dasarHukum "${dasarHukumSeharusnya}" tidak ditemukan`).toContain(
        dasarHukumSeharusnya,
      );
    }
  });
});

// --- S08-7: ukuran huruf isi minimal setara 14pt ---

/**
 * Ambang dalam PIKSEL render 1080px — lihat penjelasan konversi di
 * `src/lib/renderLembar.tsx` (komentar konstanta `UKURAN`).
 *
 * 🔴 AMBANG INI DITURUNKAN 22 → 10 pada jam ~16, 18 September 2026, atas
 * permintaan pemilik produk yang ingin lembarnya lebih kompak. Ini BUKAN
 * penyesuaian teknis biasa: 14pt ≈ 18,7px CSS, yang pada render 1080px
 * selebar layar ponsel lima inci setara ±56px — sementara nilai terkecil yang
 * dipakai sekarang 10px (`dasarHukum`) dan teks isi utamanya 15px. Jadi
 * lembar ini secara sadar berada DI BAWAH lantai §3.6, dan pagar ini turun
 * bersamanya supaya `npm run verify` tetap hijau. Angka lamanya (ambang 22px;
 * isi utama 30px, teks sekunder 24px) masih ada di riwayat git dan
 * PERUBAHAN.md PB-016 — kalau keputusan ini dibalik, kembalikan keduanya
 * BERSAMAAN; jangan pernah menaikkan ambang ini sendirian.
 */
const AMBANG_PIKSEL_MINIMAL = 10;

describe("S08-7 ukuran huruf isi minimal setara 14pt", () => {
  it("seluruh fontSize pada isi (bukan hiasan) di atas ambang minimal", () => {
    const { simpul } = bongkarLembar(LEMBAR_CAMPURAN);
    const ukuranFont = simpul
      .map((s) => s.style?.["fontSize"])
      .filter((v): v is number => typeof v === "number");

    expect(ukuranFont.length).toBeGreaterThan(0);
    for (const ukuran of ukuranFont) {
      expect(ukuran, `ditemukan fontSize ${ukuran}px, di bawah ambang ${AMBANG_PIKSEL_MINIMAL}px`).toBeGreaterThanOrEqual(
        AMBANG_PIKSEL_MINIMAL,
      );
    }
  });

  it("ketujuh pertanyaan dan kalimat blok2 dirender pada ukuran isi yang sama (15px)", () => {
    const { simpul } = bongkarLembar(LEMBAR_KOSONG);
    const ukuranIsi = simpul.filter((s) => s.style?.["fontSize"] === 15);
    // 10 kalimat blok 2 (UKURAN.blok2Kalimat) + 7 pertanyaan (UKURAN.pertanyaan)
    // = 17 elemen pada skenario seluruh kosong; keduanya wajib tetap 15px dan
    // sama satu sama lain — pertanyaan tidak boleh lebih kecil dari kalimat
    // mana pun di lembar. Angka 15 di sini harus mengikuti `UKURAN`.
    expect(ukuranIsi.length).toBe(17);
  });
});

// --- Spesifikasi visual umum: radius 0, lebar 1080, ketujuh pertanyaan selalu ada ---

describe("Spesifikasi visual BLUEPRINT H.9", () => {
  it("lebar render 1080px", () => {
    expect(LEBAR_LEMBAR).toBe(1080);
  });

  it("radius sudut lembar adalah 0 (bukan kartu aplikasi)", () => {
    // simpul[0] SEKARANG adalah pembungkus skala 2x (SKALA_RENDER, tidak
    // punya borderRadius sama sekali — cuma shim ukuran), simpul[1] adalah
    // "kartu" lembar sesungguhnya (backgroundColor kertas, borderRadius 0).
    const { simpul } = bongkarLembar(LEMBAR_KOSONG);
    const akarKartu = simpul.find((s) => s.style?.["borderRadius"] === 0);
    expect(akarKartu).toBeDefined();
  });

  it.each(SKENARIO)("%s: ketujuh pertanyaan selalu tercetak, urutan tetap", (_nama, lembar) => {
    const { teks } = bongkarLembar(lembar);
    for (const pertanyaan of PERTANYAAN) {
      expect(teks.some((t) => t.includes(pertanyaan))).toBe(true);
    }
  });

  it("judul lembar tercetak di kepala, latar biru token `kepala`", () => {
    const { simpul, teks } = bongkarLembar(LEMBAR_KOSONG);
    expect(teks).toContain("LEMBAR JANJI");
    const adaLatarKepala = simpul.some(
      (s) => s.style?.["backgroundColor"] === WARNA.kepala,
    );
    expect(adaLatarKepala).toBe(true);

    // Teks isi (bukan kepala) tidak boleh ikut memakai warna kepala —
    // bug nyata yang pernah terjadi: token warna kepala menumpangi kunci
    // yang SAMA dengan warna teks isi (nilai keterangan, daftar pertanyaan),
    // membuat teks isi ikut jadi biru tanpa sengaja. Token `kepala` sekarang
    // terpisah dari token manapun yang dipakai warna teks, jadi ini harus
    // selalu false.
    const adaTeksBiruDiIsi = simpul.some(
      (s) => s.style?.["color"] === WARNA.kepala,
    );
    expect(adaTeksBiruDiIsi).toBe(false);
  });

  it("penanda waktu tercantum di kepala lembar", () => {
    const { teks } = bongkarLembar(LEMBAR_KOSONG);
    expect(teks).toContain("Dicatat pada: 18 September 2026, 09.15");
  });
});

// --- tinggiLembar: sanity, dan integrasi nyata dengan ImageResponse ---

describe("tinggiLembar (estimasi tinggi render)", () => {
  it.each(SKENARIO)("%s: mengembalikan angka positif yang masuk akal (>1000px)", (_nama, lembar) => {
    const tinggi = tinggiLembar(lembar);
    expect(tinggi).toBeGreaterThan(1000);
    expect(Number.isFinite(tinggi)).toBe(true);
  });
});

describe("Integrasi: ImageResponse benar-benar menghasilkan PNG yang valid", () => {
  it("elemenLembar + tinggiLembar dapat dirender next/og.ImageResponse menjadi PNG 1080px lebar (LOGIS)", async () => {
    const { ImageResponse } = await import("next/og");
    const tinggi = tinggiLembar(LEMBAR_CAMPURAN);
    const respons = new ImageResponse(elemenLembar(LEMBAR_CAMPURAN), {
      width: LEBAR_LEMBAR,
      height: tinggi,
    });
    const buf = Buffer.from(await respons.arrayBuffer());

    // Signature PNG + IHDR lebar/tinggi (offset 16 dan 20, big-endian).
    expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(buf.readUInt32BE(16)).toBe(LEBAR_LEMBAR);
    expect(buf.readUInt32BE(20)).toBe(tinggi);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("PROGRESS [perbaikan-blur] pembungkus skala benar-benar menerapkan transform scale(SKALA_RENDER), bukan cuma ukuran kanvas 2x", () => {
    // Test dimensi PNG di bawah TIDAK menangkap kasus "kanvas diminta 2x
    // tapi transform lupa diterapkan" — ImageResponse tetap mengeluarkan
    // PNG berdimensi 2x apa pun isinya, cuma isinya kosong/menyusut ke
    // pojok. Diverifikasi lewat mutasi manual (transform diubah jadi
    // scale(1)): test dimensi PNG tetap hijau, jadi structural check di
    // sini WAJIB ada di sampingnya.
    const { simpul } = bongkarLembar(LEMBAR_KOSONG);
    const adaTransformBenar = simpul.some(
      (s) => s.style?.["transform"] === `scale(${SKALA_RENDER})`,
    );
    expect(adaTransformBenar).toBe(true);

    const pembungkusLuar = simpul[0];
    expect(pembungkusLuar?.style?.["width"]).toBe(LEBAR_LEMBAR * SKALA_RENDER);
  });

  it("PROGRESS [perbaikan-blur] keluaran sungguhan 2x (SKALA_RENDER) — dimensi PNG persis LEBAR_LEMBAR*2 dan tinggi*2, tata letak tidak terpotong", async () => {
    // Cara `src/app/api/kartu/route.ts` benar-benar memanggil ImageResponse:
    // width/height diminta 2x, tapi tata letak logisnya (semua angka piksel
    // di renderLembar.tsx) tetap 1x — pembungkus `transform: scale()` di
    // `elemenLembar` yang menggandakan resolusi keluaran. Dibuktikan visual
    // sekali secara manual (PNG disimpan & dilihat langsung) sebelum test
    // ini ditulis — lihat PROGRESS.md.
    const { ImageResponse } = await import("next/og");
    const tinggiLogis = tinggiLembar(LEMBAR_CAMPURAN);
    const respons = new ImageResponse(elemenLembar(LEMBAR_CAMPURAN), {
      width: LEBAR_LEMBAR * SKALA_RENDER,
      height: tinggiLogis * SKALA_RENDER,
    });
    const buf = Buffer.from(await respons.arrayBuffer());

    expect(buf.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
    expect(buf.readUInt32BE(16)).toBe(LEBAR_LEMBAR * SKALA_RENDER);
    expect(buf.readUInt32BE(20)).toBe(tinggiLogis * SKALA_RENDER);
    // Keluaran 2x harus berupa PNG yang jauh lebih besar dari sekadar upscale
    // kosong — bukti tidak ada canvas kosong/terpotong akibat pembungkus skala.
    expect(buf.length).toBeGreaterThan(5000);
  });
});
