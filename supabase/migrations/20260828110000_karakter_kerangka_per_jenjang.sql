-- Kerangka Karakter per Jenjang.
--
-- Sampai sekarang modul Karakter memegang satu asumsi bawaan: SATU SEKOLAH = SATU DAFTAR
-- KARAKTER. Asumsi itu tertanam di struktur data, bukan cuma di tampilan:
--   * karakter_skor.aspek_kode isinya "karakter1".."karakterN", yaitu POSISI KOLOM di berkas
--     Excel. Akhiran namanya ("karakter1_empati") dibuang importer, cuma kodenya yang disimpan.
--   * karakter_aspek_config grain-nya (sekolah_id, aspek_kode), jadi cuma bisa menyimpan SATU
--     nama per kode per sekolah.
--
-- SD Amal Mulia (diaudit 2026-08-28) melanggar asumsi itu: 6 jenjang (kelas 1-6), tiap jenjang
-- punya 4 karakternya sendiri, seragam antar kelas di dalam satu jenjang. Pemilik produk
-- mengonfirmasi akan ada sekolah lain dengan pola sama, jadi ini dinaikkan jadi fitur.
--
-- Bukti paling keras bahwa aspek_kode TIDAK BOLEH dipakai sebagai identitas lintas jenjang,
-- diambil dari berkas sekolah itu sendiri: karakter "senang_belajar_disiplin_dan_mandiri" duduk
-- di posisi karakter4 di Kelas 3, tapi karakter3 di Kelas 4 dan Kelas 6. Agregasi apa pun yang
-- mengelompokkan lewat aspek_kode akan memasukkan skor Kelas 3 ke ember yang salah, tanpa error
-- apa pun. Ini pengulangan cacat yang sudah pernah kena di dashboard YPT (commit 762fdc5),
-- sekarang muncul DI DALAM satu sekolah, di mana tidak ada filter jenjang yang bisa menyelamatkan.
--
-- ATURAN IDENTITAS, keputusan pemilik produk 2026-08-28:
--   Dua karakter dari jenjang berbeda boleh disandingkan dalam satu grafik HANYA kalau nama DAN
--   indikatornya sama persis. Nama sama tapi indikator beda = dua karakter berbeda.
--
-- Penegakannya SENGAJA tidak otomatis. Sistem tidak mencocokkan nama, tidak mencocokkan teks
-- indikator, dan tidak menebak. Bawaannya tiap (jenjang, aspek_kode) berdiri sendiri;
-- penggabungan dinyatakan manusia lewat kolom identitas_kode di bawah. Alasannya sudah terbukti
-- di data sekolah itu: sebagian perbedaan indikator cuma beda ketikan ("mau_wudhu_waktu_sholat"
-- vs "mau_berwudhu", "alquran" vs "quran"), sebagian lain perbedaan tingkat kesulitan yang nyata
-- ("sholat_berjamaah_tanpa_disuruh", "jamaah_mandiri"). Pencocokan teks akan salah di kedua arah,
-- dan cuma sekolah yang tahu kurikulumnya bisa membedakan.
--
-- KOMPATIBEL MUNDUR. Sekolah yang karakternya seragam (semua sekolah yang sudah ada) memakai
-- nilai sentinel '*' di kolom jenjang, di kedua sisi (data maupun config), jadi setiap join tetap
-- cocok dan tidak satu pun angkanya berubah. Tidak ada NULL yang perlu diurus di mana pun.
--
-- Idempoten, aman dijalankan ulang. Jalankan lewat Supabase SQL Editor (tidak ada CLI di
-- lingkungan ini). Edge Function admin-actions TIDAK perlu redeploy: handleImportKarakter
-- meneruskan payload apa adanya ke RPC tanpa memvalidasi bentuknya.

-- ── 1. Kolom jenjang di tabel data ─────────────────────────────────────────────────────────
-- '*' berarti "sekolah ini satu kerangka untuk semua jenjang", yaitu perilaku lama. Sekolah
-- berkerangka-per-jenjang mengisi label jenjangnya ("Kelas 1"), yang ditulis importer.
--
-- NOT NULL DEFAULT '*' dipilih alih-alih NULL supaya tidak ada satu pun join, GROUP BY, atau
-- perbandingan di seluruh sistem yang perlu tahu soal NULL. Ini mahal sekali sekarang (satu
-- rewrite tabel per ALTER di Postgres < 11; di versi Supabase sekarang default non-volatile
-- ditulis ke katalog, bukan ke tiap baris, jadi murah), tapi menghemat cabang logika di lusinan
-- tempat selamanya.
alter table public.karakter_skor
  add column if not exists jenjang text not null default '*';

