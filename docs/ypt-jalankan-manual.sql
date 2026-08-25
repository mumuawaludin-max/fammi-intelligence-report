-- ═══════════════════════════════════════════════════════════════════════════════════════════
-- YPT — SELURUH MIGRATION DALAM SATU BERKAS, UNTUK DITEMPEL KE SUPABASE SQL EDITOR
--
-- Dibuat karena Supabase CLI (`supabase db push`) tidak tersedia. Isinya gabungan apa adanya
-- dari empat berkas di supabase/migrations/:
--   20260825100000_ypt_naungan_dan_kota.sql
--   20260825110000_ypt_akun_dan_helper_yayasan.sql   <- diperbaiki 2026-08-26 (my_yayasan_school_ids)
--   20260825120000_ypt_karakter_views.sql
--   20260825130000_ypt_kp_testimoni_dokumentasi.sql  <- diperbaiki 2026-08-26 (policy dp_item_baca)
--
-- CARA PAKAI: tempel SATU BAGIAN pada satu waktu (dipisah garis ══), jalankan, baca pesan
-- NOTICE-nya, baru lanjut ke bagian berikutnya. Jangan tempel semuanya sekaligus -- kalau ada
-- yang gagal di tengah, jauh lebih sulit tahu bagian mana yang sudah terlanjur jalan.
--
-- Kalau Bagian 1-3 sudah pernah berhasil dijalankan sebelumnya, tidak perlu diulang (tapi aman
-- kalau diulang, semuanya idempotent). Yang WAJIB dijalankan ulang: Bagian 4, karena policy
-- dp_item_baca di dalamnya baru diperbaiki.
-- ═══════════════════════════════════════════════════════════════════════════════════════════


-- ═══ BAGIAN 1 dari 4 — naungan, kolom kota, tambal jenjang ═════════════════════════════════
-- Fondasi dashboard Yayasan Pendidikan Telkom (YPT): daftarkan seluruh sekolah Telkom di bawah
-- satu yayasan, dan tambahkan kolom kota yang dipakai peta wilayah di layar Rangkuman.
-- Rencana lengkap: docs/yayasan-telkom-dashboard-plan.md (Milestone 0).
--
-- Kenapa yayasan_id, bukan kolom unit: sekolah Telkom sudah berupa banyak baris schools yang
-- berdiri sendiri (punya modul, akun, dan data karakter masing-masing), jadi pola yang dipakai
-- adalah banyak-baris-schools + yayasan_id -- pola yang SAMA dengan yang sudah jalan di
-- useKarakterYayasan(). Pola satu-baris-schools + kolom "unit" (dipakai LW TKN Bandung dan PA
-- Athirah) sengaja TIDAK dipakai di sini karena unit tidak bisa punya entitlement/akun sendiri.
--
-- YAY-PENDIDIKAN-TELKOM bukan id baru: migration 20260810130000 sudah menyebutnya sebagai grup
-- nyata di produksi, dan akun yayasansmktelkompwt sudah memakainya sebagai cakupan[0].

-- ── 1. Baris yayasan ──────────────────────────────────────────────────────────────────────
-- Tabel yayasan sudah ada di produksi (dibuat sebelum folder migrations dipakai; CRUD-nya ada di
-- Admin CMS lewat handleAddYayasan). id berupa slug text manual berprefiks YAY-, tanpa default.
insert into public.yayasan (id, nama)
values ('YAY-PENDIDIKAN-TELKOM', 'Yayasan Pendidikan Telkom')
on conflict (id) do update set nama = excluded.nama;

-- ── 2. Kolom kota ─────────────────────────────────────────────────────────────────────────
-- Dipakai DotMapIndonesia di layar Rangkuman untuk menaruh marker per kota. Sengaja kolom bebas
-- (bukan enum): daftar kota YPT masih bertambah, dan kota yang belum punya koordinat di
-- yptMeta.js ditampilkan sebagai daftar teks di bawah peta, bukan dibuang diam-diam.
alter table public.schools add column if not exists kota text;

comment on column public.schools.kota is
  'Kota tempat sekolah berada. Dipakai peta wilayah dashboard Yayasan Pendidikan Telkom; '
  'kota tanpa koordinat di yptMeta.js tetap tampil sebagai daftar teks, tidak dibuang.';

