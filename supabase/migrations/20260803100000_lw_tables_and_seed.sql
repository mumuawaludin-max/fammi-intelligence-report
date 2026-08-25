-- Modul Wellbeing Guru (kode modul: lw) -- laporan kesehatan mental pendidik memakai
-- kerangka PROTEK: Penerimaan Diri, Relasi Positif, Optimalisasi Potensi Diri, Tujuan Hidup,
-- Eksplorasi Lingkungan, Kemandirian. Enam dimensi, tiap dimensi 7 butir, skor total 1-252.
--
-- Modul ini SENGAJA hanya memuat wellbeing. Bagian kesiapan memimpin (LEAD) yang sempat ada di
-- rancangan awal sudah dikeluarkan atas instruksi eksplisit pemilik produk (2026-08-26), jadi
-- tidak ada kolom lead_* di sini. Kalau nanti dihidupkan lagi, tambahkan lewat migration baru.
--
-- SEED: data CONTOH (dummy) "Yayasan Pendidikan Fammi" -- 20 guru di 4 jenjang (TK/SD/SMP/SMA),
-- tiga periode asesmen (Januari, April, Juli 2025) supaya perkembangan wellbeing terlihat,
-- bukan sekadar satu potret. Angkanya BUKAN hasil asesmen sungguhan. Seluruh baris di bagian 7
-- dan 8 dihasilkan generator supaya agregat, kategori, dan totalnya konsisten satu sama lain;
-- angka yang sama dipakai di web/src/pages/lw/lw.mock.js.

-- ── 0. Buang tabel versi lama kalau ada ────────────────────────────────────────────────────
-- Versi pertama berkas ini (rancangan LEAD + wellbeing, satu periode) sempat dijalankan di
-- beberapa project. Bentuk tabelnya berbeda total dari versi sekarang: lw_lembaga tidak punya
-- kolom jumlah_guru/indeks/narasi, dan lw_personal masih mewajibkan kolom LEAD
-- (kesiapan_memimpin_skor dan kawan-kawan) yang sudah tidak ada lagi di modul ini. Karena
-- "create table if not exists" akan melewati tabel lama itu begitu saja dan membuat INSERT di
-- bawah gagal, tabelnya dibuang lebih dulu.
--
-- Aman dilakukan: kedua tabel ini HANYA pernah menampung data contoh modul wellbeing
-- (TKN-PEMBINA-BANDUNG lalu YP-FAMMI), tidak ada data lembaga sungguhan di dalamnya, dan
-- seluruh isinya memang ditulis ulang oleh migration ini.
drop table if exists public.lw_personal cascade;
drop table if exists public.lw_lembaga cascade;

-- ── 1. Tabel agregat lembaga ────────────────────────────────────────────────────────────────
-- Satu baris per (sekolah, periode, unit). unit NULL = agregat seluruh yayasan, unit terisi =
-- satu jenjang. Pola sama dengan sc_lembaga/pa_lembaga.
create table if not exists public.lw_lembaga (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id) on delete cascade,
  periode_id text not null,
  unit text,
  jumlah_guru int not null default 0,
  indeks numeric,                  -- indeks wellbeing 0-100 (rata-rata skor total / 252)
  protek_distribusi jsonb,         -- [{kategori, jumlah, persen}] sebaran kategori skor total
  protek_dimensi jsonb,            -- [{kode, nilai, baik_*, perlu_perhatian_*, waspada_*}] x6
  protek_temuan_spesifik jsonb,    -- [{dimensi, pernyataan, persen, jumlah}]
  narasi jsonb,                    -- [{judul, isi}] analisis ahli untuk periode itu
  created_at timestamptz not null default now()
);

create index if not exists lw_lembaga_sekolah_periode_idx
  on public.lw_lembaga (sekolah_id, periode_id);
create unique index if not exists lw_lembaga_unik_idx
  on public.lw_lembaga (sekolah_id, periode_id, coalesce(unit, ''));

-- ── 2. Tabel per guru per periode ───────────────────────────────────────────────────────────
-- Satu baris per (guru, periode). Riwayat antarperiode itulah yang membuat grafik perkembangan
-- dan panah arah di daftar prioritas bisa ditampilkan.
create table if not exists public.lw_personal (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id) on delete cascade,
  periode_id text not null,
  unit text not null,
  nama text not null,
  is_kepsek_saat_ini boolean not null default false,
  skor_total int not null,
  kategori_total text not null,    -- Baik | Perlu Perhatian | Waspada | Perlu Konsultasi
  protek_dimensi jsonb,            -- [{kode, nilai, kategori}] x6
  catatan text,                    -- catatan pendampingan dari psikolog, boleh kosong
  langkah jsonb,                   -- [teks] langkah yang disarankan, boleh kosong
  refleksi jsonb,                  -- [{tema, isi}] jawaban terbuka guru, boleh kosong
  created_at timestamptz not null default now()
);

create index if not exists lw_personal_sekolah_periode_idx
  on public.lw_personal (sekolah_id, periode_id);
create index if not exists lw_personal_nama_idx
  on public.lw_personal (sekolah_id, nama);

