# Skema Data dan Mesin Tampilan FIR v1

Dokumen ini merancang satu mesin tampilan dan skema Google Sheets sampai level kolom untuk Fammi Intelligence Report (FIR). Cakupannya tiga modul, yaitu Rapor Karakter, Screening Perilaku dan Mental Anak, dan Multiple Intelligence, ditambah entitas Tindak Lanjut sebagai entitas asli FIR.

Status dokumen: rancangan siap eksekusi. Beberapa nilai bersifat parameter yang perlu Anda isi, ditandai jelas di Bagian 7. Tidak ada angka yang dikarang.

---

## 0. Keputusan yang sudah terkunci

1. Generasi tindak lanjut terjadi di hulu, yaitu aturan deterministik, pencocokan master, perumusan AI, lalu gerbang persetujuan manusia, baru ditulis ke sheet. FIR hanya membaca baris yang sudah disetujui. Posisi ini sekaligus menjadi nilai jual utama Fammi.
2. MI menampilkan nama langsung ke wali kelas. Lapisan sensitivitas bersifat per modul, bukan global. Trusted Proxy tetap ketat khusus Screening.
3. Tindak lanjut tingkat individu hadir di V1 hanya untuk Multiple Intelligence. Tindak lanjut individu untuk Karakter dan Screening masuk V2. Tindak lanjut agregat (sekolah dan kelas) hadir di V1 untuk semua modul.
4. Konten rekomendasi MI adalah master data milik Fammi. FIR mencocokkan kecerdasan dominan tiap siswa ke baris master yang sesuai. Pencocokan, bukan perhitungan.
5. State V2: Baru, Dikerjakan (dengan terminal Selesai), Nanti saja (membawa target tanggal), Tidak perlu (membawa alasan).

---

## 1. Prinsip arsitektur

FIR adalah satu wadah dengan satu pintu login. Tampilan dan data disaring per peran. Apps Script adalah satu-satunya gerbang. Browser tidak pernah membaca Sheets langsung.

V1 tidak menghitung apa pun. Seluruh skor, status, agregat, dominan, dan tindak lanjut sudah final di spreadsheet sebelum FIR membacanya. FIR membaca, menyaring per peran dan periode, lalu menampilkan.

Satu mesin tampilan melayani tiga modul. Perbedaan antar modul tinggal di sheet konfigurasi, bukan di kode. Penjelasan setiap dimensi konfigurasi ada di Bagian 4.

Tiap baris fakta wajib membawa kunci penanda lengkap (sekolah, kelas, murid, periode, modul, sumber) supaya gerbang bisa menyaring tanpa membaca sheet lain.

### Model penyimpanan dan ingestion

File per periode yang tim Fammi deliver, baik mingguan, bulanan, maupun per peristiwa tes, berstatus staging. File itu tidak dibaca FIR secara langsung. Ada satu langkah ingestion yang menyalin isinya ke tempat simpan utama (system of record), menandai periode_id, dan menulis baris Periode. FIR hanya membaca tempat simpan itu. Akibatnya, filter mingguan, bulanan, dan tahunan berubah menjadi filter baris pada kolom Periode, bukan buka tutup banyak file.

Tempat simpan dibagi dua lapisan supaya tiap workbook tetap kecil dan cepat. Lapisan kontrol bersifat terpusat dan memuat struktur, pengguna, akses, konfigurasi, master, serta Agregat tingkat sekolah ke atas. Lapisan data bersifat per sekolah, satu workbook untuk tiap sekolah, memuat Periode, Kelas, Murid, Fakta_Aspek, Fakta_Kualitatif, dan Tindak_Lanjut. Sheet Registry di lapisan kontrol memetakan sekolah_id ke id workbook datanya. Tampilan yayasan yang membandingkan antar sekolah cukup membaca Agregat terpusat, tanpa membuka tiap workbook sekolah.

---

## 2. Peta sheet

