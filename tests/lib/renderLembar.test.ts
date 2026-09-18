import { describe, expect, it } from "vitest";
import {
  elemenLembar,
  tinggiLembar,
  LEBAR_LEMBAR,
  UKURAN,
} from "../../src/lib/renderLembar";
import {
  PENUTUP_LEMBAR,
  JUDUL_LEMBAR,
  SUBJUDUL_LEMBAR,
  KALIMAT_BAWAH_BLOK_2,
} from "../../src/core/teks";
import { rakitIsiLembar } from "../../src/core/perakitan";
import { SLOT_IDS } from "../../src/core/slot";
import type { SlotId } from "../../src/core/slot";
import { Keadaan } from "../../src/core/tipe";
import type { IsiLembar, Penilaian } from "../../src/core/tipe";
import tailwindConfig from "../../tailwind.config";
import { POST } from "../../src/app/api/kartu/route";

const DAFTAR_WARNA = tailwindConfig.theme!.extend!.colors as Record<string, string>;

function hexKeRgb(hex: string): [number, number, number] {
  const bersih = hex.replace("#", "");
  const r = parseInt(bersih.slice(0, 2), 16);
  const g = parseInt(bersih.slice(2, 4), 16);
  const b = parseInt(bersih.slice(4, 6), 16);
  return [r, g, b];
}

function rgbKeHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const maks = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (maks + min) / 2;

  if (maks === min) {
    return [0, 0, l];
  }

  const d = maks - min;
  const s = l > 0.5 ? d / (2 - maks - min) : d / (maks + min);

  let h: number;
  switch (maks) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
      break;
    case gn:
      h = ((bn - rn) / d + 2) * 60;
      break;
    default:
      h = ((rn - gn) / d + 4) * 60;
  }

  return [h, s, l];
}

function apakahMerah(hex: string): boolean {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return false;
  const [r, g, b] = hexKeRgb(hex);
  const [h, s, l] = rgbKeHsl(r, g, b);
  const hueMerah = h <= 15 || h >= 345;
  const cukupJenuh = s >= 0.2;
  const tidakEkstrem = l >= 0.15 && l <= 0.85;
  return hueMerah && cukupJenuh && tidakEkstrem;
}

function semuaKeadaan(k: Keadaan): Record<SlotId, Keadaan> {
  const keadaan = {} as Record<SlotId, Keadaan>;
  for (const id of SLOT_IDS) {
    keadaan[id] = k;
  }
  return keadaan;
}

function semuaNilai(isi: string | null): Record<SlotId, string | null> {
  const nilai = {} as Record<SlotId, string | null>;
  for (const id of SLOT_IDS) {
    nilai[id] = isi;
  }
  return nilai;
}

function penilaianDari(keadaan: Record<SlotId, Keadaan>): Penilaian {
  const jumlahKosong = SLOT_IDS.filter(
    (id) => keadaan[id] === Keadaan.BELUM_DIJAWAB,
  ).length;
  return { keadaan, jumlahKosong };
}

function buatIsiLembar(
  keadaan: Record<SlotId, Keadaan>,
  nilai: Record<SlotId, string | null>,
  tanggal: string = "Dicatat pada: 18 September 2026, 09.15",
): IsiLembar {
  return rakitIsiLembar({
    penilaian: penilaianDari(keadaan),
    nilaiAsli: nilai,
    tanggal,
  });
}

/** Menelusuri seluruh pohon elemen React secara rekursif. */
function telusuriElemen(
  node: unknown,
  kunjungi: (obj: { type: unknown; props: Record<string, unknown>; style?: Record<string, unknown> }) => void,
): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const anak of node) {
      telusuriElemen(anak, kunjungi);
    }
    return;
  }
  const el = node as { type?: unknown; props?: Record<string, unknown> };
  if (!el.props) return;

  const style = el.props["style"] as Record<string, unknown> | undefined;
  kunjungi({ type: el.type, props: el.props, style });

  if (el.props["children"]) {
    telusuriElemen(el.props["children"], kunjungi);
  }
}

