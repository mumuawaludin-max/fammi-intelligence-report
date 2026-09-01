\set ON_ERROR_STOP on
\pset pager off

-- Dijalankan SESUDAH baseline + kelima migration (20260828110000, 120000, 130000,
-- 20260901100000, 20260901110000) pada database bersih. Menulis data, jadi jalankan SEKALI
-- per database.
--
-- Keadaan awal dari baseline (SMK-TELKOM-PWT, periode 2026-07):
--   M001 Ahmad: karakter1=80, karakter2=70
--   M002 Budi : karakter1=60, karakter2=90
--   indikator1_dengar: M001=75, M002=55

\echo '--- persiapan: murid tidak dinilai (nol semua) dan murid dinilai sebagian'
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SMK-TELKOM-PWT','*',0,'11 RPL','M003','Dodi','2026-07','karakter1',0),
  ('SMK-TELKOM-PWT','*',0,'11 RPL','M003','Dodi','2026-07','karakter2',0),
  ('SMK-TELKOM-PWT','*',0,'12 TKJ','M004','Eka','2026-07','karakter1',0),
  ('SMK-TELKOM-PWT','*',0,'12 TKJ','M004','Eka','2026-07','karakter2',88);
insert into karakter_skor_indikator (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor)
values
  ('SMK-TELKOM-PWT','*',0,'11 RPL','M003','Dodi','2026-07','karakter1','indikator1_dengar',0);
-- sekolah bersih tanpa baris nol, untuk regresi
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SD-AMAL-MULIA','*',0,'1 A','M101','Fani','2026-07','karakter1',80),
  ('SD-AMAL-MULIA','*',0,'1 A','M102','Gina','2026-07','karakter1',90);

refresh materialized view ypt_k_sekolah_mat;
refresh materialized view ypt_k_aspek_mat;
refresh materialized view ypt_k_indikator_mat;
refresh materialized view ypt_k_siswa_ekstrem_mat;

\echo '--- 1. rata_total tanpa baris nol, jumlah_siswa = murid yang dinilai'
-- avg(80,70,60,90,88) = 77,6 -> 78. Ikut nol: avg atas 8 baris = 58. Murid dinilai = 3 dari 4.
select case when rata_total = 78 and jumlah_siswa = 3
  then 'LULUS: rata 78 dari murid dinilai saja, jumlah_siswa 3'
  else 'GAGAL: rata=' || rata_total || ' jumlah_siswa=' || jumlah_siswa || ' (58/4 berarti nol masih ikut)' end as hasil
from ypt_k_sekolah where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07';

\echo '--- 2. murid nol-semua-aspek tidak masuk peringkat siswa ekstrem'
select case when count(*) = 0
  then 'LULUS: M003 (tidak dinilai) tidak diperingkat'
  else 'GAGAL: M003 masih muncul ' || count(*) || ' baris' end as hasil
from ypt_k_siswa_ekstrem where sekolah_id='SMK-TELKOM-PWT' and murid_id='M003';

\echo '--- 3. murid dinilai sebagian dirata-rata dari aspek terisinya saja'
-- M004: karakter1=0 (tidak dinilai), karakter2=88 -> total 88, bukan 44.
select case when min(total_persen) = 88
  then 'LULUS: M004 bernilai 88 (aspek terisi saja)'
  else 'GAGAL: dapat ' || min(total_persen) || ' (44 berarti nol ikut dirata-rata)' end as hasil
from ypt_k_siswa_ekstrem where sekolah_id='SMK-TELKOM-PWT' and murid_id='M004';

\echo '--- 4. rata per aspek tanpa baris nol'
-- karakter1: 80, 60, dua baris nol dibuang -> 70, murid dinilai 2.
select case when rata = 70 and jumlah_siswa = 2
  then 'LULUS: karakter1 rata 70 dari 2 murid dinilai'
  else 'GAGAL: rata=' || rata || ' jumlah_siswa=' || jumlah_siswa end as hasil
from ypt_k_aspek where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07' and aspek_kode='karakter1';

\echo '--- 5. rata per indikator tanpa baris nol'
-- indikator1_dengar: 75, 55, baris nol M003 dibuang -> 65, murid dinilai 2.
select case when rata = 65 and jumlah_siswa = 2
  then 'LULUS: indikator rata 65 dari 2 murid dinilai'
  else 'GAGAL: rata=' || rata || ' jumlah_siswa=' || jumlah_siswa end as hasil
from ypt_k_indikator
where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07'
  and aspek_kode='karakter1' and indikator_kode='indikator1_dengar';

\echo '--- 6. regresi: sekolah tanpa baris nol tidak berubah'
select case when rata_total = 85 and jumlah_siswa = 2
  then 'LULUS: sekolah bersih tetap 85 dengan 2 murid'
  else 'GAGAL: rata=' || rata_total || ' jumlah_siswa=' || jumlah_siswa end as hasil
from ypt_k_sekolah where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-07';

\echo '--- 7. batas yang disadari: sekolah pekanan, nol di pekan terakhir'
-- karakter_skor_bulanan memilih pekan terakhir yang ada nilainya, dan 0 terhitung "ada nilai".
-- Murid pekanan yang dinilai pekan 1 lalu tercatat 0 di pekan 4 terpilih baris nolnya, lalu
-- dibuang filter matview -> hilang dari agregat bulan itu. Perilaku ini DIPILIH sadar (lihat
-- kepala migration 20260901110000); uji ini mematoknya supaya perubahan diam-diam ketahuan.
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SD-AMAL-MULIA','*',1,'1 A','M103','Hana','2026-08','karakter1',80),
  ('SD-AMAL-MULIA','*',4,'1 A','M103','Hana','2026-08','karakter1',0);
refresh materialized view ypt_k_sekolah_mat;
select case when count(*) = 0
  then 'LULUS: bulan itu kosong untuk sekolah tsb (batas terdokumentasi, bukan rata dari pekan 1)'
  else 'GAGAL: muncul ' || count(*) || ' baris' end as hasil
from ypt_k_sekolah where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-08';