-- ── 3. Daftarkan sekolah Telkom ke YPT ────────────────────────────────────────────────────
-- CATATAN PENTING untuk yang menjalankan migration ini:
-- Daftar sekolah Telkom yang sesungguhnya HANYA ada di database produksi, tidak di repo. Jadi
-- update ini memakai pencocokan pola nama/id, TAPI dengan dua pengaman supaya tidak ada sekolah
-- yang "dicuri" dari yayasan lain:
--   a. Hanya menyentuh baris yang yayasan_id-nya NULL atau sudah YAY-PENDIDIKAN-TELKOM.
--      Sekolah yang sudah bernaung di yayasan lain TIDAK PERNAH disentuh.
--   b. Hasilnya dilaporkan lewat RAISE NOTICE supaya bisa langsung diperiksa admin.
--
-- Sebelum menjalankan, jalankan dulu query inventaris ini dan cocokkan dengan daftar resmi YPT:
--   select id, nama, jenjang, yayasan_id, aktif from public.schools
--   where id ilike '%TELKOM%' or nama ilike '%telkom%' order by jenjang, nama;
--
-- Kalau ada sekolah Telkom yang namanya TIDAK mengandung "telkom" (mis. disingkat), tambahkan
-- id-nya manual di blok extra_ids di bawah.
do $$
declare
  extra_ids text[] := array[]::text[];  -- isi manual kalau ada sekolah Telkom yang luput dari pola
  terdaftar int;
  r record;
begin
  update public.schools s
  set yayasan_id = 'YAY-PENDIDIKAN-TELKOM'
  where (s.nama ilike '%telkom%' or s.id ilike '%TELKOM%' or s.id = any(extra_ids))
    and (s.yayasan_id is null or s.yayasan_id = 'YAY-PENDIDIKAN-TELKOM');

  get diagnostics terdaftar = row_count;
  raise notice 'YPT: % sekolah terdaftar/ter-refresh di bawah YAY-PENDIDIKAN-TELKOM.', terdaftar;

  -- Sekolah Telkom yang bernaung di yayasan LAIN: tidak disentuh, tapi wajib dilaporkan supaya
  -- admin sadar dan memutuskan sendiri (bisa jadi memang milik yayasan lain, bisa jadi salah isi).
  for r in
    select id, nama, yayasan_id from public.schools
    where (nama ilike '%telkom%' or id ilike '%TELKOM%')
      and yayasan_id is not null and yayasan_id <> 'YAY-PENDIDIKAN-TELKOM'
  loop
    raise notice 'YPT: DILEWATI (sudah bernaung yayasan lain) -> % (%) yayasan_id=%', r.nama, r.id, r.yayasan_id;
  end loop;
end $$;

-- ── 3b. Tambal jenjang yang kosong ────────────────────────────────────────────────────────
-- Inventaris 2026-08-25 menemukan dua sekolah YPT dengan jenjang NULL (SMK Telkom Makassar dan
-- TK Telkom Ternate). Jenjang kosong bukan masalah kecil di dashboard ini: sekolah itu tidak
-- masuk kartu jenjang mana pun, tidak ikut rata-rata jenjang, dan hilang dari filter TK/SD/SMP/
-- SMA-K -- padahal datanya lengkap. Diturunkan dari awalan id, yang di YPT konsisten.
update public.schools set jenjang = case
  when id like 'TK-%'  then 'TK'
  when id like 'SD-%'  then 'SD'
  when id like 'SMP-%' then 'SMP'
  when id like 'SMA-%' then 'SMA'
  when id like 'SMK-%' then 'SMK'
end
where yayasan_id = 'YAY-PENDIDIKAN-TELKOM' and jenjang is null;

-- ── 4. Isi kota dari nama sekolah ─────────────────────────────────────────────────────────
-- Daftar kota diambil dari nama sekolah yang benar-benar muncul di data produksi (sumber: rekap
-- Survei Kepuasan YPT per Mei 2026). Hanya mengisi baris yang kota-nya masih kosong, supaya
-- koreksi manual admin lewat CMS tidak pernah ditimpa migration ini kalau dijalankan ulang.
--
-- Buah Batu dan Dayeuhkolot sengaja dipetakan ke "Bandung": keduanya kawasan di Bandung Raya, dan
-- peta wilayah berbasis kota akan menaruh tiga marker berimpitan kalau dipisah. Kalau pemilik
-- produk ingin keduanya jadi titik sendiri, ubah dua baris CASE di bawah dan tambahkan
-- koordinatnya di yptMeta.js.
update public.schools set kota = case
  when nama ilike '%batam%'        then 'Batam'
  when nama ilike '%makassar%'     then 'Makassar'
  when nama ilike '%padang%'       then 'Padang'
  when nama ilike '%ternate%'      then 'Ternate'
  when nama ilike '%banjarbaru%'   then 'Banjarbaru'
  when nama ilike '%lampung%'      then 'Bandar Lampung'
  when nama ilike '%purwokerto%'   then 'Purwokerto'
  when nama ilike '%medan%'        then 'Medan'
  when nama ilike '%jakarta%'      then 'Jakarta'
  when nama ilike '%sidoarjo%'     then 'Sidoarjo'
  when nama ilike '%malang%'       then 'Malang'
  -- "Buahbatu" ditulis satu kata di data produksi, jadi polanya TIDAK boleh '%buah batu%'.
  when nama ilike '%buahbatu%'     then 'Bandung'
  when nama ilike '%buah batu%'    then 'Bandung'
  when nama ilike '%dayeuhkolot%'  then 'Bandung'
  when nama ilike '%bandung%'      then 'Bandung'
  else null
