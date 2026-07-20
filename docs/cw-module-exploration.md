# Eksplorasi Codebase untuk Modul Baru: Corporate Culture & Wellbeing Development

Dokumen ini murni hasil pembacaan codebase, tidak ada kode yang diubah. Tujuannya jadi rujukan sebelum membangun modul baru "Corporate Culture & Wellbeing Development" (disingkat CW di bawah) di samping modul Rapor Karakter dan Multiple Intelligence (MI) yang sudah ada.

Catatan penting: FIR sekarang adalah dashboard sekolah tujuh peran (lihat CLAUDE.md). Nama modul baru ini terdengar seperti produk B2B/korporat, bukan sekolah. Sebelum membangun, klarifikasi dengan pemilik produk apakah CW ini modul keempat untuk sekolah (mis. mengukur budaya kerja & wellbeing guru/staf) atau produk terpisah yang kebetulan berbagi codebase. Asumsi eksplorasi ini: CW mengikuti pola tiga modul yang sudah ada (Karakter, MI, Screening placeholder), yaitu satu modul baru untuk entitlement sekolah, ditampilkan lewat mesin tampilan yang sama.

Referensi visual yang sudah ada di repo untuk topik ini: `design-reference/project/screenshots/corporate culture benchmark/` (screenshot benchmark produk lain: welcoming message, Penilaian Culture, Penilaian Terhadap Lembaga, Nilai Lembaga & Kesejahteraan - Dashboard, Kesimpulan Culture). Ini kelihatannya referensi kompetitor/inspirasi, bukan desain final Fammi — jangan disalin mentah, tapi bisa dipakai untuk memahami struktur informasi yang diinginkan (radar budaya, bar horizontal per dimensi, dst).

---

## 1. Struktur folder dan pola arsitektur modul

### Routing (bukan react-router, murni state)

`web/src/App.jsx` adalah satu-satunya "router". Tidak ada react-router. Tab aktif disimpan di `useState(activeTab)`, dan `NavBar` (`web/src/components/NavBar.jsx`) memetakan id modul ke label:

```js
const NAV_ITEMS = [
  { id: "overview", label: "Ringkasan" },
  { id: "karakter", label: "Rapor Karakter" },
  { id: "screening", label: "Screening" },
  { id: "mi", label: "Multiple Intelligence" },
];
```

`App.jsx` merender `activeTab === "mi" ? <MIPage/> : activeTab === "karakter" ? <KarakterPage/> : ...` langsung di `<main>`. Modul `screening` saat ini masih placeholder (`Modul ini belum dibangun.`).

Modul yang tampil di NavBar difilter dari `session.modules` (array string, mis. `["karakter","mi"]`), yang datanya diambil dari tabel `school_modules` saat login (lihat bagian 4). **Untuk menambah modul CW, minimal butuh**: entry baru di `NAV_ITEMS`, cabang baru di render `<main>` App.jsx, dan baris `school_modules.modul = 'cw'` (atau nama modul yang disepakati) aktif untuk sekolah yang jadi pilot.

### Dua "shell" berbeda per peran

App.jsx punya dua mode tampilan (`isKarakterShellPeran`):
- **Shell Kepsek/WaliKelas/Yayasan** (`KepalaSekolah`, `WakilKepalaSekolah`, `WaliKelas`, `Yayasan`): satu modul penuh (saat ini dikunci ke "karakter"), tanpa tab Ringkasan, PeriodPicker digabung ke Header, NavBar jadi pill-style di dalam Header (`inlineNav`).
- **Shell generik lain** (AdminFammi tab, dst): tab Overview + tab per modul, NavBar biasa di bawah Header, toolbar Periode terpisah.
- `Siswa`/`OrangTua`: keluar sepenuhnya dari App.jsx, langsung render `<SiswaPage>` (shell mobile-first sendiri, lihat bagian folder `pages/siswa`).
- `AdminFammi`: kalau login sebagai admin CMS, render `<AdminCmsPage>` (tool ops internal, bukan laporan sekolah — lihat memory `project_admin_cms`).

Ini penting untuk CW: modul baru harus diputuskan masuk shell yang mana. Kalau CW ditujukan untuk Kepsek/Yayasan menilai budaya sekolah, kemungkinan ikut pola `isKarakterShellPeran` (perlu diperluas jadi shell multi-modul, karena saat ini shell itu hardcode ke "karakter" — lihat `shellModules` fallback `["karakter"]` di App.jsx:132-134).

