/**
 * Merakit `IsiLembar` dari `Penilaian`, sesuai BLUEPRINT.md bagian G.6.
 *
 * Urutan blok tetap: blok1 (sudah disebutkan) → blok2 (belum dijawab) →
 * pertanyaan (ketujuhnya, selalu). Kalimat diambil dari `src/core/teks.ts`,
 * tidak pernah dirakit di sini sebagai kalimat baru — fungsi di berkas ini
 * hanya MEMILIH dan MENYUSUN teks yang sudah ada, sesuai keadaan tiap slot.
 *
 * Lapis 1 dan Lapis 2 (BLUEPRINT bagian G.5) BELUM diimplementasikan di
 * sini — itu S09. `hasilLapis1` dan `catatanHitungan` hanya diteruskan
 * apa adanya dari parameter, tidak dihitung atau dicocokkan di sini.
 */

import { Keadaan } from "./tipe";
import type { BarisBlok1, BarisBlok2, HasilLapis1, IsiLembar, Penilaian } from "./tipe";
import { SLOT_IDS, slotDenganId } from "./slot";
import type { SlotId } from "./slot";
import { KAMUS_LEMBAR } from "./teks";
import type { KamusLembar } from "./teks";

export interface ParameterRakitan {
  readonly penilaian: Penilaian;
  /** Nilai apa adanya dari `HasilBacaFinal`, dipakai untuk mengisi blok1. */
  readonly nilaiAsli: Readonly<Record<SlotId, string | null>>;
  readonly tanggal: string;
  /** Belum dihitung di S04. Diteruskan apa adanya bila sudah tersedia (S09). */
  readonly hasilLapis1?: HasilLapis1;
  /** Belum dihitung di S04. Diteruskan apa adanya bila sudah tersedia (S09). */
  readonly catatanHitungan?: string;
  /**
   * Bahasa lembar. Bawaannya Indonesia (`KAMUS_LEMBAR`); versi Jawa ada di
   * `teksJawa.ts` dan dipilih pemanggil lewat `kamusLembarUntuk()`. Seluruh
   * kalimat sistem (nama keterangan, kalimat "belum menyebutkan", ketujuh
   * pertanyaan) diambil dari sini — tidak ada yang ditulis ulang di berkas ini.
   */
  readonly kamus?: KamusLembar;
}

export function rakitIsiLembar(parameter: ParameterRakitan): IsiLembar {
  const {
    penilaian,
    nilaiAsli,
    tanggal,
    hasilLapis1,
    catatanHitungan,
    kamus = KAMUS_LEMBAR,
  } = parameter;

  const blok1: BarisBlok1[] = [];
  const blok2: BarisBlok2[] = [];

  for (const id of SLOT_IDS) {
    const keadaan = penilaian.keadaan[id];
    const slot = slotDenganId(id);

    if (keadaan === Keadaan.BELUM_DIJAWAB) {
      blok2.push({
        slot: id,
        kalimat: kamus.kalimatKosongPerSlot[id],
        dasarHukum: slot.dasarHukum,
      });
    } else {
      blok1.push({
        slot: id,
        label: kamus.namaSlot[id],
        nilai: nilaiAsli[id] ?? "",
        keadaan,
      });
    }
  }

  return {
    blok1,
    blok2,
    pertanyaan: kamus.pertanyaan,
    catatanHitungan,
    hasilLapis1,
    tanggal,
  };
}

/**
 * Mengisi placeholder literal pada templat teks dari `teks.ts`
 * (mis. "{tanggal}", "{tanggal salinan}", "{n}", "{nama}") lewat
 * penggantian string biasa — bukan template literal JavaScript, supaya
 * teks sumbernya tetap salinan harfiah dari BLUEPRINT F.
 */
export function isiTemplat(
  templat: string,
  nilai: Readonly<Record<string, string>>,
): string {
  let hasil = templat;
  for (const [kunci, isi] of Object.entries(nilai)) {
    hasil = hasil.split(`{${kunci}}`).join(isi);
  }
  return hasil;
}