Total 21 sheet, dikelompokkan dalam lima grup, ditambah pembagian lapisan kontrol dan lapisan data. Jumlah ini bertambah dari catatan awal 13 sheet karena masuknya mesin Tindak Lanjut, master rekomendasi MI, aliran kualitatif, sheet konfigurasi, dan Registry untuk partisi per sekolah. Penambahan ini disengaja dan menjadi tulang punggung nilai jual produk.

Kolom Lapisan menunjukkan tempat sheet berada. Kontrol berarti terpusat untuk semua sekolah. Per sekolah berarti workbook terpisah untuk tiap sekolah, ditunjuk lewat Registry.

| Grup | Sheet | Lapisan | Fungsi |
|---|---|---|---|
| A. Identitas dan Struktur | Yayasan, Sekolah | kontrol | entitas inti lintas sekolah |
| A. Identitas dan Struktur | Kelas, Murid, Periode | per sekolah | entitas inti di tiap sekolah |
| B. Akses dan Autentikasi | Pengguna, Sesi, Akses_Kapabilitas, Akses_Cakupan, Langganan, Registry | kontrol | login, peran, entitlement, cakupan, peta workbook |
| C. Konfigurasi Mesin Tampilan | Modul_Config, Aspek_Config, Aspek_Cutoff, Status_Label | kontrol | otak mesin tampilan |
| D. Data Fakta | Fakta_Aspek, Fakta_Kualitatif | per sekolah | data terhitung, read-only |
| D. Data Fakta | Agregat | kontrol | roll-up tingkat sekolah ke atas |
| E. Rekomendasi dan Tindak Lanjut | Master_RekomendasiMI, Master_Aksi | kontrol | konten lookup |
| E. Rekomendasi dan Tindak Lanjut | Tindak_Lanjut | per sekolah | tindak lanjut tiap sekolah |

Catatan desain: relasi orang tua ke murid dan relasi guru ke kelas yang disebut di file md tidak menjadi sheet terpisah. Keduanya direpresentasikan sebagai baris di Akses_Cakupan (tipe murid untuk orang tua, tipe kelas untuk guru). Pilihan ini menjaga sumber kebenaran akses tetap satu tempat dan mengurangi duplikasi. Bila kelak relasi ini butuh atribut domain di luar akses, sheet terpisah bisa ditambahkan tanpa mengubah mesin.

---

## 3. Skema kolom per sheet

Tipe data ditulis sederhana karena basisnya Google Sheets, yaitu teks, integer, desimal, boolean, tanggal, waktu, enum, dan kunci (referensi ke sheet lain).

### Grup A. Identitas dan Struktur

**A1. Yayasan**

| Kolom | Tipe | Keterangan |
|---|---|---|
| yayasan_id | teks | kunci utama |
| nama_yayasan | teks | |
| aktif | boolean | |

**A2. Sekolah**

| Kolom | Tipe | Keterangan |
|---|---|---|
| sekolah_id | teks | kunci utama |
| yayasan_id | kunci | referensi Yayasan, boleh kosong bila sekolah mandiri |
| nama_sekolah | teks | |
| jenjang | enum | SD, SMP, SMA, SMK |
| aktif | boolean | |

**A3. Kelas**

| Kolom | Tipe | Keterangan |
|---|---|---|
| kelas_id | teks | kunci utama |
| sekolah_id | kunci | referensi Sekolah |
| nama_kelas | teks | contoh X-A, X-R |
| tahun_ajaran | teks | contoh 2025/2026 |
| aktif | boolean | |

**A4. Murid**

| Kolom | Tipe | Keterangan |
|---|---|---|
| murid_id | teks | kunci utama |
| sekolah_id | kunci | referensi Sekolah |
| kelas_id | kunci | referensi Kelas |
| nama_murid | teks | |
| gender | enum | L, P |
| proxy_code | teks | dipakai saat modul bersifat proxy, contoh Screening |
| aktif | boolean | |

**A5. Periode**

Periode bersifat berlapis, yaitu tahun ajaran, lalu semester, lalu pekan, bulan, atau peristiwa tes. Satu baris mewakili satu titik periode yang dipakai sebagai filter waktu. Rapor Karakter bisa berjalan mingguan atau bulanan tergantung sekolah, sedangkan Screening dan MI bersifat per peristiwa tes.

