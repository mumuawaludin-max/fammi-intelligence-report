-- Replika keadaan produksi SEBELUM migration 20260828110000, secukupnya untuk menguji migration
-- itu: tabel Karakter, dua tabel config beserta unique constraint gaya lama (dibuat di luar
-- folder migrations, jadi namanya dikarang di sini persis seperti kemungkinan aslinya), helper
-- auth/RLS yang dipanggil RPC, dan seluruh view/matview yang akan disentuh migration.

do $r$ begin
  if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
  if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if;
end $r$;

create schema if not exists auth;
create or replace function auth.role() returns text language sql stable as $$ select 'service_role'::text $$;
create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
create or replace function public.is_admin_fammi() returns boolean language sql stable as $$ select true $$;
create or replace function public.my_yayasan_school_ids() returns text[] language sql stable as $$ select array['SMK-TELKOM-PWT','SD-AMAL-MULIA']::text[] $$;

create table public.karakter_skor (
  id bigserial primary key,
  sekolah_id text not null, kelas_id text, murid_id text, nama_murid text,
  periode_id text, aspek_kode text, skor int, sumber text default 'guru', status text default 'disetujui'
);
create table public.karakter_skor_indikator (
  id bigserial primary key,
  sekolah_id text not null, kelas_id text, murid_id text, nama_murid text,
  periode_id text, aspek_kode text, indikator_kode text, skor int, sumber text default 'guru', status text default 'disetujui'
);
create table public.karakter_pernyataan_ortu (
  id bigserial primary key,
  sekolah_id text not null, kelas_id text, murid_id text, nama_murid text, periode_id text,
  kategori_pernyataan text, pernyataan text, emosi_anak text, alasan_emosi text,
  dukungan_dibutuhkan text, dukungan_lainnya text, hal_disyukuri text, status text, sumber text default 'orangtua'
);
create table public.karakter_summary (
  id bigserial primary key,
  sekolah_id text not null, scope text, scope_id text, periode_id text, ringkasan jsonb, status text
);
alter table public.karakter_skor
  add constraint karakter_skor_sekolah_murid_periode_aspek_key unique (sekolah_id, murid_id, periode_id, aspek_kode);
alter table public.karakter_skor_indikator
  add constraint karakter_skor_indikator_sekolah_murid_periode_aspek_ind_key unique (sekolah_id, murid_id, periode_id, aspek_kode, indikator_kode);

-- Dua tabel config, dengan unique gaya lama yang MENGABAIKAN jenjang. Sengaja dibuat dua bentuk
-- berbeda: satu constraint, satu index unik telanjang, karena keduanya sama-sama mungkin dibuat
-- lewat SQL Editor dan migration harus membuang dua-duanya.
create table public.karakter_aspek_config (
  sekolah_id text not null, aspek_kode text not null, aspek_label text, urutan int
);
alter table public.karakter_aspek_config
  add constraint karakter_aspek_config_sekolah_id_aspek_kode_key unique (sekolah_id, aspek_kode);

create table public.karakter_indikator_config (
  sekolah_id text not null, aspek_kode text not null, indikator_kode text not null,
  indikator_label text, urutan int
);
create unique index karakter_indikator_config_uniq
  on public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode);

-- View versi lama (migration 20260711150000 dan 20260814110000), dengan urutan kolom lama.
create view public.karakter_indikator_sekolah_avg with (security_invoker = true) as
select sekolah_id, periode_id, aspek_kode, indikator_kode, round(avg(skor)) as skor
from public.karakter_skor_indikator group by sekolah_id, periode_id, aspek_kode, indikator_kode;

create view public.karakter_indikator_kelas_avg with (security_invoker = true) as
select sekolah_id, kelas_id, periode_id, aspek_kode, indikator_kode, round(avg(skor)) as skor
from public.karakter_skor_indikator group by sekolah_id, kelas_id, periode_id, aspek_kode, indikator_kode;

-- Matview YPT versi lama (migration 20260826130000).
create materialized view public.ypt_k_aspek_mat as
select s.sekolah_id, s.periode_id, s.aspek_kode, c.aspek_label,
       count(distinct s.murid_id) as jumlah_siswa, round(avg(s.skor))::int as rata
from public.karakter_skor s
left join public.karakter_aspek_config c on c.sekolah_id = s.sekolah_id and c.aspek_kode = s.aspek_kode
where s.skor is not null
group by s.sekolah_id, s.periode_id, s.aspek_kode, c.aspek_label with data;
create unique index on public.ypt_k_aspek_mat (sekolah_id, periode_id, aspek_kode);
create view public.ypt_k_aspek as select * from public.ypt_k_aspek_mat
where sekolah_id = any (public.my_yayasan_school_ids());

