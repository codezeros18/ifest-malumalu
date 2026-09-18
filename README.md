# Lembar Janji

Tawaran kerja ke luar negeri sampai ke keluarga di desa dalam bentuk gambar: poster yang diteruskan di grup WhatsApp, tangkapan layar percakapan, foto brosur. Gambar itu menyebutkan gaji dan negara tujuan, lalu meminta uang. Yang tidak disebutkan — siapa perusahaan penempatannya, siapa yang akan mempekerjakan, berapa lama kontraknya, uang itu untuk apa saja — tidak pernah terlihat, karena ketiadaan informasi memang tidak terlihat sampai ia ditampilkan sebagai daftar.

Lembar Janji menerima gambar itu dan menerbitkan satu lembar berisi tiga hal: apa yang sudah disebutkan, apa yang belum dijawab menurut Undang-Undang Nomor 18 Tahun 2017 tentang Pelindungan Pekerja Migran Indonesia, dan pertanyaan yang bisa diajukan kepada pihak yang menawarkan. Lembar itu berbentuk gambar supaya bisa diteruskan kembali ke percakapan tempat tawarannya beredar. Tidak ada akun, tidak ada pemasangan aplikasi, dan tidak ada data pribadi yang diminta.

---

## Peta repositori

```
src/
  app/                    Next.js App Router — halaman dan Route Handlers
    page.tsx              layar masukan: tempel gambar, unggah, atau ketik manual
    periksa/              layar koreksi hasil pembacaan lalu penerbitan lembar
    api/baca/             satu-satunya endpoint yang memanggil model
    api/kartu/            render lembar menjadi berkas gambar
    api/catat/            pencatatan metrik anonim, tidak memblokir
  core/                   logika murni — dilarang mengimpor apa pun dari src/vision
    slot.ts               definisi sepuluh keterangan sebagai data
    penilaian.ts          aturan tiga keadaan per keterangan
    kualitatif.ts         aturan kapan sebuah nilai dianggap terlalu kabur
    perakitan.ts          penyusunan kalimat lembar
    pencocokan.ts         Lapis 1 — pencocokan ke salinan daftar
    biaya.ts              Lapis 2 — pembandingan komponen biaya
    teks.ts               seluruh kalimat yang dilihat pengguna
  vision/                 satu-satunya folder yang tahu soal model
    pembaca.ts            antarmuka Pembaca
    modelProvider.ts      implementasi lewat API model
    manualProvider.ts     implementasi lewat pengetikan manual
  ui/                     token desain dan komponen dasar
  lib/                    utilitas render dan pembantu
data/
  p3mi-snapshot.json      salinan daftar perusahaan berizin, bertanggal
  komponen-biaya.json     acuan komponen biaya untuk Lapis 2
tests/                    pengujian Vitest
```

---

## Prasyarat

| Perkakas | Versi | Catatan |
|---|---|---|
| Node.js | 20.x atau lebih baru | `node --version` |
| npm | 10.x atau lebih baru | Ikut terpasang bersama Node 20 |
| Git | 2.30 atau lebih baru | |
| Kunci API model penglihatan | — | Lihat tabel variabel lingkungan |

Basis data tidak diperlukan untuk menjalankan aplikasi. Bila variabel basis data dikosongkan, seluruh alur tetap berfungsi dan pencatatan metrik dilewati.

---

## Cara menjalankan secara lokal

1. Salin repositori dan masuk ke direktorinya.

   ```bash
   git clone <URL-REPOSITORI> lembar-janji
   cd lembar-janji
   ```

2. Pasang dependensi.

   ```bash
   npm install
   ```

3. Buat berkas variabel lingkungan dari contohnya.

   ```bash
   cp .env.example .env.local
   ```

4. Isi `.env.local`. Minimal yang wajib diisi adalah kunci API model; sisanya boleh dikosongkan.

5. Jalankan server pengembangan.

   ```bash
   npm run dev
   ```

6. Buka `http://localhost:3000`.

7. Uji alur inti: tempel atau unggah sebuah gambar poster lowongan, koreksi hasil pembacaan bila ada yang meleset, lalu terbitkan lembarnya.

Untuk menjalankan versi produksi secara lokal:

