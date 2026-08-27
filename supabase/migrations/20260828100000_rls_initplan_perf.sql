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
-- ── JEBAKAN: fungsi yang mengembalikan text[] WAJIB di-cast ──────────────────────────────────
-- Menulis `sekolah_id = any ((select my_yayasan_school_ids()))` GAGAL dengan
-- "operator does not exist: text = text[]". Di dalam ANY(), Postgres membaca `(select ...)`
-- sebagai SUBQUERY, bukan sebagai nilai array, lalu mencoba membandingkan text dengan baris
-- bertipe text[]. Cast eksplisit `::text[]` memaksanya dibaca sebagai ekspresi array biasa.
-- Berlaku untuk my_yayasan_school_ids() dan my_cakupan(); keduanya returns text[].
--
-- ── Yang TIDAK berubah ───────────────────────────────────────────────────────────────────────
-- Tidak ada satu pun syarat akses yang bergeser. Seluruh definisi di bawah disalin dari dump
-- pg_policies database produksi (2026-08-28), bukan dari berkas migrasi lama yang ternyata sudah
-- tidak sinkron: permissive, cmd, roles, qual, dan with_check dipertahankan persis. Perhatikan
-- dua yang mudah salah kalau ditebak, karakter_aspek_config_baca dan
-- karakter_indikator_config_baca memakai role `public`, bukan `authenticated`.
-- Yang berubah cuma BERAPA KALI fungsinya dievaluasi.
--
-- ── Cara memverifikasi setelah dijalankan ────────────────────────────────────────────────────
--   select tablename, policyname, permissive, cmd,
--          array_to_string(roles, ',') as roles, qual, with_check
--   from pg_policies
--   where schemaname = 'public'
--     and tablename in ('karakter_skor','karakter_skor_indikator','karakter_pernyataan_ortu',
--                       'karakter_aspek_config','karakter_indikator_config',
--                       'cs_testimoni','kp_responden','dp_item')
--   order by tablename, policyname;
--
-- Harus tetap 18 baris, dengan permissive/cmd/roles/with_check sama persis seperti sebelumnya,
-- dan qual hanya bertambah `(SELECT ...)` di sekeliling tiap panggilan fungsi. Kalau ada yang
-- lain berubah, JANGAN dibiarkan.
--
-- ── Hasil terukur setelah migrasi ini dijalankan (2026-08-28) ────────────────────────────────
--   Buffers: shared hit  13.486 -> 415   (turun 97%)
--   Filter: my_peran(), my_school_id(), dst  ->  (InitPlan 2).col1, (InitPlan 3).col1, dst
--   Sepuluh InitPlan muncul, tujuh di antaranya "never executed" karena di-short-circuit OR.
--
-- Jadi mekanismenya terbukti: fungsi helper tidak lagi dipanggil per baris. Turunnya jumlah
-- buffer itu ukuran yang paling jujur di sini, karena tidak terpengaruh beban instance.
-- Execution Time pada run pertama justru naik (103 ms -> 187 ms) dengan Planning Time ikut naik
-- ke 15 ms; itu biaya sekali jalan menyusun ulang rencana setelah DDL, ditambah keramaian
-- instance. Ukur dengan beberapa kali run, jangan dari satu sampel.

-- ══ karakter_skor ═══════════════════════════════════════════════════════════════════════════
drop policy if exists karakter_skor_baca on public.karakter_skor;
create policy karakter_skor_baca on public.karakter_skor
as permissive for select to authenticated
using (
  sekolah_id = (select my_school_id())
  and (
    (select my_peran()) in ('KepalaSekolah', 'WakilKepalaSekolah')
    or ((select my_peran()) = 'WaliKelas' and kelas_id = any ((select my_cakupan())::text[]))
    or ((select my_peran()) = 'OrangTua' and murid_id = (select my_murid_id()))
    or ((select my_peran()) = 'Siswa' and murid_id = (select my_murid_id()))
  )
);

drop policy if exists karakter_skor_baca_yayasan on public.karakter_skor;
create policy karakter_skor_baca_yayasan on public.karakter_skor
as permissive for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())::text[]));

drop policy if exists karakter_skor_admin_all on public.karakter_skor;
create policy karakter_skor_admin_all on public.karakter_skor
as permissive for all to public
using ((select is_admin_fammi()))
with check ((select is_admin_fammi()));

-- ══ karakter_skor_indikator ═════════════════════════════════════════════════════════════════
drop policy if exists karakter_skor_indikator_baca on public.karakter_skor_indikator;
create policy karakter_skor_indikator_baca on public.karakter_skor_indikator
as permissive for select to authenticated
using (
  sekolah_id = (select my_school_id())
  and (
    (select my_peran()) in ('KepalaSekolah', 'WakilKepalaSekolah')
    or ((select my_peran()) = 'WaliKelas' and kelas_id = any ((select my_cakupan())::text[]))
    or ((select my_peran()) = 'OrangTua' and murid_id = (select my_murid_id()))
    or ((select my_peran()) = 'Siswa' and murid_id = (select my_murid_id()))
  )
);

