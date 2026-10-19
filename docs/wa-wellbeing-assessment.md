# Wellbeing Assessment (modul `wa`)

Asesmen lanjutan dari Screening Awal Wellbeing (`sw`, lihat `docs/sw-screening-awal-wellbeing.md`). Pegawai yang masuk daftar peserta screening mengisi PROTEK (42 pernyataan, enam aspek, skala 1 sampai 6), 12 pernyataan kepuasan kerja (skala 1 sampai 5), enam pilihan ganda, empat pertanyaan terbuka, dan satu cerita tentang kelelahan atau stres. Hasilnya dua laporan dengan dua login:

- **Laporan kelompok** untuk `HumanCapital`, desktop, tujuh tab.
- **Laporan pribadi** untuk `Pegawai`, tampilan ponsel, lima bagian.

Semua angka dan narasi sudah final di berkas olahan (hasil prompt di `docs/Prompt_Wellbeing_Assessment_Excel.md`). FIR membaca, menyaring, dan menampilkan. Narasi baru tayang setelah disetujui di Admin Fammi. Satu-satunya data yang ditulis FIR di modul ini adalah umpan balik pegawai tentang pengalaman asesmen.

Data pertama: Sekolah Islam Athirah (sekolah `ATHIRAH`, dataset `WA-ATHIRAH-2026-10`), berkas `Athirah - Master - Olahan (2).xlsx`, selesai diolah 14 Oktober 2026, diunggah 19 Oktober 2026. Isinya 199 baris, 195 dipakai (isian ganda dibuang di hulu), 40 kelompok (lembaga, 7 jenjang, 25 unit, 7 kelompok jabatan), 148 orang bercerita, 27 cerita bertanda perlu ahli.

Riwayat pengerjaan dan alasan tiap keputusan ada di `docs/wa-wellbeing-assessment-plan.md`. Dokumen ini menjelaskan keadaan sekarang.

## Alur data

```
xlsx olahan ──► npm run wa:baca ──► web/wa-data-lokal/<slug>.json            (pratinjau lokal, tidak di-commit)
                                 └► web/wa-data-lokal/<slug>.seed[.bagian-N].sql (tempel di SQL Editor)
                                                    │
        Supabase: wa_dataset, wa_kelompok, wa_individu, wa_narasi (RLS) ◄── Admin Fammi menyetujui narasi
                                                    │
        useWaData ──► WaLaporan (7 tab, Human Capital)   /   WaPegawaiLaporan (5 bagian, Pegawai)
                                                    │
        Pegawai mengisi umpan balik ──► wa_umpan_balik ──► wa_umpan_balik_ringkasan() ──► tab Dampak Asesmen
```

- **Pembaca** `web/src/pages/wa/lib/waPembaca.js` (fungsi murni `bacaDatasetWa`) memindahkan angka apa adanya dari sheet `INDIVIDU`, `KELOMPOK`, `PILIHAN`, `TESTIMONI`, `ITEM`, `PARAMETER`. Satu-satunya turunan: kategori PROTEK dari rata-rata kelompok, dengan ambang dari sheet `PARAMETER`, karena berkas belum punya kolomnya.
- **Kolom rahasia** tidak pernah masuk data individu atau kelompok: cerita (kolom BB), orang yang dipercaya (BC, BD), nomor WhatsApp (CB), dan jawaban yang minta dirahasiakan. Pengecualian satu: cerita ikut di baris `respons_cerita` milik orang itu sendiri, supaya ia bisa membaca lagi cerita yang ditanggapi. Ada uji yang memeriksanya.
- **Label lama kategori terbawah** di berkas dinormalkan pembaca (`bersihkanKata`) menjadi "Perlu Pendampingan". Kutipan verbatim pegawai tidak diubah.
- **Narasi** dari `laporan_json` dipecah per cakupan: lembaga, jenjang, unit, kelompok jabatan, individu, dan respons cerita. Semua masuk berstatus `menunggu_persetujuan`.
- **Data contoh** ada di `web/src/pages/wa/data/wa.contoh.json`. Buat ulang dengan `npm run wa:contoh`. Isinya buatan (40 orang, sekolah `CONTOH`), melewati pembaca yang sama, dan memuat rekap umpan balik tiruan untuk pratinjau tab Dampak.

