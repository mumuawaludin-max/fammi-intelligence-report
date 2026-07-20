-- Izinkan nilai 'cw' (Corporate Culture & Wellbeing) di school_modules.modul.
--
-- Tanpa ini, mengaktifkan modul CW untuk sebuah sekolah/organisasi ditolak Postgres dengan
-- 23514 "violates check constraint school_modules_modul_check" -- constraint lamanya cuma
-- mengizinkan modul yang ada saat itu (karakter/mi/screening).
--
-- Constraint dibangun ulang secara DINAMIS, bukan dari daftar hardcode: nilai yang sudah
-- benar-benar dipakai di tabel ikut dipertahankan, lalu digabung dengan daftar modul baku
-- plus 'cw'. Alasannya, daftar modul yang sah di database produksi belum tentu sama persis
-- dengan yang terlihat di kode -- kalau ditulis hardcode dan ternyata ada baris lama dengan
-- nilai lain, `add constraint` gagal dan seluruh push ikut berhenti. Cara ini aman dijalankan
-- berapa kali pun dan tidak pernah membuat baris yang sudah ada jadi ilegal.

do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array['karakter', 'mi', 'screening', 'cw']) as v
    union
    select distinct modul from public.school_modules where modul is not null
  ) s;

  execute 'alter table public.school_modules drop constraint if exists school_modules_modul_check';
  execute format(
    'alter table public.school_modules add constraint school_modules_modul_check check (modul in (%s))',
    daftar
  );
end $$;
