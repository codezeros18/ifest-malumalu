# PERUBAHAN.md

Berkas ini mencatat semua hal yang berubah dari rencana awal (proposal babak penyisihan) ke apa yang benar-benar dibangun selama 24 jam Hack Day. Bukan permintaan maaf — catatan kerja jujur. Setiap perubahan pasti punya alasan; kami menuliskannya supaya siapa pun yang membaca bisa menilai sendiri apakah keputusan itu tepat.

Tiap entri menjawab empat hal: apa rencana awalnya, apa yang diubah, kenapa diubah, dan apa dampaknya ke tujuan utama produk.

---

# Daftar Perubahan

---

## [PB-023] Poster tidak bisa "menipu" model lewat kata-kata di dalamnya

**Jam ke-23 dari 24** · Diputuskan tim inti

**Sebelumnya**: Model AI cuma dilarang menilai atau menyimpulkan apa pun. Tapi belum ada aturan soal poster yang isinya sengaja ditulis untuk mengelabui model (misal ada tulisan tersembunyi "abaikan instruksi sebelumnya"), atau poster yang penuh kata pemasaran seperti "dijamin resmi dan aman" yang bisa membuat model jadi terlalu yakin tanpa fakta apa pun.

**Sekarang**: Kami tambahkan dua pengaman. Pertama, model diberi tahu tegas bahwa apa pun tulisan di dalam gambar adalah data mentah yang tidak bisa dipercaya — bukan perintah. Kalau ada kalimat yang mencoba memerintah model, itu dibuang. Kedua, kalau ada klaim pemasaran ("resmi", "aman", "terpercaya") di poster, keyakinan model terhadap keterangan itu otomatis diturunkan — supaya kata-kata meyakinkan tidak dianggap sama dengan fakta.

**Kenapa**: Poster tawaran kerja datang dari pihak yang punya kepentingan atas hasil pembacaannya. Jadi harus diperlakukan sebagai sesuatu yang bisa disalahgunakan, bukan cuma data biasa.

**Dampaknya**: Tidak mengubah alur utama. Arahnya aman — kalau ragu, sistem tetap memilih "belum dijawab", bukan mengarang jadi "sudah disebutkan". Sudah diuji dengan poster yang sengaja disisipi perintah tersembunyi, dan hasilnya perintah itu diabaikan sepenuhnya.

---

## [PB-022] Tombol demo "matikan AI" untuk membuktikan klaim ke juri

**Jam ke-23 dari 24** · Diputuskan tim inti

**Sebelumnya**: Kami mengklaim sistem tetap jalan meski lapisan AI dimatikan, tapi tidak ada cara memperlihatkannya langsung ke juri.

**Sekarang**: Ditambah satu saklar di halaman utama: "Matikan model (mode demo)". Kalau dinyalakan, aplikasi sama sekali tidak memanggil AI — pengguna mengetik sendiri semua isian, dan proses tetap selesai sampai lembar terbit.

**Kenapa**: Klaim itu harus bisa dibuktikan langsung di depan juri, bukan cuma ditulis di proposal.

**Dampaknya**: Memperkuat kepercayaan pada klaim arsitektur kami. Diukur langsung: nol panggilan ke API model selama saklar itu aktif.

---

## [PB-021] Data yang diketik pengguna sekarang benar-benar dihapus setelah selesai

**Jam ke-16 dari 24** · Ditemukan & diperbaiki tim inti

**Sebelumnya**: Kami janji "nol data pribadi disimpan". Tapi saat pengguna mengetik manual (misal nama perusahaan), data itu disimpan sementara di penyimpanan browser (localStorage) supaya tidak hilang kalau internet putus. Masalahnya: fungsi untuk MENGHAPUS data itu sudah ada dari awal, tapi ternyata tidak pernah benar-benar dipanggil — jadi data itu tertinggal selamanya di HP, apalagi kalau HP-nya dipakai bersama keluarga.

**Sekarang**: Fungsi hapus itu sekarang benar-benar dijalankan, tepat setelah lembar hasil terbit.

