-- Akun uji untuk QA modul Karakter multi-sumber refleksi di SMK Telkom Purwokerto.
-- Mengikuti pola provisioning akun uji yang sama dengan 20260807100000_pa_tk_ceria_seed.sql:
-- insert langsung ke auth.users + auth.identities + public.profiles, bukan lewat form signup
-- (tidak ada jalur signup di produk ini, akun dibuat manual oleh AdminFammi).
--
-- crypt/gen_salt WAJIB diberi prefiks skema "extensions." di context migration (search_path
-- role migrasi tidak otomatis memuat skema extensions seperti di Supabase SQL Editor interaktif).
--
-- GANTI kode login di bawah sebelum dipakai di luar QA internal.

-- Yayasan butuh schools.yayasan_id yang cocok dengan cakupan[0] akun Yayasan (lihat
-- useKarakterData.js:373-388). SMK Telkom Purwokerto belum tergabung yayasan mana pun di
-- sistem ini, jadi diberi grup yayasan sendiri (satu sekolah, satu grup) khusus untuk QA.
update public.schools set yayasan_id = 'YYS-SMK-TELKOM-PWT' where id = 'SMK-TELKOM-PWT';

-- ── Kepala Sekolah ──────────────────────────────────────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'kepseksmktelkompwt@fammi.internal', extensions.crypt('gantiSandiIni2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from auth.users where email = 'kepseksmktelkompwt@fammi.internal';

insert into public.profiles (id, username, nama, peran, school_id)
select id, 'kepseksmktelkompwt', 'Kepala Sekolah SMK Telkom Purwokerto', 'KepalaSekolah', 'SMK-TELKOM-PWT'
from auth.users where email = 'kepseksmktelkompwt@fammi.internal';

-- ── Wali Kelas, cakupan Kelas X PPLG 3 ─────────────────────────────────────────────────────
-- Kelas ini sengaja dipilih karena di sample data punya refleksi orang tua DAN siswa berdampingan
-- (lihat docs/karakter-multi-sumber-refleksi-dev-detail.md bagian 8), jadi paling representatif
-- untuk QA saklar sumber dan ReflectionBlock dua-blok.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'walikelaspplg3smktelkompwt@fammi.internal', extensions.crypt('gantiSandiIni2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from auth.users where email = 'walikelaspplg3smktelkompwt@fammi.internal';

insert into public.profiles (id, username, nama, peran, school_id, cakupan)
select id, 'walikelaspplg3smktelkompwt', 'Wali Kelas X PPLG 3', 'WaliKelas', 'SMK-TELKOM-PWT', array['Kelas X PPLG 3']
from auth.users where email = 'walikelaspplg3smktelkompwt@fammi.internal';

-- ── Yayasan (grup satu sekolah, khusus QA) ─────────────────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'yayasansmktelkompwt@fammi.internal', extensions.crypt('gantiSandiIni2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from auth.users where email = 'yayasansmktelkompwt@fammi.internal';

insert into public.profiles (id, username, nama, peran, school_id, cakupan)
select id, 'yayasansmktelkompwt', 'Yayasan SMK Telkom Purwokerto', 'Yayasan', 'SMK-TELKOM-PWT', array['YYS-SMK-TELKOM-PWT']
from auth.users where email = 'yayasansmktelkompwt@fammi.internal';

-- Login QA (ganti kode sebelum dipakai lebih luas):
--   Kepala Sekolah -- username "kepseksmktelkompwt", kode "gantiSandiIni2026"
--   Wali Kelas X PPLG 3 -- username "walikelaspplg3smktelkompwt", kode "gantiSandiIni2026"
--   Yayasan -- username "yayasansmktelkompwt", kode "gantiSandiIni2026"
