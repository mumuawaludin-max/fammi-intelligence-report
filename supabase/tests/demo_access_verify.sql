-- Verifikasi migration 20261111100000 (akses demo halaman masuk) di atas demo_access_baseline.sql.
-- Setiap baris hasil punya kolom "lulus"; semua harus true. Jalankan SEKALI per database bersih.
--
-- Peran ditiru seperti di produksi. IP pengunjung dibaca dari GUC request.headers, seperti yang
-- diisi PostgREST. Urutannya dua fase:
--   1. session_user postgres (SQL Editor), berganti role lewat SET ROLE: alur pengunjung, waktu
--      yang dimajukan, laporan HTML, pembatasan laju.
--   2. session_user authenticator (persis PostgREST): pemeriksaan pengelola yang bergantung pada
--      session_user. Fase ini paling akhir karena PGlite tidak bisa kembali dari SET SESSION
--      AUTHORIZATION; Postgres biasa bisa, dan urutan ini tetap benar di keduanya.

create schema uji;
grant usage on schema uji to public;
create table uji.hasil (urut serial primary key, uji text, nilai text, harap text, lulus boolean);
create table uji.kode (nama text primary key, kode text, id uuid);
create table uji.jawab (nama text primary key, isi jsonb);
grant all on all tables in schema uji to public;
grant all on all sequences in schema uji to public;

create function uji.catat(p_uji text, p_nilai text, p_harap text) returns void language sql as $$
  insert into uji.hasil (uji, nilai, harap, lulus) values (p_uji, p_nilai, p_harap, p_nilai is not distinct from p_harap)
$$;
create function uji.token(p_nama text) returns text language sql stable as $$
  select isi -> 'session' ->> 'token' from uji.jawab where nama = p_nama
$$;
create function uji.kode_dari(p_nama text) returns text language sql stable as $$
  select kode from uji.kode where nama = p_nama
$$;
grant execute on all functions in schema uji to public;

-- ════ Fase 1: session_user postgres ══════════════════════════════════════════════════════════

-- ── SQL Editor: pengelola membuat kode ───────────────────────────────────────────────────────
insert into uji.kode select 'A', r ->> 'code', (r ->> 'id')::uuid from (select public.demo_code_create('Uji A', 'Kode tanpa batas') r) x;
insert into uji.kode select 'B', r ->> 'code', (r ->> 'id')::uuid from (select public.demo_code_create('Uji B', null, null, 1) r) x;
insert into uji.kode select 'C', r ->> 'code', (r ->> 'id')::uuid from (select public.demo_code_create('Uji C', null, now() + interval '1 day') r) x;
insert into uji.kode select 'D', r ->> 'code', (r ->> 'id')::uuid from (select public.demo_code_create('Uji D') r) x;
insert into uji.kode select 'E', r ->> 'code', (r ->> 'id')::uuid from (select public.demo_code_create('Uji E', null, null, null, array['talent-life-design']) r) x;
insert into uji.kode select 'F', r ->> 'code', (r ->> 'id')::uuid from (select public.demo_code_create('Uji F', null, now() + interval '2 hours', null, null, 30) r) x;
insert into uji.kode select 'G', r ->> 'code', (r ->> 'id')::uuid from (select public.demo_code_create('Uji G') r) x;

-- C sudah lewat masa berlakunya.
update public.demo_access_codes set expires_at = now() - interval '1 minute' where id = (select id from uji.kode where nama = 'C');

select uji.catat('kode: format XXXX-XXXX-XXXX tanpa simbol mirip',
  (select bool_and(kode ~ '^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{4}$') from uji.kode)::text, 'true');
select uji.catat('kode: tujuh kode berbeda', (select count(distinct kode) from uji.kode)::text, '7');
select uji.catat('kode: kode mentah tidak tersimpan di tabel',
  (select count(*) from public.demo_access_codes c, uji.kode k
    where c::text like '%' || replace(k.kode, '-', '') || '%' or c::text like '%' || k.kode || '%')::text, '0');
