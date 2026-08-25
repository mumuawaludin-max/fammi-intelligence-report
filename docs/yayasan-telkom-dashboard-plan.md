# Rencana Development: Dashboard Yayasan Pendidikan Telkom (YPT)

Status: siap eksekusi bertahap. Figma sudah dianalisis, pertanyaan terbuka di bagian 12
tidak memblokir milestone awal.
Tanggal: 2026-08-25.

Dokumen ini ditulis supaya agen/model lain bisa mengeksekusi tanpa konteks percakapan.
Baca CLAUDE.md dulu, lalu dokumen ini urut dari atas.

## 1. Ringkasan

Yayasan Pendidikan Telkom menaungi ratusan sekolah TK sampai SMK yang datanya sudah ada
di Supabase produksi di bawah `schools.yayasan_id = 'YAY-PENDIDIKAN-TELKOM'` (sebagian;
sisanya didaftarkan di milestone 0). Saat akun Yayasan YPT login, ia masuk ke UI khusus
yang benar-benar berbeda dari FIR biasa (keputusan pemilik produk 2026-08-25), berisi
empat menu:

1. **Rapor Karakter** (Figma 1a-1d): agregat pencapaian karakter lintas sekolah.
2. **Citra Sekolah** (Figma 2a-2d): persepsi orang tua. Tab Keberhasilan/Dukungan/
   Emosi dibaca dari data refleksi Karakter yang SUDAH ADA di Supabase (bagian 7.1);
   tab Testimoni ditarik dari spreadsheet baru (bagian 7.3).
3. **Survey Kepuasan** (Figma 3a-3b): kepuasan staf sekolah terhadap Rapor Karakter
   Fammi, datanya ditarik berkala dari Google Spreadsheet respons form yang terus
   bertambah (bagian 8.1), lewat Edge Function sinkronisasi yang dipicu dari Admin CMS.
4. **Dokumentasi Kegiatan** (Figma 4a): empat baris carousel Video/Foto/Link/File
   dengan preview (YouTube/Zoom, Google Slides, PDF), dikelola dari Admin CMS.

Akun Yayasan lain (contoh `yayasantkfammi`) tidak berubah sama sekali. Admin CMS
mengikuti pola CMS yang sudah ada, tidak ada redesign, prioritasnya mudah dipahami.

## 2. Referensi Figma

File key `5HNLH5P2STY3RxDbbZ01Oz`, halaman "HaloMumu - Design". Saat implementasi tiap
layar, WAJIB panggil skill `figma:figma-design-to-code` lalu `get_design_context` pada
node terkait untuk nilai warna/spacing/font persis; screenshot saja tidak cukup.

| Kode | Node | Layar |
|---|---|---|
| 1a | `84-287` | Rapor Karakter, tab Rangkuman |
| 1b | `84-1977` | Rapor Karakter, tab Penilaian per Jenjang |
| 1c | `84-2289` | Rapor Karakter, tab Penilaian per Karakter |
| 1d | `84-2502` | Rapor Karakter, tab Penilaian per Sekolah |
| 2a | `84-525` | Citra Sekolah, tab Keberhasilan Sekolah |
| 2b | `84-898` | Citra Sekolah, tab Bentuk Dukungan |
| 2c | `84-1260` | Citra Sekolah, tab Emosi Anak |
| 2d | `84-1087` | Citra Sekolah, tab Testimoni |
| 3a | `84-1718` | Survey Kepuasan, tab Rangkuman |
| 3b | `84-1556` | Survey Kepuasan, tab Penilaian Kualitatif |
| 4a | `86-3321` | Dokumentasi Kegiatan (empat baris carousel) |

Catatan penting soal Figma: angka dan daftar di mockup adalah placeholder (nama siswa
berulang, "72 sekolah" di SMP, Top 5 berisi sekolah yang sama). Jangan meniru datanya,
tiru struktur dan gayanya. Nama menu keempat: "Dokumentasi Kegiatan" (sesuai nav
Figma, dikonfirmasi pemilik produk 2026-08-25).

Gaya visual yang terbaca dari Figma: latar putih/abu sangat muda, merah Telkom untuk
aksen dan nilai, navy gelap untuk kartu hero dan bar, hijau/kuning/merah untuk sentimen,
kartu putih radius besar dengan border tipis, stepper tab bergaya panah/chevron.
Kunci nilai persisnya dari `get_design_context` ke `yptTokens.module.css`.

### 2.1 Ketentuan pixel-perfect (wajib, instruksi eksplisit pemilik produk)

Hasil visual harus cocok dengan Figma, bukan sekadar mirip. Prosedur per layar:

1. Sebelum menulis JSX layar itu: `figma:figma-design-to-code` +
   `get_design_context(node)` untuk warna hex, ukuran font, weight, spacing, radius,
   dan shadow persis. Jangan menaksir dari screenshot.
2. Ekspor semua asset non-teks lewat `download_assets`: logo YPT, ikon kategori
   (Citra Sekolah punya ikon ilustratif per kartu), ikon metrik kepuasan, ilustrasi
   kartu Skala Kepuasan (3a), ikon tab. Simpan di `web/src/pages/ypt/assets/`. Jangan
   mengganti dengan emoji atau ikon perkiraan.
3. Frame Figma berlebar 1280. Verifikasi di viewport 1280: jalankan preview, screenshot
   browser, bandingkan berdampingan dengan `get_screenshot` node terkait sampai layout,
   proporsi kolom, dan hirarki teks cocok. Ulangi per tab, bukan hanya layar pertama.
