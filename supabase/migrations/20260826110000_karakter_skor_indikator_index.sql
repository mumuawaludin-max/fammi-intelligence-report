-- Perbaiki performa view ypt_k_indikator (migration 20260825120000) yang timeout (57014
-- "canceling statement due to statement timeout") saat dibaca akun Yayasan Pendidikan Telkom.
--
-- Sebabnya: query .in("sekolah_id", <26 sekolah>) pada karakter_skor_indikator adalah pemakaian
-- PERTAMA tabel ini yang menjangkau puluhan sekolah sekaligus -- selama ini selalu dipakai per
-- SATU sekolah (Wali Kelas/Kepsek), yang cepat walau tanpa index eksplisit karena hasil
-- penyaringannya kecil. Lintas 26 sekolah, planner harus memindai porsi jauh lebih besar dari
-- tabel (ratusan ribu baris) sambil mengevaluasi policy RLS karakter_skor_indikator_baca_yayasan
-- (EXISTS berkorelasi ke profiles+schools) untuk tiap baris -- tanpa index gabungan sekolah_id +
-- periode_id, ini jatuh ke sequential scan dan melebihi batas waktu authenticated role.
--
-- Diuji: dengan filter periode_id=eq.2026-05 SAJA (bukan tiga periode sekaligus), query masih
-- timeout di ~9.2 detik -- jadi ini genuinely soal index, bukan volume data tiga periode.
create index if not exists karakter_skor_indikator_sekolah_periode_idx
  on public.karakter_skor_indikator (sekolah_id, periode_id);

-- Sekolah_periode juga dipakai ypt_k_sekolah/ypt_k_siswa_ekstrem/ypt_k_aspek (semua dari
-- karakter_skor). Keduanya BERHASIL tanpa index eksplisit di uji coba awal, tapi datanya akan
-- terus bertambah tiap bulan -- tambahkan sekarang sebagai pencegahan, bukan menunggu sampai
-- ikut timeout di kemudian hari.
create index if not exists karakter_skor_sekolah_periode_idx
  on public.karakter_skor (sekolah_id, periode_id);

-- karakter_pernyataan_ortu dipakai ypt_cs_agregat (Citra Sekolah) dengan pola .in() yang sama.
create index if not exists karakter_pernyataan_ortu_sekolah_periode_idx
  on public.karakter_pernyataan_ortu (sekolah_id, periode_id);
