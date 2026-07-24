-- Fix bug nyata: import_sc_periode (dipanggil ulang saat admin re-upload Excel School Culture
-- untuk sekolah/periode yang sama, mis. membetulkan kesalahan data) melakukan
-- "delete from sc_personal where sekolah_id=... and periode_id=..." sebelum insert ulang. Begitu
-- ada laporan sc_hasil (draf ATAU yang sudah disetujui/tayang) yang menunjuk baris sc_personal
-- lama itu, DELETE ini gagal kena foreign key violation (sc_hasil_sc_personal_id_fkey) --
-- default Postgres untuk `references` tanpa ON DELETE adalah NO ACTION (blokir), bukan CASCADE.
-- sc_personal.id (uuid, gen_random_uuid()) TIDAK PERNAH stabil lintas import (beda dari
-- murid_id/kelas_id modul lain yang teks bebas dari pipeline hulu) -- setiap re-import
-- membuat baris sc_personal BARU dengan id baru, jadi data lama yang mengacu id lama memang
-- harus diputus/dibuang, bukan dipertahankan mengacu ke baris yang sudah tidak ada.
--
-- sc_hasil & sc_feedback: CASCADE. Laporan/catatan lama sudah tidak sinkron dengan data yang
--   baru diimpor begitu sc_personal-nya diganti -- membiarkannya menggantung ke id yang sudah
--   tidak ada lebih berbahaya (laporan basi tayang terus) daripada dibuang, admin generate ulang
--   dan approve ulang setelah re-import.
-- profiles.sc_responden_id: SET NULL, BUKAN cascade -- akun Karyawan (identitas login staf)
--   tidak boleh ikut terhapus cuma karena data periode-nya diimpor ulang. Tautannya ke laporan
--   terputus sampai admin approve laporan barunya (lihat ensureKaryawanScAccount di
--   admin-actions/index.ts, dipanggil lagi otomatis saat approve).

alter table public.sc_hasil drop constraint if exists sc_hasil_sc_personal_id_fkey;
alter table public.sc_hasil
  add constraint sc_hasil_sc_personal_id_fkey
  foreign key (sc_personal_id) references public.sc_personal(id) on delete cascade;

alter table public.sc_feedback drop constraint if exists sc_feedback_sc_personal_id_fkey;
alter table public.sc_feedback
  add constraint sc_feedback_sc_personal_id_fkey
  foreign key (sc_personal_id) references public.sc_personal(id) on delete cascade;

alter table public.profiles drop constraint if exists profiles_sc_responden_id_fkey;
alter table public.profiles
  add constraint profiles_sc_responden_id_fkey
  foreign key (sc_responden_id) references public.sc_personal(id) on delete set null;
