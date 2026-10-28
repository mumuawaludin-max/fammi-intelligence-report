-- Eksplorasi modul Multiple Intelligence di database produksi.
--
-- HANYA MEMBACA. Tidak ada INSERT, UPDATE, DELETE, atau DDL di berkas ini.
--
-- Tiap query berdiri sendiri, ditandai [Q01], [Q02], dst. Di Supabase Studio > SQL Editor,
-- blok satu query lalu tekan Run (Ctrl+Enter menjalankan bagian yang diblok saja). Kirim hasilnya
-- dengan menyebut nomornya, mis. "Q11: ...". Kalau satu query galat, lewati saja dan kirim
-- pesan galatnya; query lain tidak terpengaruh.
--
-- Hasilnya sengaja tidak memuat nama siswa, isi esai, maupun narasi laporan.


-- ═══ A. SKEMA ═══════════════════════════════════════════════════════════════

-- [Q01] Semua tabel/view di schema public, perkiraan jumlah baris, dan status RLS.
-- perkiraan_baris -1 berarti tabel belum pernah di-ANALYZE, bukan kosong.
select c.relname as tabel,
       case c.relkind when 'r' then 'tabel' when 'p' then 'partisi'
                      when 'v' then 'view' when 'm' then 'matview' end as jenis,
       c.reltuples::bigint as perkiraan_baris,
       c.relrowsecurity as rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
order by c.relname;


-- [Q02] Jumlah baris pasti tabel yang dipakai modul MI.
select 'mi_hasil' as tabel, count(*) as baris from public.mi_hasil
union all select 'tindak_lanjut', count(*) from public.tindak_lanjut
union all select 'briefing', count(*) from public.briefing
union all select 'profiles', count(*) from public.profiles
union all select 'schools', count(*) from public.schools
union all select 'school_modules', count(*) from public.school_modules;


-- [Q03] Kolom tiap tabel MI.
select table_name as tabel, ordinal_position as urutan, column_name as kolom,
       udt_name as tipe, is_nullable as boleh_kosong, column_default as bawaan
from information_schema.columns
where table_schema = 'public'
  and table_name in ('mi_hasil', 'mi_input', 'tindak_lanjut', 'briefing',
                     'profiles', 'schools', 'school_modules')
order by table_name, ordinal_position;


-- [Q04] Constraint tabel MI.
select rel.relname as tabel, con.conname as nama, pg_get_constraintdef(con.oid) as definisi
from pg_constraint con
join pg_class rel on rel.oid = con.conrelid
join pg_namespace n on n.oid = rel.relnamespace
where n.nspname = 'public'
  and rel.relname in ('mi_hasil', 'mi_input', 'tindak_lanjut', 'briefing',
                      'profiles', 'schools', 'school_modules')
order by rel.relname, con.conname;


-- [Q05] Index tabel MI.
select tablename as tabel, indexname as nama, indexdef as definisi
from pg_indexes
where schemaname = 'public'
  and tablename in ('mi_hasil', 'mi_input', 'tindak_lanjut', 'briefing',
                    'profiles', 'schools', 'school_modules')
order by tablename, indexname;


-- [Q06] Policy RLS tabel MI.
select tablename as tabel, policyname as nama, cmd as perintah, roles::text[] as peran_db,
       qual as using_, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('mi_hasil', 'mi_input', 'tindak_lanjut', 'briefing',
                    'profiles', 'schools', 'school_modules')
order by tablename, policyname;


-- [Q07] Trigger tabel MI.
select event_object_table as tabel, trigger_name as nama,
       action_timing || ' ' || event_manipulation as kapan, action_statement as aksi
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('mi_hasil', 'mi_input', 'tindak_lanjut', 'briefing',
                             'profiles', 'schools', 'school_modules')
order by event_object_table, trigger_name;


-- [Q08] Fungsi helper RLS (my_*) dan fungsi apa pun yang menyebut tabel MI.
select p.proname as nama,
       pg_get_function_identity_arguments(p.oid) as argumen,
       pg_get_functiondef(p.oid) as definisi
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prokind = 'f'
  and (p.proname like 'my\_%' or p.prosrc ilike '%mi_hasil%' or p.prosrc ilike '%mi_input%')
order by p.proname;


-- [Q09] View/matview yang membaca tabel MI.
select c.relname as nama,
       case c.relkind when 'v' then 'view' else 'matview' end as jenis
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v', 'm')
  and (pg_get_viewdef(c.oid) ilike '%mi_hasil%' or pg_get_viewdef(c.oid) ilike '%mi_input%')
order by c.relname;


