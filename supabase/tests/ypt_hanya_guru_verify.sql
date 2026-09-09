\set ON_ERROR_STOP on
\pset pager off

-- Dijalankan SESUDAH baseline + migration 20260828110000, 120000, 130000, 20260901100000,
-- 20260901110000, 20260901120000, 20260901130000 pada database bersih. Menulis data, jalankan SEKALI.
--
-- Keadaan awal dari baseline (SMK-TELKOM-PWT, periode 2026-07, semuanya sumber 'guru'):
--   M001 Ahmad: karakter1=80, karakter2=70
--   M002 Budi : karakter1=60, karakter2=90   -> rata guru 75, 2 murid
--   indikator1_dengar: M001=75, M002=55      -> rata guru 65

\echo '--- persiapan: sisipkan penilaian siswa dan orang tua yang nilainya jauh berbeda'
-- Murid berbeda, karena unique index karakter_skor belum menyertakan `sumber` (lihat catatan di
-- kepala migration 20260901130000). Nilainya sengaja ekstrem: kalau ikut terhitung, rata-rata
-- pasti bergeser jauh dan uji di bawah gagal.
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber)
values
  ('SMK-TELKOM-PWT','*',0,'11 RPL','S001','Siswa Refleksi','2026-07','karakter1',10,'siswa'),
  ('SMK-TELKOM-PWT','*',0,'11 RPL','S002','Ortu Refleksi','2026-07','karakter1',20,'orangtua');
insert into karakter_skor_indikator (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, sumber)
values
  ('SMK-TELKOM-PWT','*',0,'11 RPL','S001','Siswa Refleksi','2026-07','karakter1','indikator1_dengar',10,'siswa'),
  ('SMK-TELKOM-PWT','*',0,'11 RPL','S002','Ortu Refleksi','2026-07','karakter1','indikator1_dengar',20,'orangtua');

refresh materialized view ypt_k_sekolah_mat;
refresh materialized view ypt_k_aspek_mat;
refresh materialized view ypt_k_indikator_mat;
refresh materialized view ypt_k_siswa_ekstrem_mat;

\echo '--- 1. rata sekolah tetap dari guru saja'
-- Guru: 80,70,60,90 -> 75, dua murid. Kalau siswa/ortu ikut: (80+70+60+90+10+20)/6 = 55, 4 murid.
select case when rata_total = 75 and jumlah_siswa = 2
  then 'LULUS: rata 75 dari 2 murid, guru saja'
  else 'GAGAL: rata=' || rata_total || ' jumlah_siswa=' || jumlah_siswa || ' (55/4 berarti siswa+ortu ikut)' end as hasil
from ypt_k_sekolah where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07';

\echo '--- 2. rata per aspek tetap dari guru saja'
-- karakter1 guru: 80,60 -> 70. Kalau siswa/ortu ikut: (80+60+10+20)/4 = 42,5 -> 43.
select case when rata = 70 and jumlah_siswa = 2
  then 'LULUS: karakter1 rata 70 dari 2 murid, guru saja'
  else 'GAGAL: rata=' || rata || ' jumlah_siswa=' || jumlah_siswa end as hasil
from ypt_k_aspek where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07' and aspek_kode='karakter1';

\echo '--- 3. rata per indikator tetap dari guru saja'
-- guru: 75,55 -> 65. Kalau siswa/ortu ikut: (75+55+10+20)/4 = 40.
select case when rata = 65 and jumlah_siswa = 2
  then 'LULUS: indikator rata 65 dari 2 murid, guru saja'
  else 'GAGAL: rata=' || rata || ' jumlah_siswa=' || jumlah_siswa end as hasil
from ypt_k_indikator
where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07'
  and aspek_kode='karakter1' and indikator_kode='indikator1_dengar';

\echo '--- 4. murid dari baris siswa/orangtua tidak muncul di peringkat siswa ekstrem'
-- Nilai mereka paling rendah, jadi kalau ikut mereka PASTI menempati Perlu Penguatan.
select case when count(*) = 0
  then 'LULUS: S001/S002 (baris siswa dan orangtua) tidak diperingkat'
  else 'GAGAL: muncul ' || count(*) || ' baris' end as hasil
