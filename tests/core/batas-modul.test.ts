import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const AKAR_CORE = join(process.cwd(), "src", "core");

/**
 * Lapisan yang TIDAK BOLEH diimpor oleh src/core. Ini yang membuat klaim
 * "lapisan model dapat dicabut" dapat dibuktikan, bukan sekadar dinyatakan.
 */
const LAPISAN_TERLARANG = ["vision", "app", "ui", "lib"];

/** Modul Node yang menyentuh berkas, jaringan, atau platform. */
const MODUL_IO_NODE = new Set([
  "fs",
  "path",
  "http",
  "http2",
  "https",
  "net",
  "dns",
  "dgram",
  "tls",
  "child_process",
  "cluster",
  "worker_threads",
  "os",
  "process",
  "readline",
  "repl",
  "inspector",
  "v8",
  "vm",
  "module",
  "wasi",
  "zlib",
  "stream",
  "crypto",
  "timers",
  "async_hooks",
  "perf_hooks",
  "tty",
  "trace_events",
  "diagnostics_channel",
]);

const POLA_SPESIFIER: readonly RegExp[] = [
  /\b(?:import|export)\b[\s\S]{0,500}?\bfrom\s*["']([^"']+)["']/g,
  /\bimport\s*["']([^"']+)["']/g,
  /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
];

function berkasTypeScript(direktori: string): string[] {
  const terkumpul: string[] = [];
  for (const entri of readdirSync(direktori, { withFileTypes: true })) {
    const jalur = join(direktori, entri.name);
    if (entri.isDirectory()) {
      terkumpul.push(...berkasTypeScript(jalur));
    } else if (/\.tsx?$/.test(entri.name)) {
      terkumpul.push(jalur);
    }
  }
  return terkumpul;
}

function spesifierDari(isi: string): string[] {
  const terkumpul: string[] = [];
  for (const pola of POLA_SPESIFIER) {
    for (const cocok of isi.matchAll(pola)) {
      const spesifier = cocok[1];
      if (spesifier) {
        terkumpul.push(spesifier);
      }
    }
  }
  return terkumpul;
}

function melanggarLapisan(spesifier: string): boolean {
  const lapisan = LAPISAN_TERLARANG.join("|");
  return [
    new RegExp(`^@/(${lapisan})(/|$)`),
    new RegExp(`^(\\.{1,2}/)+(${lapisan})(/|$)`),
    new RegExp(`^src/(${lapisan})(/|$)`),
  ].some((pola) => pola.test(spesifier));
}

function melanggarIoNode(spesifier: string): boolean {
  const tanpaPrefiks = spesifier.replace(/^node:/, "");
  const segmenPertama = tanpaPrefiks.split("/")[0] ?? "";
  return MODUL_IO_NODE.has(tanpaPrefiks) || MODUL_IO_NODE.has(segmenPertama);
}

const berkasCore = berkasTypeScript(AKAR_CORE);

describe("batas modul src/core", () => {
  it("ada berkas yang dipindai — pagar ini tidak boleh lulus secara hampa", () => {
    expect(berkasCore.length).toBeGreaterThan(0);
  });

  it("src/core tidak mengimpor vision, app, ui, atau lib", () => {
    const pelanggaran: string[] = [];

    for (const berkas of berkasCore) {
      const isi = readFileSync(berkas, "utf8");
      for (const spesifier of spesifierDari(isi)) {
        if (melanggarLapisan(spesifier)) {
          pelanggaran.push(`${relative(process.cwd(), berkas)} → ${spesifier}`);
        }
      }
    }

    expect(pelanggaran).toEqual([]);
  });

  it("src/core tidak mengimpor modul I/O Node", () => {
    const pelanggaran: string[] = [];

    for (const berkas of berkasCore) {
      const isi = readFileSync(berkas, "utf8");
      for (const spesifier of spesifierDari(isi)) {
        if (melanggarIoNode(spesifier)) {
          pelanggaran.push(`${relative(process.cwd(), berkas)} → ${spesifier}`);
        }
      }
    }

    expect(pelanggaran).toEqual([]);
  });

  it("src/core tidak membaca variabel lingkungan", () => {
    const pelanggaran: string[] = [];

    for (const berkas of berkasCore) {
      if (/\bprocess\s*\.\s*env\b/.test(readFileSync(berkas, "utf8"))) {
        pelanggaran.push(relative(process.cwd(), berkas));
      }
    }

    expect(pelanggaran).toEqual([]);
  });
});