### Pola folder per modul (Karakter sebagai contoh paling lengkap)

```
web/src/pages/karakter/
  KarakterPage.jsx          # pintu masuk, switch(session.peran) -> View per peran
  WaliKelasView.jsx         # tampilan lengkap untuk Wali Kelas
  KepsekView.jsx            # tampilan lengkap untuk Kepsek/WakilKepsek/AdminFammi
  YayasanView.jsx           # tampilan lengkap untuk Yayasan (lintas sekolah)
  KarakterShared.jsx        # komponen & sub-komponen dipakai bersama 3 view di atas
                             # (AspekRadarCard, CompareRadarCard, ParentVoiceBento, ScoreBarList,
                             #  Donut, AspekBarList, dialog resume murid, dst) — 1400+ baris
  KarakterViewParts.jsx     # potongan UI kecil (StatCardMini, AllGoodBanner, dll) dipakai lintas view
  KarakterMeta.js           # fungsi murni: parsing angka Indonesia (koma desimal), resolve
                             # konfigurasi aspek per sekolah, format label, dll — TIDAK ada JSX
  useKarakterData.js        # hooks fetch Supabase per peran (useKarakterWaliKelas, dst)
  DetailDialog.jsx          # modal generik dipakai banyak dialog detail
  KebijakanGoals.jsx        # sub-komponen tindak lanjut kebijakan (checklist 7/30/66 hari)
  dummyKebijakan.js         # data contoh (KEBIJAKAN_WALIKELAS dst) sebelum Gemini mengisi
  *.module.css              # satu file besar per modul (KarakterViews.module.css, KarakterShared.module.css)
```

Pola ini **satu mesin tampilan, cabang per peran**, persis sesuai CLAUDE.md butir 4 ("Satu mesin tampilan untuk tiga modul. Perbedaan antar modul ada di data/konfigurasi, bukan di kode"). Konkretnya: `KarakterPage.jsx` cuma switch statement, semua logic berat ada di `*View.jsx` + `KarakterShared.jsx`.

MI (`web/src/pages/mi/MIPage.jsx`) jauh lebih sederhana: satu file 360 baris, satu komponen untuk semua peran yang bisa mengaksesnya (belum ada pemisahan Kepsek/WaliKelas/Yayasan — semua lihat agregat sekolah yang sama). MI cocok jadi acuan kalau CW awalnya scope-nya sederhana (satu tampilan agregat sekolah, belum perlu drill-down per peran).

**Rekomendasi struktur untuk CW**: buat folder `web/src/pages/cw/` dengan pola yang sama:
```
web/src/pages/cw/
  CwPage.jsx            # switch(session.peran)
  KepsekView.jsx / WaliKelasView.jsx / YayasanView.jsx  # (kalau butuh drill-down per peran)
  CwShared.jsx          # kartu radar/bar/dst yang dipakai lintas view
  cwMeta.js             # parsing angka, resolve config, fungsi murni
  useCwData.js          # hooks fetch Supabase
  *.module.css
```
Kalau scope awal CW sederhana (satu agregat sekolah, belum beda per peran), ikuti pola MI dulu (satu file), baru dipecah ke pola Karakter kalau sudah perlu differensiasi per peran.

### State management & data fetching

Tidak ada Redux/Zustand/Context global untuk data modul (Admin CMS punya `CmsStore.jsx` sendiri, tapi itu khusus tool internal admin). Pola standarnya:

1. Custom hook `useXxxData(session, periodeId)` di file terpisah (`useKarakterData.js`, atau inline di `MIPage.jsx` sebagai `useMIData`).
2. Hook itu `useState` untuk `loading`, `data`/`rows`, `error`, lalu `useEffect` yang memanggil Supabase langsung lewat `supabase.from(...)`.
3. Query selalu difilter `sekolah_id`/`school_id` dari `session`, dan `.eq("status", "disetujui")` untuk tabel `tindak_lanjut`/`briefing`.
4. Kalau baris berpotensi >1000 (skor per murid, dst), pakai `fetchAllRows` helper dari `lib/supabase.js` untuk paginasi manual (Supabase/PostgREST diam-diam memotong di 1000 baris).
5. Komponen halaman membaca hasil hook, proses agregasi/format dilakukan di React (angka sendiri **sudah final dari Supabase**, FIR cuma mem-format tampilan — lihat CLAUDE.md butir 3).
6. State loading/error dirender pakai pola seragam (`KarakterStateBox` / `ErrorState` lokal di MIPage) — spinner + pesan "Memuat data ... " / pesan gagal + tombol "Coba lagi".

