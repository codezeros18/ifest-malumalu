-- Satu-satunya tabel di seluruh sistem (CLAUDE.md bagian 4: "Tabel basis
-- data: tepat 1"). Dijalankan MANUAL, sekali, terhadap basis data Postgres
-- terkelola — tidak ada ORM, tidak ada migrasi otomatis (CLAUDE.md bagian 5:
-- "ORM beserta migrasinya" dilarang).
--
-- Bentuknya PERSIS dari BLUEPRINT.md G.1. Tepat ENAM kolom data (di luar
-- `id`, yang sekadar penanda baris, bukan data tentang pemeriksaan itu
-- sendiri): jalur_masukan, jumlah_kosong, dikoreksi, dibagikan,
-- durasi_detik, dan waktu.
--
-- Menambah kolom di sini memerlukan entri PROGRESS.md beserta alasan kenapa
-- kolom itu TIDAK melanggar batas privasi CLAUDE.md §3.5 — lihat larangan
-- eksplisit: isi tawaran, nama perusahaan, angka upah, angka biaya, alamat
-- IP, pengenal perangkat, atau apa pun yang bisa mengaitkan satu baris ke
-- satu orang.

CREATE TABLE IF NOT EXISTS pemeriksaan (
  id            BIGSERIAL PRIMARY KEY,
  waktu         TIMESTAMPTZ NOT NULL DEFAULT now(),
  jalur_masukan TEXT NOT NULL,      -- 'gambar' | 'manual'
  jumlah_kosong SMALLINT NOT NULL,  -- 0..10
  dikoreksi     BOOLEAN NOT NULL,   -- pengguna mengubah hasil bacaan?
  dibagikan     BOOLEAN NOT NULL,   -- tombol bagikan ditekan?
  durasi_detik  INTEGER             -- buka sampai lembar terbit
);
