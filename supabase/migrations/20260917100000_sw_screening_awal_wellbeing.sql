-- Modul Screening Awal Wellbeing (kode modul: sw).
--
-- Yang diukur: seberapa baik kondisi kerja di sebuah lembaga pendidikan, dari dua sumber
-- (Form A isian pegawai, Form B pengamatan atasan). Hasil olahan hulu (skor, gap, pola, skor
-- prioritas, daftar peserta asesmen lanjutan) sudah final saat masuk ke sini. FIR hanya membaca.
--
-- Isi migration:
--   1. Tiga peran baru: KepalaUnit, HumanCapital, Pegawai. Yayasan memakai peran yang sudah ada.
--   2. Nilai 'sw' di school_modules.modul.
--   3. Kolom tautan akun: profiles.sw_unit_id (kepala unit) dan profiles.sw_individu_id (pegawai).
--   4. Tabel data: sw_dataset (agregat lembaga, tema, asumsi), sw_unit, sw_individu,
--      sw_pimpinan_qc (kendali mutu pengisian, Human Capital saja).
--   5. Tabel yang ditulis dari FIR: sw_tinjauan (catatan tindak lanjut Human Capital), lewat RPC
--      security definer supaya pengubahnya tidak bisa dipalsukan dari browser.
--   6. RLS. Aturan pokok:
--      - Nama perorangan (sw_individu) hanya untuk Human Capital sekolah itu dan pegawai yang
--        bersangkutan.
--      - Baris unit dengan pengisi di bawah ambang (asumsi.minPengisiUnit, bawaan 10) hanya untuk
--        Human Capital.
--      - Kepala unit hanya membaca baris unitnya sendiri.
--      - Kendali mutu per pimpinan hanya untuk Human Capital.
--
-- Data diisi lewat seed hasil `npm run sw:baca` (web/scripts/sw/baca-berkas-sw.mjs), ditempel di
-- SQL Editor. Seed itu berisi nama pegawai dan tidak pernah di-commit.

-- ── 1. Peran baru ─────────────────────────────────────────────────────────────────────────
do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array[
      'AdminFammi', 'Yayasan', 'KepalaSekolah', 'WakilKepalaSekolah',
      'Manajemen', 'Karyawan', 'WaliKelas', 'OrangTua', 'Siswa',
      'KepalaUnit', 'HumanCapital', 'Pegawai'
    ]) as v
    union
    select distinct peran from public.profiles where peran is not null
  ) s;

  execute 'alter table public.profiles drop constraint if exists profiles_peran_check';
  execute format(
    'alter table public.profiles add constraint profiles_peran_check check (peran in (%s))',
    daftar
  );
end $$;

-- ── 2. Entitlement modul ──────────────────────────────────────────────────────────────────
do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw', 'kp', 'sw']) as v
    union
    select distinct modul from public.school_modules where modul is not null
  ) s;

  execute 'alter table public.school_modules drop constraint if exists school_modules_modul_check';
  execute format(
    'alter table public.school_modules add constraint school_modules_modul_check check (modul in (%s))',
    daftar
  );
end $$;

-- ── 3. Tautan akun ────────────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists sw_unit_id text;
alter table public.profiles add column if not exists sw_individu_id text;

comment on column public.profiles.sw_unit_id is
  'Screening Awal Wellbeing: unit yang dipimpin akun KepalaUnit (sw_unit.unit_id, mis. u-sd-athirah-baruga).';
comment on column public.profiles.sw_individu_id is
  'Screening Awal Wellbeing: baris isian milik akun Pegawai (sw_individu.individu_id, mis. p42).';

create or replace function public.my_sw_unit_id()
returns text language sql stable security definer set search_path = public as $$
  select sw_unit_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_sw_individu_id()
returns text language sql stable security definer set search_path = public as $$
  select sw_individu_id from public.profiles where id = auth.uid()
$$;