Untuk CW, ikuti pola sama: `useCwData(session, periodeId)` yang query tabel baru (mis. `cw_hasil`, `cw_aspek_config`, dst — nama final tunggu keputusan skema data, lihat bagian 4).

---

## 2. Design system

### Token warna & tipografi (lihat juga `web/src/tokens.css`, sudah dikutip lengkap di CLAUDE.md)

- Font utama: **Plus Jakarta Sans** (`--font-body`), **Space Grotesk** untuk angka/judul tegas (`--font-display`), **JetBrains Mono** kalau perlu.
- Ungu utama `--purple-600 #6323DA`, skala 050/100/300/600/700.
- Tinta: `--ink`, `--ink-2`, `--ink-3`, `--ink-4` (gradasi gelap ke terang).
- Latar hangat: `--bg`, `--bg-2`, `--surface`, `--surface-soft`.
- Garis: `--line`, `--line-warm`.
- Status 3 tingkat (dipakai hemat, cuma penanda kecil): `--status-safe(-bg)` hijau, `--status-warn/--status-caution(-bg)` kuning, `--status-alert(-bg)` merah.
- Data-viz spoke warna (radar/bar multi-seri): `--dv-1` s/d `--dv-8`.
- Radius: `--radius-sm/md/lg/xl` (12/16/22/28).
- Shadow: `--shadow-card` (lembut), `--shadow-hero` (kebiruan-ungu tipis).

**Pengecualian yang sudah ada dan disengaja**: modul Karakter (semua view Wali Kelas/Kepsek/Yayasan) dan laporan MI individu siswa (`BakatView` di `SiswaPage.jsx`) memakai **Montserrat** + latar abu `#EDEDF0`, di-scope lokal lewat override `--font-body`/`--font-display` di dalam `.page` class masing-masing CSS module (lihat `KarakterViews.module.css` baris 2-8: `--font-body: "Montserrat", sans-serif;`). Header/NavBar/LoginPage/MIPage agregat tetap pakai token biasa.

**Untuk CW**: defaultnya pakai token standar (Plus Jakarta Sans + palet ungu/hangat), KECUALI pemilik produk secara eksplisit minta disamakan dengan gaya Karakter/MI Individu (Montserrat + abu). Jangan menebak — ini salah satu dari sedikit hal yang sudah "dikunci" lewat instruksi berulang di CLAUDE.md, jadi kalau CW mau ikut gaya itu juga, sebaiknya dikonfirmasi eksplisit, bukan diasumsikan dari nama modul yang terdengar "korporat".

### Komponen shared (folder `web/src/components/`)

| Komponen | Fungsi |
|---|---|
| `Header.jsx` | Header aplikasi: nama user, peran, sekolah, tombol logout, opsional PeriodPicker inline + NavBar inline (dipakai shell Kepsek) |
| `NavBar.jsx` | Tab navigasi modul, mode biasa atau pill |
| `PeriodPicker.jsx` | Pemilih periode (bulanan/lain), dipakai di toolbar atau inline di Header |
| `BriefingHero.jsx` | Hero briefing naratif 2-3 kalimat + pill periode + tag sumber — **wajib ada di tiap modul** (lihat CLAUDE.md "Dua elemen hero yang tidak boleh hilang") |
| `FollowupRibbon.jsx` + `FollowupCard.jsx` | Kartu tindak lanjut prioritas, urut tinggi→rendah, maks 3/baris desktop — **wajib ada** |
| `SectionHeading.jsx` | Judul + subjudul section, dipakai konsisten di semua modul |
| `StatTile.jsx` | Kartu angka ringkas (dipakai MIPage: "Siswa terpetakan", dst) |
| `SampleTag.jsx` | Badge kecil "Contoh" — wajib ditempel setiap kali data yang ditampilkan bukan data asli sekolah (CLAUDE.md: "Jangan menampilkan angka contoh seolah temuan nyata") |
| `charts/RadarChart.jsx`, `charts/GroupedBarChart.jsx` | Lihat bagian 3 |

Pola kartu (`.card` class) konsisten di semua CSS module: `background: var(--surface)`, `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-card)`, padding ~20-24px, judul via `.cardTitle` (font-display/bold) + `.cardSub` (ink-3, kecil).

### Tabel

