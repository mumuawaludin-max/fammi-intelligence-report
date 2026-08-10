# Rapor Karakter Multi-Sumber Refleksi, Konsep dan Plan Development

Status: draf untuk ditinjau pemilik produk. Disusun 2026-08-10 dari analisis file
`Summary Kelompok SMK Telkom Purwokerto.xlsx` dan kode modul Karakter yang berjalan sekarang.

## 1. Masalah

Modul Rapor Karakter hari ini mengasumsikan satu kombinasi sumber data: skor pencapaian dari
observasi guru, plus refleksi bulanan dari orang tua. Asumsi ini tertanam sampai ke nama tabel
(`karakter_pernyataan_ortu`), nama kolom Excel yang dicari importer, konstanta teks opsi kuesioner
di kode React, dan kurang lebih 35 label UI.

SMK Telkom Purwokerto datang dengan bentuk baru: selain observasi guru dan refleksi orang tua,
ada **refleksi siswa (remaja)** yang mengisi instrumen versi mereka sendiri. Ke depan akan ada
sekolah yang hanya memakai refleksi remaja tanpa refleksi orang tua. Jadi ada tiga varian sekolah
yang harus dilayani satu modul:

| Varian | Skor | Refleksi orang tua | Refleksi siswa | Contoh |
|---|---|---|---|---|
| A | guru | ya | tidak | SDIP Al Madani, KB TK Istiqamah (kondisi sekarang) |
| B | guru | ya | ya | SMK Telkom Purwokerto |
| C | guru | tidak | ya | sekolah mendatang |

## 2. Temuan dari file SMK Telkom Purwokerto

7 sheet, 23 kelas, 2 jenjang (Kelas 10 dan 11), 3 periode (Maret, April, Mei 2026),
4 karakter (Empati, Inisiatif, Resilience, 7 Kebiasaan), 16 indikator.

Temuan kunci: **refleksi siswa bukan tipe data baru, melainkan saluran responden kedua dengan
skema identik dengan refleksi orang tua.** Sheet `detail_pernyataan_siswa` punya kolom yang
satu-satu sejajar dengan `detail_pernyataan_orangtua`:

| Kolom orang tua | Kolom siswa | Kolom DB sekarang |
|---|---|---|
| `pernyataan_orangtua` | `pernyataan_siswa` | `pernyataan` |
| `emosi_anak` | `emosi_siswa` | `emosi_anak` |
| `alasan_emosi_anak` | `alasan_emosi_siswa` | `alasan_emosi` |
| `dukungan_yang_dibutuhkan_orangtua` | `dukungan_yang_dibutuhkan_siswa` | `dukungan_dibutuhkan` |
| `dukungan_lainya` | `dukungan_lainya` | `dukungan_lainnya` |
| `hal_yang_disyukuri_orangtua` | `hal_yang_disyukuri_siswa` | `hal_disyukuri` |
| `kategori_pernyataan` | `kategori_pernyataan` | `kategori_pernyataan` |

Yang berbeda hanya diksi opsi jawaban (versi "aku") dan makna field emosi: `emosi_anak` versi
orang tua adalah penilaian pihak ketiga terhadap anak, `emosi_siswa` adalah lapor diri.

Sheet summary juga sudah membawa blok siswa berdampingan dengan blok orang tua dan guru:
`pencapaian_siswa` (partisipasi input), `rata_input_siswa_karakterN_*` (rata-rata penilaian diri
per karakter), `rata_pencapaian_siswa`, `perasaan_siswa_*`, `pernyataan_siswa_*`,
`disyukuri_*` dan `dukungan_*` versi siswa. Karena importer sudah men-spread seluruh baris summary
mentah ke `karakter_summary.ringkasan` (jsonb), blok siswa ini akan ikut tersimpan tanpa perubahan
apa pun; yang belum ada hanyalah kode yang membacanya.

### 2.1 Opsi jawaban instrumen siswa (diekstrak dari data asli, dengan jumlah kemunculan)

`dukungan_yang_dibutuhkan_siswa`, 8 opsi:

1. Kegiatan seru di sekolah (misalnya event, lomba, klub hobi) [877]
2. Rekomendasi aktivitas positif di luar sekolah (misalnya olahraga, seni, volunteering) [634]
3. Bimbingan atau motivasi dari guru (supaya lebih semangat) [623]
4. Diskusi atau sharing bareng teman/guru tentang hal yang bikin penasaran [522]
5. Tips belajar efektif dan manajemen waktu [452]
6. Konsultasi pribadi dengan guru atau konselor (kalau ada masalah pribadi/sekolah) [351]
7. Belum tahu, tapi ingin coba ikut kegiatan lebih aktif bulan depan [193]
8. Tidak ada yang saya butuhkan saat ini [90]

`hal_yang_disyukuri_siswa`, 9 opsi:

1. Ada perubahan positif kecil pada diriku (misalnya lebih rajin, lebih percaya diri) [896]
2. Aku merasa lebih mandiri (misalnya berani ambil keputusan sendiri) [841]
3. Aku merasa lebih dekat dengan teman atau keluarga [715]
4. Aku mulai bisa mengontrol emosi/masalah lebih baik [662]
5. Aku merasa lebih paham tentang diriku sendiri [528]
6. Guru atau sekolah peduli dan memberi perhatian pada aku [320]
7. Aku belum merasakan hal tertentu, tapi tetap ingin berproses [312]
8. Ada hal baik lain yang bikin aku bersyukur (tuliskan) [213]
9. Belum ada yang bisa aku syukuri bulan ini [38]

`kategori_pernyataan`: Ucapan Terimakasih [1066], Harapan [454], Saran dan Masukan [378],
**Keluhan [204]**. Nilai "Keluhan" belum ada di daftar pencocokan
`KATEGORI_PERNYATAAN_OPTIONS` (kode hanya kenal "Kritik"), jadi perlu ditambah.

`emosi_siswa`: Netral [688], Positif [426], Sangat Positif [247], Negatif [61],
**Sangat Negatif [21]**. `EMOSI_ORDER` di `karakterMeta.js:410` belum punya entri
"Sangat Negatif"; 21 baris ini akan hilang diam-diam kalau tidak ditambah. Perbaikan ini
sekalian menutup celah yang sama di jalur orang tua.

### 2.2 Kualitas file yang perlu dibereskan bersama tim data

1. `summary_kelas` header kolom ke-7 berisi literal `100 %`, bukan nama kolom
   (seharusnya `persentase_pencapaian_guru`). Ikut ter-spread ke jsonb sebagai kunci `100 %`.
2. `summary_kelas` punya kolom `input_orangtua_karakterN_*` dobel (indeks 8-11 dan 21-24);
   saat spread ke jsonb, nilai terakhir yang menang.
3. `summary_sekolah` berisi 4 baris per bulan (tampak per unit/jenjang) plus blok agregat kedua
   di bawahnya dengan format header sendiri. Importer mengharapkan satu baris per periode untuk
   scope sekolah; harus disepakati baris mana yang jadi acuan, lalu file dirapikan atau importer
   diberi aturan pilih baris.
4. `summary_jenjang` ada baris dengan kolom terpotong (baris Kelas 11 tanpa blok siswa).
5. Partisipasi timpang antar kelas; ada kelas dengan 0 input orang tua sekaligus 0 input siswa.
   Tampilan harus jujur menampilkan cakupan input, bukan menyembunyikannya.

## 3. Kondisi kode sekarang, di mana asumsi "hanya orang tua" tertanam

Ringkasan audit (detail file:line ada di tiap fase rencana):

- **Skema DB.** `karakter_pernyataan_ortu` tanpa kolom penanda sumber; unique constraint
  `(sekolah_id, murid_id, periode_id)` mengunci satu refleksi per anak per bulan, tidak ada slot
  untuk responden kedua. Kolom `sumber` di `karakter_skor` ada tapi selalu `'guru'` dan tidak
  pernah dibaca.
