# Rencana Development: Modul Wellbeing Assessment (`wa`)

Status: milestone 1 sampai 5 selesai di kode, belum terpasang di produksi; milestone 6 belum. Lihat "Status eksekusi".
Tanggal: 2026-10-19.

Dokumen ini ditulis supaya agen/model lain bisa mengeksekusi tanpa konteks percakapan.
Baca CLAUDE.md dulu, lalu `docs/sw-screening-awal-wellbeing.md` (modul induk yang polanya
ditiru), lalu `docs/Prompt_Wellbeing_Assessment_Excel.md` (asal berkas olahan), baru dokumen ini.

## Status eksekusi

**Milestone 1 sampai 3 selesai (2026-10-19).** Semua bisa dilihat tanpa Supabase lewat `npm run dev` lalu `http://localhost:5173/?preview=wa` (pilih Data contoh atau Lokal: athirah.json, peran Human Capital atau Pegawai, sakelar "Narasi sudah disetujui" untuk meniru keadaan sebelum persetujuan).

Yang dikerjakan:

- **Milestone 1.** `lib/waPembaca.js` (+ 8 uji), `lib/waAturan.js` (+ 11 uji), `lib/waMeta.js`, CLI `npm run wa:baca` dan `scripts/wa/waSql.mjs` (seed utuh plus pecahan sekitar 800 KB untuk SQL Editor), `npm run wa:contoh`, `wa-data-lokal/` di .gitignore. Berkas Athirah terbaca: 195 individu, 40 kelompok, 417 baris narasi, 27 respons berpenanda perlu ahli. Uji memastikan kolom cerita, orang yang dipercaya, nomor WhatsApp, dan jawaban yang minta dirahasiakan tidak pernah masuk dataset.
- **Milestone 2.** `WaLaporan.jsx` dengan enam tab: lima dari desain ditambah **Temuan & Langkah** (insight dengan angka pendukung yang bisa dibuka, tindak lanjut per pihak dengan langkah dan tanda berhasil, tema cerita tanpa kutipan, sebaran wellbeing terhadap kepuasan per orang yang bisa diklik, perbandingan antarkelompok yang bisa diklik untuk pindah cakupan). Pemilih cakupan lembaga, jenjang, unit, dan jabatan. Dialog profil singkat pegawai untuk Human Capital (`WaProfilDialog.jsx`: angka dan pilihan ganda saja, tanpa narasi pribadi).
- **Milestone 3.** `WaPegawaiLaporan.jsx` (M1 sampai M6) dan `WaSambutan.jsx`: dialog wajib empat langkah sebelum laporan individu bisa dibaca (permintaan pemilik produk 2026-10-19). Tidak bisa ditutup dengan Escape, klik latar, atau tombol; satu-satunya jalan adalah mencentang pernyataan pemahaman lalu menekan "Saya memahami dan siap melihat interpretasi diri saya". Nadanya undangan: suara diprioritaskan, kehadiran berarti, bukan penilaian, bukan diagnosis. Bisa dibuka ulang dari menu "Tentang asesmen ini" tanpa terkunci.
- **Animasi** di seluruh modul memakai `motion` (instruksi pemilik produk): kartu muncul bertahap, bar dan donat tumbuh, angka menghitung naik, tombol mengecil saat ditekan, tab dan bagian berganti dengan geser-pudar, dialog dan lembar bawah meluncur. `MotionConfig reducedMotion="user"` mematikannya untuk pengguna yang memilih kurangi gerak.

Yang berbeda dari rencana di bawah:

- `WaPage` dan `WaPegawaiPage` (titik masuk produksi) dipindah ke milestone 4 karena butuh `useWaData` dan tabel Supabase.
- Kategori PROTEK kelompok diturunkan pembaca dari ambang di sheet PARAMETER, bukan dihitung di React (lihat tabel 8.3).
- Daftar pernyataan di laporan individu memakai teks singkat berarah positif, bukan kalimat asli kuesioner. Separuh butir PROTEK berbunyi negatif dan skornya sudah dibalik; kalimat asli di samping persen tinggi akan terbaca terbalik. Kalimat asli tetap ada di tooltip laporan kelompok.
- Penanda ada-tidaknya cerita dan perlu-ahli tidak disimpan di data individu (yang terbaca Human Capital), hanya di baris narasi `respons_cerita`.
- Kategori terbawah tampil sebagai "Perlu Pendampingan" (keputusan pemilik produk 2026-10-19, butir 11.3); label lama dilarang tampil di mana pun dan ada ujinya. Judul tab "Kesehatan Mental" masih mengikuti desain (`JUDUL_TAB_WELLBEING` di `web/src/pages/wa/lib/waMeta.js`).
- Ilustrasi di kartu hero dan tab Survey adalah gambar garis beranimasi buatan sendiri (`WaIlustrasi.jsx`) sampai berkas SVG desainer tersedia.
- `Dialog` dan `LembarBawah` di `WaUi.jsx` membuka ulang dialog terkunci lewat event `close`, karena Chrome mengabaikan `preventDefault` pada Escape kalau belum ada interaksi pengguna.

**Milestone 4 dan 5 selesai di kode (2026-10-19), belum terpasang di produksi.**

- **Milestone 4.** Migration `supabase/migrations/20261020100000_wa_wellbeing_assessment.sql` (modul `wa`, `profiles.wa_individu_id`, empat tabel, RLS, hak akses kolom). Diuji di Postgres 15 dan 17 lewat `supabase/tests/wa_baseline.sql` + seed data contoh + `wa_verify.sql`: 28 dari 28 lulus, migration aman dijalankan dua kali. Jalur baca `data/useWaData.js`, titik masuk `WaPage.jsx` (Human Capital, tab "Wellbeing Assessment" di NavBar) dan `WaPegawaiPage.jsx` (Pegawai, shell ponsel), `auth.js` membaca `wa_individu_id` dengan query terpisah, `App.jsx` membuka `wa` untuk Human Capital dan mengarahkan Pegawai yang tertaut ke laporan `wa` (bisa berpindah ke Screening Awal bila akunnya juga tertaut ke sana).
- **Milestone 5.** `admin-actions`: `list-wa-pending`, `approve-wa`, `reject-wa`, `approve-wa-bulk`, `edit-wa`, plus `waIndividuId` di `update-profile`. `create-user`: `wa_individu_id`, dan Pegawai cukup tertaut ke salah satu isian `sw` atau `wa`. Admin Fammi: menu **Persetujuan Wellbeing** (saring status, cakupan, wajib-psikolog, cari; lencana kendali mutu; laci tinjau dengan sunting; "Setujui yang tampil" selalu melewati respons cerita dan narasi perlu ahli), isian tautan `wa` di dialog tambah dan edit pengguna (dengan saran nama yang persis sama), dan tombol **Tautkan akun Wellbeing** di Pengguna & Peran yang menautkan akun Screening Awal bernama sama, membuat akun baru untuk sisanya, dan menyerahkan nama yang meragukan ke admin. Modul `wa` muncul di Sekolah & Modul.
- **Perbaikan desain dan Panduan (2026-10-19).** Semua garis tepi dan aksen garis berwarna di kartu, tombol, tab, dan kutipan dibuang; pembedanya latar berwarna lembut. Teks sambutan, keterangan kategori, dan pesan kosong ditulis ulang tanpa hiperbola; QC narasi menandai kata klise. Fitur Panduan (`WaTur.jsx`, `lib/waTur.js`) menyorot tiap bagian dan menjelaskannya, termasuk arti PROTEK huruf demi huruf; untuk pegawai terbuka sendiri setelah sambutan, untuk Human Capital lewat tombol Panduan per tab.

