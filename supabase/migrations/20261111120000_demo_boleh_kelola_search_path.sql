-- Perbaikan pemeriksaan pengelola kode demo lewat API (Admin CMS > Kode Demo).
--
-- Gejala di produksi 2026-11-11: membuat, melihat, dan mencabut kode demo dari Admin CMS gagal
-- dengan pesan `relation "profiles" does not exist`. Lewat SQL Editor tetap jalan.
--
-- Sebabnya: demo_boleh_kelola() di migration 20261111100000 memakai set search_path = '' lalu
-- memanggil public.is_admin_fammi(). Helper itu dibuat langsung di produksi tanpa set search_path
-- dan membaca tabel `profiles` tanpa awalan skema, jadi ia memakai search_path pemanggilnya. Di
-- dalam search_path kosong, `profiles` tidak ditemukan. SQL Editor tidak kena karena session_user
-- di sana bukan authenticator, sehingga fungsi ini sudah mengembalikan true sebelum helper dipanggil.
--
-- Perbaikannya hanya search_path fungsi ini: public, seperti fungsi lain di repo yang memanggil
-- is_admin_fammi() (mis. wa_umpan_balik_ringkasan, import_karakter_periode), ditambah pg_temp di
-- urutan terakhir supaya tabel sementara tidak pernah mendahului public.profiles. Isi fungsi tidak
-- berubah. Helper is_admin_fammi() sengaja tidak disentuh karena dipakai puluhan policy RLS.
--
-- Jalankan di SQL Editor sesudah 20261111100000. Aman dijalankan ulang.

create or replace function public.demo_boleh_kelola()
returns boolean language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if session_user::text <> 'authenticator' then
    return true;
  end if;
  return coalesce(auth.role(), '') = 'service_role' or coalesce(public.is_admin_fammi(), false);
end $$;

-- Pembantu internal, hanya dipanggil dari dalam fungsi pengelola (sama dengan migration asal).
revoke all on function public.demo_boleh_kelola() from public, anon, authenticated;