**Kenapa**: Ada dua aturan yang sebenarnya saling tarik — "jangan hilangkan ketikan pengguna kalau koneksi putus" vs "jangan simpan data pribadi". Solusinya: simpan sementara SELAMA proses berjalan (supaya tidak hilang), tapi hapus tuntas begitu prosesnya selesai.

**Dampaknya**: Klaim privasi kami sekarang benar-benar akurat, bukan cuma niat baik yang belum terlaksana.

---

## [PB-020] Tombol tambahan "Simpan PDF"

**Jam ke-21 dari 24** · Diminta pemilik produk

**Sebelumnya**: Lembar hasil cuma bisa diunduh sebagai gambar.

**Sekarang**: Ditambah satu tombol lagi: "Simpan PDF" — bukan pengganti, cuma pilihan tambahan di sebelah tombol gambar. PDF-nya dibuat langsung di HP/browser pengguna sendiri, tidak lewat server.

**Kenapa**: Supaya lebih fleksibel dipakai — ada yang lebih nyaman simpan PDF daripada gambar.

**Dampaknya**: Format gambar tetap yang utama dan wajib (karena itu yang bisa diteruskan lewat chat WhatsApp). PDF murni bonus. Kami sempat menemukan bug di tengah jalan: kalau gambar ditempel langsung ke PDF, ukuran filenya membengkak sampai 25MB — sudah diperbaiki dengan mengompres gambarnya dulu, sekarang jadi sekitar 0,6MB.

---

## [PB-019] Gambar lembar diperjelas 2x lipat supaya tidak buram di HP

**Jam ke-21 dari 24** · Ditemukan tim inti

**Sebelumnya**: Lembar dirender lebar 1080 piksel — sesuai rencana awal.

**Sekarang**: Ukuran piksel keluarannya digandakan jadi 2160 — tapi tata letaknya sama persis, cuma resolusinya lebih tajam.

**Kenapa**: HP kelas menengah-atas sekarang punya layar rapat-piksel (retina-style). Gambar 1080px jadi terlihat buram kalau ditampilkan di layar seperti itu, seperti foto lama yang di-zoom.

**Dampaknya**: Lembarnya jadi lebih jelas dibaca dan lebih enak dilihat saat dibagikan lewat chat. Ukuran file jadi sedikit lebih besar, tapi masih jauh di bawah batas yang wajar untuk dikirim lewat aplikasi chat.

---

## [PB-018] Kepala lembar dibuat warna biru (sesuai identitas visual produk)

**Jam ke-15 dari 24** · Diminta pemilik produk

**Sebelumnya**: Bagian atas (kepala) lembar berwarna gelap netral, sesuai rencana awal.

**Sekarang**: Warnanya diganti biru, mengikuti warna khas produk yang sudah dipakai di halaman utama dan navigasi.

**Kenapa**: Permintaan langsung pemilik produk supaya tampilan lembar konsisten dengan identitas visual keseluruhan aplikasi.

**Dampaknya**: Tidak ada — lembar tetap mudah dibaca (sudah diuji kontras warnanya memenuhi standar aksesibilitas), cuma soal selera warna.

---

## [PB-017] Perbaikan cara mengganti warna kepala lembar (versi sebelumnya salah caranya)

**Jam ke-14 dari 24** · Ditemukan & diperbaiki tim inti

**Sebelumnya**: Ada percobaan mengganti warna kepala lembar jadi biru, tapi caranya salah — mengubah satu "kode warna" yang ternyata dipakai juga untuk warna teks isi lembar. Akibatnya seluruh teks lembar ikut jadi biru, termasuk yang seharusnya tetap gelap agar mudah dibaca.

**Sekarang**: Percobaan yang salah itu dibatalkan dulu, baru diganti dengan cara yang benar (lihat PB-018) — bikin kode warna baru khusus untuk kepala lembar, tidak mengganggu warna lain.

**Kenapa**: Test otomatis kami langsung mendeteksi ini salah (warna nge-bug), jadi langsung dibatalkan sebelum keliru diteruskan.

