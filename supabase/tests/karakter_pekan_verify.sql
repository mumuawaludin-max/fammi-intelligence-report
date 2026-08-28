\set ON_ERROR_STOP on
\pset pager off

-- Dijalankan SESUDAH karakter_kerangka_baseline.sql + kedua migration
-- (20260828110000 lalu 20260828120000), pada database bersih.

\echo '--- 1. Kompatibilitas mundur: baris lama jatuh ke pekan 0'
select case when count(*) = 4 and count(*) filter (where pekan = 0) = 4
  then 'LULUS: seluruh baris lama pekan 0'
  else 'GAGAL: ' || count(*) || ' baris' end as hasil
from karakter_skor where sekolah_id = 'SMK-TELKOM-PWT';

\echo '--- 2. Sekolah tanpa pekan: view bulanan mengembalikan barisnya apa adanya'
select case when count(*) = 4 then 'LULUS: 4 baris bulanan, sama seperti tabel mentah'
  else 'GAGAL: ' || count(*) end as hasil
from karakter_skor_bulanan where sekolah_id = 'SMK-TELKOM-PWT';

\echo '--- 3. Empat penilaian pekanan satu murid boleh masuk semua'
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SD-AMAL-MULIA','Kelas 1',1,'1 Ibnu Kholdun','M001','Cici','2026-10','karakter1',60),
  ('SD-AMAL-MULIA','Kelas 1',2,'1 Ibnu Kholdun','M001','Cici','2026-10','karakter1',70),
  ('SD-AMAL-MULIA','Kelas 1',3,'1 Ibnu Kholdun','M001','Cici','2026-10','karakter1',75),
  ('SD-AMAL-MULIA','Kelas 1',4,'1 Ibnu Kholdun','M001','Cici','2026-10','karakter1',88);
select case when count(*) = 4 then 'LULUS: 4 pekan tersimpan, unique lama tidak menghalangi'
  else 'GAGAL: ' || count(*) end as hasil
from karakter_skor where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-10';

\echo '--- 4. ATURAN INTI: angka bulanan = pekan terakhir (88), BUKAN rata-rata (73)'
select case when skor = 88 and pekan = 4
  then 'LULUS: bulanan = 88 dari pekan 4'
  else 'GAGAL: dapat skor=' || skor || ' pekan=' || pekan || ' (rata-rata akan 73)' end as hasil
from karakter_skor_bulanan
where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-10' and aspek_kode='karakter1';

\echo '--- 5. Pekan terakhir KOSONG: jatuh ke pekan terisi terakhir, bukan jadi kosong sebulan'
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SD-AMAL-MULIA','Kelas 1',1,'1 Ibnu Kholdun','M002','Dodi','2026-10','karakter1',50),
  ('SD-AMAL-MULIA','Kelas 1',2,'1 Ibnu Kholdun','M002','Dodi','2026-10','karakter1',65),
  ('SD-AMAL-MULIA','Kelas 1',3,'1 Ibnu Kholdun','M002','Dodi','2026-10','karakter1',null),
  ('SD-AMAL-MULIA','Kelas 1',4,'1 Ibnu Kholdun','M002','Dodi','2026-10','karakter1',null);
select case when skor = 65 and pekan = 2
  then 'LULUS: murid absen 2 pekan terakhir tetap bernilai 65 dari pekan 2'
  else 'GAGAL: dapat skor=' || coalesce(skor::text,'(kosong)') || ' pekan=' || pekan end as hasil
from karakter_skor_bulanan
where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-10' and murid_id='M002' and aspek_kode='karakter1';

\echo '--- 6. Agregat jenjang memakai pekan terakhir tiap murid, bukan seluruh pekan'
-- Cici pekan terakhir 88, Dodi pekan terisi terakhir 65 -> rata-rata bulanan (88+65)/2 = 77 (dibulatkan).
-- Kalau view salah membaca tabel mentah, rata-ratanya jadi (60+70+75+88+50+65)/6 = 68.
select case when rata = 77 then 'LULUS: rata jenjang 77 (dari pekan terakhir tiap murid)'
  else 'GAGAL: dapat ' || rata || ' (68 berarti masih merata-rata seluruh pekan)' end as hasil
from karakter_jenjang_aspek_avg
where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-10' and aspek_kode='karakter1';

\echo '--- 7. Indeks sekolah juga memakai pekan terakhir'
select case when indeks = 77 then 'LULUS: indeks sekolah 77'
  else 'GAGAL: dapat ' || indeks end as hasil
from karakter_sekolah_indeks where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-10';

\echo '--- 8. Grafik pekanan: tiap pekan punya titiknya sendiri'
select pekan, jumlah_murid, rata from karakter_pekan_aspek_avg
where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-10' and aspek_kode='karakter1'
order by pekan;

\echo '--- 9. Matview YPT ikut memakai pekan terakhir'
select public.refresh_ypt_views();
select case when rata = 77 then 'LULUS: ypt_k_aspek 77'
  else 'GAGAL: dapat ' || rata end as hasil
from ypt_k_aspek_mat where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-10' and aspek_kode='karakter1';

\echo '--- 10. Unique baru menolak dua baris untuk pekan yang sama'
do $blok$
begin
  insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
  values ('SD-AMAL-MULIA','Kelas 1',4,'1 Ibnu Kholdun','M001','Cici','2026-10','karakter1',99);
  raise exception 'GAGAL: duplikat pekan diterima';
exception when unique_violation then
  raise notice 'LULUS: duplikat (murid, periode, pekan, aspek) ditolak';
end $blok$;

\echo '--- 11. RPC menerima pekan dan mengganti SELURUH pekan satu periode'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-AMAL-MULIA','periode_id','2026-10','mode','ganti',
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-AMAL-MULIA','jenjang','Kelas 1','pekan',1,'kelas_id','1 Ibnu Kholdun','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',40,'sumber','guru','status','disetujui'),
    jsonb_build_object('sekolah_id','SD-AMAL-MULIA','jenjang','Kelas 1','pekan',2,'kelas_id','1 Ibnu Kholdun','murid_id','M001','nama_murid','Cici','periode_id','2026-10','aspek_kode','karakter1','skor',45,'sumber','guru','status','disetujui')
  )
)) -> 'pekan' as rpc_kenal_pekan;
select case when count(*) = 2 and max(pekan) = 2
  then 'LULUS: pekan 3 dan 4 lama ikut terhapus, tidak tertinggal'
  else 'GAGAL: ' || count(*) || ' baris, pekan tertinggi ' || max(pekan) end as hasil
from karakter_skor where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-10';

\echo '--- 12. Payload lama tanpa pekan tetap jatuh ke 0'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SMK-TELKOM-PWT','periode_id','2026-09','mode','ganti',
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SMK-TELKOM-PWT','kelas_id','11 RPL','murid_id','M001','nama_murid','Ahmad','periode_id','2026-09','aspek_kode','karakter1','skor',85,'sumber','guru','status','disetujui')
  )
)) -> 'skor' as baris_masuk;
select case when pekan = 0 then 'LULUS: payload tanpa pekan jatuh ke 0' else 'GAGAL: pekan=' || pekan end as hasil
from karakter_skor where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-09';