end
where yayasan_id = 'YAY-PENDIDIKAN-TELKOM' and kota is null;

-- Laporkan sekolah YPT yang kotanya masih kosong -- ini yang perlu diisi manual admin, dan yang
-- akan muncul sebagai daftar teks di bawah peta alih-alih jadi marker.
do $$
declare r record;
begin
  for r in select id, nama from public.schools
           where yayasan_id = 'YAY-PENDIDIKAN-TELKOM' and kota is null order by nama
  loop
    raise notice 'YPT: kota belum terisi -> % (%)', r.nama, r.id;
  end loop;
end $$;


-- ═══ BAGIAN 2 dari 4 — helper RLS + akun Yayasan Pendidikan Telkom ═════════════════════════
-- Akun Yayasan Pendidikan Telkom + helper RLS jalur yayasan.
-- Rencana: docs/yayasan-telkom-dashboard-plan.md (Milestone 0, bagian 4.3 dan 4.4).
-- Prasyarat: 20260825100000_ypt_naungan_dan_kota.sql sudah jalan (sekolah sudah punya yayasan_id).

-- ── 1. Helper my_yayasan_school_ids() ─────────────────────────────────────────────────────
-- Dipakai policy RLS tabel baru YPT (cs_testimoni, kp_responden, dp_item) supaya akun Yayasan
-- bisa membaca baris SEMUA sekolah di bawah naungannya, bukan cuma school_id jangkarnya.
--
-- Kenapa perlu helper, bukan subquery langsung di tiap policy: profiles.cakupan adalah kolom yang
-- di-overload -- untuk WaliKelas isinya daftar kelas_id, untuk Yayasan isinya yayasan_id (lihat
-- catatan di 20260810130000). Helper ini mengunci penafsiran itu di SATU tempat, dan menegaskan
-- lewat pengecekan peran bahwa daftar sekolah hanya pernah keluar untuk peran Yayasan -- jadi
-- akun WaliKelas yang cakupannya kebetulan berisi teks mirip id yayasan tidak bisa menembusnya.
--
-- security definer WAJIB: fungsi ini membaca profiles milik user yang sedang login, dan schools;
-- tanpa itu policy yang memanggilnya akan berulang ke RLS profiles/schools dan bisa rekursif.
-- CATATAN PERBAIKAN (2026-08-26): versi awal fungsi ini menulis
--   where s.yayasan_id = any (select p.cakupan from public.profiles p ...)
-- Itu gagal dengan "operator does not exist: text = text[]" -- p.cakupan bertipe text[], jadi
-- subquery-nya mengembalikan BARIS-BARIS ARRAY, bukan baris-baris teks tunggal, dan `= any(...)`
-- tidak bisa membandingkan text dengan text[] per baris. unnest(p.cakupan) di bawah memecah array
-- itu jadi satu baris per elemen, baru cocok dibandingkan dengan s.yayasan_id yang bertipe text.
create or replace function public.my_yayasan_school_ids()
returns text[]
language sql
stable
security definer
as $$
  select coalesce(array_agg(s.id), array[]::text[])
  from public.schools s
  where s.yayasan_id = any (
          select unnest(p.cakupan) from public.profiles p
          where p.id = auth.uid() and p.peran = 'Yayasan'
        )
$$;

comment on function public.my_yayasan_school_ids() is
  'Daftar schools.id di bawah naungan yayasan user yang sedang login. Array kosong untuk peran '
  'selain Yayasan atau kalau cakupan belum diisi. Dipakai policy RLS dashboard Yayasan.';

grant execute on function public.my_yayasan_school_ids() to authenticated;

-- ── 2. Akun Yayasan Pendidikan Telkom ─────────────────────────────────────────────────────
-- Akun BARU (bukan memakai ulang yayasansmktelkompwt yang sudah ada), sesuai keputusan pemilik
-- produk 2026-08-25: satu akun yang menaungi seluruh sekolah Telkom.
--
-- school_id di sini cuma JANGKAR, bukan pembatas cakupan: dipilih otomatis dari sekolah Telkom
-- pertama secara alfabet. Yang menentukan sekolah mana saja yang terlihat adalah cakupan[0]
-- ('YAY-PENDIDIKAN-TELKOM'), lewat session.schools di auth.js dan my_yayasan_school_ids() di RLS.
-- profiles.school_id NOT NULL, jadi jangkar tetap wajib diisi.
--
-- crypt/gen_salt WAJIB berprefiks "extensions." -- pgcrypto terpasang di skema extensions dan
-- search_path role migrasi tidak memuatnya otomatis (lihat catatan di 20260807110000).
do $$
declare
  jangkar text;
  uid uuid;
