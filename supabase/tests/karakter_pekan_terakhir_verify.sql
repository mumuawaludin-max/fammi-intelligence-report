\set ON_ERROR_STOP on
\pset pager off

-- Dijalankan SESUDAH baseline + ketiga migration (20260828110000, 120000, 130000) pada
-- database bersih. Menulis data, jadi jalankan SEKALI per database.

\echo '--- 1. Bulan yang isinya campur pekanan dan bulanan: yang bulanan menang'
-- Inilah satu-satunya keadaan yang membedakan migration ini dari yang sebelumnya. Sebelum
-- perbaikan, pekan desc memilih pekan 3 (nilai 75) dan mengabaikan baris bulanan (nilai 91).
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SD-X','Kelas 1',1,'1 A','M001','Cici','2026-10','karakter1',60),
  ('SD-X','Kelas 1',2,'1 A','M001','Cici','2026-10','karakter1',70),
  ('SD-X','Kelas 1',3,'1 A','M001','Cici','2026-10','karakter1',75),
  ('SD-X','Kelas 1',0,'1 A','M001','Cici','2026-10','karakter1',91);
select case when skor = 91 and pekan = 0
  then 'LULUS: baris bulanan (91) menang atas pekan 3 (75)'
  else 'GAGAL: dapat skor=' || skor || ' pekan=' || pekan end as hasil
from karakter_skor_bulanan where sekolah_id='SD-X' and periode_id='2026-10';

\echo '--- 2. Bulan yang isinya pekanan saja: tetap pekan tertinggi'
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SD-X','Kelas 1',1,'1 A','M001','Cici','2026-11','karakter1',50),
  ('SD-X','Kelas 1',4,'1 A','M001','Cici','2026-11','karakter1',88);
select case when skor = 88 and pekan = 4 then 'LULUS: pekan 4 menang'
  else 'GAGAL: skor=' || skor || ' pekan=' || pekan end as hasil
from karakter_skor_bulanan where sekolah_id='SD-X' and periode_id='2026-11';

\echo '--- 3. Baris bulanan tetap menang atas pekan 5'
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SD-X','Kelas 1',5,'1 A','M001','Cici','2026-12','karakter1',30),
  ('SD-X','Kelas 1',0,'1 A','M001','Cici','2026-12','karakter1',77);
select case when skor = 77 then 'LULUS: bulanan menang atas pekan 5'
  else 'GAGAL: dapat ' || skor end as hasil
from karakter_skor_bulanan where sekolah_id='SD-X' and periode_id='2026-12';

\echo '--- 4. Sekolah bulanan murni (semua pekan 0) tidak berubah'
select case when count(*) = 4 and count(*) filter (where pekan = 0) = 4
  then 'LULUS: sekolah lama tetap 4 baris, semuanya pekan 0'
  else 'GAGAL: ' || count(*) end as hasil
from karakter_skor_bulanan where sekolah_id='SMK-TELKOM-PWT';

\echo '--- 5. Slot grafik: penilaian bulanan diletakkan di pekan 4'
select case when count(*) filter (where pekan = 0 and pekan_urut = 4) > 0
              and count(*) filter (where pekan > 0 and pekan_urut <> pekan) = 0
  then 'LULUS: pekan 0 -> slot 4, pekan lain apa adanya'
  else 'GAGAL' end as hasil
from karakter_pekan_avg where sekolah_id='SD-X';

\echo '--- 6. Garis tren menyambung lintas bulan, urut periode lalu slot pekan'
select periode_id, pekan, pekan_urut, jumlah_murid, rata
from karakter_pekan_avg where sekolah_id='SD-X'
order by periode_id, pekan_urut;

\echo '--- 7. karakter_pekan_avg bukan rata-rata dari rata-rata per aspek'
-- Dua aspek dengan jumlah murid berbeda di pekan yang sama. Rata-rata seluruh baris =
-- (40+60+90)/3 = 63. Rata-rata dari rata-rata per aspek = (50+90)/2 = 70. Yang benar 63.
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SD-Y','Kelas 1',1,'1 A','M001','A','2027-01','karakter1',40),
  ('SD-Y','Kelas 1',1,'1 A','M002','B','2027-01','karakter1',60),
  ('SD-Y','Kelas 1',1,'1 A','M001','A','2027-01','karakter2',90);
select case when rata = 63 then 'LULUS: 63 (rata-rata seluruh baris)'
  else 'GAGAL: dapat ' || rata || ' (70 berarti merata-ratakan rata-rata per aspek)' end as hasil
from karakter_pekan_avg where sekolah_id='SD-Y' and periode_id='2027-01' and pekan=1;

\echo '--- 8. Agregat bulanan ikut memakai aturan baru'
select case when rata = 91 then 'LULUS: rata jenjang 91 (dari baris bulanan)'
  else 'GAGAL: dapat ' || rata end as hasil
from karakter_jenjang_aspek_avg
where sekolah_id='SD-X' and periode_id='2026-10' and aspek_kode='karakter1';
