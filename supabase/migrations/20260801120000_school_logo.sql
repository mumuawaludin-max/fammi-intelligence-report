-- Logo sekolah: kolom logo_url di schools + bucket Storage publik untuk menyimpan filenya.
--
-- Logo diunggah lewat Edge Function admin-actions (action "add-school", field logoBase64),
-- BUKAN langsung dari browser dengan anon key -- upload jalan lewat service_role di Edge
-- Function, sama seperti seluruh mutasi CMS Admin lain (lihat komentar kepala berkas
-- admin-actions/index.ts). Karena itu tidak perlu policy storage.objects untuk INSERT/UPDATE;
-- service_role melewati RLS/policy storage sepenuhnya.
--
-- Bucket ditandai publik (bukan privat + signed URL) karena logo sekolah cuma citra identitas
-- (lambang/wordmark), bukan data sensitif -- aman ditampilkan tanpa autentikasi di Header,
-- dan bucket publik disajikan Supabase lewat endpoint publik tanpa perlu policy SELECT sama
-- sekali.

alter table public.schools add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('school-logos', 'school-logos', true)
on conflict (id) do nothing;