| Kolom | Tipe | Keterangan |
|---|---|---|
| periode_id | teks | kunci utama |
| sekolah_id | kunci | referensi Sekolah |
| tahun_ajaran | teks | |
| semester | enum | Ganjil, Genap |
| tipe_periode | enum | mingguan, bulanan, peristiwa_tes |
| label_periode | teks | contoh Pekan 3 Maret 2026, Maret 2026, atau Tes MI Maret 2026 |
| tanggal_acuan | tanggal | tanggal tes, awal pekan, atau awal bulan |
| urutan | integer | untuk pengurutan tren lintas pekan, bulan, atau tahun |

### Grup B. Akses dan Autentikasi

**B1. Pengguna**

| Kolom | Tipe | Keterangan |
|---|---|---|
| user_id | teks | kunci utama |
| nama | teks | |
| peran | enum | Admin Fammi, Yayasan, Kepala Sekolah, Wali Kelas, Orang Tua, Siswa |
| username | teks | identitas login |
| kredensial_hash | teks | hasil hash dari PIN atau kata sandi, bukan teks asli |
| aktif | boolean | |

**B2. Sesi**

GAS bersifat stateless, sehingga sesi divalidasi lewat token yang tersimpan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| token | teks | kunci utama, acak |
| user_id | kunci | referensi Pengguna |
| dibuat_pada | waktu | |
| kedaluwarsa_pada | waktu | gerbang menolak token kedaluwarsa |

**B3. Akses_Kapabilitas**

Lapis kapabilitas, yaitu boolean peran dikali modul. Menentukan modul mana yang menyala untuk sebuah peran.

| Kolom | Tipe | Keterangan |
|---|---|---|
| peran | enum | sama dengan Pengguna.peran |
| modul | enum | karakter, screening, mi |
| boleh_lihat | boolean | |
| boleh_lihat_kualitatif | boolean | pemisah akses ke aliran kualitatif sensitif |

**B4. Akses_Cakupan**

Lapis cakupan, yaitu pemetaan identitas pengguna ke unit datanya. Wali kelas hanya ke kelasnya, orang tua hanya ke anaknya, siswa hanya ke dirinya, kepala sekolah ke sekolahnya, yayasan ke yayasannya.

| Kolom | Tipe | Keterangan |
|---|---|---|
| user_id | kunci | referensi Pengguna |
| tipe_cakupan | enum | yayasan, sekolah, kelas, murid |
| unit_id | teks | id sesuai tipe_cakupan |

**B5. Langganan**

Entitlement sekolah ke modul. Modul yang menyala di dashboard hanya yang dilanggan sekolah itu.

| Kolom | Tipe | Keterangan |
|---|---|---|
| sekolah_id | kunci | referensi Sekolah |
| modul | enum | karakter, screening, mi |
| aktif | boolean | |
| mulai | tanggal | |
| akhir | tanggal | boleh kosong bila berjalan |

**B6. Registry**

Peta partisi per sekolah. FIR memakai sheet ini untuk tahu workbook data mana yang harus dibuka setelah cakupan pengguna diketahui.

| Kolom | Tipe | Keterangan |
|---|---|---|
| sekolah_id | kunci | referensi Sekolah |
| data_workbook_id | teks | id Google Sheet workbook data sekolah tersebut |
| aktif | boolean | |

### Grup C. Konfigurasi Mesin Tampilan

**C1. Modul_Config**

Satu baris per modul. Inilah sumber perbedaan perilaku antar modul.