/** Mengumpulkan seluruh teks di dalam pohon elemen. */
function kumpulkanSemuaTeks(node: unknown): string[] {
  const teks: string[] = [];
  function jalan(n: unknown) {
    if (typeof n === "string") {
      teks.push(n);
    } else if (typeof n === "number") {
      teks.push(String(n));
    } else if (Array.isArray(n)) {
      n.forEach(jalan);
    } else if (n && typeof n === "object" && "props" in n) {
      const p = (n as { props?: { children?: unknown } }).props;
      if (p?.children) jalan(p.children);
    }
  }
  jalan(node);
  return teks;
}

/** Mengumpulkan seluruh token warna (string hex) yang dipakai di style pohon elemen. */
function kumpulkanSemuaWarna(node: unknown): string[] {
  const warna: string[] = [];
  telusuriElemen(node, ({ style }) => {
    if (!style) return;
    for (const nilai of Object.values(style)) {
      if (typeof nilai === "string") {
        const kecocokan = nilai.match(/#[0-9a-fA-F]{6}/g);
        if (kecocokan) {
          warna.push(...kecocokan);
        }
      }
    }
  });
  return warna;
}

/** Mengumpulkan seluruh nilai fontSize pada pohon elemen. */
function kumpulkanSemuaFontSize(node: unknown): number[] {
  const daftar: number[] = [];
  telusuriElemen(node, ({ style }) => {
    if (!style) return;
    if (typeof style["fontSize"] === "number") {
      daftar.push(style["fontSize"]);
    }
  });
  return daftar;
}

describe("S08-1 & S08-4 Spesifikasi visual lembar & penanda waktu", () => {
  it("lebar lembar tepat 1080px pada konstanta dan elemen root", () => {
    expect(LEBAR_LEMBAR).toBe(1080);

    const lembar = buatIsiLembar(
      semuaKeadaan(Keadaan.BELUM_DIJAWAB),
      semuaNilai(null),
    );
    const elemen = elemenLembar(lembar);
    expect(elemen.props.style.width).toBe(1080);
  });

  it("kepala lembar memuat judul, subjudul, dan penanda waktu pencatatan", () => {
    const tanggalUji = "Dicatat pada: 18 September 2026, 12.00";
    const lembar = buatIsiLembar(
      semuaKeadaan(Keadaan.BELUM_DIJAWAB),
      semuaNilai(null),
      tanggalUji,
    );
    const teksSemua = kumpulkanSemuaTeks(elemenLembar(lembar)).join(" ");

    expect(teksSemua).toContain(JUDUL_LEMBAR);
    expect(teksSemua).toContain(SUBJUDUL_LEMBAR);
    expect(teksSemua).toContain(tanggalUji);
  });
});

describe("S08-2 Pagar warna: tidak memuat warna merah pada keterangan kosong", () => {
  it("token latar-kosong di tailwind.config.ts tersedia dan bukan merah", () => {
    expect(DAFTAR_WARNA["latar-kosong"]).toBeDefined();
    expect(apakahMerah(DAFTAR_WARNA["latar-kosong"]!)).toBe(false);
  });

  it("seluruh elemen lembar kosong tidak memuat warna merah", () => {
    const lembarKosong = buatIsiLembar(
      semuaKeadaan(Keadaan.BELUM_DIJAWAB),
      semuaNilai(null),
    );
    const elemen = elemenLembar(lembarKosong);
    const warnaTerpakai = kumpulkanSemuaWarna(elemen);

    expect(warnaTerpakai.length).toBeGreaterThan(0);
    const warnaMerah = warnaTerpakai.filter(apakahMerah);
    expect(warnaMerah).toEqual([]);
  });

  it("baris keterangan kosong memakai latar-kosong dan bukan merah", () => {
    const lembarKosong = buatIsiLembar(
      semuaKeadaan(Keadaan.BELUM_DIJAWAB),
      semuaNilai(null),
    );
    const elemen = elemenLembar(lembarKosong);

    let jumlahLatarKosong = 0;
    telusuriElemen(elemen, ({ style }) => {
      if (
        style?.backgroundColor &&
        String(style.backgroundColor).toUpperCase() === DAFTAR_WARNA["latar-kosong"]?.toUpperCase()
      ) {
        jumlahLatarKosong++;
      }
    });

    // 10 baris blok2 masing-masing berlatar latar-kosong
    expect(jumlahLatarKosong).toBe(10);
  });

  it("lembar campuran (sebagian terisi, sebagian kosong) tidak memuat warna merah", () => {
    const keadaan = semuaKeadaan(Keadaan.DISEBUTKAN);
    keadaan[2] = Keadaan.BELUM_DIJAWAB;
    keadaan[5] = Keadaan.BELUM_DIJAWAB;
    keadaan[8] = Keadaan.BELUM_DIJAWAB;
    keadaan[9] = Keadaan.DISEBUTKAN_SEBAGIAN;

    const nilai = semuaNilai("Ada informasinya");
    nilai[2] = null;
    nilai[5] = null;
    nilai[8] = null;

    const lembarCampuran = buatIsiLembar(keadaan, nilai);
    const elemen = elemenLembar(lembarCampuran);
    const warnaTerpakai = kumpulkanSemuaWarna(elemen);

    expect(warnaTerpakai.length).toBeGreaterThan(0);
    const warnaMerah = warnaTerpakai.filter(apakahMerah);
    expect(warnaMerah).toEqual([]);
  });
});

describe("S08-3 Nomor pasal per keterangan kosong dicantumkan", () => {
  it("seluruh nomor pasal per keterangan kosong tercantum dengan warna redup dan rata kanan", () => {
    const lembarKosong = buatIsiLembar(
      semuaKeadaan(Keadaan.BELUM_DIJAWAB),
      semuaNilai(null),
    );
    const elemen = elemenLembar(lembarKosong);

    let jumlahPasalTercantum = 0;
    telusuriElemen(elemen, ({ style, props }) => {
      if (
        style?.color === DAFTAR_WARNA["redup"] &&
        style?.textAlign === "right" &&
        style?.fontSize === UKURAN.dasarHukum
      ) {
        const teks = kumpulkanSemuaTeks(props["children"]).join("");
        if (teks.includes("Pasal")) {
          jumlahPasalTercantum++;
        }
      }
    });

    expect(jumlahPasalTercantum).toBe(10);
  });
});

describe("S08-5 Kalimat penutup wajib selalu ada pada hasil render", () => {
  it("kalimat penutup wajib selalu ada ketika semua keterangan kosong", () => {
    const lembar = buatIsiLembar(
      semuaKeadaan(Keadaan.BELUM_DIJAWAB),
      semuaNilai(null),
    );
    const teksSemua = kumpulkanSemuaTeks(elemenLembar(lembar)).join(" ");
    expect(teksSemua).toContain(PENUTUP_LEMBAR);
  });

  it("kalimat penutup wajib selalu ada ketika semua keterangan terisi", () => {
    const lembar = buatIsiLembar(
      semuaKeadaan(Keadaan.DISEBUTKAN),
      semuaNilai("Tawaran lengkap tercantum"),
    );
    const teksSemua = kumpulkanSemuaTeks(elemenLembar(lembar)).join(" ");
    expect(teksSemua).toContain(PENUTUP_LEMBAR);
  });

  it("kalimat penutup wajib selalu ada pada skenario campuran", () => {
    const keadaan = semuaKeadaan(Keadaan.DISEBUTKAN);
    keadaan[1] = Keadaan.BELUM_DIJAWAB;
    keadaan[4] = Keadaan.BELUM_DIJAWAB;
    const nilai = semuaNilai("Contoh isi");
    nilai[1] = null;
    nilai[4] = null;

    const lembar = buatIsiLembar(keadaan, nilai);
    const teksSemua = kumpulkanSemuaTeks(elemenLembar(lembar)).join(" ");
    expect(teksSemua).toContain(PENUTUP_LEMBAR);
  });

  it("kalimat bawah blok 2 wajib selalu tercantum di blok 2", () => {
    const lembar = buatIsiLembar(
      semuaKeadaan(Keadaan.BELUM_DIJAWAB),
      semuaNilai(null),
    );
    const teksSemua = kumpulkanSemuaTeks(elemenLembar(lembar)).join(" ");
    expect(teksSemua).toContain(KALIMAT_BAWAH_BLOK_2);
  });
});

describe("S08-7 Ukuran huruf minimum pada lembar 1080px (setara >= 14pt)", () => {
  it("konstanta UKURAN memenuhi batas: isi >= 30px dan teks sekunder/pasal >= 24px", () => {
    expect(UKURAN.blok1Nilai).toBeGreaterThanOrEqual(30);
    expect(UKURAN.blok2Kalimat).toBeGreaterThanOrEqual(30);
    expect(UKURAN.pertanyaan).toBeGreaterThanOrEqual(30);
    expect(UKURAN.dasarHukum).toBeGreaterThanOrEqual(24);
    expect(UKURAN.judul).toBeGreaterThanOrEqual(30);
    expect(UKURAN.labelBlok).toBeGreaterThanOrEqual(30);
    expect(UKURAN.penutup).toBeGreaterThanOrEqual(24);
  });

  it("seluruh elemen teks pada hasil render memiliki fontSize minimal 24px", () => {
    const lembarCampuran = buatIsiLembar(
      {
        ...semuaKeadaan(Keadaan.DISEBUTKAN),
        3: Keadaan.BELUM_DIJAWAB,
        7: Keadaan.BELUM_DIJAWAB,
      },
      {
        ...semuaNilai("Ada"),
        3: null,
        7: null,
      },
    );
    const fontSizes = kumpulkanSemuaFontSize(elemenLembar(lembarCampuran));
    expect(fontSizes.length).toBeGreaterThan(0);
    for (const ukuran of fontSizes) {
      expect(ukuran).toBeGreaterThanOrEqual(24);
    }
  });
});

describe("Perhitungan tinggiLembar", () => {
  it("menghasilkan tinggi yang memadai (> 1080px) untuk seluruh skenario", () => {
    const lembarKosong = buatIsiLembar(
      semuaKeadaan(Keadaan.BELUM_DIJAWAB),
      semuaNilai(null),
    );
    const lembarPenuh = buatIsiLembar(
      semuaKeadaan(Keadaan.DISEBUTKAN),
      semuaNilai("Teks nilai tawaran yang cukup panjang untuk menguji baris"),
    );

    const tinggiKosong = tinggiLembar(lembarKosong);
    const tinggiPenuh = tinggiLembar(lembarPenuh);

    expect(tinggiKosong).toBeGreaterThan(1080);
    expect(tinggiPenuh).toBeGreaterThan(1080);
  });
});

describe("Endpoint POST /api/kartu", () => {
  it("mengembalikan status 400 bila JSON tidak valid", async () => {
    const req = new Request("http://localhost/api/kartu", {
      method: "POST",
      body: "bukan json",
    });
    const resp = await POST(req);
    expect(resp.status).toBe(400);
    const data = (await resp.json()) as { pesan: string };
    expect(data.pesan).toBe("Permintaan tidak dapat dibaca.");
  });

  it("mengembalikan status 400 bila isiLembar tidak lengkap", async () => {
    const req = new Request("http://localhost/api/kartu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isiLembar: { blok1: [] } }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(400);
    const data = (await resp.json()) as { pesan: string };
    expect(data.pesan).toBe("Data lembar tidak lengkap.");
  });

  it("mengembalikan respons gambar 200 untuk isiLembar yang sah", async () => {
    const isiLembar = buatIsiLembar(
      semuaKeadaan(Keadaan.BELUM_DIJAWAB),
      semuaNilai(null),
    );
    const req = new Request("http://localhost/api/kartu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isiLembar }),
    });
    const resp = await POST(req);
    expect(resp.status).toBe(200);
    expect(resp.headers.get("content-type")).toContain("image/png");
    const arrayBuf = await resp.arrayBuffer();
    expect(arrayBuf.byteLength).toBeGreaterThan(1000);
  });
});
