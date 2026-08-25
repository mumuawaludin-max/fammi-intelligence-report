-- Ganti empat view Rapor Karakter YPT (migration 20260825120000) jadi materialized view, setelah
-- terbukti 2026-08-26 lewat EXPLAIN ANALYZE bahwa query dasarnya makan ~11.8 detik BAHKAN TANPA
-- RLS sama sekali -- akar masalahnya volume data (581 ribu baris karakter_skor_indikator untuk
-- 26 sekolah), bukan biaya RLS seperti dugaan awal. Menambah index (20260826110000) dan
-- mempercepat policy (20260826120000) tidak cukup karena bottleneck-nya sort untuk
-- count(distinct murid_id) yang meluber ke disk, bukan pemindaian baris.
--
-- Ini skenario yang sudah diantisipasi di rencana (docs/yayasan-telkom-dashboard-plan.md, bagian
-- 6.1): "Kalau query view lambat (> 2 detik), ganti jadi materialized view yang di-refresh oleh
-- RPC importer karakter." Sudah terukur, sekarang dieksekusi.
--
-- Desain: tiap view lama (mis. ypt_k_sekolah) dipecah jadi DUA objek --
--   1. <nama>_mat  : materialized view, isinya SEMUA sekolah (tidak difilter yayasan), dihitung
--                    sekali saat refresh, TIDAK BISA punya RLS (keterbatasan Postgres).
--   2. <nama>      : view biasa (nama sama seperti sebelumnya, jadi React TIDAK PERLU berubah)
--                    yang membaca dari _mat dan menyaring "sekolah_id = any(my_yayasan_school_ids())"
--                    langsung di WHERE -- ini menggantikan peran RLS/security_invoker untuk data
--                    yang sudah pre-agregat, karena my_yayasan_school_ids() tetap membaca
--                    auth.uid() milik pemanggil yang sesungguhnya, jadi tetap personal per akun.
-- authenticated TIDAK diberi akses langsung ke tabel _mat, hanya lewat view pembungkusnya.

-- ── 1. ypt_k_sekolah ───────────────────────────────────────────────────────────────────────
drop view if exists public.ypt_k_sekolah;

create materialized view public.ypt_k_sekolah_mat as
select
  sekolah_id,
  periode_id,
  count(distinct murid_id)      as jumlah_siswa,
  round(avg(skor))::int         as rata_total
from public.karakter_skor
where skor is not null
group by sekolah_id, periode_id
with data;

create unique index on public.ypt_k_sekolah_mat (sekolah_id, periode_id);
revoke all on public.ypt_k_sekolah_mat from public, authenticated, anon;

create view public.ypt_k_sekolah as
select * from public.ypt_k_sekolah_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_sekolah to authenticated;

-- ── 2. ypt_k_aspek ─────────────────────────────────────────────────────────────────────────
drop view if exists public.ypt_k_aspek;

create materialized view public.ypt_k_aspek_mat as
select
  s.sekolah_id,
  s.periode_id,
  s.aspek_kode,
  c.aspek_label,
  count(distinct s.murid_id) as jumlah_siswa,
  round(avg(s.skor))::int    as rata
from public.karakter_skor s
left join public.karakter_aspek_config c
  on c.sekolah_id = s.sekolah_id and c.aspek_kode = s.aspek_kode
where s.skor is not null
group by s.sekolah_id, s.periode_id, s.aspek_kode, c.aspek_label
with data;

create unique index on public.ypt_k_aspek_mat (sekolah_id, periode_id, aspek_kode);
revoke all on public.ypt_k_aspek_mat from public, authenticated, anon;

create view public.ypt_k_aspek as
select * from public.ypt_k_aspek_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_aspek to authenticated;

-- ── 3. ypt_k_indikator (yang paling parah timeout-nya) ────────────────────────────────────
drop view if exists public.ypt_k_indikator;

create materialized view public.ypt_k_indikator_mat as
select
  i.sekolah_id,
  i.periode_id,
  i.aspek_kode,
  i.indikator_kode,
  ic.indikator_label,
  count(distinct i.murid_id) as jumlah_siswa,
  round(avg(i.skor))::int    as rata
from public.karakter_skor_indikator i
left join public.karakter_indikator_config ic
  on ic.sekolah_id = i.sekolah_id
 and ic.aspek_kode = i.aspek_kode
 and ic.indikator_kode = i.indikator_kode
