# CLAUDE.md — Fammi Intelligence Report

Konteks utama untuk agen koding. Baca seluruhnya sebelum menulis kode.

## Aturan penulisan

- Tidak ada em-dash (--). Gunakan koma, titik koma, atau pecah kalimat.
- Tidak ada AI slop: "sangat penting", "perlu dicatat", "pada dasarnya", "sesungguhnya",
  "tentu saja", "dengan demikian", "merupakan", "terdapat", "komprehensif", "holistik",
  "robust", "seamless", "tergrounding", "synergy", "leverage", "utilize", "delve".
- Tulis langsung. Tidak ada pembuka basa-basi, tidak ada ringkasan akhir yang mengulangi isi.
- Bahasa Indonesia untuk semua komentar, nama variabel tetap Inggris.

## Apa itu FIR

Fammi Intelligence Report adalah dashboard sekolah berbasis peran. Ia membaca hasil asesmen Fammi lalu menampilkan tindak lanjut yang sudah ditinjau ahli. Inti produknya bukan memajang angka, melainkan membuat tiap peran tahu apa yang perlu dilakukan. Mesin tindak lanjut di hulu adalah nilai jual utama.

## Tumpukan teknologi

- Frontend React, di-deploy ke Vercel.
- Backend data dan autentikasi memakai Supabase: Postgres, Supabase Auth, Row Level Security (RLS) sebagai gerbang akses.
- React memanggil Supabase langsung lewat `@supabase/supabase-js` dengan anon key. RLS di tiap tabel yang membatasi baris mana yang boleh dibaca user yang sedang login, bukan kode di sisi server.
- Gemini API dipakai untuk merumuskan tindak lanjut lewat dua jalur, keduanya di luar jalur baca FIR: (1) pipeline hulu batch di luar repo ini, dan (2) trigger on-demand dari FIR yang memanggil Supabase Edge Function (server-side, API key Gemini tidak pernah ada di kode React/browser). Kedua jalur menulis draf ke `tindak_lanjut`/`briefing` berstatus `menunggu_persetujuan`, bukan `disetujui`. Jalur baca FIR sendiri tidak pernah memanggil Gemini dan tidak pernah menampilkan baris yang belum `disetujui`.
- Google Sheets dan Google Apps Script (GAS) tidak lagi dipakai. Riwayat lama menyebut GAS sebagai gerbang; itu sudah digantikan Supabase + RLS sejak migrasi 2026-07.

## Keputusan arsitektur yang terkunci

