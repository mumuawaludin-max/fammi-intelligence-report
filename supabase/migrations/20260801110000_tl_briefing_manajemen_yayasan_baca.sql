-- Bug nyata: dashboard Manajemen (dan Yayasan) untuk School Culture tampil KOSONG TOTAL --
-- bukan cuma kartu tindak lanjut, briefing/Cerita Tim/Suara Tim juga -- karena policy tl_baca
-- dan briefing_baca (20260711113000_rls_tindak_lanjut_scope.sql) dibuat SEBELUM modul School
-- Culture ada (SC baru dibuat 20260722100000). Daftar peran yang diizinkan baca cuma
-- KepalaSekolah/WakilKepalaSekolah/WaliKelas/OrangTua/Siswa -- Manajemen dan Yayasan TIDAK
-- PERNAH ditambahkan, jadi akun dengan peran itu tidak bisa membaca briefing/tindak_lanjut sama
-- sekali, walau statusnya sudah disetujui.
--
-- Manajemen dan Yayasan diberi akses SEKOLAH-WIDE sama seperti KepalaSekolah/WakilKepalaSekolah
-- (bukan dipersempit per scope/scope_id) -- konsisten dengan cakupan mereka di sc_lembaga_baca
-- (20260722100000_sc_tables_and_import.sql) yang sudah lebih dulu memberi keempat peran ini
-- akses sekolah-wide yang sama untuk data mentah SC.
drop policy if exists tl_baca on public.tindak_lanjut;
create policy tl_baca on public.tindak_lanjut
for select to authenticated
using (
  sekolah_id = my_school_id()
  and status = 'disetujui'
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
    or (my_peran() = 'WaliKelas' and scope = 'kelas' and scope_id = any (my_cakupan()) and target_role = 'wali_kelas')
    or (my_peran() = 'OrangTua' and scope = 'murid' and scope_id = my_murid_id())
    or (my_peran() = 'Siswa' and scope = 'murid' and scope_id = my_murid_id())
  )
);

drop policy if exists briefing_baca on public.briefing;
create policy briefing_baca on public.briefing
for select to authenticated
using (
  sekolah_id = my_school_id()
  and status = 'disetujui'
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
    or (my_peran() = 'WaliKelas' and scope = 'kelas' and scope_id = any (my_cakupan()))
    or (my_peran() = 'OrangTua' and scope = 'murid' and scope_id = my_murid_id())
    or (my_peran() = 'Siswa' and scope = 'murid' and scope_id = my_murid_id())
  )
);