## Menjalankan

```bash
cd web
npm run wa:baca -- "C:/path/Athirah - Master - Olahan.xlsx" --sekolah ATHIRAH --periode 2026-10 --lembaga "Sekolah Islam Athirah" --slug athirah
npm test
npm run dev   # buka http://localhost:5173/?preview=wa
```

Pratinjau `?preview=wa` bisa berganti peran (Human Capital, Pegawai), sumber (data contoh atau berkas lokal), dan pegawai. Sakelar "Narasi sudah disetujui" meniru keadaan sebelum persetujuan. Tombol "Ulangi sambutan" dan "Ulangi panduan" membuka lagi dialog dan panduan. Umpan balik di pratinjau hanya tersimpan di memori halaman.

**Pemasangan ke produksi**, urut, dan tiap langkah aman diulang:

1. Migration `supabase/migrations/20261020100000_wa_wellbeing_assessment.sql`.
2. Migration `supabase/migrations/20261021100000_wa_umpan_balik.sql`.
3. Deploy Edge Function `admin-actions` dan `create-user`.
4. Tempel seed hasil `wa:baca` (berkas `bagian-N` berurutan kalau SQL Editor menolak berkas utuh).
5. Aktifkan modul `wa` untuk sekolah itu di Admin Fammi, Sekolah & Modul.
6. Setujui narasi di Admin Fammi, Persetujuan Wellbeing. Tanggapan cerita dibuka satu per satu oleh psikolog.
7. Tautkan akun pegawai di Pengguna & Peran, tombol "Tautkan akun Wellbeing".
8. Uji dengan satu akun Human Capital dan satu akun Pegawai.

Status Athirah per 19 Oktober 2026: langkah 1 sampai 5 selesai, SQL koreksi narasi 2026-10-19 sudah dijalankan, frontend sudah terpasang. Langkah 6 sampai 8 dikerjakan tim.

**Koreksi unit (2026-10-19).** 26 pegawai yang di olahan pertama ber-unit "Tidak teridentifikasi" dikonfirmasi Human Capital lewat Excel konfirmasi (usulan unit diambil dari nama yang sama di data Screening Awal). Unit dan jenjang mereka dipasang di berkas olahan, angka dan narasi kelompok dihitung ulang di Claude chat dengan `docs/Prompt_Wellbeing_Assessment_Koreksi_Unit.md` (berkas Olahan (4)), lalu dipasang lewat `web/wa-data-lokal/athirah.koreksi-unit-2026-10-19.bagian-1..2.sql`. Kelompok "Tidak teridentifikasi" untuk unit dan jenjang hilang; Departemen HC (5 orang) mendapat narasi. Kelompok jabatan "Tidak teridentifikasi" (31 orang) belum dikoreksi.

**Mengoreksi narasi setelah seed tertanam.** Jangan menanam ulang seed: `delete` dataset ikut menghapus persetujuan, suntingan admin, dan umpan balik pegawai (cascade). Ubah data lokal, lalu susun SQL koreksi:

```bash
npm run wa:koreksi -- --lama wa-data-lokal/athirah.lama.json --baru wa-data-lokal/athirah.json --dataset WA-ATHIRAH-2026-10 --keluar wa-data-lokal/athirah.koreksi-<tanggal>
```