1. Satu wadah, satu pintu login, tujuh peran: Admin Fammi, Yayasan, Kepala Sekolah, Wakil Kepala Sekolah, Wali Kelas, Orang Tua, Siswa. Tampilan dan data disaring per peran. Nilai `peran` di kolom `profiles.peran` (ditegakkan lewat check constraint `profiles_peran_check`) memakai PascalCase tanpa spasi: `AdminFammi`, `Yayasan`, `KepalaSekolah`, `WakilKepalaSekolah`, `WaliKelas`, `OrangTua`, `Siswa`. Selalu bandingkan `session.peran` dengan nilai persis ini di kode, bukan versi berspasi. `WakilKepalaSekolah` cakupan/aksesnya identik dengan `KepalaSekolah` (sekolah-wide) di semua tempat kode membedakan lewat peran, cuma beda label tampilan; setiap `case "KepalaSekolah":` di kode wajib diikuti `case "WakilKepalaSekolah":` yang sama.
2. RLS adalah satu-satunya gerbang. React boleh memanggil Supabase langsung, tapi tiap tabel sensitif wajib punya policy RLS yang menyaring berdasarkan `school_id`/`murid_id` milik user yang sedang login (lewat helper `my_school_id()` atau setara). Jangan pernah menonaktifkan RLS di tabel yang menyimpan data sekolah atau siswa.
3. FIR tidak menghitung apa pun. Skor, status, agregat, dominan, dan tindak lanjut sudah final di tabel Supabase (`mi_hasil`, `tindak_lanjut`, `briefing`, dst). FIR membaca, menyaring per peran dan periode, lalu menampilkan.
4. Satu mesin tampilan untuk tiga modul. Perbedaan antar modul ada di data/konfigurasi, bukan di kode.
5. Entitlement-aware. Modul yang menyala hanya yang aktif untuk sekolah itu di tabel `school_modules`.
6. Tindak lanjut dirumuskan lewat aturan deterministik, pencocokan master, perumusan Gemini (batch di hulu atau on-demand lewat Edge Function), lalu gerbang persetujuan manusia. Tidak ada jalur yang melewati gerbang ini. FIR menampilkan hanya baris dengan `status = 'disetujui'`.
7. Sensitivitas per modul. Screening paling ketat dengan proxy dan gerbang ahli. MI menampilkan nama untuk wali kelas. Karakter normal.
8. Responsif. Desktop-only untuk Yayasan. Wali Kelas dan Kepala Sekolah wajib bagus di mobile maupun desktop (responsive penuh, bukan cuma desktop-first). Mobile-first untuk Orang Tua dan Siswa.
9. Skor 0 di modul Karakter berarti "guru tidak menilai murid itu", bukan nilai nol. **Khusus dashboard Yayasan Pendidikan Telkom**, baris seperti itu dibuang dari seluruh agregat: keempat matview `ypt_k_*` menyaring `skor > 0` (migration `20260901110000`). Keempat matview itu juga menyaring `sumber = 'guru'`, karena yang dihitung hanya penilaian guru; refleksi siswa dan orang tua adalah lampiran dan tidak pernah masuk angka pencapaian (migration `20260901130000`, keputusan pemilik produk 2026-09-01). Saringan `sumber` itu penjaga, bukan perbaikan angka: per 2026-09-01 seluruh baris skor YPT memang sudah `guru`. Keputusan pemilik produk 2026-09-01, terkunci, tidak perlu ditanyakan ulang. Sekolah Telkom mengunggah roster lengkap, jadi tanpa saringan ini murid yang belum dinilai ikut dirata-rata sebagai nol dan menyeret angka sekolah ke bawah (SMK Telkom Jakarta Mei 2026 sempat tampil 16% padahal rekap sekolahnya sendiri 80%). Cakupannya YPT saja: view bersama modul Karakter (`karakter_skor_bulanan`, `karakter_jenjang_aspek_avg`, `karakter_sekolah_indeks`, dst) sengaja TIDAK ikut menyaring, jadi jangan menyeragamkan keduanya dengan alasan konsistensi. Yang belum diputuskan cuma satu keadaan dan belum pernah terjadi di data YPT: sekolah berpenilaian pekanan yang tercatat 0 pada pekan terakhir.

## Design token, pakai persis nilai ini

Font:
- Satu font untuk seluruh aplikasi, tanpa kecuali: **Google Sans Flex** (variable font,
  paket `@fontsource-variable/google-sans-flex`, sumbu `wght` saja). Dipakai untuk teks
  utama, angka display/judul tegas, maupun monospace -- `--font-body`, `--font-display`,
  `--font-mono` di `tokens.css` ketiganya menunjuk font yang sama. Instruksi eksplisit dan
  berulang dari pemilik produk (2026-07): mengganti seluruh font sebelumnya (Plus Jakarta
  Sans, Space Grotesk, JetBrains Mono, dan pengecualian Montserrat di bawah), tidak ada lagi
  pengecualian font per modul.

Warna inti:
- Ungu utama `#6323DA`. Skala: ungu-050 `#F4EFFD`, ungu-100 `#EDE6FB`, ungu-300 `#B79CF0`, ungu-600 `#6323DA`, ungu-700 `#5418C2`.
- Tinta: ink `#211B2E`, ink-2 `#4A4458`, ink-3 `#7C7689`, ink-4 `#A8A2B4`.
- Latar hangat: bg `#F6F2EB`, bg-2 `#F1ECE3`, surface `#FFFFFF`, surface-soft `#FBF9F5`.
- Garis: line `#ECE6F3`, line-warm `#E7E0D5`.