**Dampaknya**: Nol dampak ke alur utama. Ini murni proses perbaikan cepat yang justru membuktikan sistem pengujian kami bekerja.

---

## [PB-016] Ukuran huruf lembar diperkecil sesuai selera pemilik produk (dengan catatan)

**Jam ke-16 dari 24** · Diminta pemilik produk

**Sebelumnya**: Aturan kami sendiri mewajibkan huruf di lembar minimal setara 14pt supaya terbaca jelas tanpa harus di-zoom di HP kecil.

**Sekarang**: Atas permintaan eksplisit pemilik produk (lembar dirasa terlalu panjang/besar), ukuran hurufnya diperkecil — di bawah standar 14pt yang kami tetapkan sendiri.

**Kenapa**: Keputusan produk, bukan temuan teknis. Justru pengukuran sebelumnya (PB-014) menunjukkan sebaliknya lebih baik. Kami tetap menjalankan keinginan pemilik produk, tapi mencatatnya terbuka di sini supaya tidak terlihat seperti kelalaian.

**Dampaknya**: Lembarnya jadi 41% lebih pendek dan 56% lebih ringan filenya — hemat kuota saat dibagikan. Tapi konsekuensinya: sebagian teks jadi perlu di-zoom untuk dibaca jelas di layar kecil. Ini trade-off sadar, bukan bug.

---

## [PB-015] Lembar bisa terbit dalam Basa Jawa juga, bukan cuma antarmukanya

**Jam ke-14 dari 24** · Diminta pengguna

**Sebelumnya**: Kalau pengguna memilih Basa Jawa, cuma tampilan aplikasinya yang berubah bahasa. Gambar lembar hasil akhirnya tetap berbahasa Indonesia.

**Sekarang**: Lembar hasil (gambar yang diunduh/dibagikan) sekarang ikut terbit dalam Basa Jawa kalau itu bahasa yang dipilih. Bahkan setelah kami uji ke pengguna, ternyata orang ingin gambar-nya langsung ganti bahasa begitu tombolnya ditekan di layar hasil (bukan cuma pas awal generate) — jadi kami buat sistem menyiapkan KEDUA versi bahasa sekaligus saat lembar pertama kali terbit, supaya tombol ganti bahasa terasa instan.

**Kenapa**: Kalau cuma tampilannya berbahasa daerah tapi hasil akhirnya (yang justru dibawa dan dibaca keluarga) tetap bahasa Indonesia, manfaat dukungan bahasa daerahnya jadi setengah-setengah.

**Dampaknya**: Memperkuat tujuan produk — lebih ramah untuk keluarga di desa yang lebih nyaman berbahasa Jawa. Sedikit lebih berat karena harus menyiapkan dua gambar sekaligus, tapi tidak ada data yang tersimpan di server (tetap sesuai aturan privasi kami).

---

## [PB-014] Ukuran huruf & warna kepala lembar dikembalikan (ada perubahan liar dari commit lain)

**Jam ke-14 dari 24** · Ditemukan & diperbaiki tim inti

**Sebelumnya**: Standar kami: huruf minimal setara 14pt, kepala lembar warna gelap netral.

**Sekarang**: Ada satu perubahan dari anggota tim lain yang tanpa sengaja mengecilkan semua huruf sampai separuh ukuran dan mengganti warna tanpa memperbarui aturan pengujian. Ini dikembalikan ke standar semula.

**Kenapa**: Uji otomatis kami mendeteksi pelanggaran nyata — hurufnya jadi terlalu kecil untuk dibaca di HP murah tanpa di-zoom, yang justru jadi target utama pengguna kami.

**Dampaknya**: Lembarnya kembali mudah dibaca tanpa zoom. Ukurannya jadi sedikit lebih tinggi, tapi itu harga yang wajar demi keterbacaan.

---

## [PB-013] Animasi 3D di halaman depan dicabut lagi

**Jam ke-13 dari 24** · Diminta pemilik produk

**Sebelumnya**: Ada animasi 3D hiasan di latar belakang halaman utama (lihat PB-011).

