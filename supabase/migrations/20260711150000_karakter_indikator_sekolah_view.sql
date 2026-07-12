-- View agregat indikator per sekolah, dipakai tampilan Yayasan (Fase B4).
--
-- Sebelumnya useKarakterYayasan (useKarakterData.js) mengambil SELURUH baris
-- karakter_skor_indikator mentah lintas semua sekolah yayasan (satu baris per murid per
-- aspek per indikator per periode) lalu merata-ratakannya di klien -- kandidat kuat lewat
-- batas 1000 baris diam-diam Supabase untuk yayasan dengan banyak sekolah, dan boros bandwidth
-- karena cuma butuh hasil rata-ratanya, bukan tiap baris murid.
--
-- PENTING -- security_invoker = true WAJIB ADA. Tanpa ini, view yang dibuat lewat migration
-- (dijalankan sebagai role pemilik/superuser yang bypass RLS) akan IKUT BYPASS RLS untuk
-- SEMUA pemakai view ini -- membocorkan data indikator sekolah lain ke siapa pun yang bisa
-- SELECT dari view, membatalkan pembatasan yang baru ditegakkan di migration
-- 20260711100000_rls_scope_hardening.sql. Dengan security_invoker = true, view ini transparan
-- terhadap RLS karakter_skor_indikator: yang terlihat lewat view persis sama dengan yang
-- terlihat kalau query langsung ke tabel dasarnya sebagai user yang sama.

create or replace view public.karakter_indikator_sekolah_avg
with (security_invoker = true)
as
select
  sekolah_id,
  periode_id,
  aspek_kode,
  indikator_kode,
  round(avg(skor)) as skor
from public.karakter_skor_indikator
group by sekolah_id, periode_id, aspek_kode, indikator_kode;

grant select on public.karakter_indikator_sekolah_avg to authenticated;
