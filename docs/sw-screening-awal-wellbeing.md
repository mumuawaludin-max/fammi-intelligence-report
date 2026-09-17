# Screening Awal Wellbeing (modul `sw`)

Modul ini memetakan kondisi kerja di sebuah lembaga pendidikan. Pembacanya yayasan dan tim Human Capital. Sumbernya dua: Form A (isian pegawai) dan Form B (pengamatan atasan). Yang diukur adalah lingkungan kerja, bukan kondisi mental perorangan. Label di antarmuka memakai bahasa sehari-hari (kategori: Sangat perlu perhatian, Perlu perhatian, Cukup, Baik, Sangat baik) dan tidak pernah memakai "kesehatan mental", "gangguan", "sehat", "tidak sehat", atau "waspada"; ada uji yang memeriksanya.

Data pertama: Sekolah Islam Athirah, berkas `Data Wellbeing Athirah - Final.xlsx`. Isinya 602 baris Form A, 25 unit, 19 unit dengan Form B, dan 200 baris peserta asesman lanjutan. Setelah isian ganda dibuang (lihat bawah) yang dipakai 577 pengisi; peserta tetap 200 orang karena kursi dibagi ulang dengan aturan berkas.

## Alur data

```
xlsx olahan ──► npm run sw:baca ──► web/sw-data-lokal/<slug>.json   (pratinjau lokal, tidak di-commit)
                                 └► web/sw-data-lokal/<slug>.seed.sql (tempel di SQL Editor)
                                                     │
                     Supabase: sw_dataset, sw_unit, sw_individu, sw_pimpinan_qc (RLS)
                                                     │
                     useSwData ──► siapkanDataUntukPeran ──► SwLaporan (6 tab)
```

- Pembaca: `web/src/pages/sw/lib/swPembaca.js` adalah fungsi murni. Ia dipakai oleh CLI `web/scripts/sw/baca-berkas-sw.mjs` dan oleh generator data contoh `web/scripts/sw/buat-data-contoh.mjs`.
- Pembaca tidak menghitung ulang skor. Subskala, indeks (IKD), gap, pola, label gap, dan skor prioritas (SPA) dipindahkan apa adanya dari sheet 05. Rata-rata unit dan lembaga (indeks, lima subskala, angka kondisi, gap harapan, gap tim) dihitung ulang oleh pembaca dari baris individu yang sudah bersih dari isian ganda (permintaan pemilik produk 2026-09-17); sheet 07 tidak dipakai lagi untuk angka itu, hanya untuk daftar unit dan jumlah pegawai. Rumusnya rata-rata biasa, sama dengan cara sheet 07 menghitungnya (dibuktikan: pada data mentah hasilnya identik). Yang dijumlahkan pembaca hanya sebaran yang tidak tersedia sebagai tabel di berkas: jumlah orang per angka kondisi per unit, histogram skor, porsi indikator Form B, jumlah alasan per unit, dan kendali mutu pengisian pimpinan.
- Antar-sheet ditautkan lewat kolom bantu. Baris ke-n di sheet 03 sama dengan baris ke-n di Personal Form (sudah diverifikasi: 0 selisih). Sheet 05 menunjuk ke 03 lewat `H: Baris 03` dan ke 04 lewat `H: Baris 04`. Sheet 06 menunjuk ke 05 lewat `H: Baris 05`. Sheet 08 menunjuk ke Personal Form lewat `Baris PF`. Karena ada 26 nama ganda (52 baris), id individu memakai nomor baris (`p42`), bukan nama.
- **Isian ganda dibuang di pembaca** (permintaan pemilik produk 2026-09-17). Baris dengan nama, unit, dan jabatan yang sama dianggap orang yang sama mengisi dua kali; yang dipakai isian terakhir (baris paling bawah). Pada Athirah ada 25 baris seperti itu (`meta.isianGanda`), 11 di antaranya sempat menduduki kursi peserta. Supaya daftar tetap 200 orang, pembaca menerapkan ulang aturan pembagian kursi yang tertulis di sheet 06 Ringkasan 2 (`susunPeserta`): penanda otomatis (Minta sendiri, Disampaikan ke atasan) masuk lewat jalur Penanda; sisa kursi dibagi ke unit sebanding jumlah pengisi, dibulatkan ke bawah, sisa pembulatan ke unit ber-SPA rata-rata tertinggi; tiap unit diisi SPA tertinggi yang belum masuk; kursi kosong jadi Sisa kursi. Aturan ini diuji dulu pada data mentah dan harus menghasilkan daftar berkas persis (`meta.kursi.cocokDenganBerkas`); kalau tidak cocok, daftar berkas dipakai apa adanya. Pada Athirah hasilnya cocok, dan setelah bersih: penanda 128, kuota 72, sisa 0. Nama sama di unit atau jabatan lain (Nuraeni, S.Pd.: guru SD dan kepala SMP) dianggap orang berbeda dan hanya diberi catatan. Rata-rata unit dan lembaga ikut dihitung ulang dari baris bersih (lihat Alur data), jadi tidak ada angka yang masih memuat isian ganda.
- Data contoh ada di `web/src/pages/sw/data/sw.contoh.json`. Buat ulang dengan `npm run sw:contoh`. Datanya buatan, berbentuk sama, dan melewati pembaca yang sama.