-- ── 3. RLS ──────────────────────────────────────────────────────────────────────────────────
-- Nama guru dan kondisi kesehatan mentalnya termasuk data paling sensitif di FIR, jadi baca
-- dikunci ke sekolah sendiri DAN ke peran pimpinan saja. Tulis tidak punya policy sama sekali
-- (hanya lewat service_role). Policy admin baca disertakan sejak awal, pelajaran dari SC yang
-- baru menambalnya belakangan (lihat 20260730100000_sc_admin_read_rls.sql).
alter table public.lw_lembaga enable row level security;
alter table public.lw_personal enable row level security;

drop policy if exists lw_lembaga_baca on public.lw_lembaga;
create policy lw_lembaga_baca on public.lw_lembaga
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
);

drop policy if exists lw_personal_baca on public.lw_personal;
create policy lw_personal_baca on public.lw_personal
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
);

drop policy if exists lw_lembaga_admin_baca on public.lw_lembaga;
create policy lw_lembaga_admin_baca on public.lw_lembaga
for select to authenticated using (is_admin_fammi());

drop policy if exists lw_personal_admin_baca on public.lw_personal;
create policy lw_personal_admin_baca on public.lw_personal
for select to authenticated using (is_admin_fammi());

-- ── 4. Izinkan nilai 'lw' di school_modules.modul ──────────────────────────────────────────
do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw']) as v
    union
    select distinct modul from public.school_modules where modul is not null
  ) s;

  execute 'alter table public.school_modules drop constraint if exists school_modules_modul_check';
  execute format(
    'alter table public.school_modules add constraint school_modules_modul_check check (modul in (%s))',
    daftar
  );
end $$;

-- ── 5. Izinkan modul 'lw' + fokus 'protek' di tindak_lanjut dan briefing ───────────────────
-- Pola sama dengan 20260722110000_sc_tindak_lanjut_support.sql: constraint ini dibuat langsung
-- di Supabase (bukan lewat migration terlacak), jadi dibangun ulang secara DINAMIS kalau memang
-- ada, dan no-op dengan aman kalau namanya ternyata berbeda.
do $$
declare
  daftar text;
  con_exists boolean;
begin
  select exists (
    select 1 from pg_constraint c join pg_class t on t.oid = c.conrelid
    where t.relname = 'tindak_lanjut' and c.conname = 'tindak_lanjut_modul_check'
  ) into con_exists;
  if con_exists then
    select string_agg(quote_literal(v), ', ' order by v) into daftar
    from (
      select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw']) as v
      union select distinct modul from public.tindak_lanjut where modul is not null
    ) s;
    execute 'alter table public.tindak_lanjut drop constraint tindak_lanjut_modul_check';
    execute format('alter table public.tindak_lanjut add constraint tindak_lanjut_modul_check check (modul in (%s))', daftar);
  end if;
end $$;

do $$
declare
  daftar text;
  con_exists boolean;
begin
  select exists (
    select 1 from pg_constraint c join pg_class t on t.oid = c.conrelid
    where t.relname = 'briefing' and c.conname = 'briefing_modul_check'
  ) into con_exists;
  if con_exists then
    select string_agg(quote_literal(v), ', ' order by v) into daftar
    from (
      select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw']) as v
      union select distinct modul from public.briefing where modul is not null
    ) s;
    execute 'alter table public.briefing drop constraint briefing_modul_check';
    execute format('alter table public.briefing add constraint briefing_modul_check check (modul in (%s))', daftar);
  end if;
end $$;

do $$
declare
  daftar text;
  con_exists boolean;
begin
  select exists (
    select 1 from pg_constraint c join pg_class t on t.oid = c.conrelid
    where t.relname = 'tindak_lanjut' and c.conname = 'tindak_lanjut_fokus_check'
  ) into con_exists;
  if con_exists then
    select string_agg(quote_literal(v), ', ' order by v) into daftar
    from (
      select unnest(array['mutu', 'citra', 'budaya', 'kesejahteraan', 'protek']) as v
      union select distinct fokus from public.tindak_lanjut where fokus is not null
    ) s;
    execute 'alter table public.tindak_lanjut drop constraint tindak_lanjut_fokus_check';
    execute format('alter table public.tindak_lanjut add constraint tindak_lanjut_fokus_check check (fokus in (%s))', daftar);
  end if;
end $$;

-- ── 6. Sekolah + entitlement ────────────────────────────────────────────────────────────────
-- Yayasan Pendidikan Fammi: empat jenjang dalam SATU baris schools, pola sama dengan Sekolah
-- Islam Athirah (satu login mencakup beberapa unit sekaligus, lihat 20260801140000).
insert into public.schools (id, nama, jenjang)
values ('YP-FAMMI', 'Yayasan Pendidikan Fammi', 'Semua Jenjang')
on conflict (id) do nothing;

insert into public.school_modules (school_id, modul, aktif)
values ('YP-FAMMI', 'lw', true)
on conflict (school_id, modul) do update set aktif = true;

-- Bersih-bersih supaya migration ini aman dijalankan ulang, sekaligus membuang sisa seed
-- percobaan sebelumnya (TKN-PEMBINA-BANDUNG) kalau versi awal berkas ini sempat dijalankan.
-- Isi lw_lembaga dan lw_personal tidak perlu dihapus di sini: kedua tabelnya sudah dibuang dan
-- dibuat ulang di bagian 0.
delete from public.tindak_lanjut where modul = 'lw' and sekolah_id in ('TKN-PEMBINA-BANDUNG', 'YP-FAMMI');
delete from public.briefing where modul = 'lw' and sekolah_id in ('TKN-PEMBINA-BANDUNG', 'YP-FAMMI');
delete from public.school_modules where school_id = 'TKN-PEMBINA-BANDUNG' and modul = 'lw';

