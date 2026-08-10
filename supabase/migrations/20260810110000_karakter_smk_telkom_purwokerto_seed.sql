-- Seed sekolah SMK Telkom Purwokerto untuk modul Karakter (2026-08-10).
--
-- Sekolah pertama yang punya dua sumber refleksi sekaligus: orang tua dan siswa. Kolom `sumber`
-- yang membedakannya dibuat di 20260810100000_karakter_refleksi_multi_sumber.sql.
--
-- Label aspek dan indikator di bawah diturunkan dari header berkas Excel sekolah ini, bukan
-- daftar baku lintas sekolah. Sekolah lain punya barisnya sendiri di kedua tabel config ini.
-- `indikator_kode` wajib persis sama dengan kode yang dihasilkan importer dari header Excel
-- (potongan setelah "karakterN_"), karena itu yang dipakai menjodohkan skor dengan labelnya.
--
-- Data murid, skor, refleksi, dan tindak lanjut masuk lewat CMS upload Excel, bukan lewat
-- migration ini. Seluruh statement idempoten, aman dijalankan berulang.

-- ── 1. Sekolah + entitlement ────────────────────────────────────────────────────────────────
insert into public.schools (id, nama, jenjang)
values ('SMK-TELKOM-PWT', 'SMK Telkom Purwokerto', 'SMK')
on conflict (id) do nothing;

insert into public.school_modules (school_id, modul, aktif)
values ('SMK-TELKOM-PWT', 'karakter', true)
on conflict (school_id, modul) do update set aktif = true;

-- ── 2. Konfigurasi aspek Karakter ──────────────────────────────────────────────────────────
-- Empat aspek yang dinilai guru lewat observasi. Kolom `urutan` menentukan urutan tampil di UI.
insert into public.karakter_aspek_config (sekolah_id, aspek_kode, aspek_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter1', 'Empati', 1
where not exists (
  select 1 from public.karakter_aspek_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter1'
);

insert into public.karakter_aspek_config (sekolah_id, aspek_kode, aspek_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter2', 'Inisiatif', 2
where not exists (
  select 1 from public.karakter_aspek_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter2'
);

insert into public.karakter_aspek_config (sekolah_id, aspek_kode, aspek_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter3', 'Resilience', 3
where not exists (
  select 1 from public.karakter_aspek_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter3'
);

insert into public.karakter_aspek_config (sekolah_id, aspek_kode, aspek_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter4', '7 Kebiasaan', 4
where not exists (
  select 1 from public.karakter_aspek_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter4'
);

-- ── 3. Konfigurasi indikator Karakter ──────────────────────────────────────────────────────
-- Enam belas indikator tersebar di empat aspek (3+3+3+7). Kode indikator harus PERSIS cocok
-- dengan hasil parsing Excel, bukan versi yang sudah dirapikan. `urutan` berlaku di dalam aspek.

-- ── Aspek karakter1: Empati (3 indikator)
insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter1', 'indikator1_dengar_pendapat_sebelum_menanggapi', 'Mendengarkan pendapat orang lain sebelum menanggapi', 1
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter1' and indikator_kode = 'indikator1_dengar_pendapat_sebelum_menanggapi'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter1', 'indikator2_hargai_perbedaan_tanpa_merendahkan', 'Menghargai perbedaan tanpa merendahkan', 2
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter1' and indikator_kode = 'indikator2_hargai_perbedaan_tanpa_merendahkan'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter1', 'indikator3_kerja_sama_tanpa_memilih', 'Bekerja sama tanpa memilih-milih teman', 3
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter1' and indikator_kode = 'indikator3_kerja_sama_tanpa_memilih'
);

-- ── Aspek karakter2: Inisiatif (3 indikator)
insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter2', 'indikator1_mulai_tugas_tanpa_arahan', 'Memulai tugas tanpa menunggu arahan', 1
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter2' and indikator_kode = 'indikator1_mulai_tugas_tanpa_arahan'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter2', 'indikator2_usul_ide_solusi_kelompok', 'Mengusulkan ide atau solusi untuk kelompok', 2
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter2' and indikator_kode = 'indikator2_usul_ide_solusi_kelompok'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter2', 'indikator3_ambil_peran_tanpa_diminta', 'Mengambil peran tanpa diminta', 3
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter2' and indikator_kode = 'indikator3_ambil_peran_tanpa_diminta'
);

-- ── Aspek karakter3: Resilience (3 indikator)
insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter3', 'indikator1_menyelesaikan_tugas_menantang', 'Menyelesaikan tugas yang menantang', 1
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter3' and indikator_kode = 'indikator1_menyelesaikan_tugas_menantang'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter3', 'indikator2_menerima_umpan_balik', 'Menerima umpan balik dengan terbuka', 2
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter3' and indikator_kode = 'indikator2_menerima_umpan_balik'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter3', 'indikator3_tetap_berusaha', 'Tetap berusaha saat menghadapi kesulitan', 3
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter3' and indikator_kode = 'indikator3_tetap_berusaha'
);

-- ── Aspek karakter4: 7 Kebiasaan (7 indikator)
insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter4', 'indikator1_siap_dan_fokus_belajar', 'Siap dan fokus saat belajar', 1
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter4' and indikator_kode = 'indikator1_siap_dan_fokus_belajar'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter4', 'indikator2_ikut_ibadah_tertib', 'Mengikuti ibadah dengan tertib', 2
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter4' and indikator_kode = 'indikator2_ikut_ibadah_tertib'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter4', 'indikator3_ikuti_olahraga_sesuai_arahan', 'Mengikuti olahraga sesuai arahan', 3
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter4' and indikator_kode = 'indikator3_ikuti_olahraga_sesuai_arahan'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter4', 'indikator4_pilih_makanan_sehat_saat_istirahat', 'Memilih makanan sehat saat istirahat', 4
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter4' and indikator_kode = 'indikator4_pilih_makanan_sehat_saat_istirahat'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter4', 'indikator5_selesaikan_tugas_sampai_tuntas', 'Menyelesaikan tugas sampai tuntas', 5
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter4' and indikator_kode = 'indikator5_selesaikan_tugas_sampai_tuntas'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter4', 'indikator6_terlibat_kegiatan_sesuai_peran', 'Terlibat dalam kegiatan sesuai perannya', 6
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter4' and indikator_kode = 'indikator6_terlibat_kegiatan_sesuai_peran'
);

insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select
  'SMK-TELKOM-PWT', 'karakter4', 'indikator7_tidak_tidur_atau_rebahan_saat_belajar', 'Tidak tidur atau rebahan saat jam belajar', 7
where not exists (
  select 1 from public.karakter_indikator_config
  where sekolah_id = 'SMK-TELKOM-PWT' and aspek_kode = 'karakter4' and indikator_kode = 'indikator7_tidak_tidur_atau_rebahan_saat_belajar'
);