## Menjalankan

```bash
cd web
npm run sw:baca -- "C:/path/Data Wellbeing Athirah - Final.xlsx" --sekolah <school_id> --periode 2026-09 --lembaga "Sekolah Islam Athirah" --slug athirah
npm test
npm run dev   # buka http://localhost:5173/?preview=sw
```

Halaman pratinjau `?preview=sw` bisa berganti peran dan sumber data (contoh atau berkas lokal). Catatan tindak lanjut di sana hanya disimpan di memori.

Untuk produksi:

1. Jalankan migration `supabase/migrations/20260917100000_sw_screening_awal_wellbeing.sql`. Uji lokalnya ada di `supabase/tests/sw_baseline.sql` dan `supabase/tests/sw_verify.sql`, 23 skenario, semuanya lulus.
2. Tempel `<slug>.seed.sql` di SQL Editor.
3. Aktifkan modul `sw` untuk sekolah itu di Admin Fammi.
4. Buat akun dengan peran `HumanCapital`, `KepalaUnit`, atau `Pegawai`. Isi `profiles.sw_unit_id` untuk kepala unit dan `profiles.sw_individu_id` untuk pegawai. Layar admin untuk menautkan akun belum ada, jadi pengisian masih lewat SQL.

## Peran

| Peran FIR | Peran modul | Yang dilihat |
|---|---|---|
| `Yayasan` | yayasan | Semua agregat. Daftar Peserta berupa jumlah per unit. Pandangan Atasan tanpa cek cara mengisi. |
| `KepalaUnit` | kepalaUnit | Agregat unitnya sendiri dengan lembaga sebagai pembanding. Tanpa nama. Tanpa tab Pandangan Atasan. |
| `HumanCapital` | hc | Semuanya, termasuk daftar bernama, Profil Pegawai, catatan tindak lanjut, dan cek cara atasan mengisi. |
| `Pegawai` | pegawai | Profil Pegawai dirinya sendiri saja, dalam shell ponsel. |

Unit dengan pengisi di bawah `asumsi.minPengisiUnit` (bawaan 10) tidak tampil sebagai baris terpisah bagi selain Human Capital. Aturan ini ditegakkan di dua tempat: di RLS `sw_unit`, dan di satu fungsi React `unitBolehTampil` yang dipakai semua layar.

Log akses profil dan panel asumsi sempat dibuat untuk alur psikolog, lalu dikeluarkan (2026-09-17) karena pembaca modul ini yayasan dan Human Capital. Ambang dan bobot tetap dibaca dari berkas olahan; mengubahnya berarti mengolah ulang berkas di hulu.

## Tata letak ruang kendali

Atas instruksi pemilik produk (2026-09-17), laporan dibuat untuk layar laptop 1366x768 dan dibaca seperti ruang kendali:

- Setiap tab muat satu layar tanpa gulir. `SwLaporan` mengukur tinggi jendela dan mengunci tinggi modul (hanya di lebar ≥ 1024 px); isi tab mengisi sisa tinggi. Yang boleh bergulir hanya dialog: daftar nama, tabel angka, rincian unit, kutipan, dan jawaban panjang pegawai.
- Di layar pendek (tinggi ≤ 720 px, misalnya Chrome dengan bilah bookmark) jarak antarkartu dan ruang dalam kartu mengecil lewat token `--fm-jarak`, `--fm-kartu-pad`, dan `--fm-kepala-kartu`. Ukuran huruf tidak ikut mengecil; paling kecil 13 px.
- Semua progress bar memakai satu tebal, `--fm-bar` (12 px). Jangan memberi tebal sendiri di satu grafik.
- Teks di atas latar ungu tua, ungu, atau ungu sedang selalu putih; di atas emas dan jingga selalu gelap.
- Diperiksa dengan jendela 1366x650 dan 1366x620 untuk keempat peran: tidak ada kartu yang meluap dan tidak ada judul yang terpotong.
- Teks di atas jingga dan jingga muda (`--fm-jingga-muda`) selalu putih; tulisan gelap hanya di atas emas.
- Setiap legenda, chip, dan label grafik punya tooltip (`Petunjuk` di `SwUi.jsx`; teksnya dari kolom `panjang` di `swMeta.js`). Tooltip dirender lewat portal ke dialog yang terbuka atau ke body supaya tidak terpotong kartu.
- Grafik masuk dengan animasi singkat setiap kali tab dibuka (keyframes di `SwUi.module.css`, dimatikan pada `prefers-reduced-motion`). Bentuknya beragam: donat, radar lima aspek, wafel 10x10, lima wajah untuk angka kondisi, kotak 2x2 pandangan atasan, bar tunggal dan bertumpuk.
- Profil Pegawai untuk Human Capital dibuka lewat pemilih: klik unit di kiri, lalu nama di kanan; urutannya bisa diganti (`URUTAN_PROFIL` di `swMeta.js`: skor prioritas, skor terendah, beban, energi, keseharian, dukungan, makna, rasanya bekerja, selisih dengan atasan, nama). Semua angkanya final dari berkas.
- Tidak ada unduh CSV: nama tidak boleh keluar dari layar yang dijaga RLS.
- Peran Pegawai memakai `SwPegawaiLaporan` yang mobile-first: satu kolom, tiga bagian lewat bilah bawah. Di laptop lebarnya dibatasi seperti layar ponsel.
- Wording: "tidak berharap membaik" diganti "merasa akan tetap berat" (angka sekarang 2 ke bawah dan harapan 3 bulan lagi hampir tidak naik). Dialog pola pengisian atasan tidak memakai kata wajar/tidak wajar; tandanya "beda dari kebanyakan".

## Asumsi yang perlu dikonfirmasi pemilik produk

1. **Harapan datar.** Brief menulis "tidak menargetkan kenaikan". Sheet 05 ternyata memberi penanda itu pada angka kondisi ≤ 2 dengan selisih target ≤ 1, jadi orang yang menargetkan naik satu angka ikut terhitung. Lencana mengikuti aturan berkas (`asumsi.harapanDatar`). Kartu "merasa berat sekarang dan mengira 3 bulan lagi masih sama beratnya" di tab Suara Pegawai memakai rumusan brief (≤ 3, selisih ≤ 0). Akibatnya dua angka ini berbeda: 53 peserta dan 76 pengisi (setelah isian ganda dibuang dan kursi dibagi ulang).
2. **Empat kelompok pandangan.** Kelompok diambil dari kolom Pola di berkas: "Tekanan tak terlihat" menjadi "Berat, atasan belum tahu", "Selisih sudut pandang" menjadi "Atasan melihat berat". Pola "Selaras" dipisah menjadi "Berat, atasan tahu" atau "Sama-sama baik" dengan batas 30 pada skor berat yang dirasakan. Batas 30 ini tidak ada di berkas.
3. **Ambang kendali mutu pimpinan.** Terlalu banyak: porsi indikator per orang ≥ 50%. Terlalu sedikit: kurang dari 0,5 centang per orang. Memusat: ≥ 60% centang ada pada 20% nama teratas, untuk tim ≥ 5 orang. Ini usulan, bukan dari berkas. Pada data Athirah, 7 atasan tertandai "mencentang terlalu banyak".
4. **Pegawai melihat centang atasannya** (bagian Pandangan atasan di profil). Ini sesuai brief, karena hanya catatan tindak lanjut yang dibatasi. Tetapi pengamatan atasan menjadi terlihat oleh anggota tim. Perlu dipastikan memang itu yang diinginkan.
5. **Makna tanda gap.** Gap Beban dan Energi positif berarti terasa lebih berat daripada yang teramati. Gap Dukungan positif berarti atasan melihat lebih banyak kekuatan daripada dukungan yang dirasakan. Arah ini disimpulkan dari data; rumus Gap Energi di berkas tidak bisa diturunkan sepenuhnya.
6. **Nama tema yang diganti.** "Kesehatan fisik & mental" ditampilkan sebagai "Kondisi fisik & pikiran". "Kondisi pribadi, keluarga & kesehatan" ditampilkan sebagai "Kondisi pribadi, keluarga & fisik".
7. **Masa kerja.** Isian gabungan "1 sampai 3, 4 sampai 7" ditampilkan sebagai "1 sampai 7 tahun".
8. **Nama ganda.** Ada 26 nama ganda di berkas, dan sheet 06 mencatat 9 baris kembar di daftar peserta. Profil yang terkena diberi catatan, tetapi belum diputuskan apakah itu orang yang sama.