4. Yang boleh beda dari mockup hanya: isi data (angka Figma placeholder), jumlah baris
   daftar mengikuti data nyata, state yang tidak digambar (hover, empty, loading), dan
   pemilih periode (bagian 4.5). Struktur, warna, dan tipografi tidak.
5. Perbedaan yang terpaksa (font pengganti, ikon tidak bisa diekspor) dicatat di PR
   sebagai deviasi untuk direview pemilik produk, jangan diputuskan diam-diam.

## 3. Arsitektur dan gerbang

### 3.1 Gerbang tampilan

Di `web/src/App.jsx`, setelah session terisi:

```
const isYpt = session.peran === "Yayasan"
  && Array.isArray(session.cakupan)
  && session.cakupan[0] === "YAY-PENDIDIKAN-TELKOM";
if (isYpt) return <YptApp session={session} onLogout={...} />;
```

`YptApp` menggantikan seluruh shell (Header/NavBar biasa tidak dipakai). Yayasan dengan
`cakupan` lain atau kosong jatuh ke jalur lama tanpa perubahan perilaku. Kalau nanti
yayasan kedua minta UI serupa, gerbang dinaikkan jadi kolom konfigurasi di tabel
`yayasan`; jangan tambah hardcode kedua.

### 3.2 Scoping gaya

Semua kode di `web/src/pages/ypt/`. Gaya lewat CSS module `yptTokens.module.css`
(class `.scope`, custom property `--ypt-*`), meniru pola `scBudayaTokens.module.css`.
Font tetap Google Sans Flex global. Tidak menyentuh `tokens.css` dan komponen bersama;
kalau butuh varian komponen, duplikasi lokal. Saat implementasi, catat di CLAUDE.md
sebagai "Pengecualian yang disengaja (3)".

### 3.3 Struktur direktori

```
web/src/pages/ypt/
  YptApp.jsx                  // shell: header logo YPT, nav 4 menu, pemilih periode
  yptTokens.module.css
  yptMeta.js                  // palet, label menu/tab, threshold tren, koordinat kota,
                              // daftar kategori CS, daftar metrik KP, urutan peran responden
  useYptSchools.js            // kelompokkan session.schools per jenjang & kota
  components/                 // StepTabs, StatCard, BarRow, ProgressBar, EssayCard,
                              // StarRating, DonutRing, DotMapIndonesia, RankList, dsb
  rapor/
    RaporKarakterPage.jsx
    RangkumanTab.jsx  PerJenjangTab.jsx  PerKarakterTab.jsx  PerSekolahTab.jsx
    useYptKarakterData.js
  citra/
    CitraSekolahPage.jsx
    KeberhasilanTab.jsx  DukunganTab.jsx  EmosiTab.jsx  TestimoniTab.jsx
    useCsData.js
  kepuasan/
    SurveyKepuasanPage.jsx
    KpRangkumanTab.jsx  KpKualitatifTab.jsx
    useKpData.js
  dokumentasi/
    DokumentasiPage.jsx
    MediaEmbed.jsx            // logika preview foto/youtube/slides/pdf/link
    useDpData.js
```

Navigasi antar menu dan tab pakai state React biasa (pola modul lain di repo), bukan
router baru. Desktop-only; beri `min-width` wajar dan pesan sopan di viewport sempit.

### 3.4 Menu yang tampil

- Rapor Karakter dan Citra Sekolah: tampil kalau >= 1 sekolah punya modul `karakter`
  (Citra Sekolah membaca data refleksi Karakter yang sama; tab Testimoni tampil
  kosong-elegan sebelum ada data spreadsheet).
- Survey Kepuasan: tampil kalau >= 1 sekolah punya modul `kp` (atau opsi tanpa
  entitlement di 8.2: kalau ada baris `kp_responden`).
- Dokumentasi Kegiatan: selalu tampil; kosong berarti EmptyState.

## 4. Milestone 0: Fondasi data dan sesi (prasyarat semua UI)

### 4.1 Inventaris sekolah (manual, SQL editor produksi)

```
select id, nama, jenjang, yayasan_id, aktif from schools
where id ilike '%TELKOM%' or nama ilike '%telkom%' order by jenjang, nama;
```

Hasilnya jadi daftar resmi. Cek `yayasan_id` null/salah, cek `jenjang` terisi konsisten
(nilai yang dipakai UI: `TK`, `SD`, `SMP`, `SMA`, `SMK`; UI menggabung SMA dan SMK jadi
"SMA/K").

### 4.2 Migration `ypt_naungan_dan_kota.sql`

1. Upsert baris `yayasan` `YAY-PENDIDIKAN-TELKOM` ("Yayasan Pendidikan Telkom").
2. `update schools set yayasan_id = 'YAY-PENDIDIKAN-TELKOM' where id in (...daftar
   eksplisit hasil 4.1...)`. Jangan pakai `ilike` di update.
3. `alter table schools add column if not exists kota text;` lalu isi kota tiap sekolah
   Telkom (dibutuhkan peta wilayah di layar 1a). Sumber: nama sekolah/daftar dari YPT.
4. Idempotent seluruhnya (`on conflict`, `if not exists`).

### 4.3 Akun Yayasan YPT

Ikuti pola `20260807110000_pa_tk_fammi_yayasan_account.sql`:
`peran='Yayasan'`, `cakupan=array['YAY-PENDIDIKAN-TELKOM']`, `school_id` jangkar salah
satu sekolah Telkom. Kalau `yayasansmktelkompwt` memang dipakai orang YPT, cukup akun
itu (sudah benar `cakupan`-nya); kalau butuh akun baru `yayasanpendidikantelkom`, buat
lewat migration serupa. Konfirmasi ke pemilik produk mana yang dipakai.

