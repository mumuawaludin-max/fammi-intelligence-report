-- Bug nyata: generate tindak lanjut agregat School Culture untuk role "manajemen" SELALU gagal
-- dengan "violates check constraint tindak_lanjut_target_role_check" -- constraint ini dibuat
-- langsung di database (bukan lewat migration terlacak sebelumnya, makanya baru ketahuan
-- sekarang), daftar nilai yang diizinkan cuma wali_kelas/kepala_sekolah/yayasan/orang_tua,
-- TIDAK PERNAH menyertakan "manajemen" -- padahal "manajemen" sudah jadi salah satu role tujuan
-- baku modul SC sejak awal (lihat ROLES di Gemini.jsx, target_role di
-- _shared/geminiPromptSc.ts). Constraint ini valid untuk Karakter (yang memang tidak punya role
-- manajemen), tapi salah menutup jalur SC yang butuh empat role sekaligus.
alter table public.tindak_lanjut drop constraint if exists tindak_lanjut_target_role_check;
alter table public.tindak_lanjut
  add constraint tindak_lanjut_target_role_check
  check (target_role is null or target_role = any (array['wali_kelas', 'kepala_sekolah', 'yayasan', 'orang_tua', 'manajemen']));