-- ── 7. Agregat lembaga: 3 periode x (1 yayasan + 4 jenjang) = 15 baris ─────────────────────
insert into public.lw_lembaga (
  sekolah_id, periode_id, unit, jumlah_guru, indeks,
  protek_distribusi, protek_dimensi, protek_temuan_spesifik, narasi
) values
(
  'YP-FAMMI', '2025-01', null, 20, 78.6,
  '[{"kategori":"Baik","jumlah":20,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":31.85,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":34.75,"baik_jumlah":20,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":33.05,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":32,"baik_jumlah":18,"baik_persen":90,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":10,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":32.4,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":34,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-01', 'TK Fammi', 5, 84.2,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":34.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":36.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":35,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":34.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":35,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":37,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-01', 'SD Fammi', 5, 79.6,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":32.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":35.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":33.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":32.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":34,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-01', 'SMP Fammi', 5, 73.6,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":29.2,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":33.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":31,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":29.2,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":31,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":31.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-01', 'SMA Fammi', 5, 77,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":31.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":33.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":32.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":31.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":31,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":33.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-04', null, 20, 79.8,
  '[{"kategori":"Baik","jumlah":20,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":33.05,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":35.55,"baik_jumlah":20,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":34,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33.4,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":32.35,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":32.7,"baik_jumlah":18,"baik_persen":90,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":1,"waspada_persen":5}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-04', 'TK Fammi', 5, 85.2,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":35.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":37.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":36,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":35.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":35,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":35.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-04', 'SD Fammi', 5, 80.6,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":33.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":35.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":34.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":34.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":32.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":32.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-04', 'SMP Fammi', 5, 73.8,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":30,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":33.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":31.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":30.4,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":30.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":29.8,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":1,"waspada_persen":20}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-04', 'SMA Fammi', 5, 79.4,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":33.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":35.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":34.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":31.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":32.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-07', null, 20, 80.7,
  '[{"kategori":"Baik","jumlah":19,"persen":95},{"kategori":"Perlu Perhatian","jumlah":1,"persen":5},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":33.9,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":10,"waspada_jumlah":1,"waspada_persen":5},{"kode":"R","nilai":36.95,"baik_jumlah":20,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":35.2,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33.3,"baik_jumlah":18,"baik_persen":90,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":1,"waspada_persen":5},{"kode":"E","nilai":33.4,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":30.55,"baik_jumlah":14,"baik_persen":70,"perlu_perhatian_jumlah":5,"perlu_perhatian_persen":25,"waspada_jumlah":1,"waspada_persen":5}]'::jsonb,
  '[{"dimensi":"Kemandirian","pernyataan":"Keputusan sering menunggu arahan pimpinan sebelum berani diambil.","persen":30,"jumlah":6},{"dimensi":"Kemandirian","pernyataan":"Khawatir terhadap penilaian rekan kerja saat menyampaikan pendapat berbeda.","persen":25,"jumlah":5},{"dimensi":"Eksplorasi Lingkungan","pernyataan":"Sering merasa terbebani tanggung jawab administrasi di luar mengajar.","persen":25,"jumlah":5},{"dimensi":"Eksplorasi Lingkungan","pernyataan":"Kesulitan mengatur hidup agar memuaskan diri sendiri.","persen":10,"jumlah":2},{"dimensi":"Penerimaan Diri","pernyataan":"Merasa kurang puas dengan pencapaian diri selama menjadi pendidik.","persen":20,"jumlah":4},{"dimensi":"Penerimaan Diri","pernyataan":"Tidak nyaman saat membandingkan diri dengan rekan sejawat.","persen":15,"jumlah":3},{"dimensi":"Tujuan Hidup","pernyataan":"Merasa rutinitas mengajar berjalan tanpa arah pengembangan yang jelas.","persen":15,"jumlah":3},{"dimensi":"Optimalisasi Potensi","pernyataan":"Merasa tidak berkembang meski sudah lama mengajar.","persen":10,"jumlah":2}]'::jsonb,
  '[{"judul":"Kemandirian bergerak berlawanan arah","isi":"Lima dimensi naik, satu turun, dan turunnya terjadi di kedua jeda antarperiode. Jumlah guru dengan Kemandirian di bawah Baik bertambah dari 1 orang di Januari menjadi 6 orang sekarang. Pola jawabannya seragam: keputusan ditahan sampai ada arahan pimpinan."},{"judul":"Tekanan menumpuk di satu jenjang","isi":"SMP menyumbang separuh kasus di bawah Baik meski jumlah gurunya sama dengan jenjang lain. Beban administrasi di luar mengajar disebut paling sering di sana."},{"judul":"SMA membuktikan intervensi berhasil","isi":"Naik 4,7 poin sejak Januari, kenaikan tertinggi di antara empat jenjang. Pendampingan mentor guru baru yang dijalankan di sana layak ditiru jenjang lain."}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 5, 86.1,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":36.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":38.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":37,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":35.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":36,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":33.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 5, 81.5,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":34.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":37.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":35.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":34.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":33.4,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":30.4,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 5, 73.4,
  '[{"kategori":"Baik","jumlah":4,"persen":80},{"kategori":"Perlu Perhatian","jumlah":1,"persen":20},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":30.2,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":1,"waspada_persen":20},{"kode":"R","nilai":34.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":32.4,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":29.6,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":1,"waspada_persen":20},{"kode":"E","nilai":31,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":27,"baik_jumlah":2,"baik_persen":40,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":1,"waspada_persen":20}]'::jsonb,
  null,
  null
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 5, 81.7,
  '[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}]'::jsonb,
  '[{"kode":"P","nilai":34.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":37,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":35.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":33.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":31.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0}]'::jsonb,
  null,
  null
);

