-- Penilaian guru pekanan, refleksi orang tua tetap bulanan.
--
-- SD Amal Mulia menilai karakter setiap PEKAN, sementara refleksi orang tua tetap masuk sekali
-- sebulan. Sebelum ini seluruh modul Karakter memakai satu kolom periode_id yang sama untuk
-- keduanya, jadi dua irama itu bertabrakan: unique constraint karakter_skor mengunci satu baris
-- per (sekolah, murid, periode, aspek), sehingga empat penilaian pekanan dalam satu bulan saling
-- menimpa dan yang tersisa cuma yang terakhir diproses importer -- bukan yang terakhir menurut
-- pekannya, melainkan yang kebetulan terbaca belakangan.
--
-- KENAPA periode_id TIDAK diubah jadi mingguan. Kalau periode_id berisi "2026-W22", refleksi
-- orang tua yang periode_id-nya "2026-05" tidak akan pernah cocok dengan skor guru mana pun, dan
-- setiap tampilan yang menyandingkan keduanya putus. Modul lain (MI, School Culture, Perilaku
-- Anak) juga tetap bulanan, jadi Karakter akan jadi satu-satunya yang beda irama, termasuk di
-- pemilih periode yang dipakai bersama. Jadi periode_id TETAP bulanan, dan pekan jadi dimensi
-- tambahan DI DALAM bulan. Polanya sama dengan kolom jenjang di migration 20260828110000: tambah
-- dimensi, jangan ganti makna kolom yang sudah dipakai bersama.
--
-- ATURAN ANGKA BULANAN, keputusan pemilik produk 2026-08-28:
--   Angka bulanan = NILAI PEKAN TERAKHIR, bukan rata-rata seluruh pekan.
--
-- Diturunkan lewat view (karakter_skor_bulanan di bawah), bukan disimpan sebagai baris terpisah
-- yang dikirim sekolah. Dua sumber angka untuk hal yang sama cepat atau lambat tidak cocok, dan
-- keluhan "angka kartu, angka detail, dan angka di teks tindak lanjut beda-beda" sudah pernah
-- terjadi persis karena itu (lihat kepala migration 20260707120000).
--
-- KOMPATIBEL MUNDUR. pekan = 0 berarti "angka bulanan, tidak dirinci per pekan", dan itu nilai
-- bawaan untuk seluruh baris yang sudah ada. Sekolah yang tidak pekanan tidak berubah sama
-- sekali: satu baris per (murid, periode, aspek) dengan pekan 0, dan view bulanan mengembalikan
-- baris itu apa adanya.
--
-- Idempoten, aman dijalankan ulang. Jalankan lewat Supabase SQL Editor. Sudah diuji di
-- postgres:15 dan postgres:17 lewat supabase/tests (lihat README di sana).

-- ── 1. Kolom pekan ─────────────────────────────────────────────────────────────────────────
alter table public.karakter_skor
  add column if not exists pekan smallint not null default 0;

alter table public.karakter_skor_indikator
  add column if not exists pekan smallint not null default 0;

comment on column public.karakter_skor.pekan is
  'Pekan ke berapa dalam bulan periode_id (1-5). 0 = penilaian bulanan, tidak dirinci per pekan -- nilai bawaan untuk sekolah yang tidak menilai pekanan. Angka bulanan diturunkan dari pekan TERTINGGI yang ada nilainya, lihat view karakter_skor_bulanan.';

comment on column public.karakter_skor_indikator.pekan is
  'Lihat karakter_skor.pekan.';

-- ── 2. Unique constraint ikut naik grain ───────────────────────────────────────────────────
-- Aturannya general, seperti di migration 20260828110000: buang setiap unique pada kedua tabel
-- ini yang mengunci (murid, periode, aspek) TAPI tidak menyertakan pekan. Sesudah migration ini
-- keunikan yang mengabaikan pekan selalu keliru, karena satu murid memang boleh punya empat
-- penilaian untuk aspek yang sama dalam satu bulan.
--
-- Sengaja tidak membuang unique yang tidak menyangkut trio itu (kalau ada), supaya blok ini
-- tidak bisa melenyapkan constraint yang tidak dimaksud. attname bertipe `name`, jadi ::text
-- eksplisit -- tanpa itu perbandingannya gagal dengan "operator does not exist: name[] = text[]".
do $$
declare
  r record;
  kolom text[];
