\set ON_ERROR_STOP on
\pset pager off

\echo '--- 1. Kompatibilitas mundur: sekolah lama semua jenjang = bintang'
select case when count(*) = 4 and count(*) filter (where jenjang = '*') = 4
  then 'LULUS: 4 baris skor lama, semuanya jenjang *'
  else 'GAGAL: ' || count(*) || ' baris' end as hasil
from karakter_skor where sekolah_id = 'SMK-TELKOM-PWT';

\echo '--- 2. Nama karakter sekolah lama tetap terbaca lewat view kerangka'
select case when count(*) = 2 and bool_and(aspek_label is not null) and bool_and(not tanpa_nama)
  then 'LULUS: Empati + Inisiatif masih bernama'
  else 'GAGAL: ' || string_agg(coalesce(aspek_label,'(null)'), ', ') end as hasil
from karakter_kerangka where sekolah_id = 'SMK-TELKOM-PWT';

\echo '--- 3. Unique lama benar-benar hilang, unique baru terpasang'
select case when count(*) filter (where indexname = 'karakter_aspek_config_sekolah_jenjang_aspek_key') = 1
              and count(*) filter (where indexname = 'karakter_aspek_config_sekolah_id_aspek_kode_key') = 0
              and count(*) filter (where indexname = 'karakter_indikator_config_uniq') = 0
  then 'LULUS: unique lama dibuang, unique baru ada'
  else 'GAGAL: ' || string_agg(indexname, ', ') end as hasil
from pg_indexes where tablename in ('karakter_aspek_config','karakter_indikator_config');

\echo '--- 4. Sekolah baru: karakter3 boleh ada di enam jenjang sekaligus'
insert into karakter_aspek_config (sekolah_id, jenjang, aspek_kode, aspek_label, urutan) values
  ('SD-AMAL-MULIA','Kelas 1','karakter3','Sehat Bersih Dan Rapi',3),
  ('SD-AMAL-MULIA','Kelas 2','karakter3','Percaya Diri Dan Rendah Hati',3),
  ('SD-AMAL-MULIA','Kelas 3','karakter3','Tidak Merundung',3),
  ('SD-AMAL-MULIA','Kelas 4','karakter3','Senang Belajar Disiplin Dan Mandiri',3),
  ('SD-AMAL-MULIA','Kelas 5','karakter3','Percaya Diri Tetapi Rendah Hati',3),
  ('SD-AMAL-MULIA','Kelas 6','karakter3','Senang Belajar Disiplin Dan Mandiri',3),
  ('SD-AMAL-MULIA','Kelas 3','karakter4','Senang Belajar Disiplin Dan Mandiri',4);
select 'LULUS: 7 baris config per jenjang masuk, unique baru tidak menghalangi' as hasil;

\echo '--- 5. Nama sama di jenjang berbeda tetap boleh, dan kode-nya boleh berbeda'
select case when count(*) = 3 then 'LULUS: nama yang sama muncul 3x di jenjang/kode berbeda'
  else 'GAGAL: ' || count(*) end as hasil
from karakter_aspek_config
where sekolah_id='SD-AMAL-MULIA' and aspek_label = 'Senang Belajar Disiplin Dan Mandiri';

\echo '--- 6. Unique baru MENOLAK duplikat sekolah+jenjang+kode'
do $blok$
begin
  insert into karakter_aspek_config (sekolah_id, jenjang, aspek_kode, aspek_label, urutan)
  values ('SD-AMAL-MULIA','Kelas 1','karakter3','Duplikat',9);
  raise exception 'GAGAL: duplikat diterima';
exception when unique_violation then
  raise notice 'LULUS: duplikat (sekolah, jenjang, kode) ditolak';
end $blok$;

\echo '--- 7. RPC import: baris per jenjang masuk dengan jenjangnya masing-masing'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-AMAL-MULIA', 'periode_id','2026-02', 'mode','ganti',
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-AMAL-MULIA','jenjang','Kelas 1','kelas_id','1 Ibnu Kholdun','murid_id','M001','nama_murid','Cici','periode_id','2026-02','aspek_kode','karakter3','skor',80,'sumber','guru','status','disetujui'),
    jsonb_build_object('sekolah_id','SD-AMAL-MULIA','jenjang','Kelas 6','kelas_id','6 Zaid','murid_id','M002','nama_murid','Dodi','periode_id','2026-02','aspek_kode','karakter3','skor',60,'sumber','guru','status','disetujui')
  )
)) -> 'skor' as baris_skor_masuk;

select case when count(distinct jenjang) = 2 then 'LULUS: dua jenjang tersimpan terpisah'
  else 'GAGAL' end as hasil
from karakter_skor where sekolah_id='SD-AMAL-MULIA';

\echo '--- 8. Payload TANPA jenjang tetap jatuh ke bintang (kompatibilitas payload lama)'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SMK-TELKOM-PWT', 'periode_id','2026-08', 'mode','ganti',
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SMK-TELKOM-PWT','kelas_id','11 RPL','murid_id','M001','nama_murid','Ahmad','periode_id','2026-08','aspek_kode','karakter1','skor',85,'sumber','guru','status','disetujui')
  )
)) -> 'jenjang' as cakupan_hapus;
select case when jenjang = '*' then 'LULUS: payload tanpa jenjang jatuh ke *' else 'GAGAL: ' || jenjang end as hasil
from karakter_skor where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-08';

\echo '--- 9. DELETE per jenjang tidak menyentuh jenjang lain'
select import_karakter_periode(jsonb_build_object(
  'sekolah_id','SD-AMAL-MULIA', 'periode_id','2026-02', 'mode','ganti', 'jenjang','Kelas 1',
  'skor_rows', jsonb_build_array(
    jsonb_build_object('sekolah_id','SD-AMAL-MULIA','jenjang','Kelas 1','kelas_id','1 Ibnu Kholdun','murid_id','M001','nama_murid','Cici','periode_id','2026-02','aspek_kode','karakter3','skor',95,'sumber','guru','status','disetujui')
  )
)) -> 'skor' as baris_masuk;
select case when count(*) filter (where jenjang='Kelas 6') = 1 and count(*) filter (where jenjang='Kelas 1' and skor=95) = 1
  then 'LULUS: Kelas 6 selamat, Kelas 1 tergantikan'
  else 'GAGAL' end as hasil
from karakter_skor where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-02';

\echo '--- 10. ypt_k_aspek TIDAK menggandakan baris untuk sekolah per jenjang'
select public.refresh_ypt_views();
select case when count(*) = count(distinct (sekolah_id, jenjang, periode_id, aspek_kode))
  then 'LULUS: satu baris per sekolah+jenjang+periode+aspek, tidak ada penggandaan'
  else 'GAGAL: ada baris ganda' end as hasil
from ypt_k_aspek_mat;
select sekolah_id, jenjang, aspek_kode, aspek_label, rata from ypt_k_aspek_mat order by 1,2,3;

\echo '--- 11. Indeks sekolah menggabungkan seluruh jenjang jadi satu angka'
select sekolah_id, periode_id, jumlah_murid, jumlah_jenjang, indeks from karakter_sekolah_indeks order by 1,2;
