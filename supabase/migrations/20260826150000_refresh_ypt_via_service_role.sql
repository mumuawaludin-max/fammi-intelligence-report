-- Izinkan refresh_ypt_karakter_views() dipanggil lewat service_role (Edge Function
-- refresh-ypt-views), bukan cuma lewat RPC langsung sebagai role authenticated -- lihat
-- catatan panjang di supabase/functions/refresh-ypt-views/index.ts kenapa pemanggilan
-- langsung sebagai authenticated selalu kena statement_timeout connection pooler.
--
-- Saat dipanggil lewat service_role, auth.uid() bernilai NULL (tidak ada JWT user yang
-- diteruskan), jadi my_peran() juga NULL. Kondisi asli "my_peran() <> 'AdminFammi'" akan
-- otomatis TIDAK memicu exception saat NULL (semantik SQL: IF NULL diperlakukan seperti
-- false), tapi itu perilaku IMPLISIT yang gampang disalahpahami pembaca kode lain. Dibuat
-- eksplisit di sini: exception hanya dilempar kalau my_peran() sungguh-sungguh terisi dan
-- BUKAN AdminFammi. Otorisasi sesungguhnya untuk jalur service_role sudah ditegakkan di Edge
-- Function itu sendiri (verifikasi JWT pemanggil sebelum memakai service_role).
create or replace function public.refresh_ypt_karakter_views()
returns void
language plpgsql
security definer
as $$
begin
  if public.my_peran() is not null and public.my_peran() <> 'AdminFammi' then
    raise exception 'Hanya AdminFammi yang boleh me-refresh ringkasan Rapor Karakter YPT.';
  end if;

  set local statement_timeout = '5min';

  refresh materialized view concurrently public.ypt_k_sekolah_mat;
  refresh materialized view concurrently public.ypt_k_aspek_mat;
  refresh materialized view concurrently public.ypt_k_indikator_mat;
  refresh materialized view concurrently public.ypt_k_siswa_ekstrem_mat;
end;
$$;
