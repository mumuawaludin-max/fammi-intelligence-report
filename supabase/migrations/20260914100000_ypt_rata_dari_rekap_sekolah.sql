-- Dashboard YPT membaca angka pencapaian dari REKAP SEKOLAH, bukan menghitung ulang dari skor
-- per murid.
--
-- MASALAH. Keempat matview YPT selama ini merata-ratakan sendiri baris karakter_skor_bulanan
-- (`round(avg(skor))`). Seluruh layar FIR yang lain -- kartu hero Kepala Sekolah, kartu hero
-- Yayasan biasa, grafik tren -- membaca angka yang sudah final di
-- `karakter_summary.ringkasan.rata_pencapaian_guru`, yaitu salinan apa adanya sheet
-- ringkasan sekolah di berkas unggahan. Dua sumber, dua angka, dan satu-satunya yang diakui
-- sekolah adalah yang kedua. Ini juga melanggar butir 3 CLAUDE.md: FIR tidak menghitung apa
-- pun, ia membaca yang sudah final.
--
-- Selisihnya bukan pembulatan. Diperiksa terhadap berkas rekap 26 sekolah YPT 2026-03..05
-- (78 baris sekolah-bulan, "Summary Sekolah YPT.xlsx", 2026-09-14): di lima baris, rekap
-- sekolah sendiri berbeda lebih dari satu poin dari rata-rata kolom aspeknya sendiri --
-- SMK Telkom Jakarta 2026-03 rekap 80 vs rata-rata aspek 87, 2026-04 rekap 79 vs 87,
-- SMP Telkom Bandung 2026-04 rekap 91 vs 96 dan 2026-05 rekap 90 vs 88, SD Telkom Padang
-- 2026-03 rekap 75 vs 70. Kalau rekap saja tidak sama dengan rata-rata kolomnya sendiri,
-- tidak ada rumus di sisi FIR yang bisa menyamai rekap; satu-satunya cara adalah membacanya.
-- Selisih yang lebih besar lagi datang dari berkas yang sheet detail dan sheet rekapnya memang
-- tidak sejalan (tercatat 2026-09-01: SMK Telkom Makassar detail 87,6 vs rekap 76; TK Telkom
-- Batam karakter2 detail 90,9 vs rekap 98).
--
-- YANG DIUBAH. Hanya nilai rata-ratanya:
--   ypt_k_sekolah_mat.rata_total -> rekap, dengan hitungan lama sebagai cadangan.
--   ypt_k_aspek_mat.rata         -> rekap, dengan hitungan lama sebagai cadangan.
-- `jumlah_siswa` di kedua matview TETAP dihitung dari karakter_skor_bulanan, karena rekap
-- sekolah tidak memuat jumlah murid yang dinilai dan angka itu cuma dipakai sebagai BOBOT
-- agregasi jenjang/yayasan, bukan ditampilkan sebagai pencapaian.
--
-- Saringan `skor > 0` (migration 20260901110000) dan `sumber = 'guru'` (20260901130000) tetap
-- berlaku pada jalur cadangan; keduanya keputusan terkunci pemilik produk, tidak disentuh.
--
-- YANG TIDAK DIUBAH. ypt_k_indikator_mat dan ypt_k_siswa_ekstrem_mat tetap dihitung dari skor
-- per murid, karena rekap sekolah memang tidak punya kolom per indikator maupun per murid.
-- KONSEKUENSI YANG DISADARI: di sekolah yang sheet detail dan sheet rekapnya tidak sejalan,
-- kartu sekolah akan menampilkan angka rekap sementara daftar "lima murid terendah" berasal
-- dari sebaran detail. Itu bukan cacat kode, itu keadaan berkasnya; perbaikannya QC berkas di
-- hulu, bukan menyamakan paksa dua sumber yang memang berbeda.
--
-- URUTAN PENCARIAN NILAI GURU, sama persis dengan yang dipakai layar Kepala Sekolah
-- (KepsekView.jsx baris 61):
--   1. rata_pencapaian_guru
--   2. rata-rata seluruh kolom rata_input_guru_karakterN_*
--   3. pencapaian_guru, pilihan terakhir
-- YANG PENTING DI SINI URUTANNYA, bukan daftarnya. `pencapaian_guru` (tanpa awalan rata_)
-- adalah KELENGKAPAN INPUT, bukan pencapaian karakter; melompat dari tingkat 1 langsung ke
-- tingkat 3 adalah bug yang pernah membuat lima TK Telkom tampil 100%. Diukur pada 78 baris
-- rekap YPT: 68 di antaranya punya `pencapaian_guru` yang berbeda lebih dari 5 poin dari
-- pencapaian sebenarnya -- contoh paling telak SMK Telkom Jakarta 2026-05, kelengkapan 20%
-- sementara pencapaian 80%.
-- Tingkat 2 memang terpakai, bukan teori: lima sekolah (TK Telkom Banjarbaru, Batam, Buahbatu,
-- Dayeuhkolot, Ternate = 15 dari 78 baris) tidak punya kolom rata_pencapaian_guru sama sekali.
-- Tingkat 3 tidak pernah terpakai di data YPT; ia ada supaya aturan di sini identik dengan
-- React, dan karena sebagian sekolah di LUAR YPT memang menaruh angka pencapaiannya di kolom
-- bernama begitu.
--
-- Idempoten, aman dijalankan ulang. Jalankan lewat Supabase SQL Editor. Matview dibuat WITH
-- DATA, jadi tidak perlu refresh manual sesudahnya. Diuji lewat supabase/tests
-- (ypt_rekap_sekolah_verify.sql) di postgres:15 dan postgres:17.