where i.skor is not null
group by i.sekolah_id, i.periode_id, i.aspek_kode, i.indikator_kode, ic.indikator_label
with data;

create unique index on public.ypt_k_indikator_mat (sekolah_id, periode_id, aspek_kode, indikator_kode);
revoke all on public.ypt_k_indikator_mat from public, authenticated, anon;

create view public.ypt_k_indikator as
select * from public.ypt_k_indikator_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_indikator to authenticated;

-- ── 4. ypt_k_siswa_ekstrem ─────────────────────────────────────────────────────────────────
-- unique key butuh murid_id + arah (bukan cuma murid_id): sekolah dengan sedikit murid bisa
-- membuat murid yang sama muncul di TOP 5 atas dan TOP 5 bawah sekaligus.
drop view if exists public.ypt_k_siswa_ekstrem;

create materialized view public.ypt_k_siswa_ekstrem_mat as
with per_murid as (
  select
    sekolah_id,
    periode_id,
    murid_id,
    max(nama_murid) as nama_murid,
    max(kelas_id)   as kelas_id,
    round(avg(skor))::int as total_persen
  from public.karakter_skor
  where skor is not null
  group by sekolah_id, periode_id, murid_id
),
berperingkat as (
  select
    per_murid.*,
    row_number() over (partition by sekolah_id, periode_id order by total_persen desc, nama_murid asc) as rank_atas,
    row_number() over (partition by sekolah_id, periode_id order by total_persen asc,  nama_murid asc) as rank_bawah
  from per_murid
)
select sekolah_id, periode_id, murid_id, nama_murid, kelas_id, total_persen,
       'atas'::text as arah, rank_atas as peringkat
from berperingkat where rank_atas <= 5
union all
select sekolah_id, periode_id, murid_id, nama_murid, kelas_id, total_persen,
       'bawah'::text as arah, rank_bawah as peringkat
from berperingkat where rank_bawah <= 5
with data;

create unique index on public.ypt_k_siswa_ekstrem_mat (sekolah_id, periode_id, murid_id, arah);
revoke all on public.ypt_k_siswa_ekstrem_mat from public, authenticated, anon;

create view public.ypt_k_siswa_ekstrem as
select * from public.ypt_k_siswa_ekstrem_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_siswa_ekstrem to authenticated;

-- ── 5. Fungsi refresh, dipanggil AdminFammi lewat Admin CMS ───────────────────────────────
-- REFRESH MATERIALIZED VIEW CONCURRENTLY butuh unique index (sudah dibuat di atas) dan
-- membiarkan pembaca lama tetap bisa query selama refresh berlangsung (tanpa CONCURRENTLY,
-- view terkunci total selama refresh -- tidak masalah untuk data internal seperti ini, tapi
-- CONCURRENTLY tetap dipakai supaya dashboard tidak pernah menampilkan "sedang di-refresh").
--
-- set local statement_timeout: tanpa ini, refresh (yang makan >10 detik untuk indikator) akan
-- kena batas waktu default role authenticated sebelum sempat selesai. SET LOCAL hanya berlaku
-- untuk durasi transaksi function ini, tidak mengubah batas waktu query lain.
create or replace function public.refresh_ypt_karakter_views()
returns void
language plpgsql
security definer
as $$
begin
  if public.my_peran() <> 'AdminFammi' then
    raise exception 'Hanya AdminFammi yang boleh me-refresh ringkasan Rapor Karakter YPT.';
  end if;

  set local statement_timeout = '5min';

  refresh materialized view concurrently public.ypt_k_sekolah_mat;
  refresh materialized view concurrently public.ypt_k_aspek_mat;
  refresh materialized view concurrently public.ypt_k_indikator_mat;
  refresh materialized view concurrently public.ypt_k_siswa_ekstrem_mat;
end;
$$;

grant execute on function public.refresh_ypt_karakter_views() to authenticated;

comment on function public.refresh_ypt_karakter_views() is
  'Refresh keempat materialized view Rapor Karakter YPT. Panggil lewat tombol "Refresh Ringkasan '
  'Rapor Karakter" di Admin CMS setelah impor data Karakter sekolah Telkom mana pun selesai -- '
  'dashboard YPT membaca data yang di-snapshot di sini, bukan live, supaya cepat.';