| Kolom | Tipe | Keterangan |
|---|---|---|
| modul | enum | kunci utama, karakter, screening, mi |
| nama_modul | teks | |
| jumlah_status | integer | 4 untuk Karakter, 3 untuk Screening dan MI |
| polaritas | enum | tinggi_baik (Karakter, MI), tinggi_waspada (Screening) |
| jenis_nilai | enum | persen, skala_0_10, integer_absolut |
| skala_maks | integer | parameter, lihat Bagian 7 untuk MI |
| granularitas | enum | aspek_saja (MI), aspek_dan_indikator (Karakter, Screening) |
| temporalitas | enum | mingguan atau bulanan (Karakter), episodik (Screening, MI) |
| multi_sumber | boolean | true untuk Karakter (sekolah dan rumah) |
| sensitivitas | enum | normal (Karakter), bernama (MI), ketat_proxy (Screening) |
| visibilitas_siswa | boolean | true untuk MI |
| mode_dominan | enum | tidak_ada (Karakter), ambang_tier (Screening), top_n (MI) |

**C2. Aspek_Config**

Daftar aspek per modul, yaitu 6 karakter custom, 5 aspek HEART, 8 kecerdasan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| modul | enum | |
| aspek_kode | teks | contoh Lo, Ie, atau kode karakter |
| aspek_nama | teks | contoh Logika-Matematika, Hiperaktivitas |
| urutan | integer | |
| warna | teks | kode warna untuk tampilan |

**C3. Aspek_Cutoff**

Ambang skor ke status, per aspek per modul. Sheet ini yang membuat status terhitung jelas dan terdokumentasi. Nilai Screening sudah diketahui. Nilai MI adalah parameter, lihat Bagian 7.

| Kolom | Tipe | Keterangan |
|---|---|---|
| modul | enum | |
| aspek_kode | teks | |
| status_level | integer | 1 paling baik untuk modul tinggi_baik, urutan dijelaskan di Status_Label |
| batas_bawah | desimal | inklusif |
| batas_atas | desimal | inklusif |

Contoh isi Screening yang sudah diketahui dari laporan individu (skor 0 sampai 10, tinggi berarti perlu diwaspadai):

| aspek_kode | status | batas_bawah | batas_atas |
|---|---|---|---|
| Hiperaktivitas | Baik | 0 | 5 |
| Hiperaktivitas | Perlu Perhatian | 5.01 | 7 |
| Hiperaktivitas | Waspada | 7.01 | 10 |
| Emosional | Baik | 0 | 5 |
| Emosional | Perlu Perhatian | 5.01 | 7 |
| Emosional | Waspada | 7.01 | 10 |
| Agresi | Baik | 0 | 2 |
| Agresi | Perlu Perhatian | 2.01 | 4 |
| Agresi | Waspada | 4.01 | 10 |
| Relasi Pertemanan | Baik | 0 | 3 |
| Relasi Pertemanan | Perlu Perhatian | 3.01 | 6 |
| Relasi Pertemanan | Waspada | 6.01 | 10 |
| Tolong Menolong | Baik | 0 | 4 |
| Tolong Menolong | Perlu Perhatian | 4.01 | 6 |
| Tolong Menolong | Waspada | 6.01 | 10 |

**C4. Status_Label**

Legenda status per modul, sekaligus mendefinisikan warna dan label versi kelompok.

| Kolom | Tipe | Keterangan |
|---|---|---|
| modul | enum | |
| status_level | integer | |
| label_individu | teks | contoh Baik, Kuat, Konsisten |
| label_kelompok | teks | contoh Aman, untuk versi laporan kelompok |
| tier_warna | enum | hijau, kuning, merah, atau setara |

### Grup D. Data Fakta

**D1. Fakta_Aspek**

Tabel fakta utama, format panjang. Satu baris per entitas dikali modul dikali periode dikali aspek (dan indikator bila ada). Sheet inilah yang dibaca mesin tampilan untuk ketiga modul.

| Kolom | Tipe | Keterangan |
|---|---|---|
| fakta_id | teks | kunci utama |
| sekolah_id | kunci | |
| kelas_id | kunci | |
| murid_id | kunci | |
| periode_id | kunci | |
| modul | enum | |
| aspek_kode | teks | |
| indikator_kode | teks | kosong untuk MI, terisi untuk Karakter dan Screening |
| skor | desimal | interpretasinya ditentukan Modul_Config.jenis_nilai |
| status | teks | sudah final, hasil cutoff di hulu |
| dominan_flag | boolean | true untuk kecerdasan berstatus Kuat pada MI |
| sumber | enum | sekolah, rumah, lapor_diri |
| tren | enum | Naik, Turun, Stabil, hanya untuk Karakter |