```bash
npm run build
npm run start
```

---

## Variabel lingkungan

| Variabel | Untuk apa | Bila dikosongkan |
|---|---|---|
| `MODEL_API_KEY` | Kunci API model penglihatan yang membaca gambar menjadi data terstruktur | Jalur pembacaan gambar dinonaktifkan. Aplikasi tetap berjalan penuh lewat jalur pengetikan manual, dan layar masukan menyatakan hal itu apa adanya |
| `MODEL_NAMA` | Nama model yang dipakai | Memakai nilai bawaan yang tertulis di `src/vision/modelProvider.ts` (`google/gemini-3.8-flash`) |
| `MODEL_BASE_URL` | Alamat endpoint atau basis URL API model | Memakai endpoint bawaan OpenRouter (`https://openrouter.ai/api/v1/chat/completions`) |
| `DATABASE_URL` | Sambungan Postgres untuk pencatatan metrik anonim | Pencatatan metrik dilewati diam-diam. Tidak ada pengaruh sama sekali terhadap alur inti maupun isi lembar |
| `NEXT_PUBLIC_BASE_URL` | Alamat dasar aplikasi, dipakai saat merender lembar | Memakai `http://localhost:3000` |

Berkas `.env` dan seluruh turunannya tidak pernah ikut ter-*commit*. Lihat `.gitignore`.

---

## Peta rute

| Rute | Jenis | Fungsi |
|---|---|---|
| `/` | Halaman | Layar masukan. Tiga jalur setara: tempel gambar, unggah berkas, atau ketik manual |
| `/periksa` | Halaman | Menampilkan hasil pembacaan untuk dikoreksi pengguna, lalu menerbitkan lembar |
| `/api/baca` | POST | Mengubah gambar menjadi data terstruktur. Satu-satunya tempat model dipanggil |
| `/api/kartu` | POST | Merender lembar menjadi berkas gambar yang dapat diunduh dan dibagikan |
| `/api/catat` | POST | Mencatat metrik anonim. Kegagalan di sini tidak pernah menghentikan penerbitan lembar |

---

## Bagaimana sistem ini bekerja

Sistem dibangun dalam tiga lapis yang menurun secara bertahap.

**Lapis 0** melakukan perekaman tawaran dan penilaian kelengkapan. Lapis ini tidak bergantung pada sumber data eksternal mana pun, sehingga tidak dapat berhenti berfungsi selama aplikasinya berjalan.

**Lapis 1** mencocokkan nama perusahaan terhadap salinan daftar perusahaan penempatan berizin. Salinan itu berupa berkas JSON di dalam repositori beserta tanggal pengambilannya, bukan sambungan langsung ke sistem mana pun, dan tanggal salinannya ditampilkan di lembar.

**Lapis 2** membandingkan komponen biaya terhadap acuan yang berlaku.

Apabila Lapis 1 atau Lapis 2 tidak tersedia, keduanya dapat dinonaktifkan tanpa menghentikan alur utama. Sistem menyampaikan ketidaktersediaan itu secara terbuka kepada pengguna beserta langkah alternatif yang dapat ditempuh, dan lembarnya tetap terbit.

Pembagian peran antara kecerdasan buatan dan logika biasa bersifat tegas. Model hanya dipakai pada satu langkah, yaitu mengubah gambar menjadi data terstruktur. Seluruh penilaian, pencocokan, perhitungan, dan penyusunan kalimat dilakukan aturan yang dapat ditelusuri baris demi baris, dan seluruhnya berada di `src/core`. Folder itu tidak mengimpor apa pun dari `src/vision`, sehingga lapisan model dapat dinonaktifkan dan sistem tetap berjalan penuh lewat jalur pengetikan manual.

---

## Perintah verifikasi

```bash
npm run lint        # pemeriksaan gaya penulisan kode
npm run typecheck   # pemeriksaan tipe TypeScript, mode ketat
npm run test        # pengujian unit dan aturan penilaian
npm run verify      # menjalankan ketiganya secara berurutan
```

`npm run verify` harus lulus seluruhnya sebelum kode dianggap selesai.