- **Importer** (`web/src/pages/admin/importers/karakterImporter.js`). Nama sheet
  `detail_pernyataan_orangtua` dan tiga nama kolom berakhiran `orangtua` dicari literal;
  pre-flight gagal total kalau kolom `pernyataan_orangtua` tidak ada.
- **Konstanta opsi** (`web/src/pages/karakter/karakterMeta.js:310-347`). Teks lengkap opsi
  kuesioner orang tua dipakai untuk pencocokan substring. Instrumen siswa tidak akan cocok satu
  pun; bar chart tampil nol.
- **Label UI**, kurang lebih 35 titik di `KarakterShared.jsx`, `KepsekView.jsx`,
  `WaliKelasView.jsx`, `YayasanView.jsx`: judul "Suara Orang Tua", "Perkembangan Citra Sekolah di
  Mata Orang Tua", satuan hitung "N orang tua memilih", fallback nama "Orang tua", label
  "Perasaan anak menurut orang tua", dan seterusnya.
- **Yang sudah generik** (tidak perlu disentuh): jumlah aspek dan indikator dideteksi dinamis
  dari header; label aspek dari `karakter_aspek_config` per sekolah; parsing summary jsonb.
- **Desain lama sudah mengantisipasi ini.** `docs/Skema_Data_dan_Mesin_Tampilan_FIR_v1.md:282`
  pernah merancang enum sumber `sekolah | rumah | lapor_diri`. Konsep ini tinggal dihidupkan.

## 4. Konsep pengembangan

Prinsip: **sumber refleksi jadi dimensi data, bukan modul baru dan bukan fork tampilan.**
Satu mesin tampilan, perbedaan antar sekolah datang dari data (sesuai keputusan arsitektur
terkunci nomor 4).

1. Tabel `karakter_pernyataan_ortu` mendapat kolom `sumber` (`'orangtua' | 'siswa'`), baris lama
   di-backfill `'orangtua'`. Nama tabel dipertahankan supaya RLS, RPC, dan kode tidak perlu
   dirombak; nama lama dicatat sebagai peninggalan di komentar tabel.
2. Unique constraint jadi `(sekolah_id, murid_id, periode_id, sumber)`: satu refleksi per anak
   per bulan **per sumber**.
3. Varian sekolah **tidak dikonfigurasi manual**; sumber yang tampil diturunkan dari data yang
   ada: baris `karakter_pernyataan_ortu` per `sumber`, plus kunci summary (`pencapaian_siswa`,
   `rata_pencapaian_orangtua`, dst). Sekolah varian A tidak berubah sama sekali, varian C otomatis
   tidak menampilkan apa pun tentang orang tua. Tidak perlu tabel config baru; kalau kelak butuh
   override manual, baru dipertimbangkan.
4. Skor pencapaian tetap satu sumber (`guru`) di tabel detail. Penilaian diri siswa level
   agregat (kelas/jenjang/sekolah) dibaca dari `karakter_summary.ringkasan`, sejajar dengan cara
   penilaian orang tua ditampilkan hari ini.
5. Semua teks yang berbeda per responden dikumpulkan di satu meta:

```js
// karakterMeta.js (konsep)
export const REFLEKSI_META = {
  orangtua: {
    label: "Orang Tua", satuan: "orang tua", icon: "👪",
    emosiLabel: "Perasaan anak menurut orang tua",
    kategoriOptions, dukunganOptions: DUKUNGAN_OPTIONS_ORTU,
    disyukuriOptions: HAL_DISYUKURI_OPTIONS_ORTU,
    summaryKeys: { pencapaian: "pencapaian_orangtua", rataAspekPrefix: "rata_input_orangtua_", ... },
  },
  siswa: {
    label: "Siswa", satuan: "siswa", icon: "🧑‍🎓",
    emosiLabel: "Perasaan yang dilaporkan siswa sendiri",
    kategoriOptions, dukunganOptions: DUKUNGAN_OPTIONS_SISWA,
    disyukuriOptions: HAL_DISYUKURI_OPTIONS_SISWA,
    summaryKeys: { pencapaian: "pencapaian_siswa", rataAspekPrefix: "rata_input_siswa_", ... },
  },
};
```

