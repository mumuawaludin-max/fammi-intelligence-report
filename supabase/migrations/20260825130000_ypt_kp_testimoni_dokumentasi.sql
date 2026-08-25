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
