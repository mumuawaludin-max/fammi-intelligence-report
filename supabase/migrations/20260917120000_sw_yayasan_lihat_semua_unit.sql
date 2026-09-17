-- Screening Awal Wellbeing: unit dengan pengisi di bawah ambang tetap terbaca.
--
-- Keputusan pemilik produk 2026-09-17: baris "7 unit kecil (digabung)" dan unit yang hilang dari
-- Daftar Peserta, Per Unit, dan Pandangan Atasan memancing pertanyaan, jadi laporan harus memuat
-- semua unit. Berlaku untuk Yayasan dan Human Capital (semua unit sekolahnya) serta KepalaUnit
-- (unitnya sendiri, walau pengisinya sedikit). Ambang tetap berlaku untuk Pegawai: unit kecil
-- tidak dipakai sebagai pembanding laporan pribadinya. Padanannya di React: unitBolehTampil
-- (web/src/pages/sw/lib/swAturan.js). Aman dijalankan ulang.

drop policy if exists sw_unit_baca on public.sw_unit;
create policy sw_unit_baca on public.sw_unit
for select to authenticated
using (
  public.sw_sekolah_boleh(sekolah_id)
  and (
    (select public.my_peran()) in ('HumanCapital', 'Yayasan')
    or ((select public.my_peran()) = 'KepalaUnit' and unit_id = (select public.my_sw_unit_id()))
    or (
      (select public.my_peran()) = 'Pegawai'
      and unit_id = public.sw_unit_pegawai(dataset_id)
      and n_pengisi >= public.sw_min_pengisi(dataset_id)
    )
  )
);
