-- Modul Perilaku Anak (pa): tabel data, RLS, dan RPC impor satu periode.
--
-- Pola dan penamaan sengaja meniru migration School Culture (20260722100000_sc_tables_and_import.sql)
-- persis, atas instruksi pemilik produk -- termasuk RPC delete-then-insert per (sekolah, periode)
-- alih-alih upsert. Konsekuensinya yang DIINGINKAN: mengunggah ulang file untuk periode yang sama
-- MENGGANTI seluruh isi periode itu, bukan menumpuk. Ini yang membuat alur "upload dua tahap"
-- (tahap 1 data saja, tahap 2 data + narasi yang sudah diisi) aman diulang tanpa data ganda.
--
-- Dua pelajaran dari migration SC sengaja diterapkan SEJAK AWAL di sini, bukan lewat migration
-- perbaikan belakangan seperti yang terjadi di SC:
--   1. Policy "<tabel>_admin_baca using (is_admin_fammi())" langsung ada (di SC baru ditambal di
--      20260730100000 setelah CMS Admin selalu membaca 0 baris tanpa pesan error apa pun).
--   2. FK ke schools memakai "on delete cascade" sejak awal (di SC baru ditambal di 20260724110000
--      setelah re-import gagal kena FK violation).
--
-- Nama siswa DISIMPAN apa adanya di pa_siswa dan pa_esai. Ini keputusan eksplisit pemilik produk:
-- laporan ini untuk Yayasan dan wali kelas yang memang perlu menindaklanjuti anak tertentu, jadi
-- pengecualian yang disengaja dari aturan proxy_code modul Screening. RLS di bawah tetap mengunci
-- barisnya ke sekolah sendiri; kolom kode_anonim di pa_esai tetap dipakai tampilan Ruang Baca Esai
-- supaya kutipan panjang bisa dibaca terbuka tanpa langsung menempelkan nama.

-- ── 1. Tabel agregat lembaga ────────────────────────────────────────────────────────────────
-- Satu baris per (sekolah, periode, unit). unit NULL = agregat seluruh unit ("Semua unit sekolah"
-- di filter tampilan), unit terisi = satu jenjang (SD/SMP/SMA), persis pola sc_lembaga.unit.
create table if not exists public.pa_lembaga (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id) on delete cascade,
  periode_id text not null,
  unit text,
  jumlah_siswa int not null default 0,
  statistik jsonb,   -- total siswa, sebaran jenis kelamin, sebaran per unit
  emosi jsonb,       -- enam tingkat emosi (termasuk "kosong"/tidak menjawab) + persen
  heart jsonb,       -- lima domain x tiga tingkat (Aman/Perlu Perhatian/Perlu Diwaspadai) + persen
  indikator jsonb,   -- lima indikator teratas per domain, masing-masing {nilai, indikator, siswa, persentase}
  survey jsonb,      -- pertanyaan tertutup: opsi jawaban + jumlah + persen
  narasi jsonb,      -- seluruh kolom ISI_ dari sheet NARASI (insight, analisis, interpretasi)
  created_at timestamptz not null default now()
);

create index if not exists pa_lembaga_sekolah_periode_idx
  on public.pa_lembaga (sekolah_id, periode_id);

-- ── 2. Tabel siswa per domain ───────────────────────────────────────────────────────────────
-- Satu baris per (siswa, domain). Seorang siswa yang tinggi di dua domain punya dua baris di
-- sini -- itulah yang membuat metrik "lebih dari satu domain" di bagian 03 bisa dihitung nyata
-- lewat group by nama, bukan ditulis terpisah sebagai angka ringkasan.
create table if not exists public.pa_siswa (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id) on delete cascade,
  periode_id text not null,
  nama text not null,
  kelas text,
  unit text,
  domain text not null,   -- hiperaktivitas | emosional | agresi | relasi | tolong_menolong
  status text not null,   -- Aman | Perlu Perhatian | Perlu Diwaspadai
  skor int,
  created_at timestamptz not null default now()
);

create index if not exists pa_siswa_sekolah_periode_idx
  on public.pa_siswa (sekolah_id, periode_id);
create index if not exists pa_siswa_domain_status_idx
  on public.pa_siswa (sekolah_id, periode_id, domain, status);

-- ── 3. Tabel jawaban esai terbuka ───────────────────────────────────────────────────────────
create table if not exists public.pa_esai (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id) on delete cascade,
  periode_id text not null,
  kode_anonim text not null,
  nama text,
  kelas text,
  unit text,
  domain text not null,
  pertanyaan_kode text not null,
  jawaban_pilihan text,
  jawaban_teks text,
  anotasi jsonb,   -- {tema: [], sinyal, saran, prioritas} dari sheet NARASI RuangBaca Anotasi
  created_at timestamptz not null default now()
);

create index if not exists pa_esai_sekolah_periode_idx
  on public.pa_esai (sekolah_id, periode_id);

-- ── 4. RLS ──────────────────────────────────────────────────────────────────────────────────
-- Pola sama dengan sc_personal/sc_lembaga: baca dikunci ke sekolah sendiri + daftar peran, tulis
-- TIDAK punya policy sama sekali (hanya lewat service_role / RPC security definer di bawah).
alter table public.pa_lembaga enable row level security;
alter table public.pa_siswa   enable row level security;
alter table public.pa_esai    enable row level security;

drop policy if exists pa_lembaga_baca on public.pa_lembaga;
create policy pa_lembaga_baca on public.pa_lembaga
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
);

