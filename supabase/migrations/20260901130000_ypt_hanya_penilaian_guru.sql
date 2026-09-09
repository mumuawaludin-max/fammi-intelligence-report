-- Dashboard YPT: hanya penilaian GURU yang dihitung. Refleksi siswa dan orang tua adalah
-- lampiran, tidak pernah ikut ke angka pencapaian.
--
-- KEPUTUSAN TERKUNCI, pemilik produk 2026-09-01: "yang tampil di sini hanyalah penilaian
-- karakter dari guru; dari siswa atau orangtua tidak usah dihitung, karena itu lampiran saja."
--
-- JUJUR SOAL DAMPAKNYA: hari ini migration ini TIDAK mengubah satu angka pun. Diperiksa
-- terhadap produksi 2026-09-01, seluruh baris karakter_skor dan karakter_skor_indikator milik
-- 26 sekolah YPT pada periode 2026-03 sampai 2026-05 bernilai sumber = 'guru'; tidak ada satu
-- pun baris siswa atau orangtua di kedua tabel itu. Refleksi siswa/orang tua memang disimpan di
-- tempat lain (karakter_pernyataan_ortu, dan ringkasan rata_pencapaian_siswa /
-- rata_pencapaian_orangtua di dalam karakter_summary.ringkasan), dan dashboard YPT tidak pernah
-- membaca keduanya.
--
-- Jadi kenapa tetap ditulis: sebagai PENJAGA, bukan perbaikan angka. Kolom `sumber` sudah ada di
-- kedua tabel dan modul Karakter sudah mendukung refleksi multi-sumber (migration
-- 20260810100000), jadi begitu ada sekolah YPT yang kelak mengirim baris penilaian siswa atau
-- orang tua, tanpa saringan ini baris itu akan MASUK diam-diam ke rata-rata pencapaian dan tidak
-- akan ketahuan dari tampilan. Saringan eksplisit membuat aturannya tidak bisa hilang tanpa
-- sengaja.
--
-- CATATAN, keganjilan yang disadari dan sengaja TIDAK diperbaiki di sini: unique index
-- karakter_skor_murid_periode_pekan_aspek_key (migration 20260828120000) mengunci
-- (sekolah, murid, periode, pekan, aspek) TANPA menyertakan `sumber`, padahal view
-- karakter_skor_bulanan mengelompokkan dengan `sumber` ikut serta. Artinya database sekarang
-- belum bisa menyimpan penilaian guru dan siswa untuk murid dan aspek yang sama sekaligus.
-- Membetulkannya menyentuh seluruh modul Karakter, bukan cuma YPT, jadi itu keputusan terpisah.
--
-- Cakupan tetap YPT saja, sejalan dengan butir 9 CLAUDE.md: view bersama modul Karakter tidak
-- disentuh.
--
-- Idempoten, aman dijalankan ulang. Jalankan lewat Supabase SQL Editor. Matview dibuat WITH
-- DATA, jadi tidak perlu refresh manual sesudahnya. Diuji lewat supabase/tests
-- (ypt_hanya_guru_verify.sql) di postgres:15 dan postgres:17.

-- SATU TRANSAKSI. Seluruh berkas ini all-or-nothing: kalau ada satu perintah saja yang gagal,
-- Postgres mengembalikan database persis ke keadaan sebelum dijalankan dan tidak ada view yang
-- tertinggal dalam keadaan sudah di-drop. Penting karena skrip ini menghapus dulu baru membuat
-- ulang keempat view YPT; tanpa transaksi, kegagalan di tengah akan mematikan dashboard YPT
-- sampai ada yang menjalankan ulang. Seluruh DDL di sini transaksional (tidak ada CREATE INDEX
-- CONCURRENTLY maupun REFRESH CONCURRENTLY), jadi membungkusnya aman.
begin;

-- ── 1. Ringkasan per sekolah ───────────────────────────────────────────────────────────────
drop view if exists public.ypt_k_sekolah;
drop materialized view if exists public.ypt_k_sekolah_mat;

create materialized view public.ypt_k_sekolah_mat as
select
  sekolah_id,
  periode_id,
  count(distinct murid_id)      as jumlah_siswa,
  round(avg(skor))::int         as rata_total
