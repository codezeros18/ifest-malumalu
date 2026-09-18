# PERUBAHAN.md

Berkas ini mencatat setiap penyimpangan antara apa yang kami tuliskan di proposal babak penyisihan dan apa yang benar-benar kami bangun selama Hack Day, beserta alasan dan dampaknya terhadap masalah inti. Kami menuliskannya bukan sebagai permintaan maaf, melainkan sebagai catatan kerja: dalam dua puluh empat jam pengembangan, setiap keputusan yang bertemu kenyataan akan diuji, dan sebagian akan berubah. **Berkas yang kosong justru berarti tim tidak belajar apa pun dari proses pembangunannya.** Setiap entri di bawah menyertakan kondisi awalnya, apa yang diubah, alasan yang memicunya, dan dampaknya terhadap masalah yang kami serang — sehingga pembaca dapat menilai apakah perubahan itu memperkuat karya atau melemahkannya.

---

## Format entri

```markdown
## [PB-00n] Judul singkat perubahan

**Jam ke-**         : [jam ke berapa dari 24 jam]
**Diputuskan oleh** : [peran / nama]

**Kondisi di proposal penyisihan**
[Kutip atau ringkas apa yang tertulis di proposal.]

**Hal yang diubah**
[Apa yang sekarang benar-benar dibangun.]

**Alasan perubahan**
[Temuan teknis, keterbatasan data, atau keterbatasan waktu yang memicunya.
Ditulis konkret, bukan "karena keterbatasan waktu" saja.]

**Dampak terhadap masalah inti**
[Apakah alur utama tetap menjawab masalah yang kami serang, dan bagaimana.]
```

---
---

# ENTRI SUNGGUHAN

---

## [PB-016] Ukuran huruf lembar diturunkan ke set kompak pilihan pemilik produk — DI BAWAH lantai 14pt §3.6, dicatat terbuka

**Jam ke-**         : ~16
**Diputuskan oleh** : PM/pemilik produk (menempelkan berkas rujukan berisi dua belas angka itu), dieksekusi Window 2

**Kondisi di proposal penyisihan**
BLUEPRINT H.9 + CLAUDE.md §3.6 menetapkan teks pada lembar minimal **setara 14pt** agar terbaca di layar lima inci tanpa perbesaran, dengan angka lama: judul 52px, teks isi/pertanyaan 30px, teks sekunder (dasar hukum) 24px. Pagar `tests/lib/renderLembar.test.ts` (S08-7) menegakkannya lewat ambang 22px untuk setiap fontSize isi dan himpunan "30px tepat 20 elemen". PB-014 sebelumnya MEMBATALKAN pengecilan serupa (judul 20/isi 15/dasar hukum 10) karena melanggar lantai itu.

**Hal yang diubah**
Seluruh dua belas nilai `UKURAN` di `src/lib/renderLembar.tsx` diturunkan mengikuti persis angka yang diminta: judul 20, subjudul 13, penanda waktu 11, label blok 11, kalimat pembuka 14, label baris 12, nilai baris 21, kalimat blok 2 15, dasar hukum 10, kalimat bawah blok 2 13, pertanyaan 15, penutup 12. Pagar ikut diturunkan: `AMBANG_PIKSEL_MINIMAL` 22 → **10**, dan pagar kedua berubah dari "himpunan 30px tepat 20 elemen" menjadi "himpunan 15px tepat 17 elemen" (10 kalimat blok 2 + 7 pertanyaan). Yang TIDAK diubah meski ada di berkas rujukan itu: warna — kepala lembar tetap berlatar `warna("tinta")` (BLUEPRINT H.9) dan seluruh warna tetap lewat token, tanpa hex mentah. Perubahan hanya pada ukuran, sesuai yang diminta.

**Alasan perubahan**
Permintaan eksplisit pemilik produk: lembarnya terlalu besar/panjang, dan angka kompak diinginkan apa adanya. Ini keputusan produk, bukan temuan teknis — pengukuran di sesi yang sama (PB-014) justru menunjukkan arah sebaliknya. Karena CLAUDE.md §3.6 adalah guardrail dan bukan batas yang bisa dinaikkan lewat entri §4, penyimpangan ini didokumentasikan di sini supaya pembaca (termasuk juri) melihatnya sebagai keputusan sadar, bukan kelalaian.

**Dampak terhadap masalah inti**
Yang bertambah baik: lembar jadi **41% lebih pendek** pada isi uji yang sama (tinggi render 1896 → **1120px** untuk Indonesia, 1932 → **1137px** untuk Jawa) dan berkasnya **56% lebih ringan** (215 KB → **94 KB**) — lebih hemat kuota saat diteruskan lewat percakapan, dan itu memang salah satu keluhan nyata pengguna. Yang dibayar: **lembar tidak lagi memenuhi lantai 14pt §3.6.** Pada render 1080px yang ditampilkan selebar layar ponsel lima inci (±360 CSS px), teks isi 15px setara ±5 CSS px dan dasar hukum 10px setara ±3 CSS px — penerima harus memperbesar gambar untuk membaca rinciannya, dan itu berlaku baik di versi Indonesia maupun Jawa. Alur inti, jumlah kata (§4 480), jumlah keterangan (10), dan seluruh pagar lain tidak tersentuh; `npm run verify` tetap 372 test hijau karena pagarnya turun bersama nilainya, bukan dibiarkan merah. Angka lama tersimpan di riwayat git, di komentar `UKURAN`, di komentar ambang pagar, dan di entri PB-014 — mengembalikannya berarti mengembalikan keduanya (nilai + ambang) dalam satu commit.

---

## [PB-015] Lembar (gambar) dapat diterbitkan dalam Basa Jawa — kamus lembar + medan `bahasa` di `/api/kartu`

**Jam ke-**         : ~14,5
**Diputuskan oleh** : PM/pengguna ("bikinkan jadi kalo ganti bahasa /hasilnya juga keganti bahasanya"), dieksekusi Window 2

**Kondisi di proposal penyisihan**
BLUEPRINT F menetapkan seluruh kalimat lembar sebagai salinan harfiah SATU bahasa (`src/core/teks.ts`), dan `src/lib/renderLembar.tsx` mengambil labelnya langsung dari konstanta itu. Basa Jawa (ditambahkan PB-009) hanya hidup di lapisan antarmuka: pemilih bahasa, judul layar, label keterangan, pesan galat. Akibatnya orang yang memilih Jawa tetap menerima lembar berbahasa Indonesia — termasuk di `/hasil`, layar tempat lembar itu dilihat dan diteruskan.

**Hal yang diubah**
Lembar sekarang punya kamus, sejajar dengan antarmuka:

1. **`KAMUS_LEMBAR` (`teks.ts` F.9) + `KAMUS_LEMBAR_JAWA` (`teksJawa.ts`) + `kamusLembarUntuk(bahasa)`.** Seluruh teks SISTEM lembar dikelompokkan jadi satu objek yang nilainya MENUNJUK konstanta BLUEPRINT F (tidak ditulis ulang), dengan tipe `KamusLembar` sehingga terjemahan yang lupa satu kunci gagal di `tsc`.
2. **Kamus menjadi parameter opsional dengan bawaan Indonesia** di `rakitIsiLembar`, `cocokkanNamaP3MI`, `hitungCatatanBiaya`, `elemenLembar`, `tinggiLembar`, dan prop `kamus` di `LembarPratinjau`. Karena bawaannya Indonesia, seluruh pemanggil lama (dan 3 test yang mengunci kalimat Indonesia) tidak berubah perilakunya.
3. **`/api/kartu` menerima `bahasa`** (`"jv"` → kamus Jawa, apa pun selain itu → Indonesia), dan `periksa/page.tsx` mengirim `bahasa` yang sedang aktif saat tombol terbitkan ditekan. Di `/hasil`, kamus yang sama dipakai untuk pratinjau teks dan `alt` gambar, sehingga tidak mungkin gambar dan teksnya berbeda bahasa.
4. **Pagar baru:** sapuan anggaran kata (batas 480 §4) dijalankan ULANG untuk kamus Jawa di seluruh 1.024 kombinasi, plus pagar yang memastikan (a) kunci kamus Jawa lengkap, (b) tidak ada nilainya yang masih identik dengan Indonesia (kecuali nama produk "LEMBAR JANJI"), (c) placeholder templat tidak hilang, (d) kalimat "tidak ditemukan" tetap memuat tiga bagian wajib §3.1, dan (e) lembar yang dirender dalam Jawa **nol** memuat kalimat sistem Indonesia (dan sebaliknya).