### 4.4 Sesi multi-sekolah di `web/src/lib/auth.js`

Di `fetchProfileSession()`: kalau `peran === 'Yayasan'` dan `cakupan[0]` berawalan
`YAY-`, tambahkan:

```
const { data: sekolahRows } = await supabase
  .from("schools").select("id, nama, jenjang, kota")
  .eq("yayasan_id", cakupan[0]).eq("aktif", true).order("nama");
const ids = sekolahRows.map(s => s.id);
const { data: modRows } = await supabase
  .from("school_modules").select("school_id, modul")
  .in("school_id", ids).eq("aktif", true);
```

Simpan `session.schools` (array baris sekolah), `session.modulesBySchool` (peta), dan
`session.modules` = union modul. Jalur lama untuk semua akun lain tidak berubah.
Refactor `useKarakterYayasan()` (`web/src/pages/karakter/useKarakterData.js:424`) agar
membaca `session.schools`, bukan resolve sendiri; perilaku Yayasan Karakter lama harus
identik (regression test manual dengan akun `yayasansmktelkompwt` sebelum dan sesudah).

### 4.5 Periode

Semua data YPT berdimensi periode mengikuti `periode_id` yang sudah dipakai modul
Karakter (format `YYYY-MM`). Figma tidak menggambar pemilih periode; tambahkan dropdown
kecil di kanan header shell (daftar periode = union periode yang ada di data, pola
`useAvailablePeriods`). Default: periode terbaru yang punya data. Ini keputusan desain
kecil yang boleh diambil tanpa Figma; jaga tampilannya senada.

## 5. Milestone 1: Shell YPT

Bangun `YptApp.jsx` + `yptTokens.module.css` + `StepTabs` + header (logo YPT statis di
`web/src/assets/`, ambil dari Figma lewat `download_assets`) + pemilih periode + empat
halaman kosong dengan EmptyState. Acceptance: login akun YPT masuk shell baru; akun
`yayasantkfammi` dan semua peran lain tidak berubah; lebar < 1024px memunculkan pesan
desktop-only.

## 6. Milestone 2: Menu Rapor Karakter

### 6.1 Sumber data dan agregasi

Sumber: tabel karakter yang sudah final per siswa/indikator (baca `useKarakterData.js`
dan migration `2026081*` untuk skema persisnya; jangan tebak nama kolom). FIR tidak
menghitung skor baru; yang dilakukan di sini adalah meringkas nilai final untuk
disajikan. Karena volume YPT besar (ratusan sekolah, puluhan ribu siswa), ringkasan
berat dihitung di Postgres lewat VIEW (bukan di React), satu migration
`ypt_karakter_views.sql`:

- `ypt_k_sekolah` — per `sekolah_id` per `periode_id`: `jumlah_siswa`, `rata_total`
  (persen), `rata_per_aspek` (jsonb `{nama_aspek: persen}`). Basis: rata-rata skor
  final siswa.
- `ypt_k_indikator` — per `sekolah_id` per `periode_id` per aspek per indikator:
  `rata_persen` (dipakai Top 5 indikator per jenjang; agregasi lintas sekolah dilakukan
  client-side dari baris ini, tertimbang `jumlah_siswa`).
- `ypt_k_siswa_ekstrem` — per sekolah per periode: 5 siswa skor tertinggi dan 5
  terendah (`row_number()` dua arah), kolom `nama`, `kelas`, `total_persen`, `arah`
  (`atas`/`bawah`).

Semua view `security_invoker = true` supaya RLS tabel dasar tetap berlaku; policy jalur
yayasan pada tabel karakter sudah ada (dipakai `useKarakterYayasan`). Kalau query view
lambat (> 2 detik untuk satu periode), ganti jadi materialized view yang di-refresh
oleh RPC importer karakter; jangan optimasi dini, ukur dulu.

Aturan agregasi (kunci, dipakai konsisten di semua layar):
- Persen jenjang = rata-rata `rata_total` sekolah dalam jenjang, tertimbang
  `jumlah_siswa`.
- Persen yayasan (hero 78%) = tertimbang `jumlah_siswa` atas semua sekolah.
- Persen aspek per jenjang = tertimbang `jumlah_siswa` atas `rata_per_aspek` sekolah
  yang punya aspek itu; sekolah tanpa aspek itu tidak ikut penyebut.
- Aspek dicocokkan lintas sekolah lewat nama aspek apa adanya (jangan hardcode daftar
  aspek satu sekolah; pelajaran importer multi-sekolah). Kolom "Karakter 1..6" di layar
  1d = urutan aspek terpopuler (paling banyak sekolah memakainya), maksimal 6, sisanya
  disembunyikan.
- Panah tren = banding periode terpilih vs periode tepat sebelumnya yang punya data:
  naik kalau delta >= +2 poin persen, turun kalau <= -2, selain itu datar. Threshold di
  `yptMeta.js`. Tanpa periode pembanding: tampilkan datar.
- Insight hero ("Karakter Telkom terbaik ... Empati dan Mandiri") = 2 aspek dengan
  persen yayasan tertinggi, dirangkai template kalimat di frontend. Bukan Gemini.

### 6.2 Perilaku per tab

