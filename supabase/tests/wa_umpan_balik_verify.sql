-- Verifikasi migration 20261021100000 (umpan balik Wellbeing Assessment) di atas wa_baseline.sql,
-- migration 20261020100000, migration 20261021100000, dan seed data contoh (sekolah CONTOH).
-- Setiap baris hasil punya kolom "lulus"; semua harus true. Jalankan SEKALI per database bersih.

update public.profiles set wa_individu_id = 'R002' where username = 'pegawai';
update public.profiles set wa_individu_id = 'R003' where username = 'pegawai2';
insert into public.profiles (id, username, nama, peran, school_id, wa_individu_id) values
  ('00000000-0000-0000-0000-000000000008', 'pegawai3', 'Pegawai Ketiga', 'Pegawai', 'CONTOH', 'R004'),
  ('00000000-0000-0000-0000-000000000009', 'pegawai4', 'Pegawai Keempat', 'Pegawai', 'CONTOH', 'R005');

create temp table hasil (uji text, nilai text, harap text, lulus boolean);
grant all on hasil to authenticated, anon;

create or replace function pg_temp.sebagai(p_user text) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('test.uid', coalesce((select id::text from public.profiles where username = p_user), ''), false);
  set role authenticated;
end $$;

create or replace function pg_temp.catat(p_uji text, p_nilai anyelement, p_harap anyelement) returns void language plpgsql as $$
begin
  insert into hasil values (p_uji, p_nilai::text, p_harap::text, p_nilai is not distinct from p_harap);
end $$;

create or replace function pg_temp.jawaban(p_puas int, p_esai text) returns jsonb language sql as $$
  select jsonb_build_object(
    'nilai', jsonb_build_object('puas_keseluruhan', p_puas, 'kualitas_laporan', 8),
    'pilihan', jsonb_build_object('rencana', jsonb_build_array('Mencoba satu langkah kecil'), 'diperhatikan', 'Ya'),
    'esai', jsonb_build_object('alasan_puas', p_esai)
  )
$$;

-- ── Pegawai menulis miliknya sendiri ──
select pg_temp.sebagai('pegawai');
insert into wa_umpan_balik (dataset_id, individu_id, sekolah_id, jawaban)
  select id, 'R002', 'CONTOH', pg_temp.jawaban(9, 'Penjelasannya jelas') from wa_dataset;
select pg_temp.catat('pegawai: membaca baris miliknya', (select count(*) from wa_umpan_balik), 1::bigint);

do $$ begin
  insert into wa_umpan_balik (dataset_id, individu_id, sekolah_id, jawaban)
    select id, 'R003', 'CONTOH', '{}'::jsonb from wa_dataset;
  insert into hasil values ('pegawai: menulis atas nama orang lain ditolak', 'masuk', 'ditolak', false);
exception when others then
  insert into hasil values ('pegawai: menulis atas nama orang lain ditolak', 'ditolak', 'ditolak', true);
end $$;

do $$ begin
  update wa_umpan_balik set individu_id = 'R009';
  insert into hasil values ('pegawai: kolom kunci tidak bisa diubah', 'berubah', 'ditolak', false);
exception when others then
  insert into hasil values ('pegawai: kolom kunci tidak bisa diubah', 'ditolak', 'ditolak', true);
end $$;

select pg_temp.sebagai('pegawai2');
insert into wa_umpan_balik (dataset_id, individu_id, sekolah_id, jawaban)
  select id, 'R003', 'CONTOH', pg_temp.jawaban(6, 'Cukup membantu') from wa_dataset;
select pg_temp.catat('pegawai2: tidak membaca isian orang lain', (select string_agg(individu_id, ',') from wa_umpan_balik), 'R003'::text);

-- Akun Pegawai tanpa tautan wa tidak bisa mengisi.
select pg_temp.sebagai('tanpa');
do $$ begin
  insert into wa_umpan_balik (dataset_id, individu_id, sekolah_id, jawaban)
    select id, 'R006', 'CONTOH', '{}'::jsonb from wa_dataset;
  insert into hasil values ('tanpa tautan: mengisi ditolak', 'masuk', 'ditolak', false);
exception when others then
  insert into hasil values ('tanpa tautan: mengisi ditolak', 'ditolak', 'ditolak', true);
end $$;

-- ── Human Capital: rekap tertutup sebelum tiga isian ──
select pg_temp.sebagai('hc');
select pg_temp.catat('hc: tidak membaca baris per orang', (select count(*) from wa_umpan_balik), 0::bigint);
select pg_temp.catat('hc: n terhitung', (select (public.wa_umpan_balik_ringkasan(id) ->> 'n')::int from wa_dataset), 2);
select pg_temp.catat('hc: rekap tertutup di bawah ambang', (select public.wa_umpan_balik_ringkasan(id) ? 'nilai' from wa_dataset), false);