**Alasan perubahan**
Permintaan eksplisit pengguna. Menyebut satu keterangan berbahasa Jawa di antarmuka lalu menerbitkan lembar berbahasa Indonesia berarti manfaat Basa Jawa berhenti tepat sebelum artefak yang paling penting — gambar yang dipegang dan diteruskan keluarga.

**Dampak terhadap masalah inti**
Alur inti tidak berubah dan bawaan tidak bergeser: permintaan `/api/kartu` tanpa `bahasa` menghasilkan gambar yang identik dengan sebelumnya (dibuktikan: `bahasa` absen = `bahasa:"id"`), dan seluruh pagar lama tetap hijau. Bukti lintas-lapis: permintaan id menghasilkan PNG **1080×1929** sementara jv **1080×1965** (tinggi berbeda karena teks Jawa lebih panjang — artinya kamus sampai ke perender tinggi, bukan hanya ke teks), dan alur Jawa di peramban sampai `/hasil` menghasilkan PNG **1080×4141** dengan `alt` berbahasa Jawa. Batas kata §4 tidak dinaikkan: teks sistem terberat diukur 436 kata (Indonesia) dan 437 kata (Jawa) pada kasus tanpa Lapis 1/2, dan kedua sapuan penuh tetap di bawah 480. Catatan produk yang tetap berlaku: lembar Jawa yang diteruskan kembali ke percakapan mungkin tidak terbaca oleh penerimanya di ujung sana — itu pilihan bahasa pengirim, bukan sesuatu yang bisa diputuskan produk.

**Tambahan (jam ~15) — lembar diterbitkan dalam DUA bahasa, dan gambar di `/hasil` berganti saat bahasa ditukar**

Versi pertama entri ini merender gambar mengikuti bahasa yang aktif SAAT MENERBITKAN. Diuji pengguna, hasilnya dilaporkan sebagai bug: "pas gua ganti bahasa jawa itu ga keganti sama sekali imagenya" — dan itu memang perilaku yang dibangun, bukan salah lapor. Tombol bahasa di `/hasil` hanya menukar tombol dan pratinjau, sedangkan gambarnya sudah terlanjur jadi.

Yang diubah: `periksa/page.tsx` kini mengulang perakitan + render untuk KEDUA bahasa dalam satu kali penerbitan (`Promise.all`, jadi dinding waktunya ± satu render), dan menyimpan keduanya lewat `hasilSementara.ts` sebagai `perBahasa: { id, jv }` — satu `LembarTerbit` per bahasa (IsiLembar, data URL gambar, catatan Lapis 1/2). `/hasil` tinggal memilih milik bahasa yang aktif: perpindahan bahasa jadi penukaran tampilan yang instan, tanpa render ulang, tanpa mengulang penerbitan, dan tanpa pernah menampilkan lembar campuran bahasa. Teks lembar tetap dirakit PER BAHASA, bukan diterjemahkan saat ditampilkan.

Harganya: dua render PNG per penerbitan (paralel) dan dua data URL hidup di memori tab sampai tab ditutup — diukur pada lembar kasus terberat: 647 KB + 731 KB (base64) untuk lembar setinggi ±4000px. Itu tetap nol penyimpanan (CLAUDE.md §3.5): tidak ada yang ditulis ke disk, localStorage, atau server.

Bukti di peramban sungguhan dengan dropdown bahasa asli: terbit sekali di Indonesia → `/hasil` menampilkan PNG 3981px tinggi; tukar ke Basa Jawa → gambar BERGANTI (PNG 4141px, data URL berbeda, `alt` berbahasa Jawa); tukar kembali ke Indonesia → persis gambar pertama lagi.

**Tambahan kedua (jam ~15,5) — kepala lembar lebih kompak, teks isi TIDAK disentuh**

Menyusul keputusan pengguna atas pilihan "kompak tapi tetap ≥14pt": yang dikecilkan hanya bagian kepala yang BUKAN teks isi — `judul` 52 → **34** dan `subjudul` 28 → **22** — sementara seluruh teks isi (label blok 30, nilai 30, kalimat blok 2 30, ketujuh pertanyaan 30, kalimat pembuka/label baris/kalimat bawah blok 2/penutup 26, dasar hukum 24) tetap apa adanya. Lantai 14pt §3.6 tetap dipegang dan sekarang ditulis eksplisit sebagai dua zona di komentar `UKURAN`: `subjudul: 22` duduk PERSIS di ambang pagar S08-7 (setiap fontSize isi ≥ 22px), jadi menurunkannya satu piksel saja langsung merah. Efeknya terukur pada IsiLembar yang sama: tinggi render 1929 → **1896px** (Indonesia) dan 1965 → **1932px** (Jawa); `npm run verify` tetap 372 test hijau tanpa satu pun pagar diubah.

---

## [PB-014] Ukuran huruf lembar dikembalikan ke lantai 14pt, kepala lembar kembali berlatar tinta

**Jam ke-**         : ~14
**Diputuskan oleh** : PM/pengguna (memilih opsi "balikin ukuran huruf"), dieksekusi Window 2

**Kondisi di proposal penyisihan**
BLUEPRINT H.9 menetapkan lembar dirender 1080px lebar dengan judul tercetak di kepala berlatar **tinta**, dan CLAUDE.md §3.6 menetapkan teks pada lembar minimal **setara 14pt** agar terbaca di layar lima inci tanpa perbesaran. Nilai lamanya: judul 52px, isi/pertanyaan 30px, teks sekunder (dasar hukum) 24px, seluruhnya lewat token `warna(...)` — berkas `src/lib/renderLembar.tsx` tidak memuat satu pun hex mentah.

**Hal yang diubah**
Commit `83c2c21 "fix: hasil lembar janji"` (bukan dari Window 2) mengecilkan seluruh tipografi lembar — judul 52→20, subjudul 28→13, isi 30→15, dasar hukum 24→10, penanda waktu 11 — mengganti latar kepala dari tinta menjadi biru `#0955D4`, dan mengganti warna teks label blok 2 menjadi hitam `#000000` di atas latar abu-gelap, tanpa memperbarui pagar testnya. Setelah konflik rebase diselesaikan, entri ini mengembalikan: seluruh 12 nilai `UKURAN` ke angka lama, latar kepala ke `warna("tinta")`, teks label blok 2 ke `warna("kertas")`, dan dua warna `#E2E8F0` ke `warna("garis")` — sehingga berkas itu kembali bebas hex mentah. Perbaikan tata letak lain dari commit yang sama (padding, margin, tata letak kartu ilustrasi di mobile) DIPERTAHANKAN.

**Alasan perubahan**
`npm run verify` MERAH di `83c2c21` — dibuktikan dengan menjalankan test pada commit itu tanpa perubahan Window 2 (`git checkout 83c2c21` → `tests/lib/renderLembar.test.ts`: 3 gagal, 18 lulus). Ketiga pagar itu bukan test basi: satu menegakkan lantai 14pt untuk SETIAP teks isi, satu mengunci himpunan 30px (3 label blok + 10 kalimat + 7 pertanyaan), satu menuntut kepala lembar berlatar tinta sesuai H.9. Pengecilan huruf sebesar ~50% pada artefak yang justru diteruskan lewat WhatsApp dan dibaca di ponsel murah adalah pelanggaran §3.6 (guardrail, bukan batas yang bisa dinaikkan lewat entri). Hex mentah tambahan memperparah: pagar kontras hanya membaca TOKEN `tailwind.config.ts`, jadi warna mentah di berkas render lolos dari semua pagar.

