-- Akun Yayasan Pendidikan Telkom + helper RLS jalur yayasan.
-- Rencana: docs/yayasan-telkom-dashboard-plan.md (Milestone 0, bagian 4.3 dan 4.4).
-- Prasyarat: 20260825100000_ypt_naungan_dan_kota.sql sudah jalan (sekolah sudah punya yayasan_id).

-- ── 1. Helper my_yayasan_school_ids() ─────────────────────────────────────────────────────
-- Dipakai policy RLS tabel baru YPT (cs_testimoni, kp_responden, dp_item) supaya akun Yayasan
-- bisa membaca baris SEMUA sekolah di bawah naungannya, bukan cuma school_id jangkarnya.
--
-- Kenapa perlu helper, bukan subquery langsung di tiap policy: profiles.cakupan adalah kolom yang
-- di-overload -- untuk WaliKelas isinya daftar kelas_id, untuk Yayasan isinya yayasan_id (lihat
-- catatan di 20260810130000). Helper ini mengunci penafsiran itu di SATU tempat, dan menegaskan
-- lewat pengecekan peran bahwa daftar sekolah hanya pernah keluar untuk peran Yayasan -- jadi
-- akun WaliKelas yang cakupannya kebetulan berisi teks mirip id yayasan tidak bisa menembusnya.
--
-- security definer WAJIB: fungsi ini membaca profiles milik user yang sedang login, dan schools;
-- tanpa itu policy yang memanggilnya akan berulang ke RLS profiles/schools dan bisa rekursif.
-- CATATAN PERBAIKAN (2026-08-26): versi awal fungsi ini menulis
--   where s.yayasan_id = any (select p.cakupan from public.profiles p ...)
-- Itu gagal dengan "operator does not exist: text = text[]" -- p.cakupan bertipe text[], jadi
-- subquery-nya mengembalikan BARIS-BARIS ARRAY, bukan baris-baris teks tunggal, dan `= any(...)`
-- tidak bisa membandingkan text dengan text[] per baris. unnest(p.cakupan) di bawah memecah array
-- itu jadi satu baris per elemen, baru cocok dibandingkan dengan s.yayasan_id yang bertipe text.
create or replace function public.my_yayasan_school_ids()
returns text[]
language sql
stable
security definer
as $$
  select coalesce(array_agg(s.id), array[]::text[])
  from public.schools s
  where s.yayasan_id = any (
          select unnest(p.cakupan) from public.profiles p
          where p.id = auth.uid() and p.peran = 'Yayasan'
        )
$$;

comment on function public.my_yayasan_school_ids() is
  'Daftar schools.id di bawah naungan yayasan user yang sedang login. Array kosong untuk peran '
  'selain Yayasan atau kalau cakupan belum diisi. Dipakai policy RLS dashboard Yayasan.';

grant execute on function public.my_yayasan_school_ids() to authenticated;

-- ── 2. Akun Yayasan Pendidikan Telkom ─────────────────────────────────────────────────────
-- Akun BARU (bukan memakai ulang yayasansmktelkompwt yang sudah ada), sesuai keputusan pemilik
-- produk 2026-08-25: satu akun yang menaungi seluruh sekolah Telkom.
--
-- school_id di sini cuma JANGKAR, bukan pembatas cakupan: dipilih otomatis dari sekolah Telkom
-- pertama secara alfabet. Yang menentukan sekolah mana saja yang terlihat adalah cakupan[0]
-- ('YAY-PENDIDIKAN-TELKOM'), lewat session.schools di auth.js dan my_yayasan_school_ids() di RLS.
-- profiles.school_id NOT NULL, jadi jangkar tetap wajib diisi.
--
-- crypt/gen_salt WAJIB berprefiks "extensions." -- pgcrypto terpasang di skema extensions dan
-- search_path role migrasi tidak memuatnya otomatis (lihat catatan di 20260807110000).
do $$
declare
  jangkar text;
  uid uuid;
begin
  select id into jangkar from public.schools
  where yayasan_id = 'YAY-PENDIDIKAN-TELKOM' and aktif is not false
  order by id limit 1;

  if jangkar is null then
    raise exception 'Belum ada sekolah dengan yayasan_id = YAY-PENDIDIKAN-TELKOM. Jalankan 20260825100000 lebih dulu.';
  end if;

  -- Idempotent: kalau akun sudah ada (migration dijalankan ulang), cukup segarkan profilnya.
  select id into uid from auth.users where email = 'yayasanpendidikantelkom@fammi.internal';

  if uid is null then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'yayasanpendidikantelkom@fammi.internal',
      extensions.crypt('gantiSandiIni2026', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
    ) returning id into uid;

    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', 'yayasanpendidikantelkom@fammi.internal'),
            'email', uid::text, now(), now(), now());
  end if;

  insert into public.profiles (id, username, nama, peran, school_id, cakupan)
  values (uid, 'yayasanpendidikantelkom', 'Yayasan Pendidikan Telkom', 'Yayasan', jangkar,
          array['YAY-PENDIDIKAN-TELKOM'])
  on conflict (id) do update
    set username = excluded.username,
        nama     = excluded.nama,
        peran    = excluded.peran,
        school_id = excluded.school_id,
        cakupan  = excluded.cakupan;

  raise notice 'YPT: akun yayasanpendidikantelkom siap, sekolah jangkar = %', jangkar;
end $$;

-- Login: username "yayasanpendidikantelkom", kode "gantiSandiIni2026".
-- GANTI SANDI INI sebelum diserahkan ke YPT (lewat Admin CMS > Pengguna, atau update auth.users).
