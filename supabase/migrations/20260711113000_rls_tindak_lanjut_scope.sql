-- Perketat RLS: batasi baca tindak_lanjut dan briefing sampai ke scope yang relevan
-- (kelas cakupan / anak sendiri), bukan cuma sekolah + status.
--
-- Temuan Fase A2 (Temuan B, lihat docs/Rencana_Perbaikan_FIR_2026-07.md dan
-- docs/Audit_Data_dan_Keamanan_FIR_2026-07.md): policy tl_baca dan briefing_baca cuma
-- memfilter sekolah_id + status='disetujui', tidak sampai scope/scope_id/target_role. Wali
-- Kelas bisa membaca tindak lanjut level Kepala Sekolah sekolahnya dan tindak lanjut kelas
-- lain lewat REST langsung; Orang Tua/Siswa demikian juga. Kode React sudah menyaring lebih
-- lanjut (.eq("target_role","wali_kelas"), .in("scope_id", kelasList)), tapi itu kosmetik,
-- persis pola Temuan A.
--
-- Data live diverifikasi dulu lewat SQL Editor sebelum migration ini ditulis: seluruh isi
-- tindak_lanjut saat ini cuma dua kombinasi, scope='kelas'+target_role='wali_kelas' dan
-- scope='sekolah'+target_role='kepala_sekolah' -- tidak ada baris target_role kosong, belum
-- ada baris modul 'mi'. Tabel briefing kosong sama sekali (0 baris). Migration ini karena itu
-- tidak berisiko menyembunyikan data nyata yang sudah tayang.
--
-- Kepala Sekolah/Wakil TIDAK dipersempit (sekolah-wide, konsisten dengan Temuan A dan akses
-- mereka yang sudah tidak dibatasi di karakter_skor dkk). Policy _baca_yayasan TIDAK disentuh,
-- konsisten dengan keputusan Temuan A: Yayasan sudah dirancang punya akses lebih luas lintas
-- sekolah untuk data mentahnya juga (karakter_pernyataan_ortu dst).
--
-- Orang Tua/Siswa SENGAJA tidak disyaratkan target_role tertentu (cuma scope='murid' + milik
-- sendiri) karena belum ada data nyata untuk memastikan konvensinya -- salah tebak bisa
-- menyembunyikan konten yang seharusnya tampil begitu fitur murid/orang tua mulai dipakai.
-- briefing tidak punya kolom target_role sama sekali (dicek dari skema), jadi policy-nya
-- cuma sampai scope/scope_id.

drop policy if exists tl_baca on public.tindak_lanjut;
create policy tl_baca on public.tindak_lanjut
for select to authenticated
using (
  sekolah_id = my_school_id()
  and status = 'disetujui'
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah')
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
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah')
    or (my_peran() = 'WaliKelas' and scope = 'kelas' and scope_id = any (my_cakupan()))
    or (my_peran() = 'OrangTua' and scope = 'murid' and scope_id = my_murid_id())
    or (my_peran() = 'Siswa' and scope = 'murid' and scope_id = my_murid_id())
  )
);
