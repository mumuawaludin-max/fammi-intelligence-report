-- View agregat Rapor Karakter untuk dashboard Yayasan Pendidikan Telkom.
-- Rencana: docs/yayasan-telkom-dashboard-plan.md (Milestone 2, bagian 6.1).
--
-- Kenapa di database, bukan di React: butir 3 CLAUDE.md (FIR tidak menghitung agregat), dan
-- alasan praktis -- YPT menaungi puluhan sekolah dengan puluhan ribu baris skor murid. Menarik
-- baris mentah lintas sekolah ke browser lalu diagregat di useMemo akan lambat dan boros.
-- Presedennya sudah ada: karakter_indikator_sekolah_avg (20260711150000) dan
-- karakter_indikator_kelas_avg (20260814110000) memecahkan masalah yang sama.
--
-- PENTING -- security_invoker = true WAJIB ADA di setiap view di bawah. Tanpa itu view akan
-- bypass RLS untuk semua pemakainya dan membocorkan skor murid sekolah lain ke siapa pun yang
-- bisa SELECT. Dengan security_invoker, keempat view ini transparan terhadap policy
-- karakter_skor_baca / karakter_skor_indikator_baca (20260711100000): akun Yayasan melihat
-- sekolah naungannya, Kepsek sekolahnya sendiri, Wali Kelas kelasnya saja.
--
-- Skala skor: karakter_skor.skor dan karakter_skor_indikator.skor adalah kolom int Postgres
-- berisi persen 0-100 (lihat catatan pct() di karakterMeta.js), jadi rata-ratanya langsung persen
-- dan TIDAK perlu dikonversi lagi di tampilan.

-- ── 1. Ringkasan per sekolah per periode ──────────────────────────────────────────────────
-- jumlah_siswa dipakai sebagai BOBOT saat React merata-ratakan antar sekolah (rata-rata jenjang
-- dan rata-rata yayasan tertimbang jumlah siswa, bukan rata-rata dari rata-rata) -- lihat aturan
-- agregasi di bagian 6.1 rencana.
create or replace view public.ypt_k_sekolah
with (security_invoker = true)
as
select
  sekolah_id,
  periode_id,
  count(distinct murid_id)      as jumlah_siswa,
  round(avg(skor))::int         as rata_total
from public.karakter_skor
where skor is not null
group by sekolah_id, periode_id;

grant select on public.ypt_k_sekolah to authenticated;

-- ── 2. Ringkasan per aspek karakter per sekolah ───────────────────────────────────────────
-- aspek_label ikut dibawa supaya React bisa mencocokkan aspek ANTAR SEKOLAH lewat nama aspek,
-- bukan lewat aspek_kode. Kodenya (K1, K2, ...) tidak konsisten antar sekolah -- "K2" di satu
-- sekolah bisa Empati, di sekolah lain Mandiri. Pelajaran ini datang dari importer multi-sekolah
-- (lihat memori project_karakter_importer_multischool): jangan pernah mengunci daftar aspek ke
-- penamaan satu sekolah.
-- Label bisa NULL kalau karakter_aspek_config belum lengkap untuk sekolah itu; React
-- menambalnya dari karakter_summary.ringkasan seperti yang sudah dilakukan resolveAspekList().
create or replace view public.ypt_k_aspek
with (security_invoker = true)
as
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
group by s.sekolah_id, s.periode_id, s.aspek_kode, c.aspek_label;

grant select on public.ypt_k_aspek to authenticated;

-- ── 3. Ringkasan per indikator per sekolah ────────────────────────────────────────────────
-- Dipakai blok "Top 5 Indikator Terbaik / Perlu Penguatan" di tab Penilaian per Karakter.
-- Sudah membawa label supaya React tidak perlu menarik karakter_indikator_config lintas puluhan
-- sekolah cuma untuk menamai baris.
create or replace view public.ypt_k_indikator
with (security_invoker = true)
as
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
group by i.sekolah_id, i.periode_id, i.aspek_kode, i.indikator_kode, ic.indikator_label;