Tidak ada komponen `<Table>` generik — tiap modul menulis `<table>` HTML manual dengan class module-scoped (lihat `KelasTable` di `MIPage.jsx`: `styles.tableWrap > table.styles.table > thead/tbody`, styling minimal, header bold, kolom angka `text-align:right` via `.tdNum`). Untuk CW kalau butuh tabel, ikuti pola manual yang sama, jangan cari komponen tabel yang tidak ada.

### Header laporan

Tidak ada komponen "ReportHeader" generik terpisah dari `Header.jsx` aplikasi. Tiap halaman modul (MIPage, WaliKelasView dkk) punya "hero label" sendiri di atas: pill nama modul + `SampleTag` kalau data contoh (lihat `MIPage.jsx` baris 272-275: `<span className={styles.heroPill}>Multiple Intelligence</span>`). Modul Karakter malah punya elemen lebih kaya, `AskMascot` (logo Fammi + 3 pilihan kategori "Lihat mutu layanan / Citra sekolah / Tindak lanjut sekolah") sebagai pengganti "Ringkasan Sekolah" — pola navigasi kategori yang bisa dicontoh CW kalau punya beberapa sub-kategori (mis. "Nilai Lembaga" vs "Kesejahteraan" vs "Tindak Lanjut" mirip screenshot benchmark yang ada di `design-reference`).

---

## 3. Library chart

**Tidak ada library chart eksternal** (bukan Recharts, Chart.js, D3, Nivo, dst — cek `package.json` tidak menyebutkan satupun). Semua grafik adalah **SVG murni ditulis tangan** sebagai komponen React polos di `web/src/components/charts/`:

- **`RadarChart.jsx`** — sudah persis yang dibutuhkan CW untuk "radar/spider chart". Mendukung:
  - Mode satu seri: `<RadarChart axes={[{label, short, value, max, color}]} size={280}/>`
  - Mode overlay multi-seri (perbandingan entitas): `<RadarChart series={[{name, color, axes:[...]}]} size={280}/>`
  - Minimal 3 axis (return `null` kalau kurang).
  - Grid ring dashed di 25/50/75%, solid di 100%, spoke garis dari pusat.
  - Value `null` diperlakukan sebagai 0 di fraksi tapi TIDAK memaksa 0 — kode pemanggil bertanggung jawab tidak mengirim data palsu (lihat komentar di `MIPage.jsx`/`KarakterShared.jsx`: "Biarkan null, bukan 0, kalau belum ada data").
  - Warna via CSS var per axis atau per seri, label pakai `--font-body`.
  - Legend otomatis muncul di bawah kalau mode overlay.
  - **Langsung reusable untuk CW tanpa modifikasi** — tinggal pasok `axes`/`series` sesuai dimensi budaya/wellbeing yang mau diukur.

- **`GroupedBarChart.jsx`** — bar per kategori, tiap kategori berisi beberapa bar horizontal berwarna beda per entitas (`categories: [{key,label}]`, `series: [{name,color,values:{[key]:0-100}}]`). Ini yang paling dekat dengan "horizontal bar chart" yang diminta CW, tapi bentuknya khusus **perbandingan antar-entitas per kategori** (dipakai untuk >3-4 entitas dibanding, radar mulai susah dibaca). Kalau CW butuh horizontal bar chart yang lebih generik (mis. skor tunggal per dimensi, bukan perbandingan entitas), kemungkinan perlu komponen baru turunan pola ini — pola yang sama (div flex + width% + border-radius 99, tanpa SVG) bisa dipakai langsung, karena `KarakterShared.jsx` juga sudah punya varian serupa: `ScoreBarList` (bar horizontal generik untuk skor apa pun, dengan warna otomatis ikut palet status 3-tingkat lewat `classifyBarTone`) dan `AspekBarList` (bar horizontal per aspek dengan reveal-animasi saat masuk viewport). **`ScoreBarList` di `KarakterShared.jsx` kemungkinan paling cocok dicontek/dipakai ulang untuk horizontal bar chart CW** karena sudah generik (terima `items:[{label,value,key,icon}]`, sort otomatis descending, warna ikut cutoff status).

- **`Donut`** (juga di `KarakterShared.jsx`, bukan folder `charts/`) — donut/pie sederhana satu nilai, SVG `<circle>` dengan `strokeDasharray`, animasi reveal saat masuk viewport. Berguna kalau CW butuh gauge skor tunggal (mis. skor wellbeing keseluruhan).