Warna status, dipakai hemat sebagai penanda kecil:
- Aman `#2E9E6B`, latar `#E7F4EE`.
- Perlu perhatian `#D69219`, latar `#FAF1DC`.
- Waspada `#D6455A`, latar `#FBE7EA`.
- Berkembang `#2E6BD6`, latar `#E7EEFA`. Ditetapkan pemilik produk 2026-09-09 khusus untuk pita
  tengah bar di laporan per anak modul Karakter (`MuridDetailPanel`, juga ringkasan satu kelas):
  80-100 hijau, 50-79 biru, di bawah 50 merah, skor 0 abu-abu bertuliskan "Belum dinilai" (0 berarti
  guru tidak menilai, lihat butir 9). Bar di halaman lain (kelas, jenjang, sekolah) TETAP memakai
  hijau/kuning/merah 80/60; jangan menyeragamkan keduanya. Ambang "perlu perhatian" untuk daftar
  siswa dan tindak lanjut juga tetap 80, jadi anak 65% tetap masuk daftar perlu perhatian walau
  barnya biru. BINTANG punya ambangnya sendiri: mulai 85 ke atas (`KARAKTER_BINTANG_CUTOFF` di
  `lib/cutoffs.js`), dinaikkan dari 80 oleh pemilik produk 2026-09-14. Jadi karakter 80-84 tampil
  hijau TANPA bintang, dan itu memang yang diminta; jangan menyamakan lagi ambang bintang dengan
  pita hijau bar.

Radius: 12, 16, 22, 28. Bayangan kartu lembut, bayangan hero kebiruan ungu tipis. Jangan menambah warna di luar token ini.

**Pengecualian yang disengaja**: laporan MI Individu (`BakatView` di `web/src/pages/siswa/SiswaPage.jsx`) dan seluruh laporan modul Karakter untuk Wali Kelas/Kepala Sekolah/Yayasan (`web/src/pages/karakter/`) memakai latar abu muda `#EDEDF0`, bukan token `--bg` biasa. Ini instruksi eksplisit dari pemilik produk supaya modul Karakter senada dengan laporan MI Individu. Jangan "perbaiki" balik ke token dengan alasan aturan ini. **Font TIDAK lagi jadi bagian pengecualian ini** -- sebelumnya kedua modul ini memakai Montserrat lewat override lokal (`--font-body`/`--font-display` didefinisikan ulang di `.page`), tapi pengecualian font itu sudah dicabut (2026-07): kedua modul sekarang ikut token global Google Sans Flex seperti seluruh aplikasi lain, override lokalnya sudah dihapus dari kode.