**D2. Fakta_Kualitatif**

Aliran kualitatif tiga modul dalam satu tempat, yaitu refleksi orang tua (Karakter), cerita hati siswa (Screening, sensitif), serta Analisa Kegiatan dan Dukungan yang Dibutuhkan (MI).

| Kolom | Tipe | Keterangan |
|---|---|---|
| kualitatif_id | teks | kunci utama |
| sekolah_id | kunci | |
| kelas_id | kunci | |
| murid_id | kunci | |
| periode_id | kunci | |
| modul | enum | |
| field_kode | teks | contoh dukungan_dibutuhkan, mapel_disukai, refleksi_perasaan |
| field_label | teks | label tampil |
| nilai_teks | teks | jawaban bebas |
| sumber | enum | sekolah, rumah, lapor_diri |
| sensitif_flag | boolean | true untuk cerita hati Screening, akses lewat gerbang ahli |

**D3. Agregat**

Roll-up yang sudah dihitung di hulu, untuk tingkat kelas, sekolah, dan yayasan. FIR tidak menghitung, hanya membaca.

| Kolom | Tipe | Keterangan |
|---|---|---|
| agregat_id | teks | kunci utama |
| scope_tipe | enum | kelas, sekolah, yayasan |
| scope_id | teks | id sesuai scope_tipe |
| periode_id | kunci | |
| modul | enum | |
| aspek_kode | teks | |
| metrik | enum | pct_per_status, count_per_status, peringkat_dominan |
| status_atau_label | teks | contoh Kuat, atau peringkat 1 |
| nilai | desimal | persen atau jumlah |
| total_n | integer | jumlah responden, contoh 23 atau 67 |

Catatan konsistensi tampilan: bila sebuah status bernilai nol, baris tetap ditulis dengan nilai 0. Contohnya Interpersonal di laporan sekolah tampil 60 dan 40, kemungkinan karena Berkembang bernilai 0. Mesin tampilan tetap menampilkan 0 persen, tidak menghilangkan bucket-nya. Konfirmasi angka nol ini ada di Bagian 7.

### Grup E. Rekomendasi dan Tindak Lanjut

**E1. Master_RekomendasiMI**

Master data milik Fammi. FIR mencocokkan kecerdasan dominan murid ke baris di sini untuk laporan individu MI (jurusan, profesi, universitas, saran pengembangan).

| Kolom | Tipe | Keterangan |
|---|---|---|
| rekomendasi_id | teks | kunci utama |
| kecerdasan_kode | teks | kunci pencocokan |
| kategori | enum | rek_sekolah, jurusan_sma, jurusan_kuliah_dn, profesi, ekskul, lomba, saran_belajar, saran_polaasuh, saran_kegiatan, universitas_dn, universitas_ln |
| sub_label | teks | contoh nama universitas, atau judul saran |
| teks | teks | isi rekomendasi |
| urutan | integer | |

**E2. Master_Aksi**

Pustaka template aksi untuk mesin Tindak Lanjut di hulu. Memetakan pola pemicu ke kalimat aksi dasar, sebelum AI merangkainya menjadi versi final.

| Kolom | Tipe | Keterangan |
|---|---|---|
| aksi_id | teks | kunci utama |
| modul | enum | |
| pemicu_kode | teks | contoh ortu_minta_seminar, tier_merah, kelas_dominan_kinestetik |
| kategori | enum | kebijakan, intervensi_kelas, pendampingan, rujukan_ahli, parenting |
| teks_aksi_dasar | teks | kalimat dasar yang akan dirapikan AI |
| cakupan_default | enum | sekolah, kelas, murid |
| peran_sasaran | enum | yayasan, kepala_sekolah, wali_kelas, guru_bk |
| prioritas_default | enum | tinggi, sedang, rendah |

**E3. Tindak_Lanjut**