Alat ini juga mengganti angka kelompok (`wa_kelompok`) dan data pegawai (`wa_individu`) yang berubah, menambah narasi untuk cakupan baru, dan menghapus kelompok atau narasi yang cakupannya hilang; daftar pegawai harus sama, kalau tidak alat menolak dan seed ulang yang dipakai. Narasi yang isinya berubah diganti dan kembali menunggu persetujuan. Baris yang sudah disunting admin tidak ditimpa. Isian tambahan (`aspek`, `cerita`) dipasang lewat `jsonb_set`; menambah `cerita` tidak mengubah status. Hasilnya dipecah sekitar 550 KB per bagian, urutan menjalankannya bebas, dan bagian terakhir memuat kueri pemeriksa yang seharusnya bernilai nol.

## Peran dan siapa melihat apa

Peran tidak bertambah. `HumanCapital` dan `Pegawai` berasal dari modul `sw`. Akun pegawai ditautkan lewat `profiles.wa_individu_id`; satu akun boleh punya tautan `sw` dan `wa` sekaligus.

| Data | Human Capital | Pegawai | Admin Fammi |
|---|---|---|---|
| Angka kelompok (`wa_kelompok`) | sekolahnya | tidak | semua |
| Angka per pegawai bernama (`wa_individu`) | sekolahnya | barisnya sendiri | semua |
| Narasi kelompok | yang disetujui | tidak | semua |
| Narasi pribadi dan tanggapan cerita, beserta ceritanya | tidak | miliknya, yang disetujui | semua |
| Kolom peninjau (`perlu_ahli`, `alasan_perhatian`) | tidak | tidak | lewat Edge Function |
| Umpan balik per orang (`wa_umpan_balik`) | tidak | miliknya | semua |
| Rekap umpan balik | tanpa identitas, setelah 3 isian | tidak | semua |

- Kolom peninjau ditolak lewat hak akses kolom, jadi query ke `wa_narasi` wajib menyebut kolom satu per satu; `select *` ditolak.
- Human Capital melihat beranda dengan dua tab bersebelahan, Screening Awal dan Wellbeing Assessment. Pegawai yang tertaut ke `wa` langsung masuk laporan `wa`, dan bisa pindah ke laporan Screening Awal lewat Menu kalau akunnya juga tertaut ke sana.
- Pegawai sengaja tidak membaca angka kelompok, jadi laporan pribadi belum punya pembanding lembaga.

## Narasi dan persetujuan

Layar Admin Fammi **Persetujuan Wellbeing** (`screens/PersetujuanWa.jsx`, laci `components/WaNarasiDrawer.jsx`) memakai action `admin-actions`: `list-wa-pending`, `approve-wa`, `reject-wa`, `approve-wa-bulk`, `edit-wa`.

- Narasi kelompok dan laporan pribadi boleh disetujui massal ("Setujui yang tampil").
- Tanggapan cerita dan narasi bertanda perlu ahli tidak ikut "Setujui yang tampil". Server menolaknya tanpa centang "sudah ditinjau psikolog".
- Tombol "Setujui semua respons cerita" menyetujui semua tanggapan cerita yang tampil sekaligus, termasuk yang wajib ditinjau psikolog, setelah peninjau mencentang pernyataan bahwa psikolog sudah meninjau semuanya (`approve-wa-bulk` dengan `tinjauan_ahli: true`, keputusan pemilik produk 2026-10-19). Butuh Edge Function `admin-actions` versi 2026-10-19 atau lebih baru.
- Sunting hanya selama status masih menunggu. Cerita asli pegawai tampil di laci sebagai teks baca saja.
- Kode "terkait" di langkah kecil (huruf PROTEK atau kunci bidang kepuasan) tampil sebagai nama lengkapnya di laci.
- Pemeriksa `qcNarasiWa` memberi lencana peringatan, bukan penegak. Isunya:

| Isu | Arti |
|---|---|
| `kata_terlarang` | label lama kategori terbawah |
| `tanda_hubung` | tanda pisah panjang |
| `diagnosis` | istilah klinis |
| `klise` | kata klise atau hiperbola (`KATA_KLISE`) |
| `tawaran` | narasi pribadi yang menawarkan percakapan atau pendampingan dari Fammi (`KATA_TAWARAN`) |
| `angka` | digit di narasi pribadi |
| `kalimat_banyak` | kalimat terlalu banyak (bukan untuk tanggapan cerita) |
| `tidak_baku` | memakai "kalau" |
| `pola_tanggapan` | tanggapan cerita memakai "wajar", "valid", "bekal berharga", atau "bukan ..., melainkan ..." |
| `jalur_dijanjikan` | tanggapan cerita menjanjikan pegawai dihubungkan ke psikolog |
| `terlalu_panjang` | tanggapan cerita lebih dari 180 kata |