**Pengecualian yang disengaja (2)**: seluruh dashboard "Laporan Lembaga" modul School Culture (`ScSectionSelector`/`ScDimensiRingkasan`/`ScDimensiPerbandingan`/`ScDimensiTindakLanjut`, dirakit di `ScLaporanAgregatPage.jsx`, `web/src/pages/sc/`) memakai palet warna berbeda dari token di atas: primary `#6C2BD9`, heading `#3B1E77`, soft surface `#F1EAFF`, background `#FAFAF7`, border `#E6E2DA`, gold accent `#D9A406`. Halaman ini di-restart total mengikuti `references/school-culture-redesign/design-references/wireframe-original.png` atas instruksi eksplisit pemilik produk: tiga kartu gelap (01 Budaya Kerja/02 Kesejahteraan Tim/03 Profil Organisasi) jadi filter tampilan, tiap bagian punya struktur identik A (ringkasan+skor)/B (perbandingan saat ini vs harapan)/C (tindak lanjut per dimensi) -- BUKAN nav-strip+dumbbell+tab dari versi "polished" reference yang sempat dibangun lebih dulu lalu dihapus total. Palet di-scope lewat `web/src/pages/sc/scBudayaTokens.module.css` (class `.scope`, custom property `--sc-*`, nama berkas peninggalan sebelum cakupan diperluas) supaya tidak menjalar ke laporan individu staf (`ScLaporanIndividuPage.jsx`/`ScKaryawanPage.jsx`, tetap token biasa -- reference tidak pernah mendesain laporan individu) atau modul lain. Bagian ini dan padanannya di modul Corporate Culture & Wellbeing adalah satu-satunya tempat di FIR yang memakai `@phosphor-icons/react` dan `motion` alih-alih emoji + `scHooks.js` -- juga instruksi eksplisit, jangan "perbaiki" balik ke sistem ikon/animasi biasa dengan alasan konsistensi. Section lama (Angka Kunci, Prioritas Perbaikan lintas-fokus, Perbandingan Antarunit, seluruh insight Fase B-D-E: pie/stacked-bar/strip-plot/donut/heatmap/scatter/tema-esai/tren) SUDAH DIHAPUS dari halaman ini secara sengaja -- jangan dikembalikan tanpa instruksi baru.

**Corporate Culture & Wellbeing (CW) mengikuti SC**: dashboard "Laporan Lembaga" modul CW (`web/src/pages/cw/`) sekarang memakai struktur, palet, dan komponen yang sama persis dengan SC di atas, atas instruksi pemilik produk (2026-09-09): SC adalah versi paling mutakhir, CW menyusul. Berkasnya SALINAN, bukan komponen bersama: `CwSectionSelector`/`CwDimensiRingkasan`/`CwBudayaPerbandinganDumbbell`/`CwDimensiTindakLanjut`/`CwBudayaDetailAspek`/`CwBudayaCeritaKaryawan`/`CwKesejahteraanDriver`/`CwKesejahteraanSuaraKaryawan`/`CwOrganisasiDetailAspek`/`CwShareDialog`/`CwLaporanReveal`/`cwIconBadge`, dirakit di `CwLaporanAgregatPage.jsx`, paletnya di `cwBudayaTokens.module.css`. Custom property-nya `--cwd-*` (cw dashboard), BUKAN `--cw-*`: awalan `--cw-*` sudah dipakai token global di `tokens.css` (`--cw-bg`, `--cw-nilai-*`, garis radar) dan akan tertimpa di dalam `.scope` kalau namanya sama. Sengaja disalin, bukan dipakai bersama, karena wording kedua modul berbeda (karyawan/perusahaan vs Tim/sekolah) dan pemilik produk akan menyesuaikan wording CW sendiri; perubahan teks di satu modul TIDAK otomatis ikut ke modul lain, dan itu memang yang diinginkan. Kalau nanti struktur SC berubah lagi, salin ulang ke CW secara sadar, jangan diam-diam menyatukan keduanya jadi satu komponen bersama tanpa instruksi. Section lama CW (hero gelap, Angka Kunci, Perbandingan Antarunit, Prioritas Perbaikan lintas-fokus, radar + bar chart) ikut dihapus dari tampilan dengan alasan sama; datanya masih ada di `cw.mock.ts`. Sub-tab Dashboard/Laporan Individu CW juga ikut diangkat ke `App.jsx` seperti SC (state `budayaTab`, dipakai bersama kedua modul karena id sub-tabnya sama), jadi dia tampil menyatu di baris Header, bukan di badan halaman. Peran yang tidak memakai shell single-module (mis. AdminFammi) mendapat sub-tab itu di baris toolbar bareng PeriodPicker, supaya tidak kehilangan akses ke daftar responden. Laporan INDIVIDU CW ikut disamakan (2026-09-09): `CwLaporanIndividuPage.jsx` sekarang salinan `ScLaporanIndividuPage.jsx`, alur satu scroll bernomor 01 Budaya Kerja / 02 Kesejahteraan Karyawan / 03 Kontribusi peran / 04 Profil Organisasi, plus halaman terpisah 05 Lingkar Kontribusi dan Komitmen 30 hari lewat tombol mengambang. Halaman ini POV-aware lewat prop `viewerIsOwner`: pemilik laporan melihat refleksi privatnya, pimpinan yang drill-down tidak. Dua bagian khas CW yang tidak ada di SC, `bagian_cermin` (Kata rekan kerja) dan `bagian_refleksi` (bahan renungan), SENGAJA dipertahankan di section 03; jangan dibuang dengan alasan menyamakan dengan SC. Komposer komitmen 30 hari tampil tapi tombol simpannya MATI, dengan catatan terbuka di layar: tabel `cw_komitmen` dan RLS-nya belum ada (padanan `sc_komitmen`, migration `20260726100000`). Stubnya di `useCwData.js` (`useCwKomitmen`, `tersedia: false`); begitu tabelnya dibuat, tukar isi fungsi itu saja. JANGAN menyimpan komitmen ke localStorage supaya kelihatan jalan, itu data pribadi yang wajib lewat RLS. Gerbang peran CW: cuma `Manajemen` (padanan Yayasan di konteks sekolah, satu-satunya level pimpinan korporat) dan `AdminFammi`. Istilah tampilan CW seluruhnya korporat (karyawan, perusahaan, organisasi); rujukan "School Culture" yang tersisa di komentar cuma menyebut modul asal salinan, bukan istilah produk. **Kunci data CW ikut data, bukan istilah** (2026-09-09, setelah berkas olahan PT Glamindo dicek): tipe budaya `Kekeluargaan`/`Inovasi`/`Orientasi`/`Aturan` (BUKAN istilah akademik OCAI Klan/Adhokrasi/Pasar/Hierarki yang sempat dipakai), dimensi organisasi `karakter_lembaga`/`kepemimpinan`/`management`/`sinergi`/`fokus`/`performance`, subdimensi kesejahteraan `kepuasan_kepemimpinan`/`kenyamanan_bekerja`/`pengembangan_diri`/`ekspektasi`/`work_life_balance`. Semuanya persis sama dengan SC karena instrumennya memang satu. Yang boleh korporat cuma LABEL TAMPILAN, dan satu-satunya label yang berbeda dari data adalah "Karakter Lembaga" yang ditampilkan sebagai "Karakter Perusahaan" (lihat `labelData` vs `label` di `DIMENSI_PROFIL_INFO`, `cwMeta.js`). Jangan menerjemahkan kunci, nanti tidak ada satu baris data pun yang cocok.