- **Rangkuman (1a)**: hero persen total + insight; 4 kartu jenjang (persen, jumlah
  sekolah, panah tren); peta titik Indonesia (`DotMapIndonesia`: SVG grid titik statis,
  marker per kota dari `schools.kota` + kamus koordinat `kotaCoords` di `yptMeta.js`;
  kota tanpa koordinat masuk daftar teks di bawah peta, jangan hilang diam-diam). Klik
  marker mengisi panel "Detail Sekolah": persen rata kota + bar per sekolah di kota
  itu; "Lihat selengkapnya" lompat ke tab Penilaian per Sekolah terfilter kota. Bagian
  bawah: Top 3 sekolah per jenjang (empat kartu).
- **Penilaian per Jenjang (1b)**: Top 5 sekolah terbaik dan Top 5 perlu penguatan
  (urut `rata_total` desc/asc, seluruh yayasan, mengikuti filter jenjang aktif); panel
  "Pilih Sekolah" (chip filter Semua/TK/SD/SMP/SMA-K + daftar sekolah, klik memilih);
  panel "Detail Pencapaian" untuk sekolah terpilih: total persen, total siswa, bar per
  aspek, Top 5 siswa terbaik dan Top 5 perlu penguatan dari `ypt_k_siswa_ekstrem`.
  Default sekolah terpilih: peringkat pertama.
- **Penilaian per Karakter (1c)**: kartu jenjang sebagai filter (klik ganti jenjang
  aktif); bar chart persen per aspek untuk jenjang itu; Top 5 indikator terbaik dan
  Top 5 indikator perlu penguatan (rata tertimbang `ypt_k_indikator` lintas sekolah
  jenjang itu, teks indikator penuh). Judul kanan di Figma tertulis "Top 5 Sekolah
  Perlu Penguatan" tapi isinya indikator; implementasikan sebagai "Top 5 Indikator
  Perlu Penguatan".
- **Penilaian per Sekolah (1d)**: tabel semua sekolah; kolom: peringkat, nama, total
  (badge merah + bar), lalu satu kolom per aspek (header nama aspek asli, bukan
  "Karakter n"); chip filter jenjang; sort dropdown (Total Tinggi ke Rendah / Rendah ke
  Tinggi / Nama A-Z); paginasi client-side 15 baris; footer "X dari Y Sekolah". Sekolah
  tanpa data periode itu tampil di akhir dengan tanda "belum ada data", bukan 0%.

## 7. Milestone 3: Menu Citra Sekolah

### 7.1 Sumber data tab 2a-2c: data refleksi Karakter yang sudah ada (keputusan
pemilik produk 2026-08-25)

TIDAK ada tabel baru dan TIDAK ada importer baru untuk tiga tab pertama. Data refleksi
orang tua/siswa sudah diimpor bulanan oleh modul Karakter dan sudah menggerakkan
kategori tampilan "Citra Sekolah di Mata Orang Tua" di `WaliKelasView.jsx`,
`KepsekView.jsx`, dan `YayasanView.jsx`. Kolom yang tersedia per murid per periode
(lihat query di `useKarakterData.js:124/289/483`): `sekolah_id`, `kelas_id`,
`murid_id`, `nama_murid`, `periode_id`, `sumber`, `pernyataan`,
`kategori_pernyataan`, `emosi_anak`, `alasan_emosi`, `dukungan_dibutuhkan`,
`dukungan_lainnya`, `hal_disyukuri`.

Pemetaan ke layar (eksekutor WAJIB verifikasi nilai kategori nyata di produksi lawan
label kartu Figma sebelum mengunci `yptMeta.js`; jangan mengarang mapping):

- **Keberhasilan Sekolah (2a)** <- distribusi `kategori_pernyataan` (atau
  `hal_disyukuri`, tergantung mana yang nilainya cocok dengan 9 kartu Figma:
  "Tumbuh Kebiasaan Positif", "Kepedulian Sekolah", dst). Esai pendampingnya
  `pernyataan`.
- **Bentuk Dukungan (2b)** <- distribusi `dukungan_dibutuhkan` (8 kartu Figma),
  esai dari `dukungan_lainnya`/`pernyataan`.
- **Emosi Anak (2c)** <- distribusi `emosi_anak` (5 sentimen), esai dari
  `alasan_emosi`.

Filter `sumber`: layar YPT memakai refleksi orang tua; kalau sekolah dual-source
(refleksi siswa juga ada, kasus SMK Telkom Purwokerto), ikuti konvensi
`REFLEKSI_SUMBER_URUTAN` di `karakterMeta.js` dan tampilkan sumber orang tua untuk
menu ini (nama menunya "di Mata Orangtua").

### 7.2 View agregat, migration `ypt_cs_views.sql`

Volume refleksi lintas ratusan sekolah terlalu besar untuk dihitung client-side. Buat
view `security_invoker`:

- `ypt_cs_agregat` — per `sekolah_id`, `periode_id`, `topik`
  (`keberhasilan|dukungan|emosi`), `kategori`, `jumlah_siswa` (count dari kolom
  refleksi terkait, baris kosong tidak dihitung).
- Esai TIDAK di-view-kan; diquery langsung dari tabel refleksi dengan filter topik +
  kategori + periode, `limit` 10-20, urut terbaru, baris kosong/strip disaring.

RLS: tabel refleksi sudah punya jalur baca Yayasan (dipakai `useKarakterYayasan`);
verifikasi policy-nya menjangkau kolom refleksi ini, tambah policy hanya kalau kurang.
Helper `my_yayasan_school_ids()` tetap dibuat di migration ini untuk dipakai tabel
baru lain (testimoni, kp, dp).

### 7.3 Sumber data tab Testimoni (2d): spreadsheet baru, sinkronisasi realtime

