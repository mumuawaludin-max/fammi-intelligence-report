# Audit Data dan Keamanan FIR, Juli 2026

Audit menyeluruh atas jalur data FIR: dari upload Excel di CMS Admin, penyimpanan di Supabase, perumusan tindak lanjut lewat Gemini, sampai tampilan per peran. Fokusnya menjawab tiga keluhan: data tidak selalu valid, data kadang tidak muncul, dan angka di layar tidak cocok dengan angka yang disebut tindak lanjut. Bagian akhir memuat audit keamanan.

Audit dilakukan dari kode di repo. Database live tidak bisa diperiksa dari sesi ini, jadi semua yang bergantung pada isi policy RLS ditandai sebagai butuh verifikasi.

---

## Bagian 1. Kenapa data bisa TIDAK MUNCUL

### 1.1 Batas 1000 baris Supabase, penyebab paling mungkin dari data yang hilang diam-diam (KRITIS)

Supabase (PostgREST) diam-diam memotong hasil query pada 1000 baris kecuali diminta lebih. Tidak ada error, tidak ada tanda; baris ke-1001 dan seterusnya hilang begitu saja.

FIR mengambil tabel detail untuk SEMUA periode sekaligus, tanpa `range()` dan tanpa paginasi:

- `useKarakterData.js:59` mengambil `karakter_skor` semua periode. 150 murid x 6 aspek = 900 baris per bulan; bulan kedua sudah lewat 1000.
- `useKarakterData.js:64` mengambil `karakter_skor_indikator`, jumlahnya 2x lipat skor aspek (12 indikator per murid), lewat 1000 dalam satu bulan saja untuk sekolah menengah-besar.
- `useKarakterData.js:189` dan `:299`, Kepsek dan Yayasan mengambil `karakter_pernyataan_ortu` seluruh sekolah, semua periode. Yayasan malah lintas banyak sekolah.

Akibat nyata: murid hilang dari daftar skor, rata-rata indikator Yayasan dihitung dari potongan data (salah), grafik tren putus, dan jumlah suara orang tua tidak cocok dengan kenyataan. Karena barisnya terpotong dari belakang sesuai urutan default, gejala terlihat acak: kadang muncul, kadang tidak, tergantung total baris sekolah itu.

Perbaikan: filter periode di query (bukan ambil semua periode lalu iris di klien), atau paginasi `range()` berulang sampai habis, atau naikkan limit lewat view agregat. Yang paling sehat: berhenti mengagregat detail di klien (lihat 3.1) sehingga tabel detail tidak perlu diambil besar-besaran.

### 1.2 Error query yang ditelan, layar tampil "kosong" padahal sebenarnya gagal (TINGGI)

- `useKarakterData.js:95`: dari 9 query Wali Kelas, hanya 4 yang dicek errornya (`summary`, `skor`, `skorInd`, `ortu`). Kalau query `briefing` atau `tindak_lanjut` gagal (RLS menolak, jaringan putus), hasilnya dianggap array kosong. Layar menulis "Belum ada tindak lanjut untuk periode ini" padahal tindak lanjutnya ada, query-nya yang gagal.
- `useKarakterData.js:196` (Kepsek) dan `:315` (Yayasan): hanya error `summary` yang dicek. Briefing, tindak lanjut, dan pernyataan ortu gagal tanpa suara.
- `useKarakterData.js:5-21`: `fetchAspekConfig` dan `fetchIndikatorConfig` membuang error sama sekali. Kalau gagal, daftar aspek kosong, radar dan kartu aspek lenyap tanpa pesan.
- `MIPage.jsx:180`: kalau query tindak lanjut MI error, halaman justru menampilkan CONTOH tindak lanjut (data sample), bukan pesan gagal. Pengguna melihat saran yang bukan berasal dari sekolahnya.

Perbaikan: cek error semua query, bedakan tiga keadaan di UI: memuat, gagal (dengan tombol coba lagi), dan benar-benar kosong.

### 1.3 Tindak lanjut disaring dengan periode milik tabel lain (TINGGI)

Pola di semua hook: periode aktif ditentukan dari `karakter_summary`, lalu `briefing` dan `tindak_lanjut` DIIRIS dengan periode itu (`useKarakterData.js:126-143`). Konsekuensi:

- Tindak lanjut yang disetujui untuk periode 2026-06 tidak akan pernah tampil kalau summary terbaru 2026-07 dan user tidak memindah picker.
- Kalau `periode_id` baris tindak lanjut tidak persis sama dengan `periode_id` summary (beda format, salah tebak bulan saat import, lihat 2.3), baris itu tidak tampil di periode mana pun.

Di tab Ringkasan lebih rapuh lagi: `useOverviewBriefing.js:106` memakai periode terbaru dari briefing dulu, baru tindak lanjut. Kalau briefing terbaru 2026-07 tapi tindak lanjut terbaru 2026-06, SEMUA tindak lanjut hilang dari ringkasan. Dan karena semua modul digabung dalam satu penentuan periode, modul yang datanya lebih lama ikut lenyap.

### 1.4 PeriodPicker hanya membaca karakter_summary (SEDANG)

`useAvailablePeriods.js` menyusun daftar bulan dari `karakter_summary` saja. Bulan yang punya skor murid tapi summary-nya tidak ikut terimport (kasus nyata: sheet summary tanpa kolom bulan yang salah tebak periode, lihat 2.3) tidak muncul di picker, jadi data bulan itu tidak bisa dijangkau siapa pun dari UI.

### 1.5 Baris tindak lanjut disetujui tapi tersaring aturan kelengkapan (SEDANG)

`karakterMeta.js:300` `isKebijakanReady` hanya menampilkan baris yang punya `title`, `type`, `fokus`, `term`, dan `konkret` terisi. Baris skema lama yang sudah berstatus `disetujui` lolos gerbang persetujuan tapi tidak lolos saringan tampilan. Gejala di admin: "sudah saya approve kok tidak muncul". Perlu ada jalur tampilan fallback (pakai `action`/`trigger_desc` lama) atau migrasi data lama.

### 1.6 MI menampilkan campuran data contoh dan data asli (SEDANG)

`MIPage.jsx:195-207`: kalau `mi_hasil` kosong tapi tindak lanjut MI ada (atau sebaliknya), layar menampilkan statistik contoh berdampingan dengan tindak lanjut asli. Penanda sample ada, tapi angka pemicu di kartu tindak lanjut ("48% siswa") tidak akan cocok dengan angka apa pun di layar. Lebih aman: kalau salah satu sisi kosong, jangan tampilkan sisi contoh sama sekali.

---

## Bagian 2. Kenapa data bisa TIDAK VALID

### 2.1 Import ulang menduplikasi skor murid (KRITIS)

`karakterImporter.js:332-336`: `karakter_summary` di-upsert (aman diulang), tapi `karakter_skor`, `karakter_skor_indikator`, dan `karakter_pernyataan_ortu` memakai INSERT polos tanpa unique constraint. Meng-upload ulang file yang sama, atau file baru yang memuat bulan yang sudah pernah masuk, menggandakan seluruh baris detail.

Efek berantai: rata-rata yang dihitung klien dari detail (kartu aspek Wali Kelas `WaliKelasView.jsx:51`, indikator Yayasan `useKarakterData.js:362-374`) berubah bobotnya, sementara angka summary tetap. Angka kartu, angka detail, dan angka yang disebut tindak lanjut jadi tiga versi yang berbeda.

Perbaikan: unique constraint (sekolah, murid, periode, aspek/indikator) plus upsert, atau delete-then-insert per periode dalam satu transaksi.

### 2.2 Import setengah jalan tidak dibatalkan (TINGGI)

`karakterImporter.js:339-347`: insert berjalan per tabel per 500 baris. Gagal di tengah, misal di tabel ketiga, meninggalkan dua tabel pertama sudah terisi. Tidak ada rollback. Admin yang mengulang upload akan menduplikasi tabel yang tadi sudah masuk (gabung dengan 2.1). Perbaikan: pindahkan penulisan ke satu RPC/Edge Function bertransaksi.

### 2.3 Bulan sheet summary ditebak dari "periode dominan" (TINGGI)

`karakterImporter.js:273-303`: sheet `summary_kelas/jenjang/sekolah` yang tidak punya kolom bulan diberi periode dominan dari sheet detail. Untuk file berisi beberapa bulan, tebakan ini menempelkan ringkasan ke bulan yang salah. Karena PeriodPicker dan pemilihan periode bertumpu pada summary (1.3, 1.4), satu tebakan meleset membuat satu bulan penuh tampil dengan ringkasan bulan lain, atau tidak tampil sama sekali.

