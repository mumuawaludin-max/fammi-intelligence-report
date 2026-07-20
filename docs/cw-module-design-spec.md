# Design Spec: Modul Corporate Culture & Wellbeing Development (CW)

Dibuat dari pembacaan langsung dua wireframe Figma (`Laporan Individu culture.svg`, `Laporan Agregat untuk Pimpinan.svg`) dan seluruh folder benchmark visual di `design-reference/project/screenshots/corporate culture benchmark/`. Belum ada kode ditulis. Dokumen ini adalah spec, bukan implementasi.

Cara baca dokumen ini: tiap komponen ditandai **[REUSE]** (pakai komponen yang sudah ada persis atau dengan props baru), **[BARU]** (komponen baru khusus CW, belum ada padanannya), atau **[BARU – pola existing]** (komponen baru tapi meniru pola visual/interaksi yang sudah ada di modul lain). Tiap keputusan yang masih terbuka ditandai 🔶 **OPEN** inline, dan direkap ulang di bagian 8.

---

## 0. Keputusan dari sesi klarifikasi

Sebelum menulis spec ini, empat hal ditanyakan dan dijawab:

1. **Subjek asesmen**: CW adalah modul keempat FIR. Entitas "Individu" setara "siswa" di modul lain, tapi yang mengisi asesmen adalah **guru dan/atau karyawan** (staf sekolah), bukan siswa. Untuk sisi pimpinan, ada **peran baru: "Manajemen"** — karena konteksnya korporat/internal-lembaga, bukan akademik seperti Kepsek menilai siswa.
2. **Taksonomi status**: CW dapat **token warna baru**, terpisah dari palet 3-tingkat existing (aman/perhatian/waspada). Nilai hex diusulkan di bagian 2, masih 🔶 **OPEN** untuk sign-off final pemilik produk.
3. **Gaya visual**: **token standar FIR** (ungu #6323DA, latar krem, Plus Jakarta Sans/Space Grotesk). Benchmark HANYA dipakai untuk pola card/badge/progress bar, warnanya tidak dipakai.
4. **Data wireframe yang hilang**: lanjut dengan asumsi + tandai TODO — dua label kartu yang terpotong di section "Penilaian Terhadap Lembaga", dan struktur "Laporan Kelompok" yang cuma disebut di sidebar tanpa wireframe.

Satu hal besar yang **belum ditanyakan eksplisit tapi krusial** dan saya angkat sebagai 🔶 **OPEN** di bagian 8: siapa yang login untuk mengisi/melihat "Laporan Individu" miliknya sendiri (guru/karyawan) — apakah pakai peran `WaliKelas` yang sudah ada, atau perlu peran baru lagi (mis. `Karyawan`/`Staf`). Jawaban "role baru = Manajemen" cuma menjawab sisi pimpinan, bukan sisi pengisi.

---

## 1. Peta peran & navigasi

### Peran yang terlibat

| Peran | Status di FIR | Akses CW |
|---|---|---|
| **Manajemen** | 🔶 **BARU**, belum ada di `profiles_peran_check` | Dashboard CW (Kesimpulan Culture + Nilai Lembaga + Kesejahteraan), Laporan Kelompok, bisa buka Laporan Individu tiap guru/karyawan |
| Guru/karyawan (pengisi Individu) | 🔶 **OPEN** — lihat bagian 8 | Laporan Individu miliknya sendiri (mobile-first, mirip pola Siswa/OrangTua) |
| KepalaSekolah / WakilKepalaSekolah / Yayasan | Existing | 🔶 **OPEN** — apakah mereka juga otomatis dapat akses CW (mis. Kepsek = subset "Manajemen" untuk sekolahnya), atau CW murni domain peran `Manajemen` baru dan terpisah dari hierarki akademik? Direkomendasikan: `Manajemen` scoped ke `school_id` sama seperti `KepalaSekolah`, tapi sebagai peran berdiri sendiri (bukan alias), karena penilaian budaya kerja internal secara konsep terpisah dari kualitas akademik siswa yang jadi domain Kepsek. |
| AdminFammi | Existing | Akses penuh (pola sama seperti modul lain — AdminFammi selalu ikut cabang KepsekView-equivalent) |
| OrangTua / Siswa | Existing | Tidak relevan untuk CW |

### Konflik arsitektur: sidebar wireframe vs NavBar existing 🔶 OPEN — rekomendasi diberikan

Wireframe Dashboard Pimpinan (`Laporan Agregat untuk Pimpinan.svg`) memakai **sidebar kiri desktop** dengan 3 item: "Dashboard NF" (logo/judul), "Laporan Kelompok", "Laporan Individu". FIR saat ini **tidak punya pola sidebar sama sekali** — semua modul pakai `Header` + `NavBar` tab horizontal di atas (lihat `docs/cw-module-exploration.md` bagian 1). Memperkenalkan sidebar berarti CW jadi satu-satunya modul dengan chrome navigasi berbeda dari 3 modul lain, melanggar semangat "satu mesin tampilan" CLAUDE.md butir 4.

**Rekomendasi**: perlakukan sidebar itu sebagai **chrome/navigasi**, bukan **hierarki informasi konten** — jadi boleh diadaptasi ke pola existing tanpa melanggar aturan "wireframe menentukan struktur". Tiga item sidebar dipetakan jadi entri baru di `NAV_ITEMS` (`NavBar.jsx`), tampil sebagai tab kalau peran = `Manajemen`, mengikuti pola `pillNav`/`inlineNav` yang sudah dipakai shell Kepsek:

```
NAV_ITEMS tambahan: { id: "cw-dashboard", label: "Dashboard Budaya" },
                     { id: "cw-kelompok",  label: "Laporan Kelompok" },
                     { id: "cw-individu",  label: "Laporan Individu" }
```

Isi tiap tab (urutan section, komponen) tetap 100% ikut wireframe — yang berubah cuma cara berpindah antar-tab (tab horizontal, bukan sidebar). Kalau pemilik produk keberatan dengan adaptasi ini dan tetap mau sidebar literal, itu jadi penambahan pola shell baru yang perlu disetujui eksplisit karena berdampak ke `App.jsx` untuk semua peran, bukan cuma CW.

### Shell & responsivitas 🔶 OPEN

- **Manajemen**: wireframe Agregat berbentuk desktop (1280px). Berdasarkan CLAUDE.md butir 8, defaultnya semua peran wajib responsive penuh KECUALI Yayasan (desktop-only). Karena "Manajemen" adalah peran baru, perlu keputusan eksplisit: apakah dia ikut default (responsive penuh, seperti Kepsek/WaliKelas) atau desktop-only (seperti Yayasan)? Rekomendasi: **responsive penuh**, karena wireframe tidak memberi sinyal ini modul khusus meja kerja, dan HP tetap jadi alat utama guru/karyawan sehari-hari.
- **Guru/karyawan (Laporan Individu)**: wireframe berbentuk mobile (402px), sapaan personal "Halo, [Nama]" — cocok pola **mobile-first**, sama seperti `SiswaPage.jsx`. Direkomendasikan reuse arsitektur SiswaPage (keluar dari shell App.jsx generik, render halaman mobile tersendiri), bukan dipaksa masuk shell desktop Header+NavBar.

---

## 2. Taksonomi status baru (token yang diusulkan) 🔶 OPEN — perlu sign-off hex final

Wireframe pakai dua skala predikat berbeda:

**A. Predikat Gap** (dipakai di 4 kartu "Aspek" individu + dashboard pimpinan), tingkatnya dari yang ditemukan di wireframe: `Selaras` (tidak ada gap/selaras dengan harapan), `Ringan`, `Perlu Diamati`, `Perlu Intervensi` (paling parah). Urutan ini asumsi berdasarkan makna kata, bukan dari sumber yang eksplisit menyebut urutan — 🔶 **OPEN**, perlu dikonfirmasi urutan finalnya benar sepert ini atau ada tingkat lain di antara.

**B. Predikat Nilai** (dipakai di "Nilai Lembaga" pimpinan: Kepemimpinan/Management/dst), contoh yang muncul di wireframe cuma `Sangat Tinggi` (karena semua data dummy 78-84%). Skala penuhnya kemungkinan 5-tingkat lazim di survei Indonesia: `Sangat Rendah / Rendah / Sedang / Tinggi / Sangat Tinggi` — 🔶 **OPEN**, ini tebakan berdasar konvensi umum, bukan dari wireframe (wireframe cuma menunjukkan satu titik skala).

Token baru yang diusulkan di `tokens.css` (nama & posisi hex proposal, BUKAN keputusan final):

```css
/* ---- CW: Predikat Gap (4 tingkat, hijau -> merah) ---- */
--cw-gap-selaras:      #2E9E6B;  /* selaras — reuse hijau status-safe */
--cw-gap-selaras-bg:   #E7F4EE;
--cw-gap-ringan:       #7FB86B;  /* hijau lebih muda, BARU */
--cw-gap-ringan-bg:    #EEF6E9;
--cw-gap-diamati:      #D69219;  /* reuse kuning status-warn */
--cw-gap-diamati-bg:   #FAF1DC;
--cw-gap-intervensi:   #D6455A;  /* reuse merah status-alert */
--cw-gap-intervensi-bg:#FBE7EA;

/* ---- CW: Predikat Nilai (5 tingkat) ---- */
--cw-nilai-sangat-rendah: #D6455A;
--cw-nilai-rendah:        #E07A4E;  /* BARU, oranye */
--cw-nilai-sedang:        #D69219;
--cw-nilai-tinggi:        #7FB86B;  /* BARU */
--cw-nilai-sangat-tinggi: #2E9E6B;
```

Catatan: dua tingkat tengah (`--cw-gap-ringan`, `--cw-nilai-rendah`, `--cw-nilai-tinggi`) genuinely baru (bukan reuse token existing) supaya gradasi 4-5 tingkat terasa halus, bukan lompat kasar hijau→kuning→merah. Endpoint-nya (hijau paling baik, merah paling buruk) sengaja reuse hex status existing supaya tetap dalam satu keluarga warna FIR, bukan palet asing.

---

## 3. Daftar layar

| # | Layar | Peran | Shell | Sumber wireframe |
|---|---|---|---|---|
| 1 | **CW — Laporan Saya** (welcome + kesimpulan + penilaian culture + penilaian lembaga, satu halaman scroll) | Guru/karyawan (🔶 peran belum pasti) | Mobile-first, mandiri (pola SiswaPage) | `Laporan Individu culture.svg` (utuh) |
| 2 | **CW — Dashboard** (kesimpulan culture + nilai lembaga + kesejahteraan, satu halaman scroll) | Manajemen, AdminFammi | Desktop-responsive, shell NavBar existing | `Laporan Agregat untuk Pimpinan.svg` (utuh) |
| 3 | **CW — Laporan Kelompok** | Manajemen, AdminFammi | Desktop-responsive | 🔶 **Tidak ada wireframe** — lihat bagian 4.3 untuk proposal terbuka |
| 4 | **CW — Laporan Individu (tampilan Manajemen)** | Manajemen, AdminFammi | Desktop-responsive | Reuse Layar 1 (isi identik), dibuka via picker nama dari Layar 3 atau pencarian |

Wireframe tidak memisah "Kesimpulan Culture Individu" / "Penilaian Culture Individu" / "Penilaian Terhadap Lembaga" jadi 3 layar berbeda (sekalipun folder benchmark menamainya terpisah) — di file SVG aslinya ketiganya adalah **section dalam satu halaman scroll**, urut dari atas: welcome → kesimpulan → penilaian culture → penilaian lembaga. Begitu juga sisi pimpinan: "Kesimpulan Culture Dashboard" dan "Nilai Lembaga & Kesejahteraan Dashboard" (dua nama folder benchmark berbeda) ternyata satu halaman scroll yang sama di wireframe. Spec ini ikut struktur wireframe (satu halaman, section berurutan), bukan penamaan folder benchmark.

---

## 4. Detail tiap layar

### 4.1 Layar "CW — Laporan Saya" (Individu)

Urutan section persis wireframe, atas ke bawah:

#### Section A — Welcome header
- **Isi**: "Halo, [Nama]" (nama bold), subteks 1 baris ("Lembaga ini adalah sebuah 'Ladang' bagi Anda" di wireframe — kalimat ini kemungkinan tagline khusus, 🔶 **OPEN** apakah dipakai apa adanya atau diganti kalimat FIR sendiri).
- **Komponen**: **[BARU]** `CwWelcomeHeader` — simple, cuma 2 baris teks. Style-nya di benchmark selalu dalam kartu gelap besar dengan foto profil (lihat `welcoming message & profil paling atas/*.png`), tapi karena keputusan #3 (token standar FIR), versi FIR-nya cukup teks polos di atas latar halaman seperti pola `heroLabel` di `MIPage.jsx`, TANPA kartu gelap/foto profil — kecuali pemilik produk secara eksplisit minta kartu hero bergambar seperti benchmark.
- **Data**: `nama` dari `profiles.nama` (session), kalimat tagline dari 🔶 config/hardcode (perlu diputuskan sumbernya).

#### Section B — Kesimpulan Culture (hero card)
Wireframe: kartu hitam judul "Penilaian Anda Terhadap Lembaga" berisi dua progress bar berdampingan (Total Nilai Sekarang / Total Nilai Harapan, masing-masing dengan badge %), lalu di bawahnya baris "Nilai Gap [67%]" terhubung garis putus-putus ke "Predikat Gap [Ringan]".

- **Komponen**:
  - **[BARU]** `CwKesimpulanCard` — wadah kartu, judul, dua progress bar berdampingan. Tidak ada padanan existing (bar-berdampingan-dengan-2-label beda dari `AspekBarList`/`ScoreBarList` yang selalu satu bar per baris).
  - **[BARU]** `CwGapIndicator` — angka gap + badge predikat + garis penghubung dekoratif. Konsepnya mirip `NextStepCTA` (kartu ringkas satu angka penting) tapi visualnya beda total, jadi komponen baru.
  - Warna badge predikat pakai token dari bagian 2 (`--cw-gap-*`).
  - Progress bar sendiri: **[REUSE pola]** styling mengikuti `.barFill`/`.barTrack` yang sudah ada di `MIPage.module.css`/`KarakterShared.module.css` (div flex + width% + border-radius), bukan komponen React baru — cukup class CSS baru di module CW.
- **Data**: `nilai_sekarang_total`, `nilai_harapan_total`, `nilai_gap`, `predikat_gap` — 🔶 field-field ini perlu tabel baru (lihat bagian 6).

#### Section C — Penilaian Culture (grid 2×2 aspek)
Wireframe: 4 kartu (Kekeluargaan, Inovasi, Orientasi, Aturan), tiap kartu: label "Aspek [Nama]", bar "Nilai Sekarang X%", bar "Nilai Harapan Y%", lalu kotak "Nilai & Predikat" berisi angka besar + badge predikat.

- **Komponen**:
  - **[BARU]** `CwAspekGapCard` — satu kartu, 2 progress bar + badge predikat. Beda dari `AspekBarList`/`AspekRadarCard` Karakter (yang cuma 1 nilai per aspek, tanpa "harapan" dan tanpa badge predikat per kartu).
  - Grid layout 2 kolom: **[REUSE pola]** grid CSS yang sama dengan `.sebaranGrid`/2-column card grid yang sudah ada di `MIPage.module.css`.
  - 🔶 **Tambahan yang saya usulkan, BUKAN dari wireframe**: satu `RadarChart` **[REUSE langsung]** di atas atau di samping grid 2×2, menampilkan keempat aspek sekaligus sebagai ringkasan visual — mengikuti pola MI & Karakter yang selalu memasangkan radar dengan breakdown per-item. Wireframe individu TIDAK punya radar sama sekali (semua dalam bentuk bar), jadi ini murni usulan "polesan dari pola existing FIR", perlu dikonfirmasi user sebelum dikerjakan karena berpotensi menambah section di luar apa yang digambar di wireframe.
- **Data per kartu**: `aspek_kode`, `aspek_label`, `nilai_sekarang`, `nilai_harapan`, `predikat` — mengikuti pola `karakter_aspek_config` (label per sekolah, dikonfigurasi terpisah dari data) kemungkinan relevan untuk CW juga karena nama aspek budaya (Kekeluargaan/Inovasi/dst) sepertinya bisa custom per lembaga, bukan hardcode. 🔶 **OPEN** — perlu dikonfirmasi apakah 4 aspek ini universal semua sekolah atau bisa beda per sekolah seperti aspek Karakter.

#### Section D — Penilaian Terhadap Lembaga (carousel kartu kecil)
Wireframe: baris kartu kecil ber-ikon, tiap kartu icon + label + persen. Ditemukan 6 kartu (grid 3×2), TAPI kartu kolom ke-3 tiap baris terpotong di file SVG sumber (extend melewati batas kanvas 402px, konsisten dengan pola "carousel horizontal-scroll" mobile). Label yang terbaca:

| Baris 1 | Baris 2 |
|---|---|
| Nilai Karakter (85%) | Nilai Management (85%) |
| Nilai Kepemimpinan (85%) | Nilai Energi (85%) |
| 🔶 Nilai P... (TIDAK TERBACA) | 🔶 Nilai P... (TIDAK TERBACA) |

Dua label kolom ke-3 **tidak bisa dibaca dari file sumber** (bukan salah baca saya — secara matematis posisi kartunya x=353, lebar 155, sehingga tepi kanan ada di x=508, melewati kanvas 402px; ini genuinely terpotong di file Figma export-nya, bukan cuma terpotong di viewport saya). Sesuai keputusan #4, saya lanjut dengan placeholder eksplisit: `Nilai Prestasi` dan `Nilai Partisipasi` sebagai tebakan yang masuk akal secara tematik (melengkapi Karakter/Kepemimpinan/Management/Energi), **🔶 WAJIB dikonfirmasi/diganti sebelum implementasi** — kalau salah tebak, gampang diganti karena cuma label, bukan struktur data.

- **Komponen**: **[BARU]** `CwLembagaStatCarousel` — baris kartu kecil (icon + label + %), scroll horizontal di mobile. Tidak ada padanan existing (beda dari `IndikatorGrid` Karakter yang gridnya wrap, bukan scroll horizontal, dan tidak fixed-width per card).
- **Data**: array `{ kode, label, icon, nilai }`, 6 entri (atau berapa pun — jangan hardcode 6, ikuti prinsip "aspek custom per sekolah" seperti Karakter kalau relevan).

### 4.2 Layar "CW — Dashboard" (Manajemen)

Urutan section wireframe, kiri sidebar (dipetakan ke NavBar per bagian 1) lalu:

#### Section A — Kesimpulan Culture (hero)
Wireframe: kartu hitam lebar, kiri ikon bulat + "Kesimpulan culture lembaga Anda", kanan 4 kartu mini "01 Gap Kekeluargaan / 02 Gap Inovasi / 03 Gap Orientasi / 04 Gap Aturan" masing-masing dengan badge predikat (`Perlu Diamati`, `Selaras`, `Perlu Intervensi`, `Ringan` — dari data dummy, urutan aspek SAMA dengan individu, konfirmasi konsistensi ini bagus).

- **Komponen**:
  - **[BARU]** `CwDashboardHero` — kartu gelap lebar, ikon + judul + slot 4 kartu mini di kanan.
  - **[BARU]** `CwGapMiniCard` — nomor urut + "Gap [Aspek]" + badge predikat. Lebih sederhana dari `CwAspekGapCard` individu (tidak ada progress bar, cuma nomor+label+badge).
- **Data**: sama 4 aspek dengan Layar 1 Section C, tapi diagregasi ke level sekolah (rata-rata seluruh guru/karyawan) — mirip pola `rata_input_guru_` di Karakter (prefix beda untuk level agregat vs individu).

#### Section B — Nilai Lembaga (list kiri)
Wireframe: daftar vertikal, tiap baris: label ("Kepemimpinan", "Management", "Sinergi", "Fokus", "Performance") + predikat teks kanan atas ("Sangat Tinggi") + baris "Saat ini [78,42%] → Harapan [84,21%]" dengan bar sederhana di bawahnya.

- **Komponen**: **[BARU]** `CwNilaiLembagaRow` — pola mirip `CwAspekGapCard` tapi versi ROW (bukan card grid), lebih ringkas.
- 🔶 **Alternatif yang saya usulkan** (memenuhi kebutuhan "horizontal bar chart" yang disebut di eksplorasi awal): render daftar ini sebagai **[REUSE dengan modifikasi]** `GroupedBarChart` dua-seri ("Saat ini" vs "Harapan") per kategori — komponen ini sudah persis berbentuk horizontal bar per kategori dengan multi-seri. Perlu dikonfirmasi mana yang dipilih: ikut wireframe literal (baris teks + satu bar tipis) atau bar chart bersanding (lebih visual, memakai komponen chart yang sudah ada). Saya condong ke **ikut wireframe** (baris teks) sebagai default karena itu yang digambar, dengan bar chart sebagai opsi sekunder/toggle "Lihat sebagai grafik" — tapi ini keputusan produk, bukan teknis.
- **Data**: `kategori_kode/label`, `nilai_saat_ini`, `nilai_harapan`, `predikat` — 5 entri di wireframe (Kepemimpinan, Management, Sinergi, Fokus, Performance). 🔶 **OPEN**: apakah 5 kategori ini adalah dimensi BEDA dari 4 "Aspek Culture" (Kekeluargaan/Inovasi/Orientasi/Aturan) di Section A/Layar Individu, atau nama lain untuk hal yang sama? Dari wireframe, keduanya muncul berdampingan sebagai 2 hal berbeda (Section A = "Gap aspek budaya", Section B = "Nilai Lembaga" dimensi kepemimpinan/manajemen/dst) — perlu dikonfirmasi apakah ini benar dua taksonomi terpisah (budaya vs kelembagaan) atau tumpang tindih.

#### Section C — Kesejahteraan (list kanan)
Wireframe: daftar vertikal sejajar Section B, tiap baris: label ("Kepuasan Kepemimpinan", "Kenyamanan Bekerja", "Pengembangan Diri", "Ekspektasi", "Work Life Balance") + satu badge angka hitam di kanan (tanpa gap/harapan, beda dari Section B).

- **Komponen**: **[BARU – pola existing]** `CwKesejahteraanRow` — pola row sederhana label+badge, cukup mirip satu baris dari `ScoreBarList` (Karakter) tapi tanpa bar, cuma badge — bisa jadi turunan ringan dari situ.
- **Data**: `kategori_kode/label`, `nilai` — 5 entri.

### 4.3 Layar "CW — Laporan Kelompok" 🔶 SELURUHNYA OPEN, tidak ada wireframe

Cuma disebut sebagai item sidebar, tidak ada satu frame pun yang menunjukkan isinya. Proposal sementara berdasarkan pola modul lain (Karakter: `WaliKelasView` menunjukkan breakdown per kelas, `YayasanView` menunjukkan breakdown per sekolah) — CW kemungkinan butuh breakdown serupa per unit kerja/departemen/kelompok kerja:

- Tabel/daftar kelompok, tiap baris = satu kelompok kerja dengan ringkasan Nilai Lembaga & Kesejahteraan rata-rata kelompok itu.
- Kemungkinan reuse pola `CompareSection`/`CompareRadarCard`/`CompareBarSection` dari `KarakterShared.jsx` (bandingkan beberapa entitas sekaligus) — **[REUSE potensial]**, tapi ini tebakan struktural, BUKAN dari wireframe. Jangan mulai membangun layar ini sebelum ada wireframe atau minimal deskripsi tertulis dari pemilik produk soal apa itu "kelompok" (per departemen? per jenjang? per lokasi?) dan metrik apa yang ditampilkan.

### 4.4 Layar "CW — Laporan Individu (tampilan Manajemen)"

Manajemen bisa membuka laporan individu tiap guru/karyawan — konten identik dengan Layar 1 (reuse `CwWelcomeHeader`+Section B/C/D dengan data individu yang dipilih, bukan agregat). Yang beda cuma jalur masuknya (dari picker/pencarian nama, bukan dari sesi login sendiri) dan mungkin sensitivitas tampilan nama (🔶 **OPEN** — apakah nama guru/karyawan sensitif seperti murid_id di Screening yang wajib proxy_code, atau boleh tampil nama asli seperti MI? Konteks "penilaian budaya kerja oleh atasan" berpotensi sensitif secara HR, perlu keputusan eksplisit, jangan asumsi boleh tampil bebas).

---

## 5. Ringkasan komponen: baru vs reuse

| Komponen | Status | Catatan |
|---|---|---|
| `CwWelcomeHeader` | 🆕 BARU | teks sapaan, sederhana |
| `CwKesimpulanCard` | 🆕 BARU | hero 2-bar berdampingan |
| `CwGapIndicator` | 🆕 BARU | angka gap + badge + garis penghubung |
| `CwAspekGapCard` | 🆕 BARU | kartu aspek: 2 bar + badge predikat |
| `CwLembagaStatCarousel` | 🆕 BARU | carousel kartu kecil icon+label+% |
| `CwDashboardHero` | 🆕 BARU | hero gelap + 4 slot mini card |
| `CwGapMiniCard` | 🆕 BARU | nomor + label + badge, tanpa bar |
| `CwNilaiLembagaRow` | 🆕 BARU | row: label+predikat+saat ini→harapan |
| `CwKesejahteraanRow` | 🆕 BARU (ringan) | row: label+badge angka |
| Progress bar dasar (div+width%) | ♻️ REUSE pola | class CSS baru, bukan komponen baru |
| `RadarChart` | ♻️ REUSE langsung | opsional, usulan tambahan (🔶 konfirmasi) |
| `GroupedBarChart` | ♻️ REUSE dengan modifikasi | opsional alternatif Section B Dashboard (🔶 konfirmasi) |
| `SectionHeading`, `SampleTag`, `StatTile` | ♻️ REUSE langsung | header section, badge contoh, tile ringkas kalau perlu |
| `BriefingHero`, `FollowupRibbon` | ♻️ REUSE langsung | WAJIB tetap ada di CW per CLAUDE.md — 🔶 **OPEN**: wireframe tidak menggambarkan dua elemen ini sama sekali. Perlu diputuskan di mana disisipkan (kemungkinan di atas Section A Dashboard, sebelum "Kesimpulan Culture") |
| `NavBar` (extended) | ♻️ REUSE dengan tambahan | 3 nav item baru untuk peran Manajemen |
| `CompareSection`/`CompareBarSection` (Karakter) | ♻️ REUSE potensial | untuk Laporan Kelompok, spekulatif |
| `DetailDialog` | ♻️ REUSE langsung | kalau tiap kartu butuh detail on-click (belum ada sinyal dari wireframe kartu ini clickable) |

---

## 6. Mapping data (tabel Supabase yang diusulkan)

🔶 **Seluruh bagian ini proposal, bukan skema final** — belum ada tabel CW apa pun di database saat ini (dikonfirmasi lewat eksplorasi sebelumnya, `docs/cw-module-exploration.md` bagian 4). Nama tabel/kolom di bawah untuk memudahkan diskusi, bukan keputusan.

| Komponen | Field dibutuhkan | Tabel diusulkan | Catatan |
|---|---|---|---|
| `CwKesimpulanCard` + `CwGapIndicator` (individu) | `nilai_sekarang_total`, `nilai_harapan_total`, `nilai_gap`, `predikat_gap` | `cw_ringkasan_individu` | satu baris per (`guru_id`, `periode_id`) |
| `CwAspekGapCard` ×4 | `aspek_kode`, `nilai_sekarang`, `nilai_harapan`, `predikat` | `cw_aspek_skor` | mirip `karakter_skor`, satu baris per aspek per guru per periode |
| Label aspek (Kekeluargaan/Inovasi/dst) | `aspek_kode`, `aspek_label`, `urutan` | `cw_aspek_config` | mirip `karakter_aspek_config`, per sekolah — 🔶 kalau dikonfirmasi aspek universal (tidak custom per sekolah), tabel ini bisa dihilangkan, cukup konstanta di kode |
| `CwLembagaStatCarousel` | `kode`, `label`, `icon`, `nilai` | `cw_lembaga_stat` | 🔶 termasuk 2 label yang belum terbaca |
| `CwDashboardHero`/`CwGapMiniCard` | sama dengan `cw_aspek_skor` tapi diagregasi | `cw_aspek_skor` (query `AVG` per `school_id`) atau tabel ringkasan terpisah `cw_ringkasan_sekolah` | pola sama seperti MI (`mi_hasil` dibaca lalu diagregasi di React — TAPI CLAUDE.md butir 3 melarang FIR menghitung, jadi agregat sebaiknya sudah final di tabel, bukan dihitung React) |
| `CwNilaiLembagaRow` ×5 | `kategori_kode`, `kategori_label`, `nilai_saat_ini`, `nilai_harapan`, `predikat` | `cw_nilai_lembaga` | satu baris per kategori per sekolah per periode |
| `CwKesejahteraanRow` ×5 | `kategori_kode`, `kategori_label`, `nilai` | `cw_kesejahteraan` | satu baris per kategori per sekolah per periode |
| Tindak lanjut & briefing | `action`, `trigger_desc`, `priority`, `modul='cw'` | `tindak_lanjut` (existing, filter modul baru) | ikut pola existing persis, tidak perlu tabel baru |

RLS: semua tabel `cw_*` wajib filter `school_id` (dan `guru_id` untuk yang level individu) mengikuti pola `my_school_id()` yang sudah ada, sesuai CLAUDE.md butir 2. Untuk data individu guru/karyawan, kemungkinan perlu helper RLS baru setara `my_school_id()` tapi untuk `guru_id`/`staf_id` — belum ada padanannya di skema existing (existing cuma `murid_id`).

---

## 7. Style mapping: benchmark → token FIR

| Pola visual di benchmark | Padanan token/komponen FIR |
|---|---|
| Kartu hero gelap (hitam/navy) dengan aksen terang | Latar `--ink` (#211B2E) bukan hitam pekat, aksen tetap `--purple-600`/`--purple-300`, BUKAN lime/hijau neon dari benchmark |
| Badge pill status (mis. "In Transit", "Past") | Pola `StatusPill`/badge existing, warna dari token bagian 2 (`--cw-gap-*`) |
| Progress bar dua-warna dengan target marker | Adaptasi `.barFill`/`.barTrack` existing, tanpa marker terpisah (existing belum ada pola "target marker" di atas bar — kalau mau ditambah, itu elemen visual baru kecil, bukan komponen besar) |
| Donut/radial gauge dengan angka di tengah | **[REUSE langsung]** `Donut` dari `KarakterShared.jsx` — cocok kalau butuh gauge skor tunggal di suatu titik, TAPI wireframe CW sendiri tidak memakai bentuk donut sama sekali (semua bar/badge), jadi jangan dipaksakan kecuali ada section baru yang butuh |
| Mood/emoji calendar heatmap (salah satu benchmark) | Tidak ada di wireframe manapun — TIDAK dipakai, sekadar dicatat sebagai referensi kalau nanti ada fitur "tren mood harian" |
| Sidebar navigasi | Diadaptasi ke `NavBar` existing, lihat bagian 1 |
| Font tegas/besar untuk headline ("Manage Your Finance Right Now") | Tetap `--font-display` (Space Grotesk) untuk angka besar (Nilai Gap, %), `--font-body` (Plus Jakarta Sans) untuk label — sama seperti MI/Karakter, TIDAK ikut gaya headline raksasa benchmark |
| Radius kartu besar (20-28px), shadow lembut | Sudah match `--radius-lg`/`--radius-xl` dan `--shadow-card` existing — tidak perlu penyesuaian |

---

## 8. Rekap semua item terbuka (🔶 OPEN)

Urut dari yang paling menentukan arsitektur ke yang paling kecil:

1. **Peran pengisi "Laporan Individu"** — pakai `WaliKelas` existing (kalau semua guru sudah punya akun WaliKelas) atau perlu peran baru (`Karyawan`/`Staf`) untuk staf non-wali-kelas? Ini menentukan apakah perlu perubahan `profiles_peran_check` dan RLS baru.
2. **Peran "Manajemen"**: scoped ke `school_id` seperti Kepsek, atau ada hierarki sendiri (mis. bisa lintas sekolah seperti Yayasan)? Apakah KepalaSekolah/Yayasan existing otomatis dapat akses CW juga, atau murni domain peran baru ini?
3. **Sidebar wireframe → NavBar tab**: apakah adaptasi ini diterima, atau pemilik produk tetap mau chrome sidebar terpisah untuk CW (perubahan besar ke `App.jsx`)?
4. **Shell/responsivitas Manajemen**: responsive penuh (rekomendasi) atau desktop-only seperti Yayasan?
5. **Urutan & jumlah tingkat "Predikat Gap"** (4 tingkat: Selaras/Ringan/Perlu Diamati/Perlu Intervensi) dan **"Predikat Nilai"** (5 tingkat, tebakan Sangat Rendah..Sangat Tinggi) — perlu dikonfirmasi lengkap, termasuk hex final token bagian 2.
6. **Dua label yang terpotong** di "Penilaian Terhadap Lembaga" (placeholder saya: "Nilai Prestasi", "Nilai Partisipasi").
7. **Struktur "Laporan Kelompok"** — belum ada wireframe sama sekali, proposal di 4.3 murni tebakan pola dari modul lain.
8. **Relasi "Aspek Culture" (4: Kekeluargaan/Inovasi/Orientasi/Aturan) vs "Nilai Lembaga" (5: Kepemimpinan/Management/Sinergi/Fokus/Performance)** — dua taksonomi terpisah atau ada tumpang tindih makna?
9. **Apakah 4 Aspek Culture custom per sekolah** (seperti aspek Karakter, butuh tabel config) **atau universal/hardcode**?
10. **Sensitivitas nama guru/karyawan** di tampilan Manajemen — perlu proxy seperti Screening, atau boleh nama asli seperti MI?
11. **Tagline welcome header** ("Lembaga ini adalah sebuah 'Ladang' bagi Anda") — dipakai apa adanya, diganti, atau dihilangkan?
12. **Radar chart tambahan** di Section C Layar Individu — usulan saya, bukan dari wireframe, perlu konfirmasi sebelum ditambahkan.
13. **Bentuk Section B Dashboard** (Nilai Lembaga): ikut wireframe literal (baris teks+bar tipis) atau pakai `GroupedBarChart` (lebih visual)?
14. **Penempatan `BriefingHero`/`FollowupRibbon`** di layar Dashboard — wajib ada per CLAUDE.md, tapi tidak digambar di wireframe manapun, perlu diputuskan posisinya.

Rekomendasi saya: selesaikan item 1-4 dulu (menentukan struktur peran & shell) sebelum implementasi apa pun dimulai, karena keduanya mengubah `App.jsx` dan skema `profiles`/RLS. Item 5-14 bisa disepakati paralel sambil kerangka komponen mulai dibangun, karena sifatnya lokal per komponen.
