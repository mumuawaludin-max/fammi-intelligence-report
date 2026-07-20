-- Fase E1 (lanjutan): kecilkan permukaan RLS tulis Karakter setelah RPC aktif.
--
-- Sejak import_karakter_periode (migration 20260712100000) dipakai dan diverifikasi jalan
-- di produksi (import SDIP Al Madani, 4 periode, 28.546 baris, sukses), browser tidak lagi
-- perlu INSERT/UPDATE/DELETE langsung ke empat tabel Karakter ini -- semua tulisan lewat RPC
-- security definer yang bypass RLS sendiri (lihat komentar di migration RPC-nya). Policy
-- "FOR ALL" untuk AdminFammi disempitkan jadi SELECT saja, pola sama dengan
-- 20260711140000_narrow_admin_write_rls.sql (Fase A4). AdminFammi tetap bisa membaca
-- semuanya lewat browser (dipakai CMS untuk riwayat/monitor), cuma mutasi yang dipindah.
--
-- karakter_aspek_config dan karakter_indikator_config SENGAJA TIDAK disentuh -- tidak ada
-- satu pun kode React yang menulis ke dua tabel config ini saat ini, jadi menyempitkannya
-- di luar cakupan perubahan yang sedang diverifikasi di sini. import_log juga TIDAK
-- disentuh -- masih ditulis langsung dari browser di runImportAction (useAdminCmsData.js),
-- bukan bagian dari RPC import_karakter_periode.

-- Catatan idempotensi (ditambahkan 2026-07-20): tiap `create policy` di bawah didahului
-- `drop policy if exists` untuk nama yang SAMA dengan yang dibuat, bukan cuma nama lama.
-- Tanpa ini, `supabase db push` gagal dengan 42710 ("policy ... already exists") di database
-- yang policy-nya sudah pernah dipasang manual lewat SQL editor tapi belum tercatat di
-- riwayat migration. Isi dan maksud policy tidak berubah sama sekali.

drop policy if exists karakter_skor_admin_all on public.karakter_skor;
drop policy if exists karakter_skor_admin_baca on public.karakter_skor;
create policy karakter_skor_admin_baca on public.karakter_skor
for select to public
using (is_admin_fammi());

drop policy if exists karakter_skor_indikator_admin_all on public.karakter_skor_indikator;
drop policy if exists karakter_skor_indikator_admin_baca on public.karakter_skor_indikator;
create policy karakter_skor_indikator_admin_baca on public.karakter_skor_indikator
for select to public
using (is_admin_fammi());

drop policy if exists karakter_pernyataan_ortu_admin_all on public.karakter_pernyataan_ortu;
drop policy if exists karakter_pernyataan_ortu_admin_baca on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_admin_baca on public.karakter_pernyataan_ortu
for select to public
using (is_admin_fammi());

drop policy if exists karakter_summary_admin_all on public.karakter_summary;
drop policy if exists karakter_summary_admin_baca on public.karakter_summary;
create policy karakter_summary_admin_baca on public.karakter_summary
for select to public
using (is_admin_fammi());