-- ═══ B. ISI mi_hasil ════════════════════════════════════════════════════════

-- [Q10] Jumlah baris per status.
select status, count(*) as baris
from public.mi_hasil
group by status
order by baris desc;


-- [Q11] Per sekolah x periode x status. generated_at membantu membedakan baris era
-- Sheets/GAS dari baris yang dibuat lewat CMS (generate-mi, mulai 2026-07-13).
select h.sekolah_id, s.nama as sekolah, h.periode_id, h.status,
       count(*) as baris,
       count(distinct h.murid_id) as murid,
       count(distinct h.kelas_id) as kelas,
       min(h.generated_at) as generated_pertama,
       max(h.generated_at) as generated_terakhir
from public.mi_hasil h
left join public.schools s on s.id::text = h.sekolah_id::text
group by h.sekolah_id, s.nama, h.periode_id, h.status
order by s.nama, h.periode_id, h.status;


-- [Q12] Jumlah baris per tanggal generate.
select generated_at::date as tanggal, status, count(*) as baris
from public.mi_hasil
group by 1, 2
order by 1, 2;


-- [Q13] Label kelas per sekolah.
select s.nama as sekolah, h.kelas_id, count(distinct h.murid_id) as murid
from public.mi_hasil h
left join public.schools s on s.id::text = h.sekolah_id::text
where h.status = 'disetujui'
group by s.nama, h.kelas_id
order by s.nama, h.kelas_id;


-- [Q14] Format periode_id dan murid_id.
select 'periode_id' as kolom, coalesce(periode_id, '(kosong)') as nilai_atau_pola, count(*) as baris
from public.mi_hasil
group by periode_id
union all
select 'murid_id',
       case when murid_id is null then '(kosong)'
            when murid_id ~ '^M[0-9]+$' then 'M+angka'
            when murid_id ~ '^[0-9]+$' then 'angka'
            else 'lain' end,
       count(*)
from public.mi_hasil
group by 2
order by 1, 2;


-- [Q15] Contoh murid_id yang polanya bukan M+angka (paling banyak 10).
select distinct murid_id
from public.mi_hasil
where murid_id !~ '^M[0-9]+$'
limit 10;


-- [Q16] Tipe isi kolom detail.
select jsonb_typeof(detail) as tipe, count(*) as baris
from public.mi_hasil
group by 1;


-- [Q17] Semua kunci di detail beserta jumlah baris yang memilikinya. Kunci yang jumlahnya jauh
-- di bawah total baris menandai perbedaan versi pipeline (GAS lama vs CMS).
select k as kunci, count(*) as baris
from public.mi_hasil h,
     jsonb_object_keys(case when jsonb_typeof(h.detail) = 'object' then h.detail
                            else '{}'::jsonb end) k
group by k
order by k;