-- SATU TRANSAKSI, alasan sama seperti 20260901130000: berkas ini menghapus dulu baru membuat
-- ulang dua matview YPT, dan kegagalan di tengah tanpa transaksi akan mematikan dashboard YPT.
begin;

-- ── 1. Pembaca nilai persen dari kolom rekap ───────────────────────────────────────────────
-- Cerminan persis pct() di web/src/pages/karakter/karakterMeta.js. Dua jalur baca harus
-- memberi angka yang sama; kalau salah satu berubah, yang lain wajib ikut.
--
-- Bentuk nilai yang nyata ada di karakter_summary.ringkasan:
--   "95 %" / "99,79%"  teks, koma sebagai desimal (format Indonesia)
--   0.91               angka, kolom diformat Percentage di Excel sehingga xlsx.js membaca
--                      nilai sel asli, bukan teks tertampil (ditemukan di SMK Telkom Purwokerto)
--   95                 angka biasa
-- Aturan "pecahan dikali 100" SENGAJA hanya berlaku untuk nilai bertipe number, persis seperti
-- di JavaScript: teks "0.91" tetap dibulatkan jadi 1, karena teks datang dari kolom yang memang
-- diketik manual dan tidak pernah berupa pecahan.
create or replace function public.ypt_pct(v jsonb)
returns int
language plpgsql
immutable
as $fn$
declare
  t text;
  n numeric;
