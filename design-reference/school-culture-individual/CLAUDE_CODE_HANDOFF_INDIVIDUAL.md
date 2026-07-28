# Handoff khusus redesign Laporan Individu Fammi

## Tujuan

Rombak total tampilan Laporan Individu pada modul School Culture existing di
Fammi menggunakan reference ini.

Implementasi harus dilakukan **in-place pada route dan modul existing**.
Jangan membuat modul kedua, route duplikat, iframe, atau aplikasi Vite baru.

Laporan Individu adalah pengalaman **mobile-only**:

- layout utama maksimum 480 px;
- pada desktop tetap tampil sebagai kanvas mobile yang berada di tengah;
- jangan mengubahnya menjadi dashboard desktop atau multi-column layout;
- touch target minimum 44 px;
- sticky CTA harus menghormati safe area dan tidak menutup konten.

## File reference yang harus dibaca Claude Code

### Implementasi

- `src/components/IndividualReport.tsx`
- `src/types/individual.ts`
- `src/data/sampleIndividualReport.ts`
- `src/components/Reveal.tsx`
- `reference-implementation/individual-report.css` jika menggunakan bundle
  handoff; atau bagian individual dari `src/styles.css` jika membaca workspace
  prototype langsung.

Pada workspace prototype, CSS khusus dimulai dari marker:

```css
/* Individual report — intentionally mobile-only */
```

Bundle sudah mengekstrak bagian tersebut menjadi
`reference-implementation/individual-report.css`. Adaptasikan ke styling system
existing; jangan menyalin CSS laporan lembaga.

### Contoh wiring

- `src/App.tsx`
- `src/components/ReportHeader.tsx`

Kedua file ini hanya menunjukkan cara pergantian dari Laporan Lembaga ke
Laporan Individu. Jangan mengganti router Fammi menggunakan state prototype
apabila route existing sudah tersedia.

### Visual source of truth

- `design-references/10-individual-overview.png`
- `design-references/11-individual-wellbeing-role.png`
- `design-references/12-individual-control.png`
- `design-references/13-individual-commitment.png`

Semua visual tersebut adalah portrait mobile. Jangan menggunakan atau membuat
versi desktop.

## Audit wajib sebelum mengubah kode

Claude Code harus menemukan dan melaporkan:

1. Route Laporan Individu existing.
2. Page, components, hooks, dan state management existing.
3. API endpoint dan response type.
4. Sumber nilai persepsi individu.
5. Sumber kondisi atau ekspektasi individu.
6. Sumber agregat atau benchmark lembaga.
7. Rumus gap dan aturan pembulatan.
8. Permission untuk melihat jawaban pribadi.
9. Persistence untuk action plan, draft, dan check-in.
10. Export, analytics, loading, empty, error, dan restricted states.
11. Tests yang harus tetap lulus.

Jangan mulai mengganti UI sebelum audit ini selesai.

## Data flow target

```text
Fammi API existing
→ individual report adapter
→ IndividualReport view model
→ redesigned mobile components
→ action-plan persistence existing
```

Gunakan `src/types/individual.ts` sebagai target view model, bukan sebagai
alasan untuk mengubah response backend tanpa audit.

Jika field belum tersedia, catat sebagai data gap. Jangan mengarang data
production dan jangan mengirim `sampleIndividualReport` ke production.

## Aturan semantik data

Tiga sumber berikut tidak boleh dicampur:

- `Respons Anda`: persepsi atau jawaban individu;
- `Harapan Anda`: kondisi yang diharapkan individu;
- `Gambaran lembaga`: agregat responden lembaga.

Gunakan label tersebut secara eksplisit pada UI.

Aturan gap:

```text
gap = target - current
```

Jika backend menyediakan official gap, prioritaskan nilai backend tetapi
validasi inkonsistensi. Kondisi dan harapan yang sama tidak boleh menghasilkan
gap bukan nol.

Jangan menyebut skor wellbeing sebagai nilai performa. Jangan menggunakan star
rating.

## Prinsip pengalaman

Pengguna harus bergerak melalui alur:

```text
Pahami → Refleksikan → Pilih → Berkomitmen → Minta dukungan → Pantau
```

Dalam waktu sekitar 30 detik pengguna harus memahami:

1. Apa arti hasil ini bagi saya?
2. Apa yang berada dalam kendali saya?
3. Apa satu tindakan yang akan saya mulai?
4. Dukungan apa yang perlu saya minta?

Jangan membuat pengguna hanya menerima daftar instruksi. Ia harus dapat
memilih, mengubah, dan menyimpan komitmennya sendiri.

## Struktur UI target

### 1. Pembuka personal

- Tegaskan bahwa laporan bukan nilai akhir tentang individu.
- Tampilkan peran dan unit.
- Carousel tiga wawasan: kekuatan, fokus 30 hari, dan dukungan.
- Tampilkan perubahan yang diharapkan pengguna.

### 2. Celah budaya

- Empat dimensi budaya.
- Dumbbell chart respons versus harapan.
- Gap valid dan interpretasi per dimensi.
- Progressive disclosure pada mobile.

### 3. Energi dan wellbeing

- Lima dimensi wellbeing.
- Distribution bar, bukan bintang.
- Bedakan respons individu dan gambaran lembaga.
- Soroti kekuatan dan area yang perlu diamati tanpa bahasa menghakimi.

