-- Verifikasi migration 20260917100000 (Screening Awal Wellbeing) di atas sw_baseline.sql dan
-- seed data contoh. Setiap baris hasil punya kolom "lulus"; semua harus true.
-- Akun uji diberi peran barunya di sini karena peran itu baru sah sesudah migration.

update public.profiles set peran = 'HumanCapital' where username in ('hc', 'hclain');
update public.profiles set peran = 'KepalaUnit', sw_unit_id = 'u-sd-contoh-melati' where username = 'kasd';
update public.profiles set peran = 'KepalaUnit', sw_unit_id = 'u-departemen-keuangan-contoh' where username = 'kakeu';
update public.profiles set peran = 'Pegawai', sw_individu_id = 'p2' where username = 'pegawai';
insert into public.school_modules values ('CONTOH-SW', 'sw', true);

create temp table hasil (uji text, nilai text, harap text, lulus boolean);
grant all on hasil to authenticated;

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
select pg_temp.catat('hc: dataset', (select count(*) from sw_dataset), 1::bigint);
select pg_temp.catat('hc: semua unit termasuk yang kecil', (select count(*) from sw_unit), 8::bigint);
select pg_temp.catat('hc: semua individu', (select count(*) from sw_individu), 134::bigint);
select pg_temp.catat('hc: kendali mutu terbaca', (select count(*) > 0 from sw_pimpinan_qc), true);
select pg_temp.catat('hc: simpan catatan', (public.sw_simpan_tinjauan('SW-CONTOH-SW-2026-09', 'p10', 'dijadwalkan', 'HC Uji', '2026-09-17', 'uji')) ->> 'status', 'dijadwalkan'::text);
select pg_temp.catat('hc: catatan terbaca', (select count(*) from sw_tinjauan), 1::bigint);
do $$ begin
  insert into sw_tinjauan (dataset_id, individu_id, sekolah_id) values ('SW-CONTOH-SW-2026-09', 'p3', 'CONTOH-SW');
  insert into hasil values ('hc: tulis catatan langsung ditolak', 'lolos', 'ditolak', false);
exception when others then
  insert into hasil values ('hc: tulis catatan langsung ditolak', 'ditolak', 'ditolak', true);
end $$;
reset role;

-- Ambang unit dinaikkan ke 15 oleh pengolahan hulu.
update sw_dataset set asumsi = jsonb_set(asumsi, '{minPengisiUnit}', '15');

-- ── Yayasan (ambang sekarang 15) ──
select pg_temp.sebagai('yayasan');
select pg_temp.catat('yayasan: dataset', (select count(*) from sw_dataset), 1::bigint);
select pg_temp.catat('yayasan: hanya unit dengan pengisi >= 15', (select count(*) from sw_unit), 4::bigint);
select pg_temp.catat('yayasan: tidak ada unit kecil', (select count(*) from sw_unit where n_pengisi < 15), 0::bigint);
select pg_temp.catat('yayasan: tanpa nama', (select count(*) from sw_individu), 0::bigint);
select pg_temp.catat('yayasan: tanpa kendali mutu', (select count(*) from sw_pimpinan_qc), 0::bigint);
select pg_temp.catat('yayasan: tanpa catatan', (select count(*) from sw_tinjauan), 0::bigint);
do $$ begin
  perform public.sw_simpan_tinjauan('SW-CONTOH-SW-2026-09', 'p10', 'selesai', 'x', null, null);
  insert into hasil values ('yayasan: tidak bisa menulis catatan', 'lolos', 'ditolak', false);
exception when others then
  insert into hasil values ('yayasan: tidak bisa menulis catatan', 'ditolak', 'ditolak', true);
end $$;
reset role;

update sw_dataset set asumsi = jsonb_set(asumsi, '{minPengisiUnit}', '10');

-- ── Kepala unit ──
select pg_temp.sebagai('kasd');
select pg_temp.catat('kepala SD: hanya unitnya', (select string_agg(unit_id, ',') from sw_unit), 'u-sd-contoh-melati'::text);
select pg_temp.catat('kepala SD: tanpa nama', (select count(*) from sw_individu), 0::bigint);
reset role;
select pg_temp.sebagai('kakeu');
select pg_temp.catat('kepala unit kecil: unitnya tidak terbaca', (select count(*) from sw_unit), 0::bigint);
select pg_temp.catat('kepala unit kecil: dataset lembaga terbaca', (select count(*) from sw_dataset), 1::bigint);
reset role;

-- ── Pegawai ──
select pg_temp.sebagai('pegawai');
select pg_temp.catat('pegawai: hanya dirinya', (select string_agg(individu_id, ',') from sw_individu), 'p2'::text);
select pg_temp.catat('pegawai: unit sendiri terbaca', (select count(*) from sw_unit), 1::bigint);
select pg_temp.catat('pegawai: tidak membaca catatan', (select count(*) from sw_tinjauan), 0::bigint);
reset role;

-- ── Human Capital sekolah lain ──
select pg_temp.sebagai('hclain');
select pg_temp.catat('hc sekolah lain: tanpa dataset', (select count(*) from sw_dataset), 0::bigint);
select pg_temp.catat('hc sekolah lain: tanpa individu', (select count(*) from sw_individu), 0::bigint);
reset role;

select * from hasil order by lulus, uji;
select case when bool_and(lulus) then 'SEMUA LULUS' else 'ADA YANG GAGAL' end as ringkasan, count(*) as jumlah_uji from hasil;