-- ── 8. Data per guru: 20 guru x 3 periode = 60 baris ──────────────────────────────────────
insert into public.lw_personal (
  sekolah_id, periode_id, unit, nama, is_kepsek_saat_ini, skor_total, kategori_total,
  protek_dimensi
) values
(
  'YP-FAMMI', '2025-01', 'TK Fammi', 'Rina Kartika, S.Pd', true, 228, 'Baik',
  '[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":38,"kategori":"Baik"},{"kode":"T","nilai":37,"kategori":"Baik"},{"kode":"E","nilai":38,"kategori":"Baik"},{"kode":"K","nilai":39,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'TK Fammi', 'Rina Kartika, S.Pd', true, 231, 'Baik',
  '[{"kode":"P","nilai":38,"kategori":"Baik"},{"kode":"R","nilai":40,"kategori":"Baik"},{"kode":"O","nilai":39,"kategori":"Baik"},{"kode":"T","nilai":38,"kategori":"Baik"},{"kode":"E","nilai":38,"kategori":"Baik"},{"kode":"K","nilai":38,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Rina Kartika, S.Pd', true, 233, 'Baik',
  '[{"kode":"P","nilai":39,"kategori":"Baik"},{"kode":"R","nilai":41,"kategori":"Baik"},{"kode":"O","nilai":40,"kategori":"Baik"},{"kode":"T","nilai":38,"kategori":"Baik"},{"kode":"E","nilai":39,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'TK Fammi', 'Lina Marlina, S.Pd.AUD', false, 215, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":37,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'TK Fammi', 'Lina Marlina, S.Pd.AUD', false, 218, 'Baik',
  '[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Lina Marlina, S.Pd.AUD', false, 221, 'Baik',
  '[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":38,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'TK Fammi', 'Dewi Lestari, S.Pd', false, 212, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":38,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'TK Fammi', 'Dewi Lestari, S.Pd', false, 214, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Dewi Lestari, S.Pd', false, 216, 'Baik',
  '[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'TK Fammi', 'Yuni Astuti, S.Pd.AUD', false, 206, 'Baik',
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'TK Fammi', 'Yuni Astuti, S.Pd.AUD', false, 209, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Yuni Astuti, S.Pd.AUD', false, 211, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'TK Fammi', 'Ratna Sari, S.Pd', false, 200, 'Baik',
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'TK Fammi', 'Ratna Sari, S.Pd', false, 202, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Ratna Sari, S.Pd', false, 204, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":31,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SD Fammi', 'Ahmad Fauzi, M.Pd', true, 218, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":38,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SD Fammi', 'Ahmad Fauzi, M.Pd', true, 223, 'Baik',
  '[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":37,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":37,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Ahmad Fauzi, M.Pd', true, 227, 'Baik',
  '[{"kode":"P","nilai":38,"kategori":"Baik"},{"kode":"R","nilai":40,"kategori":"Baik"},{"kode":"O","nilai":39,"kategori":"Baik"},{"kode":"T","nilai":37,"kategori":"Baik"},{"kode":"E","nilai":38,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SD Fammi', 'Siti Nurhaliza, S.Pd', false, 206, 'Baik',
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SD Fammi', 'Siti Nurhaliza, S.Pd', false, 211, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Siti Nurhaliza, S.Pd', false, 216, 'Baik',
  '[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SD Fammi', 'Rahmat Hidayat, S.Pd', false, 200, 'Baik',
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SD Fammi', 'Rahmat Hidayat, S.Pd', false, 205, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Rahmat Hidayat, S.Pd', false, 210, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SD Fammi', 'Budi Santoso, S.Pd', false, 196, 'Baik',
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":30,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SD Fammi', 'Budi Santoso, S.Pd', false, 197, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":29,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Budi Santoso, S.Pd', false, 197, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":26,"kategori":"Perlu Perhatian"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SD Fammi', 'Dewi Anggraini, S.Pd', false, 183, 'Baik',
  '[{"kode":"P","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":30,"kategori":"Baik"},{"kode":"E","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":31,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SD Fammi', 'Dewi Anggraini, S.Pd', false, 180, 'Baik',
  '[{"kode":"P","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":29,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Dewi Anggraini, S.Pd', false, 177, 'Baik',
  '[{"kode":"P","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":30,"kategori":"Baik"},{"kode":"E","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":26,"kategori":"Perlu Perhatian"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMP Fammi', 'Hendra Gunawan, M.Pd', true, 208, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMP Fammi', 'Hendra Gunawan, M.Pd', true, 212, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Hendra Gunawan, M.Pd', true, 216, 'Baik',
  '[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMP Fammi', 'Maya Puspita, M.Pd', false, 196, 'Baik',
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMP Fammi', 'Maya Puspita, M.Pd', false, 200, 'Baik',
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Maya Puspita, M.Pd', false, 204, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":31,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMP Fammi', 'Citra Ayu, S.Pd', false, 190, 'Baik',
  '[{"kode":"P","nilai":31,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMP Fammi', 'Citra Ayu, S.Pd', false, 191, 'Baik',
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":29,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":31,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Citra Ayu, S.Pd', false, 188, 'Baik',
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":28,"kategori":"Perlu Perhatian"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMP Fammi', 'Andi Prasetyo, S.Pd', false, 181, 'Baik',
  '[{"kode":"P","nilai":26,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":31,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":30,"kategori":"Baik"},{"kode":"K","nilai":30,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMP Fammi', 'Andi Prasetyo, S.Pd', false, 182, 'Baik',
  '[{"kode":"P","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":30,"kategori":"Baik"},{"kode":"K","nilai":28,"kategori":"Perlu Perhatian"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Andi Prasetyo, S.Pd', false, 179, 'Baik',
  '[{"kode":"P","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":30,"kategori":"Baik"},{"kode":"K","nilai":25,"kategori":"Perlu Perhatian"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMP Fammi', 'Sari Wulandari, S.Pd', false, 152, 'Baik',
  '[{"kode":"P","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":30,"kategori":"Baik"},{"kode":"O","nilai":26,"kategori":"Perlu Perhatian"},{"kode":"T","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":25,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":25,"kategori":"Perlu Perhatian"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMP Fammi', 'Sari Wulandari, S.Pd', false, 145, 'Baik',
  '[{"kode":"P","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":29,"kategori":"Baik"},{"kode":"O","nilai":25,"kategori":"Perlu Perhatian"},{"kode":"T","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":22,"kategori":"Waspada"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Sari Wulandari, S.Pd', false, 138, 'Perlu Perhatian',
  '[{"kode":"P","nilai":22,"kategori":"Waspada"},{"kode":"R","nilai":29,"kategori":"Baik"},{"kode":"O","nilai":25,"kategori":"Perlu Perhatian"},{"kode":"T","nilai":21,"kategori":"Waspada"},{"kode":"E","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":18,"kategori":"Waspada"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMA Fammi', 'Bambang Wijaya, M.Pd', true, 205, 'Baik',
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMA Fammi', 'Bambang Wijaya, M.Pd', true, 213, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Bambang Wijaya, M.Pd', true, 221, 'Baik',
  '[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":38,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMA Fammi', 'Indah Permatasari, S.Pd', false, 197, 'Baik',
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMA Fammi', 'Indah Permatasari, S.Pd', false, 206, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Indah Permatasari, S.Pd', false, 214, 'Baik',
  '[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMA Fammi', 'Agus Setiawan, M.Pd', false, 191, 'Baik',
  '[{"kode":"P","nilai":31,"kategori":"Baik"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":31,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMA Fammi', 'Agus Setiawan, M.Pd', false, 200, 'Baik',
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Agus Setiawan, M.Pd', false, 208, 'Baik',
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMA Fammi', 'Nur Aini, S.Pd', false, 186, 'Baik',
  '[{"kode":"P","nilai":30,"kategori":"Baik"},{"kode":"R","nilai":32,"kategori":"Baik"},{"kode":"O","nilai":31,"kategori":"Baik"},{"kode":"T","nilai":30,"kategori":"Baik"},{"kode":"E","nilai":30,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMA Fammi', 'Nur Aini, S.Pd', false, 194, 'Baik',
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":31,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Nur Aini, S.Pd', false, 202, 'Baik',
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":31,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-01', 'SMA Fammi', 'Fajar Ramadhan, S.Pd', false, 191, 'Baik',
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":31,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-04', 'SMA Fammi', 'Fajar Ramadhan, S.Pd', false, 188, 'Baik',
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":29,"kategori":"Baik"}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Fajar Ramadhan, S.Pd', false, 184, 'Baik',
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":26,"kategori":"Perlu Perhatian"}]'::jsonb
);