begin
  select id into jangkar from public.schools
  where yayasan_id = 'YAY-PENDIDIKAN-TELKOM' and aktif is not false
  order by id limit 1;

  if jangkar is null then
    raise exception 'Belum ada sekolah dengan yayasan_id = YAY-PENDIDIKAN-TELKOM. Jalankan 20260825100000 lebih dulu.';
  end if;

  -- Idempotent: kalau akun sudah ada (migration dijalankan ulang), cukup segarkan profilnya.
  select id into uid from auth.users where email = 'yayasanpendidikantelkom@fammi.internal';

  if uid is null then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'yayasanpendidikantelkom@fammi.internal',
      extensions.crypt('gantiSandiIni2026', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
    ) returning id into uid;

    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', 'yayasanpendidikantelkom@fammi.internal'),
            'email', uid::text, now(), now(), now());
  end if;

  insert into public.profiles (id, username, nama, peran, school_id, cakupan)
  values (uid, 'yayasanpendidikantelkom', 'Yayasan Pendidikan Telkom', 'Yayasan', jangkar,
          array['YAY-PENDIDIKAN-TELKOM'])
  on conflict (id) do update
    set username = excluded.username,
        nama     = excluded.nama,
        peran    = excluded.peran,
        school_id = excluded.school_id,
        cakupan  = excluded.cakupan;

  raise notice 'YPT: akun yayasanpendidikantelkom siap, sekolah jangkar = %', jangkar;
end $$;

-- Login: username "yayasanpendidikantelkom", kode "gantiSandiIni2026".
-- GANTI SANDI INI sebelum diserahkan ke YPT (lewat Admin CMS > Pengguna, atau update auth.users).


-- ═══ BAGIAN 3 dari 4 — view agregat Rapor Karakter + Citra Sekolah ═════════════════════════
-- View agregat Rapor Karakter untuk dashboard Yayasan Pendidikan Telkom.
-- Rencana: docs/yayasan-telkom-dashboard-plan.md (Milestone 2, bagian 6.1).
--
-- Kenapa di database, bukan di React: butir 3 CLAUDE.md (FIR tidak menghitung agregat), dan
-- alasan praktis -- YPT menaungi puluhan sekolah dengan puluhan ribu baris skor murid. Menarik
-- baris mentah lintas sekolah ke browser lalu diagregat di useMemo akan lambat dan boros.
-- Presedennya sudah ada: karakter_indikator_sekolah_avg (20260711150000) dan
-- karakter_indikator_kelas_avg (20260814110000) memecahkan masalah yang sama.
--
-- PENTING -- security_invoker = true WAJIB ADA di setiap view di bawah. Tanpa itu view akan
-- bypass RLS untuk semua pemakainya dan membocorkan skor murid sekolah lain ke siapa pun yang
-- bisa SELECT. Dengan security_invoker, keempat view ini transparan terhadap policy
-- karakter_skor_baca / karakter_skor_indikator_baca (20260711100000): akun Yayasan melihat
-- sekolah naungannya, Kepsek sekolahnya sendiri, Wali Kelas kelasnya saja.
--
-- Skala skor: karakter_skor.skor dan karakter_skor_indikator.skor adalah kolom int Postgres
-- berisi persen 0-100 (lihat catatan pct() di karakterMeta.js), jadi rata-ratanya langsung persen
-- dan TIDAK perlu dikonversi lagi di tampilan.

-- ── 1. Ringkasan per sekolah per periode ──────────────────────────────────────────────────
-- jumlah_siswa dipakai sebagai BOBOT saat React merata-ratakan antar sekolah (rata-rata jenjang
-- dan rata-rata yayasan tertimbang jumlah siswa, bukan rata-rata dari rata-rata) -- lihat aturan
-- agregasi di bagian 6.1 rencana.
create or replace view public.ypt_k_sekolah
with (security_invoker = true)
as
select
  sekolah_id,
  periode_id,
  count(distinct murid_id)      as jumlah_siswa,
  round(avg(skor))::int         as rata_total
from public.karakter_skor
where skor is not null
group by sekolah_id, periode_id;

grant select on public.ypt_k_sekolah to authenticated;

-- ── 2. Ringkasan per aspek karakter per sekolah ───────────────────────────────────────────
-- aspek_label ikut dibawa supaya React bisa mencocokkan aspek ANTAR SEKOLAH lewat nama aspek,
-- bukan lewat aspek_kode. Kodenya (K1, K2, ...) tidak konsisten antar sekolah -- "K2" di satu
-- sekolah bisa Empati, di sekolah lain Mandiri. Pelajaran ini datang dari importer multi-sekolah
-- (lihat memori project_karakter_importer_multischool): jangan pernah mengunci daftar aspek ke
-- penamaan satu sekolah.
-- Label bisa NULL kalau karakter_aspek_config belum lengkap untuk sekolah itu; React
-- menambalnya dari karakter_summary.ringkasan seperti yang sudah dilakukan resolveAspekList().
create or replace view public.ypt_k_aspek
with (security_invoker = true)
as
select
  s.sekolah_id,
  s.periode_id,
  s.aspek_kode,
  c.aspek_label,
  count(distinct s.murid_id) as jumlah_siswa,
  round(avg(s.skor))::int    as rata
