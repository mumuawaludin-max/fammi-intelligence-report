-- Verifikasi migration 20261020100000 (Wellbeing Assessment) di atas wa_baseline.sql dan seed
-- data contoh (web/src/pages/wa/data/wa.contoh.json lewat waSql.mjs, sekolah CONTOH, 40 pegawai,
-- 19 kelompok, 97 narasi). Setiap baris hasil punya kolom "lulus"; semua harus true.
-- Jalankan SEKALI per database bersih: berkas ini mengubah data.

update public.profiles set wa_individu_id = 'R002' where username = 'pegawai';
update public.profiles set wa_individu_id = 'R003' where username = 'pegawai2';
insert into public.school_modules values ('CONTOH', 'wa', true);

-- Keadaan persetujuan: narasi lembaga, satu narasi jenjang, dan narasi milik R002 disetujui.
-- Sisanya (termasuk milik R003) masih menunggu.
update public.wa_narasi set status = 'disetujui'
where cakupan = 'lembaga'
   or (cakupan = 'jenjang' and kunci = 'j-tk')
   or (cakupan in ('individu', 'respons_cerita') and kunci = 'R002');

create temp table hasil (uji text, nilai text, harap text, lulus boolean);
grant all on hasil to authenticated, anon;

create or replace function pg_temp.sebagai(p_user text) returns void language plpgsql as $$
begin
  perform set_config('test.uid', (select id::text from public.profiles where username = p_user), false);
  set role authenticated;
end $$;

create or replace function pg_temp.catat(p_uji text, p_nilai anyelement, p_harap anyelement) returns void language plpgsql as $$
begin
  insert into hasil values (p_uji, p_nilai::text, p_harap::text, p_nilai is not distinct from p_harap);
end $$;

-- ── Human Capital ──
select pg_temp.sebagai('hc');
select pg_temp.catat('hc: dataset', (select count(*) from wa_dataset), 1::bigint);
select pg_temp.catat('hc: semua kelompok', (select count(*) from wa_kelompok), 19::bigint);
select pg_temp.catat('hc: semua individu bernama', (select count(*) from wa_individu), 40::bigint);
select pg_temp.catat('hc: hanya narasi kelompok yang disetujui', (select string_agg(cakupan || ':' || kunci, ',' order by kunci) from wa_narasi), 'jenjang:j-tk,lembaga:lembaga'::text);
select pg_temp.catat('hc: narasi individu dan respons cerita tidak terbaca', (select count(*) from wa_narasi where cakupan in ('individu', 'respons_cerita')), 0::bigint);
do $$ begin
  perform perlu_ahli from wa_narasi limit 1;
  insert into hasil values ('hc: kolom perlu_ahli ditolak', 'terbaca', 'ditolak', false);
exception when insufficient_privilege then
  insert into hasil values ('hc: kolom perlu_ahli ditolak', 'ditolak', 'ditolak', true);
end $$;
do $$ begin
  perform alasan_perhatian from wa_narasi limit 1;
  insert into hasil values ('hc: kolom alasan_perhatian ditolak', 'terbaca', 'ditolak', false);
exception when insufficient_privilege then
  insert into hasil values ('hc: kolom alasan_perhatian ditolak', 'ditolak', 'ditolak', true);
end $$;
do $$ begin
  insert into wa_individu (dataset_id, individu_id, sekolah_id, unit_id, nama, data) values ('WA-CONTOH-2026-10', 'X1', 'CONTOH', 'u', 'x', '{}');
  insert into hasil values ('hc: tulis individu ditolak', 'lolos', 'ditolak', false);
exception when others then
  insert into hasil values ('hc: tulis individu ditolak', 'ditolak', 'ditolak', true);
end $$;
do $$
declare n int;
begin
  update wa_narasi set status = 'disetujui' where status = 'menunggu_persetujuan';
  get diagnostics n = row_count;
  insert into hasil values ('hc: menyetujui narasi sendiri ditolak', n::text, '0 atau ditolak', n = 0);
