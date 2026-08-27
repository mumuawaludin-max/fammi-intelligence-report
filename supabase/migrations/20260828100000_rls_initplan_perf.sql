-- Percepat policy RLS jalur baca dashboard Yayasan: bungkus panggilan fungsi helper dalam
-- subquery skalar supaya dievaluasi SEKALI per query, bukan sekali per baris.
--
-- ── Bukti yang mendasari ─────────────────────────────────────────────────────────────────────
-- EXPLAIN (ANALYZE, BUFFERS) satu halaman karakter_pernyataan_ortu (2026-08-28), dijalankan
-- sebagai role authenticated dengan klaim akun Yayasan Pendidikan Telkom:
--
--   Index Scan using karakter_pernyataan_ortu_sekolah_periode_idx
--     Filter: ((sekolah_id = ANY (my_yayasan_school_ids()))
--              OR ((sekolah_id = my_school_id()) AND ((my_peran() = ANY (...)) OR ...))
--              OR is_admin_fammi())
--     Rows Removed by Filter: 754
--     Buffers: shared hit=13486
--   Execution Time: 102.935 ms
--
-- 13.486 buffer hit untuk memindai 1.754 baris, sekitar 7,7 buffer per baris. Itu bukan biaya
-- membaca tabelnya; itu keenam fungsi helper di klausa Filter, yang masing-masing query ke
-- profiles/schools, dijalankan sekali untuk SETIAP baris. Satu periode berisi 6.558 baris untuk
-- yayasan ini, ditarik tujuh halaman, jadi sekitar 720 ms waktu server murni sebelum jaringan.
--
-- ── Kenapa (select f()) menyelesaikannya ─────────────────────────────────────────────────────
-- Fungsi helper ini semuanya STABLE dan tanpa argumen. Postgres TIDAK melipat fungsi STABLE jadi
-- konstanta saat perencanaan; di klausa filter ia dipanggil ulang tiap baris. Membungkusnya jadi
-- subquery skalar `(select f())` membuat perencana memperlakukannya sebagai InitPlan: dieksekusi
-- sekali di awal, hasilnya dipakai ulang untuk seluruh baris.
--
-- ── Yang TIDAK berubah ───────────────────────────────────────────────────────────────────────
-- Tidak ada satu pun syarat akses yang bergeser. Fungsi yang dipanggil sama, perbandingannya
-- sama, penggabungan OR/AND-nya sama, peran sasarannya sama. Yang berubah cuma BERAPA KALI
-- fungsinya dievaluasi. Baris yang boleh dibaca sebuah akun sebelum dan sesudah migrasi ini
-- identik; lihat cara memverifikasinya di bawah.
--
-- ── Cara memverifikasi setelah dijalankan ────────────────────────────────────────────────────
--   select tablename, policyname, qual from pg_policies
--   where schemaname = 'public'
--     and tablename in ('karakter_skor','karakter_skor_indikator','karakter_pernyataan_ortu',
--                       'karakter_aspek_config','karakter_indikator_config',
--                       'cs_testimoni','kp_responden','dp_item')
--   order by tablename, policyname;
--
-- Tiap `qual` harus terbaca sama persis dengan sebelumnya, hanya dengan tambahan `(SELECT ...)`
-- di sekeliling tiap panggilan fungsi. Kalau ada yang lain berubah, JANGAN dibiarkan.
--
-- Lalu ulangi EXPLAIN yang sama; Buffers harus turun drastis dan Execution Time ikut turun.

-- ══ karakter_skor ═══════════════════════════════════════════════════════════════════════════
drop policy if exists karakter_skor_baca on public.karakter_skor;
create policy karakter_skor_baca on public.karakter_skor
for select to authenticated
using (
  sekolah_id = (select my_school_id())
  and (
    (select my_peran()) in ('KepalaSekolah', 'WakilKepalaSekolah')
    or ((select my_peran()) = 'WaliKelas' and kelas_id = any ((select my_cakupan())))
    or ((select my_peran()) = 'OrangTua' and murid_id = (select my_murid_id()))
    or ((select my_peran()) = 'Siswa' and murid_id = (select my_murid_id()))
  )
);

drop policy if exists karakter_skor_baca_yayasan on public.karakter_skor;
create policy karakter_skor_baca_yayasan on public.karakter_skor
for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())));

drop policy if exists karakter_skor_admin_all on public.karakter_skor;
create policy karakter_skor_admin_all on public.karakter_skor
for all to public
using ((select is_admin_fammi()))
with check ((select is_admin_fammi()));

