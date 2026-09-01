\set ON_ERROR_STOP on
\pset pager off

-- Dijalankan SESUDAH baseline + keempat migration (110000, 120000, 130000, 20260901100000)
-- pada database bersih. Menulis data, jalankan SEKALI per database.

\echo '--- 1. Unggah P1, lalu unggah P2 saja: P1 HARUS selamat'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-X','periode_id','2026-10','mode','ganti','pekan_list', jsonb_build_array(1),
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-X','jenjang','Kelas 1','pekan',1,'kelas_id','1 A','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',60,'sumber','guru','status','disetujui')
  )
)) -> 'skor' as p1_masuk;

select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-X','periode_id','2026-10','mode','ganti','pekan_list', jsonb_build_array(2),
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-X','jenjang','Kelas 1','pekan',2,'kelas_id','1 A','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',70,'sumber','guru','status','disetujui')
  )
)) -> 'skor' as p2_masuk;

select case when count(*) = 2 and count(*) filter (where pekan = 1 and skor = 60) = 1
                              and count(*) filter (where pekan = 2 and skor = 70) = 1
  then 'LULUS: P1 (60) selamat, P2 (70) masuk'
  else 'GAGAL: ' || string_agg('P' || pekan || '=' || skor, ', ' order by pekan) end as hasil
from karakter_skor where sekolah_id='SD-X' and periode_id='2026-10';

\echo '--- 2. Angka bulanan ikut pekan terakhir yang baru masuk'
select case when skor = 70 and pekan = 2 then 'LULUS: bulanan 70 dari P2'
  else 'GAGAL: skor=' || skor || ' pekan=' || pekan end as hasil
from karakter_skor_bulanan where sekolah_id='SD-X' and periode_id='2026-10';

\echo '--- 3. Unggah ulang P1 dengan nilai baru: cuma P1 yang berubah'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-X','periode_id','2026-10','mode','ganti','pekan_list', jsonb_build_array(1),
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-X','jenjang','Kelas 1','pekan',1,'kelas_id','1 A','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',65,'sumber','guru','status','disetujui')
  )
)) -> 'skor' as p1_ulang;
select case when count(*) = 2 and count(*) filter (where pekan = 1 and skor = 65) = 1
                              and count(*) filter (where pekan = 2 and skor = 70) = 1
  then 'LULUS: P1 jadi 65, P2 tetap 70'
  else 'GAGAL: ' || string_agg('P' || pekan || '=' || skor, ', ' order by pekan) end as hasil
from karakter_skor where sekolah_id='SD-X' and periode_id='2026-10';

\echo '--- 4. Berkas dua pekan sekaligus: keduanya diganti, pekan lain tetap'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-X','periode_id','2026-10','mode','ganti','pekan_list', jsonb_build_array(1,2),
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-X','jenjang','Kelas 1','pekan',1,'kelas_id','1 A','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',10,'sumber','guru','status','disetujui'),
    jsonb_build_object('sekolah_id','SD-X','jenjang','Kelas 1','pekan',2,'kelas_id','1 A','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',20,'sumber','guru','status','disetujui'),
    jsonb_build_object('sekolah_id','SD-X','jenjang','Kelas 1','pekan',3,'kelas_id','1 A','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',30,'sumber','guru','status','disetujui')
  )
)) -> 'skor' as tiga_masuk;
select case when count(*) = 3 then 'LULUS: 3 pekan tersimpan' else 'GAGAL: ' || count(*) end as hasil
from karakter_skor where sekolah_id='SD-X' and periode_id='2026-10';

\echo '--- 5. TANPA pekan_list: sapu bersih seluruh bulan (perilaku lama, jalur "ganti seluruh bulan")'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-X','periode_id','2026-10','mode','ganti',
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-X','jenjang','Kelas 1','pekan',4,'kelas_id','1 A','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',88,'sumber','guru','status','disetujui')
  )
)) -> 'pekan_diganti' as cakupan;
select case when count(*) = 1 and max(pekan) = 4
  then 'LULUS: pekan 1-3 tersapu, tinggal P4'
  else 'GAGAL: ' || count(*) || ' baris tersisa' end as hasil
from karakter_skor where sekolah_id='SD-X' and periode_id='2026-10';

\echo '--- 6. pekan_list kosong diperlakukan seperti tidak disebut (bukan hapus nol pekan)'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-X','periode_id','2026-10','mode','ganti','pekan_list', jsonb_build_array(),
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-X','jenjang','Kelas 1','pekan',5,'kelas_id','1 A','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',77,'sumber','guru','status','disetujui')
  )
)) -> 'pekan_diganti' as cakupan_kosong;
select case when count(*) = 1 and max(pekan) = 5
  then 'LULUS: array kosong jatuh ke sapu bersih, tidak menggandakan'
  else 'GAGAL: ' || count(*) || ' baris' end as hasil
from karakter_skor where sekolah_id='SD-X' and periode_id='2026-10';

\echo '--- 7. Sekolah bulanan (pekan 0) tidak berubah perilakunya'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SMK-TELKOM-PWT','periode_id','2026-09','mode','ganti','pekan_list', jsonb_build_array(0),
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SMK-TELKOM-PWT','kelas_id','11 RPL','murid_id','M001','nama_murid','Ahmad','periode_id','2026-09','aspek_kode','karakter1','skor',85,'sumber','guru','status','disetujui')
  )
)) -> 'skor' as bulanan_masuk;
select case when count(*) = 1 and max(pekan) = 0 and max(skor) = 85
  then 'LULUS: berkas bulanan tetap satu baris pekan 0'
  else 'GAGAL' end as hasil
from karakter_skor where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-09';

\echo '--- 8. Periode LAIN tidak pernah tersentuh'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-X','periode_id','2026-11','mode','ganti','pekan_list', jsonb_build_array(1),
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-X','jenjang','Kelas 1','pekan',1,'kelas_id','1 A','murid_id','M001','nama_murid','Cici','periode_id','2026-11','aspek_kode','karakter1','skor',99,'sumber','guru','status','disetujui')
  )
)) -> 'skor' as bulan_lain;
select case when count(*) filter (where periode_id='2026-10') = 1
              and count(*) filter (where periode_id='2026-11') = 1
  then 'LULUS: Oktober dan November berdiri sendiri'
  else 'GAGAL' end as hasil
from karakter_skor where sekolah_id='SD-X';
