\set ON_ERROR_STOP on
\pset pager off

-- Dijalankan SESUDAH baseline + rantai migration sampai 20260914100000 pada database bersih.
-- Menulis data, jadi jalankan SEKALI per database.
--
-- Keadaan awal dari baseline (periode 2026-07):
--   SMK-TELKOM-PWT  M001 Ahmad: karakter1=80, karakter2=70
--                   M002 Budi : karakter1=60, karakter2=90
--   -> hitungan dari skor: sekolah avg(80,70,60,90) = 75, karakter1 = 70, karakter2 = 80
--   SD-AMAL-MULIA   belum punya skor sama sekali

\echo '--- persiapan: rekap sekolah untuk SMK-TELKOM-PWT, plus tiga sekolah uji bentuk nilai'
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  -- Sekolah TANPA kolom rata_pencapaian_guru: harus jatuh ke rata-rata kolom per karakter.
  ('SD-AMAL-MULIA','*',0,'1 A','M101','Fani','2026-07','karakter1',40),
  ('SD-AMAL-MULIA','*',0,'1 A','M101','Fani','2026-07','karakter2',40),
  ('SD-AMAL-MULIA','*',0,'1 A','M102','Gina','2026-07','karakter1',40),
  ('SD-AMAL-MULIA','*',0,'1 A','M102','Gina','2026-07','karakter2',40);

insert into karakter_summary (sekolah_id, scope, scope_id, periode_id, ringkasan, status)
values
  -- 1. Angka final ada: dipakai apa adanya, bukan 75 hasil hitungan sendiri.
  --    karakter1 di rekap 95 (teks), karakter2 sengaja TIDAK ada di rekap supaya terlihat bahwa
  --    aspek tanpa rekap tetap memakai cadangan.
  --    "Pencapaian_Guru " ditulis dengan huruf besar dan spasi buntut untuk menguji normalisasi
  --    nama kolom sekaligus membuktikan kolom kelengkapan itu tidak pernah terpakai.
  ('SMK-TELKOM-PWT','sekolah','SMK-TELKOM-PWT','2026-07', jsonb_build_object(
      'rata_pencapaian_guru', '88 %',
      'rata_input_guru_karakter1_empati', '95 %',
      'Pencapaian_Guru ', '100 %'
   ), 'disetujui'),
  -- 2. Tanpa rata_pencapaian_guru: rata-rata kolom per karakter = (90 + 70) / 2 = 80.
  --    pencapaian_guru 100% ada di baris ini juga dan harus tetap diabaikan.
  ('SD-AMAL-MULIA','sekolah','SD-AMAL-MULIA','2026-07', jsonb_build_object(
      'pencapaian_guru', '100 %',
      'rata_input_guru_karakter1_jujur', '90 %',
      'rata_input_guru_karakter2_disiplin', '70 %'
   ), 'disetujui');

refresh materialized view ypt_k_sekolah_mat;
refresh materialized view ypt_k_aspek_mat;

\echo '--- 1. rata_total dibaca dari rekap, bukan dihitung ulang dari skor'
select case when rata_total = 88 and jumlah_siswa = 2
  then 'LULUS: rata_total 88 dari rekap, jumlah_siswa tetap 2 dari skor'
  else 'GAGAL: rata_total=' || rata_total || ' jumlah_siswa=' || jumlah_siswa
       || ' (75 berarti masih menghitung sendiri)' end as hasil
from ypt_k_sekolah where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07';

\echo '--- 2. tanpa rata_pencapaian_guru: rata-rata kolom per karakter, BUKAN pencapaian_guru'
select case when rata_total = 80
  then 'LULUS: rata_total 80 = rata-rata (90, 70)'
  else 'GAGAL: rata_total=' || rata_total
       || ' (100 berarti pencapaian_guru/kelengkapan ikut terpakai, 40 berarti rekap diabaikan)' end as hasil
from ypt_k_sekolah where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-07';