Sama konsepnya dengan Survey Kepuasan (bagian 8). Spreadsheet template SUDAH DIBUAT:
id `1bFeeBZJcCuzYQKus13le0TdTqWl847U3FSDKHAJtsw8`
("Testimoni Citra Sekolah - Yayasan Pendidikan Telkom"), kolom:

| Kolom | Isi |
|---|---|
| `Timestamp` | waktu masuk (M/D/YYYY H:MM:SS, sama seperti form kepuasan); periode diturunkan dari bulan ini |
| `Nama Sekolah` | nama persis sekolah, resolusi lewat tabel alias yang sama dengan kepuasan |
| `Nama` | penulis testimoni (orang tua/siswa) |
| `Kelas` | kelas anak |
| `Kategori` | `Apresiasi` / `Harapan` / `Saran & Masukan` / `Kritik & Keluhan` |
| `Isi Testimoni` | teks |
| `Tampilkan` | `Ya`/`Tidak`; hanya `Ya` yang tampil di dashboard (gerbang kurasi) |

Dua baris contoh di template ber-`Tampilkan=Tidak`; sinkronisasi tetap menyaringnya.
Syarat: spreadsheet di-share "siapa saja dengan link boleh lihat" supaya Edge Function
bisa fetch CSV export-nya (sama seperti spreadsheet kepuasan).

Tabel `cs_testimoni`: `id` uuid, `row_hash` text unique, `sekolah_id`, `periode_id`,
`nama`, `kelas`, `kategori` kanonik, `teks`, `tampilkan` bool, `submitted_at`.
Sinkronisasinya ditangani Edge Function yang sama dengan kepuasan (bagian 8.2, function
`sync-ypt-sheets` dengan dua sumber); `on conflict (row_hash) do update set tampilkan`
supaya admin bisa menyembunyikan testimoni dari sheet tanpa membuat baris baru.
RLS baca: AdminFammi + jalur yayasan; tanpa policy tulis.

### 7.4 Perilaku per tab

Semua persen tab ini = jumlah kategori / total responden topik itu (seluruh yayasan,
periode terpilih), dari `ypt_cs_agregat`. Daftar kategori kanonik + ikon + urutan di
`yptMeta.js` (ikon diekspor dari Figma, lihat 2.1); kategori tak dikenal dari data
tetap dirender di akhir dengan ikon default, jangan crash.

- **Keberhasilan Sekolah (2a)**: grid 9 kartu kategori: persen, jumlah siswa,
  breakdown bar per jenjang (persen kategori itu di dalam jenjang tsb).
- **Bentuk Dukungan (2b)**: 8 kartu ring-persen + "Top Essay Orangtua": dropdown
  kategori, daftar esai dua kolom (nama murid, badge kelas + nama sekolah, teks).
  Batasi 10 esai per kategori per render, urut terbaru.
- **Emosi Anak (2c)**: 5 kartu sentimen berwarna (navy/hijau/hitam/kuning/merah dari
  Figma) dengan breakdown per jenjang + "Top Essay Perasaan" dengan dropdown sentimen,
  esai dari `alasan_emosi`.
- **Testimoni (2d)**: 4 kartu donut (Apresiasi/Harapan/Saran & Masukan/Kritik &
  Keluhan) dihitung dari `cs_testimoni` ber-`tampilkan=true`; daftar esai per kategori
  dengan aksen warna kategori (garis bawah kartu di Figma). Kartu kanan atas 2d di
  Figma memakai judul "Bentuk Dukungan"; itu salah label mockup, isinya testimoni.

## 8. Milestone 4: Menu Survey Kepuasan

### 8.1 Sumber data: Google Spreadsheet dinamis (keputusan pemilik produk 2026-08-25)

Sumbernya respons live Google Form "Survei Kepuasan Rapor Karakter Fammi", spreadsheet
id `1yLxxa4cvN4vO-0IkvWoUJSXRX_60HGfGrMGqR864RL0` (dibagikan lewat link). Datanya terus
bertambah, jadi jalurnya SINKRONISASI TARIK, bukan upload Excel. Struktur nyata sheet
respons (sudah diverifikasi 2026-08-25), 13 kolom:

1. `Timestamp` (contoh `5/1/2026 11:29:17`, format US M/D/YYYY).
2. `Pilih Nama Sekolah` (uppercase, contoh `SD TELKOM BATAM`; ada nilai kotor seperti
   `SMP TELKOM PADANG (listing history)`).
3. `Peran Anda`: nilai yang muncul `Wali Kelas`, `Guru Mata Pelajaran`, `Wakasek`,
   `Wali Kelas dan BK`; form kemungkinan juga punya `Kepala Sekolah`, `BK`.
4. Sudah membaca laporan? (`Ya` / `Sudah Baca Sebagian` / `Baru Melihat Ringkasannya
   Saja` / `Belum Sempat Membaca`).
5. Tindak lanjut setelah membaca: multi-pilih dipisah koma, kadang tercemar artefak
   `☐ ...` dari label form; normalisasi dengan mencocokkan ke daftar opsi kanonik,
   bukan split koma polos.
6-11. Enam metrik skala 1-5: mudah dipahami, kelengkapan data, relevansi indikator,
   kejelasan rekomendasi tindak lanjut, ketepatan waktu pengiriman, kualitas
   komunikasi Tim Fammi.
12. Esai: satu hal yang paling disukai.
13. Esai: satu hal yang ingin diperbaiki/ditambahkan.

Sheet kedua di file itu berisi kolom bantu daftar sekolah; abaikan. Kenali sheet
respons dari bentuk header (kolom pertama `Timestamp`), bukan nama sheet.