create materialized view public.ypt_k_indikator_mat as
select i.sekolah_id, i.periode_id, i.aspek_kode, i.indikator_kode, ic.indikator_label,
       count(distinct i.murid_id) as jumlah_siswa, round(avg(i.skor))::int as rata
from public.karakter_skor_indikator i
left join public.karakter_indikator_config ic
  on ic.sekolah_id = i.sekolah_id and ic.aspek_kode = i.aspek_kode and ic.indikator_kode = i.indikator_kode
where i.skor is not null
group by i.sekolah_id, i.periode_id, i.aspek_kode, i.indikator_kode, ic.indikator_label with data;
create unique index on public.ypt_k_indikator_mat (sekolah_id, periode_id, aspek_kode, indikator_kode);
create view public.ypt_k_indikator as select * from public.ypt_k_indikator_mat
where sekolah_id = any (public.my_yayasan_school_ids());

-- Dua matview YPT lainnya, supaya migration yang membangun ulang keempatnya benar-benar teruji.
create materialized view public.ypt_k_sekolah_mat as
select sekolah_id, periode_id, count(distinct murid_id) as jumlah_siswa, round(avg(skor))::int as rata_total
from public.karakter_skor where skor is not null group by sekolah_id, periode_id with data;
create unique index on public.ypt_k_sekolah_mat (sekolah_id, periode_id);
create view public.ypt_k_sekolah as select * from public.ypt_k_sekolah_mat
where sekolah_id = any (public.my_yayasan_school_ids());

create materialized view public.ypt_k_siswa_ekstrem_mat as
with per_murid as (
  select sekolah_id, periode_id, murid_id, max(nama_murid) as nama_murid, max(kelas_id) as kelas_id,
         round(avg(skor))::int as total_persen
  from public.karakter_skor where skor is not null group by sekolah_id, periode_id, murid_id
), berperingkat as (
  select per_murid.*,
    row_number() over (partition by sekolah_id, periode_id order by total_persen desc, nama_murid asc) as rank_atas,
    row_number() over (partition by sekolah_id, periode_id order by total_persen asc,  nama_murid asc) as rank_bawah
  from per_murid)
select sekolah_id, periode_id, murid_id, nama_murid, kelas_id, total_persen,
       'atas'::text as arah, rank_atas as peringkat from berperingkat where rank_atas <= 5
union all
select sekolah_id, periode_id, murid_id, nama_murid, kelas_id, total_persen,
       'bawah'::text as arah, rank_bawah as peringkat from berperingkat where rank_bawah <= 5
with data;
create unique index on public.ypt_k_siswa_ekstrem_mat (sekolah_id, periode_id, murid_id, arah);
create view public.ypt_k_siswa_ekstrem as select * from public.ypt_k_siswa_ekstrem_mat
where sekolah_id = any (public.my_yayasan_school_ids());
-- Fungsi refresh (migration 20260826150000), untuk memastikan masih valid sesudah matview dibangun ulang.
create or replace function public.refresh_ypt_views() returns void language plpgsql security definer as $fn$
begin
  refresh materialized view concurrently public.ypt_k_sekolah_mat;
  refresh materialized view concurrently public.ypt_k_aspek_mat;
  refresh materialized view concurrently public.ypt_k_indikator_mat;
  refresh materialized view concurrently public.ypt_k_siswa_ekstrem_mat;
end $fn$;

-- Data awal: satu sekolah berkerangka TUNGGAL, supaya regresi kompatibilitas mundur bisa diukur.
insert into public.karakter_skor (sekolah_id, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SMK-TELKOM-PWT','11 RPL','M001','Ahmad','2026-07','karakter1',80),
  ('SMK-TELKOM-PWT','11 RPL','M001','Ahmad','2026-07','karakter2',70),
  ('SMK-TELKOM-PWT','12 TKJ','M002','Budi','2026-07','karakter1',60),
  ('SMK-TELKOM-PWT','12 TKJ','M002','Budi','2026-07','karakter2',90);
insert into public.karakter_skor_indikator (sekolah_id, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor)
values
  ('SMK-TELKOM-PWT','11 RPL','M001','Ahmad','2026-07','karakter1','indikator1_dengar',75),
  ('SMK-TELKOM-PWT','12 TKJ','M002','Budi','2026-07','karakter1','indikator1_dengar',55);
insert into public.karakter_aspek_config (sekolah_id, aspek_kode, aspek_label, urutan)
values ('SMK-TELKOM-PWT','karakter1','Empati',1), ('SMK-TELKOM-PWT','karakter2','Inisiatif',2);
insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
values ('SMK-TELKOM-PWT','karakter1','indikator1_dengar','Dengar pendapat',1);