**Isi narasi pribadi** per pegawai: ringkasan (PROTEK dan kepuasan), hal kuat dan tantangan, refleksi, dua sampai tiga langkah kecil, dan `aspek` (penjelasan `arti` dan `langkah` untuk keenam aspek PROTEK, kuat maupun lemah).

**Tanggapan cerita** mengikuti panduan INNER di `docs/Panduan_Tanggapan_Cerita_Wellbeing.md` (keputusan pemilik produk 2026-10-19, menggantikan tiga mode lama). Intinya: 90-150 kata dalam satu sampai tiga paragraf; mulai dari keprihatinan atau jawaban langsung; pertanyaan tentang gejala dijawab dulu tanpa diagnosis; paling banyak satu pertanyaan refleksi; agama hanya bila pegawai memberi isyarat; orang yang dipercaya hanya dari isian pegawai sendiri, lewat perannya; konsultasi psikolog ditulis sebagai pertanyaan ke Human Capital dengan psikolog luar sekolah sebagai pilihan. Tanggapan tidak pernah menawarkan apa pun atas nama Fammi. Untuk orang yang tidak bercerita, teks 25-45 kata di kotak "Untuk Anda". Laporan pegawai memecah tanggapan menjadi paragraf pada baris kosong.

## Laporan Human Capital

`WaPage` → `WaLaporan`. Pemilih cakupan (lembaga, jenjang, unit, jabatan) berlaku untuk enam tab pertama.

| Tab | Isi |
|---|---|
| Ringkasan | Skor PROTEK dan kepuasan dengan narasi, enam huruf PROTEK, enam bidang kepuasan, tiga pernyataan terkuat dan terlemah |
| Kesehatan Mental | Sebaran tiga kategori, sebaran per aspek, lima pegawai per kategori (bernama), dialog daftar lengkap |
| Kepuasan Kerja | Sebaran Puas, Netral, Tidak Puas; enam bidang berbintang; sebaran lima tingkat; lima pegawai per kategori |
| Survey | Dua kesimpulan (kekuatan, perbaikan segera) dan enam kartu pilihan ganda |
| Testimoni | Empat pertanyaan terbuka sebagai saringan, tema jawaban, kutipan bernama yang layak tampil |
| Temuan & Langkah | Temuan dengan angka pendukung, tindak lanjut per pihak, tema cerita tanpa kutipan (minimal lima orang per tema), sebaran wellbeing terhadap kepuasan, perbandingan antarkelompok |
| Dampak Asesmen | Rekap umpan balik pegawai, selalu seluruh lembaga, dimuat ulang tiap 20 detik (lihat bawah) |

Klik nama pegawai membuka profil singkat (`WaProfilDialog`): angka dan pilihan ganda saja, tanpa narasi pribadi.

## Laporan pegawai

`WaPegawaiPage` → `WaPegawaiLaporan`, satu kolom, Menu di bilah atas.