### 2.4 Identitas murid dipetakan dari nama (TINGGI)

`karakterImporter.js:106-121, 195-202`: `murid_id` dicari dari `nama_murid`. Dua murid bernama sama digabung jadi satu anak (skornya saling menimpa pemahaman pembaca, pernyataan ortunya tercampur). Nama yang sama diketik sedikit berbeda antar bulan ("Muh. Fajri" vs "Muhammad Fajri") membuat anak baru dan memutus tren. Nama kosong membuat semua baris tanpa nama menempel ke satu id. Perbaikan: pakai NIS/NISN atau id sumber dari sistem asesmen sebagai kunci, bukan nama.

### 2.5 Nilai kosong dihitung nol (TINGGI)

`KarakterShared.jsx:127, 177, 212, 269-270, 300, 318` memakai pola `ringkasanAspekValue(...) || 0`. Aspek yang datanya tidak ada tampil sebagai 0% di radar dan ikut dirata-rata sebagai nol di `skorRata`. Kelas yang datanya belum lengkap terlihat anjlok drastis, padahal datanya cuma kosong. Ini bertabrakan dengan prinsip yang sudah ditulis di `karakterMeta.js:114` sendiri: "Null (tidak ada data) BUKAN perlu_perhatian, beda kasus". Serupa: `groupTindakLanjut` (`karakterMeta.js:143-158`) menjatuhkan kelas yang nilai summary-nya null ke bucket "perlu perhatian".

### 2.6 FIR menghitung sendiri hal yang seharusnya dibaca final (TINGGI, akar mismatch vs tindak lanjut)

CLAUDE.md mengunci: FIR tidak menghitung apa pun. Kenyataannya ada beberapa perhitungan klien yang hasilnya bisa berbeda dari angka final pipeline hulu, dan berbeda dari angka yang dipakai Gemini saat menulis tindak lanjut:

- `MIPage.jsx:124-135` `deriveTop1` menghitung ulang kecerdasan dominan dari skor. Skor seri diputuskan oleh urutan array yang tetap, bukan aturan hulu. Kolom `dominan_flag` yang final justru tidak dipakai.
- `miTransform.js:261-265` `computeLevel` memakai cutoff 75/50, dan `karakterMeta.js:117-135` memakai cutoff 80 dan 80/60. CLAUDE.md menyatakan cutoff ini belum final dan tidak boleh ditebak. Selama ini hardcode, setiap perubahan keputusan pemilik produk membuat label di FIR beda dengan label di laporan hulu.
- `miTransform.js:317-321`: `pred_*` untuk Musikal, Naturalis, Spasial tidak ada di import, jadi levelnya dihitung klien; bisa beda dengan predikat resmi.
- Yayasan (`useKarakterData.js:358-375`) merata-rata indikator dari skor murid mentah, sementara kartu lain membaca summary. Dua sumber, dua angka.

Ditambah pembulatan bertingkat: skor dibulatkan saat import (`karakterImporter.js:4-8`), lalu dirata-rata dan dibulatkan lagi di klien (`avgAspek`). Rata-rata dari angka yang sudah dibulatkan tidak sama dengan rata-rata asli; selisih 1 poin dengan angka summary atau angka di teks tindak lanjut itu wajar muncul dari sini. Commit 2e04446 sudah menyamakan sebagian (Gemini kini membaca `rata_rata_per_aspek` dari summary yang sama dengan tampilan), tapi jalur MI dan indikator Yayasan masih menghitung sendiri.

### 2.7 Ringkasan lintas peran tidak konsisten filternya (SEDANG)

`useOverviewBriefing.js:70-71, 95-97` mengambil `tindak_lanjut` TANPA filter `target_role`, sedangkan halaman Karakter memfilternya ketat (`useKarakterData.js:89, 187, 292`). Kepala Sekolah bisa melihat tindak lanjut yang ditujukan untuk Yayasan di tab Ringkasan, lalu tidak menemukannya lagi di modul Karakter. Terlihat seperti "data hilang" padahal filternya yang beda.

