import React from "react";
import type { ReactNode } from "react";

/**
 * Komponen presentasional murni untuk RENDER LEMBAR (sisi server, Satori)
 * — TIDAK mengimpor apa pun dari `src/core` (BLUEPRINT G.4). Warna dan
 * teks label dioper sebagai prop oleh `src/lib/renderLembar.tsx`, yang
 * mengambilnya dari `tailwind.config.ts` dan `src/core/teks.ts`.
 *
 * Dipakai sebagai FUNGSI biasa (`blokLembar({...})`), bukan sebagai tag
 * JSX (`<BlokLembar>`) — Satori mengonsumsi pohon elemen yang sudah jadi,
 * jadi memanggilnya langsung menghindari ambiguitas soal apakah Satori
 * mengenali komponen fungsi kustom.
 */
export interface BlokLembarProps {
  readonly labelTeks: string;
  readonly warnaLatarLabel: string;
  readonly warnaTeksLabel: string;
  readonly ukuranLabel: number;
  readonly children: ReactNode;
}

export function blokLembar({
  labelTeks,
  warnaLatarLabel,
  warnaTeksLabel,
  ukuranLabel,
  children,
}: BlokLembarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <div
        style={{
          display: "flex",
          width: "100%",
          backgroundColor: warnaLatarLabel,
          color: warnaTeksLabel,
          fontSize: ukuranLabel,
          fontWeight: 700,
          padding: "20px 56px",
        }}
      >
        {labelTeks}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: "28px 56px",
        }}
      >
        {children}
      </div>
    </div>
  );
}