1. **Sambutan wajib** (`WaSambutan`). Tiga langkah: sapaan, kenapa diminta mengisi, lalu isi laporan beserta centang pemahaman. Halaman "siapa yang bisa melihat apa" dihapus (2026-10-19); kerahasiaan cerita dijelaskan di bagian Cerita dan tanggapan. Dialog tidak bisa ditutup sebelum dicentang. Nadanya lugas, bukan penanda masalah, dan bisa dibuka lagi dari Menu.
2. **Panduan** (`WaTur`, isi di `lib/waTur.js`) terbuka sendiri setelah sambutan pada kunjungan pertama di perangkat itu. Ada 15 langkah, termasuk arti PROTEK huruf demi huruf, dan bisa dibuka lagi dari tombol kompas atau Menu.
3. **Lima bagian:**
   - *Ringkasan:* skor, enam aspek, kepuasan, pernyataan kuat dan lemah, ajakan ke tanggapan cerita dan umpan balik.
   - *Aspek Kuat* dan *Perlu Penguatan*.
   - *Refleksi Saya:* pertanyaan renungan, pilihan di survei, langkah kecil, cerita dan tanggapan, jawaban terbuka.
   - *Umpan Balik.*
4. **Penjelasan per aspek.** Setiap aspek bisa diketuk dan membuka lembar berisi arti aspek, "Artinya untuk Anda", "Yang bisa dilakukan", dan tujuh pernyataannya.
5. **Cerita dan tanggapan.** "Cerita yang Anda tulis" tampil di atas "Tanggapan untuk cerita Anda". Selama tanggapan belum disetujui, yang tampil kartu "sedang ditinjau".

Kedua laporan menampilkan **"Diperbarui <hari, tanggal>"**. Tanggalnya yang terbaru di antara data diunggah (`wa_dataset.created_at`) dan narasi yang bisa dibaca orang itu dirilis (`disetujui_pada`). Tooltip-nya merinci tanggal selesai diolah tim ahli Fammi, diunggah, dan dirilis. Fungsinya satu: `tanggalPembaruan` di `lib/waAturan.js`.

## Umpan balik dan Dampak Asesmen

Pertanyaan ada di `PERTANYAAN_UMPAN_BALIK` (`lib/waMeta.js`):

- empat skala bintang 1 sampai 10: kepuasan keseluruhan, kualitas laporan, membantu memahami diri, menyarankan ke rekan;
- tiga pilihan ganda: penjelasan sesuai yang dirasakan; yang ingin dilakukan setelah membaca (boleh lebih dari satu, ada "Lainnya" dengan isian sendiri); merasa diperhatikan lembaga;
- dua esai tidak wajib: alasan nilai, dan yang berubah setelah membaca.

Jawaban bisa diubah kapan saja. **Kode pertanyaan menjadi kunci di data, jadi jangan diganti setelah dipakai.** Kalau maksud pertanyaan berubah, tambahkan kode baru.

Tabel `wa_umpan_balik` menyimpan satu baris per pegawai per dataset (migration `20261021100000`).

- Isian pertama lewat insert, perubahan lewat update kolom `jawaban` saja. Upsert tidak dipakai karena akan ikut menulis kolom kunci yang tidak boleh diubah.
- Fungsi `wa_umpan_balik_ringkasan(dataset_id)` menghitung rata-rata, sebaran 1 sampai 10, hitungan pilihan, esai, dan isian "Lainnya" di Postgres, tanpa identitas.
- Rekap baru terbuka setelah minimal tiga isian. Yang boleh memanggil fungsi ini hanya Human Capital sekolah itu dan Admin Fammi.

Tab **Dampak Asesmen** berisi:

- bilah "Langsung";
- partisipasi (pengisi dari jumlah peserta);
- tiga rata-rata nilai;
- "Setelah membaca laporan, pegawai ingin…" beserta isian "Lainnya";
- rasa diperhatikan dan kesesuaian penjelasan;
- sebaran nilai;
- esai tanpa nama.

## Aturan tampilan dan bahasa