-- ── 9. Catatan pendampingan, langkah, dan refleksi (periode terakhir) ──────────────────────
-- Ditulis psikolog Fammi, hanya untuk periode berjalan. Guru yang seluruh dimensinya Baik
-- tetap mendapat catatan singkat supaya pimpinan punya bahan percakapan penguatan.
update public.lw_personal as p
set catatan = v.catatan, langkah = v.langkah::jsonb, refleksi = v.refleksi::jsonb
from (values
  ('Sari Wulandari, S.Pd',
   'Satu-satunya guru dengan skor total di bawah ambang Baik, dan turun di setiap periode. Lima dari enam dimensi berada di bawah Baik, tiga di antaranya masuk Waspada: Penerimaan Diri, Tujuan Hidup, dan Kemandirian. Beban rangkap mengajar dan administrasi kurikulum muncul konsisten di jawaban terbukanya. Ini kasus yang perlu percakapan pribadi dalam dua pekan ini, bukan program kelompok.',
   '["Kepala sekolah menjadwalkan percakapan pribadi dalam dua pekan ini, fokus mendengarkan beban kerja, bukan mengevaluasi kinerja.","Tinjau ulang rangkap tugas administrasi kurikulum: pilih minimal satu tanggung jawab untuk dialihkan atau digilir.","Tawarkan sesi konsultasi dengan psikolog Fammi, dengan penekanan bahwa ini hak dukungan, bukan sanksi."]',
   '[{"tema":"Mengelola beban","isi":"Mengajar sambil merangkap tugas administrasi kurikulum. Saya sedang belajar memilah mana yang sebenarnya bisa didelegasikan, tapi belum menemukan waktu untuk membicarakannya."},{"tema":"Harapan pada sekolah","isi":"Ingin ada kejelasan pembagian tugas di awal semester supaya tidak menumpuk di tengah jalan."}]'),
  ('Dewi Anggraini, S.Pd',
   'Skor total masih Baik, tetapi turun perlahan tiga periode berturut-turut. Tiga dimensi berada di bawah Baik: Penerimaan Diri, Eksplorasi Lingkungan, dan Kemandirian. Polanya mirip rekan-rekan di SD, jadi bisa ditangani lewat program kelompok sambil tetap dipantau perorangan.',
   '["Ikutkan pada program pendampingan kemandirian yang sedang disiapkan yayasan.","Wali kelas paralel diminta berbagi cara menangani kelas besar, agar beban terasa lebih ringan.","Pantau ulang pada asesmen berikutnya; bila masih turun, naikkan ke kelompok dukungan segera."]',
   '[{"tema":"Mengelola kelas","isi":"Menangani kelas besar dengan rotasi kelompok belajar supaya tiap anak tetap mendapat perhatian, walaupun persiapannya memakan waktu di luar jam sekolah."},{"tema":"Harapan pada sekolah","isi":"Semoga ada tambahan pendamping untuk kelas dengan jumlah murid paling banyak."}]'),
  ('Fajar Ramadhan, S.Pd',
   'Satu-satunya guru SMA yang skornya menurun, sementara jenjangnya justru naik paling tinggi. Dua dimensi di bawah Baik, keduanya berkaitan dengan penataan beban: Eksplorasi Lingkungan dan Kemandirian. Rangkap peran wali kelas dan pembina ekskul patut ditinjau.',
   '["Tinjau rangkap peran wali kelas dan pembina ekskul untuk semester berikutnya.","Libatkan dalam observasi kelas dua arah yang sudah berjalan di SMA sebagai penerima pendampingan.","Beri satu keputusan pembinaan ekskul yang sepenuhnya jadi wewenangnya, untuk melatih kemandirian."]',
   '[{"tema":"Menyeimbangkan peran","isi":"Menyeimbangkan tugas wali kelas dan pembina ekskul. Sedang menata ulang prioritas supaya keduanya tidak saling mengorbankan."},{"tema":"Harapan pada sekolah","isi":"Butuh kejelasan sampai mana keputusan ekskul boleh saya ambil sendiri."}]'),
  ('Citra Ayu, S.Pd',
   'Kondisi keseluruhan Baik dan relatif datar. Dua dimensi tepat di bawah ambang Baik: Tujuan Hidup dan Kemandirian, keduanya di angka 28. Karena selisihnya tipis, percakapan pengembangan karier biasanya cukup untuk mengangkatnya kembali.',
   '["Jadwalkan percakapan pengembangan karier: ke mana arah lima tahun ke depan di yayasan.","Beri peran memimpin satu kegiatan lintas kelas untuk menumbuhkan rasa kepemilikan.","Pantau pada asesmen berikutnya tanpa intervensi khusus lain."]',
   '[{"tema":"Kolaborasi dengan orang tua","isi":"Membuat grup diskusi orang tua per angkatan untuk menyalurkan aspirasi sebelum berubah jadi keluhan."},{"tema":"Harapan pada sekolah","isi":"Ingin tahu jalur pengembangan karier guru di yayasan ini seperti apa."}]'),
  ('Andi Prasetyo, S.Pd',
   'Skor total Baik dan stabil. Dua dimensi di bawah Baik: Penerimaan Diri dan Kemandirian, dengan Kemandirian yang paling rendah. Sama seperti mayoritas kasus Kemandirian di yayasan, akarnya ada pada kebiasaan menunggu arahan, bukan pada kemampuan.',
   '["Sertakan pada program pendampingan kemandirian bersama lima rekan lain.","Beri kewenangan penuh atas satu proyek pembelajaran berbasis lingkungan sekolah yang sudah ia rintis.","Kepala sekolah memberi umpan balik positif secara spesifik, bukan umum, untuk menguatkan penerimaan diri."]',
   '[{"tema":"Inovasi pembelajaran","isi":"Memakai proyek sederhana berbasis lingkungan sekolah supaya siswa belajar IPA dari hal nyata."},{"tema":"Harapan pada sekolah","isi":"Ingin lebih yakin bahwa keputusan yang saya ambil di kelas tidak akan dipertanyakan belakangan."}]'),
  ('Budi Santoso, S.Pd',
   'Skor total Baik dan hampir tidak bergerak tiga periode. Satu dimensi di bawah Baik, yaitu Kemandirian. Karena hanya satu dimensi dan selisihnya tidak jauh, program kelompok sudah memadai.',
   '["Sertakan pada program pendampingan kemandirian bersama rekan lain.","Beri tanggung jawab penuh atas bank soal digital yang sudah ia rintis, termasuk keputusan teknisnya."]',
   '[{"tema":"Inovasi pembelajaran","isi":"Membuat bank soal digital sederhana yang bisa dipakai bergantian oleh semua guru kelas atas."}]'),
  ('Rina Kartika, S.Pd',
   'Skor tertinggi di yayasan dan naik konsisten tiga periode. Seluruh dimensi berada di kategori Baik, dengan Relasi Positif hampir menyentuh nilai penuh. Unit yang dipimpinnya juga jenjang paling sehat, jadi cara kerjanya layak dijadikan rujukan bagi jenjang lain.',
   '["Minta membagikan praktik penyambutan pagi dan forum orang tua ke jenjang lain.","Jadikan mentor bagi kepala sekolah jenjang yang indeksnya belum bergerak.","Jaga bebannya agar peran mentor tidak justru menurunkan kondisinya sendiri."]',
   '[{"tema":"Memimpin perubahan","isi":"Perubahan kurikulum dijalankan bertahap: sosialisasi ke guru dulu, lalu pendampingan mingguan, supaya tidak ada yang merasa ditinggal."},{"tema":"Kolaborasi dengan orang tua","isi":"Forum orang tua bulanan dan kegiatan market day membuat orang tua terlibat langsung dalam pembelajaran anak."}]'),
  ('Ahmad Fauzi, M.Pd',
   'Seluruh dimensi Baik dan naik konsisten. Sebagai kepala sekolah SD, komunitas belajar internal yang ia jalankan sejalan dengan kenaikan indeks jenjangnya.',
   '["Lanjutkan komunitas belajar mingguan dan dokumentasikan agar bisa ditiru jenjang lain."]',
   '[{"tema":"Memimpin perubahan","isi":"Transisi ke Kurikulum Merdeka dikawal lewat komunitas belajar internal; guru saling berbagi praktik tiap Jumat."}]'),
  ('Hendra Gunawan, M.Pd',
   'Seluruh dimensi Baik. Sebagai kepala sekolah SMP, ia memimpin jenjang dengan indeks terendah di yayasan, jadi dukungan untuk timnya perlu jadi perhatian bersama pengurus yayasan.',
   '["Duduk bersama pengurus yayasan membahas beban administrasi di SMP sebelum menambah program baru.","Terapkan satu keputusan operasional per pekan yang sepenuhnya diputuskan guru."]',
   '[{"tema":"Memimpin perubahan","isi":"Digitalisasi administrasi dimulai dari hal kecil: presensi dan jurnal kelas daring, sebelum masuk ke rapor digital."}]'),
  ('Bambang Wijaya, M.Pd',
   'Seluruh dimensi Baik. Jenjang yang dipimpinnya naik 4,7 poin sejak Januari, kenaikan tertinggi di yayasan, bersamaan dengan berjalannya observasi kelas dua arah antarguru.',
   '["Bagikan mekanisme observasi kelas dua arah ke SD dan SMP.","Pastikan Fajar Ramadhan, satu-satunya guru SMA yang menurun, ikut mendapat pendampingan."]',
   '[{"tema":"Kemitraan sekolah","isi":"Menjalin kerja sama magang dengan dunia usaha lokal untuk memperluas ruang belajar siswa."}]')
) as v(nama, catatan, langkah, refleksi)
where p.nama = v.nama
  and p.sekolah_id = 'YP-FAMMI'
  and p.periode_id = '2025-07';

