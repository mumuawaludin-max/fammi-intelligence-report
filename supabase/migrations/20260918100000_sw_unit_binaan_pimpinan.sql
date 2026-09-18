-- Screening Awal Wellbeing: akun pimpinan (Direktur, Wakil Direktur) melihat unit binaannya.
--
-- Keputusan pemilik produk 2026-09-18: Direktur menilai para wakil direktur dan kepala
-- departemen; tiap wakil direktur menilai kepala sekolah di wilayahnya. Akun KepalaUnit milik
-- pimpinan itu melihat seluruh unit binaan (tanpa nama, sama seperti kepala unit biasa), bukan
-- cuma unit tempat ia terdaftar. Pembagiannya dibaca pembaca berkas dari kolom "dinilai ..." di
-- daftar induk (meta.cakupanPimpinan di sw_dataset).
--
-- Satu akun, banyak unit: disimpan di sw_unit_binaan, bukan kolom array di profiles, karena
-- mutasi profiles hanya lewat Edge Function dan tabel ini bisa diisi create-user (service role)
-- maupun SQL tambalan. Akun tanpa baris di sini tetap memakai profiles.sw_unit_id. Aman dijalankan
-- ulang.

create table if not exists public.sw_unit_binaan (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  unit_id text not null,
  sekolah_id text not null,
  dibuat timestamptz not null default now(),
  primary key (profile_id, unit_id)
);

comment on table public.sw_unit_binaan is
  'Screening Awal Wellbeing: unit binaan akun KepalaUnit pimpinan (Direktur/Wakil Direktur). Diisi create-user atau SQL, dibaca lewat my_sw_unit_ids().';

alter table public.sw_unit_binaan enable row level security;

drop policy if exists sw_unit_binaan_baca on public.sw_unit_binaan;
create policy sw_unit_binaan_baca on public.sw_unit_binaan
for select to authenticated
using (profile_id = (select auth.uid()) or (select public.is_admin_fammi()));

grant select on public.sw_unit_binaan to authenticated;

-- Unit yang boleh dibaca akun KepalaUnit: unit binaan kalau ada, kalau tidak unit tautannya.
create or replace function public.my_sw_unit_ids()
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(
    (select array_agg(unit_id) from public.sw_unit_binaan where profile_id = auth.uid()),
    (select array_remove(array[sw_unit_id], null) from public.profiles where id = auth.uid()),
    array[]::text[]
  )
$$;

revoke all on function public.my_sw_unit_ids() from public, anon;
grant execute on function public.my_sw_unit_ids() to authenticated;

drop policy if exists sw_unit_baca on public.sw_unit;
create policy sw_unit_baca on public.sw_unit
for select to authenticated
using (
  public.sw_sekolah_boleh(sekolah_id)
  and (
    (select public.my_peran()) in ('HumanCapital', 'Yayasan')
    or ((select public.my_peran()) = 'KepalaUnit' and unit_id = any ((select public.my_sw_unit_ids())::text[]))
    or (
      (select public.my_peran()) = 'Pegawai'
      and unit_id = public.sw_unit_pegawai(dataset_id)
      and n_pengisi >= public.sw_min_pengisi(dataset_id)
    )
  )
);