Konsekuensi terhadap Figma 3a/3b (deviasi karena data nyata, sudah selaras arah
pemilik produk, konfirmasi label akhir saat review):
- Daftar metrik = 6 baris ini, bukan 9 label placeholder di mockup. Gaya baris sama.
- Skor "dari 10" tidak ditanyakan langsung; `skor_total` = rata-rata 6 metrik x 2,
  dihitung saat sinkronisasi dan disimpan final (bukan di React).
- Blok kualitatif = 2 esai nyata (paling disukai, saran perbaikan) menggantikan 4 blok
  mockup, ditambah 2 blok baru dari data nyata: distribusi "sudah membaca laporan" dan
  distribusi tindak lanjut (chip berhitung). Ini menggantikan konten placeholder
  dengan sinyal adopsi yang memang ada datanya.

### 8.2 Tabel dan sinkronisasi, migration `kp_tables_and_sync.sql`

- `kp_responden`: `id` uuid, `row_hash` text unique (md5 dari
  timestamp+sekolah+peran+seluruh jawaban; kunci dedup), `sekolah_id`, `periode_id`
  (diturunkan dari bulan Timestamp, contoh `2026-05`), `peran_responden` kanonik
  (`KepalaSekolah|Wakasek|BK|WaliKelas|GuruMapel`), `peran_mentah` text,
  `status_baca` text kanonik, `tindak_lanjut` text[] kanonik, `metrik` jsonb
  (`{mudah_dipahami, kelengkapan, relevansi, kejelasan_rekomendasi, ketepatan_waktu,
  komunikasi}` skala 1-5), `skor_total` numeric (skala 10, hasil hitung sinkronisasi),
  `esai_disukai` text, `esai_saran` text, `submitted_at` timestamptz. Tanpa nama
  responden (form memang anonim).
- `kp_sekolah_alias`: `alias` text pk (nama persis di spreadsheet, sudah di-trim),
  `sekolah_id` fk. Diisi migration untuk semua nama yang sudah muncul (termasuk
  varian kotor `(listing history)`); alias tak dikenal TIDAK di-drop diam-diam,
  disimpan ke `kp_alias_tak_dikenal` (alias, jumlah, terakhir_dilihat) dan dilaporkan
  di hasil sinkronisasi supaya admin menambah aliasnya.
- Edge Function baru `sync-ypt-sheets` (service role, di `supabase/functions/`),
  menangani DUA sumber sekaligus: spreadsheet kepuasan ini dan spreadsheet testimoni
  (bagian 7.3). Per sumber:
  1. Fetch `https://docs.google.com/spreadsheets/d/{id}/export?format=csv&gid={gid
     sheet respons}` (bisa karena file dibagikan lewat link; kalau suatu saat 403,
     laporkan error jelas ke admin, jangan diam).
  2. Parse CSV (hati-hati koma dan newline di dalam kutip), normalisasi peran/status/
     tindak lanjut/metrik, hitung `skor_total`, hitung `row_hash`.
  3. `insert ... on conflict (row_hash) do nothing`. Tidak pernah menghapus; respons
     yang diedit di sheet akan jadi baris hash baru (kejadian langka, biarkan; kalau
     jadi masalah nyata baru pikirkan strategi replace per periode).
  4. Balikan ringkasan: total baris, baris baru, alias tak dikenal, baris invalid.
- Pemicu: satu tombol "Sinkronkan Spreadsheet YPT" di Admin CMS (screen baru sederhana
  yang menampilkan ringkasan hasil kedua sumber + daftar alias tak dikenal). Setelah
  stabil, tambah jadwal harian lewat Supabase scheduled functions/pg_cron yang
  memanggil function yang sama; tombol manual tetap ada.
- Aturan mapping peran (di Edge Function, bukan React): `Wakasek`/`Wakil Kepala
  Sekolah`/mengandung `Kaur` -> `Wakasek`; mengandung `BK` -> `BK` (termasuk
  `Wali Kelas dan BK`, prioritas BK); `Guru Mata Pelajaran`/`Guru Mapel` ->
  `GuruMapel`; `Kepala Sekolah` -> `KepalaSekolah`; sisanya -> `WaliKelas` dengan
  `peran_mentah` tersimpan untuk audit.
- RLS baca `kp_responden`: AdminFammi + jalur yayasan (`my_yayasan_school_ids()`).
  Tabel alias dan alias-tak-dikenal: AdminFammi saja. Tanpa policy tulis.
- Entitlement: perluas check constraint `school_modules_modul_check` dengan `kp`,
  aktifkan `kp` untuk sekolah yang muncul di data, tambah `kp` ke daftar `MODULES`
  CMS (`screens/Sekolah.jsx`, `AddSchoolDialog.jsx`; sekalian tambahkan `lw` yang
  tertinggal di daftar itu). Alternatif lebih sederhana: menu Survey Kepuasan tampil
  kalau ada baris `kp_responden` untuk sekolah yayasan itu; pilih ini kalau tidak mau
  mengurus entitlement per sekolah untuk data yang datang sendiri dari form.
- Catatan arsitektur: CLAUDE.md menyebut Google Sheets tidak lagi dipakai; itu soal
  gerbang baca. Di sini spreadsheet adalah SUMBER HULU yang ditarik server-side sekali
  arah ke Supabase; jalur baca FIR tetap hanya Supabase. Catat kalimat ini di CLAUDE.md
  saat implementasi supaya tidak dianggap regresi.

### 8.3 Perilaku per tab

