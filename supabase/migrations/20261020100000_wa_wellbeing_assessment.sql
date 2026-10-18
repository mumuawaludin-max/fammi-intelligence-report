-- Modul Wellbeing Assessment (kode modul: wa).
--
-- Asesmen lanjutan dari Screening Awal Wellbeing (sw): PROTEK (enam aspek), kepuasan kerja,
-- pilihan ganda, pertanyaan terbuka, dan respons tim pendamping untuk cerita pribadi pegawai.
-- Semua angka dan narasi sudah final di berkas olahan; FIR hanya membaca. Rencana lengkap di
-- docs/wa-wellbeing-assessment-plan.md.
--
-- Isi migration:
--   1. Nilai 'wa' di school_modules.modul.
--   2. Kolom tautan akun profiles.wa_individu_id + helper my_wa_individu_id(). Peran tidak
--      bertambah: HumanCapital dan Pegawai sudah ada sejak migration 20260917100000.
--   3. Tabel data: wa_dataset, wa_kelompok (agregat per cakupan), wa_individu (satu baris per
--      pegawai, bernama), wa_narasi (narasi kelompok, narasi individu, respons cerita).
--   4. RLS. Aturan pokok:
--      - Human Capital membaca dataset, kelompok, dan individu sekolahnya, plus narasi KELOMPOK
--        yang sudah disetujui. Narasi individu dan respons cerita bukan untuk Human Capital.
--      - Pegawai membaca dataset sekolahnya, baris individu miliknya, dan narasi individu serta
--        respons cerita miliknya yang sudah disetujui. Tidak membaca agregat kelompok.
--      - Narasi yang belum disetujui tidak pernah terbaca selain oleh Admin Fammi.
--      - Kolom perlu_ahli dan alasan_perhatian (catatan peninjau) TIDAK diberikan ke peran
--        authenticated lewat hak akses kolom; hanya service role (Edge Function admin-actions) dan
--        Admin Fammi lewat Edge Function itu yang memakainya.
--   5. Tidak ada policy tulis. Data masuk lewat seed (service role) hasil `npm run wa:baca`;
--      persetujuan narasi lewat Edge Function admin-actions (service role).
--
-- Aman dijalankan ulang.

-- ── 1. Entitlement modul ──────────────────────────────────────────────────────────────────
do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw', 'kp', 'sw', 'wa']) as v
    union
    select distinct modul from public.school_modules where modul is not null
  ) s;

  execute 'alter table public.school_modules drop constraint if exists school_modules_modul_check';
  execute format(
    'alter table public.school_modules add constraint school_modules_modul_check check (modul in (%s))',
    daftar
  );
end $$;

-- ── 2. Tautan akun ────────────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists wa_individu_id text;

comment on column public.profiles.wa_individu_id is
  'Wellbeing Assessment: baris isian milik akun Pegawai (wa_individu.individu_id, mis. R042). Satu akun boleh punya tautan sw dan wa sekaligus.';

create or replace function public.my_wa_individu_id()
returns text language sql stable security definer set search_path = public as $$
  select wa_individu_id from public.profiles where id = auth.uid()
$$;

revoke all on function public.my_wa_individu_id() from public, anon;
grant execute on function public.my_wa_individu_id() to authenticated;