**Sekarang**: Dicabut lagi.

**Kenapa**: Khawatir animasi 3D berat/berisiko error di HP murah — padahal pengguna sasaran utama kami justru keluarga di desa dengan HP yang tidak selalu baru.

**Dampaknya**: Halaman utama jadi lebih ringan dan aman di semua jenis perangkat. Animasi sederhana (bukan 3D) tetap dipertahankan.

---

## [PB-012] Kotak isian tumbuh mengikuti tulisan, dibatasi 100 kata

**Jam ke-12 dari 24** · Diminta pengguna

**Sebelumnya**: Kotak isian di layar koreksi tingginya tetap (2 baris), tidak ada batas panjang tulisan.

**Sekarang**: Kotaknya sekarang tumbuh otomatis mengikuti panjang tulisan pengguna, dan dibatasi maksimal 100 kata per kotak.

**Kenapa**: Kotak yang tingginya tetap terasa sempit saat mengetik. Batas 100 kata mencegah orang menempel satu halaman kontrak penuh ke satu kotak kecil.

**Dampaknya**: Batas ini HANYA berlaku untuk ketikan manual pengguna — hasil bacaan otomatis dari gambar tidak pernah dipotong. Ditampilkan sebagai angka netral ("83 dari 100 kata"), bukan skor atau penilaian mutu.

---

## [PB-011] Sempat menambah animasi 3D di halaman depan

**Jam ke-11 dari 24** · Diminta pemilik produk

**Sebelumnya**: Halaman depan diam saja, tanpa animasi.

**Sekarang**: Ditambah animasi 3D hiasan (lembar kertas melayang, partikel, dll).

**Kenapa**: Permintaan pemilik produk supaya halaman depan lebih menarik dilihat/dipresentasikan.

**Dampaknya**: Tidak menyentuh alur inti (tetap bisa dipakai tanpa animasi ini). Animasinya dibuat aman — otomatis mati kalau perangkat lambat, koneksi lemah, atau pengguna minta kurangi animasi. *(Catatan: fitur ini kemudian dicabut lagi di PB-013 karena tetap dianggap berisiko di HP murah.)*

---

## [PB-010] Halaman hasil dipisah jadi layar tersendiri

**Jam ke-13 dari 24** · Diminta pengguna

**Sebelumnya**: Setelah menekan "Terbitkan", hasilnya muncul langsung di bawah halaman koreksi yang sama.

**Sekarang**: Hasilnya sekarang muncul di halaman terpisah (`/hasil`), jadi total ada 3 halaman: halaman utama, halaman koreksi, halaman hasil.

**Kenapa**: Permintaan pengguna — hasil terasa lebih jelas kalau jadi halaman tujuan sendiri, bukan bagian bawah halaman lain.

**Dampaknya**: Masih dalam batas maksimal 3 halaman yang kami tetapkan sendiri. Jumlah langkah yang perlu dilakukan pengguna bertambah dari 5 jadi 6 (murni satu perpindahan halaman otomatis, bukan klik tambahan) — dicatat dan disesuaikan batasnya secara terbuka.

---

## [PB-009] Peningkatan aksesibilitas: status proses, placeholder, dan dukungan Basa Jawa

**Jam ke-18 dari 24** · Tim pengembang & UI/UX

**Sebelumnya**: Tidak ada indikator jelas saat sistem sedang memproses gambar, tidak ada contoh isian di kotak-kotak koreksi, dan cuma satu bahasa (Indonesia).

**Sekarang**: Ditambah indikator "sedang memproses" yang jelas, contoh isian ramah di tiap kotak (supaya terasa seperti wawancara, bukan ujian), dan dukungan penuh Basa Jawa halus di seluruh antarmuka.

**Kenapa**: Pengguna awam bisa mengira aplikasi macet kalau tidak ada tanda proses berjalan. Kotak kosong tanpa contoh terasa menakutkan bagi yang kurang terbiasa pakai formulir digital. Basa Jawa penting karena banyak calon pekerja migran mendiskusikan tawaran kerja bersama orang tua di desa yang lebih nyaman berbahasa daerah.