Semua agregasi tab ini dihitung client-side di `useKpData.js` dari baris `kp_responden`
(volume ratusan baris per periode): rata-rata sederhana per kelompok, tanpa pembobotan.
Chip peran di kedua tab: `Kepala Sekolah`, `Wakasek & Kaur`, `BK`, `Wali Kelas`,
`Guru` (label Figma), memetakan ke nilai kanonik di atas. Peran tanpa responden pada
periode itu tetap dirender dengan angka 0 responden.

- **Rangkuman (3a)**: chip peran sebagai filter; kartu skor besar (`skor_total` rata
  peran terpilih, skala 10, bintang = skor dibulatkan setengah); daftar 6 metrik rata
  (skala 5) dengan bintang; tabel "Perbandingan Skala Kepuasan Keseluruhan" per peran
  (jumlah orang, skor/10, bar); blok insight kutipan = template kalimat frontend
  menyebut peran dengan skor tertinggi. Ilustrasi kartu kiri: ekspor asset dari Figma.
- **Penilaian Kualitatif (3b)**: kartu jumlah responden per peran; panel "Pilih
  Sekolah" (chip peran + daftar sekolah dengan skor rata peran itu, urut skor);
  panel "Detail Penilaian" sekolah terpilih: skor total /10, rata metrik /5,
  distribusi status baca, distribusi tindak lanjut, lalu dua blok esai (gabungan
  jawaban "paling disukai" dan "saran perbaikan" responden peran itu di sekolah itu;
  esai kosong/strip seperti "-" disaring).

## 9. Milestone 5: Menu Dokumentasi Kegiatan

Figma 4a (`86-3321`). Layout: EMPAT baris section, masing-masing carousel horizontal
dengan sepasang tombol panah kiri/kanan (navy) di kanan judul section:

1. **Dokumentasi Video**: kartu putih berisi badge "Video" (ikon kamera merah),
   judul 2-3 baris, thumbnail video, tombol outline lebar penuh "Lihat Rekaman".
2. **Dokumentasi Foto**: kartu lebih besar (2 per baris tampak), foto besar di atas,
   caption judul di bawah.
3. **Link**: kartu tanpa thumbnail: badge "Link" (ikon rantai merah), judul, tombol
   "Buka Link".
4. **File**: kartu tanpa thumbnail: badge "File" (ikon dokumen merah), judul, tombol
   "Lihat File".

Carousel: geser per halaman kartu, tombol panah nonaktif di ujung; section tanpa item
disembunyikan seluruhnya. Ketentuan pixel-perfect 2.1 berlaku penuh (badge, tombol
outline, proporsi kartu, panah).

### 9.1 Tabel dan storage, migration `dp_tables.sql`

- `dp_item`: `id` uuid, `yayasan_id`, `sekolah_id` nullable (null = level yayasan),
  `judul`, `deskripsi`, `jenis` (`video|foto|link|file`), `url`, `thumbnail_url`
  nullable, `tanggal` date, `urutan` int, `aktif` bool. `jenis` menentukan section.
- Foto (dan thumbnail video unggahan manual) disimpan di bucket Storage `dokumentasi`
  (pola fitur logo sekolah yang sudah dirancang: upload lewat Edge Function, bukan
  dari browser dengan anon key; cek status deploy fitur logo dulu, ikuti mekanisme
  yang sama). `url` menyimpan path storage untuk `jenis='foto'`, URL penuh untuk
  lainnya.
- RLS baca: AdminFammi + jalur yayasan. Tulis hanya Edge Function.

### 9.2 CMS

Screen baru "Dokumentasi" di Admin CMS: tabel item + dialog tambah/edit/hapus
(judul, jenis, url atau upload foto, thumbnail opsional untuk video, tanggal, sekolah
opsional, urutan, aktif). Ikuti komponen dialog CMS yang ada. Handler CRUD di
`admin-actions`.

### 9.3 Logika tombol dan preview di `MediaEmbed.jsx` (deterministik, tanpa API pihak
ketiga)

- `jenis='foto'`: `<img>` dari public/signed URL storage; klik membuka lightbox
  sederhana.
- `jenis='video'`: thumbnail = `thumbnail_url` kalau ada; kalau URL YouTube
  (`youtube.com/watch`, `youtu.be`, `/shorts/`), parse videoId dan pakai
  `i.ytimg.com/vi/{id}/hqdefault.jpg`. "Lihat Rekaman": YouTube dibuka sebagai
  `<iframe>` `youtube-nocookie.com/embed/{id}` dalam modal; URL lain (rekaman Zoom
  dsb) dibuka tab baru.
- `jenis='file'`: "Lihat File" membuka modal iframe: Google Slides
  (`docs.google.com/presentation`) diubah ke `/embed?start=false`; Google Drive
  (`drive.google.com/file`) diubah ke `/preview`; URL berakhiran `.pdf` di-iframe
  langsung. Syarat: dokumen di-share publik; kalau iframe gagal dimuat, fallback
  tombol buka tab baru.
- `jenis='link'`: "Buka Link" selalu tab baru; ikon kartu boleh ditemani favicon
  `google.com/s2/favicons?domain=`. Jangan fetch metadata halaman dari browser
  (CORS, privasi).

Semua iframe diberi `sandbox` dan `referrerpolicy="no-referrer"`.

## 10. QA sebelum rilis (jalankan per milestone dan sekali menyeluruh)

Data dan logika:
- Ambil 2 sekolah sampel, hitung manual dari Excel sumber: persen sekolah, persen
  jenjang, top indikator, skor kepuasan per peran; cocokkan dengan layar. Selisih
  pembulatan boleh, selisih logika tidak.