begin
  for r in
    select c.conname, c.conrelid::regclass as tbl, c.conkey, c.conrelid
    from pg_constraint c
    where c.contype = 'u'
      and c.conrelid in (
        'public.karakter_skor'::regclass,
        'public.karakter_skor_indikator'::regclass
      )
  loop
    select array_agg(a.attname::text)
      into kolom
      from unnest(r.conkey) as k(attnum)
      join pg_attribute a on a.attrelid = r.conrelid and a.attnum = k.attnum;

    if kolom @> array['murid_id','periode_id','aspek_kode'] and not (kolom @> array['pekan']) then
      execute format('alter table %s drop constraint %I', r.tbl, r.conname);
      raise notice 'Unique tanpa pekan dibuang: % pada %', r.conname, r.tbl;
    end if;
  end loop;
end $$;

do $$
declare
  r record;
  kolom text[];
begin
  for r in
    select i.indexrelid::regclass as idx, i.indexrelid::regclass::text as nama, i.indkey, i.indrelid
    from pg_index i
    where i.indisunique
      and not exists (select 1 from pg_constraint c where c.conindid = i.indexrelid)
      and i.indrelid in (
        'public.karakter_skor'::regclass,
        'public.karakter_skor_indikator'::regclass
      )
  loop
    select array_agg(a.attname::text)
      into kolom
      from unnest(r.indkey::int2[]) as k(attnum)
      join pg_attribute a on a.attrelid = r.indrelid and a.attnum = k.attnum;

    if kolom @> array['murid_id','periode_id','aspek_kode'] and not (kolom @> array['pekan']) then
      execute format('drop index %s', r.idx);
      raise notice 'Index unik tanpa pekan dibuang: %', r.nama;
    end if;
  end loop;
end $$;

create unique index if not exists karakter_skor_murid_periode_pekan_aspek_key
  on public.karakter_skor (sekolah_id, murid_id, periode_id, pekan, aspek_kode);

create unique index if not exists karakter_skor_indikator_murid_periode_pekan_aspek_ind_key
  on public.karakter_skor_indikator (sekolah_id, murid_id, periode_id, pekan, aspek_kode, indikator_kode);

-- ── 3. View bulanan: satu baris per murid per bulan, isinya pekan terakhir ─────────────────
-- distinct on memilih baris pertama tiap kelompok menurut ORDER BY-nya, jadi urutannya yang
-- menentukan makna "pekan terakhir":
--
--   (skor is null) asc  -> baris yang ADA NILAINYA didahulukan.
--   pekan desc          -> di antara yang ada nilainya, pekan tertinggi menang.
--
-- Urutan itu disengaja. Kalau seorang murid tidak dinilai di pekan terakhir (sakit, izin), yang
-- dipakai penilaian pekan terakhir yang benar-benar ADA, bukan sel kosong pekan terakhir. Tanpa
-- baris (skor is null), murid yang absen satu pekan akan tampil tanpa nilai untuk sebulan penuh
-- padahal tiga pekan lainnya terisi.
--
-- Sekolah yang tidak pekanan cuma punya pekan 0, jadi view ini mengembalikan barisnya apa adanya.
--
-- security_invoker = true WAJIB ADA, alasannya sama dengan seluruh view Karakter lain (lihat
-- 20260711150000): tanpa itu view ini bypass RLS untuk semua pemakainya dan membocorkan skor
-- murid sekolah lain ke siapa pun yang bisa SELECT.
create or replace view public.karakter_skor_bulanan
with (security_invoker = true)
as
select distinct on (sekolah_id, murid_id, periode_id, aspek_kode, sumber)
  sekolah_id, jenjang, kelas_id, murid_id, nama_murid, periode_id,
  aspek_kode, skor, sumber, status, pekan
from public.karakter_skor
order by sekolah_id, murid_id, periode_id, aspek_kode, sumber, (skor is null) asc, pekan desc;

