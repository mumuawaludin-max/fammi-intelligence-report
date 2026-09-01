-- Dashboard YPT: skor 0 dibaca sebagai "murid tidak dinilai", bukan nilai nol.
--
-- KEPUTUSAN TERKUNCI, pemilik produk 2026-09-01: "khusus untuk YPT, skor 0 di-lock seperti ini".
-- Artinya aturan di bawah final untuk dashboard Yayasan Pendidikan Telkom dan TIDAK perlu
-- ditanyakan ulang: skor 0 pada karakter_skor berarti guru tidak menilai murid itu, dan baris
-- seperti itu dibuang dari seluruh agregat YPT. Cakupannya YPT saja, lihat catatan di bagian
-- bawah kepala berkas ini soal view bersama modul Karakter yang sengaja tidak ikut berubah.
--
-- LATAR. Sekolah Telkom mengunggah roster lengkap; murid yang tidak dinilai guru masuk sebagai
-- baris skor 0, bukan baris kosong. Keempat matview YPT (20260826130000, dibangun ulang
-- 20260828120000) hanya menyaring `skor is not null`, jadi murid yang tidak dinilai ikut
-- ditarik ke rata-rata sebagai nol dan menyeret angka sekolah ke bawah.
--
-- Diverifikasi terhadap data produksi per periode 2026-05 (2026-09-01), dua contoh paling telak:
--   SMK Telkom Jakarta: 1.788 dari 2.248 baris bernilai 0 (447 murid nol di semua karakter).
--     Dashboard menampilkan 16%, padahal rekap sekolah itu sendiri menulis pencapaian_guru 20%
--     (kelengkapan input) dan rata_pencapaian_guru 80%. 20% x 80% = 16%.
--   SMK Telkom Bandung: 652 baris 0 (29%). Dashboard 58%, rekap 81,67%; tanpa baris nol
--     hitungannya 81,2%.
-- Rekap sekolah (karakter_summary.rata_pencapaian_guru, yang juga dipakai kartu hero
-- KepsekView/YayasanView) merata-ratakan HANYA murid yang diinput. Dashboard YPT wajib memakai
-- populasi yang sama, kalau tidak dua layar produk ini menampilkan dua angka berbeda untuk
-- sekolah yang sama.
--
-- Yang diubah pada keempat matview:
--   1. Filter avg(): `skor is not null` menjadi `skor is not null and skor > 0`.
--   2. jumlah_siswa otomatis ikut benar: count(distinct murid_id) sesudah filter hanya
--      menghitung murid yang benar-benar dinilai, sehingga bobot rata-rata tertimbang di React
--      (rataTertimbang di yptMeta.js) juga memakai populasi yang dinilai.
--   3. ypt_k_siswa_ekstrem: murid yang nol di semua aspek tidak lagi masuk "5 terendah" --
--      sebelum ini blok Perlu Penguatan diisi murid 0% yang sebenarnya tidak pernah dinilai.
--      Murid yang dinilai sebagian dirata-rata dari aspek yang terisi saja, sejalan dengan cara
--      rekap sekolah menghitung.
--
-- BATAS YANG DISADARI (sekolah pekanan): karakter_skor_bulanan memilih baris pekan terakhir
-- yang ADA nilainya, dan 0 terhitung "ada nilai". Murid sekolah pekanan yang dinilai pekan 1
-- lalu tercatat 0 di pekan 4 akan terpilih barisnya yang 0, lalu dibuang filter ini -- ia hilang
-- dari agregat bulan itu, bukan memakai nilai pekan 1-nya. Hari ini seluruh sekolah YPT menilai
-- bulanan (semua baris pekan 0, diverifikasi 2026-09-01), jadi keadaan itu belum pernah terjadi.
-- Kalau ada sekolah YPT pindah ke penilaian pekanan, putuskan dulu bersama pemilik produk apakah
-- 0 pekanan berarti "tidak dinilai pekan itu" (harus dibuang SEBELUM memilih pekan terakhir,
-- yaitu di karakter_skor_bulanan) -- jangan tambal di sini.
--
-- View bersama modul Karakter (karakter_skor_bulanan, karakter_jenjang_aspek_avg,
-- karakter_sekolah_indeks, dst) SENGAJA tidak disentuh, dan itu bagian dari keputusan yang
-- dikunci di atas: aturannya berlaku untuk dashboard YPT saja. Layar Kepsek/WaliKelas memakai
-- angka rekap dari karakter_summary untuk kartu utamanya, dan mengubah semantik view bersama
-- adalah keputusan produk yang lebih luas dari perbaikan ini. Jangan menyeragamkan keduanya
-- dengan alasan konsistensi tanpa instruksi baru.
--
-- CATATAN TERPISAH, tidak bisa dibereskan lewat rumus: di beberapa sekolah baris detail yang
-- terimpor memang tidak cocok dengan sheet rekap pada berkas yang sama (TK Batam karakter2
-- tersimpan 90,9 vs rekap 98; SMK Sidoarjo dan SMP Padang nilai per karakternya tidak sejalan
-- dengan rekap; TK Dayeuhkolot tersimpan 3-4 poin di atas rekap; SMK Makassar tanpa-nol 87,6 vs
-- rekap 76). Itu urusan QC berkas unggahan, bukan urusan view ini.
--
-- Idempoten, aman dijalankan ulang. Jalankan lewat Supabase SQL Editor. Matview dibuat WITH
-- DATA, jadi tidak perlu refresh manual sesudahnya. Diuji lewat supabase/tests
-- (ypt_skor_nol_verify.sql) di postgres:15 dan postgres:17.

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
where skor is not null and skor > 0
group by sekolah_id, periode_id
with data;

create unique index on public.ypt_k_sekolah_mat (sekolah_id, periode_id);
revoke all on public.ypt_k_sekolah_mat from public, authenticated, anon;

create view public.ypt_k_sekolah as
select * from public.ypt_k_sekolah_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_sekolah to authenticated;

comment on materialized view public.ypt_k_sekolah_mat is
  'Rata-rata skor karakter per sekolah per periode, HANYA murid yang dinilai (skor > 0; skor 0 '
  'berarti guru tidak menginput murid itu). jumlah_siswa = murid yang dinilai, dipakai sebagai '
  'bobot agregasi jenjang/yayasan di dashboard YPT.';

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
where s.skor is not null and s.skor > 0
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
where i.skor is not null and i.skor > 0
group by i.sekolah_id, i.jenjang, i.periode_id, i.aspek_kode, i.indikator_kode, ic.indikator_label
with data;

create unique index on public.ypt_k_indikator_mat (sekolah_id, jenjang, periode_id, aspek_kode, indikator_kode);
revoke all on public.ypt_k_indikator_mat from public, authenticated, anon;

create view public.ypt_k_indikator as
select * from public.ypt_k_indikator_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_indikator to authenticated;

-- ── 4. Lima murid tertinggi dan terendah per sekolah ───────────────────────────────────────
-- Murid nol-semua-aspek tidak punya baris skor > 0, jadi otomatis tidak ikut diperingkat --
-- dialah penyebab blok "Perlu Penguatan" berisi deretan 0% yang bukan murid terlemah melainkan
-- murid yang belum dinilai. Murid yang dinilai sebagian dirata-rata dari aspek terisinya saja.
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
  where skor is not null and skor > 0
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