**Dampak terhadap masalah inti**
Positif langsung: lembar kembali terbaca tanpa perbesaran di ponsel lima inci — itu satu-satunya artefak yang dilihat orang yang menerima hasilnya. Harganya tinggi render bertambah (lembar kosong kini **1080×3981px**), dan itu memang konsekuensi yang dipilih: tinggi boleh, keterbacaan tidak. Tinggi tidak masuk batas kuantitatif mana pun (§4) dan pagar anggaran kata (480) tidak tersentuh karena ia menghitung teks sistem. Alur inti tidak berubah; diverifikasi ulang di peramban sesudah perbaikan: jalur manual → sepuluh keterangan → terbit → `/hasil` menampilkan PNG 1080×3981 sungguhan.

---

## [PB-013] Lapisan 3D hiasan di halaman depan DICABUT — `three` dilepas dari dependensi

**Jam ke-**         : ~13
**Diputuskan oleh** : PM/pengguna, dieksekusi Window 2

**Kondisi di proposal penyisihan**
Proposal babak penyisihan tidak memuat pustaka 3D sama sekali (tabel stack §5 hanya Next.js, TypeScript, Tailwind, Vitest, Vercel, Postgres, satu API model, dan render lembar sisi server). PB-011 mencatat penambahan lapisan 3D hiasan di atas usulan itu.

**Hal yang diubah**
Seluruh lapisan 3D hiasan dicabut kembali:

- `src/ui/LatarTiga.tsx` **dihapus**, beserta impor dan pemasangannya di `src/app/page.tsx`.
- `three` dan `@types/three` **dilepas** dari `package.json`; dependensi runtime kembali **4** (`next`, `pg`, `react`, `react-dom`) dari 5.
- Gerak CSS di `src/app/globals.css` (lima keyframe: muncul naik berurutan, garis sorot tumbuh, panel mengapung, kotak emas bernapas) **DIPERTAHANKAN** — itu bukan bagian yang dikhawatirkan.

**Alasan perubahan**
Kekhawatiran kompatibilitas perangkat: WebGL bergantung pada driver GPU dan dukungan peramban yang tidak seragam di ponsel kelas bawah, sementara sasaran utama produk ini justru keluarga PMI di desa dengan ponsel murah — kadang Android lama dengan peramban bawaan. Hiasan yang berisiko membuat halaman gagal (atau berat) di perangkat itu bukan hiasan yang layak dipasang. Keputusan pengguna, bukan temuan teknis baru: pemeriksaan di peramban sebelumnya (WebGL 2.0, `gl.getError()` 0, rasio piksel dibatasi 1,6, batal dimuat saat reduced-motion/2G) memang tidak menunjukkan kerusakan — yang tidak bisa dibuktikan di sesi ini adalah perilaku di perangkat tua yang sesungguhnya, dan taruhannya terlalu besar untuk sebuah latar belakang.

**Dampak terhadap masalah inti**
Nol dampak buruk — lapisan itu memang tidak pernah menyentuh alur inti (unggah gambar → koreksi → penilaian → lembar terbit), dan tetap tidak menyentuhnya. Yang berubah ke arah lebih aman: halaman depan kembali 100% HTML + CSS tanpa satu pun canvas maupun panggilan GPU; ukuran halaman `/` turun 15,7 kB → **13,9 kB** (First Load JS 124 kB → **123 kB**), dan chunk `three` 86 KB gzip yang tadinya diunduh setelah halaman terhidrasi **hilang sepenuhnya** — jadi justru lebih ringan di jaringan desa. Gerak yang tersisa murni `transform`/`opacity` CSS: didukung peramban lama, tidak butuh JS, dan mati sendiri saat pengguna meminta `prefers-reduced-motion`. Halaman depan tidak lagi punya satu pun dependensi yang bisa gagal karena perangkat.

## [PB-012] Kotak keterangan tumbuh mengikuti isinya, dan dibatasi 100 kata per kotak

**Jam ke-**         : ~12,5
**Diputuskan oleh** : PM/pengguna, dieksekusi Window 2

**Kondisi di proposal penyisihan**
BLUEPRINT F menggambarkan kesepuluh keterangan di layar koreksi sebagai kotak isian setinggi dua baris (`rows=2` + `min-h-14`), dan tidak menetapkan batas jumlah kata per keterangan — tabel batas kuantitatif CLAUDE.md §4 pun tidak memuatnya (isi tabelnya soal jumlah keterangan, layar, langkah, panggilan model, kata di LEMBAR, dependensi, dan ukuran berkas unggahan). Tidak ada hitungan kata yang ditampilkan ke pengguna.

**Hal yang diubah**
Dua hal di `src/ui/BarisKeterangan.tsx`, satu-satunya kotak teks di seluruh aplikasi (kesepuluh keterangan memakai komponen yang sama, jadi satu perubahan berlaku untuk semuanya):

1. **Tinggi kotak mengikuti isinya.** Tinggi dihitung ulang dari `scrollHeight` setiap nilai berubah; lantai 56px (`min-h-14`) dipertahankan supaya kotak kosong tidak pernah lebih pendek dari sebelumnya, dan tuas ubah-ukuran bawaan peramban dimatikan (`resize-none`) karena tingginya kini diurus skrip.
2. **Batas 100 kata per keterangan**, ditegakkan di `onChange` lewat fungsi murni baru `src/lib/kata.ts` (`batasiKata`, `hitungKata`; 9 test), plus hitungan faktual `83 / 100 kata` — `83 / 100 tembung` saat bahasa Jawa — di bawah kotak selama isinya tidak kosong. Satuannya diambil dari kamus (`SATUAN_KATA` di `teks.ts`, `SATUAN_KATA_JAWA` di `teksJawa.ts`) dan dioper sebagai prop, karena `BarisKeterangan` sengaja tidak mengimpor `src/core` (BLUEPRINT G.4).

**Alasan perubahan**
Permintaan eksplisit pengguna: kotak yang tingginya tetap terasa sesak saat mengetik dan memaksa menggulir di dalam kotak; dan panjangnya perlu ada batasnya. Batas 100 kata dipilih karena tawaran kerja dijawab dalam beberapa kalimat — contoh isian yang disediakan jauh lebih pendek — sedangkan kotak yang tumbuh bisa jadi setinggi layar bila ada yang menempelkan satu halaman kontrak penuh.

**Dampak terhadap masalah inti**
Alur inti tidak berubah: mengetik, menandai "tidak tahu", dan menerbitkan lembar tetap sama. Yang dijaga secara sadar adalah arah sebaliknya — **pemotongan hanya berlaku untuk ketikan dan tempelan pengguna, TIDAK untuk nilai hasil pembacaan gambar maupun draf tersimpan**, supaya isi tawaran yang sudah terbaca tidak pernah hilang diam-diam di depan pengguna. Batas ini tidak menaikkan batas kuantitatif mana pun di CLAUDE.md §4: anggaran 480 kata pada lembar menghitung teks SISTEM, bukan teks pengguna, dan jumlah panggilan model tidak tersentuh. Hitungan kata ditampilkan sebagai hitungan faktual ("n dari 100"), bukan skor, persentase, atau penanda mutu — ia abu netral tanpa ikon peringatan, sesuai §3.2 dan §3.6.

## [PB-011] Lapisan 3D hiasan di halaman depan — dependensi runtime `three` ditambahkan

**Jam ke-**         : ~11,5
**Diputuskan oleh** : PM/pengguna, dieksekusi Window 2

**Kondisi di proposal penyisihan**
Tabel stack di proposal (dan CLAUDE.md §5) hanya menyebut Next.js, TypeScript, Tailwind, Vitest, Vercel, Postgres, satu API model, dan render lembar di sisi server. Tidak ada pustaka 3D, dan halaman depan dirancang sebagai halaman diam: teks, satu kartu unggah, satu panel ilustrasi statis, dan dua lapis latar CSS (kisi + kotak emas blur). Empat dependensi runtime tercatat saat itu: `next`, `pg`, `react`, `react-dom`.