**Label modul di Admin Fammi diturunkan dari entitlement** (2026-09-09): karena baris `tindak_lanjut`/`briefing`/`sc_hasil` milik klien korporat tetap bermodul `'sc'`, layar admin TIDAK boleh membaca kolom itu apa adanya untuk label. Pakai `modulTampil(modul, modules)` dari `pages/admin/data/helpers.js`, yang merelabel baris `'sc'` jadi `'cw'` kalau `school_modules` kliennya memuat `cw`. Sudah dipakai di Antrian Persetujuan (badge + chip penyaring), Persetujuan Culture (pill per kartu + drawer), dan menu sidebar diubah jadi "Persetujuan Culture" karena satu antrian melayani dua modul. Tanpa penurunan ini seluruh baris klien korporat tampil "School Culture" dan admin tidak bisa membedakan klien sekolah dari klien perusahaan.

**Unggahan CW memakai jalur SC** (keputusan pemilik produk 2026-09-09): modul `cw` di layar Upload Admin Fammi memakai `parseScWorkbook`/`importScWorkbook` yang sama dan menulis ke `sc_personal`/`sc_lembaga`, bukan ke tabel `cw_*` sendiri. Alasannya berkas olahan CW identik kolom per kolom dengan SC (sheet `Personal` + `Lembaga`), sudah diuji dengan berkas PT Glamindo. Yang membedakan cuma `import_log.modul`. Jangan menggandakan tabel, importer, Edge Function, atau layar persetujuan selama instrumennya belum benar-benar berbeda. Layar Persetujuan School Culture melayani kedua modul.