Entitas asli FIR. Berisi tindak lanjut yang sudah dirumuskan di hulu dan sudah lolos gerbang persetujuan manusia. FIR menampilkan hanya baris yang disetujui.

| Kolom | Tipe | Keterangan |
|---|---|---|
| tl_id | teks | kunci utama |
| modul | enum | |
| pemicu_kode | teks | referensi pola di Master_Aksi |
| pemicu_ringkas | teks | contoh 60 persen orang tua minta seminar parenting |
| cakupan_tipe | enum | sekolah, kelas, murid |
| cakupan_id | teks | |
| periode_id | kunci | untuk filter waktu |
| teks_aksi | teks | kalimat final hasil rumusan AI yang sudah ditinjau |
| prioritas | enum | tinggi, sedang, rendah |
| peran_sasaran | enum | siapa yang harus bertindak |
| versi_minimum | enum | v1, v2, menentukan kapan item ini boleh tampil |
| status_persetujuan | enum | menunggu, disetujui, ditolak, hanya disetujui yang tampil |
| disetujui_oleh | kunci | referensi Pengguna, biasanya psikolog atau Admin Fammi |
| disetujui_pada | waktu | |
| status_kerja | enum | Baru, Dikerjakan, Selesai, Nanti saja, Tidak perlu, aktif mulai V2 |
| target_tanggal | tanggal | wajib bila status_kerja Nanti saja |
| alasan | teks | wajib bila status_kerja Tidak perlu |
| pic_user_id | kunci | penanggung jawab, mulai V2 |
| catatan | teks | mulai V2 |
| diubah_oleh | kunci | mulai V2 |
| diubah_pada | waktu | mulai V2 |

Aturan versi yang menerjemahkan keputusan 3:
- v1 menampilkan baris dengan cakupan_tipe sekolah dan kelas untuk semua modul, ditambah cakupan_tipe murid khusus modul MI.
- v2 membuka cakupan_tipe murid untuk Karakter dan Screening, sekaligus mengaktifkan kolom status_kerja dan turunannya.

---

## 4. Mesin tampilan

Mesin tampilan adalah satu modul kode yang membaca Modul_Config untuk menentukan cara merender. Tidak ada logika modul yang dihardcode.

Urutan baca mesin:
1. Tentukan modul yang akan ditampilkan, ambil satu baris dari Modul_Config.
2. Ambil daftar aspek dari Aspek_Config dan legenda dari Status_Label.
3. Baca baris yang relevan dari Fakta_Aspek sesuai cakupan dan periode pengguna.
4. Render sesuai jenis_nilai dan polaritas. Untuk tinggi_baik, skor besar diwarnai positif. Untuk tinggi_waspada, skor besar diwarnai merah.
5. Bila granularitas aspek_dan_indikator, tampilkan lapisan indikator. Bila aspek_saja, lewati.
6. Bila mode_dominan top_n, tandai aspek dominan dari dominan_flag (individu) atau dari Agregat peringkat_dominan (kelas dan sekolah). Bila ambang_tier, angkat status tertinggi sebagai sorotan.
7. Untuk MI individu, cocokkan kecerdasan dominan ke Master_RekomendasiMI dan tampilkan blok rekomendasi.

Prinsip tampilan utama: tindak lanjut adalah pita teratas tiap dashboard, disaring ke cakupan peran dan periode, lengkap dengan badge status mulai V2. Grafik dan tabel turun menjadi bukti pendukung. Pola ini yang memberi visibility yang Anda inginkan, yaitu pimpin dengan aksi, dukung dengan data.

Rambu anti kelelahan sinyal: batasi jumlah item tampil, urutkan berdasarkan prioritas, kelompokkan per tema. Filter waktu membantu memecah beban menjadi tindak lanjut per periode.

---

## 5. Alur gerbang baca

Setiap permintaan dari browser melewati Apps Script. Browser tidak pernah menyentuh Sheets.

