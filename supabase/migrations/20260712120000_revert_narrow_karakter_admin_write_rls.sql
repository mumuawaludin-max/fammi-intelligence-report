-- Revert sementara migration 20260712110000: ternyata SECURITY DEFINER pada
-- import_karakter_periode TIDAK melewati RLS di project ini (writes di dalam function tetap
-- dievaluasi terhadap policy tabel) -- setelah policy FOR ALL dicabut, RPC gagal dengan "new
-- row violates row-level security policy for table karakter_skor" begitu dipakai import
-- sungguhan. Kembalikan dulu policy FOR ALL supaya import tidak terblokir, sambil E1
-- dipindah ke pola yang benar-benar bypass RLS (lewat service_role di Edge Function
-- admin-actions, action "import-karakter", bukan RPC langsung dari browser+anon key) --
-- lihat migration berikutnya setelah perubahan itu diverifikasi.

drop policy if exists karakter_skor_admin_baca on public.karakter_skor;
create policy karakter_skor_admin_all on public.karakter_skor
for all to public
using (is_admin_fammi())
with check (is_admin_fammi());

drop policy if exists karakter_skor_indikator_admin_baca on public.karakter_skor_indikator;
create policy karakter_skor_indikator_admin_all on public.karakter_skor_indikator
for all to public
using (is_admin_fammi())
with check (is_admin_fammi());

drop policy if exists karakter_pernyataan_ortu_admin_baca on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_admin_all on public.karakter_pernyataan_ortu
for all to public
using (is_admin_fammi())
with check (is_admin_fammi());

drop policy if exists karakter_summary_admin_baca on public.karakter_summary;
create policy karakter_summary_admin_all on public.karakter_summary
for all to public
using (is_admin_fammi())
with check (is_admin_fammi());
