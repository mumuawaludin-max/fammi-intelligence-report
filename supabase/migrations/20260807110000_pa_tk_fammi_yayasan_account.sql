-- Akun uji Yayasan untuk TK Fammi, menyusul akun Kepala Sekolah + Guru Kelompok A di
-- 20260807100000_pa_tk_ceria_seed.sql. Peran Yayasan sudah termasuk di ketiga policy baca modul
-- PA (pa_lembaga_baca/pa_siswa_baca/pa_esai_baca) sejak awal, jadi tidak ada perubahan RLS di
-- sini -- murni provisioning akun baru, cakupan seluruh sekolah (kedua kelompok), sama seperti
-- Kepala Sekolah.
--
-- crypt/gen_salt WAJIB diberi prefiks skema "extensions." -- pgcrypto terpasang di skema
-- extensions, dan search_path role migrasi (dijalankan lewat `supabase db push`) tidak otomatis
-- memuatnya seperti di Supabase SQL Editor. Tanpa prefiks ini migration 20260807100000 sempat
-- gagal dengan "function gen_salt(unknown) does not exist" sebelum diperbaiki.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'yayasantkfammi@fammi.internal', extensions.crypt('gantiSandiIni2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from auth.users where email = 'yayasantkfammi@fammi.internal';

insert into public.profiles (id, username, nama, peran, school_id)
select id, 'yayasantkfammi', 'Yayasan TK Fammi', 'Yayasan', 'TK-FAMMI'
from auth.users where email = 'yayasantkfammi@fammi.internal';

-- Login: username "yayasantkfammi", kode "gantiSandiIni2026" (ganti sebelum dipakai).
