-- Perketat RLS: batasi baca detail murid sampai ke kelas/anak sendiri, bukan cuma sekolah.
--
-- Temuan audit (Fase A2, lihat docs/Rencana_Perbaikan_FIR_2026-07.md): policy baca
-- karakter_skor, karakter_skor_indikator, karakter_pernyataan_ortu, dan mi_hasil hanya
-- memfilter sekolah_id. Kode React menyaring lebih lanjut ke kelas cakupan / murid_id sendiri,
-- tapi itu kosmetik -- lewat REST langsung dengan anon key + JWT siapa pun yang login di
-- sekolah itu (Wali Kelas kelas lain, atau bahkan akun Orang Tua/Siswa) bisa membaca nama dan
-- skor SEMUA murid sekolah tersebut. Migration ini menegakkan batas kelas_id/murid_id di
-- level RLS sendiri, sesuai kontrak CLAUDE.md ("query yang lupa filter tetap aman").
--
-- Kepala Sekolah dan Wakil Kepala Sekolah TIDAK dipersempit (scope mereka memang
-- sekolah-wide sesuai CLAUDE.md). Policy _baca_yayasan untuk Yayasan juga tidak disentuh --
-- itu sudah benar menyaring ke sekolah-sekolah di bawah yayasannya.
--
-- mi_input SENGAJA tidak disentuh di sini -- struktur kolomnya belum diverifikasi (tidak ada
-- kode React yang memakainya untuk dicocokkan), jangan menebak nama kolom untuk tabel yang
-- polanya belum pasti. Tindak lanjut/briefing (scope & target_role) juga sengaja ditunda ke
-- migration terpisah, menunggu pengecekan data supaya tidak menyembunyikan baris modul MI
-- yang masih berskema lama.

-- ── Helper baru, pola sama dengan my_school_id() yang sudah ada ────────────────────────────
create or replace function public.my_peran()
returns text
language sql
stable
security definer
as $$
  select peran from public.profiles where id = auth.uid()
$$;

create or replace function public.my_cakupan()
returns text[]
language sql
stable
security definer
as $$
  select cakupan from public.profiles where id = auth.uid()
$$;

create or replace function public.my_murid_id()
returns text
language sql
stable
security definer
as $$
  select murid_id from public.profiles where id = auth.uid()
$$;

-- ── Bersihkan fungsi yatim ───────────────────────────────────────────────────────────────
-- handle_new_user() tidak terikat trigger apa pun ke auth.users (sudah diverifikasi lewat
-- pg_trigger sebelum migration ini ditulis). Sisa desain lama yang ditinggalkan saat alur
-- pindah ke create-user Edge Function + insert profiles eksplisit. Dibiarkan hidup berisiko
-- kalau nanti tidak sengaja diikat lagi sebagai trigger -- akan bentrok dengan insert profiles
-- di create-user/index.ts (duplicate key pada profiles.id).
drop function if exists public.handle_new_user();

-- ── Ringkas policy duplikat di schools & school_modules (bukan bug, cuma tumpang tindih) ───
drop policy if exists "schools: admin read all" on public.schools;      -- sudah dicakup schools_admin_all
drop policy if exists "schools: own school" on public.schools;          -- sudah dicakup schools_baca_sendiri
drop policy if exists "school_modules: own school" on public.school_modules; -- sudah dicakup "baca modul sekolah sendiri"

-- ── karakter_skor: kelas cakupan untuk Wali Kelas, anak sendiri untuk Orang Tua/Siswa ──────
drop policy if exists karakter_skor_baca on public.karakter_skor;
create policy karakter_skor_baca on public.karakter_skor
for select to authenticated
using (
  sekolah_id = my_school_id()
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah')
    or (my_peran() = 'WaliKelas' and kelas_id = any (my_cakupan()))
    or (my_peran() = 'OrangTua' and murid_id = my_murid_id())
    or (my_peran() = 'Siswa' and murid_id = my_murid_id())
  )
);

-- ── karakter_skor_indikator: pola identik ──────────────────────────────────────────────────
drop policy if exists karakter_skor_indikator_baca on public.karakter_skor_indikator;
create policy karakter_skor_indikator_baca on public.karakter_skor_indikator
for select to authenticated
using (
  sekolah_id = my_school_id()
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah')
    or (my_peran() = 'WaliKelas' and kelas_id = any (my_cakupan()))
    or (my_peran() = 'OrangTua' and murid_id = my_murid_id())
    or (my_peran() = 'Siswa' and murid_id = my_murid_id())
  )
);

-- ── karakter_pernyataan_ortu: pola identik ─────────────────────────────────────────────────
drop policy if exists karakter_pernyataan_ortu_baca on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_baca on public.karakter_pernyataan_ortu
for select to authenticated
using (
  sekolah_id = my_school_id()
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah')
    or (my_peran() = 'WaliKelas' and kelas_id = any (my_cakupan()))
    or (my_peran() = 'OrangTua' and murid_id = my_murid_id())
    or (my_peran() = 'Siswa' and murid_id = my_murid_id())
  )
);

-- ── mi_hasil: pola identik. Efek samping baik: MIPage.jsx saat ini query TANPA filter kelas
-- sama sekali (bug terpisah, lihat rencana perbaikan Fase B3) -- begitu policy ini aktif, Wali
-- Kelas otomatis hanya melihat murid di kelasnya sendiri walau kode React belum diperbaiki,
-- persis kontrak "query yang lupa filter tetap aman" di CLAUDE.md.
drop policy if exists mi_hasil_baca on public.mi_hasil;
create policy mi_hasil_baca on public.mi_hasil
for select to authenticated
using (
  sekolah_id = my_school_id()
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah')
    or (my_peran() = 'WaliKelas' and kelas_id = any (my_cakupan()))
    or (my_peran() = 'OrangTua' and murid_id = my_murid_id())
    or (my_peran() = 'Siswa' and murid_id = my_murid_id())
  )
);