Semua chart pakai pola sama: **SVG polos, warna dari CSS var, animasi reveal via `IntersectionObserver`** (helper `useReveal` di `KarakterShared.jsx`, bukan diekspor tapi polanya bisa disalin — cek fallback timeout 900ms kalau `IntersectionObserver` tidak tersedia). Tidak ada tooltip hover interaktif di semua chart yang ada sekarang — kalau CW butuh tooltip, itu akan jadi penambahan baru, bukan pola existing.

**Kesimpulan untuk kebutuhan CW (radar + horizontal bar)**: kedua kebutuhan sudah punya padanan langsung reusable (`RadarChart` dan `ScoreBarList`/`GroupedBarChart`), tidak perlu menambah dependency chart baru. Ikuti gaya SVG-manual + CSS var supaya konsisten dengan modul lain.

---

## 4. Bagaimana modul existing menerima data

**Tidak ada file JSON statis dan tidak ada REST API custom.** Semua data datang dari **query Supabase langsung dari browser** via `@supabase/supabase-js` (anon key), ditegakkan oleh RLS Postgres. Alurnya persis "Kontrak gerbang baca" di CLAUDE.md:

1. Login (`lib/auth.js`): `supabase.auth.signInWithPassword()` dengan email `username@fammi.internal`.
2. Baca `profiles` (filter `id = auth.uid()`) untuk peran, `school_id`, `cakupan`, `murid_id`.
3. Baca `school_modules` (filter `school_id`, `aktif = true`) untuk daftar modul yang aktif → jadi `session.modules`, dipakai `NavBar` untuk filter tab.
4. Tiap halaman modul query tabel data sendiri, filter `sekolah_id`/`school_id` dari session, plus `.eq("status","disetujui")` untuk tabel tindak lanjut/briefing.
5. RLS di Postgres menegakkan ulang batas yang sama walau kode React lupa filter.

Data mentah **masuk ke Supabase lewat importer terpisah**, bukan lewat FIR itu sendiri saat baca:
- `web/src/pages/admin/importers/karakterImporter.js`, `miImporter.js`, `guruImporter.js` — dijalankan dari Admin CMS (`AdminCmsPage.jsx` → layar Upload), baca file Excel/CSV (pakai lib `xlsx`), normalisasi header (toleran spasi/underscore/strip/nbsp), parse angka format Indonesia (koma desimal), lalu tulis ke tabel Supabase terkait (`karakter_skor`, `karakter_summary`, `mi_hasil`, dst) lewat `supabase.from(...).insert/upsert`.
- Tindak lanjut & briefing: diisi lewat pipeline Gemini di hulu (batch, di luar repo ini) ATAU trigger on-demand dari FIR yang memanggil Supabase Edge Function (server-side) — keduanya menulis ke `tindak_lanjut`/`briefing` dengan status `menunggu_persetujuan`, lalu **admin approve manual** lewat layar Antrian di Admin CMS sebelum baris itu `status='disetujui'` dan boleh tampil ke sekolah. FIR jalur baca sendiri **tidak pernah** memanggil Gemini dan tidak pernah menampilkan baris yang belum disetujui.

Tabel-tabel spesifik per modul (bukan skema generik satu-untuk-semua):
- Karakter: `karakter_skor`, `karakter_summary`, `karakter_skor_indikator`, `karakter_aspek_config` (konfigurasi label aspek per sekolah, diisi manual admin lewat SQL, bukan importer), `karakter_pernyataan_orangtua`.
- MI: `mi_hasil` (kolom skor per kecerdasan langsung + `detail` jsonb berisi `top_1` hasil final hulu).
- Semua modul: `tindak_lanjut` (filter `modul = 'karakter' | 'mi' | ...`), `briefing`.

**Untuk CW**: kemungkinan besar butuh tabel baru khusus (skema belum ada — bukan bagian dari `docs/Skema_Data_dan_Mesin_Tampilan_FIR_v1.md` yang eksis, itu dokumen skema lama untuk 3 modul awal). Perlu keputusan pemilik produk soal: nama tabel (`cw_hasil`? `cw_skor`?), dimensi apa yang diukur (nilai lembaga, kesejahteraan, budaya kerja — lihat kategori di screenshot benchmark), siapa respondennya (guru/staf, bukan siswa/orangtua seperti 3 modul lain — ini beda besar dari pola RLS yang ada, yang selama ini di-scope ke `murid_id`/kelas siswa). RLS baru dan constraint `school_modules.modul` juga perlu ditambah untuk id modul CW ini.