**Jalur baca CW sudah memakai data asli** (2026-09-09): `useCwData.js` berisi `useCwAgregat`/`useCwIndividu`/`useCwRespondenList`/`useCwKomitmen`, salinan `useScData.js` yang membaca tabel sc_* yang sama dan baris briefing/tindak_lanjut ber-modul `'sc'`. Tiga perbedaan yang disengaja: kalimat template memakai istilah korporat, `targetRoleForPeran` cuma mengenal Manajemen, dan ada `sesuaikanLaporanIndividu`/`sesuaikanCeritaKaryawan` yang memetakan `meta.nama_lembaga` ke `nama_perusahaan`, `meta.peran_kerja` ke `jabatan`, `jawaban_survey.gambaran_lembaga` ke `gambaran_perusahaan`, dan `cerita_pegawai` ke `cerita_karyawan`. Karena datanya nyata, `SampleTag` sudah DILEPAS dari `CwPage.jsx` dan `CwKaryawanPage.jsx`; kalau belum ada baris yang disetujui, yang tampil status kosong, bukan data contoh. `cw.mock.ts` sekarang cuma dipakai halaman preview QA (`?preview=cw-agregat`, `cw-individu`, `cw-list`), yang memang menampilkan penanda Contoh sendiri.

**Pengecualian yang disengaja (3)**: seluruh dashboard Yayasan Pendidikan Telkom (`web/src/pages/ypt/`) memakai palet identitas Telkom, bukan token ungu FIR: merah `#ED1C24`, navy `#172554`, latar `#F5F6F8`. Instruksi eksplisit pemilik produk (2026-08-25): "UI nya akan benar-benar berbeda, khusus untuk yayasan pendidikan telkom saja". Di-scope lewat `web/src/pages/ypt/yptTokens.module.css` (class `.scope`, custom property `--ypt-*`) supaya tidak menjalar ke modul lain. Gerbangnya per-YAYASAN, bukan per-peran: hanya akun `peran = 'Yayasan'` yang `cakupan[0] = 'YAY-PENDIDIKAN-TELKOM'` yang masuk shell ini (lihat `App.jsx`); akun Yayasan lain (mis. `yayasantkfammi`) tetap memakai shell FIR biasa. Kalau yayasan kedua minta tampilan serupa, naikkan penanda ini jadi kolom konfigurasi di tabel `yayasan`, jangan tambah cabang hardcode kedua. Font tetap Google Sans Flex seperti seluruh aplikasi. Nilai warna di berkas token itu diturunkan dari render Figma dan **belum diverifikasi lewat `get_design_context`** (kuota Figma MCP habis saat implementasi); koreksi di berkas token itu saja, seluruh halaman ikut.

**Sumber data dari Google Spreadsheet (khusus YPT)**: dua menu YPT (Survey Kepuasan dan tab Testimoni) sumbernya spreadsheet Google yang terus bertambah, ditarik Edge Function `sync-ypt-sheets` ke tabel `kp_responden`/`cs_testimoni`. Ini TIDAK melanggar aturan "Google Sheets tidak lagi dipakai" di atas: aturan itu tentang gerbang baca (dulu React membaca Sheets lewat GAS). Di sini spreadsheet adalah sumber hulu yang ditarik sekali arah di server; jalur baca FIR tetap murni Supabase + RLS.

## Inventaris komponen

Komponen bersama: Header, NavBar, PeriodPicker, PickerPanel, BriefingHero, FollowupRibbon, FollowupCard, SectionHeading, StatusPill, EmptyState, Footer, SampleTag.

Visual modul: KarakterViz, ScreeningViz, MIViz, plus versi Detail tiap modul, dan ModuleCard serta ModuleGrid sebagai pembungkus.