**Dampaknya**: Sangat memperkuat — aplikasi jadi lebih ramah untuk pengguna awam dan menjangkau lebih banyak keluarga di pedesaan.

---

## [PB-008] Dua kalimat penting sempat tidak muncul di lembar (ditemukan, dicatat apa adanya)

**Jam ke-15 dari 24** · Ditemukan tim inti

**Sebelumnya**: Rencananya ada kalimat khusus untuk dua kasus ekstrem: tawaran yang sama sekali tidak menyebutkan apa pun, dan tawaran yang menyebutkan semuanya.

**Sekarang**: Ditemukan saat pengujian akhir bahwa kedua kalimat itu sebenarnya tidak pernah tampil di layar maupun di lembar, meski teksnya sudah ada di kode.

**Kenapa**: Ini murni kelalaian yang ketahuan telat, bukan keputusan. Kami pilih mencatatnya terbuka daripada buru-buru menambal di jam-jam terakhir, karena tampilan sudah "dibekukan" supaya yang diuji = yang dikumpulkan.

**Dampaknya**: Kecil — isi lembar tetap lengkap dan benar untuk kesepuluh keterangannya. Yang hilang cuma satu kalimat ringkasan tambahan di dua kasus ekstrem itu.

---

## [PB-007] Batas waktu muat halaman disesuaikan dengan kenyataan di lapangan

**Jam ke-15 dari 24** · Tim inti

**Sebelumnya**: Target kami: halaman utama terbuka di bawah 3 detik di jaringan lambat.

**Sekarang**: Target 3 detik untuk konten pertama tampil tetap dipertahankan. Ditambah target baru: 4 detik untuk semuanya (termasuk tombol) siap dipakai penuh.

**Kenapa**: Setelah diukur langsung di jaringan 3G lambat, konten tampil dalam 1,5 detik (lebih cepat dari target), tapi baru benar-benar siap penuh di 3,5 detik-an. Selisih ini berasal dari besarnya pustaka dasar framework yang kami pakai di semua halaman.

**Dampaknya**: Pengguna tidak kehilangan apa pun — mereka cuma menunggu sedikit lebih lama sebelum bisa menekan tombol, setelah kontennya sendiri sudah kelihatan.

---

## [PB-006] Batas jumlah kata di lembar dinaikkan dari 340 ke 480

**Jam ke-15 dari 24** · Tim inti

**Sebelumnya**: Batas kami: lembar maksimal 340 kata.

**Sekarang**: Dinaikkan jadi 480 kata.

**Kenapa**: Saat kami ukur ulang dengan teliti, ternyata lembar yang kosong sekalipun sudah mencapai 436 kata — pengukuran sebelumnya tidak lengkap (cuma menghitung sebagian isi lembar). Kata-kata "tambahan" itu justru bagian wajib: nomor pasal undang-undang, kalimat penutup, dan kalimat penjelasan lengkap untuk kasus perusahaan "tidak ditemukan" (yang wajib 3 bagian supaya tidak terkesan menuduh). Memotongnya demi angka 340 berarti melanggar aturan kami sendiri yang lebih penting.

**Dampaknya**: Tidak ada kalimat yang berubah isinya — cuma pengukurannya yang diperbaiki jadi akurat.

---

## [PB-005] Tombol demo pertama: "Matikan pembacaan gambar"

**Jam ke-15 dari 24** · Tim inti

**Sebelumnya**: Kami janji sistem tetap jalan tanpa AI, tapi belum ada tombol untuk memperlihatkannya.

**Sekarang**: Ditambah satu tombol demo pertama di halaman utama (versi awal, sebelum disempurnakan lagi di PB-022).

**Kenapa**: Klaim arsitektur harus bisa dibuktikan, bukan cuma ditulis.

**Dampaknya**: Klaim "AI bisa dicabut" sekarang bisa dicoba langsung siapa saja di tautan yang sudah hidup.

---

## [PB-004] Tinggi lembar mengikuti isinya, bukan ukuran tetap