Komponen refleksi (`ParentVoiceBento`, `ReflectionBlock`, dialog kutipan) menerima `sumber` dan
membaca semua teks dari meta ini, bukan dari string tertanam.

## 5. Seperti apa tampilannya per varian

### Varian A, orang tua saja (sekolah existing)

Tidak ada perubahan yang terlihat. Semua label dan section persis seperti sekarang. Ini kriteria
penerimaan paling penting: SDIP Al Madani dan KB TK Istiqamah tidak boleh berubah sepiksel pun
secara struktur.

### Varian B, orang tua + siswa (SMK Telkom Purwokerto)

Section refleksi mendapat **saklar sumber** (segmented control ala PickerPanel) di kepala section.
Satu saklar mengganti isi seluruh bento di bawahnya; tidak ada duplikasi section supaya halaman
tidak dua kali lebih panjang.

```
┌───────────────────────────────────────────────────────────────┐
│ 💬 Suara Orang Tua & Siswa                                     │
│ Sinyal dari rumah dan dari siswa sendiri ...                   │
│                              ┌──────────────┬───────────────┐ │
│                              │ 👪 Orang Tua │ 🧑‍🎓 Siswa ●    │ │
│                              └──────────────┴───────────────┘ │
├───────────────────────────────────────────────────────────────┤
│ [Perasaan yang dilaporkan     [Kategori pernyataan]           │
│  siswa sendiri]                Apresiasi / Harapan /          │
│  😄 247  🙂 426  😐 688         Saran / Keluhan                │
│  😟 61   😞 21                                                 │
├───────────────────────────────────────────────────────────────┤
│ [Hal yang disyukuri siswa]    [Dukungan yang dibutuhkan]      │
│  "Ada perubahan positif        "Kegiatan seru di sekolah" 877 │
│   kecil pada diriku" 896       "Rekomendasi aktivitas..." 634 │
│  ...                           ...                            │
├───────────────────────────────────────────────────────────────┤
│ [Kutipan pernyataan siswa, tag kategori, tombol teruskan]     │
│  cakupan input: 128 dari 720 siswa mengisi (17,8%)            │
└───────────────────────────────────────────────────────────────┘
```

Perubahan lain di varian B:

- Judul mega-kategori jadi "Perkembangan Citra Sekolah di Mata Orang Tua & Siswa".
- Dialog jenjang di KepsekView menampilkan tiga donut berdampingan: 👨‍🏫 Penilaian Guru,
  👪 Penilaian Orang Tua, 🧑‍🎓 Penilaian Diri Siswa (dari `rata_input_siswa_*`). Donut hanya
  muncul kalau kuncinya ada di ringkasan, jadi tidak perlu cabang per varian.
- Halaman per murid di WaliKelasView menumpuk dua blok refleksi dengan badge sumber:
  "💬 Refleksi orang tua anak ini" lalu "🧑‍🎓 Refleksi anak ini sendiri". Blok yang kosong
  menampilkan empty state masing-masing.
- Tiap blok refleksi selalu menampilkan cakupan input per sumber (partisipasi SMK timpang;
  angka tanpa konteks cakupan menyesatkan).

### Varian C, siswa saja

Sama seperti varian B tapi tanpa saklar dan tanpa jejak orang tua:

- Judul section: "💬 Suara Siswa", subtitle versi lapor diri.
- Mega-kategori: "Perkembangan Citra Sekolah di Mata Siswa".
- Dialog jenjang: dua donut (guru, siswa).
- Bucket tindak lanjut "Untuk orang tua" di `TindakLanjutGrouped`/`KebijakanGoals` tetap ada
  sebagai konsep (tindak lanjut bisa saja menyasar orang tua walau refleksinya dari siswa),
  tapi kalau kosong tidak dirender, perilaku yang sudah ada sekarang.

## 6. Plan development

### Fase 0, keputusan produk yang harus dikunci dulu

1. Sebutan di UI: "Siswa" atau "Remaja"? Rekomendasi: **Siswa**, konsisten dengan file data dan
   netral untuk jenjang lain yang kelak memakai instrumen serupa.