-- [Q18] Bentuk detail satu baris disetujui terbaru: tipe dan panjang tiap kunci, tanpa isi.
select e.k as kunci, jsonb_typeof(e.v) as tipe, length(e.v #>> '{}') as panjang
from (
  select detail
  from public.mi_hasil
  where status = 'disetujui' and jsonb_typeof(detail) = 'object'
  order by generated_at desc nulls last
  limit 1
) h,
jsonb_each(h.detail) e(k, v)
order by e.k;


-- ═══ C. KUALITAS SKOR (baris disetujui) ═════════════════════════════════════

-- [Q19] Ringkasan tiap kolom skor.
select v.kolom,
       count(v.nilai) as terisi,
       count(*) - count(v.nilai) as kosong,
       count(*) filter (where v.nilai = 0) as nol,
       min(v.nilai) as min,
       max(v.nilai) as max,
       round(avg(v.nilai), 1) as rata,
       count(*) filter (where v.nilai <> trunc(v.nilai)) as pecahan
from public.mi_hasil h
cross join lateral (values
  ('skor_inter', h.skor_inter::numeric), ('skor_intra', h.skor_intra::numeric),
  ('skor_kines', h.skor_kines::numeric), ('skor_linguistik', h.skor_linguistik::numeric),
  ('skor_logmat', h.skor_logmat::numeric), ('skor_musikal', h.skor_musikal::numeric),
  ('skor_naturalis', h.skor_naturalis::numeric), ('skor_spasial', h.skor_spasial::numeric)
) v(kolom, nilai)
where h.status = 'disetujui'
group by v.kolom
order by v.kolom;


-- [Q20] Kolom skor_* dibandingkan dengan r_* di detail (dibulatkan). beda > 0 berarti dua
-- sumber skor di satu baris tidak sama.
select v.kolom,
       count(*) filter (
         where round(v.flat) is distinct from
               case when v.dari_detail ~ '^-?[0-9]+(\.[0-9]+)?$'
                    then round(v.dari_detail::numeric) end
       ) as beda,
       count(*) as total
from public.mi_hasil h
cross join lateral (values
  ('inter', h.skor_inter::numeric, h.detail->>'r_inter'),
  ('intra', h.skor_intra::numeric, h.detail->>'r_intra'),
  ('kines', h.skor_kines::numeric, h.detail->>'r_kines'),
  ('linguistik', h.skor_linguistik::numeric,
   coalesce(h.detail->>'r_linguistik', h.detail->>'r_linguis')),
  ('logmat', h.skor_logmat::numeric, h.detail->>'r_logmat'),
  ('musikal', h.skor_musikal::numeric, h.detail->>'r_musikal'),
  ('naturalis', h.skor_naturalis::numeric, h.detail->>'r_naturalis'),
  ('spasial', h.skor_spasial::numeric, h.detail->>'r_spasial')
) v(kolom, flat, dari_detail)
group by v.kolom
order by v.kolom;


-- [Q21] Nilai level yang dipakai (Kuat/Sedang/Berkembang atau lainnya).
select v.p as level, count(*) as jumlah
from public.mi_hasil h
cross join lateral (values
  (h.pred_inter), (h.pred_intra), (h.pred_kines), (h.pred_linguistik), (h.pred_logmat),
  (h.detail->>'pred_musikal'), (h.detail->>'pred_naturalis'), (h.detail->>'pred_spasial')
) v(p)
where h.status = 'disetujui'
group by v.p
order by jumlah desc;


-- [Q22] Pasangan skor-level yang TIDAK cocok dengan ambang 75/50 di miPipeline.ts.
-- tidak_sesuai 0 berarti seluruh data tayang dibuat dengan ambang yang sama.
select v.kolom,
       count(*) filter (
         where v.p is distinct from case when v.s >= 75 then 'Kuat'
                                         when v.s >= 50 then 'Sedang'
                                         else 'Berkembang' end
       ) as tidak_sesuai,
       count(*) as total
from public.mi_hasil h
cross join lateral (values
  ('inter', h.skor_inter::numeric, h.pred_inter),
  ('intra', h.skor_intra::numeric, h.pred_intra),
  ('kines', h.skor_kines::numeric, h.pred_kines),
  ('linguistik', h.skor_linguistik::numeric, h.pred_linguistik),
  ('logmat', h.skor_logmat::numeric, h.pred_logmat)
) v(kolom, s, p)
where h.status = 'disetujui'
group by v.kolom
order by v.kolom;


-- [Q23] Sebaran Top 1 (nilai apa adanya dari detail).
select coalesce(detail->>'top_1', '(kosong)') as top_1, count(*) as siswa
from public.mi_hasil
where status = 'disetujui'
group by 1
order by siswa desc;


-- [Q24] Siswa yang skor tertingginya seri di dua kecerdasan atau lebih.
select count(*) as siswa_seri
from public.mi_hasil h
cross join lateral (select array[
  h.skor_inter::numeric, h.skor_intra::numeric, h.skor_kines::numeric,
  h.skor_linguistik::numeric, h.skor_logmat::numeric, h.skor_musikal::numeric,
  h.skor_naturalis::numeric, h.skor_spasial::numeric
] a) arr
where h.status = 'disetujui'
  and (select count(*) from unnest(arr.a) as u(s)
       where u.s = (select max(w.x) from unnest(arr.a) as w(x))) > 1;


-- ═══ D. IDENTITAS MURID DAN AKUN ════════════════════════════════════════════

-- [Q25] Kemungkinan data murid ganda atau tertukar (hanya jumlah, tanpa nama).
select
  (select count(*) from (
     select sekolah_id, lower(trim(detail->>'nama_siswa'))
     from public.mi_hasil
     where status = 'disetujui' and coalesce(detail->>'nama_siswa', '') <> ''
     group by 1, 2 having count(distinct murid_id) > 1
   ) x) as nama_sama_murid_id_beda,
  (select count(*) from (
     select sekolah_id, murid_id
     from public.mi_hasil
     where status = 'disetujui'
     group by 1, 2 having count(distinct lower(trim(detail->>'nama_siswa'))) > 1
   ) x) as murid_id_sama_nama_beda,
  (select count(*) from (
     select sekolah_id, murid_id
     from public.mi_hasil
     where status = 'disetujui'
     group by 1, 2 having count(distinct periode_id) > 1
   ) x) as murid_dengan_banyak_periode;


-- [Q26] Akun Orang Tua dan Siswa untuk murid yang laporan MI-nya sudah tayang.
select s.nama as sekolah,
       m.murid as murid_mi_disetujui,
       (select count(distinct p.murid_id) from public.profiles p
        where p.school_id::text = m.sekolah_id::text and p.peran = 'OrangTua'
          and p.murid_id = any (m.murid_ids)) as punya_akun_orangtua,
       (select count(distinct p.murid_id) from public.profiles p
        where p.school_id::text = m.sekolah_id::text and p.peran = 'Siswa'
          and p.murid_id = any (m.murid_ids)) as punya_akun_siswa
from (
  select sekolah_id, count(distinct murid_id) as murid, array_agg(distinct murid_id) as murid_ids
  from public.mi_hasil
  where status = 'disetujui'
  group by sekolah_id
) m
left join public.schools s on s.id::text = m.sekolah_id::text
order by s.nama;


-- [Q27] Jumlah akun per peran di sekolah yang punya data MI.
select s.nama as sekolah, p.peran, count(*) as akun
from public.profiles p
left join public.schools s on s.id::text = p.school_id::text
where p.school_id::text in (select distinct sekolah_id::text from public.mi_hasil)
group by s.nama, p.peran
order by s.nama, p.peran;


-- ═══ E. TINDAK LANJUT, BRIEFING, ENTITLEMENT ════════════════════════════════

-- [Q28] Nilai kolom modul di tindak_lanjut dan briefing.
select 'tindak_lanjut' as tabel, coalesce(modul, '(kosong)') as modul, count(*) as baris
from public.tindak_lanjut group by modul
union all
select 'briefing', coalesce(modul, '(kosong)'), count(*)
from public.briefing group by modul
order by 1, 2;


-- [Q29] Tindak lanjut dan briefing modul MI per sekolah, scope, periode, status.
select 'tindak_lanjut' as tabel, s.nama as sekolah, t.scope, t.periode_id, t.status, count(*) as baris
from public.tindak_lanjut t
left join public.schools s on s.id::text = t.sekolah_id::text
where t.modul = 'mi'
group by s.nama, t.scope, t.periode_id, t.status
union all
select 'briefing', s.nama, b.scope, b.periode_id, b.status, count(*)
from public.briefing b
left join public.schools s on s.id::text = b.sekolah_id::text
where b.modul = 'mi'
group by s.nama, b.scope, b.periode_id, b.status
order by 1, 2, 4;


-- [Q30] Tiga contoh tindak lanjut MI tingkat sekolah/kelas (tanpa scope murid).
select *
from public.tindak_lanjut
where modul = 'mi' and scope is distinct from 'murid'
order by created_at desc nulls last
limit 3;


-- [Q31] Sekolah yang modul MI-nya terdaftar di school_modules.
select sm.*, s.nama as sekolah
from public.school_modules sm
left join public.schools s on s.id::text = sm.school_id::text
where sm.modul ilike 'mi%'
order by s.nama;


-- [Q32] Sebaran semua modul di school_modules.
select modul, count(*) filter (where aktif) as aktif, count(*) as total
from public.school_modules
group by modul
order by modul;


-- ═══ F. VERIFIKASI TEMUAN (ditambahkan setelah hasil Q01-Q32 masuk) ═════════

-- [Q33] Laporan tayang yang kedelapan skornya 0, dikelompokkan per sekolah, kelas kosong
-- atau tidak, dan Top 1. Dugaan: 28 siswa tanpa kelas yang tidak ikut tes, Top 1 jatuh ke
-- Musikal karena urutan kode di pipeline saat semua skor seri.
select s.nama as sekolah,
       h.kelas_id is null as kelas_kosong,
       greatest(h.skor_inter, h.skor_intra, h.skor_kines, h.skor_linguistik, h.skor_logmat,
                h.skor_musikal, h.skor_naturalis, h.skor_spasial) = 0 as semua_skor_nol,
       h.detail->>'top_1' as top_1,
       count(*) as siswa
from public.mi_hasil h
left join public.schools s on s.id::text = h.sekolah_id::text
where h.status = 'disetujui'
group by 1, 2, 3, 4
order by 1, 2, 3, 4;


-- [Q34] Anak yang sama tercatat di dua "sekolah" Personal dan Personal SMP (hanya jumlah).
select count(*) as nama_di_kedua_sekolah
from (
  select lower(trim(detail->>'nama_siswa'))
  from public.mi_hasil
  where sekolah_id in ('PERSONAL', 'PERSONAL-SMP') and status = 'disetujui'
  group by 1
  having count(distinct sekolah_id) > 1
) x;
