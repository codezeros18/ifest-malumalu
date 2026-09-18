/**
 * Helper pemuatan berkas data snapshot untuk lingkungan server/Node.js.
 * Menjamin pembacaan berkas tidak pernah melempar galat yang menghentikan alur:
 * bila berkas tidak ada atau rusak, fungsi mengembalikan null (sebagai penanda degradasi).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SnapshotP3MIInput } from "../core/pencocokan";

export function muatSnapshotP3MIDariBerkas(
  jalurKustom?: string,
): SnapshotP3MIInput | null {
  try {
    const target = jalurKustom ?? join(process.cwd(), "data", "p3mi-snapshot.json");
    if (!existsSync(target)) {
      return null;
    }
    const teks = readFileSync(target, "utf8");
    const json = JSON.parse(teks);
    if (!json || typeof json !== "object") return null;
    return json as SnapshotP3MIInput;
  } catch {
    return null;
  }
}

export function muatSnapshotBiayaDariBerkas(
  jalurKustom?: string,
): unknown | null {
  try {
    const target =
      jalurKustom ?? join(process.cwd(), "data", "komponen-biaya.json");
    if (!existsSync(target)) {
      return null;
    }
    const teks = readFileSync(target, "utf8");
    const json = JSON.parse(teks);
    if (!json || typeof json !== "object") return null;
    return json;
  } catch {
    return null;
  }
}
