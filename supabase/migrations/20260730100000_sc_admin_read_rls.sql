-- Bug nyata yang ditemukan lewat data produksi: panel "Rekomendasi School Culture" di CMS
-- (useAdminCmsData.js) SELALU kosong untuk SEMUA sekolah, apa pun isi datanya -- bukan cuma
-- soal briefing yang belum digenerate (perbaikan sebelumnya, commit 8cb6956), tapi karena
-- AdminFammi TIDAK PERNAH bisa membaca tabel sc_lembaga lewat browser sama sekali.
--
-- Akar masalahnya: migration 20260711140000_narrow_admin_write_rls.sql menambahkan policy
-- "<tabel>_admin_baca (is_admin_fammi())" ke tindak_lanjut/briefing/schools/profiles/dkk supaya
-- AdminFammi tetap bisa membaca semuanya lewat browser (dipakai CMS untuk daftar/monitor) --
-- itu migration tanggal 2026-07-11, SEBELUM sc_personal/sc_lembaga dibuat (2026-07-22,
-- 20260722100000_sc_tables_and_import.sql). Policy baca sc_lembaga/sc_personal yang dibuat saat
-- itu cuma mengizinkan KepalaSekolah/WakilKepalaSekolah/Manajemen/Yayasan yang school_id-nya
-- cocok -- AdminFammi (yang school_id sesi-nya NULL, tidak terikat satu sekolah) tidak pernah
-- cocok kondisi itu, jadi query browser CMS ke sc_lembaga selalu balik NOL BARIS tanpa error
-- (RLS memfilter diam-diam, bukan menolak dengan pesan) -- persis kenapa "Rekomendasi School
-- Culture" tampak kosong walau datanya lengkap di database.
--
-- Tidak berdampak ke jalur admin-actions Edge Function (service_role selalu bypass RLS) --
-- PersetujuanSc.jsx/Upload.jsx sudah benar karena keduanya lewat admin-actions, bukan baca
-- langsung. Cuma useAdminCmsData.js (fetchAll, panel rekomendasi) yang kena, itu satu-satunya
-- baca langsung sc_lembaga dari browser di seluruh kode CMS.
drop policy if exists sc_lembaga_admin_baca on public.sc_lembaga;
create policy sc_lembaga_admin_baca on public.sc_lembaga
for select to authenticated
using (is_admin_fammi());

-- sc_personal belum ada baca langsung dari browser CMS saat ini, tapi ditambahkan sekaligus
-- supaya konsisten dengan aturan yang didokumentasikan migration 20260711140000 ("AdminFammi
-- tetap bisa membaca semuanya lewat browser") dan mencegah jebakan yang sama terulang kalau ada
-- fitur CMS baru nanti yang butuh baca sc_personal langsung.
drop policy if exists sc_personal_admin_baca on public.sc_personal;
create policy sc_personal_admin_baca on public.sc_personal
for select to authenticated
using (is_admin_fammi());