-- Guru yang belum punya catatan khusus tetap diberi refleksi singkat, supaya laporan
-- individunya tidak kosong sama sekali saat dibuka pimpinan.
update public.lw_personal as p
set refleksi = v.refleksi::jsonb
from (values
  ('Lina Marlina, S.Pd.AUD', '[{"tema":"Inovasi pembelajaran","isi":"Membuat media belajar dari barang bekas bersama anak-anak, sekaligus mengenalkan konsep daur ulang sejak dini."}]'),
  ('Dewi Lestari, S.Pd', '[{"tema":"Mengelola tim","isi":"Berbagi tugas dengan rekan sejawat saat kegiatan besar sekolah supaya beban tidak menumpuk di satu orang."}]'),
  ('Yuni Astuti, S.Pd.AUD', '[{"tema":"Kolaborasi dengan orang tua","isi":"Melibatkan orang tua sebagai narasumber kelas sesuai profesi masing-masing."}]'),
  ('Ratna Sari, S.Pd', '[{"tema":"Inovasi pembelajaran","isi":"Mengubah sudut baca kelas menjadi area bermain literasi yang membuat anak lebih betah membaca."}]'),
  ('Siti Nurhaliza, S.Pd', '[{"tema":"Mengelola tim","isi":"Menjadi koordinator lomba antarkelas dan membagi peran panitia ke guru muda supaya regenerasi berjalan."}]'),
  ('Rahmat Hidayat, S.Pd', '[{"tema":"Kolaborasi dengan orang tua","isi":"Program sarapan literasi tiap pagi melibatkan orang tua sebagai pembaca tamu."}]'),
  ('Maya Puspita, M.Pd', '[{"tema":"Mengelola tim","isi":"Memimpin tim penyusun modul ajar lintas mapel dan menjaga tenggat lewat papan kerja bersama."}]'),
  ('Indah Permatasari, S.Pd', '[{"tema":"Inovasi pembelajaran","isi":"Kelas menulis opini yang hasilnya dimuat di media sekolah menumbuhkan kepercayaan diri siswa."}]'),
  ('Agus Setiawan, M.Pd', '[{"tema":"Mengelola tim","isi":"Menjadi mentor guru baru lewat observasi kelas dua arah, saling memberi umpan balik."}]'),
  ('Nur Aini, S.Pd', '[{"tema":"Kolaborasi dengan orang tua","isi":"Konsultasi rutin perencanaan studi lanjut bersama siswa dan orang tua kelas XII."}]')
) as v(nama, refleksi)
where p.nama = v.nama
  and p.sekolah_id = 'YP-FAMMI'
  and p.periode_id = '2025-07';