---

## 5. Pola yang harus diikuti supaya modul baru konsisten

Ringkasan aturan wajib (detail lengkap di CLAUDE.md, jangan diulang mentah di sini, tapi poin paling relevan untuk membangun CW):

1. **FIR tidak menghitung apa pun.** Skor/status/dominan CW harus sudah final di tabel Supabase sebelum dibaca. Jangan taruh logika skoring atau cutoff kualitatif di kode React.
2. **RLS wajib** di tabel baru CW, filter berdasarkan `school_id` (dan kemungkinan `guru_id`/`staf_id` kalau respondennya staf, bukan `murid_id`).
3. **Dua elemen hero wajib**: `BriefingHero` (briefing naratif) + `FollowupRibbon` (tindak lanjut prioritas, field `action`/`trigger_desc`/`modul`/`priority` map persis ke tabel `tindak_lanjut`).
4. **Gerbang persetujuan**: tindak lanjut/briefing CW harus `status='disetujui'` sebelum muncul di FIR, tanpa kecuali, termasuk hasil trigger on-demand.
5. **Satu mesin tampilan**: bangun `CwPage.jsx` sebagai switch peran tipis, logic berat di `CwShared.jsx`/`*View.jsx`, bukan duplikasi kode per peran.
6. **Reuse komponen shared** dulu (`BriefingHero`, `FollowupRibbon`, `SectionHeading`, `StatTile`, `SampleTag`, `RadarChart`, `GroupedBarChart`, dan pola `ScoreBarList`/`Donut` dari `KarakterShared.jsx`) sebelum menulis komponen baru.
7. **Token desain default**, kecuali diinstruksikan eksplisit untuk ikut pengecualian Montserrat seperti Karakter — jangan menebak, tanya dulu.
8. **`SampleTag`** wajib menyertai setiap angka contoh, dan begitu ada data asli sebagian (tindak lanjut ada tapi skor belum), tampilkan pesan kosong jujur, jangan campur data asli dengan angka contoh acak dalam satu tampilan (lihat pola `isSample`/`showStatsEmpty` di `MIPage.jsx`).
9. **Fetch pakai `fetchAllRows`** dari `lib/supabase.js` kalau baris berpotensi >1000 (data per staf/guru untuk sekolah besar).
10. **Parsing angka format Indonesia** (koma desimal) — pakai helper `pct()` yang sudah ada polanya di `karakterMeta.js`/`karakterImporter.js`, jangan `parseFloat` polos.
11. **Responsif sesuai peran**: kalau CW dipakai Yayasan, desktop-only cukup; kalau dipakai Kepsek/WaliKelas, wajib responsive penuh; kalau ada laporan individu staf mirip laporan individu siswa, mobile-first.
12. **Empat parameter yang masih terbuka** di CLAUDE.md (cutoff skor MI, skala maksimum MI, pemetaan ordinal Karakter, nilai nol Interpersonal) TIDAK relevan langsung ke CW, tapi pola yang sama berlaku: kalau CW punya cutoff skor→status kualitatif sendiri, itu juga harus dikonfirmasi pemilik produk dulu, jangan ditebak.

### Checklist konkret membangun CW (urutan yang masuk akal)

1. Konfirmasi ke pemilik produk: skema tabel baru, siapa respondennya (staf/guru?), peran mana saja yang bisa akses, apakah masuk shell Kepsek (single-module) atau shell generik (multi-tab).
2. Tambah `school_modules.modul` value baru + constraint kalau ada, RLS di tabel baru.
3. Buat `web/src/pages/cw/` mengikuti pola MI (sederhana) atau Karakter (per-peran) tergantung hasil poin 1.
4. Tambah entry `NAV_ITEMS` di `NavBar.jsx` dan cabang render di `App.jsx`.
5. Bangun hero (`BriefingHero` + `FollowupRibbon`) dulu sebelum visual detail — itu yang wajib ada di semua modul.
6. Pasang `RadarChart` untuk profil dimensi budaya, `ScoreBarList`/`GroupedBarChart` untuk breakdown horizontal per dimensi/departemen.
7. Importer data (kalau lewat Excel/CSV) ikut pola `karakterImporter.js`: normalisasi header toleran, parsing angka format Indonesia, upsert ke tabel CW.
8. Uji dengan `SampleTag` dulu (data contoh) sebelum data asli sekolah pilot tersedia.
