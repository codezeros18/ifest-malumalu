import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * S10-6, S10-7: badan permintaan yang benar-benar sampai ke kueri SQL
 * TIDAK PERNAH memuat apa pun selain kelima kolom yang diizinkan
 * (`waktu` diisi `DEFAULT now()` oleh skema, tidak pernah dikirim klien).
 *
 * CLAUDE.md §3.5 melarang eksplisit: isi tawaran, nama perusahaan, angka
 * upah, angka biaya, alamat IP, pengenal perangkat, agen pengguna, atau
 * apa pun yang bisa mengaitkan satu baris ke satu orang. Test ini
 * memverifikasi keluaran SQL sungguhan yang dikirim ke `pg`, bukan cuma
 * bentuk fungsi — pagar privasi yang tidak memeriksa kueri sungguhan bisa
 * lulus hampa bila suatu saat ada jalur baru yang menyisipkan kolom.
 */

const clientTiruan = {
  connect: vi.fn(async () => {}),
  query: vi.fn<(sql: string, params: unknown[]) => Promise<{ rows: unknown[] }>>(() =>
    Promise.resolve({ rows: [] }),
  ),
  end: vi.fn(async () => {}),
};

vi.mock("pg", () => ({
  Client: vi.fn().mockImplementation(() => clientTiruan),
}));

const { POST } = await import("../../src/app/api/catat/route");

const DATABASE_URL_LAMA = process.env["DATABASE_URL"];

const KOLOM_TERLARANG = [
  "nama_perusahaan",
  "isi_tawaran",
  "upah",
  "gaji",
  "biaya",
  "alamat_ip",
  "ip",
  "pengenal_perangkat",
  "device_id",
  "user_agent",
  "agen_pengguna",
  "email",
  "nomor_telepon",
];

function permintaan(badanTambahan: Record<string, unknown> = {}): Request {
  return new Request("http://localhost/api/catat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jalur_masukan: "manual",
      jumlah_kosong: 4,
      dikoreksi: true,
      dibagikan: false,
      durasi_detik: 42,
      ...badanTambahan,
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env["DATABASE_URL"] = "postgres://tiruan-privasi/db";
});

afterEach(() => {
  if (DATABASE_URL_LAMA === undefined) {
    delete process.env["DATABASE_URL"];
  } else {
    process.env["DATABASE_URL"] = DATABASE_URL_LAMA;
  }
});

describe("privasi pencatatan — kueri SQL hanya memuat kolom yang diizinkan", () => {
  it("kueri dipanggil TEPAT SEKALI dengan lima parameter, persis nilai yang dikirim", async () => {
    await POST(permintaan());

    expect(clientTiruan.query).toHaveBeenCalledTimes(1);
    const panggilan = clientTiruan.query.mock.calls[0];
    if (!panggilan) throw new Error("query() tidak pernah dipanggil");
    const [sql, params] = panggilan;

    expect(params).toEqual(["manual", 4, true, false, 42]);
    expect(sql.toLowerCase()).toContain("insert into pemeriksaan");
    expect(sql.toLowerCase()).toContain("jalur_masukan");
    expect(sql.toLowerCase()).toContain("jumlah_kosong");
    expect(sql.toLowerCase()).toContain("dikoreksi");
    expect(sql.toLowerCase()).toContain("dibagikan");
    expect(sql.toLowerCase()).toContain("durasi_detik");
  });

  it.each(KOLOM_TERLARANG)(
    'kueri SQL tidak pernah menyebut kolom terlarang "%s"',
    async (kolomTerlarang) => {
      await POST(permintaan());

      const panggilan = clientTiruan.query.mock.calls.at(-1);
      if (!panggilan) throw new Error("query() tidak pernah dipanggil");
      const [sql] = panggilan;

      expect(sql.toLowerCase()).not.toContain(kolomTerlarang);
    },
  );

  it("kunci tambahan pada BADAN PERMINTAAN (mis. nama_perusahaan) diabaikan sepenuhnya — tidak masuk SQL maupun parameter", async () => {
    await POST(
      permintaan({
        nama_perusahaan: "PT Bocor Data Sejahtera",
        alamat_ip: "203.0.113.7",
        user_agent: "Mozilla/5.0 tiruan",
      }),
    );

    const panggilan = clientTiruan.query.mock.calls.at(-1);
    if (!panggilan) throw new Error("query() tidak pernah dipanggil");
    const [sql, params] = panggilan;

    expect(sql.toLowerCase()).not.toContain("nama_perusahaan");
    expect(sql.toLowerCase()).not.toContain("alamat_ip");
    expect(sql.toLowerCase()).not.toContain("user_agent");
    expect(params).not.toContain("PT Bocor Data Sejahtera");
    expect(params).not.toContain("203.0.113.7");
    expect(params).not.toContain("Mozilla/5.0 tiruan");
    expect(params).toHaveLength(5);
  });

  it("parameter kueri tepat berjumlah lima — tidak pernah lebih, apa pun isi badan permintaannya", async () => {
    await POST(permintaan({ apa_saja: "nilai acak", lainnya: 12345 }));

    const panggilan = clientTiruan.query.mock.calls.at(-1);
    if (!panggilan) throw new Error("query() tidak pernah dipanggil");
    const [, params] = panggilan;

    expect(params).toHaveLength(5);
  });
});
