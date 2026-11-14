-- AdminFammi boleh MEMBACA mi_hasil lewat browser (hanya select, tidak menulis).
--
-- Akar masalah (ditemukan 2026-11-14 saat unggah MI susulan Daarut Tauhiid): policy
-- mi_hasil_baca (20260711100000) hanya membuka baris ke peran yang sekolah_id-nya cocok.
-- AdminFammi tidak terikat satu sekolah, jadi query browser CMS ke mi_hasil selalu balik NOL
-- BARIS tanpa error. Importer MI (loadExistingMiMuridIds, miImporter.js) membaca mi_hasil dari
-- browser untuk mencocokkan nama siswa lama dan melanjutkan nomor murid_id. Dengan nol baris:
--   1. siswa lama tidak dikenali, jadi diunggah ulang dapat murid_id baru (laporan ganda);
--   2. siswa baru dapat nomor mulai dari M001 dan bentrok dengan siswa lain. Bila draf itu
--      disetujui, laporan tayang siswa lama (sekolah, murid, periode sama) ditolak otomatis dan
--      diganti laporan siswa yang berbeda. generate-mi sekarang menolak kasus ini (409), tapi
--      penyebabnya diperbaiki di sini.
--
-- Pola sama dengan tl_admin_baca, briefing_admin_baca, sc_lembaga_admin_baca (aturan di
-- 20260711140000: AdminFammi tetap bisa membaca semuanya lewat browser untuk CMS). Jalur baca
-- FIR tidak berubah: peran lain tetap lewat mi_hasil_baca. Penulisan tetap lewat Edge Function
-- (service_role). Dibungkus (select ...) supaya dievaluasi sekali per query, bukan per baris.

drop policy if exists mi_hasil_admin_baca on public.mi_hasil;
create policy mi_hasil_admin_baca on public.mi_hasil
as permissive for select to authenticated
using ((select public.is_admin_fammi()));