-- ══ karakter_skor_indikator ═════════════════════════════════════════════════════════════════
drop policy if exists karakter_skor_indikator_baca on public.karakter_skor_indikator;
create policy karakter_skor_indikator_baca on public.karakter_skor_indikator
for select to authenticated
using (
  sekolah_id = (select my_school_id())
  and (
    (select my_peran()) in ('KepalaSekolah', 'WakilKepalaSekolah')
    or ((select my_peran()) = 'WaliKelas' and kelas_id = any ((select my_cakupan())))
    or ((select my_peran()) = 'OrangTua' and murid_id = (select my_murid_id()))
    or ((select my_peran()) = 'Siswa' and murid_id = (select my_murid_id()))
  )
);

drop policy if exists karakter_skor_indikator_baca_yayasan on public.karakter_skor_indikator;
create policy karakter_skor_indikator_baca_yayasan on public.karakter_skor_indikator
for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())));

drop policy if exists karakter_skor_indikator_admin_all on public.karakter_skor_indikator;
create policy karakter_skor_indikator_admin_all on public.karakter_skor_indikator
for all to public
using ((select is_admin_fammi()))
with check ((select is_admin_fammi()));

-- ══ karakter_pernyataan_ortu ════════════════════════════════════════════════════════════════
drop policy if exists karakter_pernyataan_ortu_baca on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_baca on public.karakter_pernyataan_ortu
for select to authenticated
using (
  sekolah_id = (select my_school_id())
  and (
    (select my_peran()) in ('KepalaSekolah', 'WakilKepalaSekolah')
    or ((select my_peran()) = 'WaliKelas' and kelas_id = any ((select my_cakupan())))
    or ((select my_peran()) = 'OrangTua' and murid_id = (select my_murid_id()))
    or ((select my_peran()) = 'Siswa' and murid_id = (select my_murid_id()))
  )
);

drop policy if exists karakter_pernyataan_ortu_baca_yayasan on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_baca_yayasan on public.karakter_pernyataan_ortu
for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())));

drop policy if exists karakter_pernyataan_ortu_admin_all on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_admin_all on public.karakter_pernyataan_ortu
for all to public
using ((select is_admin_fammi()))
with check ((select is_admin_fammi()));

-- ══ Tabel konfigurasi Karakter ══════════════════════════════════════════════════════════════
drop policy if exists karakter_aspek_config_baca_yayasan on public.karakter_aspek_config;
create policy karakter_aspek_config_baca_yayasan on public.karakter_aspek_config
for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())));

drop policy if exists karakter_indikator_config_baca_yayasan on public.karakter_indikator_config;
create policy karakter_indikator_config_baca_yayasan on public.karakter_indikator_config
for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())));

-- ══ Tabel khusus YPT ════════════════════════════════════════════════════════════════════════
drop policy if exists cs_testimoni_baca on public.cs_testimoni;
create policy cs_testimoni_baca on public.cs_testimoni
for select to authenticated
using (
  (select my_peran()) = 'AdminFammi'
  or sekolah_id = any ((select my_yayasan_school_ids()))
  or ((select my_peran()) in ('KepalaSekolah', 'WakilKepalaSekolah')
      and sekolah_id = (select my_school_id()))
);

drop policy if exists kp_responden_baca on public.kp_responden;
create policy kp_responden_baca on public.kp_responden
for select to authenticated
using (
  (select my_peran()) = 'AdminFammi'
  or sekolah_id = any ((select my_yayasan_school_ids()))
  -- Kepala Sekolah/Wakil boleh melihat hasil survei sekolahnya sendiri. Tidak dipakai tampilan
  -- mana pun hari ini, tapi datanya memang tentang sekolah itu dan tidak memuat identitas
  -- responden, jadi tidak ada alasan menyembunyikannya kalau nanti dibutuhkan.
  or ((select my_peran()) in ('KepalaSekolah', 'WakilKepalaSekolah')
      and sekolah_id = (select my_school_id()))
);

-- dp_item: bagian cakupan-nya SUDAH berupa subquery sejak awal, jadi sudah dievaluasi sekali.
-- Yang tersisa cuma my_peran() di depannya.
drop policy if exists dp_item_baca on public.dp_item;
create policy dp_item_baca on public.dp_item
for select to authenticated
using (
  (select my_peran()) = 'AdminFammi'
  or (
    aktif
    and yayasan_id = any (
      select unnest(cakupan) from public.profiles where id = auth.uid() and peran = 'Yayasan'
    )
  )
);
