-- Verifikasi RLS: buktikan Wali Kelas dan Siswa benar-benar dibatasi ke cakupannya, dan
-- Kepala Sekolah tidak terdampak (kontrol negatif).
--
-- Cara pakai: tempel seluruh berkas ini ke Supabase SQL Editor, jalankan. Hasilnya satu tabel
-- dengan kolom "lulus" (true/false) per skenario -- kalau ada yang false, migration RLS
-- (lihat supabase/migrations/20260711100000_rls_scope_hardening.sql dan
-- supabase/migrations/20260711113000_rls_tindak_lanjut_scope.sql) sedang tidak bekerja atau
-- ada regresi. Jalankan ulang kapan saja setelah mengubah policy RLS tabel-tabel ini.
--
-- Murni baca (dibungkus begin/rollback), tidak mengubah data. Otomatis memilih satu akun
-- contoh per peran yang ada di database saat ini -- tidak perlu UUID manual. Kalau peran
-- tertentu belum punya akun sama sekali, uji untuk peran itu akan menunjukkan hasil kosong
-- (NULL), bukan error; jalankan lagi setelah akun tersedia.

begin;

-- ── Pilih satu contoh akun per peran, simpan ke session supaya konsisten dipakai ulang ─────
select set_config('rlstest.wk_id',
  (select id::text from public.profiles
   where peran = 'WaliKelas' and cakupan is not null and array_length(cakupan, 1) > 0
   order by id limit 1), true);
select set_config('rlstest.wk_school',
  (select school_id from public.profiles where id::text = current_setting('rlstest.wk_id', true)), true);
select set_config('rlstest.wk_kelas',
  (select cakupan[1] from public.profiles where id::text = current_setting('rlstest.wk_id', true)), true);

select set_config('rlstest.ks_id',
  (select id::text from public.profiles where peran = 'KepalaSekolah' order by id limit 1), true);

select set_config('rlstest.sw_id',
  (select id::text from public.profiles where peran = 'Siswa' and murid_id is not null
   order by id limit 1), true);
select set_config('rlstest.sw_school',
  (select school_id from public.profiles where id::text = current_setting('rlstest.sw_id', true)), true);

-- ── Ground truth, dihitung sebagai postgres (bypass RLS) SEBELUM menyamar ──────────────────
select set_config('rlstest.wk_total', (select count(*)::text from public.karakter_skor
  where sekolah_id = current_setting('rlstest.wk_school', true)), true);
select set_config('rlstest.wk_expect', (select count(*)::text from public.karakter_skor
  where sekolah_id = current_setting('rlstest.wk_school', true)
    and kelas_id = current_setting('rlstest.wk_kelas', true)), true);
select set_config('rlstest.sw_total', (select count(*)::text from public.mi_hasil
  where sekolah_id = current_setting('rlstest.sw_school', true)), true);
select set_config('rlstest.wk_tl_expect', (select count(*)::text from public.tindak_lanjut
  where sekolah_id = current_setting('rlstest.wk_school', true) and status = 'disetujui'
    and scope = 'kelas' and scope_id = current_setting('rlstest.wk_kelas', true)), true);

-- ── Uji 1: Wali Kelas hanya boleh lihat kelas cakupannya di karakter_skor ──────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('rlstest.wk_id', true), 'role', 'authenticated')::text, true);
select set_config('rlstest.wk_actual', (select count(*)::text from public.karakter_skor), true);
select set_config('rlstest.wk_kelas_unik', (select count(distinct kelas_id)::text from public.karakter_skor), true);
-- Bukti Temuan B: pastikan tidak ada satu pun tindak_lanjut scope='sekolah' (level Kepala
-- Sekolah) yang bocor ke Wali Kelas, dan yang scope='kelas' cuma kelas cakupannya sendiri.
select set_config('rlstest.wk_tl_actual', (select count(*)::text from public.tindak_lanjut), true);
select set_config('rlstest.wk_tl_scope_sekolah_bocor', (select count(*)::text from public.tindak_lanjut where scope = 'sekolah'), true);
reset role;

-- ── Uji 2: Kepala Sekolah (kontrol) harus TETAP lihat seluruh sekolah, tidak berubah ───────
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('rlstest.ks_id', true), 'role', 'authenticated')::text, true);
select set_config('rlstest.ks_actual', (select count(*)::text from public.karakter_skor), true);
reset role;

-- ── Uji 3: Siswa hanya boleh lihat datanya sendiri di mi_hasil ─────────────────────────────
set local role authenticated;
select set_config('request.jwt.claims',
  json_build_object('sub', current_setting('rlstest.sw_id', true), 'role', 'authenticated')::text, true);
select set_config('rlstest.sw_actual', (select count(*)::text from public.mi_hasil), true);
select set_config('rlstest.sw_murid_unik', (select count(distinct murid_id)::text from public.mi_hasil), true);
reset role;

-- ── Ringkasan lulus/gagal ───────────────────────────────────────────────────────────────────
select
  'WaliKelas hanya lihat kelas sendiri (karakter_skor)' as uji,
  (current_setting('rlstest.wk_id', true) is not null)
    and current_setting('rlstest.wk_expect', true)::int = current_setting('rlstest.wk_actual', true)::int
    and current_setting('rlstest.wk_kelas_unik', true)::int = 1
    and current_setting('rlstest.wk_actual', true)::int < current_setting('rlstest.wk_total', true)::int
    as lulus,
  format('akun=%s seharusnya=%s actual=%s kelas_unik=%s dari_total=%s',
    current_setting('rlstest.wk_id', true), current_setting('rlstest.wk_expect', true),
    current_setting('rlstest.wk_actual', true), current_setting('rlstest.wk_kelas_unik', true),
    current_setting('rlstest.wk_total', true)) as detail
union all
select
  'KepalaSekolah tetap sekolah-wide, tidak terdampak (kontrol)',
  (current_setting('rlstest.ks_id', true) is not null)
    and current_setting('rlstest.ks_actual', true)::int = current_setting('rlstest.wk_total', true)::int,
  format('akun=%s terlihat=%s dari_total=%s',
    current_setting('rlstest.ks_id', true), current_setting('rlstest.ks_actual', true),
    current_setting('rlstest.wk_total', true))
union all
select
  'Siswa hanya lihat data sendiri (mi_hasil)',
  (current_setting('rlstest.sw_id', true) is not null)
    and current_setting('rlstest.sw_actual', true)::int = 1
    and current_setting('rlstest.sw_murid_unik', true)::int = 1
    and current_setting('rlstest.sw_actual', true)::int < current_setting('rlstest.sw_total', true)::int,
  format('akun=%s actual=%s murid_unik=%s dari_total=%s',
    current_setting('rlstest.sw_id', true), current_setting('rlstest.sw_actual', true),
    current_setting('rlstest.sw_murid_unik', true), current_setting('rlstest.sw_total', true))
union all
select
  'WaliKelas tidak lihat tindak_lanjut scope sekolah/kelas lain (Temuan B)',
  (current_setting('rlstest.wk_id', true) is not null)
    and current_setting('rlstest.wk_tl_expect', true)::int = current_setting('rlstest.wk_tl_actual', true)::int
    and current_setting('rlstest.wk_tl_scope_sekolah_bocor', true)::int = 0,
  format('akun=%s seharusnya=%s actual=%s scope_sekolah_bocor=%s',
    current_setting('rlstest.wk_id', true), current_setting('rlstest.wk_tl_expect', true),
    current_setting('rlstest.wk_tl_actual', true), current_setting('rlstest.wk_tl_scope_sekolah_bocor', true));

rollback;