from public.karakter_skor s
left join public.karakter_aspek_config c
  on c.sekolah_id = s.sekolah_id and c.aspek_kode = s.aspek_kode
where s.skor is not null
group by s.sekolah_id, s.periode_id, s.aspek_kode, c.aspek_label;

grant select on public.ypt_k_aspek to authenticated;

-- ── 3. Ringkasan per indikator per sekolah ────────────────────────────────────────────────
-- Dipakai blok "Top 5 Indikator Terbaik / Perlu Penguatan" di tab Penilaian per Karakter.
-- Sudah membawa label supaya React tidak perlu menarik karakter_indikator_config lintas puluhan
-- sekolah cuma untuk menamai baris.
create or replace view public.ypt_k_indikator
with (security_invoker = true)
as
select
  i.sekolah_id,
  i.periode_id,
  i.aspek_kode,
  i.indikator_kode,
  ic.indikator_label,
  count(distinct i.murid_id) as jumlah_siswa,
  round(avg(i.skor))::int    as rata
from public.karakter_skor_indikator i
left join public.karakter_indikator_config ic
  on ic.sekolah_id = i.sekolah_id
 and ic.aspek_kode = i.aspek_kode
 and ic.indikator_kode = i.indikator_kode
where i.skor is not null
group by i.sekolah_id, i.periode_id, i.aspek_kode, i.indikator_kode, ic.indikator_label;

grant select on public.ypt_k_indikator to authenticated;

-- ── 4. Lima murid tertinggi dan terendah per sekolah ──────────────────────────────────────
-- Dipakai blok "TOP 5 Siswa Terbaik / Perlu Penguatan" di tab Penilaian per Jenjang.
--
-- Dibatasi 5 atas + 5 bawah DI DALAM view (bukan mengirim seluruh murid lalu diiris di React):
-- selain jauh lebih ringan, ini juga membatasi jumlah nama murid yang pernah keluar dari database
-- ke tampilan yayasan seminimal yang memang ditampilkan.
--
-- Sekolah dengan <= 10 murid akan memunculkan murid yang sama di kedua arah; itu benar secara
-- data (dia memang sekaligus 5 tertinggi dan 5 terendah), React yang memutuskan menyembunyikan
-- salah satu blok kalau jumlah muridnya terlalu sedikit.
create or replace view public.ypt_k_siswa_ekstrem
with (security_invoker = true)
as
with per_murid as (
  select
    sekolah_id,
    periode_id,
    murid_id,
    max(nama_murid) as nama_murid,
    max(kelas_id)   as kelas_id,
    round(avg(skor))::int as total_persen
  from public.karakter_skor
  where skor is not null
  group by sekolah_id, periode_id, murid_id
),
berperingkat as (
  select
    per_murid.*,
    row_number() over (partition by sekolah_id, periode_id order by total_persen desc, nama_murid asc) as rank_atas,
    row_number() over (partition by sekolah_id, periode_id order by total_persen asc,  nama_murid asc) as rank_bawah
  from per_murid
)
select sekolah_id, periode_id, murid_id, nama_murid, kelas_id, total_persen,
       'atas'::text as arah, rank_atas as peringkat
from berperingkat where rank_atas <= 5
union all
select sekolah_id, periode_id, murid_id, nama_murid, kelas_id, total_persen,
       'bawah'::text as arah, rank_bawah as peringkat
from berperingkat where rank_bawah <= 5;

grant select on public.ypt_k_siswa_ekstrem to authenticated;

-- ── 5. Agregat Citra Sekolah dari refleksi yang sudah ada ─────────────────────────────────
-- TIDAK ada tabel baru dan TIDAK ada importer baru untuk tab Keberhasilan/Dukungan/Emosi:
-- datanya sudah masuk lewat importer Karakter dan sudah menggerakkan kategori "Citra Sekolah di
-- Mata Orang Tua" di tampilan Wali Kelas/Kepsek/Yayasan. View ini cuma menghitung distribusinya.
--
-- Tiga topik dipetakan ke tiga kolom karakter_pernyataan_ortu:
--   keberhasilan -> kategori_pernyataan   (kartu "Tumbuh Kebiasaan Positif", dst)
--   dukungan     -> dukungan_dibutuhkan   (kartu "Panduan Pembiasaan di Rumah", dst)
--   emosi        -> emosi_anak            (5 kartu sentimen)
-- Kolom sumber ikut dibawa supaya tampilan bisa memilih refleksi orang tua saja (menu YPT
-- menyebut "di Mata Orangtua") pada sekolah dual-source yang juga punya refleksi siswa.
--
-- Nilai kategori TIDAK dinormalisasi di sini: apa adanya dari data. Pencocokan ke label kartu
-- Figma dilakukan di yptMeta.js, dan kategori yang tidak dikenal tetap dirender di akhir daftar
-- alih-alih dibuang -- supaya sekolah dengan penamaan berbeda tidak hilang diam-diam.
create or replace view public.ypt_cs_agregat
with (security_invoker = true)
as
select sekolah_id, periode_id, sumber, 'keberhasilan'::text as topik,
       kategori_pernyataan as kategori, count(distinct murid_id) as jumlah_siswa
