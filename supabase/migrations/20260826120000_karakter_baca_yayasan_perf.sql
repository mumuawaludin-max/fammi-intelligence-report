-- Ganti pola policy _baca_yayasan pada lima tabel Karakter dari EXISTS-berkorelasi ke
-- sekolah_id = any(my_yayasan_school_ids()), untuk mengatasi timeout (57014) yang ditemukan
-- 2026-08-26 saat dashboard Yayasan Pendidikan Telkom membaca lintas 26 sekolah.
--
-- Kenapa pola lama lambat: policy lama berbentuk
--   exists (select 1 from profiles p join schools s on (s.yayasan_id = any(p.cakupan))
--           where p.id = auth.uid() and p.peran = 'Yayasan' and s.id = <tabel>.sekolah_id)
-- Subquery ini BERKORELASI ke baris <tabel> yang sedang diperiksa (klausa terakhir merujuk
-- <tabel>.sekolah_id), jadi planner Postgres harus mengevaluasinya ULANG untuk SETIAP baris yang
-- dipindai -- pada karakter_skor_indikator yang punya ratusan ribu baris, ini terasa sekali.
-- Menambah index (migration 20260826110000) tidak membantu karena bottleneck-nya bukan
-- pemindaian baris, tapi biaya subquery yang diulang.
--
-- my_yayasan_school_ids() (dibuat di 20260825110000) adalah fungsi STABLE tanpa argumen yang
-- berkorelasi ke baris tabel -- Postgres bisa mengevaluasinya SEKALI per query, hasilnya array
-- kecil (~26 id), lalu tiap baris tinggal dicek "sekolah_id = ANY(array)", operasi murah yang
-- juga bisa memakai index (sekolah_id, periode_id) yang baru ditambahkan.
--
-- Diuji manual 2026-08-26: ypt_k_indikator (baca karakter_skor_indikator) timeout 8.9 detik
-- dengan policy lama bahkan untuk satu periode; migration ini WAJIB diikuti pengujian ulang.

drop policy if exists karakter_skor_baca_yayasan on public.karakter_skor;
create policy karakter_skor_baca_yayasan on public.karakter_skor
for select to authenticated
using (sekolah_id = any (public.my_yayasan_school_ids()));

drop policy if exists karakter_skor_indikator_baca_yayasan on public.karakter_skor_indikator;
create policy karakter_skor_indikator_baca_yayasan on public.karakter_skor_indikator
for select to authenticated
using (sekolah_id = any (public.my_yayasan_school_ids()));

drop policy if exists karakter_aspek_config_baca_yayasan on public.karakter_aspek_config;
create policy karakter_aspek_config_baca_yayasan on public.karakter_aspek_config
for select to authenticated
using (sekolah_id = any (public.my_yayasan_school_ids()));

drop policy if exists karakter_indikator_config_baca_yayasan on public.karakter_indikator_config;
create policy karakter_indikator_config_baca_yayasan on public.karakter_indikator_config
for select to authenticated
using (sekolah_id = any (public.my_yayasan_school_ids()));

drop policy if exists karakter_pernyataan_ortu_baca_yayasan on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_baca_yayasan on public.karakter_pernyataan_ortu
for select to authenticated
using (sekolah_id = any (public.my_yayasan_school_ids()));
