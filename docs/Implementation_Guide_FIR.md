# Implementation Guide FIR untuk Claude Code

**Berkas ini sudah usang.** Ia ditulis untuk arsitektur lama berbasis Google Apps Script (GAS)
dan Google Sheets, yang sudah digantikan Supabase + Row Level Security (RLS) sejak migrasi
2026-07. Section 1 di bawah sudah diperbarui supaya mencerminkan arsitektur aktif; Section 2
sampai 9 (prasyarat, struktur repo, Clasp, deploy GAS/Sheets) masih menjelaskan langkah era lama
dan dibiarkan sebagai catatan sejarah, bukan panduan yang berlaku. Untuk arsitektur, kontrak
gerbang baca, dan aturan yang berlaku sekarang, rujuk CLAUDE.md di root repo, bukan berkas ini.

Panduan ini membawa FIR dari desain ke kode. Bacalah CLAUDE.md lebih dulu, karena berkas itu memuat keputusan yang mengikat. Panduan ini fokus pada langkah eksekusi.

## 1. Arsitektur ringkas

React di Vercel sebagai tampilan. Ia tidak pernah menghitung skor, status, atau agregat, hanya membaca yang sudah final.

Supabase sebagai backend data dan autentikasi: Postgres, Supabase Auth, dan Row Level Security (RLS) sebagai satu-satunya gerbang akses. React memanggil Supabase langsung lewat `@supabase/supabase-js` dengan anon key; RLS di tiap tabel yang menyaring baris mana yang boleh dibaca user yang sedang login, bukan kode di sisi server.

Beberapa mutasi tulis yang sensitif (approve/tolak draf, buat/hapus akun, ubah profil, tambah sekolah, toggle modul, ubah jadwal) lewat Supabase Edge Function (`supabase/functions/`), yang memverifikasi peran caller lewat JWT-nya sendiri lalu memakai service_role di sisi server. service_role tidak pernah ada di kode React/browser.

Gemini API merumuskan tindak lanjut lewat dua jalur, keduanya di luar jalur baca FIR: pipeline hulu batch di luar repo ini, dan trigger on-demand dari FIR yang memanggil Edge Function (`generate-tindak-lanjut`/`batch-generate-tindak-lanjut`). Kedua jalur menulis draf berstatus `menunggu_persetujuan`, bukan `disetujui`. Jalur baca FIR sendiri tidak pernah memanggil Gemini dan tidak pernah menampilkan baris yang belum `disetujui`.

Google Sheets dan Google Apps Script (GAS), yang dijelaskan di Section 2 sampai 9 di bawah, tidak lagi dipakai.

## 2. Prasyarat

- Node versi 18 ke atas dan npm.
- Akun Google dengan akses ke Sheets milik Fammi.
- Clasp, dipasang global lewat `npm install -g @google/clasp`.
- Akun Vercel yang tertaut ke repositori.
- Kunci Gemini API, dipakai hanya di lingkungan pipeline hulu.

## 3. Struktur repositori

Satu repo dengan tiga bagian yang jelas.

```
fammi-intelligence-report/
  web/            React app, di-deploy ke Vercel
    src/
      components/ Header, BriefingHero, FollowupRibbon, dst
      modules/    KarakterViz, ScreeningViz, MIViz, Detail
      charts/     RingGauge, Donut, Radar, dst
      views/      per peran
      lib/        klien pemanggil gerbang GAS
      tokens.css  design token dari CLAUDE.md
    .env.local    variabel lingkungan lokal, tidak di-commit
  gas/            Google Apps Script, dikelola Clasp
    Code.js       titik masuk doGet dan doPost
    Gate.js       validasi sesi, kapabilitas, cakupan
    Read.js       pembacaan dan penyaringan data
    appsscript.json
    .clasp.json   tidak di-commit
  docs/           skema, PRD, kerangka tindak lanjut
  CLAUDE.md
  README.md
  .gitignore
```

## 4. Inisialisasi git

```
cd fammi-intelligence-report
git init
```

Isi `.gitignore` minimal:

```
node_modules/
web/.env.local
web/dist/
gas/.clasp.json
.DS_Store
```

Commit awal setelah struktur terbentuk:

```
git add .
git commit -m "Inisialisasi struktur FIR, web, gas, docs"
```

Hubungkan ke remote sesuai akun Fammi, lalu push.

## 5. Variabel lingkungan

Tiga tempat berbeda, jangan tertukar.

Di `web/.env.local` untuk React saat lokal, dan di dashboard Vercel untuk produksi:
- `VITE_GAS_WEB_APP_URL`, alamat web app GAS yang sudah di-deploy.

Di Script Properties milik Apps Script, lewat menu Project Settings:
- `SESSION_SECRET`, kunci untuk menandatangani token sesi.
- `CONTROL_WORKBOOK_ID`, id workbook kontrol terpusat.

Di lingkungan pipeline hulu, terpisah dari FIR:
- `GEMINI_API_KEY`, hanya di sini, tidak pernah di web maupun di jalur baca.

Kunci Gemini tidak boleh masuk ke kode React atau ke repositori. Bila bocor ke browser, siapa pun bisa memakainya.

## 6. Seturunan Apps Script lewat Clasp

```
cd gas
clasp login
clasp create --title "FIR Gate" --type webapp --rootDir .
```

Kembangkan secara lokal, lalu dorong:

```
clasp push
```

Deploy sebagai web app:

```
clasp deploy --description "FIR gate v1"
```

Atur akses web app supaya dieksekusi sebagai akun pemilik dan dapat diakses oleh aplikasi. Salin URL hasil deploy ke `VITE_GAS_WEB_APP_URL`. Tarik kembali kode dari editor daring bila ada perubahan di sana, lewat `clasp pull`, supaya repo tetap jadi sumber kebenaran.

## 7. Deploy ke Vercel

Hubungkan repositori ke Vercel, lalu atur:
- Root directory, `web`.
- Build command sesuai bundler yang dipakai, misalnya `npm run build`.
- Output directory sesuai bundler, misalnya `dist`.
- Tambahkan variabel `VITE_GAS_WEB_APP_URL` di Environment Variables.

Setiap push ke branch utama memicu deploy. Pakai preview deployment untuk meninjau sebelum produksi.

## 8. Urutan build yang disarankan

Bangun bertahap, jangan sekaligus. Urutan ini mengikuti PRD.

1. Scaffold React, pasang token desain, susun komponen kerangka, yaitu Header, NavBar, PeriodPicker.
2. Bangun gerbang GAS minimal, yaitu login, token sesi, satu endpoint baca yang menyaring per cakupan.
3. Sambungkan login React ke gerbang, pastikan token mengalir.
4. Bangun satu dashboard penuh lebih dulu, yaitu Kepala Sekolah, lengkap dengan BriefingHero dan FollowupRibbon di atas, lalu ModuleGrid sebagai bukti pendukung.
5. Tambahkan progressive disclosure, yaitu detail modul yang terbuka saat diminta.
6. Aktifkan filter periode mingguan, bulanan, tahunan, pastikan ia mengubah seluruh konteks halaman.
7. Tambahkan keadaan kosong yang ramah.
8. Replikasi ke peran lain, yaitu Yayasan, Wali Kelas, lalu versi mobile Orang Tua dan Siswa.
9. Terapkan aturan sensitivitas per modul, terutama proxy untuk Screening dan gerbang ahli untuk data sensitif.

## 9. Definisi selesai

Sebuah layar dianggap selesai bila memenuhi semua hal ini.

Tampilannya cocok dengan desain, memakai font dan token yang benar. Tidak ada perhitungan di sisi React. Tidak ada pembacaan Sheets langsung dari browser. Tindak lanjut yang tampil hanya yang berstatus disetujui. Aturan cakupan dan sensitivitas terpenuhi, termasuk proxy pada Screening. Data contoh tetap bertanda contoh. Filter periode mengubah briefing, tindak lanjut, dan ringkasan modul secara konsisten.

## 10. Catatan penting sebelum logika status

Empat parameter di Bagian 7 skema masih terbuka. Selama belum dikonfirmasi pemilik produk, jangan menanam angka cutoff MI, skala maksimum, atau pemetaan ordinal Karakter ke dalam kode. Bila perlu berjalan untuk sementara, baca nilai dari sheet konfigurasi dan biarkan kosong sampai diisi, jangan menebak.