-- ── 10. Rencana tindak lanjut prioritas ────────────────────────────────────────────────────
insert into public.tindak_lanjut (
  sekolah_id, periode_id, modul, fokus, scope, scope_id, target_role, status, type,
  dimensi, title, teaser, mengapa_data, manfaat, hal_diwaspadai
) values
(
  'YP-FAMMI', '2025-07', 'lw', 'protek', 'sekolah', 'YP-FAMMI', 'yayasan', 'disetujui', 'perlu_perhatian',
  'Kemandirian', 'Ubah pola pengambilan keputusan di rapat sekolah',
  'Beri satu keputusan operasional per pekan yang sepenuhnya diputuskan guru, lalu bahas hasilnya di rapat berikutnya tanpa dikoreksi pimpinan.',
  'Enam guru menahan keputusan sampai ada arahan pimpinan. Akarnya bukan pada guru, melainkan pada kebiasaan rapat yang selalu menunggu keputusan kepala sekolah.',
  '{"waktu":"Mulai bulan ini","sasaran":"6 guru","learning_outcome":"Jumlah guru dengan Kemandirian di bawah Baik turun dari 6 menjadi maksimal 3 pada asesmen berikutnya."}'::jsonb,
  null
),
(
  'YP-FAMMI', '2025-07', 'lw', 'protek', 'sekolah', 'YP-FAMMI', 'yayasan', 'disetujui', 'perlu_perhatian',
  'Eksplorasi Lingkungan', 'Pangkas beban administrasi di luar mengajar',
  'Petakan tugas administrasi yang bisa disatukan, digilir, atau dihapus sebelum menambah program pengembangan baru.',
  'Lima guru menyebut beban administrasi sebagai sumber tekanan utama, dan paling terasa di SMP yang indeksnya satu-satunya tidak membaik.',
  '{"waktu":"Kuartal ini","sasaran":"SMP lebih dulu","learning_outcome":"Indeks jenjang SMP naik minimal 2 poin dan keluhan beban administrasi turun di bawah 15 persen responden."}'::jsonb,
  null
),
(
  'YP-FAMMI', '2025-07', 'lw', 'protek', 'sekolah', 'YP-FAMMI', 'yayasan', 'disetujui', 'pertahankan',
  'Penguatan', 'Perluas pendampingan mentor ala SMA ke jenjang lain',
  'Observasi kelas dua arah antarguru, dijalankan satu siklus penuh sebelum asesmen berikutnya.',
  'SMA naik 4,7 poin sejak Januari, tertinggi di antara semua jenjang, bersamaan dengan berjalannya observasi kelas dua arah. Pola yang sudah terbukti ini layak ditiru.',
  '{"waktu":"Berkelanjutan","sasaran":"SD dan SMP","learning_outcome":"Dua jenjang menjalankan observasi kelas dua arah minimal satu siklus sebelum asesmen berikutnya."}'::jsonb,
  null
);

