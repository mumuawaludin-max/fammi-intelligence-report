-- Tambah peran 'Manajemen' untuk modul Corporate Culture & Wellbeing (CW).
--
-- Kenapa peran baru, bukan pakai KepalaSekolah yang sudah ada: CW menilai budaya kerja dan
-- kesejahteraan STAF (guru/karyawan mengisi asesmen tentang lembaganya sendiri), bukan capaian
-- murid. Secara konsep itu domain terpisah dari hierarki akademik -- pimpinan yang membaca
-- laporan budaya kerja belum tentu orang yang sama dengan yang membaca rapor karakter murid,
-- dan sebaliknya. Cakupannya sekolah-wide, sama seperti KepalaSekolah.
--
-- Migration ini SENGAJA cuma menambah nilai yang sah di constraint. Policy RLS untuk tabel CW
-- (cw_* di docs/cw-module-design-spec.md bagian 6) belum ditulis karena tabelnya sendiri belum
-- ada -- jangan menulis policy spekulatif untuk tabel yang skemanya belum final.
--
-- Manajemen sengaja TIDAK ditambahkan ke policy RLS modul Karakter (karakter_skor,
-- karakter_skor_indikator, karakter_pernyataan_ortu, mi_hasil, tindak_lanjut, briefing) --
-- peran ini tidak punya kepentingan baca data murid, jadi biarkan tertutup secara default.
-- Kalau nanti Manajemen memang perlu baca tindak_lanjut/briefing modul CW, itu ditambahkan
-- bareng migration tabel CW-nya, dengan filter modul = 'cw' yang eksplisit.

alter table public.profiles drop constraint if exists profiles_peran_check;

alter table public.profiles add constraint profiles_peran_check check (
  peran in (
    'AdminFammi',
    'Yayasan',
    'KepalaSekolah',
    'WakilKepalaSekolah',
    'Manajemen',
    'WaliKelas',
    'OrangTua',
    'Siswa'
  )
);