**Jam ke-13 dari 24** · Tim inti

**Sebelumnya**: Rencana awal: lembar berbentuk persegi panjang dengan ukuran tetap (rasio 3:4).

**Sekarang**: Tinggi lembar menyesuaikan panjang isinya — tawaran yang lengkap infonya menghasilkan lembar lebih tinggi, yang kosong menghasilkan lembar lebih pendek.

**Kenapa**: Isi tawaran sangat bervariasi. Kalau ukurannya dipaksa tetap, tawaran yang infonya banyak bisa terpotong, sementara yang infonya sedikit menyisakan banyak ruang kosong. Alat render gambar yang kami pakai juga memang tidak mendukung tinggi otomatis — harus dihitung manual.

**Dampaknya**: Memperkuat — lembar dijamin tidak pernah terpotong isinya, apa pun kondisinya.

---

## [PB-003] Menambah driver database `pg`

**Jam ke-10 dari 24** · Tim inti, dikonfirmasi ke pemilik produk

**Sebelumnya**: Rencana kami: pakai Postgres langsung tanpa ORM (lapisan tambahan), tapi belum jelas alat apa yang dipakai untuk benar-benar tersambung ke database-nya.

**Sekarang**: Ditambah `pg`, yaitu driver resmi paling dasar untuk terhubung ke Postgres — bukan ORM, tidak ada lapisan tambahan apa pun.

**Kenapa**: Secara teknis, terhubung ke Postgres itu perlu driver khusus (beda dengan API biasa yang cukup pakai fungsi bawaan). Tanpa ini, mustahil menjalankan satu query pun ke database.

**Dampaknya**: Tidak berpengaruh ke alur utama — pencatatan metrik ini bisa dimatikan total tanpa mengganggu apa pun. Sudah dicek juga tidak menambah risiko keamanan baru.

---

## [PB-002] Nilai keyakinan dihitung ulang setelah pengguna mengoreksi

**Jam ke-8 dari 24** · Tim inti

**Sebelumnya**: Rencana awal: keyakinan AI terhadap hasil bacaannya dipakai langsung untuk menentukan status "sudah dijawab" atau "belum".

**Sekarang**: Setelah pengguna melihat dan mengoreksi hasil bacaan, keyakinannya dihitung ulang berdasarkan apakah kotaknya terisi teks atau tidak — bukan lagi keyakinan asli dari AI.

**Kenapa**: Layar koreksi memang sengaja ada supaya manusia memeriksa ulang hasil bacaan mesin. Kalau keyakinan asli AI (yang mungkin rendah) tetap dipakai SETELAH manusia mengonfirmasi kotak itu benar, hasil yang sebenarnya sudah benar bisa salah dianggap "belum dijawab" — itu bertentangan dengan tujuan layar koreksi itu sendiri.

**Dampaknya**: Kotak yang sudah dikonfirmasi manusia lebih mudah dianggap "sudah disebutkan". Pengguna tetap bebas menandai "tidak tahu" kapan saja kalau memang belum yakin — jalur itu tidak terpengaruh.

---

## [PB-001] Dua label tombol yang belum ditulis di rencana awal

**Jam ke-6 dari 24** · Tim inti

**Sebelumnya**: Rencana kami menyebutkan harus ada tombol "coba lagi" dan tombol "ulangi" untuk dua jenis kegagalan tertentu, tapi label persis tombolnya belum pernah dituliskan di mana pun.

**Sekarang**: Ditulis label sederhana: "Coba lagi" dan "Ulangi".

**Kenapa**: Ini celah kecil di dokumen rencana, bukan perubahan keputusan — tombolnya memang wajib ada, cuma labelnya belum ditulis.

**Dampaknya**: Tidak ada dampak berarti — murni soal kata-kata di tombol, dan sudah dicek tidak mengandung kata yang terkesan menuduh.

---

## Catatan penutup

Berkas ini ditulis segera setiap kali ada perubahan terjadi — bukan direkap belakangan di jam-jam terakhir, karena alasan sebenarnya gampang hilang kalau ditulis telat.
