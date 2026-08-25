-- Tambal celah RLS: karakter_skor tidak punya policy _baca_yayasan, padahal keempat tabel
-- saudaranya (karakter_aspek_config, karakter_indikator_config, karakter_pernyataan_ortu,
-- karakter_skor_indikator) sudah punya sejak lama. Ditemukan 2026-08-26 saat dashboard Yayasan
-- Pendidikan Telkom (menu Rapor Karakter) menampilkan kosong walau karakter_skor punya ratusan
-- ribu baris untuk sekolah-sekolah Telkom -- terverifikasi lewat query REST langsung: SQL Editor
-- (superuser, bypass RLS) melihat datanya, tapi panggilan sebagai role authenticated (akun
-- Yayasan sungguhan) mendapat array kosong dari view ypt_k_sekolah/ypt_k_aspek/ypt_k_siswa_ekstrem
-- yang kesemuanya SELECT langsung dari karakter_skor.
--
-- Kenapa celah ini tidak pernah ketahuan sebelumnya: fitur Karakter Yayasan yang sudah ada
-- (useKarakterYayasan di web/src/pages/karakter/useKarakterData.js) TIDAK PERNAH membaca
-- karakter_skor mentah -- ia membaca karakter_summary.ringkasan (angka final hasil impor Excel)
-- dan karakter_indikator_sekolah_avg (view yang dibangun dari karakter_skor_indikator, yang
-- policy-nya sudah benar). View baru YPT (ypt_k_sekolah dkk, migration 20260825120000) adalah
-- pemakai PERTAMA yang membaca karakter_skor langsung untuk akun Yayasan multi-sekolah.
--
-- Policy di bawah adalah SALINAN PERSIS pola karakter_skor_indikator_baca_yayasan (dibaca lewat
-- pg_policies di database produksi 2026-08-26), cuma nama tabelnya diganti.

drop policy if exists karakter_skor_baca_yayasan on public.karakter_skor;
create policy karakter_skor_baca_yayasan on public.karakter_skor
for select to authenticated
using (
  exists (
    select 1
    from public.profiles p
    join public.schools s on (s.yayasan_id = any (p.cakupan))
    where p.id = auth.uid()
      and p.peran = 'Yayasan'
      and s.id = karakter_skor.sekolah_id
  )
);