from public.karakter_pernyataan_ortu
where kategori_pernyataan is not null and btrim(kategori_pernyataan) <> ''
group by sekolah_id, periode_id, sumber, kategori_pernyataan
union all
select sekolah_id, periode_id, sumber, 'dukungan'::text,
       dukungan_dibutuhkan, count(distinct murid_id)
from public.karakter_pernyataan_ortu
where dukungan_dibutuhkan is not null and btrim(dukungan_dibutuhkan) <> ''
group by sekolah_id, periode_id, sumber, dukungan_dibutuhkan
union all
select sekolah_id, periode_id, sumber, 'emosi'::text,
       emosi_anak, count(distinct murid_id)
from public.karakter_pernyataan_ortu
where emosi_anak is not null and btrim(emosi_anak) <> ''
group by sekolah_id, periode_id, sumber, emosi_anak;

grant select on public.ypt_cs_agregat to authenticated;

comment on view public.ypt_cs_agregat is
  'Distribusi kategori refleksi orang tua/siswa per sekolah per periode, untuk menu Citra Sekolah '
  'dashboard Yayasan. Dibangun dari karakter_pernyataan_ortu yang sudah ada, bukan tabel baru.';


-- ═══ BAGIAN 4 dari 4 — tabel Kepuasan/Testimoni/Dokumentasi + RLS (DIPERBAIKI) ══════════════
-- Tabel untuk tiga sumber data baru dashboard Yayasan Pendidikan Telkom:
--   1. kp_responden   -- Survey Kepuasan, ditarik dari Google Spreadsheet respons form (live)
--   2. cs_testimoni   -- Testimoni Citra Sekolah, ditarik dari spreadsheet terpisah (live)
--   3. dp_item        -- Dokumentasi Kegiatan, dikelola manual lewat Admin CMS
-- Plus dua tabel bantu pemetaan nama sekolah dari spreadsheet ke schools.id.
--
-- Rencana: docs/yayasan-telkom-dashboard-plan.md (bagian 7.3, 8.2, 9.1).
-- Prasyarat: 20260825110000 (helper my_yayasan_school_ids) sudah jalan.
--
-- Catatan arsitektur soal Google Sheets: CLAUDE.md menyebut Google Sheets/GAS tidak lagi dipakai.
-- Itu tentang GERBANG BACA -- dulu React membaca Sheets lewat Apps Script. Di sini spreadsheet
-- adalah SUMBER HULU yang ditarik SEKALI ARAH oleh Edge Function (server-side) ke Supabase; jalur
-- baca FIR tetap murni Supabase + RLS. Tidak ada regresi arsitektur.

-- ══ Bagian 1: pemetaan nama sekolah dari spreadsheet ═══════════════════════════════════════
-- Nama sekolah di spreadsheet diketik responden lewat dropdown form, formatnya uppercase dan
-- kadang bernoise (contoh nyata: "SMP TELKOM PADANG (listing history)"). Alih-alih menebak-nebak
-- di kode sinkronisasi, pemetaannya disimpan sebagai data supaya admin bisa memperbaikinya tanpa
-- deploy ulang.
create table if not exists public.ypt_sekolah_alias (
  alias      text primary key,
  sekolah_id text not null references public.schools(id) on delete cascade,
  dibuat_at  timestamptz not null default now()
);

comment on table public.ypt_sekolah_alias is
  'Pemetaan nama sekolah apa adanya dari spreadsheet YPT ke schools.id. Alias disimpan hasil '
  'upper(btrim(...)) supaya pencocokan tidak bergantung huruf besar-kecil.';

-- Alias yang belum dikenal TIDAK dibuang diam-diam saat sinkronisasi -- dicatat di sini supaya
-- muncul di layar CMS dan admin tahu persis apa yang perlu dipetakan. Kalau baris ini dibiarkan,
-- responden dari sekolah itu tidak akan pernah tampil di dashboard.
create table if not exists public.ypt_alias_tak_dikenal (
  alias             text primary key,
  sumber            text not null,          -- 'kepuasan' | 'testimoni'
  jumlah            int  not null default 1,
  terakhir_dilihat  timestamptz not null default now()
);