drop policy if exists karakter_skor_indikator_baca_yayasan on public.karakter_skor_indikator;
create policy karakter_skor_indikator_baca_yayasan on public.karakter_skor_indikator
as permissive for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())::text[]));

drop policy if exists karakter_skor_indikator_admin_all on public.karakter_skor_indikator;
create policy karakter_skor_indikator_admin_all on public.karakter_skor_indikator
as permissive for all to public
using ((select is_admin_fammi()))
with check ((select is_admin_fammi()));

-- ══ karakter_pernyataan_ortu ════════════════════════════════════════════════════════════════
drop policy if exists karakter_pernyataan_ortu_baca on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_baca on public.karakter_pernyataan_ortu
as permissive for select to authenticated
using (
  sekolah_id = (select my_school_id())
  and (
    (select my_peran()) in ('KepalaSekolah', 'WakilKepalaSekolah')
    or ((select my_peran()) = 'WaliKelas' and kelas_id = any ((select my_cakupan())::text[]))
    or ((select my_peran()) = 'OrangTua' and murid_id = (select my_murid_id()))
    or ((select my_peran()) = 'Siswa' and murid_id = (select my_murid_id()))
  )
);

drop policy if exists karakter_pernyataan_ortu_baca_yayasan on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_baca_yayasan on public.karakter_pernyataan_ortu
as permissive for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())::text[]));

drop policy if exists karakter_pernyataan_ortu_admin_all on public.karakter_pernyataan_ortu;
create policy karakter_pernyataan_ortu_admin_all on public.karakter_pernyataan_ortu
as permissive for all to public
using ((select is_admin_fammi()))
with check ((select is_admin_fammi()));

-- ══ karakter_aspek_config ═══════════════════════════════════════════════════════════════════
-- CATATAN: policy `_baca` di sini memakai role `public`, BUKAN `authenticated`. Berbeda dari
-- tabel karakter lain di atas. Disalin apa adanya dari database.
drop policy if exists karakter_aspek_config_baca on public.karakter_aspek_config;
create policy karakter_aspek_config_baca on public.karakter_aspek_config
as permissive for select to public
using (sekolah_id = (select my_school_id()));

drop policy if exists karakter_aspek_config_baca_yayasan on public.karakter_aspek_config;
create policy karakter_aspek_config_baca_yayasan on public.karakter_aspek_config
as permissive for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())::text[]));

drop policy if exists karakter_aspek_config_admin_all on public.karakter_aspek_config;
create policy karakter_aspek_config_admin_all on public.karakter_aspek_config
as permissive for all to public
using ((select is_admin_fammi()))
with check ((select is_admin_fammi()));

-- ══ karakter_indikator_config ═══════════════════════════════════════════════════════════════
drop policy if exists karakter_indikator_config_baca on public.karakter_indikator_config;
create policy karakter_indikator_config_baca on public.karakter_indikator_config
as permissive for select to public
using (sekolah_id = (select my_school_id()));

drop policy if exists karakter_indikator_config_baca_yayasan on public.karakter_indikator_config;
create policy karakter_indikator_config_baca_yayasan on public.karakter_indikator_config
as permissive for select to authenticated
using (sekolah_id = any ((select public.my_yayasan_school_ids())::text[]));

drop policy if exists karakter_indikator_config_admin_all on public.karakter_indikator_config;
create policy karakter_indikator_config_admin_all on public.karakter_indikator_config
as permissive for all to public
using ((select is_admin_fammi()))
with check ((select is_admin_fammi()));

-- ══ Tabel khusus YPT ════════════════════════════════════════════════════════════════════════
drop policy if exists cs_testimoni_baca on public.cs_testimoni;
create policy cs_testimoni_baca on public.cs_testimoni
as permissive for select to authenticated
using (
  (select my_peran()) = 'AdminFammi'
  or sekolah_id = any ((select my_yayasan_school_ids())::text[])
  or ((select my_peran()) in ('KepalaSekolah', 'WakilKepalaSekolah')
      and sekolah_id = (select my_school_id()))
);

drop policy if exists kp_responden_baca on public.kp_responden;
create policy kp_responden_baca on public.kp_responden
as permissive for select to authenticated
using (
  (select my_peran()) = 'AdminFammi'
  or sekolah_id = any ((select my_yayasan_school_ids())::text[])
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
as permissive for select to authenticated
using (
  (select my_peran()) = 'AdminFammi'
  or (
    aktif
    and yayasan_id in (
      select unnest(cakupan) from public.profiles where id = auth.uid() and peran = 'Yayasan'
    )
  )
);