1. Login. GAS memvalidasi username dan kredensial_hash di Pengguna, lalu menerbitkan token di Sesi.
2. Tiap permintaan membawa token. GAS menolak token kedaluwarsa.
3. GAS membaca peran pengguna, lalu Akses_Kapabilitas untuk tahu modul mana yang boleh dan apakah kualitatif boleh.
4. GAS membaca Akses_Cakupan untuk tahu unit data milik pengguna.
5. GAS membaca Registry untuk menemukan workbook data sekolah yang relevan, lalu membukanya. Tampilan yayasan membaca Agregat terpusat tanpa membuka tiap workbook.
6. GAS menyaring baris fakta sesuai cakupan dan periode, menghormati Langganan sekolah.
7. GAS mengembalikan hanya potongan data yang diizinkan. Field sensitif disaring di tahap ini, bukan di browser.

---

## 6. Mesin Tindak Lanjut di hulu

Inilah komponen yang menjadi nilai jual. Alurnya terpisah dari FIR dan berjalan sebelum data masuk ke Tindak_Lanjut.

1. Sinyal sudah terhitung di spreadsheet, baik di Fakta_Aspek, Fakta_Kualitatif, maupun Agregat.
2. Aturan deterministik memilih sinyal yang layak menjadi tindak lanjut. Contohnya agregat persen orang tua yang meminta sesuatu melampaui ambang, atau status tier merah pada Screening.
3. Sistem mencocokkan sinyal ke Master_Aksi untuk mengambil teks_aksi_dasar, cakupan, peran sasaran, dan prioritas.
4. Gemini merangkai teks_aksi_dasar menjadi kalimat final yang jelas dan memprioritaskan urutannya. Substansi intervensi tidak dikarang AI. Substansi berasal dari aturan, master, dan instrumen valid seperti SDQ. Peran AI adalah merumuskan dan memprioritaskan.
5. Manusia meninjau. Psikolog atau Admin Fammi menyetujui, menolak, atau mengedit. Tahap ini adalah gerbang persetujuan yang wajib.
6. Baris yang disetujui ditulis ke Tindak_Lanjut dengan status_persetujuan disetujui.
7. FIR menampilkan hanya baris disetujui, disaring per peran dan periode.

Karena seluruh komputasi dan AI terjadi di hulu, prinsip V1 tidak menghitung tetap utuh di lapisan baca FIR. Klaim AI-Powered Dashboard terpenuhi secara jujur, sebab AI memang bekerja, namun di tempat yang aman dan terkendali.

---

## 7. Parameter yang perlu Anda isi

Bagian ini berisi nilai yang belum bisa saya pastikan dari contoh laporan. Saya sengaja tidak mengisinya supaya tidak ada angka karangan.

1. Cutoff skor MI ke status Kuat, Sedang, Berkembang. Dari laporan Razan, yang teramati hanya skor 23 berstatus Kuat dan rentang 15 sampai 20 berstatus Sedang. Ambang Kuat ada antara 20 dan 23, ambang Berkembang ada di bawah 15, keduanya belum bisa ditentukan presisinya. Mohon rubrik aslinya untuk mengisi Aspek_Cutoff modul MI.
2. Skala maksimum skor MI dan jumlah butir per kecerdasan, untuk mengisi Modul_Config.skala_maks.
3. Konfirmasi nilai nol pada Interpersonal di laporan sekolah, yaitu apakah benar 0 persen Berkembang, atau bucketing-nya berbeda.
4. Pemetaan ordinal Rapor Karakter ke persen. File md menduga 25, 50, 75, 100. Status ini masih dugaan, bukan fakta, sehingga perlu Anda konfirmasi sebelum mengisi konfigurasi Karakter.

---

## 8. Langkah berikutnya

Urutan yang tersisa mengikuti alur di file md, yaitu skema, lalu PRD, lalu implementation guide.

Setelah skema ini Anda setujui atau koreksi, saya susun PRD yang mengikat skema ini ke user stories per peran, ditambah kriteria penerimaan. Implementation guide menyusul setelahnya, lengkap dengan git init, CLAUDE.md, setup environment variable, dan deploy Vercel, sesuai standar Anda.