- **Token.** Palet `sw` (`--fm-*` di `sw/swTokens.module.css`) ditambah `--wa-*` di `wa/waTokens.module.css`. Font Google Sans Flex seperti seluruh aplikasi. Pengecualian desain ini tercatat di CLAUDE.md butir (5).
- **Tanpa garis tepi.** Kartu, tombol, tab, dan kutipan tidak memakai garis tepi atau aksen garis berwarna; pembedanya latar lembut dan bayangan. Yang sengaja tetap bergaris hanya pemisah 1px antarbaris daftar, cincin fokus keyboard, dan gambar garis `WaIlustrasi`.
- **Animasi.** Semua bagian dan tombol beranimasi lewat `motion`. `MotionConfig reducedMotion="user"` mematikannya untuk pengguna yang memilih kurangi gerak. Ikon dari `@phosphor-icons/react`.
- **Bahasa sehari-hari**, tanpa hiperbola dan kata klise.
  - Label lama kategori terbawah dilarang di mana pun (ada ujinya); kategori terbawah tampil sebagai "Perlu Pendampingan".
  - Teks untuk pegawai tidak menawarkan apa pun atas nama Fammi.
- **Pernyataan berarah positif.** Daftar pernyataan memakai teks singkat yang sudah diarahkan positif, karena separuh butir PROTEK berbunyi negatif dan skornya dibalik. Kalimat asli kuesioner ada di tooltip laporan kelompok.
- **Panduan.** Bagian yang disorot ditandai atribut `data-tur`, dan bilah yang menempel di atas ditandai `data-tur-lekat`. Uji `waTur.test.js` memastikan setiap target panduan ada di komponen, jadi ganti nama `data-tur` di komponen dan di `lib/waTur.js` sekaligus.
- **Penyimpanan browser.** Penanda "panduan sudah dilihat" disimpan di localStorage (`waSimpanan.js`) karena cuma kenyamanan tampilan. Data pribadi tidak pernah disimpan di browser.

## Tempat mengubah

| Yang diubah | Berkas |
|---|---|
| Label aspek, kategori, pertanyaan survei, pertanyaan umpan balik | `web/src/pages/wa/lib/waMeta.js` |
| Aturan tampil, QC narasi, tanggal pembaruan | `web/src/pages/wa/lib/waAturan.js` |
| Teks panduan | `web/src/pages/wa/lib/waTur.js` |
| Teks sambutan | `web/src/pages/wa/WaSambutan.jsx` |
| Aturan menulis narasi di hulu | `docs/Prompt_Wellbeing_Assessment_Excel.md` |
| Pembacaan berkas olahan | `web/src/pages/wa/lib/waPembaca.js` |
| Seed dan koreksi SQL | `web/scripts/wa/waSql.mjs`, `web/scripts/wa/koreksi-sql.mjs` |
| RLS dan tabel | migration `20261020100000`, `20261021100000` |
| Persetujuan dan akun | `supabase/functions/admin-actions`, `supabase/functions/create-user`, `web/src/pages/admin/screens/PersetujuanWa.jsx`, `web/src/pages/admin/importers/waAkun.js` |

## Uji

- `npm test` dari `web/`: pembaca (kolom rahasia, cerita hanya di tanggapan milik sendiri, normalisasi label), aturan tampil, QC narasi (termasuk tawaran), tanggal pembaruan, isi panduan, pertanyaan umpan balik, penautan akun, dan penyusun SQL koreksi. Per 19 Oktober 2026: 89 lulus.
- RLS di Docker, urutannya ada di `supabase/tests/README.md`:
  - `wa_baseline.sql` + migration `20261020100000` + seed contoh + `wa_verify.sql`: 28 lulus di Postgres 15 dan 17.
  - Ditambah migration `20261021100000` + `wa_umpan_balik_verify.sql`: 23 lulus di Postgres 15 dan 17.

## Keputusan pemilik produk

Sudah diputuskan (semua 2026-10-19):