Beberapa pengujian yang ada memeriksa hal yang tidak terlihat di antarmuka tetapi mengikat perilaku sistem: bahwa `src/core` tidak mengimpor apa pun dari `src/vision`, bahwa seluruh alur tetap berjalan tanpa memanggil model, dan bahwa tidak ada kata bernada menuduh yang masuk ke teks yang dilihat pengguna.

---

## Cara mencoba alur intinya

1. Buka halaman utama.
2. Pilih salah satu dari tiga jalur masukan. Ketiganya setara: menempel gambar dari papan klip, mengunggah berkas gambar, atau mengetik sendiri isi tawarannya.
3. Bila memilih jalur gambar, gunakan foto atau tangkapan layar poster lowongan kerja luar negeri. Poster berbahasa Indonesia dengan tata letak bebas adalah kasus yang paling mewakili pemakaian nyata.
4. Periksa hasil pembacaan pada layar berikutnya. Betulkan nilai yang keliru, dan biarkan kosong yang memang tidak diketahui.
5. Terbitkan lembarnya. Lembar akan menampilkan keterangan yang sudah disebutkan, keterangan yang belum dijawab beserta dasar hukumnya, dan pertanyaan yang dapat diajukan.
6. Unduh atau bagikan lembarnya.

Untuk memeriksa bahwa lapisan model benar-benar dapat dinonaktifkan, kosongkan `MODEL_API_KEY` lalu ulangi langkah di atas melalui jalur pengetikan manual. Seluruh alur harus tetap selesai sampai lembar terbit.

---

## Pemecahan masalah

| Gejala | Kemungkinan sebab | Yang dilakukan |
|---|---|---|
| Halaman terbuka tetapi jalur gambar dinonaktifkan | `MODEL_API_KEY` kosong atau salah | Isi variabelnya di `.env.local`, lalu jalankan ulang server |
| Pembacaan gambar selalu gagal | Berkas melebihi batas ukuran, atau formatnya tidak didukung | Gunakan berkas gambar di bawah 8 MB berformat JPG atau PNG |
| Lembar terbit tetapi hasil pencocokan tidak muncul | Berkas `data/p3mi-snapshot.json` tidak ada atau rusak | Lapis 1 memang dirancang dapat dinonaktifkan; alur intinya tidak terpengaruh |
| `npm run build` gagal karena galat tipe | Mode ketat TypeScript aktif | Jalankan `npm run typecheck` untuk melihat berkas dan barisnya |
| Aplikasi berjalan tetapi metrik tidak tercatat | `DATABASE_URL` kosong | Ini perilaku yang disengaja. Pencatatan metrik tidak pernah menghalangi alur inti |

---

## Artefak runnable

Tautan penggelaran: `<TAUTAN-DEPLOYMENT-DIISI-DI-SINI>`

Aplikasi dapat dibuka langsung dari peramban mana pun tanpa pemasangan, tanpa pendaftaran akun, dan tanpa kredensial. Panitia dan penguji dapat langsung menempelkan sebuah gambar poster lowongan untuk mencoba alur intinya dari awal sampai akhir.

---

## Batasan sistem

1. **Tidak menyatakan sebuah tawaran asli atau palsu.** Yang diperiksa adalah kelengkapan dokumen, bukan itikad seseorang.
2. **Tidak menilai, memberi skor, atau memeringkat** perusahaan maupun perorangan. Kosakata sistem hanya tiga: sudah disebutkan, disebutkan sebagian, belum dijawab.
3. **Tidak terhubung langsung dengan sistem pemerintah mana pun.** Pencocokan nama perusahaan dilakukan atas salinan data bertanggal, dan tanggal salinannya ditampilkan di lembar.
4. **Tidak menyimpan identitas pengguna.** Tidak ada akun, tidak ada nomor induk kependudukan, tidak ada nomor telepon, dan tidak ada gambar yang disimpan setelah diproses.
5. **Tidak menjamin ketepatan pembacaan** pada gambar buram, miring, atau tulisan tangan. Karena itu hasil pembacaan selalu ditampilkan untuk dikoreksi, dan jalur pengetikan manual selalu tersedia serta setara.

---

## Lisensi dan kepemilikan

Karya ini sepenuhnya milik tim pengembang.