from ypt_k_siswa_ekstrem where sekolah_id='SMK-TELKOM-PWT' and murid_id in ('S001','S002');

\echo '--- 5. regresi: aturan skor 0 dari migration sebelumnya masih berlaku'
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber)
values ('SMK-TELKOM-PWT','*',0,'11 RPL','M009','Belum Dinilai','2026-07','karakter1',0,'guru');
refresh materialized view ypt_k_sekolah_mat;
select case when rata_total = 75 and jumlah_siswa = 2
  then 'LULUS: murid skor 0 tetap tidak ikut'
  else 'GAGAL: rata=' || rata_total || ' jumlah_siswa=' || jumlah_siswa end as hasil
from ypt_k_sekolah where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07';

\echo '--- 6. sekolah yang datanya murni guru tidak berubah sama sekali'
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber)
values
  ('SD-AMAL-MULIA','*',0,'1 A','M101','Fani','2026-07','karakter1',80,'guru'),
  ('SD-AMAL-MULIA','*',0,'1 A','M102','Gina','2026-07','karakter1',90,'guru');
refresh materialized view ypt_k_sekolah_mat;
select case when rata_total = 85 and jumlah_siswa = 2
  then 'LULUS: sekolah guru-murni tetap 85 dengan 2 murid'
  else 'GAGAL: rata=' || rata_total || ' jumlah_siswa=' || jumlah_siswa end as hasil
from ypt_k_sekolah where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-07';

\echo '--- 7. sekolah PEKANAN tidak tersentuh: tiap pekan tetap berdiri sendiri'
-- Ini menjawab kekhawatiran nyata: migration ini membangun ulang view ypt_k_*, dan sekolah
-- yang menilai per pekan (mis. SD Amal Mulia) datanya dibaca lewat view pekanan yang BERBEDA
-- (karakter_pekan_avg dkk, sumbernya karakter_skor langsung). Uji ini memastikan keduanya
-- benar-benar tidak bersinggungan.
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber)
values
  ('SD-PEKANAN','*',1,'4 A','P001','Rara','2026-08','karakter1',60,'guru'),
  ('SD-PEKANAN','*',2,'4 A','P001','Rara','2026-08','karakter1',70,'guru'),
  ('SD-PEKANAN','*',3,'4 A','P001','Rara','2026-08','karakter1',80,'guru'),
  ('SD-PEKANAN','*',4,'4 A','P001','Rara','2026-08','karakter1',90,'guru');
select case when count(*) = 4 and min(rata) = 60 and max(rata) = 90
  then 'LULUS: empat pekan tetap empat titik terpisah (60..90)'
  else 'GAGAL: dapat ' || count(*) || ' titik, min=' || min(rata) || ' max=' || max(rata) end as hasil
from karakter_pekan_avg where sekolah_id='SD-PEKANAN' and periode_id='2026-08';

\echo '--- 8. angka bulanan sekolah pekanan tetap PEKAN TERAKHIR, bukan rata-rata'
-- Rata-rata seluruh pekan = 75. Aturan yang benar = 90 (pekan 4).
select case when skor = 90
  then 'LULUS: bulanan 90 (pekan terakhir), bukan 75 (rata-rata pekan)'
  else 'GAGAL: dapat ' || skor end as hasil
from karakter_skor_bulanan where sekolah_id='SD-PEKANAN' and periode_id='2026-08';

\echo '--- 9. view pekanan dari migration 20260901120000 masih hidup sesudah migration ini'
select case when (select count(*) from karakter_pekan_tersedia where sekolah_id='SD-PEKANAN') = 4
        and (select count(*) from karakter_murid_pekan_avg where sekolah_id='SD-PEKANAN') = 4
  then 'LULUS: karakter_pekan_tersedia dan karakter_murid_pekan_avg tetap berfungsi'
  else 'GAGAL: pekan_tersedia=' || (select count(*) from karakter_pekan_tersedia where sekolah_id='SD-PEKANAN')
       || ' murid_pekan=' || (select count(*) from karakter_murid_pekan_avg where sekolah_id='SD-PEKANAN') end as hasil;
