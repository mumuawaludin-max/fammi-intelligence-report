-- Replika minimal keadaan produksi SEBELUM migration 20260917100000 (Screening Awal Wellbeing):
-- profiles, schools, school_modules beserta check constraint lama, dan helper RLS yang
-- dipanggil migration. auth.uid() membaca GUC test.uid supaya verifikasi bisa berganti akun.

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
  constraint school_modules_modul_check check (modul in ('karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw', 'kp'))
);
create table public.profiles (
  id uuid primary key, username text, nama text, peran text, school_id text, cakupan text[],
  constraint profiles_peran_check check (peran in ('AdminFammi', 'Yayasan', 'KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Karyawan', 'WaliKelas', 'OrangTua', 'Siswa'))
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
create or replace function public.my_yayasan_school_ids() returns text[] language sql stable security definer as $$
  select coalesce(array_agg(s.id), array[]::text[]) from public.schools s
  where s.yayasan_id = any (select unnest(p.cakupan) from public.profiles p where p.id = auth.uid() and p.peran = 'Yayasan')
$$;

grant usage on schema public to authenticated;
grant select on public.profiles, public.schools, public.school_modules to authenticated;

insert into public.schools values ('CONTOH-SW', 'Yayasan Contoh Nusantara', 'YAY-CONTOH'), ('LAIN', 'Sekolah Lain', null);
insert into public.school_modules values ('CONTOH-SW', 'pa', true);
insert into public.profiles values
  ('00000000-0000-0000-0000-000000000001', 'hc', 'HC Uji', 'KepalaSekolah', 'CONTOH-SW', null),
  ('00000000-0000-0000-0000-000000000002', 'yayasan', 'Yayasan Uji', 'Yayasan', 'CONTOH-SW', array['YAY-CONTOH']),
  ('00000000-0000-0000-0000-000000000003', 'kasd', 'Kepala SD', 'KepalaSekolah', 'CONTOH-SW', null),
  ('00000000-0000-0000-0000-000000000004', 'kakeu', 'Kepala Keuangan', 'KepalaSekolah', 'CONTOH-SW', null),
  ('00000000-0000-0000-0000-000000000005', 'pegawai', 'Pegawai Uji', 'Siswa', 'CONTOH-SW', null),
  ('00000000-0000-0000-0000-000000000006', 'hclain', 'HC Lain', 'KepalaSekolah', 'LAIN', null);