-- ── 4. Tabel data ─────────────────────────────────────────────────────────────────────────
create table if not exists public.sw_dataset (
  id text primary key,                          -- SW-<sekolah>-<periode>
  sekolah_id text not null references public.schools(id) on delete cascade,
  periode_id text not null,
  meta jsonb not null,
  asumsi jsonb not null,                        -- asumsi yang berlaku (kategori, ambang, bobot)
  lembaga jsonb not null,                       -- agregat seluruh lembaga, tanpa nama
  tema jsonb,                                   -- tema jawaban terbuka dan kutipan tanpa nama
  ringkasan_pimpinan jsonb not null default '[]'::jsonb,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists sw_dataset_sekolah_idx on public.sw_dataset (sekolah_id, aktif, created_at desc);

create table if not exists public.sw_unit (
  dataset_id text not null references public.sw_dataset(id) on delete cascade,
  unit_id text not null,
  sekolah_id text not null,
  n_pengisi int not null,
  data jsonb not null,
  primary key (dataset_id, unit_id)
);

create table if not exists public.sw_individu (
  dataset_id text not null references public.sw_dataset(id) on delete cascade,
  individu_id text not null,
  sekolah_id text not null,
  unit_id text not null,
  nama text not null,
  data jsonb not null,
  primary key (dataset_id, individu_id)
);
create index if not exists sw_individu_unit_idx on public.sw_individu (dataset_id, unit_id);

create table if not exists public.sw_pimpinan_qc (
  dataset_id text not null references public.sw_dataset(id) on delete cascade,
  unit_id text not null,
  sekolah_id text not null,
  pimpinan text not null,
  data jsonb not null,
  primary key (dataset_id, unit_id, pimpinan)
);

-- ── 5. Tabel yang ditulis dari FIR ────────────────────────────────────────────────────────
create table if not exists public.sw_tinjauan (
  dataset_id text not null references public.sw_dataset(id) on delete cascade,
  individu_id text not null,
  sekolah_id text not null,
  status text not null default 'belum' check (status in ('belum', 'dijadwalkan', 'selesai', 'tidak_lanjut')),
  peninjau text,
  tanggal date,
  catatan text,
  diubah_oleh uuid,
  diubah_pada timestamptz not null default now(),
  primary key (dataset_id, individu_id)
);

-- Log akses dan log asumsi dikeluarkan dari modul (2026-09-17, keputusan pemilik produk:
-- pengguna modul ini yayasan dan Human Capital). Dibuang bila sempat dibuat versi awal berkas ini.
drop function if exists public.sw_catat_akses(text, text);
drop function if exists public.sw_ubah_asumsi(text, jsonb);
drop table if exists public.sw_akses_log;
drop table if exists public.sw_asumsi_log;
alter table public.sw_dataset drop column if exists asumsi_berikutnya;

-- ── 6. Helper RLS ─────────────────────────────────────────────────────────────────────────
-- Sekolah yang boleh dibaca: sekolah akun itu sendiri, atau sekolah di bawah yayasannya.
create or replace function public.sw_sekolah_boleh(p_sekolah text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_sekolah = (select school_id from public.profiles where id = auth.uid())
      or p_sekolah = any (public.my_yayasan_school_ids())
$$;

create or replace function public.sw_min_pengisi(p_dataset text)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (asumsi->>'minPengisiUnit')::int from public.sw_dataset where id = p_dataset), 10)
$$;

-- Unit milik akun pegawai, dibaca tanpa melewati RLS sw_individu.
create or replace function public.sw_unit_pegawai(p_dataset text)
returns text language sql stable security definer set search_path = public as $$
  select unit_id from public.sw_individu
  where dataset_id = p_dataset and individu_id = public.my_sw_individu_id()
$$;

revoke all on function public.my_sw_unit_id(), public.my_sw_individu_id(),
  public.sw_sekolah_boleh(text), public.sw_min_pengisi(text), public.sw_unit_pegawai(text) from public, anon;
grant execute on function public.my_sw_unit_id(), public.my_sw_individu_id(),
  public.sw_sekolah_boleh(text), public.sw_min_pengisi(text), public.sw_unit_pegawai(text) to authenticated;

-- ── 7. RLS ────────────────────────────────────────────────────────────────────────────────
alter table public.sw_dataset enable row level security;
alter table public.sw_unit enable row level security;
alter table public.sw_individu enable row level security;
alter table public.sw_pimpinan_qc enable row level security;
alter table public.sw_tinjauan enable row level security;