1. Kategori PROTEK terbawah tampil sebagai "Perlu Pendampingan"; label lama dilarang.
2. Laporan pribadi diawali sambutan wajib yang tidak bisa dilewati.
3. Semua UI beranimasi, termasuk tombol saat ditekan.
4. Tanpa garis tepi dan tanpa hiperbola, termasuk di sambutan.
5. Panduan langkah demi langkah untuk pegawai dan Human Capital.
6. Tanggapan cerita tanpa tawaran dari Fammi; kebutuhan ahli lewat Human Capital.
7. Penjelasan untuk keenam aspek PROTEK, bukan hanya yang lemah.
8. Cerita asli tampil di atas tanggapannya, di laporan pegawai dan di Admin.
9. Tanggal "Diperbarui" dipicu unggah data dan rilis narasi.
10. Umpan balik pegawai dengan skala 1 sampai 10, pilihan ganda, paling banyak dua esai, dan opsi "Lainnya" di pertanyaan rencana.
11. Kalimat "Human Capital hanya melihat rekap" dihapus dari formulir. Aturannya tetap berlaku.
12. Human Capital tidak melihat umpan balik per orang, hanya rekap tanpa identitas.
13. Rekap umpan balik terbuka setelah minimal tiga isian.
14. Tab Dampak Asesmen selalu untuk seluruh lembaga, tidak ikut pemilih cakupan.
15. Sambutan pegawai tiga langkah tanpa halaman "siapa yang bisa melihat apa"; kerahasiaan cerita dijelaskan di bagian Cerita dan tanggapan ("Cerita ini hanya Anda yang tahu").
16. Label tindak lanjut kelompok: "Langkah yang dapat dipertimbangkan untuk dilakukan" dan "Usulan indikator keberhasilan yang dapat diukur".
17. Teks buatan Fammi memakai "jika", bukan "kalau"; tulisan asli pegawai tidak diubah. Untuk 180 narasi Athirah yang sudah ada, penggantian kata ini dipasang TANPA mengulang persetujuan (`athirah.kalau-jika.B-pertahankan-persetujuan`), karena hanya satu kata yang berubah dan maknanya sama. Ini pengecualian sekali pakai dari aturan persetujuan narasi, bukan pola untuk perubahan isi.
18. Tanggapan cerita mengikuti panduan INNER (`docs/Panduan_Tanggapan_Cerita_Wellbeing.md`). Seluruh 195 tanggapan Athirah ditulis ulang 2026-10-19 (`athirah.tanggapan-inner-2026-10-19`) dan kembali menunggu persetujuan; yang wajib ditinjau psikolog tetap ditinjau satu per satu.

Masih terbuka:

1. **Ambang kepuasan** (lima tingkat selebar 0,8; Puas mulai 3,40) dan **ambang pernyataan kuat atau perlu penguatan** (pribadi 5 sampai 6 / 4 / 1 sampai 3; kelompok 5,0 ke atas / di bawah 4,0). Mengubahnya berarti mengolah ulang berkas.
2. **Judul tab "Kesehatan Mental"** masih mengikuti desain, padahal modul `sw` melarang frasa itu sebagai label.
3. **Nama pegawai** di Top 5 dan Testimoni untuk Human Capital (sekarang tampil, ikut desain).
4. **Dua pasang isian ganda** dengan nomor WhatsApp berbeda (R162/R189, R040/R199): satu orang (sekarang) atau dua.
5. **Kolom tambahan di olahan** (`protek_kategori_rata`, `kep_<dimensi>_pct`, `kep_<dimensi>_bintang`) supaya pembaca tidak perlu menurunkan kategori kelompok.
6. **Pengiriman laporan lewat WhatsApp** yang dijanjikan formulir: alur operasional di luar FIR.
7. **Kelompok jabatan tidak jelas** (31 orang) di `CATATAN_QC`: dikonfirmasi Human Capital seperti koreksi unit, atau dibiarkan. Unit 26 orang yang tidak teridentifikasi sudah dikoreksi 2026-10-19.

## Di luar cakupan

- `KepalaUnit` dan `Yayasan` membaca `wa`. Data per unit sudah ada di `wa_kelompok`; `unitId` sama dengan id unit `sw` untuk nama yang sama.
- Pembanding lembaga di laporan pribadi.
- Ekspor Excel daftar pegawai.
- Tren antar periode.
- Unggah berkas olahan lewat Admin Fammi.
- Analisis gabungan peserta `sw` dan `wa`.