Perubahan dari rencana bagian 6: Human Capital TIDAK membaca narasi individu (hanya narasi kelompok); narasi pribadi dan respons cerita hanya untuk pegawai pemiliknya. Kolom peninjau (`perlu_ahli`, `alasan_perhatian`, `disetujui_oleh`, `catatan_admin`) tidak diberikan ke peran `authenticated`, jadi query FIR ke `wa_narasi` wajib menyebut kolom.

### Langkah pemasangan ke produksi

Urutannya penting; tiap langkah aman diulang.

1. Jalankan migration `20261020100000_wa_wellbeing_assessment.sql` di SQL Editor.
2. Deploy dua Edge Function yang berubah: `admin-actions` dan `create-user`.
3. Dari folder `web/`, baca berkas olahan terbaru lalu tempel seed (pakai berkas `bagian-N` berurutan kalau SQL Editor menolak berkas utuh):

```bash
npm run wa:baca -- "C:/path/Athirah - Master - Olahan.xlsx" --sekolah <school_id Athirah> --periode 2026-10 --lembaga "Sekolah Islam Athirah" --slug athirah
```

4. Aktifkan modul `wa` untuk sekolah itu di Admin Fammi, Sekolah & Modul.
5. Tinjau narasi di Persetujuan Wellbeing. Narasi kelompok dan laporan pribadi bisa disetujui massal; 195 respons cerita (27 berpenanda perlu ahli) wajib dibuka satu per satu oleh psikolog.
6. Pengguna & Peran, Tautkan akun Wellbeing: pilih sekolah, periksa rencana, jalankan, unduh Excel kode akun baru.
7. Uji dengan satu akun Human Capital dan satu akun Pegawai sebelum mengumumkan.

Yang tersisa: milestone 6 (dokumen modul `docs/wa-wellbeing-assessment.md`) dan uji ujung ke ujung di Supabase sungguhan, yang belum bisa dilakukan dari sini.

## 1. Ringkasan

Wellbeing Assessment adalah asesmen lanjutan dari Screening Awal Wellbeing (`sw`). Peserta
yang masuk daftar 200 orang hasil screening mengisi PROTEK (42 item, 6 aspek, skala 1-6),
12 item kepuasan kerja (skala 1-5), enam pilihan ganda, empat pertanyaan terbuka, dan satu
cerita kelelahan yang dijanjikan rahasia. Dua laporan, dua login:

1. **Laporan kelompok** untuk peran `HumanCapital`, desktop, lima tab mengikuti desain:
   Ringkasan, Kesehatan Mental (label masih diputuskan, lihat 11.3), Kepuasan Kerja, Survey,
   Testimoni.
2. **Laporan individu** untuk peran `Pegawai`, shell ponsel, satu kolom dengan menu bawah:
   Ringkasan, Aspek Kuat, Aspek Lemah, Refleksi Saya, ditambah bagian "Jawaban dari tim
   pendamping" (respons cerita) dan "Langkah kecil".

Sumber data satu: berkas `Athirah - Master - Olahan.xlsx` hasil prompt di
`docs/Prompt_Wellbeing_Assessment_Excel.md`. Semua angka sudah final di sana, termasuk persen,
kategori, sebaran per kelompok, frekuensi pilihan ganda, dan narasi `laporan_json`. FIR
hanya membaca, menyaring, mengurutkan, dan menampilkan (CLAUDE.md butir 3). Tidak ada
Gemini di jalur ini; narasi dari Excel tetap lewat gerbang persetujuan manusia sebelum tayang
(CLAUDE.md butir 6).

Peran baru tidak ada. `HumanCapital` dan `Pegawai` sudah ada sejak modul `sw`; yang
ditambah hanya tautan akun `profiles.wa_individu_id` dan entitlement modul `wa` di
`school_modules`. `KepalaUnit` dan `Yayasan` di luar cakupan versi pertama (bagian 12).

## 2. Referensi desain