from public.karakter_skor_bulanan
where skor is not null and skor > 0 and sumber = 'guru'
group by sekolah_id, periode_id
with data;

create unique index on public.ypt_k_sekolah_mat (sekolah_id, periode_id);
revoke all on public.ypt_k_sekolah_mat from public, authenticated, anon;

create view public.ypt_k_sekolah as
select * from public.ypt_k_sekolah_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_sekolah to authenticated;

comment on materialized view public.ypt_k_sekolah_mat is
  'Rata-rata skor karakter per sekolah per periode untuk dashboard YPT. Hanya penilaian GURU '
  '(sumber = guru; refleksi siswa/orang tua adalah lampiran, tidak dihitung) dan hanya murid '
  'yang benar-benar dinilai (skor > 0). jumlah_siswa = murid yang dinilai, dipakai sebagai bobot '
  'agregasi jenjang/yayasan.';

-- ── 2. Ringkasan per aspek karakter per sekolah ────────────────────────────────────────────
drop view if exists public.ypt_k_aspek;
drop materialized view if exists public.ypt_k_aspek_mat;

create materialized view public.ypt_k_aspek_mat as
select
  s.sekolah_id,
  s.jenjang,
  s.periode_id,
  s.aspek_kode,
  c.aspek_label,
  c.identitas_kode,
  count(distinct s.murid_id) as jumlah_siswa,
  round(avg(s.skor))::int    as rata
from public.karakter_skor_bulanan s
left join public.karakter_aspek_config c
  on c.sekolah_id = s.sekolah_id
 and c.jenjang = s.jenjang
 and c.aspek_kode = s.aspek_kode
where s.skor is not null and s.skor > 0 and s.sumber = 'guru'
group by s.sekolah_id, s.jenjang, s.periode_id, s.aspek_kode, c.aspek_label, c.identitas_kode
with data;

create unique index on public.ypt_k_aspek_mat (sekolah_id, jenjang, periode_id, aspek_kode);
revoke all on public.ypt_k_aspek_mat from public, authenticated, anon;

create view public.ypt_k_aspek as
select * from public.ypt_k_aspek_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_aspek to authenticated;

-- ── 3. Ringkasan per indikator per sekolah ─────────────────────────────────────────────────
drop view if exists public.ypt_k_indikator;
drop materialized view if exists public.ypt_k_indikator_mat;

create materialized view public.ypt_k_indikator_mat as
select
  i.sekolah_id,
  i.jenjang,
  i.periode_id,
  i.aspek_kode,
  i.indikator_kode,
  ic.indikator_label,
  count(distinct i.murid_id) as jumlah_siswa,
  round(avg(i.skor))::int    as rata
from public.karakter_skor_indikator_bulanan i
left join public.karakter_indikator_config ic
  on ic.sekolah_id = i.sekolah_id
 and ic.jenjang = i.jenjang
 and ic.aspek_kode = i.aspek_kode
 and ic.indikator_kode = i.indikator_kode
where i.skor is not null and i.skor > 0 and i.sumber = 'guru'
group by i.sekolah_id, i.jenjang, i.periode_id, i.aspek_kode, i.indikator_kode, ic.indikator_label
with data;

create unique index on public.ypt_k_indikator_mat (sekolah_id, jenjang, periode_id, aspek_kode, indikator_kode);
revoke all on public.ypt_k_indikator_mat from public, authenticated, anon;

create view public.ypt_k_indikator as
select * from public.ypt_k_indikator_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_indikator to authenticated;

-- ── 4. Lima murid tertinggi dan terendah per sekolah ───────────────────────────────────────
drop view if exists public.ypt_k_siswa_ekstrem;
drop materialized view if exists public.ypt_k_siswa_ekstrem_mat;

create materialized view public.ypt_k_siswa_ekstrem_mat as
with per_murid as (
  select
    sekolah_id,
    periode_id,
    murid_id,
    max(nama_murid) as nama_murid,
    max(kelas_id)   as kelas_id,
    round(avg(skor))::int as total_persen
  from public.karakter_skor_bulanan
  where skor is not null and skor > 0 and sumber = 'guru'
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

commit;