select uji.catat('kode E: hanya satu sistem',
  (select available_systems::text from public.demo_access_codes where id = (select id from uji.kode where nama = 'E')), '{talent-life-design}');
select uji.catat('kode: urutan sistem bawaan lengkap',
  (select available_systems::text from public.demo_access_codes where id = (select id from uji.kode where nama = 'A')),
  '{education-character,safety-crisis,talent-life-design,teacher-growth,finance-planning}');
select uji.catat('SQL Editor: daftar kode tanpa akun', (select count(*) from public.demo_code_list())::text, '7');

do $$ begin
  perform public.demo_code_create('Sistem asing', null, null, null, array['../../etc']);
  perform uji.catat('kode: sistem tak dikenal ditolak', 'dibuat', 'ditolak');
exception when invalid_parameter_value then
  perform uji.catat('kode: sistem tak dikenal ditolak', 'ditolak', 'ditolak');
end $$;

do $$ begin
  perform public.demo_code_create('Lampau', null, now() - interval '1 day');
  perform uji.catat('kode: kedaluwarsa di masa lalu ditolak', 'dibuat', 'ditolak');
exception when invalid_parameter_value then
  perform uji.catat('kode: kedaluwarsa di masa lalu ditolak', 'ditolak', 'ditolak');
end $$;

-- ── Pengunjung (anon) ────────────────────────────────────────────────────────────────────────
select set_config('test.role', 'anon', false), set_config('test.admin', '', false), set_config('test.uid', '', false),
  set_config('request.headers', '{"cf-connecting-ip":"203.0.113.10","x-forwarded-for":"10.0.0.1, 203.0.113.10"}', false);
set role anon;