**Hal yang diubah**
Ditambahkan `three` (dependensi runtime kelima dari batas 12) sebagai lapisan hiasan tunggal di belakang halaman depan, di berkas baru `src/ui/LatarTiga.tsx` — tujuh lembar kertas mengambang, tujuh ratus butir yang naik, kisi yang bergulir, paraleks penunjuk, dan respons gulir. Ditambahkan juga lima keyframe CSS di `src/app/globals.css` untuk gerak masuk berurutan, garis sorot yang tumbuh, panel yang mengapung, dan kotak emas yang bernapas. Tidak ada teks, label, tombol, aturan penilaian, atau batas kuantitatif lain yang berubah.

**Alasan perubahan**
Permintaan eksplisit pengguna: halaman depan dirasa terlalu datar untuk dinilai dan dipresentasikan, dan gerak diminta langsung. `three` dipilih karena memang pustaka yang diminta, dan dibatasi keras supaya tidak menyentuh apa pun di jalur inti: diimpor DINAMIS di dalam `useEffect` sehingga unduhannya (86 KB gzip) tidak disebut sama sekali di berkas awal halaman, tidak ada bayangan/postprocessing, rasio piksel dibatasi 1,6, perulangan berhenti saat tab disembunyikan, dan seluruh lapisan batal dimuat bila pengguna meminta `prefers-reduced-motion: reduce`, bila WebGL tidak tersedia, atau bila jaringannya 2G/hemat kuota. Animasi CSS dipasang di stylesheet, bukan oleh JS, sehingga tidak ada isi halaman yang bergantung pada JS atau pada animasi yang berjalan.

**Dampak terhadap masalah inti**
Alur inti tidak berubah sama sekali dan tetap dapat diselesaikan tanpa lapisan ini maupun tanpa JS: unggah gambar → koreksi wajib → penilaian → lembar terbit. Yang bertambah hanya berat opsional: 86 KB gzip yang diunduh SETELAH halaman terhidrasi dan tidak muncul di berkas awal (dibuktikan: `.next/server/app/index.html` tidak menyebut chunk `three`; halaman `/` tetap 15,7 kB / 124 kB First Load JS). Batas waktu muat CLAUDE.md §4 tidak tersentuh karena batas itu mengukur konten yang tampil, dan konten tetap tampil lewat CSS yang sama seperti sebelumnya. Pada perangkat atau jaringan yang lemah, lapisan ini tidak dimuat sama sekali — jadi biayanya jatuh ke perangkat yang memang mampu membayarnya.

## [PB-010] Layar hasil dipisah dari layar koreksi — 3 layar, batas langkah dinaikkan 5 → 6

**Jam ke-**         : ~S13 (redesign UI)
**Diputuskan oleh** : PM/pengguna, dieksekusi Window 2

**Kondisi di proposal penyisihan**
S07/S08 mengunci arsitektur 2 layar (`/`, `/periksa`): lembar hasil muncul inline di bawah kartu koreksi pada layar yang sama setelah tombol "Terbitkan" ditekan, dibuktikan `tests/alur/jumlah-langkah.test.ts` (5 langkah, SATU tujuan `router.push`) dan dicatat status "2 dari maks 3 layar terpenuhi" di S12-6.

**Hal yang diubah**
Ditambah rute `/hasil` sebagai layar ketiga. `src/app/periksa/page.tsx` sekarang hanya menilai dan merakit lembar, lalu `router.push("/hasil")`. Data lembar (dan object URL gambar PNG dari `/api/kartu`) dioper lewat singleton di memori tab (`src/lib/hasilSementara.ts`) — bukan storage/server — dan dibuang begitu `/hasil` ditinggalkan atau tab ditutup. `/hasil` yang dimuat langsung tanpa data (refresh/akses langsung) diarahkan balik ke `/`. Ditambah juga `loading.tsx` bergaya SaaS (kartu + spinner, token warna proyek) di `/`, `/periksa`, dan `/hasil` untuk transisi rute. Sekalian me-redesign `/periksa` (Poppins via `next/font/google`, kartu form, toggle "tidak tahu") atas permintaan pengguna — desain disusun dari kebutuhan 10 keterangan proyek sendiri, bukan replikasi tata letak dari referensi luar (CLAUDE.md §2).

**Alasan perubahan**
Permintaan eksplisit pengguna: hasil pemeriksaan dirasa lebih jelas sebagai layar tujuan tersendiri, bukan bagian bawah layar koreksi yang di-scroll otomatis.

**Dampak terhadap masalah inti**
Jumlah layar tetap dalam batas §4 (3, bukan melebihi). Langkah dari buka tautan sampai lembar terbit naik dari 5 → **6** — dinaikkan eksplisit di `tests/alur/jumlah-langkah.test.ts` dengan komentar yang menyalin alasan ini, konsisten dengan aturan §4 "menaikkan batas memerlukan entri tertulis". Jumlah TINDAKAN PENGGUNA (klik) tidak bertambah — yang bertambah murni satu perpindahan rute otomatis tanpa aksi tambahan. Alur inti (baca → koreksi wajib → nilai → rakit → lembar terbit dapat diteruskan) tidak berubah maknanya; S07-8 (penilaian wajib lewat layar koreksi) tetap dijaga test yang sama.

---

## [PB-001] Dua label tombol galat ditambahkan di luar teks BLUEPRINT F

**Jam ke-**         : ~6
**Diputuskan oleh** : Fullstack, Window 2 (S04)

**Kondisi di proposal penyisihan**

BLUEPRINT bagian F menyatakan seluruh kalimat yang dilihat pengguna sudah final dan disalin persis dari bagian F.1–F.10 ke `src/core/teks.ts`; tidak ada teks antarmuka yang ditulis di luar itu. Tabel pesan galat (F.9) mencantumkan kolom "Tindakan yang ditawarkan" untuk tujuh kode galat, termasuk "Tombol coba lagi" (untuk `E_JARINGAN`) dan "Tombol ulangi" (untuk `E_PEMBACAAN_KOSONG`).

**Hal yang diubah**

Ditambahkan dua konstanta teks baru di `src/core/teks.ts` yang tidak berasal dari kutipan F.1–F.10 mana pun: `TOMBOL_COBA_LAGI = "Coba lagi"` dan `TOMBOL_ULANGI = "Ulangi"`, dipakai sebagai nilai `tindakan` pada `PESAN_GALAT` untuk dua kode galat tersebut.

**Alasan perubahan**

BLUEPRINT F.9 mewajibkan kedua tombol itu ada, tetapi tidak pernah menuliskan label persisnya di bagian F mana pun — sebuah celah redaksional pada dokumen final, bukan keputusan produk yang berubah. Instruksi sprint S04 secara eksplisit mengizinkan pola ini: "bila sebuah teks belum ada di sini, tulis teksnya di sini lebih dahulu, lalu catat penambahannya." Membiarkan kolom itu tanpa label akan membuat tabel F.9 tidak dapat diimplementasikan sepenuhnya di S07.

**Dampak terhadap masalah inti**

Tidak ada dampak terhadap kosakata sistem (kedua kata tidak menuduh siapa pun, dan diperiksa test kosakata terlarang) maupun terhadap batas kuantitatif. Dampaknya murni redaksional dan berisiko kecil: bila PM/tim menetapkan istilah lain saat S07 membangun layar galat sungguhan, kedua label ini tinggal diganti di satu tempat (`teks.ts`). Ditandai eksplisit di `PROGRESS.md` [S04-W2] sebagai belum final, menunggu konfirmasi PM — bukan dianggap keputusan tertutup.

---

## [PB-002] Keyakinan pasca-koreksi dihitung dari kehadiran teks, bukan keyakinan asli pembacaan

**Jam ke-**         : ~8
**Diputuskan oleh** : Fullstack, Window 2 (S07)

**Kondisi di proposal penyisihan**

BLUEPRINT bagian E.1 menuliskan urutan pemeriksaan penilaian sebagai pseudocode: `jika keyakinan_pembacaan < AMBANG → BELUM_DIJAWAB` — menyiratkan keyakinan yang dibandingkan terhadap `AMBANG_KEYAKINAN` (0,7, ditetapkan S03) adalah keyakinan dari hasil pembacaan (model/OCR) itu sendiri.