grant select on public.karakter_skor_bulanan to authenticated;

comment on view public.karakter_skor_bulanan is
  'Satu baris skor per (murid, periode, aspek, sumber): nilai PEKAN TERAKHIR yang ada isinya, bukan rata-rata seluruh pekan. Keputusan pemilik produk 2026-08-28. Kolom pekan ikut dibawa supaya tampilan bisa menyebut penilaian ini dari pekan ke berapa. Seluruh agregat bulanan WAJIB membaca view ini, bukan karakter_skor mentah -- membaca tabel mentah berarti merata-ratakan seluruh pekan, yang justru aturan yang ditolak.';

create or replace view public.karakter_skor_indikator_bulanan
with (security_invoker = true)
as
select distinct on (sekolah_id, murid_id, periode_id, aspek_kode, indikator_kode, sumber)
  sekolah_id, jenjang, kelas_id, murid_id, nama_murid, periode_id,
  aspek_kode, indikator_kode, skor, sumber, status, pekan
from public.karakter_skor_indikator
order by sekolah_id, murid_id, periode_id, aspek_kode, indikator_kode, sumber, (skor is null) asc, pekan desc;

grant select on public.karakter_skor_indikator_bulanan to authenticated;

-- ── 4. View pekanan: bahan grafik tren per pekan ───────────────────────────────────────────
-- Rata-rata antar MURID di dalam satu pekan. Ini agregat yang sah dan tidak melanggar aturan
-- "pekan terakhir" di atas: yang dilarang adalah merata-ratakan ANTAR PEKAN untuk menghasilkan
-- angka bulanan, bukan merata-ratakan antar murid di dalam satu pekan.
--
-- Baris pekan 0 sengaja ikut, supaya sekolah yang baru pindah ke penilaian pekanan tetap punya
-- titik tren untuk bulan-bulan lamanya. Tampilan yang menggambar sumbu pekan bisa menyaringnya
-- sendiri kalau tidak mau menampilkan titik bulanan itu.
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
  round(avg(skor))::int    as rata
from public.karakter_skor
where skor is not null
group by sekolah_id, jenjang, kelas_id, periode_id, pekan, aspek_kode, sumber;

grant select on public.karakter_pekan_aspek_avg to authenticated;

comment on view public.karakter_pekan_aspek_avg is
  'Rata-rata skor antar murid per (kelas, periode, pekan, aspek). Bahan grafik tren pekanan. Merata-ratakan antar murid DI DALAM satu pekan, bukan antar pekan -- angka bulanan tetap diambil dari karakter_skor_bulanan.';

-- ── 5. Seluruh agregat bulanan dialihkan ke view bulanan ───────────────────────────────────
-- WAJIB, bukan kerapian. Semua view di bawah membaca karakter_skor mentah. Begitu satu sekolah
-- mengirim empat baris pekanan per bulan, avg() di dalamnya menghitung rata-rata SELURUH PEKAN --
-- persis aturan yang ditolak pemilik produk. Angkanya akan terlihat wajar dan tidak ada error
-- apa pun, jadi tidak akan ketahuan dari tampilan.
create or replace view public.karakter_jenjang_aspek_avg
with (security_invoker = true)
as
select
  sekolah_id,
  jenjang,
  periode_id,
  aspek_kode,
  sumber,
  count(distinct murid_id) as jumlah_murid,
  round(avg(skor))::int    as rata
from public.karakter_skor_bulanan
where skor is not null
group by sekolah_id, jenjang, periode_id, aspek_kode, sumber;

create or replace view public.karakter_sekolah_indeks
with (security_invoker = true)
as
select
  sekolah_id,
  periode_id,
  sumber,
  count(distinct murid_id)     as jumlah_murid,
  count(distinct jenjang)      as jumlah_jenjang,
  round(avg(skor))::int        as indeks
from public.karakter_skor_bulanan
where skor is not null
group by sekolah_id, periode_id, sumber;

drop view if exists public.karakter_indikator_sekolah_avg;
create view public.karakter_indikator_sekolah_avg
with (security_invoker = true)
as
select
  sekolah_id,
  jenjang,
  periode_id,
  aspek_kode,
  indikator_kode,
  round(avg(skor)) as skor