2. Kutipan refleksi siswa tampil bernama untuk Wali Kelas dan Kepsek? Sensitivitas Karakter
   selama ini "normal" (nama tampil), tapi isi refleksi siswa memuat keluhan personal, kadang
   menyebut guru tertentu. Rekomendasi: tetap bernama untuk Wali Kelas dan Kepsek (sesuai kelas
   dan sekolahnya), Yayasan hanya melihat agregat tanpa kutipan bernama; butuh konfirmasi.
3. Label kategori "Keluhan": ditampilkan apa adanya ("Keluhan") atau disatukan dengan "Kritik"?
   Rekomendasi: satu bucket dengan label "Kritik & Keluhan".
4. Pembersihan file (bagian 2.2): dibereskan di sisi file oleh tim data, atau importer diberi
   toleransi? Rekomendasi: file dirapikan; importer cukup menolak dengan pesan jelas.
5. Emosi "Sangat Negatif" masuk tone `waspada` di UI? Rekomendasi: ya.

### Fase 1, fondasi data (migration + RPC), sekitar setengah hari

Migration baru `supabase/migrations/2026xxxx_karakter_refleksi_multi_sumber.sql`:

- `ALTER TABLE karakter_pernyataan_ortu ADD COLUMN sumber text NOT NULL DEFAULT 'orangtua'`
  plus check constraint `sumber IN ('orangtua','siswa')`. Default sekalian jadi backfill.
- Ganti unique: drop `(sekolah_id, murid_id, periode_id)` (dibuat di
  `20260707120000_karakter_unique_constraints.sql:64-66`), buat
  `(sekolah_id, murid_id, periode_id, sumber)`.
- Tambah "Sangat Negatif" tidak butuh migrasi (nilai bebas di kolom teks).
- RLS tidak berubah; policy menyaring per sekolah/murid dan buta terhadap sumber
  (`20260711100000_rls_scope_hardening.sql:90-92` tetap berlaku).
- Revisi RPC `import_karakter_periode` (`20260712100000_import_karakter_rpc.sql`):
  tiap item pernyataan membawa `sumber`, dan **delete-then-insert pernyataan jadi per
  (sekolah, periode, sumber)**, hanya untuk sumber yang hadir di payload. Tanpa ini, upload file
  yang cuma berisi sheet siswa akan menghapus refleksi orang tua satu periode.
- Seed config SMK Telkom Purwokerto: baris `schools`, `school_modules (modul='karakter')`,
  `karakter_aspek_config` (4 aspek) dan `karakter_indikator_config` (16 indikator, kode persis
  dari header file, mis. `indikator1_dengar_pendapat_sebelum_menanggapi`), mengikuti pola seed
  sekolah sebelumnya.

### Fase 2, importer, sekitar 1 hari

`web/src/pages/admin/importers/karakterImporter.js`:

- Kenali sheet `detail_pernyataan_siswa` (opsional, sejajar `detail_pernyataan_orangtua`),
  pemetaan kolom sesuai tabel di bagian 2, semua baris diberi `sumber: 'siswa'`.
- Pre-flight per sheet: sheet refleksi yang hadir tapi kolom penandanya tidak ketemu menggagalkan
  parse dengan pesan daftar header (perilaku sekarang), tapi ketidakhadiran salah satu sheet
  refleksi bukan error; minimal satu dari dua sheet refleksi cukup, dan keduanya boleh absen
  (skor saja tetap sah, seperti sekarang).
- Ringkasan hasil parse di UI Upload menampilkan hitungan per sumber
  ("refleksi orang tua: N baris, refleksi siswa: M baris") supaya admin sadar varian file.
- `sumber: 'guru'` di skor tidak berubah.

### Fase 3, meta dan assembler, sekitar 1 hari

`web/src/pages/karakter/karakterMeta.js`:

- Tambah `DUKUNGAN_OPTIONS_SISWA` dan `HAL_DISYUKURI_OPTIONS_SISWA` (teks persis dari bagian
  2.1; pencocokan substring lewat `countMultiValue` sudah terbukti bekerja untuk pola ini).