grant select on public.ypt_k_indikator to authenticated;

-- ── 4. Lima murid tertinggi dan terendah per sekolah ──────────────────────────────────────
-- Dipakai blok "TOP 5 Siswa Terbaik / Perlu Penguatan" di tab Penilaian per Jenjang.
--
-- Dibatasi 5 atas + 5 bawah DI DALAM view (bukan mengirim seluruh murid lalu diiris di React):
-- selain jauh lebih ringan, ini juga membatasi jumlah nama murid yang pernah keluar dari database
-- ke tampilan yayasan seminimal yang memang ditampilkan.
--
-- Sekolah dengan <= 10 murid akan memunculkan murid yang sama di kedua arah; itu benar secara
-- data (dia memang sekaligus 5 tertinggi dan 5 terendah), React yang memutuskan menyembunyikan
-- salah satu blok kalau jumlah muridnya terlalu sedikit.
create or replace view public.ypt_k_siswa_ekstrem
with (security_invoker = true)
as
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
from berperingkat where rank_bawah <= 5;

grant select on public.ypt_k_siswa_ekstrem to authenticated;

-- ── 5. Agregat Citra Sekolah dari refleksi yang sudah ada ─────────────────────────────────
-- TIDAK ada tabel baru dan TIDAK ada importer baru untuk tab Keberhasilan/Dukungan/Emosi:
-- datanya sudah masuk lewat importer Karakter dan sudah menggerakkan kategori "Citra Sekolah di
-- Mata Orang Tua" di tampilan Wali Kelas/Kepsek/Yayasan. View ini cuma menghitung distribusinya.
--
-- Tiga topik dipetakan ke tiga kolom karakter_pernyataan_ortu:
--   keberhasilan -> kategori_pernyataan   (kartu "Tumbuh Kebiasaan Positif", dst)
--   dukungan     -> dukungan_dibutuhkan   (kartu "Panduan Pembiasaan di Rumah", dst)
--   emosi        -> emosi_anak            (5 kartu sentimen)
-- Kolom sumber ikut dibawa supaya tampilan bisa memilih refleksi orang tua saja (menu YPT
-- menyebut "di Mata Orangtua") pada sekolah dual-source yang juga punya refleksi siswa.
--
-- Nilai kategori TIDAK dinormalisasi di sini: apa adanya dari data. Pencocokan ke label kartu
-- Figma dilakukan di yptMeta.js, dan kategori yang tidak dikenal tetap dirender di akhir daftar
-- alih-alih dibuang -- supaya sekolah dengan penamaan berbeda tidak hilang diam-diam.
create or replace view public.ypt_cs_agregat
with (security_invoker = true)
as
select sekolah_id, periode_id, sumber, 'keberhasilan'::text as topik,
       kategori_pernyataan as kategori, count(distinct murid_id) as jumlah_siswa
from public.karakter_pernyataan_ortu
where kategori_pernyataan is not null and btrim(kategori_pernyataan) <> ''
group by sekolah_id, periode_id, sumber, kategori_pernyataan
union all
select sekolah_id, periode_id, sumber, 'dukungan'::text,
       dukungan_dibutuhkan, count(distinct murid_id)
from public.karakter_pernyataan_ortu
where dukungan_dibutuhkan is not null and btrim(dukungan_dibutuhkan) <> ''
group by sekolah_id, periode_id, sumber, dukungan_dibutuhkan
union all
select sekolah_id, periode_id, sumber, 'emosi'::text,
       emosi_anak, count(distinct murid_id)
from public.karakter_pernyataan_ortu
where emosi_anak is not null and btrim(emosi_anak) <> ''
group by sekolah_id, periode_id, sumber, emosi_anak;

grant select on public.ypt_cs_agregat to authenticated;

comment on view public.ypt_cs_agregat is
  'Distribusi kategori refleksi orang tua/siswa per sekolah per periode, untuk menu Citra Sekolah '
  'dashboard Yayasan. Dibangun dari karakter_pernyataan_ortu yang sudah ada, bukan tabel baru.';