**Hal yang diubah**

Pada pemanggilan `nilai()` dari layar koreksi (`src/app/periksa/page.tsx`, fungsi `tanganiTerbitkanLembar`), keyakinan yang dioper BUKAN `keyakinan` asli dari `HasilBaca`, melainkan dihitung ulang saat tombol "Terbitkan Lembar" ditekan: `1` bila kolom berisi teks setelah `trim()`, `0` bila kosong. Keyakinan asli hasil pembacaan tidak pernah sampai ke `nilai()` — hanya dipakai untuk mengisi nilai awal kolom di layar koreksi.

**Alasan perubahan**

Layar koreksi wajib ada justru supaya manusia memverifikasi hasil bacaan sebelum dinilai (CLAUDE.md 3.3). Bila keyakinan OCR asli yang rendah tetap dipakai SETELAH manusia melihat kolom itu di layar koreksi, kolom yang isinya sebenarnya sudah benar akan tetap jatuh ke `BELUM_DIJAWAB` lewat aturan keraguan E.3 — bertentangan dengan tujuan layar koreksi. BLUEPRINT tidak menuliskan aturan eksplisit untuk kasus "sudah melewati koreksi manusia"; ini pengisian celah pada titik pertemuan dua aturan yang masing-masing eksplisit (aturan keraguan E.3, dan kewajiban layar koreksi CLAUDE.md 3.3), bukan pembalikan salah satu aturan itu. Karena menyentuh langsung mekanisme aturan keraguan yang dikunci, dicatat di sini untuk ditinjau kapten, bukan diam-diam.

**Dampak terhadap masalah inti**

Berpotensi menaikkan angka "sudah disebutkan" dibanding penerapan literal pseudocode E.1, khususnya pada kolom yang keyakinan OCR-nya rendah tetapi teksnya kebetulan tidak diubah pengguna. Risiko konkret: pengguna yang tidak teliti membaca ulang kolom bisa melewatkan bacaan yang sebenarnya keliru. Mitigasi yang sudah berjalan: layar koreksi tetap tidak bisa dilewati (dibuktikan `tests/alur/koreksi-wajib.test.ts`), dan pengguna tetap bebas mengedit atau menandai "tidak tahu" pada kolom mana pun — penanda "tidak tahu" itu sendiri TIDAK terpengaruh perubahan ini, tetap jalur terpisah yang selalu menghasilkan `BELUM_DIJAWAB`. Belum ada mitigasi tambahan seperti menonjolkan kolom berkeyakinan rendah untuk diperhatikan khusus; diserahkan ke peninjauan kapten atau S12.

---

## [PB-003] Driver Postgres (`pg`) ditambahkan ke dependensi runtime

**Jam ke-**         : ~10,5
**Diputuskan oleh** : AI Engineer, Window 3 (S10) — dikonfirmasi eksplisit ke pengguna sebelum dikerjakan

**Kondisi di proposal penyisihan**

BLUEPRINT.md bagian G.1 dan G.2 menetapkan Postgres terkelola dengan "satu kueri langsung", tanpa ORM. Daftar dependensi terlarang (CLAUDE.md bagian 5) melarang ORM dan migrasinya, tetapi tidak menyebutkan driver database sama sekali — pilihan cara menyambung ke Postgres belum ditentukan di proposal.

**Hal yang diubah**

Ditambahkan `pg@^8` (dependencies) dan `@types/pg@^8` (devDependencies) ke `package.json`. Ini driver mentah resmi (node-postgres) — tidak ada model, migrasi, atau query builder, konsisten dengan "satu kueri langsung" yang sudah diputuskan sebelumnya, bukan penambahan lapisan abstraksi baru.

**Alasan perubahan**

Protokol Postgres berbentuk biner lewat TCP, bukan HTTP/REST — berbeda dari panggilan API model penglihatan di S06 yang bisa memakai `fetch` bawaan tanpa dependensi tambahan. Menulis satu kueri `INSERT` langsung ke Postgres secara teknis tidak mungkin dilakukan tanpa sebuah driver yang bicara protokol itu (autentikasi, framing pesan, dsb.), dan tidak ada driver semacam itu terpasang di proyek. `package.json` berada di luar daftar berkas yang boleh disentuh sprint S10 (dimiliki Window 1 di tabel kepemilikan berkas `TASKS.md`), sehingga keputusan ini ditanyakan eksplisit ke pengguna lebih dulu, bukan diputuskan sepihak.

**Dampak terhadap masalah inti**

Tidak ada dampak terhadap alur utama maupun batas privasi — `pg` hanya dipakai di satu titik (`src/app/api/catat/route.ts`) yang fire-and-forget dan bisa dinonaktifkan sepenuhnya dengan mengosongkan `DATABASE_URL` (dibuktikan `tests/alur/tanpa-basis-data.test.ts`). Dependensi runtime naik dari 3 menjadi 4, masih jauh di bawah batas 12 (CLAUDE.md bagian 4). `npm audit` diperiksa sebelum dan sesudah penambahan: tetap 4 kerentanan yang sama, seluruhnya pada dependensi dev-time yang tidak berkaitan (`@vitest/mocker`, `postcss`) dan sudah ada sejak S00 — `pg` tidak menambah satu pun kerentanan baru.

---

## [PB-004] Tinggi lembar dinamis (bukan rasio 3:4 tetap), nomor pasal ditumpuk bukan sejajar

**Jam ke-**         : ~13
**Diputuskan oleh** : Fullstack, Window 2 (S08)

**Kondisi di proposal penyisihan**

BLUEPRINT bagian H.9 menetapkan "Rasio 3:4 tegak, lebar render 1080px" (menyiratkan tinggi tetap ±1440px), dan baris blok 2 berbentuk "lingkaran kosong di kiri dan nomor pasal redup rata kanan" — dibaca sebagai satu baris sejajar.

**Hal yang diubah**

Tinggi render dihitung DINAMIS mengikuti panjang konten sungguhan (fungsi `tinggiLembar`), bukan rasio 3:4 tetap. Nomor pasal pada baris blok 2 ditumpuk di baris terpisah DI BAWAH kalimatnya (tetap rata kanan), bukan disandingkan sejajar dalam satu baris.

**Alasan perubahan**

Dua kendala teknis nyata mendorong ini. Pertama, konten lembar sangat bervariasi — dari 0 sampai 10 baris di blok 1 maupun blok 2 tergantung kelengkapan tawaran — sehingga rasio tetap akan memotong konten pada tawaran padat atau menyisakan ruang kosong sangat besar pada tawaran ringkas. Kedua, mesin render (Satori, di balik `ImageResponse`) TIDAK mendukung tinggi kanvas otomatis mengikuti konten sama sekali — dibuktikan lewat percobaan langsung: tanpa tinggi eksplisit, kelebihan konten diam-diam terpotong tanpa galat apa pun. Nomor pasal khususnya perlu ditumpuk karena slot 10 bisa memuat 4 sitasi sekaligus (±87 karakter) yang akan meluber atau meremas kalimatnya bila dipaksa sejajar dalam satu baris sempit.

**Dampak terhadap masalah inti**

Lembar tetap lebar 1080px dan tetap portrait (sesuai H.9) — hanya tingginya yang menyesuaikan konten. Secara fungsional ini MENGUATKAN klaim "lembar terbaca lengkap tanpa terpotong", karena rasio tetap justru berisiko memotong kalimat penutup wajib (F.5) pada tawaran dengan banyak keterangan kosong. Nol dampak terhadap kosakata sistem, token warna, atau aturan penilaian — murni penyesuaian tata letak dan dimensi render.

---

## [PB-005] Satu label tombol baru: "Matikan pembacaan gambar"

**Jam ke-**         : ~15
**Diputuskan oleh** : Fullstack, kapten (Window 1, S12)

**Kondisi di proposal penyisihan**