-- ── 3. Tabel data ─────────────────────────────────────────────────────────────────────────
create table if not exists public.wa_dataset (
  id text primary key,                          -- WA-<sekolah>-<periode>
  sekolah_id text not null references public.schools(id) on delete cascade,
  periode_id text not null,
  meta jsonb not null,                          -- tanpa nama
  parameter jsonb not null,                     -- ambang dan label dari sheet PARAMETER
  item jsonb not null,                          -- kamus 54 pernyataan
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists wa_dataset_sekolah_idx on public.wa_dataset (sekolah_id, aktif, created_at desc);

create table if not exists public.wa_kelompok (
  dataset_id text not null references public.wa_dataset(id) on delete cascade,
  cakupan text not null check (cakupan in ('lembaga', 'jenjang', 'unit', 'kelompok_jabatan')),
  kunci text not null,
  sekolah_id text not null,
  nama text not null,
  n_responden int not null,
  data jsonb not null,
  primary key (dataset_id, cakupan, kunci)
);

create table if not exists public.wa_individu (
  dataset_id text not null references public.wa_dataset(id) on delete cascade,
  individu_id text not null,
  sekolah_id text not null,
  unit_id text not null,
  nama text not null,
  data jsonb not null,
  primary key (dataset_id, individu_id)
);
create index if not exists wa_individu_unit_idx on public.wa_individu (dataset_id, unit_id);

create table if not exists public.wa_narasi (
  dataset_id text not null references public.wa_dataset(id) on delete cascade,
  cakupan text not null check (cakupan in ('lembaga', 'jenjang', 'unit', 'kelompok_jabatan', 'individu', 'respons_cerita')),
  kunci text not null,
  sekolah_id text not null,
  isi jsonb not null,
  perlu_ahli boolean not null default false,
  alasan_perhatian text,
  status text not null default 'menunggu_persetujuan'
    check (status in ('menunggu_persetujuan', 'disetujui', 'ditolak')),
  draf_asal text not null default 'excel',
  disunting boolean not null default false,
  disetujui_oleh uuid,
  disetujui_pada timestamptz,
  catatan_admin text,
  diperbarui_pada timestamptz not null default now(),
  primary key (dataset_id, cakupan, kunci)
);
create index if not exists wa_narasi_status_idx on public.wa_narasi (status, sekolah_id);

-- ── 4. RLS ────────────────────────────────────────────────────────────────────────────────
alter table public.wa_dataset enable row level security;
alter table public.wa_kelompok enable row level security;
alter table public.wa_individu enable row level security;
alter table public.wa_narasi enable row level security;

-- Fungsi dibungkus (select ...) supaya dievaluasi sekali per query (InitPlan), bukan per baris.
drop policy if exists wa_dataset_baca on public.wa_dataset;
create policy wa_dataset_baca on public.wa_dataset
for select to authenticated
using (
  (select public.my_peran()) in ('HumanCapital', 'Pegawai')
  and sekolah_id = (select public.my_school_id())
);

drop policy if exists wa_kelompok_baca on public.wa_kelompok;
create policy wa_kelompok_baca on public.wa_kelompok
for select to authenticated
using (
  (select public.my_peran()) = 'HumanCapital'
  and sekolah_id = (select public.my_school_id())
);

drop policy if exists wa_individu_baca on public.wa_individu;
create policy wa_individu_baca on public.wa_individu
for select to authenticated
using (
  sekolah_id = (select public.my_school_id())
  and (
    (select public.my_peran()) = 'HumanCapital'
    or ((select public.my_peran()) = 'Pegawai' and individu_id = (select public.my_wa_individu_id()))
  )
);

drop policy if exists wa_narasi_baca on public.wa_narasi;
create policy wa_narasi_baca on public.wa_narasi
for select to authenticated
using (
  status = 'disetujui'
  and sekolah_id = (select public.my_school_id())
  and (
    ((select public.my_peran()) = 'HumanCapital' and cakupan in ('lembaga', 'jenjang', 'unit', 'kelompok_jabatan'))
    or (
      (select public.my_peran()) = 'Pegawai'
      and cakupan in ('individu', 'respons_cerita')
      and kunci = (select public.my_wa_individu_id())
    )
  )
);

-- Admin Fammi membaca semua baris (pola sama dengan modul lain).
do $$
declare t text;
begin
  foreach t in array array['wa_dataset', 'wa_kelompok', 'wa_individu', 'wa_narasi'] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_baca', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_admin_fammi())', t || '_admin_baca', t);
  end loop;
end $$;

-- ── 5. Hak akses ──────────────────────────────────────────────────────────────────────────
revoke all on public.wa_dataset, public.wa_kelompok, public.wa_individu, public.wa_narasi from anon;
revoke all on public.wa_narasi from authenticated;
grant select on public.wa_dataset, public.wa_kelompok, public.wa_individu to authenticated;
-- Kolom peninjau (perlu_ahli, alasan_perhatian, disetujui_oleh, catatan_admin) sengaja tidak
-- diberikan: RLS baris tidak bisa menyembunyikan kolom, hak akses kolom bisa. Query dari FIR
-- wajib menyebut kolom satu per satu (select * akan ditolak).
grant select (dataset_id, cakupan, kunci, sekolah_id, isi, status, disetujui_pada) on public.wa_narasi to authenticated;
