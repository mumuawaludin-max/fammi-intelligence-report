-- Naikkan statement_timeout untuk role 'authenticated', khusus untuk mengatasi
-- refresh_ypt_karakter_views() (migration 20260826130000) yang tetap kena
-- "canceling statement due to statement timeout" WALAU sudah ada `set local
-- statement_timeout = '5min'` di dalam fungsinya.
--
-- Root cause: batas waktu default role 'authenticated' di Supabase ditegakkan di level
-- koneksi yang dipakai PostgREST (pooled, transaction-mode) -- `set local` di dalam fungsi
-- yang dipanggil lewat RPC dari role itu TIDAK bisa diandalkan menimpanya (terverifikasi
-- 2026-08-26: prosrc fungsi memuat baris SET LOCAL persis seperti yang ditulis, tapi refresh
-- tetap timeout). Cara yang didukung resmi oleh Supabase untuk kasus ini adalah menaikkan
-- default di level ROLE, bukan mengandalkan override per-transaksi.
--
-- TRADE-OFF yang perlu disadari: ini menaikkan batas waktu untuk SEMUA query yang dijalankan
-- sebagai role authenticated (seluruh aplikasi FIR), bukan cuma RPC refresh ini. Kalau ada query
-- lain yang seharusnya cepat tapi kebetulan berat (mis. bug tanpa index), ia sekarang akan
-- berjalan sampai 5 menit sebelum dibatalkan, alih-alih 8 detik. Untuk skala pemakaian FIR
-- (aplikasi internal, bukan API publik bertraffic tinggi), risiko ini diterima demi
-- membuka fitur refresh; kalau nanti terasa mengganggu, pindahkan refresh_ypt_karakter_views()
-- ke Edge Function yang jalan sebagai service_role (tidak kena batas role authenticated sama
-- sekali) alih-alih menaikkan batas global -- lihat catatan di akhir file ini.
alter role authenticated set statement_timeout = '5min';

comment on function public.refresh_ypt_karakter_views() is
  'Refresh keempat materialized view Rapor Karakter YPT. Panggil lewat tombol "Refresh Ringkasan '
  'Rapor Karakter" di Admin CMS setelah impor data Karakter sekolah Telkom mana pun selesai -- '
  'dashboard YPT membaca data yang di-snapshot di sini, bukan live, supaya cepat. Butuh statement_timeout '
  'role authenticated dinaikkan (migration 20260826140000) -- SET LOCAL di dalam fungsi ini sendiri '
  'terbukti tidak cukup untuk memanjangkan batas waktu koneksi pooled PostgREST.';

-- Alternatif lebih presisi untuk nanti (TIDAK dijalankan di sini, cuma catatan): pindahkan
-- pemanggilan refresh ke Edge Function baru yang connect pakai SERVICE_ROLE_KEY (pola sama
-- seperti admin-actions/index.ts), supaya statement_timeout role authenticated tidak perlu
-- dinaikkan sama sekali -- service_role biasanya punya batas jauh lebih longgar secara default.
