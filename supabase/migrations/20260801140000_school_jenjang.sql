-- Kolom "Jenjang" di dialog Tambah Sekolah (AddSchoolDialog.jsx) SELAMA INI cuma UI hiasan --
-- nilainya dibuang di useAdminCmsData.js (`jenjang: _jenjang`) dan tidak pernah dikirim ke
-- Edge Function, jadi baris `schools` tidak pernah punya kolom ini sama sekali. Sekolah.jsx dan
-- Dashboard.jsx menampilkan placeholder tetap ("—"), bukan nilai sungguhan.
--
-- Migration ini menambah kolom sungguhan supaya pilihan jenjang benar-benar tersimpan, termasuk
-- opsi baru "Semua Jenjang" untuk entitas yang mewakili satu Yayasan lintas jenjang sekaligus
-- (mis. Sekolah Islam Athirah: satu baris `schools`/satu login, tapi mencakup SD/SMP/SMA
-- sekaligus lewat kolom `unit` di pa_lembaga/sc_lembaga -- jenjang di sini murni label
-- deskriptif untuk daftar Admin CMS, TIDAK membatasi data unit apa yang boleh diimpor).

alter table public.schools add column if not exists jenjang text;

comment on column public.schools.jenjang is
  'Label deskriptif jenjang sekolah untuk daftar Admin CMS (Daycare/TK/SD/SMP/SMA/SMK/Semua Jenjang/Manajemen/Karyawan). Tidak membatasi modul atau data yang bisa diimpor untuk sekolah ini.';