Grafik: RingGauge, Donut, Radar, RadialBloom, SemiGauge, BarList, StepStrip. Semua memakai animasi reveal dan count-up halus.

Per peran, ada berkas terpisah untuk Yayasan, Wali Kelas, Orang Tua, Siswa, masing-masing dengan views, ui, data, dan app.

Buat tampilan pixel-perfect dalam React produksi. Struktur internal bebas, hasil visual wajib cocok.

## Dua elemen hero yang tidak boleh hilang

BriefingHero memuat briefing naratif dua sampai tiga kalimat, label periode, dan meta sumber. Nada tenang, seperti rangkuman dari asisten yang paham konteks.

FollowupRibbon memuat kartu tindak lanjut berprioritas. Tiap kartu memetakan langsung ke tabel `tindak_lanjut`: action = teks_aksi, trigger = pemicu_ringkas, module = modul, priority = prioritas (tinggi, sedang, rendah). Urut dari prioritas tinggi, batasi tiga per baris di desktop.

## Kontrak gerbang baca

React tidak pernah memegang service_role key, hanya anon key yang aman dipublikasikan. Alur tiap permintaan:

1. Login: `supabase.auth.signInWithPassword()` dengan email berformat `username@fammi.internal` dan kode khusus sebagai password. Supabase Auth menerbitkan session token.
2. React baca tabel `profiles` (filter `id = auth.uid()`) untuk dapat peran, school_id, murid_id, cakupan.
3. React baca tabel `school_modules` untuk dapat daftar modul yang aktif untuk sekolah itu.
4. Semua query data modul (`mi_hasil`, `mi_input`, `tindak_lanjut`, `briefing`, dst) difilter di kode React berdasarkan `school_id` atau `murid_id` dari session, dan ditegakkan ulang oleh RLS di Postgres sehingga query yang lupa filter tetap aman.
5. Field sensitif (mis. nama murid di modul Screening) tidak dimasukkan ke kolom yang bisa dibaca lewat RLS biasa; gunakan kolom proxy terpisah atau view khusus.

## Yang tidak boleh dilakukan

- Jangan menghitung skor, status, atau agregat di FIR. Baca yang sudah final.
- Jangan menonaktifkan RLS pada tabel yang menyimpan data sekolah atau siswa.
- Jangan menyimpan atau memanggil service_role key dari kode frontend.
- Jangan mengganti font atau menambah warna di luar token.
- Jangan menampilkan nama murid pada modul Screening. Pakai proxy_code.
- Jangan menampilkan angka contoh seolah temuan nyata. Pertahankan penanda contoh.
- Jangan memanggil Gemini dari jalur baca FIR, dan jangan memanggil Gemini API langsung dari kode React/browser (API key wajib server-side, lewat Supabase Edge Function). Jangan pernah menampilkan tindak lanjut/briefing yang belum berstatus `disetujui`, termasuk hasil trigger on-demand.

## Dokumen rujukan

- `docs/Skema_Data_dan_Mesin_Tampilan_FIR_v1.md`: skema asli berbasis Sheets, 21 sheet sampai level kolom. Dipakai sebagai referensi nama kolom dan relasi data, bukan lagi cerminan arsitektur penyimpanan yang aktif.
- `docs/PRD_FIR_v1.html`: kebutuhan produk, user story, kriteria penerimaan.
- `docs/Kerangka_Tindak_Lanjut_Keilmuan_FIR.md`: dasar psikologi dan pedagogi untuk mesin tindak lanjut. Wajib dibaca sebelum menyentuh logika tindak lanjut di hulu.

## Parameter yang masih terbuka

Empat nilai belum final, jangan ditebak: cutoff skor MI ke status, skala maksimum MI, pemetaan ordinal Karakter ke persen, dan konfirmasi nilai nol pada Interpersonal. Tunggu konfirmasi pemilik produk sebelum mengunci logika status.
