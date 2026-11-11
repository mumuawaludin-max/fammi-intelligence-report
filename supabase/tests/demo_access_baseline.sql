-- Replika minimal keadaan produksi SEBELUM migration 20261111100000 (akses demo halaman masuk):
-- peran anon/authenticated/service_role, peran authenticator yang dipakai PostgREST, skema
-- extensions dengan pgcrypto, helper auth.uid()/auth.role(), dan is_admin_fammi(). Ketiga helper
-- membaca GUC test.* supaya verifikasi bisa berganti peran. Urutan uji di supabase/tests/README.md.

do $r$ begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then create role service_role nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticator') then create role authenticator login noinherit; end if;
end $r$;
grant anon, authenticated, service_role to authenticator;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;
-- Kolom auth.users yang dibaca demo_akun_email. Di produksi tabel ini milik Supabase Auth.
create table if not exists auth.users (
  id uuid primary key,
  email varchar(255),
  created_at timestamptz default now(),
  deleted_at timestamptz
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select nullif(current_setting('test.role', true), '')
$$;

create or replace function public.is_admin_fammi() returns boolean language sql stable security definer as $$
  select coalesce(current_setting('test.admin', true), '') = 'ya'
$$;

grant usage on schema public to anon, authenticated, service_role;

-- Supabase memberi hak penuh tabel baru dan EXECUTE fungsi baru ke anon dan authenticated lewat
-- default privileges; ditiru di sini supaya uji membuktikan migration benar-benar mencabutnya.
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant execute on functions to anon, authenticated;