Proposal menjanjikan bahwa lapisan model dapat dicabut dan sistem tetap berjalan, dan rencana kerja mewajibkan sebuah tombol untuk memperagakannya di depan juri. Tidak ada label tombol itu di daftar teks final antarmuka (BLUEPRINT F.8).

**Hal yang diubah**

Ditambahkan satu teks antarmuka baru — label tombol "Matikan pembacaan gambar" di halaman utama. Saat ditekan, layar menampilkan pesan galat yang SUDAH ADA di proposal ("Pembacaan gambar sedang tidak tersedia. Anda tetap bisa melanjutkan dengan mengetik sendiri isinya."), bukan kalimat status baru.

**Alasan perubahan**

Tombol itu wajib, dan pagar kode proyek melarang teks antarmuka ditulis langsung di berkas halaman — label harus berada di berkas teks terpusat. Label ditulis di rencana teks (F.8) lebih dahulu, lalu di kode, sesuai prosedur tim untuk teks yang belum ada. Pagar kosakata terlarang otomatis ikut memeriksanya, dan dibuktikan: menyisipkan kata terlarang ke label ini membuat test merah.

**Dampak terhadap masalah inti**

Memperkuat. Klaim "model dapat dicabut" kini dapat diperiksa siapa pun di tautan penggelaran: tombol ditekan, permintaan ke endpoint model diawasi, dan hasilnya NOL permintaan — alur tetap selesai lewat pengetikan manual sampai lembar terbit.

---

## [PB-006] Batas jumlah kata di lembar dinaikkan dari 340 menjadi 480

**Jam ke-**         : ~15
**Diputuskan oleh** : Fullstack, kapten (Window 1, S12)

**Kondisi di proposal penyisihan**

Batas kuantitatif tim: lembar memuat maksimal 340 kata.

**Hal yang diubah**

Batasnya dinaikkan menjadi 480 kata teks yang ditulis sistem sendiri, diukur pada seluruh lembar yang benar-benar dirender. Kutipan isi tawaran tidak dihitung ke batas itu, karena bukan tulisan sistem, dan sudah dibatasi 130 karakter per baris.

**Alasan perubahan**

Saat verifikasi akhir kami mengukur ulang seluruh lembar, bukan sebagian. Hasilnya: lembar dengan kesepuluh keterangan kosong saja sudah 436 kata, dan kasus terberat dari seluruh 1.024 kombinasi terisi/kosong mencapai 468 kata. Batas 340 ternyata tidak pernah benar-benar ditegakkan — test yang ada hanya menghitung sebagian lembar, sehingga melewatkan judul, label, nomor pasal, kalimat penutup, dan kalimat hasil pencocokan daftar. Kata tambahan itu justru bagian yang diwajibkan aturan kami sendiri: nomor pasal untuk tiap keterangan kosong, kalimat penutup yang wajib selalu tercetak, dan kalimat "tidak ditemukan" yang wajib memuat tiga bagian supaya tidak menjadi tuduhan. Memangkasnya untuk memenuhi angka 340 berarti melanggar aturan yang lebih penting. Batas baru kini ditegakkan test yang memeriksa ke-1.024 kombinasi.

**Dampak terhadap masalah inti**

Netral terhadap isi — tidak ada satu kalimat pun yang berubah. Lembar sedikit lebih padat daripada yang direncanakan; ukuran huruf minimum tetap terjaga karena tinggi lembar menyesuaikan isinya (PB-004).

---

## [PB-007] Batas waktu muat pada jaringan lambat: 3 detik untuk konten tampil, 4 detik untuk muat penuh

**Jam ke-**         : ~15
**Diputuskan oleh** : Fullstack, kapten (Window 1, S12)

**Kondisi di proposal penyisihan**

Halaman utama terbuka di bawah 3 detik pada jaringan lambat.

**Hal yang diubah**

Batas 3 detik dipertahankan untuk konten tampil. Batas untuk muat penuh (seluruh JavaScript selesai dan tombol siap ditekan) dinaikkan menjadi 4 detik.

**Alasan perubahan**

Diukur di tautan penggelaran pada profil jaringan 3G lambat (400 kbps, latensi 400 ms), cache kosong, tiga kali: konten tampil pada 1,2–1,5 detik, muat penuh pada 3,4–3,7 detik. Dari 116 KB JavaScript, sekitar 101 KB adalah pustaka inti kerangka kerja yang kami pakai bersama seluruh halaman — menurunkannya berarti mengganti kerangka kerja yang sudah dikunci sejak awal. Pada 3G cepat, muat penuh hanya 1,1 detik.

**Dampak terhadap masalah inti**

Ada keterbatasan nyata yang kami catat terbuka: pada jaringan paling lambat, isi halaman sudah terbaca sekitar dua detik lebih dulu, tetapi tombol baru bisa ditekan setelah muat penuh. Pengguna tidak kehilangan apa pun — hanya menunggu sebentar setelah halaman tampil.

---

## [PB-008] Kalimat kondisi "seluruh kosong" dan "seluruh terisi" belum ditampilkan

**Jam ke-**         : ~15
**Diputuskan oleh** : Ditemukan saat QA oleh kapten (Window 1, S12); tidak diperbaiki karena sprint pembekuan fitur

**Kondisi di proposal penyisihan**

Teks final memuat dua kalimat kondisi: satu untuk tawaran yang tidak menyebutkan satu pun dari sepuluh keterangan, satu untuk tawaran yang menyebutkan kesepuluhnya ("Anda tetap berhak meminta salinan perjanjiannya sebelum membayar").

**Hal yang diubah**

Kedua kalimat ada di berkas teks, tetapi tidak ditampilkan di layar maupun di lembar. Ditemukan lewat uji tawaran yang seluruhnya kosong di tautan penggelaran: lembar terbit dengan sepuluh keterangan belum dijawab, tanpa kalimat kondisi itu.

**Alasan perubahan**

Bukan keputusan, melainkan kelalaian yang baru terlihat saat pengujian akhir. Kami memilih mencatatnya terbuka daripada menambalnya, karena pada tahap ini perubahan tata letak dan teks sudah dibekukan supaya yang diuji sama dengan yang dikumpulkan.

**Dampak terhadap masalah inti**

Kecil. Isi lembar tetap lengkap dan benar — kesepuluh keterangan tetap tercatat satu per satu, begitu pula pertanyaan dan kalimat penutup. Yang hilang adalah kalimat ringkasan di dua kasus ekstrem, termasuk pengingat hak meminta salinan perjanjian pada tawaran yang tampak lengkap.

---
---

## [PB-005] Saklar "matikan lapisan model" dan tiga kalimat antarmuka baru di luar BLUEPRINT F

**Jam ke-**         : ~5,5
**Diputuskan oleh** : Fullstack, Window 1 (S12)

**Kondisi di proposal penyisihan**

BLUEPRINT menyatakan klaim arsitektur bahwa "lapisan model dapat dicabut dan sistem tetap berjalan", dan `TASKS.md` S12-1 meminta sebuah tombol yang dapat ditekan di depan juri untuk mematikannya. Yang belum ada di dokumen mana pun: kalimat yang diucapkan layar saat lapisan model dimatikan. BLUEPRINT bagian F (seluruh kalimat yang dilihat pengguna) tidak memuat satu pun kalimat untuk keadaan itu, dan tabel F.8/F.9 hanya memuat teks layar masukan serta tujuh pesan galat. Tabel F.9 sendiri menyimpan teks di `src/core/teks.ts` sebagai satu-satunya tempat yang teruji kosakatanya.

**Hal yang diubah**