-- ── 11. Briefing (ringkasan eksekutif) ─────────────────────────────────────────────────────
insert into public.briefing (sekolah_id, periode_id, modul, scope, scope_id, status, teks)
values (
  'YP-FAMMI', '2025-07', 'lw', 'sekolah', 'YP-FAMMI', 'disetujui',
  'Wellbeing guru Yayasan Pendidikan Fammi naik 2,1 poin sejak Januari, dan 19 dari 20 guru berada pada kategori Baik. Yang perlu dibaca serius, Kemandirian bergerak ke arah sebaliknya: turun di kedua jeda antarperiode, dengan jumlah guru di bawah Baik bertambah dari 1 orang menjadi 6 orang. SMP juga satu-satunya jenjang yang belum ikut membaik, sementara SMA naik paling tinggi setelah menjalankan observasi kelas dua arah antarguru.'
);

-- ── 12. Akun demo Yayasan ──────────────────────────────────────────────────────────────────
-- Login: username "ypfammi", kode "ypfammi". Peran Yayasan, school_id YP-FAMMI, sehingga
-- begitu masuk langsung mendarat di tab Wellbeing Guru (satu-satunya modul aktif sekolah ini).
-- Ganti kodenya lewat Supabase Auth kalau akun ini dipakai di luar keperluan demo.
-- Idempoten: aman dijalankan ulang.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'ypfammi@fammi.internal', crypt('ypfammi', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
where not exists (select 1 from auth.users where email = 'ypfammi@fammi.internal');

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', u.id::text, now(), now(), now()
from auth.users u
where u.email = 'ypfammi@fammi.internal'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

insert into public.profiles (id, username, nama, peran, school_id)
select u.id, 'ypfammi', 'Yayasan Pendidikan Fammi', 'Yayasan', 'YP-FAMMI'
from auth.users u
where u.email = 'ypfammi@fammi.internal'
  and not exists (select 1 from public.profiles p where p.id = u.id);
