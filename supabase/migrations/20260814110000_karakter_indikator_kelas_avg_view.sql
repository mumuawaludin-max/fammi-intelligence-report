-- View agregat indikator per KELAS, dipakai panel "Detail Kelas" tampilan Kepala Sekolah.
--
-- Gejalanya: di Kepala Sekolah, blok "Top 5 indikator terbaik" satu kelas menulis "Belum ada data
-- indikator" padahal kelas yang sama menampilkan indikatornya dengan benar di tampilan Wali Kelas.
--
-- Sebabnya bukan RLS dan bukan data yang hilang. Dua tampilan itu memang mengambil dari sumber
-- yang berbeda:
--   Wali Kelas  -> baris mentah karakter_skor_indikator (selalu ada setelah import).
--   Kepsek      -> kolom top5_indikator_terbaik/top5_indikator_terendah di dalam
--                  karakter_summary.ringkasan, yaitu salinan sheet summary_kelas berkas Excel.
-- Sekolah yang berkas summary_kelas-nya tidak memuat dua kolom itu (SMK Telkom Purwokerto salah
-- satunya) otomatis kosong di Kepsek, dan tidak ada cara memperbaikinya dari sisi tampilan.
--
-- Menghitung rata-ratanya di React melanggar butir 3 CLAUDE.md (FIR tidak menghitung agregat),
-- jadi agregatnya dibuat di database seperti karakter_indikator_sekolah_avg (migration
-- 20260711150000) yang sudah lebih dulu memecahkan masalah yang sama untuk tampilan Yayasan.
-- Bedanya cuma satu kolom di GROUP BY: kelas_id.
--
-- PENTING -- security_invoker = true WAJIB ADA, alasannya sama persis dengan view sekolah:
-- tanpa itu view ini akan bypass RLS untuk semua pemakainya dan membocorkan data kelas lain
-- (atau sekolah lain) ke siapa pun yang bisa SELECT dari view. Dengan security_invoker, view ini
-- transparan terhadap policy karakter_skor_indikator_baca (migration 20260711100000): Kepala
-- Sekolah/Wakil Kepala Sekolah melihat seluruh kelas sekolahnya, Wali Kelas cuma kelas
-- cakupannya, Orang Tua/Siswa cuma anaknya sendiri.

create or replace view public.karakter_indikator_kelas_avg
with (security_invoker = true)
as
select
  sekolah_id,
  kelas_id,
  periode_id,
  aspek_kode,
  indikator_kode,
  round(avg(skor)) as skor
from public.karakter_skor_indikator
group by sekolah_id, kelas_id, periode_id, aspek_kode, indikator_kode;

grant select on public.karakter_indikator_kelas_avg to authenticated;