do $$ begin
  perform 1 from public.demo_access_codes limit 1;
  perform uji.catat('anon: tabel kode tidak terbaca langsung', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('anon: tabel kode tidak terbaca langsung', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform 1 from public.demo_secret limit 1;
  perform uji.catat('anon: kunci rahasia tidak terbaca', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('anon: kunci rahasia tidak terbaca', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform 1 from public.demo_access_sessions limit 1;
  perform uji.catat('anon: tabel sesi tidak terbaca', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('anon: tabel sesi tidak terbaca', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform 1 from public.demo_reports limit 1;
  perform uji.catat('anon: tabel laporan tidak terbaca', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('anon: tabel laporan tidak terbaca', 'ditolak', 'ditolak');
end $$;
do $$ begin
  insert into public.demo_access_codes (code_hash, code_label) values (repeat('a', 64), 'Sisipan');
  perform uji.catat('anon: tidak bisa menyisipkan kode', 'masuk', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('anon: tidak bisa menyisipkan kode', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform public.demo_code_create('Penyusup');
  perform uji.catat('anon: tidak bisa membuat kode', 'dibuat', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('anon: tidak bisa membuat kode', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform public.demo_code_list();
  perform uji.catat('anon: tidak bisa melihat daftar kode', 'terlihat', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('anon: tidak bisa melihat daftar kode', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform public.demo_hmac('kode:ABC');
  perform uji.catat('anon: pembantu HMAC tidak bisa dipanggil', 'terpanggil', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('anon: pembantu HMAC tidak bisa dipanggil', 'ditolak', 'ditolak');
end $$;

-- Empat percobaan gagal pertama dari 203.0.113.10.
select uji.catat('verifikasi: kode terlalu pendek', public.demo_verify('abc') ->> 'status', 'invalid');
select uji.catat('verifikasi: kode tak dikenal', public.demo_verify('ABCD-EFGH-JKMN') ->> 'status', 'invalid');
select uji.catat('verifikasi: kode kosong', public.demo_verify(null) ->> 'status', 'invalid');
select uji.catat('verifikasi: pesan tidak membuka rincian server',
  public.demo_verify('ABCD-EFGH-JKMQ') ->> 'message', 'Kode demo tidak valid. Periksa kembali kode yang Anda masukkan.');

insert into uji.jawab values ('A1', public.demo_verify(lower(replace(uji.kode_dari('A'), '-', ' '))));
select uji.catat('A: huruf kecil dan spasi tetap cocok', (select isi ->> 'status' from uji.jawab where nama = 'A1'), 'valid');
select uji.catat('A: token 64 heksadesimal', (uji.token('A1') ~ '^[0-9a-f]{64}$')::text, 'true');
select uji.catat('A: lima sistem terbuka', (select jsonb_array_length(isi -> 'availableSystems') from uji.jawab where nama = 'A1')::text, '5');
select uji.catat('A: sesi berumur 180 menit',
  (select abs(extract(epoch from ((isi -> 'session' ->> 'expiresAt')::timestamptz - now())) - 10800) < 60 from uji.jawab where nama = 'A1')::text, 'true');
select uji.catat('A: belum ada laporan HTML', (select isi ->> 'htmlReports' from uji.jawab where nama = 'A1'), '[]');
select uji.catat('A: sesi aktif', public.demo_session(uji.token('A1')) ->> 'status', 'active');

select uji.catat('sesi: token bentuk asing ditolak', public.demo_session('../../etc/passwd') ->> 'status', 'invalid');
select uji.catat('sesi: token tak dikenal ditolak', public.demo_session(repeat('ab', 32)) ->> 'status', 'invalid');

select uji.catat('laporan: sistem tanpa HTML', public.demo_report_html(uji.token('A1'), 'finance-planning') ->> 'status', 'not_found');
select uji.catat('laporan: path berkas ditolak', public.demo_report_html(uji.token('A1'), '../../index.html') ->> 'status', 'not_allowed');
select uji.catat('laporan: tanpa token ditolak', public.demo_report_html(null, 'finance-planning') ->> 'status', 'invalid');

select uji.catat('logout: membalas sukses', public.demo_logout(uji.token('A1')) ->> 'success', 'true');
select uji.catat('logout: sesi berakhir', public.demo_session(uji.token('A1')) ->> 'status', 'ended');
select uji.catat('logout: laporan ikut tertutup', public.demo_report_html(uji.token('A1'), 'education-character') ->> 'status', 'ended');
select uji.catat('logout: token sembarang tetap dibalas sukses', public.demo_logout('x') ->> 'success', 'true');

insert into uji.jawab values ('B1', public.demo_verify(uji.kode_dari('B')));
insert into uji.jawab values ('B2', public.demo_verify(uji.kode_dari('B')));
select uji.catat('B: pemakaian pertama berhasil', (select isi ->> 'status' from uji.jawab where nama = 'B1'), 'valid');
select uji.catat('B: pemakaian kedua habis jatah', (select isi ->> 'status' from uji.jawab where nama = 'B2'), 'exhausted');
select uji.catat('B: sesi pertama tetap berjalan', public.demo_session(uji.token('B1')) ->> 'status', 'active');

select uji.catat('C: kode kedaluwarsa ditolak', public.demo_verify(uji.kode_dari('C')) ->> 'status', 'expired');
select uji.catat('C: pesan kedaluwarsa', public.demo_verify(uji.kode_dari('C')) ->> 'message', 'Masa berlaku kode demo telah berakhir.');

insert into uji.jawab values ('D1', public.demo_verify(uji.kode_dari('D')));
select uji.catat('D: berhasil sebelum dicabut', (select isi ->> 'status' from uji.jawab where nama = 'D1'), 'valid');

insert into uji.jawab values ('E1', public.demo_verify(uji.kode_dari('E')));
select uji.catat('E: hanya talent-life-design', (select isi ->> 'availableSystems' from uji.jawab where nama = 'E1'), '["talent-life-design"]');
select uji.catat('E: sistem lain ditolak', public.demo_report_html(uji.token('E1'), 'education-character') ->> 'status', 'not_allowed');
select uji.catat('E: sesi melaporkan sistem yang sama', public.demo_session(uji.token('E1')) ->> 'availableSystems', '["talent-life-design"]');

insert into uji.jawab values ('F1', public.demo_verify(uji.kode_dari('F')));
select uji.catat('F: sesi 30 menit',
  (select abs(extract(epoch from ((isi -> 'session' ->> 'expiresAt')::timestamptz - now())) - 1800) < 60 from uji.jawab where nama = 'F1')::text, 'true');

insert into uji.jawab values ('G1', public.demo_verify(uji.kode_dari('G')));
select uji.catat('G: berhasil', (select isi ->> 'status' from uji.jawab where nama = 'G1'), 'valid');

-- ── Admin Fammi dan akun biasa: hak baca tabel (RLS dan hak kolom) ───────────────────────────
reset role;
select set_config('test.role', 'authenticated', false), set_config('test.uid', '00000000-0000-0000-0000-000000000099', false);
set role authenticated;
select uji.catat('akun biasa: tidak melihat baris kode', (select count(*) from public.demo_access_codes)::text, '0');
select uji.catat('akun biasa: tidak melihat baris sesi', (select count(*) from public.demo_access_sessions)::text, '0');

reset role;
select set_config('test.admin', 'ya', false);
set role authenticated;
select uji.catat('admin: membaca label kode', (select count(*) from public.demo_access_codes)::text, '7');
do $$ begin
  perform code_hash from public.demo_access_codes limit 1;
  perform uji.catat('admin: hash kode tetap tidak terbaca', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('admin: hash kode tetap tidak terbaca', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform session_token_hash from public.demo_access_sessions limit 1;
  perform uji.catat('admin: hash token tidak terbaca', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('admin: hash token tidak terbaca', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform html from public.demo_reports limit 1;
  perform uji.catat('admin: isi HTML tidak terbaca langsung', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('admin: isi HTML tidak terbaca langsung', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform 1 from public.demo_secret limit 1;
  perform uji.catat('admin: kunci rahasia tidak terbaca', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('admin: kunci rahasia tidak terbaca', 'ditolak', 'ditolak');
end $$;

-- ── SQL Editor: memajukan waktu dan menambah laporan HTML ─────────────────────────────────────
reset role;
select set_config('test.role', '', false), set_config('test.admin', '', false), set_config('test.uid', '', false);

update public.demo_access_sessions set expires_at = now() - interval '1 second'
where session_token_hash = public.demo_hmac('sesi:' || uji.token('F1'));
update public.demo_access_codes set expires_at = now() - interval '1 second' where id = (select id from uji.kode where nama = 'G');
select public.demo_report_upsert('finance-planning', 'Contoh Finance', '<!doctype html><title>x</title><p>Contoh</p>');

select uji.catat('admin: status C kedaluwarsa', (select status from public.demo_code_list() where code_label = 'Uji C'), 'expired');
select uji.catat('admin: status B habis jatah', (select status from public.demo_code_list() where code_label = 'Uji B'), 'exhausted');
select uji.catat('admin: sesi aktif B terhitung', (select sesi_aktif from public.demo_code_list() where code_label = 'Uji B')::text, '1');

select set_config('test.role', 'anon', false);
set role anon;

select uji.catat('F: sesi lewat umur ditolak', public.demo_session(uji.token('F1')) ->> 'status', 'expired');
select uji.catat('G: kode kedaluwarsa mematikan sesi berjalan', public.demo_session(uji.token('G1')) ->> 'status', 'expired');

insert into uji.jawab values ('A2', public.demo_verify(uji.kode_dari('A')));
select uji.catat('laporan: htmlReports memuat finance-planning', ((select isi -> 'htmlReports' from uji.jawab where nama = 'A2') ? 'finance-planning')::text, 'true');
select uji.catat('laporan: isi HTML terbaca dengan sesi sah',
  public.demo_report_html(uji.token('A2'), 'finance-planning') ->> 'html', '<!doctype html><title>x</title><p>Contoh</p>');
select uji.catat('laporan: E tidak melihat laporan sistem lain', public.demo_session(uji.token('E1')) ->> 'htmlReports', '[]');

reset role;
select public.demo_report_upsert('finance-planning', 'Contoh Finance', '<p>x</p>', false);
set role anon;
select uji.catat('laporan: nonaktif tidak terbaca', public.demo_report_html(uji.token('A2'), 'finance-planning') ->> 'status', 'not_found');
select uji.catat('laporan: nonaktif hilang dari htmlReports', public.demo_session(uji.token('A2')) ->> 'htmlReports', '[]');

-- ── Pembatasan laju ──────────────────────────────────────────────────────────────────────────
-- Sejauh ini 203.0.113.10 sudah gagal 7 kali: pendek, tak dikenal, kosong, pesan, B2, dan C dua
-- kali. Tiga lagi menggenapkan 10; percobaan ke-11 harus ditahan walau kodenya sah.
select uji.catat('laju: percobaan ke-10 masih diperiksa', public.demo_verify('QQQQ-QQQQ-QQQ2') ->> 'status', 'invalid');
select public.demo_verify('QQQQ-QQQQ-QQQ3');
select public.demo_verify('QQQQ-QQQQ-QQQ4');
select uji.catat('laju: kode sah pun ditahan setelah 10 gagal', public.demo_verify(uji.kode_dari('A')) ->> 'status', 'rate_limited');

select set_config('request.headers', '{"cf-connecting-ip":"203.0.113.10","x-forwarded-for":"1.2.3.4"}', false);
select uji.catat('laju: x-forwarded-for palsu tidak lolos', public.demo_verify(uji.kode_dari('A')) ->> 'status', 'rate_limited');

select set_config('request.headers', '{"cf-connecting-ip":"198.51.100.20"}', false);
select uji.catat('laju: pengunjung lain tidak terdampak', public.demo_verify(uji.kode_dari('A')) ->> 'status', 'valid');

reset role;
insert into public.demo_verify_attempts (client_key, success, outcome)
select 'uji-' || g, false, 'invalid' from generate_series(1, 300) g;
select uji.catat('privasi: IP tidak tersimpan mentah',
  (select count(*) from public.demo_verify_attempts where client_key like '%203.0.113%' or client_key like '%198.51%')::text, '0');
select uji.catat('pemakaian: usage_count A menghitung tiga sesi',
  (select usage_count from public.demo_access_codes where id = (select id from uji.kode where nama = 'A'))::text, '3');

set role anon;
select set_config('request.headers', '{"cf-connecting-ip":"192.0.2.55"}', false);
select uji.catat('laju global: semua ditahan saat serangan luas', public.demo_verify(uji.kode_dari('A')) ->> 'status', 'rate_limited');

-- Bersihkan serangan tiruan supaya fase 2 tidak ikut tertahan.
reset role;
delete from public.demo_verify_attempts where client_key like 'uji-%';

-- ── Akun demo untuk Edge Function demo-masuk (demo_akun_email) ────────────────────────────────
insert into auth.users (id, email, deleted_at) values
  ('00000000-0000-0000-0000-0000000000a1', 'demo.kepsek@fammi.internal', null),
  ('00000000-0000-0000-0000-0000000000a2', 'Guru.Demo@Contoh.sch.id', null),
  ('00000000-0000-0000-0000-0000000000a3', 'sudah.dihapus@fammi.internal', now());

select set_config('test.role', 'anon', false);
set role anon;
do $$ begin
  perform public.demo_akun_email('demo.kepsek@fammi.internal');
  perform uji.catat('akun demo: pengunjung tidak bisa mencari email akun', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('akun demo: pengunjung tidak bisa mencari email akun', 'ditolak', 'ditolak');
end $$;

reset role;
select set_config('test.role', 'authenticated', false), set_config('test.admin', 'ya', false);
set role authenticated;
do $$ begin
  perform public.demo_akun_email('demo.kepsek@fammi.internal');
  perform uji.catat('akun demo: Admin Fammi pun tidak lewat browser', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('akun demo: Admin Fammi pun tidak lewat browser', 'ditolak', 'ditolak');
end $$;

reset role;
select set_config('test.role', 'service_role', false), set_config('test.admin', '', false);
set role service_role;
select uji.catat('akun demo: email yang ada dikembalikan', public.demo_akun_email('demo.kepsek@fammi.internal'), 'demo.kepsek@fammi.internal');
select uji.catat('akun demo: huruf besar dan spasi tidak berpengaruh, email tersimpan yang kembali',
  public.demo_akun_email('  guru.demo@contoh.SCH.id '), 'Guru.Demo@Contoh.sch.id');
select uji.catat('akun demo: email tak terdaftar menghasilkan null', public.demo_akun_email('tidak.ada@fammi.internal'), null);
select uji.catat('akun demo: akun terhapus tidak dipakai', public.demo_akun_email('sudah.dihapus@fammi.internal'), null);
select uji.catat('akun demo: masukan kosong menghasilkan null', public.demo_akun_email(null), null);
reset role;
select uji.catat('akun demo: pencarian tidak menambah akun', (select count(*) from auth.users)::text, '3');
select set_config('test.role', '', false);

-- ════ Fase 2: session_user authenticator, persis PostgREST ═══════════════════════════════════
select set_config('test.role', 'authenticated', false), set_config('test.admin', '', false),
  set_config('test.uid', '00000000-0000-0000-0000-000000000099', false),
  set_config('request.headers', '{"cf-connecting-ip":"192.0.2.77"}', false);
set session authorization authenticator;
set role authenticated;

do $$ begin
  perform public.demo_code_create('Bukan admin');
  perform uji.catat('akun biasa: tidak bisa membuat kode', 'dibuat', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('akun biasa: tidak bisa membuat kode', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform public.demo_code_revoke((select id from uji.kode where nama = 'A'));
  perform uji.catat('akun biasa: tidak bisa mencabut kode', 'dicabut', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('akun biasa: tidak bisa mencabut kode', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform public.demo_code_list();
  perform uji.catat('akun biasa: tidak bisa melihat daftar kode', 'terlihat', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('akun biasa: tidak bisa melihat daftar kode', 'ditolak', 'ditolak');
end $$;
do $$ begin
  perform public.demo_report_upsert('finance-planning', 'x', '<p>x</p>');
  perform uji.catat('akun biasa: tidak bisa mengubah laporan', 'diubah', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('akun biasa: tidak bisa mengubah laporan', 'ditolak', 'ditolak');
end $$;

reset role;
select set_config('test.admin', 'ya', false);
set role authenticated;
select uji.catat('admin lewat API: melihat daftar kode', (select count(*) from public.demo_code_list())::text, '7');
select uji.catat('admin lewat API: mencabut D menghentikan satu sesi',
  public.demo_code_revoke((select id from uji.kode where nama = 'D')) ->> 'sesi_dihentikan', '1');
select uji.catat('admin lewat API: membuat kode baru', (public.demo_code_create('Dari CMS') ->> 'code') ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$' || '', 'true');

reset role;
select set_config('test.role', 'anon', false), set_config('test.admin', '', false), set_config('test.uid', '', false);
set role anon;
select uji.catat('D: sesi berjalan berhenti setelah dicabut', public.demo_session(uji.token('D1')) ->> 'status', 'revoked');
select uji.catat('D: kode dicabut ditolak', public.demo_verify(uji.kode_dari('D')) ->> 'status', 'revoked');
select uji.catat('A: sesi lain tidak terdampak pencabutan D', public.demo_session(uji.token('A2')) ->> 'status', 'active');
do $$ begin
  perform public.demo_akun_email('demo.kepsek@fammi.internal');
  perform uji.catat('akun demo lewat API: anon ditolak', 'terbaca', 'ditolak');
exception when insufficient_privilege then
  perform uji.catat('akun demo lewat API: anon ditolak', 'ditolak', 'ditolak');
end $$;

-- Edge Function demo-masuk memanggil lewat PostgREST dengan kunci service_role.
reset role;
select set_config('test.role', 'service_role', false);
set role service_role;
select uji.catat('akun demo lewat API: service_role menemukan akun', public.demo_akun_email('DEMO.KEPSEK@fammi.internal'), 'demo.kepsek@fammi.internal');

select urut, uji, nilai, harap, lulus from uji.hasil order by urut;
select count(*) filter (where lulus) as lulus, count(*) filter (where not lulus) as gagal from uji.hasil;