-- Fungsi dibungkus (select ...) supaya dievaluasi sekali per query (InitPlan), bukan per baris.
drop policy if exists sw_dataset_baca on public.sw_dataset;
create policy sw_dataset_baca on public.sw_dataset
for select to authenticated
using (
  (select public.my_peran()) in ('Yayasan', 'KepalaUnit', 'HumanCapital', 'Pegawai')
  and public.sw_sekolah_boleh(sekolah_id)
);

drop policy if exists sw_unit_baca on public.sw_unit;
create policy sw_unit_baca on public.sw_unit
for select to authenticated
using (
  public.sw_sekolah_boleh(sekolah_id)
  and (
    (select public.my_peran()) = 'HumanCapital'
    or (
      n_pengisi >= public.sw_min_pengisi(dataset_id)
      and (
        (select public.my_peran()) = 'Yayasan'
        or ((select public.my_peran()) = 'KepalaUnit' and unit_id = (select public.my_sw_unit_id()))
        or ((select public.my_peran()) = 'Pegawai' and unit_id = public.sw_unit_pegawai(dataset_id))
      )
    )
  )
);

drop policy if exists sw_individu_baca on public.sw_individu;
create policy sw_individu_baca on public.sw_individu
for select to authenticated
using (
  sekolah_id = (select public.my_school_id())
  and (
    (select public.my_peran()) = 'HumanCapital'
    or ((select public.my_peran()) = 'Pegawai' and individu_id = (select public.my_sw_individu_id()))
  )
);

drop policy if exists sw_pimpinan_qc_baca on public.sw_pimpinan_qc;
create policy sw_pimpinan_qc_baca on public.sw_pimpinan_qc
for select to authenticated
using ((select public.my_peran()) = 'HumanCapital' and sekolah_id = (select public.my_school_id()));

drop policy if exists sw_tinjauan_baca on public.sw_tinjauan;
create policy sw_tinjauan_baca on public.sw_tinjauan
for select to authenticated
using ((select public.my_peran()) = 'HumanCapital' and sekolah_id = (select public.my_school_id()));

-- Admin Fammi membaca semua (pola sama dengan modul lain). Tidak ada policy tulis sama sekali:
-- data masuk lewat seed (service role), tulisan dari FIR hanya lewat RPC di bawah.
do $$
declare t text;
begin
  foreach t in array array['sw_dataset', 'sw_unit', 'sw_individu', 'sw_pimpinan_qc', 'sw_tinjauan'] loop
    execute format('drop policy if exists %I on public.%I', t || '_admin_baca', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_admin_fammi())', t || '_admin_baca', t);
  end loop;
end $$;

-- ── 8. RPC ────────────────────────────────────────────────────────────────────────────────

create or replace function public.sw_simpan_tinjauan(
  p_dataset text, p_individu text, p_status text, p_peninjau text, p_tanggal date, p_catatan text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sekolah text;
  v_baris public.sw_tinjauan;
begin
  if public.my_peran() <> 'HumanCapital' then
    raise exception 'Catatan tinjauan hanya untuk Human Capital.' using errcode = '42501';
  end if;

  select sekolah_id into v_sekolah from public.sw_individu
  where dataset_id = p_dataset and individu_id = p_individu and sekolah_id = public.my_school_id();
  if v_sekolah is null then
    raise exception 'Profil tidak ditemukan di sekolah Anda.' using errcode = '42501';
  end if;

  insert into public.sw_tinjauan (dataset_id, individu_id, sekolah_id, status, peninjau, tanggal, catatan, diubah_oleh, diubah_pada)
  values (p_dataset, p_individu, v_sekolah, coalesce(p_status, 'belum'), p_peninjau, p_tanggal, p_catatan, auth.uid(), now())
  on conflict (dataset_id, individu_id) do update set
    status = excluded.status,
    peninjau = excluded.peninjau,
    tanggal = excluded.tanggal,
    catatan = excluded.catatan,
    diubah_oleh = excluded.diubah_oleh,
    diubah_pada = excluded.diubah_pada
  returning * into v_baris;

  return to_jsonb(v_baris) - 'diubah_oleh';
end;
$$;

revoke all on function public.sw_simpan_tinjauan(text, text, text, text, date, text) from public, anon;
grant execute on function public.sw_simpan_tinjauan(text, text, text, text, date, text) to authenticated;

grant select on public.sw_dataset, public.sw_unit, public.sw_individu, public.sw_pimpinan_qc,
  public.sw_tinjauan to authenticated;