from public.karakter_skor_indikator_bulanan
group by sekolah_id, jenjang, periode_id, aspek_kode, indikator_kode;

grant select on public.karakter_indikator_sekolah_avg to authenticated;

drop view if exists public.karakter_indikator_kelas_avg;
create view public.karakter_indikator_kelas_avg
with (security_invoker = true)
as
select
  sekolah_id,
  jenjang,
  kelas_id,
  periode_id,
  aspek_kode,
  indikator_kode,
  round(avg(skor)) as skor
from public.karakter_skor_indikator_bulanan
group by sekolah_id, jenjang, kelas_id, periode_id, aspek_kode, indikator_kode;

grant select on public.karakter_indikator_kelas_avg to authenticated;

-- ── 6. Matview YPT ikut membaca view bulanan ───────────────────────────────────────────────
-- Alasan yang sama: tanpa ini dashboard yayasan merata-ratakan seluruh pekan.
drop view if exists public.ypt_k_sekolah;
drop materialized view if exists public.ypt_k_sekolah_mat;

create materialized view public.ypt_k_sekolah_mat as
select
  sekolah_id,
  periode_id,
  count(distinct murid_id)      as jumlah_siswa,
  round(avg(skor))::int         as rata_total
from public.karakter_skor_bulanan
where skor is not null
group by sekolah_id, periode_id
with data;

create unique index on public.ypt_k_sekolah_mat (sekolah_id, periode_id);
revoke all on public.ypt_k_sekolah_mat from public, authenticated, anon;

create view public.ypt_k_sekolah as
select * from public.ypt_k_sekolah_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_sekolah to authenticated;

drop view if exists public.ypt_k_aspek;
drop materialized view if exists public.ypt_k_aspek_mat;

create materialized view public.ypt_k_aspek_mat as
select
  s.sekolah_id,
  s.jenjang,
  s.periode_id,
  s.aspek_kode,
  c.aspek_label,
  c.identitas_kode,
  count(distinct s.murid_id) as jumlah_siswa,
  round(avg(s.skor))::int    as rata
from public.karakter_skor_bulanan s
left join public.karakter_aspek_config c
  on c.sekolah_id = s.sekolah_id
 and c.jenjang = s.jenjang
 and c.aspek_kode = s.aspek_kode
where s.skor is not null
group by s.sekolah_id, s.jenjang, s.periode_id, s.aspek_kode, c.aspek_label, c.identitas_kode
with data;

create unique index on public.ypt_k_aspek_mat (sekolah_id, jenjang, periode_id, aspek_kode);
revoke all on public.ypt_k_aspek_mat from public, authenticated, anon;

create view public.ypt_k_aspek as
select * from public.ypt_k_aspek_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_aspek to authenticated;

drop view if exists public.ypt_k_indikator;
drop materialized view if exists public.ypt_k_indikator_mat;

create materialized view public.ypt_k_indikator_mat as
select
  i.sekolah_id,
  i.jenjang,
  i.periode_id,
  i.aspek_kode,
  i.indikator_kode,
  ic.indikator_label,
  count(distinct i.murid_id) as jumlah_siswa,
  round(avg(i.skor))::int    as rata
from public.karakter_skor_indikator_bulanan i
left join public.karakter_indikator_config ic
  on ic.sekolah_id = i.sekolah_id
 and ic.jenjang = i.jenjang
 and ic.aspek_kode = i.aspek_kode
 and ic.indikator_kode = i.indikator_kode
where i.skor is not null
group by i.sekolah_id, i.jenjang, i.periode_id, i.aspek_kode, i.indikator_kode, ic.indikator_label
with data;

create unique index on public.ypt_k_indikator_mat (sekolah_id, jenjang, periode_id, aspek_kode, indikator_kode);
revoke all on public.ypt_k_indikator_mat from public, authenticated, anon;

create view public.ypt_k_indikator as
select * from public.ypt_k_indikator_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_indikator to authenticated;