select pg_temp.sebagai('pegawai3');
insert into wa_umpan_balik (dataset_id, individu_id, sekolah_id, jawaban)
  select id, 'R004', 'CONTOH', pg_temp.jawaban(10, 'Saya jadi tahu harus mulai dari mana')
    || jsonb_build_object('lainnya', jsonb_build_object('rencana', 'Ikut kajian pekanan')) from wa_dataset;

select pg_temp.sebagai('hc');
select pg_temp.catat('hc: rekap terbuka di ambang', (select (public.wa_umpan_balik_ringkasan(id) ->> 'terbuka')::boolean from wa_dataset), true);
select pg_temp.catat('hc: rata-rata kepuasan', (select public.wa_umpan_balik_ringkasan(id) #>> '{nilai,puas_keseluruhan,rata}' from wa_dataset), '8.33'::text);
select pg_temp.catat('hc: sebaran sepuluh nilai', (select jsonb_array_length(public.wa_umpan_balik_ringkasan(id) #> '{nilai,puas_keseluruhan,sebaran}') from wa_dataset), 10);
select pg_temp.catat('hc: hitungan pilihan', (select public.wa_umpan_balik_ringkasan(id) #>> '{pilihan,rencana,opsi,Mencoba satu langkah kecil}' from wa_dataset), '3'::text);
select pg_temp.catat('hc: tiga esai', (select jsonb_array_length(public.wa_umpan_balik_ringkasan(id) #> '{esai,alasan_puas}') from wa_dataset), 3);
select pg_temp.catat('hc: isian lainnya', (select public.wa_umpan_balik_ringkasan(id) #>> '{lainnya,rencana,0,teks}' from wa_dataset), 'Ikut kajian pekanan'::text);
select pg_temp.catat('hc: rekap tanpa identitas', (select public.wa_umpan_balik_ringkasan(id)::text ~ 'R00[0-9]' from wa_dataset), false);

-- ── Yang tidak berhak ──
select pg_temp.sebagai('hclain');
do $$ begin
  perform public.wa_umpan_balik_ringkasan('WA-CONTOH-2026-10');
  insert into hasil values ('hc sekolah lain: rekap ditolak', 'terbaca', 'ditolak', false);
exception when insufficient_privilege then
  insert into hasil values ('hc sekolah lain: rekap ditolak', 'ditolak', 'ditolak', true);
end $$;

select pg_temp.sebagai('kepsek');
do $$ begin
  perform public.wa_umpan_balik_ringkasan('WA-CONTOH-2026-10');
  insert into hasil values ('kepala sekolah: rekap ditolak', 'terbaca', 'ditolak', false);
exception when insufficient_privilege then
  insert into hasil values ('kepala sekolah: rekap ditolak', 'ditolak', 'ditolak', true);
end $$;
select pg_temp.catat('kepala sekolah: tidak membaca baris', (select count(*) from wa_umpan_balik), 0::bigint);

select pg_temp.sebagai('admin');
select pg_temp.catat('admin: membaca semua baris', (select count(*) from wa_umpan_balik), 3::bigint);
select pg_temp.catat('admin: rekap terbaca', (select (public.wa_umpan_balik_ringkasan(id) ->> 'n')::int from wa_dataset), 3);

-- ── Mengubah jawaban: waktu kirim tetap, waktu ubah maju ──
reset role;
-- Mundurkan waktu isian R002 sehari; pemicu dimatikan sebentar karena ia sengaja menahan perubahan waktu.
alter table public.wa_umpan_balik disable trigger wa_umpan_balik_waktu;
update public.wa_umpan_balik set dikirim_pada = now() - interval '1 day', diperbarui_pada = now() - interval '1 day' where individu_id = 'R002';
alter table public.wa_umpan_balik enable trigger wa_umpan_balik_waktu;
select pg_temp.sebagai('pegawai');
update wa_umpan_balik set jawaban = pg_temp.jawaban(7, 'Diubah');
reset role;
select pg_temp.catat('ubah: waktu kirim pertama tetap', (select dikirim_pada < now() - interval '1 hour' from public.wa_umpan_balik where individu_id = 'R002'), true);
select pg_temp.catat('ubah: waktu ubah maju', (select diperbarui_pada > now() - interval '1 minute' from public.wa_umpan_balik where individu_id = 'R002'), true);

-- ── Anon ──
set role anon;
do $$ begin
  perform 1 from public.wa_umpan_balik limit 1;
  insert into hasil values ('anon: tabel ditolak', 'terbaca', 'ditolak', false);
exception when insufficient_privilege then
  insert into hasil values ('anon: tabel ditolak', 'ditolak', 'ditolak', true);
end $$;
reset role;

select uji, nilai, harap, lulus from hasil order by lulus, uji;
select count(*) filter (where lulus) as lulus, count(*) as total from hasil;