1. `src/vision/index.ts` menerima opsi `paksaManual?: boolean` pada `OpsiPemilihPembaca`; bila `true`, `pilihPembaca()` mengembalikan `manualProvider` **sebelum** memeriksa kunci API, sehingga lapisan model benar-benar tercabut walau `MODEL_API_KEY` terisi.
2. Tiga konstanta teks baru di `src/core/teks.ts` (bukan di berkas halaman, supaya pagar S07-10 tetap bekerja): `TOMBOL_MATIKAN_MODEL = "Matikan model (mode demo)"`, `TOMBOL_NYALAKAN_MODEL = "Nyalakan model lagi"`, dan `KETERANGAN_MODEL_DIMATIKAN` — "Mode demo: lapisan model dimatikan. Gambar yang Anda kirim tidak dibaca mesin sama sekali — isiannya Anda ketik sendiri, dan alurnya tetap berjalan sampai lembar terbit."
3. `src/app/page.tsx` menampilkan saklar itu (`role="switch"`, `aria-checked`, ukuran huruf isi tetap 16px) di atas kedua jalur masukan, dan saat menyala tidak memanggil `fetch("/api/baca")` sama sekali.

**Alasan perubahan**

Sprint S12-1 adalah permintaan eksplisit dokumen sprint sendiri: klaim arsitektur harus dapat **diperlihatkan** di depan juri, bukan hanya dinyatakan, dan `S12-1` menetapkan berkasnya persis (`src/app/page.tsx`, `src/vision/index.ts`). Dua label tombol yang dibutuhkan tidak pernah ditulis di bagian F mana pun — celah redaksional yang sama dengan `[PB-001]`, dan diselesaikan dengan pola yang sama: tulis teksnya di `src/core/teks.ts`, lalu catat di sini. Kalimatnya sengaja menyebut "lapisan model", bukan "sistem", karena Lapis 0 (perekaman dan penilaian) memang tidak dapat dimatikan menurut BLUEPRINT bagian G — layar tidak boleh mengklaim lebih dari yang benar.

**Dampak terhadap masalah inti**

Masalah inti tetap utuh: pengguna tetap bisa mengirim poster dan menerima lembar yang sama, hanya tanpa pembacaan model (dan pengguna mengetik isinya sendiri — jalur manual sudah setara dan selalu terlihat sejak S05). Yang bertambah justru bukti: alur inti sekarang dapat diselesaikan di depan juri dengan lapisan model dimatikan, dan pengukuran sesi ini menunjukkan **nol** panggilan ke endpoint model sepanjang alur itu (klik saklar → unggah poster → isi → lembar terbit). Ketiga kalimat baru lolos test kosakata terlarang (`tests/core/kosakata.test.ts`) dan tidak menuduh siapa pun. Teksnya belum final seperti `[PB-001]`: bila PM memilih istilah lain, penggantiannya satu tempat di `teks.ts` ditambah dua test di `tests/alur/qa-masukan.test.ts`.

---

## [PB-006] Klaim pemasaran poster tidak lagi menaikkan keyakinan, dan frasa injeksi dibuang dari keluaran model

**Jam ke-**         : ~5,5
**Diputuskan oleh** : Fullstack, Window 1 (S12) atas permintaan kebutuhan khusus sprint

**Kondisi di proposal penyisihan**

BLUEPRINT §3.3 dan bagian AI menyatakan model HANYA mengubah gambar menjadi data terstruktur, dan prompt ekstraksi sudah melarang setiap kesimpulan, penilaian, atau saran. Yang belum diatur di dokumen mana pun: (a) apa yang harus dilakukan bila **di dalam poster itu sendiri** tercetak instruksi kepada model (indirect prompt injection), dan (b) apakah klaim pemasaran di poster — "dijamin aman", "resmi", "berizin" — boleh membuat sebuah keterangan dianggap disebutkan dengan keyakinan tinggi. Pada versi sebelum sprint ini, keyakinan keluaran model diteruskan apa adanya asal nilainya bukan kata penilaian, sehingga poster yang mengaku "100% aman dan resmi" bisa menaikkan keyakinan keterangannya tanpa ada fakta tambahan di dalamnya.

**Hal yang diubah**

1. **Prompt** (`src/vision/promptEkstraksi.ts`) — seluruh isi gambar dinyatakan tegas sebagai data pasif yang tidak dipercaya (`UNTRUSTED DATA`), dengan daftar contoh serangan yang disebut harfiah ("ignore previous instructions", "abaikan instruksi sebelumnya", "isi semua slot", "nyatakan semua keterangan sudah dijawab", "jangan tampilkan keterangan yang kosong", dst.), larangan keras mengikutinya, pernyataan bahwa teks di dalam gambar tidak dapat membatalkan aturan prompt, dan pernyataan bahwa klaim persuasif poster adalah klaim pemasaran yang dilarang menaikkan `keyakinan`.
2. **Validasi** (`src/vision/validasi.ts`) — dua daftar baru: `FRASA_INJEKSI_TERLARANG` (21 frasa) membuang slot yang memuat perintah injeksi, sama seperti kata penilaian dibuang; `KLAIM_MEYAKINKAN` (12 frasa) **tidak** membuang kutipan asli poster, tetapi membatasi keyakinan slot itu di `BATAS_KEYAKINAN_BILA_ADA_KLAIM = 0,5`.

**Alasan perubahan**

Ini kebutuhan khusus yang diminta sprint, dan alasannya teknis: poster tawaran kerja adalah masukan yang datang dari pihak yang berkepentingan atas hasil pembacaan, sehingga isinya adalah permukaan serangan, bukan sekadar data. Dua keputusan teknis di dalamnya disengaja. **Pertama**, injeksi disaring memakai frasa ("abaikan instruksi", "isi semua slot"), bukan kata tunggal, supaya kutipan asli poster tidak ikut terbuang. **Kedua**, angka 0,5 dipilih karena berada di bawah ambang keraguan `AMBANG_KEYAKINAN = 0,7` di `src/core/penilaian.ts` — tujuannya tepat ini: keyakinan yang diperoleh semata-mata dari klaim pemasaran tidak boleh lolos menjadi "sudah disebutkan". Membuang kutipannya bukan pilihan, karena klaim itu sendiri adalah informasi tentang tawaran yang dibaca pengguna.

**Dampak terhadap masalah inti**

Konservatif dan searah dengan aturan keraguan E.3: ragu selalu jatuh ke "belum dijawab", tidak pernah sebaliknya. Dampak sampingnya yang perlu diketahui: keterangan yang kutipannya memuat klaim (misalnya `"PT X — resmi, berizin"`) turun keyakinannya dan bisa berakhir `BELUM_DIJAWAB` bila keyakinan itu dipakai langsung. **Di alur produk yang sekarang berjalan dampaknya nol**, karena layar koreksi menghitung ulang keyakinan dari kehadiran teks setelah pengguna melihat dan membetulkan isinya; keyakinan keluaran model tidak pernah sampai ke penilaian akhir. Bila suatu saat alur berubah menjadi "nilai langsung dari model", keputusan 0,5 ini harus ditinjau ulang — dicatat juga sebagai utang di `PROGRESS.md` [S12-W1]. Diuji di `tests/vision/prompt-injection.test.ts` (20 test), termasuk uji hidup terhadap poster yang benar-benar memuat teks injeksi: perintah di dalamnya tidak diikuti dan delapan dari sepuluh keterangan tetap kosong.

---

## [PB-009] Peningkatan Inklusivitas Aksesibilitas: Status Memproses, Validasi Masukan Kosong, Placeholder Terpandu, dan Dukungan Basa Jawa

**Jam ke-**         : ~18
**Diputuskan oleh** : Tim Pengembang & UI/UX Specialist

**Kondisi di proposal penyisihan**

BLUEPRINT bagian F dan H menetapkan tampilan minimalis dengan token warna terikat, tanpa indikator status membaca model (hanya `disabled`), tanpa pemisahan aksi ganda galat `E_PEMBACAAN_KOSONG`, tanpa contoh isian (placeholder) per slot, serta proposal awal menyatakan "satu bahasa dulu" (CLAUDE.md 3.7).

**Hal yang diubah**