alter table public.karakter_skor_indikator
  add column if not exists jenjang text not null default '*';

comment on column public.karakter_skor.jenjang is
  'Jenjang pemilik kerangka karakter baris ini ("Kelas 1"). ''*'' = sekolah berkerangka tunggal. Bersama aspek_kode inilah identitas karakter, karena aspek_kode sendiri cuma posisi kolom Excel dan artinya bisa berbeda antar jenjang.';

comment on column public.karakter_skor_indikator.jenjang is
  'Lihat karakter_skor.jenjang.';

-- Indeks pendukung agregasi per jenjang. Melengkapi (sekolah_id, periode_id) dari migration
-- 20260814100000, bukan menggantikannya: yang itu untuk DELETE per periode, yang ini untuk
-- SELECT per jenjang di view di bagian 5.
create index if not exists karakter_skor_sekolah_jenjang_periode_idx
  on public.karakter_skor (sekolah_id, jenjang, periode_id);

create index if not exists karakter_skor_indikator_sekolah_jenjang_periode_idx
  on public.karakter_skor_indikator (sekolah_id, jenjang, periode_id);

-- ── 2. Kolom jenjang + identitas di tabel konfigurasi ──────────────────────────────────────
alter table public.karakter_aspek_config
  add column if not exists jenjang text not null default '*';

alter table public.karakter_aspek_config
  add column if not exists identitas_kode text;

alter table public.karakter_indikator_config
  add column if not exists jenjang text not null default '*';

comment on column public.karakter_aspek_config.identitas_kode is
  'Penanda "karakter ini SAMA dengan karakter itu di jenjang lain", diisi manusia lewat Admin CMS setelah melihat indikator kedua kandidat berdampingan. NULL = berdiri sendiri, dan itu bawaannya. Dua baris dengan identitas_kode sama (dalam satu sekolah) boleh disandingkan dalam satu grafik perbandingan; yang NULL tidak pernah. Sistem TIDAK PERNAH mengisi kolom ini sendiri, termasuk saat importer melihat nama atau indikator yang kelihatan sama -- lihat aturan identitas di kepala berkas ini.';

-- ── 3. Unique constraint ikut naik grain ───────────────────────────────────────────────────
-- Constraint lama kedua tabel ini dibuat di luar folder migrations (lihat catatan di
-- saveAspekConfigAction, web/src/pages/admin/useAdminCmsData.js), jadi namanya tidak bisa
-- dipastikan dari repo. Dicari lewat katalog, lalu dibuang.
--
-- ATURANNYA GENERAL, bukan daftar susunan kolom tertentu: buang setiap unique di kedua tabel ini
-- yang TIDAK menyertakan kolom jenjang. Sesudah migration ini, keunikan yang mengabaikan jenjang
-- selalu keliru apa pun bentuknya, karena satu sekolah memang boleh punya "karakter3" di enam
-- jenjang sekaligus. Merumuskannya sebagai "harus memuat jenjang" membuat blok ini tetap benar
-- untuk sekolah yang constraint-nya dibuat dengan urutan kolom berbeda, atau dengan kolom
-- tambahan yang tidak kita duga -- dan tidak akan membuang unique baru yang memang sudah benar.
--
-- attname bertipe `name`, bukan `text`. Tanpa ::text eksplisit, perbandingan array-nya gagal
-- dengan "operator does not exist: name[] = text[]".
do $$
declare
  r record;
begin
  for r in
    select c.conname, c.conrelid::regclass as tbl
    from pg_constraint c
    where c.contype = 'u'
      and c.conrelid in (
        'public.karakter_aspek_config'::regclass,
        'public.karakter_indikator_config'::regclass
      )
      and not exists (
        select 1
        from unnest(c.conkey) as k(attnum)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
        where a.attname::text = 'jenjang'
      )
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
    raise notice 'Unique constraint tanpa jenjang dibuang: % pada %', r.conname, r.tbl;
  end loop;
end $$;

-- Index unik (bukan constraint) yang mengabaikan jenjang juga dibuang: bentuk itu sama
-- mengikatnya dan sama-sama mungkin dibuat lewat SQL Editor. Index yang menopang sebuah
-- constraint dilewati -- yang itu sudah ikut terbuang bersama constraint-nya di blok atas.
do $$
declare
  r record;
