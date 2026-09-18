/**
 * Pemanggil fire-and-forget ke `/api/catat` dari alur penerbitan lembar
 * (CLAUDE.md §3.5, BLUEPRINT G.1). Dipanggil TANPA menunggu hasilnya —
 * fungsi ini sendiri sudah menjamin itu: ia tidak pernah melempar dan
 * tidak pernah mengembalikan promise yang bisa ditolak, apa pun yang
 * terjadi pada jaringan atau endpointnya.
 *
 * Titik pemanggilan sesungguhnya (di layar penerbitan lembar) adalah
 * pekerjaan S08/S11 — berkas itu belum ada saat sprint ini dikerjakan.
 * Begitu ada, cukup panggil `catat({...})` tanpa `await` persis di titik
 * lembar selesai dirender; tidak perlu menangani hasilnya sama sekali.
 */

export interface BarisPencatatan {
  readonly jalur_masukan: "gambar" | "manual";
  /** 0..10 — banyaknya keterangan berkeadaan BELUM_DIJAWAB. */
  readonly jumlah_kosong: number;
  /** true bila pengguna mengubah hasil pembacaan di layar koreksi. */
  readonly dikoreksi: boolean;
  /** true bila tombol bagikan ditekan. */
  readonly dibagikan: boolean;
  /** Detik dari halaman dibuka sampai lembar terbit; null bila tidak terukur. */
  readonly durasi_detik: number | null;
}

/**
 * Fire-and-forget MURNI: tidak pernah melempar, tidak pernah membuat
 * pemanggilnya menunggu. `keepalive: true` menjaga permintaan tetap
 * berpeluang terkirim walau halaman langsung berpindah setelah lembar
 * terbit (pola yang sama dengan `navigator.sendBeacon`).
 */
export function catat(baris: BarisPencatatan): void {
  try {
    void fetch("/api/catat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(baris),
      keepalive: true,
    }).catch(() => {
      // Jaringan putus, endpoint mati, apa pun — ditelan di sini.
    });
  } catch {
    // Lingkungan tanpa `fetch` atau `keepalive` sekalipun tidak pernah
    // membuat alur penerbitan lembar terganggu.
  }
}