### 4. Kontribusi peran

```text
Fokus strategi → Prioritas unit → Kebiasaan kerja
```

Hubungkan peran individu dengan strategi tanpa menyatakan asosiasi sebagai
hubungan sebab-akibat yang belum terbukti.

### 5. Refleksi privat

- Sumber energi.
- Penguras energi.
- Perubahan yang diharapkan.
- Jawaban asli tersembunyi secara default.

### 6. Lingkar kontribusi

- Dalam kendali saya.
- Bisa saya pengaruhi.
- Membutuhkan dukungan sistem.

Masalah sistem tidak boleh dipresentasikan sebagai kekurangan individu.

### 7. Komitmen 30 hari

- Tiga opsi tindakan.
- Pengguna memilih salah satu.
- Pengguna dapat mengubah langkah pertama, frekuensi, bukti kemajuan, dan
  dukungan yang dibutuhkan.
- Tiga check-in.
- Draft dan committed state.
- Sticky CTA baru aktif di area action plan, bukan sejak halaman pembuka.

## Privasi dan authorization

- Refleksi pribadi hanya dapat dibaca pemilik laporan kecuali kebijakan produk
  secara eksplisit mengatur sebaliknya.
- Jangan mengirim jawaban asli atau komitmen kepada pimpinan secara otomatis.
- Dukungan yang diminta kepada pimpinan harus menjadi tindakan sadar pengguna.
- Jangan membuka data personal lewat export tanpa authorization yang sama.
- Analytics tidak boleh mengirim isi jawaban refleksi.

## Yang harus dipertahankan dari Fammi

- route;
- authentication;
- authorization;
- organization dan user context;
- API client dan caching;
- official calculations;
- analytics;
- export;
- persistence;
- localization;
- loading, error, empty, dan restricted states;
- tests.

## Yang tidak boleh dipindahkan ke Fammi

- `node_modules/`;
- `dist/`;
- aplikasi Vite secara utuh;
- `main.tsx`;
- sample data sebagai production data;
- seluruh CSS laporan lembaga.

## Acceptance criteria

- Route Laporan Individu existing tetap dipakai.
- Layout maksimum 480 px pada semua viewport.
- Tidak ada horizontal body overflow pada 320, 375, dan 390 px.
- Touch target minimum 44 px.
- CTA tidak menutup konten dan baru sticky di area action plan.
- Respons, harapan, dan agregat lembaga berlabel jelas.
- Gap cocok dengan official gap atau `target - current`.
- Tidak ada star rating.
- Pengguna dapat memilih tindakan.
- Mengganti tindakan memperbarui default commitment composer.
- Pengguna dapat mengedit dan menyimpan draft.
- Pengguna dapat menyimpan komitmen 30 hari.
- Refleksi asli tersembunyi secara default.
- Permission dan privacy existing tidak mengalami regresi.
- Keyboard focus state dan screen-reader labels tersedia.
- `prefers-reduced-motion` didukung.
- Lint, typecheck, tests, dan production build lulus.

## Output yang harus diberikan Claude Code sebelum implementasi

1. File existing yang dipertahankan.
2. File existing yang akan diubah.
3. File baru yang dibutuhkan.
4. Mapping API ke `IndividualReport`.
5. Data gap.
6. Risiko privacy dan regression.
7. Rencana implementasi bertahap.
8. Rencana pengujian dan rollback.

## Prompt siap-tempel untuk Claude Code

```text
Anda akan merombak total UI/UX Laporan Individu pada modul School Culture
existing di Fammi.

Baca CLAUDE_CODE_HANDOFF_INDIVIDUAL.md sampai selesai. Pelajari empat visual
reference 10-individual-overview.png sampai 13-individual-commitment.png,
IndividualReport.tsx, individual.ts, sampleIndividualReport.ts, Reveal.tsx,
dan individual-report.css. Jika membaca workspace prototype langsung, CSS yang
sama berada di src/styles.css setelah marker
"Individual report — intentionally mobile-only".

PENTING:
- Ini redesign in-place, bukan modul atau route baru.
- Jangan membuat iframe atau menyalin aplikasi Vite.
- Laporan Individu harus tetap mobile-only dengan lebar maksimum 480 px,
  termasuk ketika dibuka di desktop.
- Pertahankan auth, permission, route, API, official calculations, analytics,
  export, persistence, dan tests existing.
- Jangan memakai sample data di production.
- Jangan mulai mengubah UI sebelum mengaudit implementasi existing.

Pertama, laporkan:
1. route dan entry file existing;
2. components dan hooks existing;
3. API serta response type;
4. perhitungan gap;
5. aturan privacy dan permission;
6. persistence action plan/check-in;
7. file yang dipertahankan, diubah, dan ditambahkan;
8. data gap dan risiko regresi;
9. rencana pengujian.

Setelah audit, implementasikan redesign pada route existing menggunakan adapter
ke IndividualReport view model. Pastikan pengguna dapat memahami insight,
memisahkan kendali/pengaruh/sistem, memilih tindakan, menyesuaikan komitmen,
menyimpan draft, dan menjalani check-in 30 hari.

Jalankan lint, typecheck, tests, dan production build. Lakukan verifikasi pada
viewport 320, 375, dan 390 px serta pastikan tampilan tetap maksimum 480 px
pada desktop.
```
