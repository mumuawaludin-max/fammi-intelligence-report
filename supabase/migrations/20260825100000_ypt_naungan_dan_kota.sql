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
