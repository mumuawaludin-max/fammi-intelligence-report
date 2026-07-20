-- Tambah peran 'Karyawan' untuk modul Corporate Culture & Wellbeing (CW).
--
-- Pasangan dari peran 'Manajemen' (migration 20260720100000): Manajemen membaca agregat seluruh
-- organisasi, Karyawan membaca laporan PRIBADINYA SENDIRI. Ini padanan korporat dari peran
-- Siswa/OrangTua di modul akademik -- sama-sama di-scope ke satu individu, bukan sekolah-wide.
--
-- Kenapa bukan memakai WaliKelas/Siswa yang sudah ada: keduanya terikat konteks akademik
-- (cakupan kelas, murid_id) yang tidak punya arti untuk karyawan perusahaan, dan policy RLS
-- modul Karakter/MI menempel ke peran-peran itu. Memakai ulang salah satunya akan memberi
-- karyawan akses baca yang tidak seharusnya ke data murid.
--
-- Constraint dibangun ulang secara DINAMIS dengan alasan yang sama seperti migration
-- school_modules: nilai peran yang sudah benar-benar dipakai di tabel ikut dipertahankan supaya
-- tidak ada baris lama yang mendadak jadi ilegal dan menghentikan seluruh push.
--
-- Policy RLS tabel cw_* belum ditulis karena tabelnya belum ada. Saat tabel itu dibuat nanti,
-- Karyawan WAJIB dibatasi ke barisnya sendiri (pola my_murid_id() untuk Siswa, tapi dengan
-- kolom identitas karyawan) -- jangan disamakan dengan Manajemen yang sekolah/organisasi-wide.

do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array[
      'AdminFammi', 'Yayasan', 'KepalaSekolah', 'WakilKepalaSekolah',
      'Manajemen', 'Karyawan', 'WaliKelas', 'OrangTua', 'Siswa'
    ]) as v
    union
    select distinct peran from public.profiles where peran is not null
  ) s;

  execute 'alter table public.profiles drop constraint if exists profiles_peran_check';
  execute format(
    'alter table public.profiles add constraint profiles_peran_check check (peran in (%s))',
    daftar
  );
end $$;