exception when others then
  insert into hasil values ('hc: menyetujui narasi sendiri ditolak', 'ditolak', '0 atau ditolak', true);
end $$;
reset role;

-- ── Pegawai yang narasinya sudah disetujui ──
select pg_temp.sebagai('pegawai');
select pg_temp.catat('pegawai: dataset sekolahnya', (select count(*) from wa_dataset), 1::bigint);
select pg_temp.catat('pegawai: hanya dirinya', (select string_agg(individu_id, ',') from wa_individu), 'R002'::text);
select pg_temp.catat('pegawai: tanpa agregat kelompok', (select count(*) from wa_kelompok), 0::bigint);
select pg_temp.catat('pegawai: narasi individu dan respons miliknya', (select string_agg(cakupan, ',' order by cakupan) from wa_narasi), 'individu,respons_cerita'::text);
select pg_temp.catat('pegawai: narasi kelompok tidak terbaca', (select count(*) from wa_narasi where cakupan = 'lembaga'), 0::bigint);
do $$
declare n int;
begin
  update wa_narasi set isi = '{}'::jsonb where kunci = 'R002';
  get diagnostics n = row_count;
  insert into hasil values ('pegawai: ubah narasi ditolak', n::text, '0 atau ditolak', n = 0);
exception when others then
  insert into hasil values ('pegawai: ubah narasi ditolak', 'ditolak', '0 atau ditolak', true);
end $$;
reset role;

-- ── Pegawai yang narasinya masih menunggu ──
select pg_temp.sebagai('pegawai2');
select pg_temp.catat('pegawai menunggu: barisnya sendiri terbaca', (select string_agg(individu_id, ',') from wa_individu), 'R003'::text);
select pg_temp.catat('pegawai menunggu: draf narasi tidak terbaca', (select count(*) from wa_narasi), 0::bigint);
reset role;

-- ── Pegawai tanpa tautan ──
select pg_temp.sebagai('tanpa');
select pg_temp.catat('pegawai tanpa tautan: tanpa individu', (select count(*) from wa_individu), 0::bigint);
select pg_temp.catat('pegawai tanpa tautan: tanpa narasi', (select count(*) from wa_narasi), 0::bigint);
reset role;

-- ── Peran dan sekolah lain ──
select pg_temp.sebagai('hclain');
select pg_temp.catat('hc sekolah lain: tanpa dataset', (select count(*) from wa_dataset), 0::bigint);
select pg_temp.catat('hc sekolah lain: tanpa individu', (select count(*) from wa_individu), 0::bigint);
reset role;
select pg_temp.sebagai('kepsek');
select pg_temp.catat('kepala sekolah: tanpa dataset', (select count(*) from wa_dataset), 0::bigint);
select pg_temp.catat('kepala sekolah: tanpa individu', (select count(*) from wa_individu), 0::bigint);
reset role;

-- ── Admin Fammi ──
select pg_temp.sebagai('admin');
select pg_temp.catat('admin: semua narasi termasuk yang menunggu', (select count(*) from wa_narasi), 97::bigint);
select pg_temp.catat('admin: semua individu', (select count(*) from wa_individu), 40::bigint);
reset role;

-- ── Anon ──
set role anon;
do $$ begin
  perform 1 from wa_individu limit 1;
  insert into hasil values ('anon: individu ditolak', 'terbaca', 'ditolak', false);
exception when insufficient_privilege then
  insert into hasil values ('anon: individu ditolak', 'ditolak', 'ditolak', true);
end $$;
reset role;

-- ── Struktur ──
select pg_temp.catat('modul wa sah di school_modules', (select count(*) from public.school_modules where modul = 'wa'), 1::bigint);
select pg_temp.catat('respons berpenanda ahli tersimpan', (select count(*) > 0 from public.wa_narasi where perlu_ahli), true);

select * from hasil order by lulus, uji;
select case when bool_and(lulus) then 'SEMUA LULUS' else 'ADA YANG GAGAL' end as ringkasan, count(*) as jumlah_uji from hasil;