-- Seed alias dari nama sekolah yang sudah ada di schools. Pencocokan uppercase, jadi
-- "SD Telkom Batam" di schools otomatis mengenali "SD TELKOM BATAM" di spreadsheet.
insert into public.ypt_sekolah_alias (alias, sekolah_id)
select upper(btrim(nama)), id from public.schools
where yayasan_id = 'YAY-PENDIDIKAN-TELKOM'
on conflict (alias) do nothing;

-- Alias bernoise yang benar-benar muncul di rekap Survei Kepuasan Mei 2026. Dipetakan eksplisit
-- karena tidak akan pernah cocok dengan nama resmi mana pun.
insert into public.ypt_sekolah_alias (alias, sekolah_id)
select 'SMP TELKOM PADANG (LISTING HISTORY)', id from public.schools
where yayasan_id = 'YAY-PENDIDIKAN-TELKOM' and upper(nama) = 'SMP TELKOM PADANG'
on conflict (alias) do nothing;

-- ══ Bagian 2: Survey Kepuasan ══════════════════════════════════════════════════════════════
-- Satu baris per respons form. Form-nya anonim (tidak menanyakan nama), jadi tidak ada kolom
-- nama responden -- dan memang tidak boleh ada, karena tampilan ini dibaca level yayasan.
--
-- row_hash: md5 dari seluruh isi respons. Ini kunci idempotensi -- spreadsheet terus bertambah
-- dan sinkronisasi dijalankan berulang, jadi baris yang sudah masuk tidak boleh menggandakan.
-- Sengaja hash-isi, bukan nomor baris: menyisipkan/menghapus baris di sheet tidak akan menggeser
-- identitas respons lain.
create table if not exists public.kp_responden (
  id               uuid primary key default gen_random_uuid(),
  row_hash         text not null unique,
  sekolah_id       text not null references public.schools(id) on delete cascade,
  periode_id       text not null,                    -- 'YYYY-MM', diturunkan dari Timestamp
  peran_responden  text not null,                    -- KepalaSekolah|Wakasek|BK|WaliKelas|GuruMapel
  peran_mentah     text,                             -- teks asli dari sheet, untuk audit mapping
  status_baca      text,                             -- Ya|SebagianBaca|RingkasanSaja|BelumBaca
  tindak_lanjut    text[] not null default array[]::text[],
  metrik           jsonb  not null default '{}'::jsonb,  -- 6 metrik skala 1-5
  skor_total       numeric(4,2),                     -- skala 10 = rata-rata metrik x 2
  esai_disukai     text,
  esai_saran       text,
  submitted_at     timestamptz,
  disinkron_at     timestamptz not null default now()
);

create index if not exists kp_responden_sekolah_periode_idx
  on public.kp_responden (sekolah_id, periode_id);

comment on column public.kp_responden.skor_total is
  'Skala 10, dihitung saat sinkronisasi = rata-rata 6 metrik (skala 5) x 2. Form tidak menanyakan '
  'skor /10 secara langsung; angka ini yang dipakai kartu besar tab Rangkuman.';

comment on column public.kp_responden.metrik is
  'Enam metrik skala 1-5 dari form: mudah_dipahami, kelengkapan, relevansi, '
  'kejelasan_rekomendasi, ketepatan_waktu, komunikasi.';

-- ══ Bagian 3: Testimoni Citra Sekolah ══════════════════════════════════════════════════════
-- Sumbernya spreadsheet terpisah yang templatenya sudah dibuat (lihat rencana bagian 7.3).
-- Beda dengan kp_responden: di sini ADA nama penulis dan kelas, karena memang testimoni yang
-- sengaja dikurasi untuk ditampilkan.
--
-- tampilkan: gerbang kurasi yang dikendalikan dari kolom "Tampilkan" di sheet. Sinkronisasi
-- memakai on conflict do update untuk kolom ini (bukan do nothing seperti kp_responden) supaya
-- admin bisa menyembunyikan testimoni yang sudah terlanjur masuk cukup dengan mengubah sheet.
create table if not exists public.cs_testimoni (
  id            uuid primary key default gen_random_uuid(),
  row_hash      text not null unique,
  sekolah_id    text not null references public.schools(id) on delete cascade,
  periode_id    text not null,
  nama          text,
  kelas         text,
  kategori      text not null,      -- Apresiasi|Harapan|SaranMasukan|KritikKeluhan
  teks          text not null,
  tampilkan     boolean not null default false,
  submitted_at  timestamptz,
  disinkron_at  timestamptz not null default now()
);

create index if not exists cs_testimoni_sekolah_periode_idx
  on public.cs_testimoni (sekolah_id, periode_id) where tampilkan;

