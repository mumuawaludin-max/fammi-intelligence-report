-- Perbaikan salah asumsi ID sekolah di 20260810110000 dan 20260810120000.
--
-- Kronologi: kedua migration itu membuat sekolah baru dengan id 'SMK-TELKOM-PWT', dengan asumsi
-- SMK Telkom Purwokerto belum terdaftar di sistem. Ternyata sekolah ini SUDAH ada lebih dulu
-- dengan id 'SMK-TELKOM-PURWOKERTO' (nama kota lengkap, bukan singkatan -- pola yang sama dipakai
-- semua sekolah Yayasan Pendidikan Telkom lain: SMK-TELKOM-MAKASSAR, TK-TELKOM-TERNATE, dst),
-- dan sudah tergabung grup nyata yayasan_id = 'YAY-PENDIDIKAN-TELKOM'. Admin sudah terlanjur
-- upload data karakter (42438 baris) ke 'SMK-TELKOM-PURWOKERTO' lewat CMS -- itu yang BENAR.
-- Yang salah adalah konfigurasi aspek/indikator dan tiga akun uji yang menunjuk ke
-- 'SMK-TELKOM-PWT', sekolah kosong yang tidak pernah dipakai untuk apa pun.
--
-- Migration ini: (1) menyalin config aspek/indikator ke sekolah_id yang benar, (2) mengarahkan
-- ulang tiga akun uji, (3) menghapus sisa 'SMK-TELKOM-PWT' yang salah. Idempoten.

-- Jaga-jaga: batalkan migration ini kalau ternyata ada data karakter di 'SMK-TELKOM-PWT' --
-- artinya asumsi di komentar atas ini keliru dan baris itu TIDAK boleh dihapus begitu saja.
do $$
begin
  if exists (select 1 from public.karakter_skor where sekolah_id = 'SMK-TELKOM-PWT') then
    raise exception 'Ada data karakter_skor di SMK-TELKOM-PWT -- jangan lanjutkan migration ini, tinjau ulang dulu.';
  end if;
end $$;

-- ── 1. Config aspek, disalin ke sekolah_id yang benar ──────────────────────────────────────
insert into public.karakter_aspek_config (sekolah_id, aspek_kode, aspek_label, urutan)
select 'SMK-TELKOM-PURWOKERTO', aspek_kode, aspek_label, urutan
from public.karakter_aspek_config
where sekolah_id = 'SMK-TELKOM-PWT'
  and not exists (
    select 1 from public.karakter_aspek_config x
    where x.sekolah_id = 'SMK-TELKOM-PURWOKERTO' and x.aspek_kode = karakter_aspek_config.aspek_kode
  );

-- ── 2. Config indikator, disalin ke sekolah_id yang benar ──────────────────────────────────
insert into public.karakter_indikator_config (sekolah_id, aspek_kode, indikator_kode, indikator_label, urutan)
select 'SMK-TELKOM-PURWOKERTO', aspek_kode, indikator_kode, indikator_label, urutan
from public.karakter_indikator_config
where sekolah_id = 'SMK-TELKOM-PWT'
  and not exists (
    select 1 from public.karakter_indikator_config x
    where x.sekolah_id = 'SMK-TELKOM-PURWOKERTO'
      and x.aspek_kode = karakter_indikator_config.aspek_kode
      and x.indikator_kode = karakter_indikator_config.indikator_kode
  );

-- ── 3. Pastikan modul karakter aktif untuk sekolah yang benar ──────────────────────────────
-- Kemungkinan besar sudah aktif (karena upload lewat CMS berhasil), tapi dipastikan ulang.
insert into public.school_modules (school_id, modul, aktif)
values ('SMK-TELKOM-PURWOKERTO', 'karakter', true)
on conflict (school_id, modul) do update set aktif = true;

-- ── 4. Arahkan ulang tiga akun uji ──────────────────────────────────────────────────────────
-- Yayasan: cakupan dipakai sebagai yayasan_id di useKarakterData.js:373-388, jadi HARUS
-- 'YAY-PENDIDIKAN-TELKOM' yang nyata, bukan grup buatan 'YYS-SMK-TELKOM-PWT'. Konsekuensinya
-- akun ini akan melihat SEMUA sekolah di bawah Yayasan Pendidikan Telkom yang modul Karakternya
-- aktif dan sudah punya data, tidak cuma SMK Telkom Purwokerto -- itu perilaku Yayasan yang
-- sebenarnya, bukan bug.
update public.profiles set school_id = 'SMK-TELKOM-PURWOKERTO'
where username = 'kepseksmktelkompwt' and school_id = 'SMK-TELKOM-PWT';

update public.profiles set school_id = 'SMK-TELKOM-PURWOKERTO'
where username = 'walikelaspplg3smktelkompwt' and school_id = 'SMK-TELKOM-PWT';

update public.profiles set school_id = 'SMK-TELKOM-PURWOKERTO', cakupan = array['YAY-PENDIDIKAN-TELKOM']
where username = 'yayasansmktelkompwt';

-- ── 5. Bersihkan sisa SMK-TELKOM-PWT yang salah ─────────────────────────────────────────────
-- Aman dihapus: pengecekan di awal migration ini sudah memastikan tidak ada data karakter di
-- sana, dan langkah 4 sudah memindahkan semua akun yang tadinya menunjuk ke sini.
delete from public.karakter_indikator_config where sekolah_id = 'SMK-TELKOM-PWT';
delete from public.karakter_aspek_config where sekolah_id = 'SMK-TELKOM-PWT';
delete from public.school_modules where school_id = 'SMK-TELKOM-PWT';
delete from public.schools where id = 'SMK-TELKOM-PWT';

-- Setelah migration ini: login QA tetap pakai username/kode yang sama seperti sebelumnya
-- (kepseksmktelkompwt / walikelaspplg3smktelkompwt / yayasansmktelkompwt, kode
-- "gantiSandiIni2026"), cuma sekarang menunjuk ke sekolah yang benar-benar berisi data.
