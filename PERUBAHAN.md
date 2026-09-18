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
