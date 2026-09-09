-- PT Glamindo: pendaftaran organisasi klien pertama modul Corporate Culture & Wellbeing (CW)
-- beserta entitlement modulnya.
--
-- Ini BUKAN seed data contoh. Tidak ada satu pun baris asesmen di berkas ini; angka Glamindo
-- masuk lewat jalur normal, yaitu unggah berkas olahan di Admin Fammi > Upload > modul Culture.
-- Yang disiapkan di sini cuma dua hal yang memang harus ada lebih dulu sebelum unggahan pertama
-- bisa dilakukan: baris schools dan baris school_modules.
--
-- AKUN SENGAJA TIDAK DIBUAT DI SINI. Membuat akun lewat SQL berarti menuliskan kata sandi klien
-- ke dalam repo, dan itu tidak diinginkan (keputusan pemilik produk 2026-09-09). Akun Manajemen
-- dibuat lewat Admin Fammi > Pengguna > Buat akun baru, yang membangkitkan kata sandinya sendiri
-- lewat Edge Function create-user. Isian yang harus dipakai supaya cocok dengan baris di bawah:
--   Nama lengkap : Manajemen PT Glamindo
--   Username     : glamindo
--   Peran        : Manajemen
--   Sekolah      : PT-GLAMINDO
--   Cakupan      : kosongkan (itu kolom untuk yayasan multi-sekolah, lihat yayasanIdDariCakupan
--                  di web/src/lib/auth.js; akun ini satu organisasi, modulnya diresolusi dari
--                  school_id-nya sendiri lewat school_modules di bawah)
-- Akun Karyawan juga tidak perlu dibuat manual: admin-actions membuatnya otomatis beserta kode
-- login saat admin menyetujui laporan individu hasil unggahan.
--
-- CATATAN TABEL: modul CW membaca dan menulis tabel sc_* yang sama dengan School Culture
-- (keputusan pemilik produk 2026-09-09, lihat CLAUDE.md dan web/src/pages/cw/useCwData.js).
-- Jadi tidak ada tabel baru yang perlu dibuat migration ini, cuma data induknya.
--
-- Idempoten: kedua insert memakai on conflict, aman dijalankan ulang.
-- Jalankan lewat SQL Editor Supabase (proyek ini belum punya akses Supabase CLI).

-- ── 1. Organisasi ─────────────────────────────────────────────────────────────────────
-- `jenjang` sengaja dibiarkan NULL: kolom itu milik konteks sekolah (TK/SD/SMK/Semua Jenjang),
-- dan PT Glamindo perusahaan, bukan satuan pendidikan. Mengisinya dengan "Perusahaan" cuma akan
-- menaruh istilah yang bukan jenjang ke dalam kolom jenjang.
insert into public.schools (id, nama, jenjang)
values ('PT-GLAMINDO', 'PT Glamindo', null)
on conflict (id) do update set nama = excluded.nama;

-- ── 2. Entitlement modul ──────────────────────────────────────────────────────────────
-- Cuma 'cw'. Jangan sekalian menyalakan 'sc' walau tabelnya sama: entitlement inilah yang
-- menentukan tab mana yang muncul di NavBar, dan Glamindo harus melihat "Culture & Wellbeing",
-- bukan "School Culture".
insert into public.school_modules (school_id, modul, aktif)
values ('PT-GLAMINDO', 'cw', true)
on conflict (school_id, modul) do update set aktif = true;

-- ── Verifikasi cepat setelah dijalankan ───────────────────────────────────────────────
--   select id, nama, jenjang from public.schools where id = 'PT-GLAMINDO';
--   select modul, aktif from public.school_modules where school_id = 'PT-GLAMINDO';
-- Lalu buat akun Manajemennya lewat Admin Fammi (lihat isian di atas), dan pastikan:
--   select username, peran, school_id from public.profiles where school_id = 'PT-GLAMINDO';
-- Setelah login, tab yang muncul "Culture & Wellbeing" dengan status kosong sampai berkas
-- pertama diunggah dan disetujui.