- Tambah `{ match: "Keluhan" }` ke opsi kategori (label sesuai keputusan fase 0 nomor 3).
- Tambah "Sangat Negatif" ke `EMOSI_ORDER` dengan tone `waspada`.
- Bangun `REFLEKSI_META` (bagian 4 nomor 5) dan resolver kunci summary per sumber.

`web/src/pages/karakter/useKarakterData.js`:

- Query `karakter_pernyataan_ortu` tidak berubah (kolom `sumber` ikut terbaca).
- Tiap hook menurunkan `sumberRefleksi` (subset dari `['orangtua','siswa']`) per periode dari
  baris pernyataan dan kunci ringkasan, lalu mengiris baris pernyataan per sumber di `useMemo`
  yang sudah ada.

### Fase 4, UI tiga view, sekitar 2 sampai 3 hari

- `KarakterShared.jsx`: generalisasi `ParentVoiceBento` jadi `VoiceBento({ sumber, meta, rows,
  ... })`; semua label tertanam ("N orang tua memilih", "Belum ada refleksi orang tua...",
  fallback "Orang tua", judul dialog teruskan, teks WhatsApp) pindah ke `REFLEKSI_META`.
  `ReflectionBlock` menerima daftar blok per sumber untuk halaman per murid.
- Saklar sumber di kepala section refleksi (muncul hanya kalau `sumberRefleksi.length > 1`),
  dipakai identik di `KepsekView.jsx`, `WaliKelasView.jsx`, `YayasanView.jsx`.
- Judul mega-kategori dan subtitle section dihitung dari `sumberRefleksi`
  (fungsi kecil di `karakterMeta.js`, bukan ternary tersebar di tiga view).
- Dialog jenjang KepsekView: donut per sumber dirender dari daftar kunci yang tersedia di
  ringkasan (guru, orang tua, siswa), bukan pasangan tetap guru+orang tua.
- Tone `waspada` untuk emosi "Sangat Negatif" di semua bar emosi.
- Empty state per sumber, dan tag cakupan input per sumber di tiap blok refleksi.

### Fase 5, data riil, QA, dan regresi, sekitar 1 hari

- Rapikan file SMK bersama tim data (bagian 2.2), import lewat CMS, verifikasi 3 periode.
- Matriks uji: varian A (SDIP atau KB TK, harus identik dengan sekarang), varian B (SMK, saklar
  dua sumber), varian C (disimulasikan dengan menghapus sheet orang tua dari file uji).
- Regresi console: tidak boleh ada `console.warn` opsi tak dikenali di data ketiga varian.
- Uji peran: Kepsek, WakilKepalaSekolah (wajib identik Kepsek), WaliKelas, Yayasan, AdminFammi.
- Responsif: WaliKelas dan Kepsek di mobile (saklar sumber harus enak disentuh).

Total perkiraan: 5 sampai 7 hari kerja setelah fase 0 dikunci.

## 7. Risiko dan jaga-jaga

1. **Upload parsial menghapus data sumber lain.** Ditutup di fase 1 (delete per sumber). Ini
   risiko terbesar; tanpa itu, semantik delete-then-insert lama menghapus refleksi orang tua
   ketika file hanya membawa sheet siswa.
2. **Teks opsi instrumen berubah antar sekolah.** Pencocokan substring rapuh terhadap revisi
   redaksi kuesioner. Mitigasi: `console.warn` dev yang sudah ada, plus pemeriksaan pre-flight
   di importer bisa ditambah belakangan kalau kasusnya muncul.
3. **Regresi varian A.** Semua perubahan label lewat meta beresiko mengubah teks sekolah
   existing. Mitigasi: nilai meta `orangtua` disalin karakter demi karakter dari string sekarang,
   dan uji varian A membandingkan tampilan sebelum/sesudah.
4. **`karakter_summary` scope sekolah menerima baris ganda** dari format `summary_sekolah` SMK.
   Diselesaikan di fase 0 nomor 4; jangan ditebak di kode.