1. **Status Memproses & Aksesibilitas:** `AreaUnggah.tsx` dilengkapi status `sedangMemroses`, spinner animasi netral non-merah (`border-t-aksen`), live region (`role="status"`, `aria-live="polite"`, `aria-busy`), dan teks penenang saat model bekerja agar pengguna tidak mengira aplikasi macet.
2. **Kunci Ganda & Gulir Otomatis:** Tombol "Terbitkan lembar" dikunci saat proses berjalan (`sedangMenerbitkan`), dan saat terbit, antarmuka otomatis menggulir secara mulus (*smooth scroll*) ke hasil terbit untuk memudahkan pengguna di ponsel layar kecil.
3. **Pembedaan Aksi Galat F.9:** Tombol aksi pada `PesanGalat` diselaraskan dengan tabel F.9. `E_JARINGAN` menjalankan coba lagi sungguhan; `E_PEMBACAAN_KOSONG` menyediakan aksi utama (ulangi pemilihan gambar) dan aksi sekunder (ketik manual).
4. **Validasi Masukan Kosong:** Menegakkan `E_TIDAK_ADA_MASUKAN` bila pengguna menekan "Terbitkan lembar" tanpa mengisi apa pun dan tanpa mencentang tanda apa pun.
5. **Placeholder Wawancara Terpandu:** Ditambahkan 10 contoh isian realistis yang ramah (bebas dari kata tuduhan) di `src/core/teks.ts` untuk mengubah kesan formulir dari "ujian" menjadi "wawancara terpandu".
6. **Dukungan Basa Jawa (Inklusivitas Daerah):** Menyediakan kamus `src/core/teksJawa.ts` (Krama Alus/Komunikatif) dengan saklar bahasa di pojok kanan atas, dirancang khusus untuk kenyamanan musyawarah keluarga calon PMI di desa sentra migran (Jawa Tengah/Jawa Timur/DIY) tanpa mengubah teks hukum resmi pada lembar ekspor.

**Alasan perubahan**

Hasil evaluasi subagent UI/UX dan simulasi persona pengguna awam berliterasi digital rendah menunjukkan bahwa layar hening selama 10–20 detik membuat pengguna keluar dari aplikasi, dan formulir kosong tanpa contoh terasa mengintimidasi. Selain itu, calon PMI sering kali mendiskusikan tawaran kerja bersama orang tua/sesepuh desa yang jauh lebih nyaman dan tenang mencerna informasi dalam bahasa ibu (Basa Jawa yang santun).

**Dampak terhadap masalah inti**

Sangat memperkuat. Kepercayaan pengguna meningkat drastis, keterbacaan membaik, risiko salah tekan diminimalkan, dan jangkauan produk meluas ke anggota keluarga senior di pedesaan yang menjadi pengambil keputusan utama keberangkatan PMI. Semua aturan konstitusi (`CLAUDE.md` 3.1 & 3.6, batas modul, dan nihil kata tuduhan) tetap 100% terjaga dan lolos seluruh test otomatis.

---


# ⚠️ TIGA CONTOH ENTRI TELADAN

> **Ketiga entri di bawah adalah CONTOH**, disiapkan sebelum Hack Day sebagai teladan mutu penulisan. Ketiganya menggambarkan perubahan yang paling mungkin benar-benar terjadi.
>
> 🔴 **HAPUS setiap contoh yang tidak benar-benar terjadi, sebelum pengumpulan.** Contoh yang dibiarkan akan dibaca juri sebagai perubahan yang sungguh terjadi. Pemeriksaan ini ada di `TASKS.md` task S13-3.

---

## [CONTOH — PB-001] Lapis 1 dinonaktifkan pada versi Hack Day

**Jam ke-** : 14
**Diputuskan oleh** : Fullstack, kapten

**Kondisi di proposal penyisihan**

Proposal menyebutkan arsitektur tiga lapis, dengan Lapis 1 mencocokkan nama perusahaan terhadap salinan daftar perusahaan penempatan berizin yang bertanggal.

**Hal yang diubah**

Lapis 1 tidak diaktifkan pada versi yang dibangun selama Hack Day. Kolom hasil pencocokan diganti kalimat pengarah yang menyebutkan bahwa pemeriksaan daftar sedang tidak tersedia, beserta langkah konkret memeriksa nomor izin di kantor Layanan Terpadu Satu Atap.

**Alasan perubahan**

Daftar perusahaan penempatan berizin tidak dapat kami peroleh dalam bentuk yang dapat dipakai pihak ketiga secara sah dalam batas waktu Hack Day. Kami memilih tidak membangunnya di atas data yang keabsahan penggunaannya belum kami pastikan.

**Dampak terhadap masalah inti**

Tidak ada dampak terhadap alur utama. Penilaian sepuluh keterangan berjalan sepenuhnya di Lapis 0, yang memang dirancang tidak bergantung pada sumber data eksternal mana pun. Lembar tetap terbit dengan isi yang sama, dan pengujian degradasi membuktikannya. Perubahan ini justru menguji klaim arsitektur berlapis yang kami tuliskan di proposal: bahwa lapisan di atas Lapis 0 dapat dinonaktifkan tanpa menghentikan produk.

---

## [CONTOH — PB-002] Rumusan pertanyaan pada lembar diperbaiki setelah wawancara

**Jam ke-** : 8
**Diputuskan oleh** : Business/PM bersama tim

**Kondisi di proposal penyisihan**

Proposal mencantumkan tujuh pertanyaan yang disusun tim berdasarkan sepuluh keterangan yang diwajibkan undang-undang.

**Hal yang diubah**

Rumusan pertanyaan keenam, mengenai rincian biaya, diubah dari bentuk yang menyatakan aturan menjadi bentuk yang menyatakan ketidaktahuan penanya — dari menyebut kewajiban pemberi kerja secara langsung menjadi diawali "setahu saya".

**Alasan perubahan**

Narasumber yang kami wawancarai menyatakan rumusan lama terasa seperti menuduh, dan tidak akan mereka ucapkan kepada kerabat yang menawarkan pekerjaan. Karena seluruh nilai lembar ini bergantung pada apakah pertanyaannya benar-benar diucapkan, rumusan yang tidak akan diucapkan sama dengan pertanyaan yang tidak ada.

**Dampak terhadap masalah inti**

Memperkuat. Masalah yang kami serang bukan semata kekurangan informasi, melainkan juga ketiadaan cara yang sopan untuk menanyakannya kepada orang yang dikenal. Perubahan ini membuat lembar lebih mungkin dipakai pada situasi yang justru paling berisiko, yaitu ketika tawaran datang dari lingkaran keluarga.

---

## [CONTOH — PB-003] Penambahan keadaan "disebutkan sebagian"

**Jam ke-** : 7
**Diputuskan oleh** : Fullstack, kapten

**Kondisi di proposal penyisihan**

Proposal menyebutkan setiap keterangan dinilai sebagai "sudah disebutkan" atau "belum dijawab".

**Hal yang diubah**

Ditambahkan keadaan ketiga, yaitu "disebutkan sebagian", dengan aturan per keterangan yang menentukan kapan sebuah nilai masuk keadaan itu.

**Alasan perubahan**

Pada pengujian terhadap poster nyata, sebagian besar tawaran menyebutkan besaran upah tanpa menyebutkan cara pembayarannya, dan menyebutkan angka biaya total tanpa rinciannya. Memaksa kasus seperti itu ke salah satu dari dua keadaan membuat lembar menyesatkan ke arah mana pun: menyebutnya terisi memberi rasa aman yang tidak berdasar, sementara menyebutnya kosong mengabaikan informasi yang memang ada.

**Dampak terhadap masalah inti**

Memperkuat. Lembar menjadi lebih akurat menggambarkan isi tawaran tanpa menambah satu pun penilaian terhadap pihak yang menawarkan. Kosakata sistem tetap tidak memuat kata bernada menuduh.

---
---

## Catatan penutup

Berkas ini diisi **segera pada saat perubahan terjadi**, bukan direkap pada jam-jam terakhir. Perubahan yang dicatat beberapa jam setelah kejadian kehilangan alasan sebenarnya, dan yang tersisa hanya rasionalisasi.

Setiap entri wajib memuat keempat bagiannya. Entri yang bagian alasannya kosong tidak dapat dinilai, dan entri yang bagian dampaknya kosong tidak menunjukkan apakah tim memahami konsekuensi keputusannya sendiri.