begin
  if v is null or jsonb_typeof(v) in ('null', 'object', 'array', 'boolean') then
    return null;
  end if;

  if jsonb_typeof(v) = 'number' then
    n := (v #>> '{}')::numeric;
    -- Pecahan Excel. n = 1 ambigu (bisa "100%" pecahan atau skor asli 1); dalam data karakter
    -- pencapaian 100% jauh lebih umum, jadi ditafsir 100 -- sama seperti pct() di React.
    if n > 0 and n < 1 then return round(n * 100); end if;
    if n = 1 then return 100; end if;
    return round(n);
  end if;

  -- regexp_replace tanpa flag 'g' mengganti kemunculan PERTAMA saja, meniru String.replace()
  -- JavaScript yang juga bukan global. Penting untuk nilai bertanda ribuan.
  t := regexp_replace(regexp_replace(v #>> '{}', '%', ''), ',', '.');
  -- Meniru parseFloat: lewati spasi di depan, ambil bilangan di AWAL, berhenti di karakter
  -- pertama yang bukan angka. Teks yang tidak diawali bilangan menghasilkan NULL (NaN di JS).
  t := (regexp_match(t, '^\s*([-+]?[0-9]*\.?[0-9]+)'))[1];
  if t is null then return null; end if;
  return round(t::numeric);
end;
$fn$;

comment on function public.ypt_pct(jsonb) is
  'Cerminan pct() di karakterMeta.js: baca nilai persen dari kolom karakter_summary.ringkasan '
  'yang bisa berupa teks "84,67 %", pecahan Excel 0.91, atau angka biasa. Ubah bareng dengan '
  'padanannya di React, jangan sendirian.';

-- ── 2. Kolom rekap sekolah, sudah dinormalkan namanya ──────────────────────────────────────
-- Internal, TIDAK di-grant ke authenticated: matview di bawah membacanya saat refresh (lewat
-- refresh_ypt_karakter_views() yang security definer), dan tidak ada yang perlu membacanya
-- langsung dari React.
--
-- Nama kolom dinormalkan (huruf kecil, spasi/strip jadi underscore) karena karakter_summary
-- menyimpan header Excel APA ADANYA -- pushSummary() di karakterImporter.js cuma menyalin objek
-- barisnya. Header dengan spasi tak terlihat hasil copy-paste sudah pernah terjadi di berkas
-- sungguhan, jadi pencocokan mentah `ringkasan -> 'rata_pencapaian_guru'` tidak cukup.
--
-- distinct on: kalau satu (sekolah, periode) punya lebih dari satu baris scope='sekolah'
-- (mis. sisa impor lama), yang menang adalah yang terakhir masuk. Aturan yang sama dengan
-- pushSummary() di importer, supaya tampilan tidak berganti-ganti angka antar refresh.
--
-- URUTAN DROP PENTING. Kedua matview di bawah dibuat DI ATAS ketiga view ini, jadi pada
-- jalan KEDUA (berkas ini idempoten, memang dirancang boleh dijalankan ulang) matview
-- peninggalan jalan pertama masih memegang ketiganya. Menjatuhkan view rekap lebih dulu akan
-- ditolak Postgres dengan "cannot drop ... because other objects depend on it". Jadi matview
-- dan view pembungkusnya dijatuhkan dulu di sini; pembuatannya tetap di bagian 5 dan 6.
drop view if exists public.ypt_k_sekolah;
drop materialized view if exists public.ypt_k_sekolah_mat;
drop view if exists public.ypt_k_aspek;
drop materialized view if exists public.ypt_k_aspek_mat;

drop view if exists public.ypt_rekap_aspek_guru;
drop view if exists public.ypt_rekap_sekolah_guru;
drop view if exists public.ypt_rekap_kolom;

create view public.ypt_rekap_kolom
with (security_invoker = true)
as
with rekap as (
  select distinct on (sekolah_id, periode_id)
    sekolah_id, periode_id, ringkasan
  from public.karakter_summary
  where scope = 'sekolah' and ringkasan is not null
  order by sekolah_id, periode_id, id desc
)
select
  r.sekolah_id,
  r.periode_id,
  lower(regexp_replace(btrim(e.key), '[\s_-]+', '_', 'g')) as kunci,
  e.value as nilai
from rekap r
cross join lateral jsonb_each(r.ringkasan) as e(key, value);

comment on view public.ypt_rekap_kolom is
  'Kolom sheet ringkasan sekolah (karakter_summary scope=sekolah), satu baris per kolom, nama '
  'kolom sudah dinormalkan. Internal untuk matview YPT; tidak di-grant ke authenticated.';

-- ── 3. Angka pencapaian guru per sekolah, menurut rekap ────────────────────────────────────
create view public.ypt_rekap_sekolah_guru
with (security_invoker = true)
as
select
  sekolah_id,
  periode_id,
  coalesce(
    -- Tingkat 1: angka final yang ditulis sekolah sendiri.
    max(public.ypt_pct(nilai)) filter (where kunci = 'rata_pencapaian_guru'),
    -- Tingkat 2: rata-rata kolom per karakter. avg() mengabaikan NULL, jadi kolom yang tidak
    -- terbaca dilewati -- sama dengan avgAspek() di React yang menyaring v != null. Nilai 0
    -- IKUT dirata-rata di sini (beda dari saringan skor > 0 pada jalur cadangan di bawah),
    -- karena 0 pada kolom rekap adalah angka yang ditulis sekolah, bukan penanda "tidak dinilai".
    round(avg(public.ypt_pct(nilai))
          filter (where kunci ~ '^rata_input_guru_karakter[0-9]+(_|$)')),
    -- Tingkat 3: pilihan terakhir, dan HANYA pilihan terakhir. `pencapaian_guru` berarti
    -- kelengkapan input; ia benar cuma untuk sekolah yang kebetulan menaruh angka
    -- pencapaiannya di kolom bernama begitu. Tingkat ini ada di sini SEMATA supaya aturannya
    -- identik dengan nilaiGuruSekolah() di React: dua layar yang membaca baris rekap yang sama
    -- harus sampai pada angka yang sama, termasuk saat barisnya aneh. Untuk 78 baris rekap YPT
    -- 2026-03..05 tingkat ini tidak pernah terpakai -- semuanya punya kolom per karakter.
    max(public.ypt_pct(nilai)) filter (where kunci = 'pencapaian_guru')
  )::int as rata_guru
from public.ypt_rekap_kolom
group by sekolah_id, periode_id;

comment on view public.ypt_rekap_sekolah_guru is
  'Pencapaian karakter guru per sekolah per periode menurut REKAP sekolah. Tiga tingkat, cerminan '
  'persis nilaiGuruSekolah() di karakterMeta.js: rata_pencapaian_guru, lalu rata-rata kolom '
  'rata_input_guru_karakterN_*, lalu pencapaian_guru sebagai pilihan terakhir. Urutannya yang '
  'penting: pencapaian_guru artinya KELENGKAPAN INPUT, jadi ia tidak boleh naik ke atas tingkat 2.';

-- ── 4. Angka per karakter menurut rekap ────────────────────────────────────────────────────
-- Berkunci aspek_kode pendek ("karakter1"), sama dengan karakter_skor.aspek_kode, sehingga bisa
-- dijodohkan langsung dengan baris matview aspek di bawah. Nama panjang di header Excel
-- ("rata_input_guru_karakter2_empati") memang membawa label, tapi label sudah punya sumbernya
-- sendiri di karakter_aspek_config dan tidak diambil dari sini.
create view public.ypt_rekap_aspek_guru
with (security_invoker = true)
as
select
  sekolah_id,
  periode_id,
  (regexp_match(kunci, '^rata_input_guru_(karakter[0-9]+)'))[1] as aspek_kode,
  max(public.ypt_pct(nilai))::int as rata
from public.ypt_rekap_kolom
where kunci ~ '^rata_input_guru_karakter[0-9]+(_|$)'
group by 1, 2, 3;

comment on view public.ypt_rekap_aspek_guru is
  'Nilai per karakter (kolom rata_input_guru_karakterN_*) dari rekap sekolah, berkunci aspek_kode '
  'pendek supaya bisa dijodohkan dengan karakter_skor.aspek_kode.';

-- ── 5. Ringkasan per sekolah ───────────────────────────────────────────────────────────────
-- Sudah dijatuhkan di bagian 2 (lihat catatan urutan drop di sana).
create materialized view public.ypt_k_sekolah_mat as
with detail as (
  select
    sekolah_id,
    periode_id,
    count(distinct murid_id) as jumlah_siswa,
    round(avg(skor))::int    as rata_hitung
  from public.karakter_skor_bulanan
  where skor is not null and skor > 0 and sumber = 'guru'
  group by sekolah_id, periode_id
)
select
  d.sekolah_id,
  d.periode_id,
  d.jumlah_siswa,
  coalesce(r.rata_guru, d.rata_hitung) as rata_total
from detail d
left join public.ypt_rekap_sekolah_guru r
  on r.sekolah_id = d.sekolah_id and r.periode_id = d.periode_id
with data;

create unique index on public.ypt_k_sekolah_mat (sekolah_id, periode_id);
revoke all on public.ypt_k_sekolah_mat from public, authenticated, anon;

create view public.ypt_k_sekolah as
select * from public.ypt_k_sekolah_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_sekolah to authenticated;

comment on materialized view public.ypt_k_sekolah_mat is
  'Pencapaian karakter per sekolah per periode untuk dashboard YPT. rata_total dibaca dari REKAP '
  'sekolah (karakter_summary scope=sekolah), sama seperti kartu hero Kepala Sekolah; hitungan '
  'dari karakter_skor_bulanan cuma cadangan untuk sekolah-bulan yang rekapnya belum masuk. '
  'jumlah_siswa selalu dari skor (murid yang benar-benar dinilai guru, skor > 0) dan dipakai '
  'sebagai bobot agregasi jenjang/yayasan, bukan ditampilkan sebagai pencapaian. Daftar periode '
  'juga bersandar pada matview ini, jadi barisnya sengaja tetap ditentukan oleh keberadaan skor: '
  'rekap tanpa skor sama sekali tidak memunculkan periode baru.';

-- ── 6. Ringkasan per aspek karakter per sekolah ────────────────────────────────────────────
-- Sudah dijatuhkan di bagian 2 (lihat catatan urutan drop di sana).
create materialized view public.ypt_k_aspek_mat as
with detail as (
  select
    s.sekolah_id,
    s.jenjang,
    s.periode_id,
    s.aspek_kode,
    c.aspek_label,
    c.identitas_kode,
    count(distinct s.murid_id) as jumlah_siswa,
    round(avg(s.skor))::int    as rata_hitung
  from public.karakter_skor_bulanan s
  left join public.karakter_aspek_config c
    on c.sekolah_id = s.sekolah_id
   and c.jenjang = s.jenjang
   and c.aspek_kode = s.aspek_kode
  where s.skor is not null and s.skor > 0 and s.sumber = 'guru'
  group by s.sekolah_id, s.jenjang, s.periode_id, s.aspek_kode, c.aspek_label, c.identitas_kode
)
select
  d.sekolah_id,
  d.jenjang,
  d.periode_id,
  d.aspek_kode,
  d.aspek_label,
  d.identitas_kode,
  d.jumlah_siswa,
  coalesce(r.rata, d.rata_hitung) as rata
from detail d
left join public.ypt_rekap_aspek_guru r
  on r.sekolah_id = d.sekolah_id
 and r.periode_id = d.periode_id
 and r.aspek_kode = d.aspek_kode
with data;

create unique index on public.ypt_k_aspek_mat (sekolah_id, jenjang, periode_id, aspek_kode);
revoke all on public.ypt_k_aspek_mat from public, authenticated, anon;

create view public.ypt_k_aspek as
select * from public.ypt_k_aspek_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_aspek to authenticated;

comment on materialized view public.ypt_k_aspek_mat is
  'Nilai per karakter per sekolah untuk dashboard YPT, dibaca dari rekap sekolah dengan hitungan '
  'karakter_skor_bulanan sebagai cadangan. Sekolah berkerangka karakter per jenjang tidak punya '
  'baris rekap sekolah sama sekali (importer sengaja melewatkan sheet ringkasan sekolah untuk '
  'sekolah bertipe itu), jadi baris per jenjangnya otomatis jatuh ke cadangan dan tidak pernah '
  'tertimpa satu angka se-sekolah yang salah.';

commit;