begin
  for r in
    select i.indexrelid::regclass as idx
    from pg_index i
    where i.indisunique
      and not exists (select 1 from pg_constraint c where c.conindid = i.indexrelid)
      and i.indrelid in (
        'public.karakter_aspek_config'::regclass,
        'public.karakter_indikator_config'::regclass
      )
      and not exists (
        select 1
        from unnest(i.indkey::int2[]) as k(attnum)
        join pg_attribute a on a.attrelid = i.indrelid and a.attnum = k.attnum
        where a.attname::text = 'jenjang'
      )
  loop
    execute format('drop index %s', r.idx);
    raise notice 'Index unik tanpa jenjang dibuang: %', r.idx;
  end loop;
end $$;

create unique index if not exists karakter_aspek_config_sekolah_jenjang_aspek_key
  on public.karakter_aspek_config (sekolah_id, jenjang, aspek_kode);

create unique index if not exists karakter_indikator_config_sekolah_jenjang_aspek_ind_key
  on public.karakter_indikator_config (sekolah_id, jenjang, aspek_kode, indikator_kode);

-- ── 4. RPC import: terima jenjang, dan boleh dibatasi per jenjang ──────────────────────────
-- Dua penambahan, keduanya kompatibel mundur:
--   a. skor_rows dan skor_indikator_rows sekarang boleh membawa field `jenjang`. Payload lama
--      tanpa field itu tetap sah dan jatuh ke '*', persis perilaku sebelumnya.
--   b. payload.jenjang opsional MEMPERSEMPIT DELETE mode 'ganti' ke satu jenjang saja. Ini bukan
--      hiasan: tanpa itu, sekolah yang mengunggah per jenjang (satu berkas per kelas) akan
--      kehilangan hasil unggahan sebelumnya begitu berkas kedua masuk, karena DELETE lama
--      menyapu seluruh (sekolah, periode). Kehilangan diam-diam seperti itu jauh lebih buruk
--      daripada import gagal. Kalau payload.jenjang tidak dikirim (satu berkas memuat semua
--      jenjang, yang jadi jalur utama), cakupan hapusnya sama persis seperti dulu.
--
-- karakter_summary dan karakter_pernyataan_ortu SENGAJA tidak dapat kolom jenjang.
-- karakter_summary sudah punya scope='jenjang' sejak awal, dan pernyataan orang tua tidak
-- terikat kerangka karakter mana pun.
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

    -- v_jenjang null -> "hapus seluruh jenjang", yaitu perilaku lama persis.
    delete from karakter_skor
     where sekolah_id = v_sekolah_id and periode_id = v_periode_id
       and (v_jenjang is null or jenjang = v_jenjang);

    delete from karakter_skor_indikator
     where sekolah_id = v_sekolah_id and periode_id = v_periode_id
       and (v_jenjang is null or jenjang = v_jenjang);

    -- Pernyataan tidak punya kolom jenjang, jadi upload per jenjang TIDAK boleh menghapusnya:
    -- berkas jenjang kedua akan membuang refleksi jenjang pertama yang tidak bisa dikembalikan.
    -- Hapus hanya kalau unggahannya mencakup seluruh sekolah.
    if v_jenjang is null and array_length(v_sumber, 1) is not null then
      delete from karakter_pernyataan_ortu
       where sekolah_id = v_sekolah_id and periode_id = v_periode_id
         and sumber = any(v_sumber);
    end if;

    -- Alasan yang sama untuk summary: scope 'sekolah' milik bersama seluruh jenjang. Kalau
    -- unggahannya per jenjang, yang dibuang cuma ringkasan jenjang itu dan kelas-kelas di
    -- bawahnya; ringkasan sekolah dibiarkan sampai ada unggahan yang mencakup semuanya.
    if v_jenjang is null then
      delete from karakter_summary where sekolah_id = v_sekolah_id and periode_id = v_periode_id;
    else
      delete from karakter_summary
       where sekolah_id = v_sekolah_id and periode_id = v_periode_id
         and scope = 'jenjang' and scope_id = v_jenjang;
    end if;
  end if;

  insert into karakter_skor (sekolah_id, jenjang, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber, status)
  select sekolah_id, coalesce(x.jenjang, '*'), kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber, status
  from jsonb_to_recordset(coalesce(payload->'skor_rows', '[]'::jsonb)) as x(
    sekolah_id text, jenjang text, kelas_id text, murid_id text, nama_murid text, periode_id text,
    aspek_kode text, skor int, sumber text, status text
  );
  get diagnostics v_skor_count = row_count;

  insert into karakter_skor_indikator (sekolah_id, jenjang, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, sumber, status)
  select sekolah_id, coalesce(x.jenjang, '*'), kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, sumber, status
  from jsonb_to_recordset(coalesce(payload->'skor_indikator_rows', '[]'::jsonb)) as x(
    sekolah_id text, jenjang text, kelas_id text, murid_id text, nama_murid text, periode_id text,
    aspek_kode text, indikator_kode text, skor int, sumber text, status text
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

  -- 'jenjang' ikut dikembalikan supaya importer bisa memastikan RPC yang dipanggil memang versi
  -- yang mengenal cakupan per jenjang. Tanpa gerbang ini, frontend baru yang tayang sebelum
  -- migration dijalankan akan mengunggah berkas jenjang kedua dan RPC lama akan menghapus
  -- jenjang pertama, tanpa satu pun error -- pola kehilangan diam-diam yang sama persis dengan
  -- yang sudah pernah terjadi di gerbang 'mode' (migration 20260814100000).
  return jsonb_build_object(
    'ok', true, 'periode_id', v_periode_id, 'mode', v_mode,
    'jenjang', coalesce(v_jenjang, '*semua*'),
    'skor', v_skor_count, 'skor_indikator', v_skor_indikator_count,
    'pernyataan', v_pernyataan_count,
    'pernyataan_orangtua', v_pernyataan_ortu_count,
    'pernyataan_siswa', v_pernyataan_siswa_count,
    'summary', v_summary_count
  );
end;
$$;

grant execute on function public.import_karakter_periode(jsonb) to authenticated;

-- ── 5. View kerangka: satu sumber kebenaran "karakter apa saja yang dipunya sekolah ini" ───
-- Barisnya diturunkan dari DATA (aspek_kode yang benar-benar ada di karakter_skor), bukan dari
-- config yang mungkin belum diisi. Sekolah yang belum pernah disentuh admin tetap muncul lengkap
-- dengan kode-kodenya, cuma tanpa nama. Ini pelajaran dari commit cd67ad3: menawarkan baris dari
-- config yang kosong berarti form-nya ikut kosong dan admin tidak tahu harus mengisi apa.
--
-- Label dicari dua tahap: baris config jenjang yang persis, baru baris '*' sebagai cadangan.
-- Tahap kedua itu untuk sekolah yang namanya sudah diisi SEBELUM migration ini (semuanya masuk
-- '*') lalu datanya berpindah ke kerangka per jenjang -- tanpa cadangan itu, nama yang sudah
-- benar akan hilang dari tampilan pada hari migration dijalankan.
--
-- security_invoker = true WAJIB ADA, alasannya sama dengan view Karakter lain (lihat
-- 20260711150000): tanpa itu view ini bypass RLS untuk semua pemakainya dan membocorkan data
-- sekolah lain ke siapa pun yang bisa SELECT.
create or replace view public.karakter_kerangka
with (security_invoker = true)
as
with dipakai as (
  select distinct sekolah_id, jenjang, aspek_kode
  from public.karakter_skor
)
select
  d.sekolah_id,
  d.jenjang,
  d.aspek_kode,
  coalesce(ce.aspek_label, cs.aspek_label)   as aspek_label,
  coalesce(ce.urutan, cs.urutan)             as urutan,
  ce.identitas_kode,
  (ce.aspek_label is null and cs.aspek_label is null) as tanpa_nama
from dipakai d
left join public.karakter_aspek_config ce
  on ce.sekolah_id = d.sekolah_id and ce.jenjang = d.jenjang and ce.aspek_kode = d.aspek_kode
left join public.karakter_aspek_config cs
  on cs.sekolah_id = d.sekolah_id and cs.jenjang = '*' and cs.aspek_kode = d.aspek_kode;

grant select on public.karakter_kerangka to authenticated;

comment on view public.karakter_kerangka is
  'Daftar karakter yang benar-benar dipakai tiap (sekolah, jenjang), diturunkan dari karakter_skor lalu ditempeli nama dari karakter_aspek_config. Dipakai panel Kerangka Karakter di Admin CMS dan laporan per jenjang. Baris dengan tanpa_nama = true berarti sekolah itu belum mengisi namanya dan akan tampil sebagai "Karakter N".';

-- ── 6. Agregat per jenjang dan indeks sekolah ──────────────────────────────────────────────
-- Tiga angka yang disepakati untuk laporan sekolah, dan alasan tiap-tiapnya:
--
--   a. karakter_jenjang_aspek_avg -- skor per karakter DI DALAM satu jenjang. Ini yang utama.
--      Datanya utuh, tidak ada kompromi, tidak ada pencampuran.
--   b. karakter_sekolah_indeks   -- SATU angka sekolah, rata-rata seluruh baris skor apa pun
--      karakternya. Sah dihitung karena tiap baris sudah persen pencapaian 0-100 terhadap
--      indikatornya SENDIRI, jadi yang dijawabnya "seberapa jauh murid mencapai karakter yang
--      memang ditargetkan untuknya". Ini BUKAN "profil karakter sekolah" dan tidak boleh
--      dipecah jadi batang per karakter di tampilan.
--   c. Perbandingan lintas jenjang -- TIDAK dibuatkan view sendiri. Dirakit di tampilan dari (a)
--      dengan menyaring identitas_kode yang tidak null dan berpasangan. Sengaja begitu: yang
--      boleh disandingkan ditentukan pernyataan manusia di config, bukan bentuk data.
--
-- FIR tidak menghitung agregat (butir 3 CLAUDE.md), makanya semua ini view Postgres, bukan
-- useMemo di React. Presedennya karakter_indikator_kelas_avg (20260814110000).
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
from public.karakter_skor
where skor is not null
group by sekolah_id, jenjang, periode_id, aspek_kode, sumber;

grant select on public.karakter_jenjang_aspek_avg to authenticated;

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
from public.karakter_skor
where skor is not null
group by sekolah_id, periode_id, sumber;

grant select on public.karakter_sekolah_indeks to authenticated;

comment on view public.karakter_sekolah_indeks is
  'Indeks Karakter Sekolah: rata-rata seluruh baris skor apa pun karakternya. Menjawab "seberapa jauh murid mencapai karakter yang ditargetkan untuknya", BUKAN profil karakter sekolah. Jangan pernah dipecah jadi batang per karakter di tampilan untuk sekolah berkerangka-per-jenjang.';

-- ── 7. View indikator lama ikut sadar jenjang ──────────────────────────────────────────────
-- Tanpa ini, "Top 5 indikator" satu sekolah akan mencampur indikator milik enam kerangka yang
-- berbeda jadi satu daftar. Kolom jenjang ditambahkan (bukan menggantikan apa pun), jadi
-- pemanggil lama yang tidak menyebut kolom itu tetap jalan; untuk sekolah berkerangka tunggal
-- nilainya selalu '*' dan hasilnya identik dengan sebelumnya.
--
-- DROP dulu, bukan CREATE OR REPLACE. Postgres cuma mengizinkan REPLACE menambah kolom DI AKHIR
-- daftar; menyisipkan `jenjang` di tengah ditolak dengan "cannot change name of view column".
-- Menaruhnya di akhir bisa saja, tapi urutan kolomnya jadi menyesatkan pembaca berikutnya. Tidak
-- ada objek database lain yang bergantung pada kedua view ini (sudah dicek: cuma kode React yang
-- menyebut kolomnya per nama), jadi DROP aman.
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
from public.karakter_skor_indikator
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
from public.karakter_skor_indikator
group by sekolah_id, jenjang, kelas_id, periode_id, aspek_kode, indikator_kode;

grant select on public.karakter_indikator_kelas_avg to authenticated;

-- ── 8. Materialized view YPT ikut naik grain ───────────────────────────────────────────────
-- WAJIB, bukan kerapian. ypt_k_aspek_mat dan ypt_k_indikator_mat LEFT JOIN ke tabel config lewat
-- (sekolah_id, aspek_kode). Begitu satu sekolah punya enam baris config untuk kode yang sama
-- (satu per jenjang), join itu MENGGANDAKAN baris: tiap baris skor cocok dengan enam baris
-- config, lalu GROUP BY yang menyertakan aspek_label memecahnya jadi enam baris keluaran dengan
-- nama berbeda-beda untuk aspek yang sama. Dashboard YPT akan menampilkan enam batang palsu,
-- persis bentuk cacat yang diperbaiki commit 762fdc5.
--
-- Matview tidak bisa di-CREATE OR REPLACE, jadi urutannya: buang view pembungkus, buang matview,
-- bangun ulang keduanya, pasang lagi index unik (dibutuhkan REFRESH ... CONCURRENTLY di
-- 20260826150000) dan grant-nya. Isi datanya dihitung ulang saat migration ini jalan.
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
from public.karakter_skor s
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
from public.karakter_skor_indikator i
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