Sebelas gambar dari pemilik produk (lampiran percakapan 2026-10-13), belum ada berkas Figma.
Angka dan nama di gambar adalah placeholder (semua aspek 86%, semua pegawai "Dini Anisa
Putri"); tiru struktur dan gayanya, bukan datanya.

| Kode | Layar | Isi yang terbaca |
|---|---|---|
| D1 | Desktop, tab Ringkasan | Dua kartu hero (donat skor PROTEK + kartu ungu narasi; skor kepuasan + bintang + kartu kuning narasi). Enam kartu huruf P R O T E K dengan bar dan persen. Dua kartu plus/minus. Enam donat kecil dimensi kepuasan. Dua kolom "TOP 3 aspek sudah kuat / perlu penguatan" dengan bar per item, footer "Total N aspek" dan tautan "Lihat semua aspek". |
| D2 | Desktop, tab Kesehatan Mental | Hero: bar bertumpuk tiga kategori + tiga kartu Baik / Perlu Perhatian / Perlu Pendampingan (persen, jumlah pegawai). Dua kartu plus/minus (resume). Enam baris aspek dengan bar bertumpuk tiga kategori dan legenda jumlah orang. Tiga kolom "TOP 5 pegawai sesuai kondisi" bernama dengan bar persen, tautan "Lihat semua pegawai". |
| D3 | Desktop, tab Kepuasan Kerja | Hero: bar bertumpuk + tiga kartu Puas / Netral / Tidak Puas. Enam kartu dimensi dengan ikon, bintang, angka "4.4 / 5.0". Dua kartu plus/minus. Enam baris dimensi dengan bar bertumpuk LIMA tingkat dan legenda. Tiga kolom "TOP 5" bernama. |
| D4 | Desktop, tab Survey | Dua kartu hero berilustrasi: "Fokus pada kekuatan lembaga" (hijau) dan "Lakukan perbaikan segera" (jingga), masing-masing satu kutipan narasi. Enam kartu pilihan ganda (ikon bulat berwarna, judul, daftar pilihan dengan bar persen, narasi di footer). |
| D5 | Desktop, tab Testimoni | Empat kartu pertanyaan terbuka dengan garis bawah berwarna (ungu, hijau, jingga, emas). Kartu kutipan dua kolom: nama, chip peran (Pimpinan Sekolah / Guru / Staf dan Karyawan / Lainnya), jawaban verbatim, garis bawah hijau. |
| M1 | Ponsel, Ringkasan | Kartu skor PROTEK + kartu ungu narasi; kartu kepuasan + bintang + kartu kuning. Enam baris aspek (huruf, label, bar, persen). Kartu plus/minus. Enam donat dimensi kepuasan. Dua kartu "TOP 3" (kuat ungu, perlu penguatan jingga) dengan footer "Total N aspek" dan "Lihat Semua". |
| M2 | Ponsel, header | Logo Fammi.ly, tombol "Menu" membuka lembar bawah. |
| M3 | Ponsel, Refleksi Saya | Enam kartu pilihan ganda milik pegawai itu sendiri: ikon, chip judul berwarna, pilihan yang dia pilih. |
| M4, M5 | Ponsel, lembar "Lihat Semua" | Daftar semua item kuat (ungu) atau perlu penguatan (jingga), bar per item, bisa digulir. |
| M6 | Ponsel, lembar Menu | Empat tombol besar: Ringkasan (aktif, ungu tua), Aspek Kuat, Aspek Lemah, Refleksi Saya. |

Palet yang terbaca sama persis dengan token modul `sw` (`web/src/pages/sw/swTokens.module.css`,
custom property `--fm-*`): ungu tua `#342060`, ungu `#6323DA`, emas `#FFAE15`, jingga
`#FF5B2E`, hijau `#16A34A`, latar `#F5F5F7`, kartu tanpa garis tepi dengan bayangan tipis.
Keputusan: modul `wa` MEMAKAI token `sw` apa adanya (impor berkas yang sama), bukan salinan,
karena nilainya memang satu palet. Kalau nanti desain `wa` menyimpang, baru dipecah.

Ilustrasi hero (hati berkacamata, papan klip berbintang, dua ilustrasi tim di tab Survey)
belum ada berkasnya. Minta SVG ke desainer; sampai ada, pakai ikon Phosphor berukuran besar
di tempat yang sama supaya tata letak tidak berubah saat ilustrasi masuk.

## 3. Apa yang ada di berkas olahan (diperiksa 2026-10-19)

Berkas `C:\Users\hp_en\Downloads\Athirah - Master - Olahan (2).xlsx`, tujuh sheet, diproses
2026-10-14, revisi bahasa 2026-10-18. Hasil pemeriksaan dengan kode:

- `INDIVIDU` 199 baris, 147 kolom (81 asli + 66 turunan). `dipakai = Ya` 195, isian ganda 8
  baris (4 pasang). Semua 195 `laporan_json` valid dan lengkap enam kunci, tanpa digit, tanpa
  kata ganti orang di `langkah_kecil`. 148 orang menulis cerita, 27 ditandai
  `perlu_perhatian_ahli`. `langkah_kecil` 2 item (70 orang) atau 3 item (125 orang).
- Sebaran: PROTEK Baik 186, Perlu Perhatian 9, Perlu Pendampingan 0. Kepuasan tiga tingkat: Puas 148,
  Netral 39, Tidak Puas 8. Jenis kelamin kosong 1 (R094).
- `KELOMPOK` 40 baris: 1 lembaga, 7 jenjang, 25 unit, 7 kelompok jabatan. Narasi terisi
  untuk 30 baris (semua yang n ≥ 5 kecuali tiga baris "Tidak teridentifikasi" yang memang
  sengaja tidak diberi narasi). Narasi lembaga 18.520 karakter: ringkasan, wellbeing,
  kepuasan, survey (dua kartu hero + enam narasi), tema testimoni empat pertanyaan,
  tema_cerita, insight, tindak_lanjut.
- `PILIHAN` 1.262 baris, enam kode pertanyaan, empat cakupan.
- `TESTIMONI` 780 baris, layak tampil 578, tema terisi untuk semua yang layak. Alasan tidak
  tampil: kosong 65, kurang dari 4 kata 110, "tidak ada" 18, keluhan ke individu 6, responden
  minta dirahasiakan 3.
- `ITEM` 54 baris (42 PROTEK + 12 kepuasan) dengan `teks_singkat` siap jadi label bar.
- `PARAMETER` 58 baris, `CATATAN_QC` 116 baris.
- Unit: 26 orang (13%) jatuh ke "Tidak teridentifikasi" karena kolom asal hanya menulis
  "Guru" atau "SMA Islam Athirah" tanpa kampus. 31 orang kelompok jabatannya tidak jelas.
  Daftarnya ada di `CATATAN_QC`; perbaikannya di hulu (Human Capital melengkapi, lalu olah
  ulang), bukan ditebak di pembaca.
- Tiga baris (R147, R148, R149) jawabannya identik di seluruh 54 item dan pilihan ganda,
  nama berbeda. Dipakai apa adanya, dicatat.

Kolom yang TIDAK boleh ikut ke Supabase: `BB` (cerita kelelahan, hanya dipakai saat membuat
`respons_cerita`), `CB` (nomor WhatsApp), `BC`/`BD` (orang yang dipercaya, hanya untuk
konteks respons). Pembaca wajib membuangnya.

## 4. Keputusan arsitektur

1. **Satu sumber, satu bentuk.** Pembaca `waPembaca.js` memindahkan angka apa adanya dari
   sheet `INDIVIDU`, `KELOMPOK`, `PILIHAN`, `TESTIMONI`, `ITEM`, `PARAMETER`. Tidak ada rata-rata,
   persen, kategori, atau korelasi yang dihitung di JavaScript. Yang boleh di React: menyaring
   per cakupan, mengurutkan (Top 3 item, Top 5 pegawai), dan menghitung panjang daftar.
2. **Narasi dipisah dari angka** di tabel sendiri (`wa_narasi`) dengan kolom `status`, supaya
   RLS bisa menahan narasi yang belum `disetujui` tanpa menyembunyikan angka. Angka tayang
   begitu dataset di-seed; narasi tayang per baris setelah disetujui di Admin Fammi.
3. **Respons cerita punya jalur sendiri.** Disimpan sebagai baris `wa_narasi` ber-cakupan
   `respons_cerita`, hanya terbaca oleh pegawai pemiliknya (dan admin lewat service role).
   `HumanCapital` tidak pernah menerimanya lewat RLS. Baris berpenanda `perlu_ahli` tidak
   bisa disetujui lewat tombol "Setujui semua"; harus satu per satu, oleh psikolog.
4. **Nama tampil hanya untuk Human Capital dan pemiliknya sendiri**, sama dengan `sw`.
   Testimoni verbatim bernama tampil hanya baris `layak_tampil = Ya`.
5. **Peran dipakai ulang.** `HumanCapital` membaca kelompok, `Pegawai` membaca dirinya.
   Gerbang modul tetap `school_modules` (`wa`). Akun pegawai `sw` yang sama bisa ditautkan ke
   isian `wa` lewat `profiles.wa_individu_id`; satu akun boleh punya dua tautan.
6. **Token dan primitif UI dipinjam dari `sw`**: `swTokens.module.css`, serta `Kartu`,
   `Dialog`, `Petunjuk`, `BarNilai`, `BarTumpuk`, `Donat`, `Legenda`, `KeadaanLayar`,
   `Tombol`, `Pilihan` dari `SwUi.jsx`. Ini primitif tanpa wording modul, jadi boleh dipakai
   bersama. Komponen bernarasi (`SwRingkasan` dst) TIDAK dipakai; `wa` punya komponennya
   sendiri karena strukturnya beda total.
7. **Pratinjau tanpa Supabase** lewat `?preview=wa` dengan data contoh buatan
   (`wa.contoh.json`, dibuat `npm run wa:contoh`) yang bentuknya identik hasil pembaca, plus
   pilihan memuat berkas lokal di `web/wa-data-lokal/` saat `npm run dev`. Pola persis `sw`.

## 5. Bentuk dataset (keluaran pembaca)

```
{
  versi: 1,
  meta: { lembaga, sekolahId, periodeId, sumber, dibuat, tanggalPengolahan, nDipakai, nAsli, isianGanda: [{id, nama}] },
  parameter: { ... semua baris sheet PARAMETER jadi objek nama -> nilai ... },
  item: [ { kode, instrumen, kunci, labelAspek, teksAsli, teksSingkat, arahAsli } ],   // 54
  kelompok: [ {
    cakupan: 'lembaga'|'jenjang'|'unit'|'kelompok_jabatan', kunci, nama, nResponden, nPerempuan, nLaki, usia: {rata,min,max},
    protek: { rata, pct, kategori: {baik, perluPerhatian, pendampingan}, pctKategori: {...}, aspekTertinggi, aspekTerendah,
              aspek: { p: {rata, pct, n: {baik, perluPerhatian, pendampingan}}, r, o, t, e, k },
              item: [ {kode, aspek, rata, pct, kategori} ], nItem: {kuat, cukup, perlu} },
    kepuasan: { rata, kategori5, bintang, tiga: {puas, netral, tidakPuas}, pctTiga: {...},
                dimensi: { peran_pekerjaan: {rata, kategori5, n: {sangatPuas, puas, netral, tidakPuas, sangatTidakPuas}}, ... },
                dimensiTertinggi, dimensiTerendah },
    korelasiProtekKepuasan, nCerita,
    pilihan: { disukai: [ {pilihan, jumlah, pct} ], tidak_disukai, mudah, sulit, keputusan_disukai, keputusan_tidak_disukai },
    adaNarasi: true|false
  } ],
  individu: [ {
    id: 'R001', nama, jenisKelamin, usia, unitAsli, unitId, jenjang, kelompokJabatan, jabatan, peranTestimoni, isianGanda,
    protek: { total, pct, kategori, aspek: { p: {skor, pct, kategori}, ... }, aspekTertinggi, aspekTerendah, item: [ {kode, aspek, skor, pct, kategori} ], nItem: {kuat, cukup, perlu} },
    kepuasan: { rata, kategori5, kategori3, bintang, dimensi: { peran_pekerjaan: {rata, kategori}, ... }, dimensiTertinggi, dimensiTerendah },
    pilihan: { disukai: [...], tidak_disukai: [...], mudah, sulit, keputusan_disukai, keputusan_tidak_disukai },
    testimoni: [ { pertanyaan, jawaban, layakTampil, alasanTidakTampil, tema } ],
    ceritaAda: true|false, ceritaPerluAhli: true|false
  } ],
  narasi: [ { cakupan, kunci, isi, perluAhli } ]   // lembaga/jenjang/unit/kelompok_jabatan/individu/respons_cerita
}
```

`narasi` untuk `individu` berisi `laporan_json` TANPA kunci `respons_cerita`; kunci itu dipecah
ke baris `cakupan = 'respons_cerita'` dengan `perluAhli` dari kolom `cerita_perlu_ahli`.
`unitId` = slug nama unit baku (sama dengan id unit `sw` kalau namanya sama, lihat 9.3).

## 6. Skema Supabase

Migration `supabase/migrations/20261020100000_wa_wellbeing_assessment.sql`, pola persis
`20260917100000_sw_screening_awal_wellbeing.sql`.

1. `school_modules_modul_check` ditambah `'wa'` (pola `do $$ ... string_agg` yang sama).
2. `profiles.wa_individu_id text` + fungsi `my_wa_individu_id()` (security definer, pola
   `my_sw_individu_id`).
3. Tabel:

```sql
wa_dataset  (id text pk 'WA-<sekolah>-<periode>', sekolah_id, periode_id, meta jsonb, parameter jsonb,
             item jsonb, aktif bool, created_at)
wa_kelompok (dataset_id, cakupan, kunci, sekolah_id, nama, n_responden int, data jsonb, pk (dataset_id, cakupan, kunci))
wa_individu (dataset_id, individu_id, sekolah_id, unit_id, nama, data jsonb, pk (dataset_id, individu_id))
wa_narasi   (dataset_id, cakupan, kunci, sekolah_id, isi jsonb, perlu_ahli bool default false,
             status text check in ('menunggu_persetujuan','disetujui','ditolak') default 'menunggu_persetujuan',
             draf_asal text default 'excel', disetujui_oleh uuid, disetujui_pada timestamptz, catatan_admin text,
             pk (dataset_id, cakupan, kunci))
```

4. RLS (select saja; tidak ada policy tulis, data masuk lewat seed service role, persetujuan
   lewat Edge Function `admin-actions`):

| Tabel | HumanCapital | Pegawai | AdminFammi |
|---|---|---|---|
| `wa_dataset` | sekolahnya, aktif | sekolahnya, aktif | semua |
| `wa_kelompok` | sekolahnya | tidak | semua |
| `wa_individu` | sekolahnya | `individu_id = my_wa_individu_id()` | semua |
| `wa_narasi` | sekolahnya, `status = 'disetujui'`, hanya narasi kelompok | `status = 'disetujui'`, `cakupan in ('individu','respons_cerita')`, `kunci = my_wa_individu_id()` | semua |

Pegawai sengaja TIDAK membaca `wa_kelompok` di versi pertama (laporan individu di desain tidak
memuat pembanding lembaga). Kalau nanti mau ada "dibanding rata-rata lembaga", buka policy
untuk `cakupan = 'lembaga'` saja.

5. Uji: `supabase/tests/wa_baseline.sql` dan `wa_verify.sql` mengikuti `sw_baseline.sql`.
   Skenario minimal: HC membaca semua individu sekolahnya dan tidak membaca sekolah lain;
   Pegawai hanya baris dirinya; Pegawai tidak melihat narasi `menunggu_persetujuan`; HC tidak
   pernah menerima baris `respons_cerita` walau sudah disetujui; akun tanpa `wa_individu_id`
   menerima nol baris.

## 7. Pembaca berkas dan seed

- `web/src/pages/wa/lib/waPembaca.js`: fungsi murni `bacaDatasetWa(sheets, meta)`. Memeriksa
  nama sheet dan kolom wajib, menolak berkas kalau `PARAMETER.n_baris_dipakai` tidak sama dengan
  jumlah `dipakai = Ya`, membuang kolom BB/BC/BD/CB, memecah `laporan_json` menjadi `narasi`,
  mengubah `item_json` dan `pilihan_*_json` dari string ke objek. Uji di `waPembaca.test.js`
  memakai workbook kecil buatan di dalam uji (bukan berkas asli).
- `web/scripts/wa/baca-berkas-wa.mjs` + `waSql.mjs`: CLI `npm run wa:baca -- "<olahan.xlsx>"
  --sekolah ATHIRAH --periode 2026-10 --lembaga "Sekolah Islam Athirah" --slug athirah`.
  Menulis `web/wa-data-lokal/athirah.json` dan `athirah.seed.sql` (dollar-quote jsonb, pola
  `swSql.mjs`). Seed menonaktifkan dataset lama sekolah itu, menyisipkan `wa_dataset`,
  `wa_kelompok`, `wa_individu`, `wa_narasi` (semua `menunggu_persetujuan`). Kalau ukuran seed
  melewati batas SQL Editor, pecah per 1.500 baris seperti `athirah.seed.bagian-N.sql` di `sw`.
- `web/scripts/wa/buat-data-contoh.mjs`: `npm run wa:contoh` membuat `wa.contoh.json` buatan
  (40 orang, 6 unit) yang melewati pembaca yang sama, untuk `?preview=wa` dan uji UI.
- `.gitignore`: tambah `wa-data-lokal/` di bawah baris `sw-data-lokal/`.
- `package.json`: `wa:baca`, `wa:contoh`, dan tambahkan berkas uji `wa` ke skrip `test`.
- `docs/wa-wellbeing-assessment.md`: dokumen modul (dibuat di milestone 6), padanan
  `sw-screening-awal-wellbeing.md`.

## 8. Frontend

Folder `web/src/pages/wa/`.

### 8.1 Berkas inti

| Berkas | Isi |
|---|---|
| `lib/waMeta.js` | `MODUL_WA`, `ASPEK` (p r o t e k: kunci, huruf, label, tooltip), `DIMENSI_KEPUASAN` (enam: kunci, label, ikon Phosphor), `KATEGORI_PROTEK` (tiga: kunci, label, warna), `KATEGORI_KEPUASAN_5` dan `_3`, `PERTANYAAN_PILIHAN` (enam: kode, judul kartu, ikon, warna), `PERTANYAAN_TERBUKA` (empat: kode, judul, warna garis), `PERAN_TESTIMONI`. Label kategori dibaca dari `dataset.parameter` kalau ada, bawaan dari sini. |
| `lib/waAturan.js` | `peranWa(session)`, `bolehLihat(peran, fitur)`, `kelompokTerpilih(dataset, cakupan, kunci)`, `urutTopItem(item, arah, n)`, `urutTopPegawai(individu, kategori, n)` (Baik: pct menurun; Perlu Perhatian dan Perlu Pendampingan: pct menaik), `testimoniTampil(individu)`, `warnaKategori`, `formatPersen`. Semuanya fungsi murni, diuji di `waAturan.test.js`. |
| `data/useWaData.js` | Baca `wa_dataset` aktif, lalu paralel `wa_kelompok`, `wa_individu`, `wa_narasi` dengan `fetchAllRows`. Menyusun objek dataset berbentuk sama dengan keluaran pembaca; `narasi` dipetakan ke `narasiPer[cakupan][kunci]`. |
| `data/useWaLaporan.js` | Pembungkus: `peran`, `dataset`, `akses { peran, individuId, nama }`. |
| `WaStatus.jsx` | Keadaan peran tidak berhak / memuat / galat / kosong, pola `SwStatus`. |
| `WaPage.jsx` | Titik masuk `HumanCapital` (dipasang di `App.jsx` saat `activeTab === 'wa'`). |
| `WaLaporan.jsx` | Cangkang lima tab + pemilih cakupan di toolbar (Lembaga, per jenjang, per unit, per kelompok jabatan). Tab berganti isi menurut cakupan; narasi tampil kalau `adaNarasi` dan sudah disetujui, kalau tidak kartu narasi menampilkan keadaan "Narasi belum tersedia untuk cakupan ini". |
| `WaRingkasan.jsx` | Tab D1. |
| `WaWellbeing.jsx` | Tab D2, termasuk dialog "Lihat semua pegawai" per kategori. |
| `WaKepuasan.jsx` | Tab D3. |
| `WaSurvey.jsx` | Tab D4. |
| `WaTestimoni.jsx` | Tab D5, saringan pertanyaan (empat kartu atas berfungsi sebagai filter, kartu aktif ditandai) dan saringan peran. |
| `WaPegawaiPage.jsx` | Shell ponsel, pola `SwPegawaiPage` (header logo + nama + Keluar). |
| `WaPegawaiLaporan.jsx` | Laporan individu M1 sampai M6: empat bagian lewat lembar menu bawah, lembar "Lihat Semua" untuk item kuat dan perlu penguatan. Bagian Ringkasan juga memuat "Langkah kecil" (dari narasi) dan "Tanggapan untuk cerita Anda" (respons cerita, hanya tampil kalau barisnya sudah `disetujui`; kalau cerita ada tapi respons belum disetujui, tampil kartu "sedang ditinjau"; tanggapan tidak pernah menawarkan percakapan atau pendampingan dari Fammi, kebutuhan ahli diarahkan lewat Human Capital). |
| `WaPreview.jsx` | `?preview=wa`: ganti peran (HC / Pegawai), ganti sumber (contoh / berkas lokal), pilih pegawai. Didaftarkan di `main.jsx` seperti `SwPreview`. Tombol "Ulangi panduan" menghapus penanda panduan supaya panduan terbuka lagi. |
| `WaTur.jsx` | Panduan langkah demi langkah: layar digelapkan kecuali satu bagian (sorotan dari bayangan, tanpa garis tepi), kartu penjelasan di sisi yang ruangnya paling lega, panah kiri/kanan dan Escape, langkah yang bagiannya tidak ada dilewati. Di ponsel kartu menempel di bawah. |
| `lib/waTur.js` | Isi panduan sebagai data. `langkahPegawai()` 14 langkah (skor, PROTEK huruf demi huruf, tanda tambah/kurang, kepuasan, enam bidang, pernyataan kuat dan lemah, refleksi, langkah kecil, pesan pendamping, Menu). `langkahHc(tab)` satu panduan per tab. Diuji `waTur.test.js`: bebas kata terlarang dan klise, dan tiap target `data-tur` ada di komponen. |
| `waSimpanan.js` | Penanda "panduan sudah dilihat" di localStorage, dibungkus try/catch. Pegawai per id, Human Capital satu penanda. |
| `WaUi.jsx` | Komponen khusus modul yang belum ada di `SwUi`: `KartuHuruf` (P R O T E K), `Bintang` (lima bintang dari `kepuasan_bintang`, setengah bintang), `BarItem` (teks item + persen + bar), `KartuPlusMinus`, `KartuKategori` (Baik / Perlu Perhatian / Perlu Pendampingan berlatar warna lembut, tanpa garis), `ChipPeran`, `KartuKutipan`, `LembarBawah` (bottom sheet ponsel). |
| `*.module.css` | Satu per komponen halaman, memakai `--fm-*`. Grid 6 kolom di desktop, 2 kolom di ponsel. |

### 8.2 Aturan tampilan yang diwarisi dari `sw`

- Tooltip pada setiap legenda, chip, dan huruf aspek (`Petunjuk` dengan teks dari `waMeta`).
- Grafik beranimasi singkat saat tab dibuka, dimatikan pada `prefers-reduced-motion`.
- Satu tebal bar `--fm-bar`; huruf terkecil 13 px; teks di atas ungu selalu putih.
- Tidak ada unduh CSV. Belum ada ekspor Excel di versi pertama (bagian 12).
- Dialog di tengah layar, hanya dialog yang bergulir.
- Berbeda dari `sw`: tab `wa` BOLEH bergulir (desain D1 sampai D5 jelas lebih tinggi dari satu
  layar). Jangan memaksakan kunci tinggi `useTinggiLayar`.

### 8.3 Pemetaan data ke kartu

| Kartu di desain | Sumber di dataset |
|---|---|
| Donat skor PROTEK, label kategori | `kelompok.protek.pct`; kategori dari `kelompok.protek.kategoriRata`, yang diturunkan PEMBACA (bukan React) dari `rata` dengan ambang `parameter.kategori_total`. Individu memakai `protek.kategori` dari berkas. |
| Kartu ungu / kuning narasi | `narasi[lembaga].ringkasan.wellbeing` / `.kepuasan` |
| Enam kartu huruf | `kelompok.protek.aspek[k].pct`; aspek `aspekTerendah` berbar jingga, sisanya ungu. `kategoriRata` per aspek juga diturunkan pembaca dari `parameter.kategori_aspek`. |
| Kartu plus / minus (Ringkasan) | `narasi.wellbeing.hal_baik` / `hal_ditingkatkan`; untuk Kepuasan `narasi.kepuasan.hal_baik` / `hal_ditingkatkan` |
| Enam donat kepuasan | `kelompok.kepuasan.dimensi[d].rata` ditampilkan sebagai angka per lima; isian busur donat = rata / 5 (geometri tampilan, bukan statistik baru). Dimensi `dimensiTerendah` berwarna jingga. |
| TOP 3 item kuat / perlu penguatan | `urutTopItem(kelompok.protek.item, 'turun'|'naik', 3)`, teks dari `item[kode].teksSingkat` (teks asli di tooltip), footer `nItem.kuat` / `nItem.perlu` |
| Hero tiga kategori (D2) | `kelompok.protek.kategori` dan `pctKategori` |
| Resume plus / minus (D2) | `narasi.wellbeing.resume_kuat` / `resume_lemah` |
| Enam baris aspek bertumpuk | `kelompok.protek.aspek[k].{n: {baik, perluPerhatian, pendampingan}}` |
| TOP 5 pegawai per kategori | `urutTopPegawai(individu, kategori, 5)`; dialog "Lihat semua" menampilkan seluruh daftar kategori itu, bisa dicari nama |
| Hero kepuasan (D3) | `kelompok.kepuasan.tiga` dan `pctTiga` |
| Kartu dimensi dengan bintang | `kelompok.kepuasan.dimensi[d].rata`; isian tiap bintang mengikuti nilai (lebar isian = bagian nilai), jadi tidak ada pembulatan baru. Kartu skor utama tetap memakai `kepuasan_bintang` dari berkas. |
| Enam baris dimensi lima tingkat | `kelompok.kepuasan.dimensi[d].n` |
| Dua hero Survey | `narasi.survey.fokus_kekuatan` / `perbaikan_segera` |
| Enam kartu pilihan ganda | `kelompok.pilihan[kode]` (sudah urut jumlah menurun) + `narasi.survey.narasi[kode]` |
| Empat kartu pertanyaan Testimoni | `PERTANYAAN_TERBUKA` + jumlah jawaban layak per pertanyaan |
| Kartu kutipan | `individu[].testimoni` yang `layakTampil`, nama dan `peranTestimoni` |
| Ponsel: skor, aspek, kartu plus/minus, donat | `individu.protek`, `individu.kepuasan`, `narasi[individu]` |
| Ponsel: Refleksi Saya | `individu.pilihan` |
| Ponsel: Lihat Semua | `individu.protek.item` disaring kategori `kuat` / `perlu penguatan` |

Kolom `protek_kategori_rata` dan `kep_<dimensi>_bintang` di butir 11.7 tetap disarankan untuk olahan berikutnya; begitu ada, pembaca cukup membacanya alih-alih menurunkan kategori dari ambang.

### 8.4 Penyambungan ke aplikasi

- `App.jsx`: `isPeranKhususSw` diganti `isPeranWellbeing` yang mengizinkan modul `sw` DAN `wa`
  untuk `HumanCapital`/`KepalaUnit`; `shellModules` menyaring ke `['sw','wa']`; `defaultModuleForPeran`
  mengembalikan `wa` kalau hanya `wa` yang aktif; `activeTab === 'wa'` merender `WaPage`.
  Early return `Pegawai`: kalau `session.wa_individu_id` ada dan `sw_individu_id` tidak,
  `WaPegawaiPage`; kalau keduanya ada, `WaPegawaiPage` dengan tombol kecil "Lihat hasil
  screening" yang berpindah ke `SwPegawaiPage` (state lokal); kalau hanya `sw`, seperti sekarang.
- `NavBar.jsx`: `{ id: 'wa', label: 'Wellbeing Assessment' }` setelah `sw`.
- `lib/auth.js`: blok `swTautan` membaca juga `wa_individu_id` (nama variabel jadi
  `tautanWellbeing`), tetap hanya untuk `KepalaUnit`/`Pegawai`.
- `main.jsx`: daftarkan `?preview=wa`.
- `AdminCmsPage.jsx` / `Sidebar.jsx`: menu "Persetujuan Wellbeing" (bagian 9.1).

## 9. Admin Fammi dan Edge Function

### 9.1 Persetujuan narasi

Layar baru `screens/PersetujuanWa.jsx`, pola `PersetujuanSc.jsx`:

- Daftar `wa_narasi` berstatus `menunggu_persetujuan` lewat `admin-actions` action
  `list-wa-pending` (service role). Kolom: cakupan, nama (kelompok) atau nama pegawai
  (individu dan respons cerita), penanda `perlu_ahli`, panjang teks, tanggal seed.
- Saringan cakupan (lembaga, jenjang, unit, kelompok jabatan, individu, respons cerita) dan
  sakelar "hanya perlu ahli".
- Drawer pratinjau yang merender narasi persis seperti di dashboard (komponen kartu yang sama
  dari `wa/`), supaya peninjau melihat apa yang akan dilihat pengguna.
- Tombol Setujui / Tolak per baris (`approve-wa` / `reject-wa` dengan `{dataset_id, cakupan, kunci}`),
  sunting isi sebelum setujui (`edit-wa`, hanya pada status menunggu, pola `edit-sc`).
- "Setujui semua yang tampil" MENGABAIKAN baris `perlu_ahli = true` dan baris
  `cakupan = 'respons_cerita'`; keduanya hanya bisa disetujui satu per satu. Teks konfirmasi
  menyebut berapa yang dilewati dan kenapa.
- QC otomatis ringan di sisi klien saat drawer dibuka (bukan penegak, cuma lencana): digit di
  narasi individu, kata terlarang (bagian 11.3), em-dash, kalimat lebih dari tiga. Logikanya
  satu fungsi `qcNarasiWa` di `wa/lib/waAturan.js`, diuji.

`admin-actions/index.ts`: empat action baru di `switch`, handler `handleListWaPending`,
`handleWaApproval`, `handleEditWa`. Approve menulis `status`, `disetujui_oleh`,
`disetujui_pada`. Tidak membuat akun otomatis (beda dari `approve-sc`): akun pegawai dibuat
lewat Pengguna & Peran seperti `sw`. Deploy lewat Supabase Dashboard seperti biasa; catat di
`project_admin_cms` kalau belum di-deploy.

### 9.2 Akun dan tautan

- `create-user/index.ts`: terima `wa_individu_id`; `Pegawai` wajib punya minimal satu dari
  `sw_individu_id` atau `wa_individu_id` (sekarang `sw_individu_id` wajib; longgarkan).
- `components/SwLinkFields.jsx` diperluas jadi `WellbeingLinkFields.jsx`: pilihan isian `sw`
  dan isian `wa` dari dataset aktif sekolah, keduanya opsional untuk `Pegawai`.
- `importers/waImporter.js`: template "pegawai (Wellbeing Assessment)" berisi 195 nama dari
  `wa_individu`, dicocokkan ke akun yang sudah ada (username dari nama, pola `swImporter`).
  Kalau orangnya sudah punya akun `sw`, importer MENAMBAH `wa_individu_id` ke akun itu lewat
  `update-profile`, bukan membuat akun kedua. Pencocokan nama `sw` ke `wa`: nama tanpa gelar +
  unit; yang ragu ditandai supaya admin memilih manual di pratinjau, tidak ditebak.
- `EditUserDialog.jsx`, `AddUserDialog.jsx`: kolom `wa_individu_id`.

### 9.3 Unit `wa` dan unit `sw`

`unitId` di `wa` = slug nama unit baku yang disalin dari 25 unit `sw` Athirah, jadi
`wa_kelompok.kunci` untuk cakupan `unit` sama dengan `sw_unit.unit_id` untuk nama yang sama.
Belum dipakai di versi pertama (tidak ada `KepalaUnit` di `wa`), tetapi menjaga pintu untuk
laporan per unit bagi kepala unit nanti tanpa migrasi data.

## 10. Milestone, urutan, dan kriteria selesai

Estimasi untuk satu agen; angka hari adalah kerja efektif.

| # | Milestone | Keluaran | Selesai kalau | Hari |
|---|---|---|---|---|
| 0 | Keputusan | Jawaban enam butir bagian 11, tambahan kolom 11.7 di prompt, olah ulang berkas (opsional, boleh pakai berkas sekarang dulu) | Bagian 11 terisi di dokumen ini | 0,5 |
| 1 | Pembaca dan data | `waPembaca.js` + uji, CLI `wa:baca`, `waSql.mjs`, `wa:contoh`, `.gitignore`, `package.json` | `npm run wa:baca` pada berkas Athirah menghasilkan json dan seed; `npm test` hijau; `wa-data-lokal/athirah.json` tidak memuat BB/BC/BD/CB (ada uji yang memeriksa) | 2 |
| 2 | Laporan kelompok | `WaPage`, `WaLaporan`, lima tab, `WaUi`, `waMeta`, `waAturan` + uji, `WaPreview` | `?preview=wa` menampilkan lima tab dari data contoh dan dari berkas lokal; semua kartu di tabel 8.3 terisi; lebar 1366 dan 1024 tanpa meluap; narasi kosong menampilkan keadaan kosong, bukan kartu kosong | 4 |
| 3 | Laporan individu | `WaPegawaiPage`, `WaPegawaiLaporan`, lembar menu dan Lihat Semua | Di lebar 375 semua bagian M1 sampai M6 tampil; respons cerita tampil hanya bila disetujui; tanpa nama orang lain di layar pegawai | 2 |
| 4 | Supabase dan penyambungan | Migration + uji SQL, `useWaData`, `auth.js`, `App.jsx`, `NavBar` | Uji RLS lulus; akun HC Athirah melihat `sw` dan `wa`; akun Pegawai dengan `wa_individu_id` masuk shell `wa`; seed Athirah masuk ke project staging | 2 |
| 5 | Persetujuan dan akun | `PersetujuanWa.jsx`, `admin-actions` (4 action), `create-user`, `waImporter`, dialog pengguna | Admin bisa menyetujui narasi lembaga, satu unit, satu individu, satu respons cerita; "Setujui semua" melewati `perlu_ahli`; akun pegawai bisa ditautkan lewat unggah | 2 |
| 6 | QA dan dokumentasi | `docs/wa-wellbeing-assessment.md`, pembaruan CLAUDE.md (pengecualian desain baru, peran, larangan kata), catatan memori | Dua akun uji (HC, Pegawai) dicek di staging; tidak ada kata terlarang di label (uji); `npm run build` bersih | 1 |

Urutan 1 → 2 → 3 bisa dikerjakan tanpa Supabase (semua lewat pratinjau), jadi pemilik produk
bisa meninjau tampilan lebih dulu. Milestone 4 dan 5 menunggu akses untuk menjalankan
migration dan men-deploy Edge Function.

Seed Athirah ke produksi hanya setelah: (a) `CATATAN_QC` unit tak teridentifikasi ditinjau
Human Capital (26 orang), (b) psikolog meninjau 27 respons `perlu_ahli`, (c) label kategori
(11.3) diputuskan. Tanpa (a), 13% pegawai tampil di "unit tidak diisi"; itu jujur tapi
memancing pertanyaan.

## 11. Keputusan pemilik produk yang masih terbuka

Jawaban dicatat di sini, lalu salin ke `docs/wa-wellbeing-assessment.md` saat dibuat.

1. **Ambang kepuasan** (lima tingkat selebar 0,8; tiga tingkat Puas ≥ 3,40). Dipakai di berkas
   sekarang. Kalau diubah, olah ulang berkas; React tidak punya ambang.
2. **Ambang item kuat / perlu penguatan** (individu 5-6 / 4 / 1-3; kelompok ≥ 5,0 / < 4,0).
3. **Label kategori dan judul tab.** DIPUTUSKAN 2026-10-19: kategori terbawah tampil sebagai
   "Perlu Pendampingan" dan label lama dilarang di mana pun (uji di `waAturan.test.js` dan
   `waPembaca.test.js`). Judul tab "Kesehatan Mental" masih mengikuti desain.
4. **Nama di Top 5 dan Testimoni** untuk Human Capital: ikut desain (tampil). Konfirmasi saja.
5. **Tema cerita stres di laporan kelompok** (`tema_cerita`, minimal 5 orang per tema): tampil
   di tab Ringkasan sebagai kartu kecil "Yang sering diceritakan", atau tidak tampil sama sekali.
   Rekomendasi: tampil, karena tanpa kutipan dan tanpa identitas.
6. **Isian ganda** dengan nomor WhatsApp berbeda (R162/R189, R040/R199): tetap satu orang
   (sekarang) atau dua orang. Kalau dua orang, olah ulang.
7. **Tiga kolom tambahan di olahan** supaya React tidak menghitung: `protek_kategori_rata`
   (kategori dari rata-rata kelompok) di `KELOMPOK`, `kep_<dimensi>_pct` dan `kep_<dimensi>_bintang`
   di `KELOMPOK` dan `INDIVIDU`. Tambahkan ke Tahap A prompt dan olah ulang; narasi tidak berubah.
8. **Pengiriman lewat WhatsApp.** Formulir menjanjikan laporan dikirim ke nomor WhatsApp. Versi
   pertama hanya menyediakan laporan lewat login akun; nomor tidak disimpan di Supabase. Kalau
   pengiriman WhatsApp tetap diinginkan, itu alur operasional di luar FIR (daftar nomor ada di
   berkas olahan sheet `INDIVIDU`), bukan fitur modul ini.

## 12. Di luar cakupan versi pertama

- `KepalaUnit` dan `Yayasan` membaca `wa` (data per unit sudah ada di `wa_kelompok`, tinggal
  policy dan pemilih cakupan yang dikunci ke unitnya).
- Ekspor Excel daftar pegawai (pola `swEkspor.js`), kalau Human Capital memintanya.
- Pembanding "dibanding lembaga" di laporan individu.
- Tren antar periode (dataset kedua).
- Unggah berkas olahan lewat Admin Fammi (sekarang CLI + seed SQL, seperti `sw`).
- Pencocokan otomatis peserta `sw` ke responden `wa` untuk analisis lanjutan (misalnya apakah
  orang berprioritas tinggi di screening juga rendah di PROTEK). Datanya ada di dua dataset,
  tetapi bukan permintaan saat ini.
