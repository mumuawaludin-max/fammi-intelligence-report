-- Replika minimal keadaan produksi SEBELUM migration 20261020100000 (Wellbeing Assessment):
-- profiles (sudah berkolom tautan sw dan peran HumanCapital/Pegawai), schools, school_modules
-- beserta check constraint lama, dan helper RLS yang dipanggil migration. auth.uid() membaca GUC
-- test.uid supaya verifikasi bisa berganti akun. Urutan uji ada di supabase/tests/README.md.

do $r$ begin
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end $r$;

create schema if not exists auth;
grant usage on schema auth to authenticated;
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid
$$;

create table public.schools (id text primary key, nama text, yayasan_id text);
create table public.school_modules (
  school_id text references public.schools(id), modul text, aktif boolean default true,
  constraint school_modules_modul_check check (modul in ('karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw', 'kp', 'sw'))
);
create table public.profiles (
  id uuid primary key, username text, nama text, peran text, school_id text, cakupan text[],
  sw_unit_id text, sw_individu_id text,
  constraint profiles_peran_check check (peran in ('AdminFammi', 'Yayasan', 'KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Karyawan', 'WaliKelas', 'OrangTua', 'Siswa', 'KepalaUnit', 'HumanCapital', 'Pegawai'))
);

create or replace function public.my_peran() returns text language sql stable security definer as $$
  select peran from public.profiles where id = auth.uid()
$$;
create or replace function public.my_school_id() returns text language sql stable security definer as $$
  select school_id from public.profiles where id = auth.uid()
$$;
create or replace function public.is_admin_fammi() returns boolean language sql stable security definer as $$
  select coalesce((select peran = 'AdminFammi' from public.profiles where id = auth.uid()), false)
$$;

grant usage on schema public to authenticated;
grant select on public.profiles, public.schools, public.school_modules to authenticated;

-- Supabase memberi hak penuh tabel baru ke anon dan authenticated lewat default privileges;
-- ditiru di sini supaya uji membuktikan migration benar-benar mencabutnya.
alter default privileges in schema public grant all on tables to anon, authenticated;

insert into public.schools values ('CONTOH', 'Lembaga Contoh', null), ('LAIN', 'Sekolah Lain', null);
insert into public.school_modules values ('CONTOH', 'sw', true);
insert into public.profiles (id, username, nama, peran, school_id) values
  ('00000000-0000-0000-0000-000000000001', 'hc', 'HC Uji', 'HumanCapital', 'CONTOH'),
  ('00000000-0000-0000-0000-000000000002', 'pegawai', 'Pegawai Disetujui', 'Pegawai', 'CONTOH'),
  ('00000000-0000-0000-0000-000000000003', 'pegawai2', 'Pegawai Menunggu', 'Pegawai', 'CONTOH'),
  ('00000000-0000-0000-0000-000000000004', 'tanpa', 'Pegawai Tanpa Tautan', 'Pegawai', 'CONTOH'),
  ('00000000-0000-0000-0000-000000000005', 'hclain', 'HC Lain', 'HumanCapital', 'LAIN'),
  ('00000000-0000-0000-0000-000000000006', 'kepsek', 'Kepala Sekolah', 'KepalaSekolah', 'CONTOH'),
  ('00000000-0000-0000-0000-000000000007', 'admin', 'Admin Fammi', 'AdminFammi', null);