### 2.8 MI tidak memfilter periode (SEDANG)

`MIPage.jsx:162-175` mengambil `mi_hasil` seluruh sekolah tanpa periode. Murid yang diases di dua periode dihitung dua kali di "Siswa terpetakan" dan di distribusi dominan.

### 2.9 Pencocokan jawaban multi-pilih pakai substring persis (RENDAH)

`karakterMeta.js:193-267`: jawaban ortu dicocokkan dengan teks opsi yang dibekukan di kode. Kalau wording di Google Form sumber diubah sedikit, jawaban berhenti terhitung tanpa error, angka dukungan/kategori jadi undercount. Serupa, `parseTop5Pair` (`karakterMeta.js:52-56`) menjajarkan nama dan nilai dengan dua filter terpisah; satu baris nilai kosong menggeser semua pasangan setelahnya.

### 2.10 Sesi kadaluarsa secara diam (RENDAH)

`auth.js` menyimpan peran, cakupan, dan daftar modul di sessionStorage sekali saat login dan tidak pernah menyegarkannya. Admin mengubah cakupan kelas seorang wali; wali itu tetap melihat cakupan lama sampai logout. Kalau token Supabase mati sementara `fir_session` masih ada, semua query dibalas kosong oleh RLS dan layar menampilkan "belum ada data", bukan "sesi berakhir, silakan login ulang".

---

## Bagian 3. Audit keamanan

### 3.1 Definisi RLS tidak ada di repo, gerbang utama tidak bisa diaudit (KRITIS)

Arsitektur menyatakan RLS satu-satunya gerbang akses. Tapi repo tidak memuat satu pun berkas migrasi SQL atau definisi policy (`supabase/` hanya berisi functions). Seluruh keamanan data sekolah dan murid bergantung pada konfigurasi di dashboard Supabase yang tidak berversi, tidak tereview, dan tidak bisa diverifikasi dari kode.

Pertanyaan yang saat ini tidak bisa dijawab dari repo, padahal menentukan segalanya:

- Bisakah user non-admin meng-UPDATE `profiles` miliknya (menaikkan `peran` jadi `AdminFammi`, memperluas `cakupan`)? CMS mengubah profil langsung dari browser (`useAdminCmsData.js:329-336`), artinya policy UPDATE profiles pasti ada; batasannya harus persis "hanya AdminFammi", bukan "pemilik baris".
- Bisakah user biasa meng-UPDATE `tindak_lanjut.status` jadi `disetujui` lewat REST API langsung? Persetujuan dilakukan dari browser (`useAdminCmsData.js:221-238`), jadi policy UPDATE tindak_lanjut ada; kalau cakupannya longgar, gerbang persetujuan manusia bisa dilompati siapa pun yang punya akun.
- Apakah SELECT `tindak_lanjut` membatasi `status = 'disetujui'` dan `target_role` untuk non-admin, atau hanya `sekolah_id`? Kalau hanya sekolah, murid/ortu bisa membaca draf `menunggu_persetujuan` termasuk `catatan_internal` dan `opsi_kandidat` reviewer lewat REST langsung, walau UI tidak menampilkannya. Filter `.eq("status","disetujui")` di kode React itu kosmetik; siapa pun bisa memanggil API tanpa filter itu memakai anon key yang memang publik.
- Apakah Wali Kelas dibatasi ke `kelas_id` dalam cakupannya, atau bisa membaca `karakter_skor` (berisi nama murid) sekolah lain / kelas lain?

Tindakan: jalankan `supabase db pull`, commit semua policy sebagai migrasi, lalu review satu per satu terhadap kontrak di CLAUDE.md. Tambahkan tes otomatis yang login sebagai tiap peran dan membuktikan baris yang tidak boleh terbaca memang tertolak. Sebelum ini dilakukan, klaim "RLS menjaga semuanya" belum terbukti.

### 3.2 Semua operasi tulis admin berjalan dari browser (TINGGI)

Approve/reject tindak lanjut, ubah peran user, tambah sekolah, toggle modul, import skor, ubah jadwal Gemini, semuanya query langsung dari klien dengan anon key + JWT (seluruh `useAdminCmsData.js`). Pola ini memaksa banyak policy INSERT/UPDATE/DELETE berbasis "kalau peran caller AdminFammi", dan satu saja yang salah tulis membuka pintu (lihat 3.1). Edge Function `create-user` sudah memakai pola yang benar: verifikasi caller di server, lalu service_role. Mutasi admin lain sebaiknya menyusul ke pola itu supaya permukaan policy yang harus sempurna mengecil.

