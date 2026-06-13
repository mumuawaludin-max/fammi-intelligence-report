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
- Backend logika dan gerbang akses memakai Google Apps Script (GAS), dikelola lewat Clasp.
- Data tersimpan di Google Sheets dengan dua lapisan: kontrol terpusat dan data per sekolah.
- Gemini API hanya dipakai di pipeline hulu untuk merumuskan tindak lanjut, tidak pernah di jalur baca FIR.

## Keputusan arsitektur yang terkunci

1. Satu wadah, satu pintu login, enam peran: Admin Fammi, Yayasan, Kepala Sekolah, Wali Kelas, Orang Tua, Siswa. Tampilan dan data disaring per peran.
2. Apps Script adalah satu-satunya gerbang. Browser tidak pernah membaca Sheets langsung. React memanggil endpoint GAS, GAS yang membaca Sheets dan menyaring.
3. FIR tidak menghitung apa pun. Skor, status, agregat, dominan, dan tindak lanjut sudah final di Sheets. FIR membaca, menyaring per peran dan periode, lalu menampilkan.
4. Satu mesin tampilan untuk tiga modul. Perbedaan antar modul ada di sheet konfigurasi, bukan di kode.
5. Entitlement-aware. Modul yang menyala hanya yang dilanggan sekolah.
6. Tindak lanjut dirumuskan di hulu lewat aturan deterministik, pencocokan master, perumusan Gemini, lalu gerbang persetujuan manusia. FIR menampilkan hanya yang berstatus disetujui.
7. Sensitivitas per modul. Screening paling ketat dengan proxy dan gerbang ahli. MI menampilkan nama untuk wali kelas. Karakter normal.
8. Responsif. Desktop-first untuk Yayasan, Kepala Sekolah, Wali Kelas. Mobile-first untuk Orang Tua dan Siswa.

## Design token, pakai persis nilai ini

Font:
- Teks utama: Plus Jakarta Sans, bobot 400 sampai 800.
- Angka display dan judul tegas: Space Grotesk.
- Monospace bila perlu: JetBrains Mono.

Warna inti:
- Ungu utama `#6323DA`. Skala: ungu-050 `#F4EFFD`, ungu-100 `#EDE6FB`, ungu-300 `#B79CF0`, ungu-600 `#6323DA`, ungu-700 `#5418C2`.
- Tinta: ink `#211B2E`, ink-2 `#4A4458`, ink-3 `#7C7689`, ink-4 `#A8A2B4`.
- Latar hangat: bg `#F6F2EB`, bg-2 `#F1ECE3`, surface `#FFFFFF`, surface-soft `#FBF9F5`.
- Garis: line `#ECE6F3`, line-warm `#E7E0D5`.

Warna status, dipakai hemat sebagai penanda kecil:
- Aman `#2E9E6B`, latar `#E7F4EE`.
- Perlu perhatian `#D69219`, latar `#FAF1DC`.
- Waspada `#D6455A`, latar `#FBE7EA`.

Radius: 12, 16, 22, 28. Bayangan kartu lembut, bayangan hero kebiruan ungu tipis. Jangan menambah warna di luar token ini.

## Inventaris komponen

Komponen bersama: Header, NavBar, PeriodPicker, PickerPanel, BriefingHero, FollowupRibbon, FollowupCard, SectionHeading, StatusPill, EmptyState, Footer, SampleTag.

Visual modul: KarakterViz, ScreeningViz, MIViz, plus versi Detail tiap modul, dan ModuleCard serta ModuleGrid sebagai pembungkus.

Grafik: RingGauge, Donut, Radar, RadialBloom, SemiGauge, BarList, StepStrip. Semua memakai animasi reveal dan count-up halus.

Per peran, ada berkas terpisah untuk Yayasan, Wali Kelas, Orang Tua, Siswa, masing-masing dengan views, ui, data, dan app.

Buat tampilan pixel-perfect dalam React produksi. Struktur internal bebas, hasil visual wajib cocok.

## Dua elemen hero yang tidak boleh hilang

BriefingHero memuat briefing naratif dua sampai tiga kalimat, label periode, dan meta sumber. Nada tenang, seperti rangkuman dari asisten yang paham konteks.

FollowupRibbon memuat kartu tindak lanjut berprioritas. Tiap kartu memetakan langsung ke sheet Tindak_Lanjut: action = teks_aksi, trigger = pemicu_ringkas, module = modul, priority = prioritas (tinggi, sedang, rendah). Urut dari prioritas tinggi, batasi tiga per baris di desktop.

## Kontrak gerbang baca

React tidak pernah memegang kredensial Sheets. Alur tiap permintaan:

1. Login: GAS memvalidasi kredensial, menerbitkan token sesi.
2. GAS membaca peran, kapabilitas, lalu cakupan pengguna.
3. GAS membuka workbook data sekolah lewat Registry. Tampilan yayasan membaca Agregat terpusat.
4. GAS menyaring baris sesuai cakupan, periode, dan langganan, lalu mengirim potongan data yang diizinkan.
5. Field sensitif disaring di sisi GAS, tidak pernah dikirim ke browser lalu disembunyikan.

## Yang tidak boleh dilakukan

- Jangan menghitung skor, status, atau agregat di FIR. Baca yang sudah final.
- Jangan membaca Sheets langsung dari browser.
- Jangan mengganti font atau menambah warna di luar token.
- Jangan menampilkan nama murid pada modul Screening. Pakai proxy_code.
- Jangan menampilkan angka contoh seolah temuan nyata. Pertahankan penanda contoh.
- Jangan memanggil Gemini dari jalur baca FIR. Tindak lanjut sudah final sebelum tampil.

## Dokumen rujukan

- `docs/Skema_Data_dan_Mesin_Tampilan_FIR_v1.md`: skema Sheets 21 sheet sampai level kolom.
- `docs/PRD_FIR_v1.html`: kebutuhan produk, user story, kriteria penerimaan.
- `docs/Kerangka_Tindak_Lanjut_Keilmuan_FIR.md`: dasar psikologi dan pedagogi untuk mesin tindak lanjut. Wajib dibaca sebelum menyentuh logika tindak lanjut di hulu.

## Parameter yang masih terbuka

Empat nilai belum final, jangan ditebak: cutoff skor MI ke status, skala maksimum MI, pemetaan ordinal Karakter ke persen, dan konfirmasi nilai nol pada Interpersonal. Tunggu konfirmasi pemilik produk sebelum mengunci logika status.