-- ══ Bagian 4: Dokumentasi Kegiatan ═════════════════════════════════════════════════════════
-- Dikelola manual lewat Admin CMS (bukan sinkronisasi). jenis menentukan section carousel mana
-- item ini muncul di layar Dokumentasi Kegiatan.
create table if not exists public.dp_item (
  id            uuid primary key default gen_random_uuid(),
  yayasan_id    text not null references public.yayasan(id) on delete cascade,
  sekolah_id    text references public.schools(id) on delete set null,  -- null = level yayasan
  jenis         text not null check (jenis in ('video', 'foto', 'link', 'file')),
  judul         text not null,
  deskripsi     text,
  url           text not null,
  thumbnail_url text,              -- wajib diisi manual untuk rekaman Zoom (tidak punya thumbnail publik)
  tanggal       date,
  urutan        int not null default 0,
  aktif         boolean not null default true,
  dibuat_at     timestamptz not null default now()
);

create index if not exists dp_item_yayasan_idx on public.dp_item (yayasan_id, jenis, urutan);

comment on column public.dp_item.url is
  'Path di bucket Storage "dokumentasi" untuk jenis=foto; URL penuh untuk video/link/file.';

-- ══ Bagian 5: entitlement modul 'kp' ═══════════════════════════════════════════════════════
-- Izinkan nilai 'kp' (Survey Kepuasan) di school_modules.modul. Pola DINAMIS, sama seperti waktu
-- 'cw' (20260720110000) dan 'sc' (20260722100000) ditambahkan: daftar lamanya di-union dengan
-- nilai yang SUDAH ADA di produksi, supaya baris dengan modul yang tidak tercatat di repo tidak
-- mendadak jadi ilegal dan menggagalkan migration.
do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw', 'kp']) as v
    union
    select distinct modul from public.school_modules where modul is not null
  ) s;

  execute 'alter table public.school_modules drop constraint if exists school_modules_modul_check';
  execute format(
    'alter table public.school_modules add constraint school_modules_modul_check check (modul in (%s))',
    daftar
  );
end $$;

-- ══ Bagian 6: RLS ══════════════════════════════════════════════════════════════════════════
-- Pola sama untuk keempat tabel data: AdminFammi bisa baca semua, akun Yayasan hanya sekolah di
-- bawah naungannya lewat my_yayasan_school_ids(). TIDAK ADA policy tulis sama sekali -- semua
-- penulisan lewat Edge Function dengan service role, yang memang melewati RLS. Ini konsisten
-- dengan pola tabel modul lain (pa_*, sc_*, lw_*).
alter table public.kp_responden          enable row level security;
alter table public.cs_testimoni          enable row level security;
alter table public.dp_item               enable row level security;
alter table public.ypt_sekolah_alias     enable row level security;
alter table public.ypt_alias_tak_dikenal enable row level security;

drop policy if exists kp_responden_baca on public.kp_responden;
create policy kp_responden_baca on public.kp_responden
for select to authenticated
using (
  my_peran() = 'AdminFammi'
  or sekolah_id = any (my_yayasan_school_ids())
  -- Kepala Sekolah/Wakil boleh melihat hasil survei sekolahnya sendiri. Tidak dipakai tampilan
  -- mana pun hari ini, tapi datanya memang tentang sekolah itu dan tidak memuat identitas
  -- responden, jadi tidak ada alasan menyembunyikannya kalau nanti dibutuhkan.
  or (my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah') and sekolah_id = my_school_id())
);

drop policy if exists cs_testimoni_baca on public.cs_testimoni;
create policy cs_testimoni_baca on public.cs_testimoni
for select to authenticated
using (
  my_peran() = 'AdminFammi'
  or sekolah_id = any (my_yayasan_school_ids())
  or (my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah') and sekolah_id = my_school_id())
);

-- CATATAN PERBAIKAN (2026-08-26): sama seperti bug my_yayasan_school_ids() -- profiles.cakupan
-- bertipe text[], jadi subquery "select cakupan from profiles ..." mengembalikan baris-baris
-- ARRAY, bukan baris-baris teks tunggal. `yayasan_id = any(...)` gagal membandingkan text dengan
-- text[]. unnest(cakupan) memecah array itu jadi satu baris per elemen sebelum dibandingkan.
drop policy if exists dp_item_baca on public.dp_item;
create policy dp_item_baca on public.dp_item
for select to authenticated
using (
  my_peran() = 'AdminFammi'
  or (
    aktif
    and yayasan_id = any (
      select unnest(cakupan) from public.profiles where id = auth.uid() and peran = 'Yayasan'
    )
  )
);

-- Tabel alias murni alat kerja admin, tidak pernah dibaca akun sekolah/yayasan.
drop policy if exists ypt_sekolah_alias_baca on public.ypt_sekolah_alias;
create policy ypt_sekolah_alias_baca on public.ypt_sekolah_alias
for select to authenticated using (my_peran() = 'AdminFammi');

drop policy if exists ypt_alias_tak_dikenal_baca on public.ypt_alias_tak_dikenal;
create policy ypt_alias_tak_dikenal_baca on public.ypt_alias_tak_dikenal
for select to authenticated using (my_peran() = 'AdminFammi');