\echo '--- 3. nilai per karakter ikut rekap kalau ada, cadangan kalau tidak'
select case when
  (select rata from ypt_k_aspek where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07' and aspek_kode='karakter1') = 95
  and (select rata from ypt_k_aspek where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07' and aspek_kode='karakter2') = 80
  then 'LULUS: karakter1 95 dari rekap, karakter2 80 dari skor (rekap tidak punya kolomnya)'
  else 'GAGAL: karakter1='
       || coalesce((select rata::text from ypt_k_aspek where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07' and aspek_kode='karakter1'),'NULL')
       || ' karakter2='
       || coalesce((select rata::text from ypt_k_aspek where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07' and aspek_kode='karakter2'),'NULL')
  end as hasil;

\echo '--- 4. label dan jumlah_siswa per aspek tidak ikut berubah'
select case when aspek_label = 'Empati' and jumlah_siswa = 2
  then 'LULUS: aspek_label dan jumlah_siswa tetap dari config/skor'
  else 'GAGAL: aspek_label=' || coalesce(aspek_label,'NULL') || ' jumlah_siswa=' || jumlah_siswa end as hasil
from ypt_k_aspek where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07' and aspek_kode='karakter1';

\echo '--- 5. ypt_pct membaca semua bentuk nilai yang nyata ada di berkas'
select case when
      public.ypt_pct(to_jsonb('95 %'::text))    = 95
  and public.ypt_pct(to_jsonb('99,79%'::text))  = 100
  and public.ypt_pct(to_jsonb('84,67 %'::text)) = 85
  and public.ypt_pct(to_jsonb(0.91::numeric))   = 91
  and public.ypt_pct(to_jsonb(1::numeric))      = 100
  and public.ypt_pct(to_jsonb(95::numeric))     = 95
  and public.ypt_pct(to_jsonb(''::text))        is null
  and public.ypt_pct(to_jsonb('-'::text))       is null
  and public.ypt_pct('null'::jsonb)             is null
  then 'LULUS: teks berkoma, pecahan Excel, angka biasa, dan nilai kosong semuanya benar'
  else 'GAGAL: 95%=' || coalesce(public.ypt_pct(to_jsonb('95 %'::text))::text,'NULL')
       || ' 99,79%=' || coalesce(public.ypt_pct(to_jsonb('99,79%'::text))::text,'NULL')
       || ' 84,67%=' || coalesce(public.ypt_pct(to_jsonb('84,67 %'::text))::text,'NULL')
       || ' 0.91='   || coalesce(public.ypt_pct(to_jsonb(0.91::numeric))::text,'NULL')
       || ' 1='      || coalesce(public.ypt_pct(to_jsonb(1::numeric))::text,'NULL')
       || ' ''-''='  || coalesce(public.ypt_pct(to_jsonb('-'::text))::text,'NULL')
  end as hasil;

\echo '--- 6. regresi: sekolah-bulan tanpa rekap tetap memakai hitungan dari skor'
insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor)
values
  ('SMK-TELKOM-PWT','*',0,'11 RPL','M001','Ahmad','2026-08','karakter1',60),
  ('SMK-TELKOM-PWT','*',0,'11 RPL','M001','Ahmad','2026-08','karakter2',80);
refresh materialized view ypt_k_sekolah_mat;
select case when rata_total = 70
  then 'LULUS: periode tanpa rekap tetap 70 dari skor'
  else 'GAGAL: rata_total=' || coalesce(rata_total::text,'NULL') || ' (harusnya 70)' end as hasil
from ypt_k_sekolah where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-08';

\echo '--- 7. rekap tanpa skor sama sekali tidak memunculkan periode baru'
insert into karakter_summary (sekolah_id, scope, scope_id, periode_id, ringkasan, status)
values ('SMK-TELKOM-PWT','sekolah','SMK-TELKOM-PWT','2026-09',
        jsonb_build_object('rata_pencapaian_guru','77 %'), 'disetujui');
refresh materialized view ypt_k_sekolah_mat;
select case when count(*) = 0
  then 'LULUS: 2026-09 tidak muncul (tidak ada skor, jadi bukan periode berdata)'
  else 'GAGAL: 2026-09 muncul ' || count(*) || ' baris dengan jumlah_siswa 0' end as hasil
from ypt_k_sekolah where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-09';

\echo '--- 8. baris rekap ganda: yang terakhir masuk yang menang'
insert into karakter_summary (sekolah_id, scope, scope_id, periode_id, ringkasan, status)
values ('SMK-TELKOM-PWT','sekolah','SMK-TELKOM-PWT','2026-07',
        jsonb_build_object('rata_pencapaian_guru','66 %'), 'disetujui');
refresh materialized view ypt_k_sekolah_mat;
select case when rata_total = 66
  then 'LULUS: rekap terakhir (66) menang atas rekap lama (88)'
  else 'GAGAL: rata_total=' || coalesce(rata_total::text,'NULL') || ' (harusnya 66)' end as hasil
from ypt_k_sekolah where sekolah_id='SMK-TELKOM-PWT' and periode_id='2026-07';

\echo '--- 9. rekap scope kelas/jenjang tidak boleh ikut terbaca'
insert into karakter_summary (sekolah_id, scope, scope_id, periode_id, ringkasan, status)
values ('SD-AMAL-MULIA','kelas','1 A','2026-07',
        jsonb_build_object('rata_pencapaian_guru','11 %'), 'disetujui');
refresh materialized view ypt_k_sekolah_mat;
select case when rata_total = 80
  then 'LULUS: baris scope=kelas diabaikan, tetap 80'
  else 'GAGAL: rata_total=' || coalesce(rata_total::text,'NULL') || ' (11 berarti scope tidak disaring)' end as hasil
from ypt_k_sekolah where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-07';

\echo '--- 10. tingkat 3 (pencapaian_guru) dipakai HANYA kalau tingkat 1 dan 2 tidak ada'
-- Bukan untuk membenarkan kolom kelengkapan, melainkan supaya aturannya identik dengan
-- nilaiGuruSekolah() di React: baris rekap yang sama harus memberi angka yang sama di dua layar.
update karakter_summary
   set ringkasan = jsonb_build_object('pencapaian_guru', '55 %')
 where sekolah_id = 'SD-AMAL-MULIA' and scope = 'sekolah' and periode_id = '2026-07';
refresh materialized view ypt_k_sekolah_mat;
select case when rata_total = 55
  then 'LULUS: tanpa tingkat 1 dan 2, pencapaian_guru dipakai (sama dengan React)'
  else 'GAGAL: rata_total=' || coalesce(rata_total::text,'NULL') || ' (harusnya 55)' end as hasil
from ypt_k_sekolah where sekolah_id='SD-AMAL-MULIA' and periode_id='2026-07';

\echo '--- 11. view rekap internal tidak boleh terbaca role authenticated'
select case when count(*) = 0
  then 'LULUS: ypt_rekap_* tidak di-grant ke authenticated'
  else 'GAGAL: ' || count(*) || ' view rekap internal bisa dibaca authenticated' end as hasil
from information_schema.role_table_grants
where grantee = 'authenticated'
  and table_name in ('ypt_rekap_kolom','ypt_rekap_sekolah_guru','ypt_rekap_aspek_guru');