-- ypt_k_siswa_ekstrem_mat ikut, dan ini yang paling mudah terlewat: isinya "5 murid tertinggi
-- dan 5 terendah", dihitung dari rata-rata seluruh baris skor tiap murid. Kalau tetap membaca
-- tabel mentah, peringkat murid di sekolah pekanan ditentukan rata-rata seluruh pekannya, bukan
-- pekan terakhirnya -- dan daftar nama yang keluar akan berbeda dari yang seharusnya tanpa satu
-- pun tanda bahwa ada yang salah.
drop view if exists public.ypt_k_siswa_ekstrem;
drop materialized view if exists public.ypt_k_siswa_ekstrem_mat;

create materialized view public.ypt_k_siswa_ekstrem_mat as
with per_murid as (
  select
    sekolah_id,
    periode_id,
    murid_id,
    max(nama_murid) as nama_murid,
    max(kelas_id)   as kelas_id,
    round(avg(skor))::int as total_persen
  from public.karakter_skor_bulanan
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
from berperingkat where rank_bawah <= 5
with data;

create unique index on public.ypt_k_siswa_ekstrem_mat (sekolah_id, periode_id, murid_id, arah);
revoke all on public.ypt_k_siswa_ekstrem_mat from public, authenticated, anon;

create view public.ypt_k_siswa_ekstrem as
select * from public.ypt_k_siswa_ekstrem_mat
where sekolah_id = any (public.my_yayasan_school_ids());

grant select on public.ypt_k_siswa_ekstrem to authenticated;

-- ── 7. RPC import: terima pekan ────────────────────────────────────────────────────────────
-- Penambahan murni: payload lama tanpa field pekan tetap sah dan jatuh ke 0, persis perilaku
-- sebelumnya. Balikan ikut membawa 'pekan' supaya importer bisa memastikan RPC yang dipanggil
-- memang versi yang mengenal kolom ini -- tanpa gerbang itu, frontend baru di atas database lama
-- akan mengirim empat baris pekanan yang field pekan-nya DIABAIKAN DIAM-DIAM oleh
-- jsonb_to_recordset, lalu ditolak unique lama sebagai duplikat. Pola gerbang yang sama sudah
-- dipakai untuk 'mode' (20260814100000) dan 'jenjang' (20260828110000).
create or replace function public.import_karakter_periode(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sekolah_id text := payload->>'sekolah_id';
  v_periode_id text := payload->>'periode_id';
  v_mode text := coalesce(payload->>'mode', 'ganti');
  v_jenjang text := nullif(payload->>'jenjang', '');
  v_sumber text[];
  v_skor_count int;
  v_skor_indikator_count int;
  v_pernyataan_count int;
  v_pernyataan_ortu_count int;
  v_pernyataan_siswa_count int;
  v_summary_count int;
begin
  if auth.role() <> 'service_role' and not is_admin_fammi() then
    raise exception 'Cuma AdminFammi yang boleh import data karakter.' USING ERRCODE = '42501';
  end if;
  if v_sekolah_id is null or v_periode_id is null then
    raise exception 'payload.sekolah_id dan payload.periode_id wajib diisi.';
  end if;
  if v_mode not in ('ganti', 'lanjut') then
    raise exception 'payload.mode harus ''ganti'' atau ''lanjut'', dapat: %', v_mode;
  end if;

  if v_mode = 'ganti' then
    if jsonb_typeof(payload->'pernyataan_sumber') = 'array' then
      select coalesce(array_agg(distinct s), '{}'::text[]) into v_sumber
      from jsonb_array_elements_text(payload->'pernyataan_sumber') as t(s);
    else
      select coalesce(array_agg(distinct coalesce(x->>'sumber', 'orangtua')), '{}'::text[])
      into v_sumber
      from jsonb_array_elements(coalesce(payload->'pernyataan_rows', '[]'::jsonb)) as t(x);
    end if;

    -- Hapus SELURUH pekan di periode ini, bukan per pekan. Unggahan menggantikan satu bulan
    -- penuh; kalau cuma pekan yang ada di berkas yang dihapus, pekan yang dibatalkan sekolah
    -- (mis. libur, salah input lalu dihapus dari berkas) akan tertinggal selamanya di database
    -- tanpa ada cara membuangnya dari CMS.
    delete from karakter_skor
     where sekolah_id = v_sekolah_id and periode_id = v_periode_id
       and (v_jenjang is null or jenjang = v_jenjang);

    delete from karakter_skor_indikator
     where sekolah_id = v_sekolah_id and periode_id = v_periode_id
       and (v_jenjang is null or jenjang = v_jenjang);

    if v_jenjang is null and array_length(v_sumber, 1) is not null then
      delete from karakter_pernyataan_ortu
       where sekolah_id = v_sekolah_id and periode_id = v_periode_id
         and sumber = any(v_sumber);
    end if;

    if v_jenjang is null then
      delete from karakter_summary where sekolah_id = v_sekolah_id and periode_id = v_periode_id;
    else
      delete from karakter_summary
       where sekolah_id = v_sekolah_id and periode_id = v_periode_id
         and scope = 'jenjang' and scope_id = v_jenjang;
    end if;
  end if;

  insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber, status)
  select sekolah_id, coalesce(x.jenjang, '*'), coalesce(x.pekan, 0), kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber, status
  from jsonb_to_recordset(coalesce(payload->'skor_rows', '[]'::jsonb)) as x(
    sekolah_id text, jenjang text, pekan smallint, kelas_id text, murid_id text, nama_murid text,
    periode_id text, aspek_kode text, skor int, sumber text, status text
  );
  get diagnostics v_skor_count = row_count;

  insert into karakter_skor_indikator (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, sumber, status)
  select sekolah_id, coalesce(x.jenjang, '*'), coalesce(x.pekan, 0), kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, sumber, status
  from jsonb_to_recordset(coalesce(payload->'skor_indikator_rows', '[]'::jsonb)) as x(
    sekolah_id text, jenjang text, pekan smallint, kelas_id text, murid_id text, nama_murid text,
    periode_id text, aspek_kode text, indikator_kode text, skor int, sumber text, status text
  );
  get diagnostics v_skor_indikator_count = row_count;

  with ins as (
    insert into karakter_pernyataan_ortu (
      sekolah_id, kelas_id, murid_id, nama_murid, periode_id, kategori_pernyataan, pernyataan,
      emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri, status,
      sumber
    )
    select
      sekolah_id, kelas_id, murid_id, nama_murid, periode_id, kategori_pernyataan, pernyataan,
      emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri, status,
      coalesce(x.sumber, 'orangtua')
    from jsonb_to_recordset(coalesce(payload->'pernyataan_rows', '[]'::jsonb)) as x(
      sekolah_id text, kelas_id text, murid_id text, nama_murid text, periode_id text,
      kategori_pernyataan text, pernyataan text, emosi_anak text, alasan_emosi text,
      dukungan_dibutuhkan text, dukungan_lainnya text, hal_disyukuri text, status text,
      sumber text
    )
    returning sumber
  )
  select
    (count(*))::int,
    (count(*) filter (where sumber = 'orangtua'))::int,
    (count(*) filter (where sumber = 'siswa'))::int
  into v_pernyataan_count, v_pernyataan_ortu_count, v_pernyataan_siswa_count
  from ins;

  insert into karakter_summary (sekolah_id, scope, scope_id, periode_id, ringkasan, status)
  select sekolah_id, scope, scope_id, periode_id, ringkasan, status
  from jsonb_to_recordset(coalesce(payload->'summary_rows', '[]'::jsonb)) as x(
    sekolah_id text, scope text, scope_id text, periode_id text, ringkasan jsonb, status text
  );
  get diagnostics v_summary_count = row_count;

  return jsonb_build_object(
    'ok', true, 'periode_id', v_periode_id, 'mode', v_mode,
    'jenjang', coalesce(v_jenjang, '*semua*'),
    'pekan', true,
    'skor', v_skor_count, 'skor_indikator', v_skor_indikator_count,
    'pernyataan', v_pernyataan_count,
    'pernyataan_orangtua', v_pernyataan_ortu_count,
    'pernyataan_siswa', v_pernyataan_siswa_count,
    'summary', v_summary_count
  );
end;
$$;

grant execute on function public.import_karakter_periode(jsonb) to authenticated;
