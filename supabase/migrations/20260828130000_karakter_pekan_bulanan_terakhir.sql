-- Penilaian bulanan diperlakukan sebagai pekan TERAKHIR, dan bahan grafik tren pekanan.
--
-- Dua penajaman atas migration 20260828120000, keduanya dari arahan pemilik produk 2026-08-28:
--
-- 1. "Kalau inputannya per bulan, berarti dianggap dia input di W4 bulan tersebut."
--
--    Di 20260828120000, pekan 0 (penilaian bulanan) diurutkan sebagai angka nol biasa, jadi
--    `pekan desc` menaruhnya PALING BAWAH. Untuk bulan yang isinya cuma penilaian bulanan tidak
--    ada bedanya, dan itulah sebabnya seluruh uji tetap lulus. Bedanya baru muncul di bulan yang
--    memuat DUA-DUANYA -- misalnya sekolah yang pindah ke penilaian pekanan di tengah bulan, atau
--    berkas yang memuat baris ringkasan bulanan di samping baris pekanan. Di situ `pekan desc`
--    memilih pekan 3 dan mengabaikan baris bulanan, padahal baris bulanan justru angka final
--    bulan itu.
--
--    Sekarang pekan 0 diurutkan sebagai pekan tertinggi. Aturan "ambil yang terakhir" jadi
--    berlaku seragam, apa pun campuran isinya.
--
-- 2. Grafik tren pekanan digambar sebagai satu garis menyambung lintas bulan (Okt P1 ... Okt P4,
--    Nov P1 ...), dengan penyaring tampilan per pekan atau per bulan. Titik untuk bulan yang
--    penilaiannya bulanan diletakkan di slot pekan 4, sejalan dengan butir 1.
--
-- BERLAKU UMUM, bukan untuk satu sekolah. Tidak ada nama sekolah di mana pun di berkas ini.
-- Sekolah berkerangka tunggal maupun per jenjang, yang menilai bulanan maupun pekanan, semuanya
-- lewat jalur yang sama; yang membedakan cuma isi kolom pekan-nya sendiri.
--
-- Idempoten, aman dijalankan ulang. Sudah diuji di postgres:15 dan postgres:17 lewat
-- supabase/tests (lihat README di sana).

-- ── 1. Urutan "pekan terakhir" memperhitungkan penilaian bulanan ───────────────────────────
-- 99, bukan 4, supaya baris bulanan tetap menang atas pekan 5 seandainya ada sekolah yang
-- memakai lima pekan dalam sebulan. Angka ini cuma untuk MENGURUTKAN, tidak pernah tersimpan
-- dan tidak pernah tampil.
create or replace view public.karakter_skor_bulanan
with (security_invoker = true)
as
select distinct on (sekolah_id, murid_id, periode_id, aspek_kode, sumber)
  sekolah_id, jenjang, kelas_id, murid_id, nama_murid, periode_id,
  aspek_kode, skor, sumber, status, pekan
from public.karakter_skor
order by sekolah_id, murid_id, periode_id, aspek_kode, sumber,
         (skor is null) asc,
         (case when pekan = 0 then 99 else pekan end) desc;

comment on view public.karakter_skor_bulanan is
  'Satu baris skor per (murid, periode, aspek, sumber): nilai PEKAN TERAKHIR yang ada isinya, bukan rata-rata seluruh pekan. Penilaian bulanan (pekan 0) dihitung sebagai pekan terakhir bulan itu, jadi ia menang atas baris pekanan mana pun di bulan yang sama. Seluruh agregat bulanan WAJIB membaca view ini, bukan karakter_skor mentah.';

create or replace view public.karakter_skor_indikator_bulanan
with (security_invoker = true)
as
select distinct on (sekolah_id, murid_id, periode_id, aspek_kode, indikator_kode, sumber)
  sekolah_id, jenjang, kelas_id, murid_id, nama_murid, periode_id,
  aspek_kode, indikator_kode, skor, sumber, status, pekan
from public.karakter_skor_indikator
order by sekolah_id, murid_id, periode_id, aspek_kode, indikator_kode, sumber,
         (skor is null) asc,
         (case when pekan = 0 then 99 else pekan end) desc;

-- ── 2. Slot tampilan pekan ─────────────────────────────────────────────────────────────────
-- pekan_urut ditambahkan DI AKHIR daftar kolom, karena CREATE OR REPLACE VIEW cuma mengizinkan
-- penambahan di akhir; menyisipkannya di tengah ditolak dengan "cannot change name of view
-- column". Pelajaran dari migration 20260828110000 yang sempat kena persis itu.
--
-- 4, bukan 99 seperti di pengurutan atas: ini POSISI DI SUMBU GRAFIK, dan bulan yang penilaiannya
-- bulanan digambar di slot pekan keempat supaya garisnya menyambung dengan bulan-bulan yang
-- pekanan. 99 akan menempatkannya jauh di kanan, terpisah dari garisnya.
create or replace view public.karakter_pekan_aspek_avg
with (security_invoker = true)
as
select
  sekolah_id,
  jenjang,
  kelas_id,
  periode_id,
  pekan,
  aspek_kode,
  sumber,
  count(distinct murid_id) as jumlah_murid,
  round(avg(skor))::int    as rata,
  (case when pekan = 0 then 4 else pekan end)::smallint as pekan_urut
from public.karakter_skor
where skor is not null
group by sekolah_id, jenjang, kelas_id, periode_id, pekan, aspek_kode, sumber;

-- ── 3. Titik garis tren pekanan ────────────────────────────────────────────────────────────
-- Satu angka per (kelas, periode, pekan): rata-rata seluruh aspek dan seluruh murid di pekan itu.
--
-- Dibuat sebagai view tersendiri, bukan dirata-ratakan di React dari karakter_pekan_aspek_avg,
-- karena merata-ratakan rata-rata per aspek TIDAK sama dengan rata-rata seluruh baris begitu
-- jumlah murid yang dinilai berbeda antar aspek -- dan itu wajar terjadi (satu aspek belum
-- selesai dinilai saat ekspor dibuat). FIR juga memang tidak menghitung agregat (butir 3
-- CLAUDE.md).
--
-- kelas_id ikut supaya Wali Kelas bisa menyaring kelasnya sendiri; Kepala Sekolah menjumlah ulang
-- lewat view ini juga dengan mengabaikan kolom itu.
create or replace view public.karakter_pekan_avg
with (security_invoker = true)
as
select
  sekolah_id,
  jenjang,
  kelas_id,
  periode_id,
  pekan,
  sumber,
  count(distinct murid_id) as jumlah_murid,
  round(avg(skor))::int    as rata,
  (case when pekan = 0 then 4 else pekan end)::smallint as pekan_urut
from public.karakter_skor
where skor is not null
group by sekolah_id, jenjang, kelas_id, periode_id, pekan, sumber;

grant select on public.karakter_pekan_avg to authenticated;

comment on view public.karakter_pekan_avg is
  'Titik garis tren pekanan: satu angka per (kelas, periode, pekan), rata-rata seluruh aspek dan murid. pekan_urut menaruh penilaian bulanan (pekan 0) di slot pekan 4 supaya garisnya menyambung dengan bulan yang pekanan.';
