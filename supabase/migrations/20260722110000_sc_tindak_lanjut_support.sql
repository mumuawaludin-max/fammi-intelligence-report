-- Izinkan modul School Culture (SC) memakai tabel generik tindak_lanjut/briefing yang sudah
-- dipakai modul Karakter, plus dua nilai `fokus` baru khusus SC ('budaya'/'kesejahteraan',
-- berdampingan dengan 'mutu'/'citra' milik Karakter).
--
-- PENTING -- beda dari school_modules_modul_check dan profiles_peran_check: CHECK constraint
-- tindak_lanjut.modul / tindak_lanjut.scope / tindak_lanjut.fokus / briefing.modul TIDAK
-- tercatat di migration mana pun di repo ini (tabel-tabel itu dibuat langsung di project
-- Supabase sebelum folder migrations ini dipakai) -- lihat catatan Fase eksplorasi sesi ini.
-- Migration ini TIDAK menebak isi constraint itu secara membabi buta. Ia hanya bertindak KALAU
-- constraint dengan nama konvensi default Postgres (`<tabel>_<kolom>_check`, sama seperti
-- school_modules_modul_check) benar-benar ada, dan kalau ada, dibangun ulang secara DINAMIS
-- (union nilai yang sudah dipakai di tabel + daftar baku) -- pola identik
-- 20260720110000_school_modules_allow_cw.sql. Kalau constraint-nya ternyata bernama lain, blok
-- ini no-op dengan aman (tidak mengubah apa pun), dan RPC/Edge Function SC akan gagal jelas
-- dengan pesan "violates check constraint <nama asli>" saat pertama dipakai -- itu sinyal untuk
-- menambah blok serupa dengan nama yang benar, bukan kegagalan diam-diam.

do $$
declare
  daftar text;
  con_exists boolean;
begin
  select exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'tindak_lanjut' and c.conname = 'tindak_lanjut_modul_check'
  ) into con_exists;

  if con_exists then
    select string_agg(quote_literal(v), ', ' order by v) into daftar
    from (
      select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc']) as v
      union
      select distinct modul from public.tindak_lanjut where modul is not null
    ) s;
    execute 'alter table public.tindak_lanjut drop constraint tindak_lanjut_modul_check';
    execute format('alter table public.tindak_lanjut add constraint tindak_lanjut_modul_check check (modul in (%s))', daftar);
  end if;
end $$;

do $$
declare
  daftar text;
  con_exists boolean;
begin
  select exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'briefing' and c.conname = 'briefing_modul_check'
  ) into con_exists;

  if con_exists then
    select string_agg(quote_literal(v), ', ' order by v) into daftar
    from (
      select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc']) as v
      union
      select distinct modul from public.briefing where modul is not null
    ) s;
    execute 'alter table public.briefing drop constraint briefing_modul_check';
    execute format('alter table public.briefing add constraint briefing_modul_check check (modul in (%s))', daftar);
  end if;
end $$;

-- fokus: SC memakai dua sumbu baru ('budaya'/'kesejahteraan') berdampingan dengan
-- 'mutu'/'citra' milik Karakter, bukan menggantikannya.
do $$
declare
  daftar text;
  con_exists boolean;
begin
  select exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'tindak_lanjut' and c.conname = 'tindak_lanjut_fokus_check'
  ) into con_exists;

  if con_exists then
    select string_agg(quote_literal(v), ', ' order by v) into daftar
    from (
      select unnest(array['mutu', 'citra', 'budaya', 'kesejahteraan']) as v
      union
      select distinct fokus from public.tindak_lanjut where fokus is not null
    ) s;
    execute 'alter table public.tindak_lanjut drop constraint tindak_lanjut_fokus_check';
    execute format('alter table public.tindak_lanjut add constraint tindak_lanjut_fokus_check check (fokus in (%s))', daftar);
  end if;
end $$;

-- scope: SC hanya memakai 'sekolah' (tidak ada scope 'kelas'/'murid' seperti Karakter) untuk
-- rilis awal ini -- lihat catatan "Perbandingan Antarunit" di plan/docs, per-unit scope
-- (mis. 'unit') sengaja BELUM ditambahkan sampai pipeline hulu benar-benar mengekspor data
-- per unit. 'sekolah' hampir pasti sudah ada di constraint lama (dipakai Karakter untuk
-- Kepsek/Yayasan), jadi migration ini TIDAK perlu menyentuh tindak_lanjut.scope sama sekali.
