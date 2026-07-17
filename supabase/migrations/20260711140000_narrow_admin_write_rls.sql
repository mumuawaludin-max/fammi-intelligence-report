-- Kecilkan permukaan RLS tulis untuk AdminFammi (Fase A4).
--
-- Lima aksi CMS (approve/tolak draf, ubah profil user, tambah sekolah, toggle modul, ubah
-- jadwal Gemini) sudah dipindah dari tulisan langsung browser+anon key ke Edge Function
-- admin-actions (server-side, verifikasi caller sendiri, pakai service_role -- lihat
-- supabase/functions/admin-actions/index.ts). Sudah dites lewat aplikasi sungguhan dan
-- berhasil sebelum migration ini ditulis.
--
-- Policy RLS "FOR ALL" untuk enam tabel di bawah karena itu tidak lagi perlu mengizinkan
-- INSERT/UPDATE/DELETE dari browser -- disempitkan jadi SELECT saja. AdminFammi tetap bisa
-- membaca semuanya lewat browser (dipakai CMS untuk daftar/monitor di useAdminCmsData.js),
-- tapi mutasi cuma lewat admin-actions sekarang. service_role yang dipakai Edge Function
-- (dan generate-tindak-lanjut/batch-generate-tindak-lanjut untuk tindak_lanjut/briefing) tetap
-- bypass RLS seperti biasa, tidak terdampak sama sekali oleh migration ini.
--
-- SENGAJA TIDAK disentuh: karakter_skor, karakter_skor_indikator, karakter_pernyataan_ortu,
-- karakter_summary, karakter_aspek_config, karakter_indikator_config, import_log --
-- import Karakter masih menulis langsung dari browser (Fase E1, transaksi di server, belum
-- dikerjakan), jadi policy ALL-nya masih dibutuhkan. gemini_feedback juga tidak disentuh
-- (ditulis lewat service_role dari dalam generate-tindak-lanjut, RLS-nya tidak relevan untuk
-- jalur itu, dan belum diverifikasi ada jalur browser lain yang memakainya -- di luar
-- cakupan A4).

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_baca on public.profiles
for select to authenticated
using (is_admin_fammi());

drop policy if exists tl_admin_all on public.tindak_lanjut;
create policy tl_admin_baca on public.tindak_lanjut
for select to authenticated
using (is_admin_fammi());

drop policy if exists briefing_admin_all on public.briefing;
create policy briefing_admin_baca on public.briefing
for select to authenticated
using (is_admin_fammi());

drop policy if exists schools_admin_all on public.schools;
create policy schools_admin_baca on public.schools
for select to authenticated
using (is_admin_fammi());

drop policy if exists school_modules_admin_all on public.school_modules;
create policy school_modules_admin_baca on public.school_modules
for select to authenticated
using (is_admin_fammi());

drop policy if exists gemini_schedule_admin_all on public.gemini_schedule;
create policy gemini_schedule_admin_baca on public.gemini_schedule
for select to authenticated
using (is_admin_fammi());