### 3.3 Password generate-an mudah ditebak (TINGGI)

`create-user/index.ts:169-174`: password otomatis = potongan huruf username (huruf kecil) + 3 digit, contoh "wiwifarida482". Untuk penyerang yang tahu username (format akun dibagikan massal ke sekolah, pola `username@fammi.internal` juga tertulis di kode publik), ruang tebakan cuma 900 kombinasi. Endpoint login Supabase punya rate limit bawaan tapi longgar untuk ukuran 900 percobaan. Akun ini melindungi data anak. Perbaikan: minimal 2 kata acak + 4 digit, atau paksa ganti password saat login pertama, plus perketat rate limit Auth di dashboard.

### 3.4 CORS terbuka untuk semua origin (SEDANG)

`_shared/cors.ts`: `Access-Control-Allow-Origin: *` di semua Edge Function. Otorisasi memang dicek lewat JWT, jadi ini bukan lubang langsung, tapi tidak ada alasan situs lain boleh memanggil fungsi ini dari browser. Batasi ke domain produksi FIR (dan localhost saat develop).

### 3.5 Yang sudah benar dan patut dipertahankan

- Kunci Gemini dan service_role hanya hidup di Edge Function, tidak pernah menyentuh kode React. Jalur baca FIR tidak memanggil Gemini.
- Draf Gemini selalu lahir berstatus `menunggu_persetujuan`; tidak ditemukan jalur kode yang menulis `disetujui` tanpa aksi admin.
- Data yang dikirim ke Gemini tidak menyertakan nama murid (`geminiPrompt.ts:1199`, ORTU_COLUMNS tanpa `nama_murid`), dan dibatasi 60 baris.
- `create-user` memverifikasi peran caller di server sebelum memakai service_role, dan me-rollback auth user kalau insert profile gagal.
- Batch cron dilindungi header rahasia `x-cron-secret`, bukan endpoint terbuka.
- Tidak ada `dangerouslySetInnerHTML`; risiko XSS dari konten (pernyataan ortu berisi teks bebas) tertahan oleh escaping bawaan React.
- Anon key di kode klien memang didesain publik; ini bukan kebocoran, dengan syarat 3.1 terpenuhi.

### 3.6 Kebersihan kecil

- `gasClient.js` dan `useGasRead.js` sudah tidak diimpor siapa pun; sisa era GAS. Hapus supaya tidak ada jalur data kedua yang tidak dijaga.
- `docs/Implementation_Guide_FIR.md` masih menjelaskan arsitektur GAS/Sheets sebagai yang aktif; menyesatkan untuk pengembang berikutnya.
- Hasil bulk reset password diekspor CSV berisi password polos; wajar untuk distribusi, tapi ingatkan admin bahwa file itu setara kunci dan tidak boleh disimpan sembarangan.

---

## Bagian 4. Urutan prioritas perbaikan

1. Tarik dan commit semua policy RLS, review terhadap kontrak peran, tambah tes akses per peran (3.1). Semua jaminan lain berdiri di atas ini.
2. Tangani batas 1000 baris: filter periode di query atau paginasi (1.1). Ini kemungkinan besar penyebab utama "kadang tidak muncul" dan "rata-rata aneh".
3. Idempotenkan import: unique constraint + upsert + transaksi (2.1, 2.2), dan ganti kunci murid dari nama ke id sumber (2.4).
4. Cek error semua query dan bedakan gagal vs kosong di UI (1.2).
5. Satukan sumber angka: berhenti menghitung dominan/level/rata-rata di klien, baca kolom final; tampilkan null sebagai "tidak ada data", bukan 0 (2.5, 2.6).
6. Samakan filter tindak lanjut antara Ringkasan dan modul (target_role, periode) dan longgarkan ketergantungan periode-summary (1.3, 2.7).
7. Perkuat password generate-an dan rate limit Auth (3.3), sempitkan CORS (3.4), lalu bersihkan sisa GAS (3.6).