- Upload ulang file importer cs yang sama dua kali: jumlah baris tidak berubah
  (idempotensi). Upload file dengan nama sekolah salah: preview menandai, baris lain
  tetap masuk.
- Sinkronisasi spreadsheet dijalankan dua kali berturut: jalankan kedua melaporkan 0
  baris baru. Tambah satu respons uji di form asli, sinkronkan: baris bertambah satu,
  periode dan skor_total benar. Nama sekolah baru yang belum ada aliasnya muncul di
  daftar alias tak dikenal, tidak hilang diam-diam.
- Testimoni: baris `Tampilkan=Tidak` (termasuk dua baris contoh template) tidak pernah
  tampil; ubah `Tampilkan` di sheet lalu sinkronkan, status di dashboard ikut berubah.
- Citra Sekolah 2a-2c: total jumlah siswa per kategori di layar YPT = hasil count
  manual query tabel refleksi untuk 1 sekolah sampel; kategori yang tidak ada di
  `yptMeta.js` tetap dirender di akhir.
- Periode tanpa data, sekolah tanpa modul, kategori esai kosong: EmptyState, bukan
  crash atau 0% palsu.
- Panah tren benar untuk: ada periode sebelumnya, tidak ada, dan delta di sekitar
  threshold.

Akses (paling kritis, uji dengan query langsung dari console browser memakai anon key):
- Akun YPT: bisa baca `cs_*`, `kp_*`, `dp_item`, view `ypt_k_*` untuk sekolah Telkom;
  TIDAK bisa baca baris sekolah non-Telkom.
- Akun `yayasantkfammi`: UI lama utuh, tidak bisa baca tabel kp/cs/dp sekolah Telkom.
- Akun KepalaSekolah sekolah Telkom: modulnya yang lama tetap normal, tidak ikut
  melihat menu YPT.
- Tidak ada service_role key, tidak ada panggilan Gemini, di seluruh kode ypt/.

Regresi dan visual:
- `useKarakterYayasan` pasca-refactor: tampilan Karakter Yayasan lama identik.
- Login/logout, refresh di tiap menu, ganti periode di tiap tab.
- Bandingkan tiap layar dengan screenshot Figma berdampingan (pixel-perfect sesuai
  standar repo); cek juga viewport 1280 dan 1600.
- Performa: muat Rangkuman Rapor Karakter dengan data penuh < 3 detik; kalau lebih,
  jalankan rencana materialized view di 6.1.

## 11. Rilis production

1. Jalankan migrations berurutan di SQL editor produksi (CSV importer Studio tidak
   dipakai; semua data lewat SQL/importer, sesuai pengalaman sebelumnya):
   naungan+kota -> akun -> views karakter -> cs -> kp -> dp.
2. Deploy Edge Function `admin-actions` versi baru (handler dp) dan Edge Function
   baru `sync-ypt-sheets`; pastikan bucket `dokumentasi` dibuat dan kedua spreadsheet
   (kepuasan + testimoni) di-share "siapa saja dengan link boleh lihat".
3. Jalankan sinkronisasi pertama dari CMS (kepuasan + testimoni), bereskan alias
   sekolah yang tak dikenal, lalu aktifkan `school_modules` `kp` (kalau opsi
   entitlement dipakai).
4. Deploy frontend ke Vercel.
5. Smoke test dengan akun YPT asli: empat menu, satu upload kp/cs kecil sungguhan,
   satu item dokumentasi.
6. Rollback plan: gerbang YPT hanya menyala untuk `cakupan[0]` YPT, jadi kalau ada
   masalah cukup revert deploy frontend; migrations bersifat aditif dan tidak mengubah
   perilaku modul lama.

## 12. Pertanyaan terbuka (tidak memblokir milestone 0-2)

1. Akun: pakai `yayasansmktelkompwt` yang sudah ada atau buat
   `yayasanpendidikantelkom` baru?
2. Pemetaan kategori Citra Sekolah: kolom refleksi mana yang menggerakkan 9 kartu
   "Keberhasilan Sekolah" (`kategori_pernyataan` atau `hal_disyukuri`), dan apakah
   nilai kategori di data produksi cocok dengan label kartu Figma. Diverifikasi
   eksekutor terhadap data produksi (bagian 7.1), dikonfirmasi pemilik produk kalau
   ada selisih label.
3. (Terjawab) Kadensi periode: bulanan untuk kepuasan dan testimoni, diturunkan dari
   Timestamp; Citra Sekolah 2a-2c mengikuti periode refleksi Karakter yang memang
   bulanan.
4. Privasi: desain menampilkan nama siswa (Top 5 siswa, esai) dan berpotensi nama
   responden staf ke level yayasan. Konfirmasi ini memang disetujui YPT; kalau tidak,
   fallback tanpa nama sudah disiapkan (inisial/anonim, kolom nama nullable).
5. Daftar kota + jumlah sekolah per kota untuk peta, dan apakah SMA digabung SMK di
   semua tempat ("SMA/K"). Petunjuk awal dari spreadsheet kepuasan, kota yang sudah
   pasti ada: Batam, Makassar, Padang, Ternate, Banjarbaru, Lampung, Purwokerto,
   Medan, Jakarta, Bandung, Sidoarjo, plus TK Buah Batu dan TK Dayeuhkolot (Bandung
   Raya; konfirmasi mau dipetakan sebagai kota sendiri atau digabung Bandung).
6. Dokumentasi Kegiatan: konfirmasi pengelola kontennya Admin Fammi lewat CMS (sesuai
   rencana ini), dan sumber thumbnail untuk rekaman Zoom (unggah manual, karena Zoom
   tidak menyediakan thumbnail publik).