drop policy if exists pa_siswa_baca on public.pa_siswa;
create policy pa_siswa_baca on public.pa_siswa
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
);

drop policy if exists pa_esai_baca on public.pa_esai;
create policy pa_esai_baca on public.pa_esai
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
);

-- Admin Fammi TIDAK pernah match my_school_id() (dia tidak terikat satu sekolah), jadi tanpa tiga
-- policy ini CMS Admin selalu membaca 0 baris DIAM-DIAM -- tanpa error, seolah datanya belum
-- diimpor. Ini bug nyata yang sempat terjadi di modul SC, lihat 20260730100000_sc_admin_read_rls.
drop policy if exists pa_lembaga_admin_baca on public.pa_lembaga;
create policy pa_lembaga_admin_baca on public.pa_lembaga
for select to authenticated using (is_admin_fammi());

drop policy if exists pa_siswa_admin_baca on public.pa_siswa;
create policy pa_siswa_admin_baca on public.pa_siswa
for select to authenticated using (is_admin_fammi());

drop policy if exists pa_esai_admin_baca on public.pa_esai;
create policy pa_esai_admin_baca on public.pa_esai
for select to authenticated using (is_admin_fammi());

-- ── 5. RPC impor satu periode ───────────────────────────────────────────────────────────────
create or replace function public.import_pa_periode(
  p_sekolah_id text,
  p_periode_id text,
  p_lembaga jsonb,
  p_siswa jsonb,
  p_esai jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lembaga_count int := 0;
  v_siswa_count int := 0;
  v_esai_count int := 0;
begin
  -- Gerbang sama dengan import_sc_periode: cuma service_role (Edge Function) atau AdminFammi.
  if auth.role() <> 'service_role' and not is_admin_fammi() then
    raise exception 'Hanya Admin Fammi yang boleh mengimpor data Perilaku Anak.'
      using errcode = '42501';
  end if;

  if p_sekolah_id is null or p_periode_id is null then
    raise exception 'p_sekolah_id dan p_periode_id wajib diisi.';
  end if;

  -- Delete-then-insert: unggah ulang periode yang sama MENGGANTI isinya, tidak menumpuk.
  delete from public.pa_lembaga where sekolah_id = p_sekolah_id and periode_id = p_periode_id;
  delete from public.pa_siswa   where sekolah_id = p_sekolah_id and periode_id = p_periode_id;
  delete from public.pa_esai    where sekolah_id = p_sekolah_id and periode_id = p_periode_id;

  insert into public.pa_lembaga (
    sekolah_id, periode_id, unit, jumlah_siswa,
    statistik, emosi, heart, indikator, survey, narasi
  )
  select
    x.sekolah_id, x.periode_id, x.unit, coalesce(x.jumlah_siswa, 0),
    x.statistik, x.emosi, x.heart, x.indikator, x.survey, x.narasi
  from jsonb_to_recordset(coalesce(p_lembaga, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, unit text, jumlah_siswa int,
    statistik jsonb, emosi jsonb, heart jsonb, indikator jsonb, survey jsonb, narasi jsonb
  );
  get diagnostics v_lembaga_count = row_count;

  insert into public.pa_siswa (
    sekolah_id, periode_id, nama, kelas, unit, domain, status, skor
  )
  select
    x.sekolah_id, x.periode_id, x.nama, x.kelas, x.unit, x.domain, x.status, x.skor
  from jsonb_to_recordset(coalesce(p_siswa, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, nama text, kelas text, unit text,
    domain text, status text, skor int
  );
  get diagnostics v_siswa_count = row_count;

  insert into public.pa_esai (
    sekolah_id, periode_id, kode_anonim, nama, kelas, unit,
    domain, pertanyaan_kode, jawaban_pilihan, jawaban_teks, anotasi
  )
  select
    x.sekolah_id, x.periode_id, x.kode_anonim, x.nama, x.kelas, x.unit,
    x.domain, x.pertanyaan_kode, x.jawaban_pilihan, x.jawaban_teks, x.anotasi
  from jsonb_to_recordset(coalesce(p_esai, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, kode_anonim text, nama text, kelas text, unit text,
    domain text, pertanyaan_kode text, jawaban_pilihan text, jawaban_teks text, anotasi jsonb
  );
  get diagnostics v_esai_count = row_count;

  return jsonb_build_object(
    'ok', true,
    'periode_id', p_periode_id,
    'lembaga', v_lembaga_count,
    'siswa', v_siswa_count,
    'esai', v_esai_count
  );
end $$;

grant execute on function public.import_pa_periode(text, text, jsonb, jsonb, jsonb) to authenticated;

-- ── 6. Izinkan nilai 'pa' di school_modules.modul ───────────────────────────────────────────
-- WAJIB, dan ini yang bikin toggle "Perilaku Anak" di CMS gagal sebelum migration ini jalan:
-- school_modules_modul_check masih berisi ('karakter','mi','screening','cw','sc') saja, sehingga
-- upsert dari handleToggleModule ditolak Postgres. Pola dinamis (union dengan nilai yang sudah
-- ada di tabel) sama seperti saat 'cw' dan 'sc' ditambahkan, supaya baris produksi yang mungkin
-- punya nilai lain tidak ikut tertolak.
do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa']) as v
    union
    select distinct modul from public.school_modules where modul is not null
  ) s;

  execute 'alter table public.school_modules drop constraint if exists school_modules_modul_check';
  execute format(
    'alter table public.school_modules add constraint school_modules_modul_check check (modul in (%s))',
    daftar
  );
end $$;
