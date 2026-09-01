-- View pendukung penyaring PER PEKAN di laporan.
--
-- Permintaan pemilik produk 2026-09-01: pemilih periode di navbar harus bisa memilih pekan yang
-- benar-benar sudah diinput, supaya isi tiap pekan bisa dilihat sendiri-sendiri.
--
-- Yang sudah ada dari migration sebelumnya: karakter_pekan_avg (rata-rata per kelas per pekan)
-- dan karakter_pekan_aspek_avg (per kelas per karakter per pekan). Dua yang kurang untuk
-- membuat panel Detail Kelas utuh per pekan ditambahkan di sini: indikator dan daftar murid.
--
-- BATAS YANG HARUS DISADARI, dan ini bukan sesuatu yang bisa diperbaiki lewat view:
-- karakter_summary dan karakter_pernyataan_ortu TIDAK punya kolom pekan, dan tidak akan pernah
-- punya selama berkas sekolah cuma menyediakan ringkasan bulanan. Jadi bagian laporan yang
-- bersumber dari sana (suara orang tua, briefing, tindak lanjut, serta angka ringkasan siap-saji
-- dari berkas) tetap bulanan apa pun pekan yang dipilih. Tampilan WAJIB menyebutkan itu, bukan
-- membiarkan pembaca mengira semuanya sudah tersaring ke pekan yang dipilih.
--
-- Idempoten, aman dijalankan ulang. Jalankan lewat Supabase SQL Editor.

-- ── 1. Indikator per kelas per pekan ───────────────────────────────────────────────────────
-- Padanan karakter_indikator_kelas_avg, bedanya membaca tabel MENTAH dan menyertakan pekan di
-- GROUP BY. Yang bulanan tetap dipakai saat tidak ada pekan yang dipilih; keduanya hidup
-- berdampingan, bukan saling menggantikan.
--
-- security_invoker = true WAJIB ADA, alasannya sama dengan seluruh view Karakter lain (lihat
-- 20260711150000): tanpa itu view ini bypass RLS dan membocorkan data kelas/sekolah lain.
create or replace view public.karakter_indikator_kelas_pekan_avg
with (security_invoker = true)
as
select
  sekolah_id,
  jenjang,
  kelas_id,
  periode_id,
  pekan,
  aspek_kode,
  indikator_kode,
  sumber,
  count(distinct murid_id) as jumlah_murid,
  round(avg(skor))::int    as skor,
  (case when pekan = 0 then 4 else pekan end)::smallint as pekan_urut
from public.karakter_skor_indikator
where skor is not null
group by sekolah_id, jenjang, kelas_id, periode_id, pekan, aspek_kode, indikator_kode, sumber;

grant select on public.karakter_indikator_kelas_pekan_avg to authenticated;

-- ── 2. Rata-rata per MURID per pekan ───────────────────────────────────────────────────────
-- Bahan daftar "Top 5 siswa terbaik" dan "perlu penguatan" saat satu pekan dipilih. Tanpa ini,
-- kedua daftar itu terpaksa memakai angka bulanan dari berkas dan akan bertentangan dengan
-- angka lain di panel yang sama begitu pekan disaring.
--
-- Rata-rata seluruh aspek murid itu di pekan tersebut, sejajar dengan cara kartu kelas dihitung.
create or replace view public.karakter_murid_pekan_avg
with (security_invoker = true)
as
select
  sekolah_id,
  jenjang,
  kelas_id,
  periode_id,
  pekan,
  murid_id,
  max(nama_murid)          as nama_murid,
  sumber,
  count(*)                 as jumlah_aspek,
  round(avg(skor))::int    as rata,
  (case when pekan = 0 then 4 else pekan end)::smallint as pekan_urut
from public.karakter_skor
where skor is not null
group by sekolah_id, jenjang, kelas_id, periode_id, pekan, murid_id, sumber;

grant select on public.karakter_murid_pekan_avg to authenticated;

-- ── 3. Daftar pekan yang benar-benar punya data, per sekolah ───────────────────────────────
-- Isi pemilih periode. Sengaja view tersendiri, bukan diturunkan di React dari karakter_pekan_avg:
-- yang dibutuhkan cuma daftar pendek (sekolah x periode x pekan), sedangkan karakter_pekan_avg
-- satu baris per kelas per karakter dan bisa ribuan baris untuk sekolah besar. Menariknya penuh
-- ke browser cuma untuk mengisi dropdown itu boros dan lambat.
--
-- pekan 0 (penilaian bulanan) IKUT, supaya tampilan bisa membedakan "bulan ini memang tidak
-- dirinci per pekan" dari "bulan ini belum ada datanya sama sekali".
create or replace view public.karakter_pekan_tersedia
with (security_invoker = true)
as
select
  sekolah_id,
  periode_id,
  pekan,
  (case when pekan = 0 then 4 else pekan end)::smallint as pekan_urut,
  count(distinct murid_id) as jumlah_murid,
  count(distinct kelas_id) as jumlah_kelas
from public.karakter_skor
where skor is not null
group by sekolah_id, periode_id, pekan;

grant select on public.karakter_pekan_tersedia to authenticated;

comment on view public.karakter_pekan_tersedia is
  'Daftar (periode, pekan) yang benar-benar punya skor, per sekolah. Mengisi penyaring pekan di pemilih periode. pekan 0 berarti bulan itu dinilai bulanan, tidak dirinci per pekan.';
