-- Modul baru: Leadership & Wellbeing Assessment (lw). Dua tabel bespoke (lw_lembaga/lw_personal)
-- plus pemakaian tabel generik tindak_lanjut/briefing yang sudah ada, mengikuti pola SC/PA.
--
-- BEDA PENTING dari migration SC/PA sebelumnya: modul ini TIDAK punya RPC impor massal
-- (import_lw_periode) karena datanya bukan pipeline CMS berulang. Kalau nanti ada lembaga lain,
-- migration baru dengan pola serupa cukup, atau RPC impor bisa ditambah kalau frekuensinya
-- sudah butuh CMS.
--
-- SEED: data CONTOH (dummy) "Yayasan Pendidikan Fammi" -- 20 guru di 4 jenjang (TK/SD/SMP/SMA),
-- periode Juli 2025, dibuat untuk demo/presentasi ke pimpinan yayasan atas instruksi eksplisit
-- pemilik produk (2026-08-25, menggantikan seed data asli Dinas Pendidikan Kota Bandung yang
-- sempat ada di versi awal berkas ini). Angka-angkanya BUKAN hasil asesmen sungguhan; nilainya
-- sinkron persis dengan web/src/pages/lw/lw.mock.js. Alur cerita datanya: seluruh guru Baik
-- secara keseluruhan, tapi dimensi Kemandirian/Penerimaan Diri/Eksplorasi Lingkungan punya
-- guru yang perlu perhatian, terkonsentrasi di unit SMP.

-- ── 1. Tabel agregat lembaga ────────────────────────────────────────────────────────────────
-- Satu baris per (sekolah, periode). Kolom `unit` disediakan (selalu null untuk saat ini)
-- supaya skema konsisten dengan sc_lembaga/pa_lembaga kalau nanti dibutuhkan breakdown per unit.
create table if not exists public.lw_lembaga (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id) on delete cascade,
  periode_id text not null,
  unit text,
  lead_distribusi jsonb,          -- [{kategori, persen, jumlah}] x5 (Istimewa..Perlu Penguatan)
  lead_aspek jsonb,                -- [{kode, nilai}] x4 (L/E/A/D), rata-rata seluruh kandidat
  lead_top_skill jsonb,            -- [{indikator, nilai}] top 5 indikator LEAD organisasi
  lead_skill_gap jsonb,            -- [{indikator, nilai}] top 3 indikator perlu penguatan
  protek_distribusi jsonb,         -- [{kategori, persen, jumlah}] x4 (Baik..Perlu Konsultasi)
  protek_dimensi jsonb,            -- [{kode, baik_persen, baik_jumlah, perlu_perhatian_persen, perlu_perhatian_jumlah, waspada_persen, waspada_jumlah}] x6 (P/R/O/T/E/K)
  protek_temuan_spesifik jsonb,    -- [{dimensi, pernyataan, persen, jumlah}] butir temuan spesifik
  created_at timestamptz not null default now()
);

create index if not exists lw_lembaga_sekolah_periode_idx
  on public.lw_lembaga (sekolah_id, periode_id);

-- ── 2. Tabel per kandidat ───────────────────────────────────────────────────────────────────
create table if not exists public.lw_personal (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id) on delete cascade,
  periode_id text not null,
  unit text not null,
  nama text not null,
  is_kepsek_saat_ini boolean not null default false,
  kesiapan_memimpin_skor int not null,
  kesiapan_memimpin_kategori text not null,
  kondisi_psikologis_skor int not null,
  kondisi_psikologis_kategori text not null,   -- skala 4-tingkat (Baik/Perlu Perhatian/Waspada/Perlu Konsultasi) skor total PROTEK
  kondisi_psikologis_label text,               -- label tri-state dokumen Leadership (mis. "Aman"), disimpan terpisah -- BUKAN dihitung ulang dari kategori di atas
  lead_aspek jsonb,       -- [{kode, nilai}] x4 (L/E/A/D)
  protek_dimensi jsonb,   -- [{kode, nilai, kategori}] x6 (P/R/O/T/E/K)
  narasi_pengalaman jsonb,  -- [{tema, isi}] jawaban skenario kepemimpinan
  cerita_terbaik jsonb,     -- [{judul, isi, bullet_poin}] kutipan cerita pengalaman terbaik, [] kalau tidak ada
  created_at timestamptz not null default now()
);

create index if not exists lw_personal_sekolah_periode_idx
  on public.lw_personal (sekolah_id, periode_id);

-- ── 3. RLS ──────────────────────────────────────────────────────────────────────────────────
-- Pola sama dengan pa_lembaga/pa_siswa: baca dikunci ke sekolah sendiri + daftar peran pimpinan,
-- policy admin baca terpisah disertakan SEJAK AWAL (pelajaran dari SC yang baru menambal ini
-- belakangan, lihat 20260730100000_sc_admin_read_rls.sql), tulis TIDAK punya policy sama sekali.
alter table public.lw_lembaga enable row level security;
alter table public.lw_personal enable row level security;

drop policy if exists lw_lembaga_baca on public.lw_lembaga;
create policy lw_lembaga_baca on public.lw_lembaga
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
);

drop policy if exists lw_personal_baca on public.lw_personal;
create policy lw_personal_baca on public.lw_personal
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
);

drop policy if exists lw_lembaga_admin_baca on public.lw_lembaga;
create policy lw_lembaga_admin_baca on public.lw_lembaga
for select to authenticated using (is_admin_fammi());

drop policy if exists lw_personal_admin_baca on public.lw_personal;
create policy lw_personal_admin_baca on public.lw_personal
for select to authenticated using (is_admin_fammi());

-- ── 4. Izinkan nilai 'lw' di school_modules.modul ──────────────────────────────────────────
do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw']) as v
    union
    select distinct modul from public.school_modules where modul is not null
  ) s;

  execute 'alter table public.school_modules drop constraint if exists school_modules_modul_check';
  execute format(
    'alter table public.school_modules add constraint school_modules_modul_check check (modul in (%s))',
    daftar
  );
end $$;

-- ── 5. Izinkan modul 'lw' + fokus 'lead'/'protek' di tindak_lanjut, modul 'lw' di briefing ──
-- Pola sama dengan 20260722110000_sc_tindak_lanjut_support.sql: constraint ini dibuat langsung
-- di Supabase (bukan lewat migration terlacak), jadi dibangun ulang secara DINAMIS kalau memang
-- ada, no-op dengan aman kalau namanya ternyata beda.
do $$
declare
  daftar text;
  con_exists boolean;
begin
  select exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'tindak_lanjut' and c.conname = 'tindak_lanjut_modul_check'
  ) into con_exists;

  if con_exists then
    select string_agg(quote_literal(v), ', ' order by v) into daftar
    from (
      select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw']) as v
      union
      select distinct modul from public.tindak_lanjut where modul is not null
    ) s;
    execute 'alter table public.tindak_lanjut drop constraint tindak_lanjut_modul_check';
    execute format('alter table public.tindak_lanjut add constraint tindak_lanjut_modul_check check (modul in (%s))', daftar);
  end if;
end $$;

do $$
declare
  daftar text;
  con_exists boolean;
begin
  select exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'briefing' and c.conname = 'briefing_modul_check'
  ) into con_exists;

  if con_exists then
    select string_agg(quote_literal(v), ', ' order by v) into daftar
    from (
      select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc', 'pa', 'lw']) as v
      union
      select distinct modul from public.briefing where modul is not null
    ) s;
    execute 'alter table public.briefing drop constraint briefing_modul_check';
    execute format('alter table public.briefing add constraint briefing_modul_check check (modul in (%s))', daftar);
  end if;
end $$;

do $$
declare
  daftar text;
  con_exists boolean;
begin
  select exists (
    select 1 from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'tindak_lanjut' and c.conname = 'tindak_lanjut_fokus_check'
  ) into con_exists;

  if con_exists then
    select string_agg(quote_literal(v), ', ' order by v) into daftar
    from (
      select unnest(array['mutu', 'citra', 'budaya', 'kesejahteraan', 'lead', 'protek']) as v
      union
      select distinct fokus from public.tindak_lanjut where fokus is not null
    ) s;
    execute 'alter table public.tindak_lanjut drop constraint tindak_lanjut_fokus_check';
    execute format('alter table public.tindak_lanjut add constraint tindak_lanjut_fokus_check check (fokus in (%s))', daftar);
  end if;
end $$;

-- ── 6. Sekolah + entitlement ────────────────────────────────────────────────────────────────
-- Entitas demo: Yayasan Pendidikan Fammi, empat jenjang (TK/SD/SMP/SMA) dalam SATU baris
-- schools -- pola sama dengan Sekolah Islam Athirah (satu baris schools/satu login mencakup
-- beberapa unit sekaligus, lihat 20260801140000_school_jenjang.sql).
insert into public.schools (id, nama, jenjang)
values ('YP-FAMMI', 'Yayasan Pendidikan Fammi', 'Semua Jenjang')
on conflict (id) do nothing;

insert into public.school_modules (school_id, modul, aktif)
values ('YP-FAMMI', 'lw', true)
on conflict (school_id, modul) do update set aktif = true;

-- Bersih-bersih: hapus seed lama Dinas Pendidikan Kota Bandung (TKN-PEMBINA-BANDUNG) kalau
-- versi awal berkas ini sempat dijalankan, sekaligus membuat blok seed di bawah idempoten
-- (menjalankan migration ini dua kali tidak menggandakan baris). Baris schools TKN lama
-- dibiarkan kalau ada (tidak mengganggu); akun dinasbandung lama, kalau sempat dibuat,
-- hapus manual lewat Supabase Auth.
delete from public.tindak_lanjut where modul = 'lw' and sekolah_id in ('TKN-PEMBINA-BANDUNG', 'YP-FAMMI');
delete from public.briefing where modul = 'lw' and sekolah_id in ('TKN-PEMBINA-BANDUNG', 'YP-FAMMI');
delete from public.lw_personal where sekolah_id in ('TKN-PEMBINA-BANDUNG', 'YP-FAMMI');
delete from public.lw_lembaga where sekolah_id in ('TKN-PEMBINA-BANDUNG', 'YP-FAMMI');
delete from public.school_modules where school_id = 'TKN-PEMBINA-BANDUNG' and modul = 'lw';

-- ── 7. Data agregat lembaga (periode 2025-07) ───────────────────────────────────────────────
-- Angka agregat konsisten dengan tally 20 baris lw_personal di bagian 8 (n=20, jadi 1 guru=5%).
insert into public.lw_lembaga (
  sekolah_id, periode_id, unit,
  lead_distribusi, lead_aspek, lead_top_skill, lead_skill_gap,
  protek_distribusi, protek_dimensi, protek_temuan_spesifik
) values (
  'YP-FAMMI', '2025-07', null,
  '[
    {"kategori":"Istimewa","persen":15,"jumlah":3},
    {"kategori":"Sangat Baik","persen":70,"jumlah":14},
    {"kategori":"Baik","persen":15,"jumlah":3},
    {"kategori":"Cukup Baik","persen":0,"jumlah":0},
    {"kategori":"Perlu Penguatan","persen":0,"jumlah":0}
  ]'::jsonb,
  '[
    {"kode":"L","nilai":70.1},
    {"kode":"E","nilai":73.0},
    {"kode":"A","nilai":71.9},
    {"kode":"D","nilai":72.9}
  ]'::jsonb,
  '[
    {"indikator":"Empati","nilai":88.4},
    {"indikator":"Berorientasi Pada Siswa & Orangtua","nilai":86.2},
    {"indikator":"Kolaboratif (Internal)","nilai":84.5},
    {"indikator":"Teladan & Integritas","nilai":83.9},
    {"indikator":"Adaptif","nilai":82.7}
  ]'::jsonb,
  '[
    {"indikator":"Kepemimpinan Digital","nilai":58.3},
    {"indikator":"Problem Solving","nilai":62.1},
    {"indikator":"Komersial & Pendanaan Sekolah","nilai":64.5}
  ]'::jsonb,
  '[
    {"kategori":"Baik","persen":100,"jumlah":20},
    {"kategori":"Perlu Perhatian","persen":0,"jumlah":0},
    {"kategori":"Waspada","persen":0,"jumlah":0},
    {"kategori":"Perlu Konsultasi","persen":0,"jumlah":0}
  ]'::jsonb,
  '[
    {"kode":"P","baik_persen":85,"baik_jumlah":17,"perlu_perhatian_persen":15,"perlu_perhatian_jumlah":3,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"R","baik_persen":100,"baik_jumlah":20,"perlu_perhatian_persen":0,"perlu_perhatian_jumlah":0,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"O","baik_persen":95,"baik_jumlah":19,"perlu_perhatian_persen":5,"perlu_perhatian_jumlah":1,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"T","baik_persen":90,"baik_jumlah":18,"perlu_perhatian_persen":10,"perlu_perhatian_jumlah":2,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"E","baik_persen":85,"baik_jumlah":17,"perlu_perhatian_persen":15,"perlu_perhatian_jumlah":3,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"K","baik_persen":80,"baik_jumlah":16,"perlu_perhatian_persen":15,"perlu_perhatian_jumlah":3,"waspada_persen":5,"waspada_jumlah":1}
  ]'::jsonb,
  '[
    {"dimensi":"Penerimaan Diri","pernyataan":"Merasa kurang puas dengan pencapaian diri selama menjadi pendidik.","persen":15,"jumlah":3},
    {"dimensi":"Penerimaan Diri","pernyataan":"Tidak nyaman saat membandingkan diri dengan rekan sejawat.","persen":10,"jumlah":2},
    {"dimensi":"Tujuan Hidup","pernyataan":"Merasa rutinitas mengajar berjalan tanpa arah pengembangan yang jelas.","persen":10,"jumlah":2},
    {"dimensi":"Eksplorasi Lingkungan","pernyataan":"Sering merasa terbebani tanggung jawab administrasi di luar mengajar.","persen":15,"jumlah":3},
    {"dimensi":"Kemandirian","pernyataan":"Keputusan sering menunggu arahan pimpinan sebelum berani diambil.","persen":20,"jumlah":4},
    {"dimensi":"Kemandirian","pernyataan":"Khawatir terhadap penilaian rekan kerja saat menyampaikan pendapat berbeda.","persen":10,"jumlah":2}
  ]'::jsonb
);

-- ── 8. Data per guru (20 guru: 5 per jenjang, periode 2025-07) ──────────────────────────────
insert into public.lw_personal (
  sekolah_id, periode_id, unit, nama, is_kepsek_saat_ini,
  kesiapan_memimpin_skor, kesiapan_memimpin_kategori,
  kondisi_psikologis_skor, kondisi_psikologis_kategori, kondisi_psikologis_label,
  lead_aspek, protek_dimensi, narasi_pengalaman, cerita_terbaik
) values
-- TK Fammi (unit paling sehat: seluruh dimensi Baik)
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Rina Kartika, S.Pd', true,
  84, 'Istimewa', 228, 'Baik', 'Aman',
  '[{"kode":"L","nilai":82},{"kode":"E","nilai":85},{"kode":"A","nilai":84},{"kode":"D","nilai":85}]'::jsonb,
  '[{"kode":"P","nilai":38,"kategori":"Baik"},{"kode":"R","nilai":40,"kategori":"Baik"},{"kode":"O","nilai":39,"kategori":"Baik"},{"kode":"T","nilai":37,"kategori":"Baik"},{"kode":"E","nilai":38,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Perubahan kurikulum di unit TK dijalankan bertahap: sosialisasi ke guru dulu, lalu pendampingan mingguan, supaya tidak ada yang merasa ditinggal."},
    {"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Forum orang tua bulanan dan kegiatan market day membuat orang tua terlibat langsung dalam pembelajaran anak."}
  ]'::jsonb,
  '[{"judul":"Membangun Kebiasaan Positif Sejak TK","isi":"Program penyambutan pagi oleh guru bergilir membuat suasana sekolah hangat dan orang tua makin percaya.","bullet_poin":[]}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Lina Marlina, S.Pd.AUD', false,
  76, 'Sangat Baik', 211, 'Baik', 'Aman',
  '[{"kode":"L","nilai":74},{"kode":"E","nilai":78},{"kode":"A","nilai":75},{"kode":"D","nilai":77}]'::jsonb,
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Inovasi yang Membawa Dampak Nyata","isi":"Membuat media belajar dari barang bekas bersama anak-anak, sekaligus mengenalkan konsep daur ulang sejak dini."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Dewi Lestari, S.Pd', false,
  71, 'Sangat Baik', 204, 'Baik', 'Aman',
  '[{"kode":"L","nilai":70},{"kode":"E","nilai":72},{"kode":"A","nilai":71},{"kode":"D","nilai":71}]'::jsonb,
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Pengalaman Mengelola Tim","isi":"Berbagi tugas dengan rekan sejawat saat kegiatan besar sekolah supaya beban tidak menumpuk di satu orang."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Yuni Astuti, S.Pd.AUD', false,
  68, 'Sangat Baik', 199, 'Baik', 'Aman',
  '[{"kode":"L","nilai":66},{"kode":"E","nilai":69},{"kode":"A","nilai":68},{"kode":"D","nilai":69}]'::jsonb,
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Melibatkan orang tua sebagai narasumber kelas sesuai profesi masing-masing."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'TK Fammi', 'Ratna Sari, S.Pd', false,
  63, 'Sangat Baik', 196, 'Baik', 'Aman',
  '[{"kode":"L","nilai":61},{"kode":"E","nilai":64},{"kode":"A","nilai":63},{"kode":"D","nilai":64}]'::jsonb,
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Inovasi yang Membawa Dampak Nyata","isi":"Mengubah sudut baca kelas menjadi area bermain literasi yang membuat anak lebih betah membaca."}]'::jsonb,
  '[]'::jsonb
),
-- SD Fammi (2 guru dengan dimensi perlu perhatian)
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Ahmad Fauzi, M.Pd', true,
  86, 'Istimewa', 234, 'Baik', 'Aman',
  '[{"kode":"L","nilai":85},{"kode":"E","nilai":87},{"kode":"A","nilai":86},{"kode":"D","nilai":86}]'::jsonb,
  '[{"kode":"P","nilai":39,"kategori":"Baik"},{"kode":"R","nilai":41,"kategori":"Baik"},{"kode":"O","nilai":40,"kategori":"Baik"},{"kode":"T","nilai":38,"kategori":"Baik"},{"kode":"E","nilai":39,"kategori":"Baik"},{"kode":"K","nilai":37,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Transisi ke Kurikulum Merdeka dikawal lewat komunitas belajar internal; guru saling berbagi praktik tiap Jumat."},
    {"tema":"Efisiensi Tanpa Mengorbankan Mutu","isi":"RKAS disusun terbuka bersama guru dan komite supaya prioritas anggaran dipahami semua pihak."}
  ]'::jsonb,
  '[{"judul":"Komunitas Belajar Guru SD","isi":"Komunitas belajar internal tiap Jumat membuat praktik baik cepat menular antarguru tanpa menunggu pelatihan eksternal.","bullet_poin":[]}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Dewi Anggraini, S.Pd', false,
  66, 'Sangat Baik', 184, 'Baik', 'Aman',
  '[{"kode":"L","nilai":64},{"kode":"E","nilai":67},{"kode":"A","nilai":66},{"kode":"D","nilai":67}]'::jsonb,
  '[{"kode":"P","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":26,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":32,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Pengalaman Mengelola Kelas","isi":"Menangani kelas besar dengan rotasi kelompok belajar supaya tiap anak tetap mendapat perhatian."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Budi Santoso, S.Pd', false,
  58, 'Baik', 193, 'Baik', 'Aman',
  '[{"kode":"L","nilai":56},{"kode":"E","nilai":59},{"kode":"A","nilai":58},{"kode":"D","nilai":59}]'::jsonb,
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":26,"kategori":"Perlu Perhatian"}]'::jsonb,
  '[{"tema":"Inovasi yang Membawa Dampak Nyata","isi":"Membuat bank soal digital sederhana yang bisa dipakai bergantian oleh semua guru kelas atas."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Rahmat Hidayat, S.Pd', false,
  74, 'Sangat Baik', 210, 'Baik', 'Aman',
  '[{"kode":"L","nilai":72},{"kode":"E","nilai":75},{"kode":"A","nilai":74},{"kode":"D","nilai":75}]'::jsonb,
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Program sarapan literasi tiap pagi melibatkan orang tua sebagai pembaca tamu."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SD Fammi', 'Siti Nurhaliza, S.Pd', false,
  79, 'Sangat Baik', 217, 'Baik', 'Aman',
  '[{"kode":"L","nilai":77},{"kode":"E","nilai":80},{"kode":"A","nilai":79},{"kode":"D","nilai":80}]'::jsonb,
  '[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Pengalaman Mengelola Tim","isi":"Menjadi koordinator lomba antarkelas dan membagi peran panitia ke guru muda supaya regenerasi berjalan."}]'::jsonb,
  '[{"judul":"Regenerasi Panitia Kegiatan","isi":"Membagi peran panitia ke guru muda membuat kegiatan sekolah tidak lagi bergantung pada orang yang sama.","bullet_poin":[]}]'::jsonb
),
-- SMP Fammi (unit paling tertekan: 3 guru dengan dimensi non-Baik)
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Hendra Gunawan, M.Pd', true,
  82, 'Istimewa', 226, 'Baik', 'Aman',
  '[{"kode":"L","nilai":80},{"kode":"E","nilai":83},{"kode":"A","nilai":82},{"kode":"D","nilai":83}]'::jsonb,
  '[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":40,"kategori":"Baik"},{"kode":"O","nilai":38,"kategori":"Baik"},{"kode":"T","nilai":37,"kategori":"Baik"},{"kode":"E","nilai":38,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Digitalisasi administrasi dimulai dari hal kecil: presensi dan jurnal kelas daring, sebelum masuk ke rapor digital."},
    {"tema":"Keputusan Sulit demi Integritas","isi":"Menegakkan aturan disiplin yang sama untuk semua siswa tanpa pandang latar belakang, dengan komunikasi baik ke orang tuanya."}
  ]'::jsonb,
  '[{"judul":"Digitalisasi Bertahap di SMP","isi":"Dimulai dari presensi daring, kini seluruh jurnal kelas terdokumentasi rapi dan bisa dipantau bersama.","bullet_poin":[]}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Sari Wulandari, S.Pd', false,
  55, 'Baik', 162, 'Baik', 'Aman',
  '[{"kode":"L","nilai":53},{"kode":"E","nilai":56},{"kode":"A","nilai":55},{"kode":"D","nilai":56}]'::jsonb,
  '[{"kode":"P","nilai":26,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"T","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":26,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":22,"kategori":"Waspada"}]'::jsonb,
  '[{"tema":"Pengalaman Mengelola Kelas","isi":"Mengajar sambil merangkap tugas administrasi kurikulum; sedang belajar memilah mana yang bisa didelegasikan."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Andi Prasetyo, S.Pd', false,
  60, 'Baik', 187, 'Baik', 'Aman',
  '[{"kode":"L","nilai":58},{"kode":"E","nilai":61},{"kode":"A","nilai":60},{"kode":"D","nilai":61}]'::jsonb,
  '[{"kode":"P","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":28,"kategori":"Perlu Perhatian"}]'::jsonb,
  '[{"tema":"Inovasi yang Membawa Dampak Nyata","isi":"Memakai proyek sederhana berbasis lingkungan sekolah supaya siswa belajar IPA dari hal nyata."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Citra Ayu, S.Pd', false,
  72, 'Sangat Baik', 199, 'Baik', 'Aman',
  '[{"kode":"L","nilai":70},{"kode":"E","nilai":73},{"kode":"A","nilai":72},{"kode":"D","nilai":73}]'::jsonb,
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Membuat grup diskusi orang tua per angkatan untuk menyalurkan aspirasi sebelum jadi keluhan."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMP Fammi', 'Maya Puspita, M.Pd', false,
  77, 'Sangat Baik', 215, 'Baik', 'Aman',
  '[{"kode":"L","nilai":75},{"kode":"E","nilai":78},{"kode":"A","nilai":77},{"kode":"D","nilai":78}]'::jsonb,
  '[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Pengalaman Mengelola Tim","isi":"Memimpin tim penyusun modul ajar lintas mapel dan menjaga tenggat lewat papan kerja bersama."}]'::jsonb,
  '[]'::jsonb
),
-- SMA Fammi (1 guru dengan dimensi perlu perhatian)
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Bambang Wijaya, M.Pd', true,
  80, 'Sangat Baik', 222, 'Baik', 'Aman',
  '[{"kode":"L","nilai":78},{"kode":"E","nilai":81},{"kode":"A","nilai":80},{"kode":"D","nilai":81}]'::jsonb,
  '[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":38,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Menyiapkan guru menghadapi kelas berbasis pilihan mapel lewat pemetaan kompetensi dan pelatihan bergilir."},
    {"tema":"Kemitraan Strategis Sekolah","isi":"Menjalin kerja sama magang dengan dunia usaha lokal untuk memperluas ruang belajar siswa."}
  ]'::jsonb,
  '[{"judul":"Kemitraan Magang SMA","isi":"Kerja sama dengan dunia usaha lokal membuka ruang belajar nyata bagi siswa dan memperkuat citra sekolah.","bullet_poin":[]}]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Fajar Ramadhan, S.Pd', false,
  65, 'Sangat Baik', 189, 'Baik', 'Aman',
  '[{"kode":"L","nilai":63},{"kode":"E","nilai":66},{"kode":"A","nilai":65},{"kode":"D","nilai":66}]'::jsonb,
  '[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":27,"kategori":"Perlu Perhatian"}]'::jsonb,
  '[{"tema":"Pengalaman Mengelola Kelas","isi":"Menyeimbangkan tugas wali kelas dan pembina ekskul; sedang menata ulang prioritas supaya keduanya tidak saling mengorbankan."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Indah Permatasari, S.Pd', false,
  78, 'Sangat Baik', 216, 'Baik', 'Aman',
  '[{"kode":"L","nilai":76},{"kode":"E","nilai":79},{"kode":"A","nilai":78},{"kode":"D","nilai":79}]'::jsonb,
  '[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Inovasi yang Membawa Dampak Nyata","isi":"Kelas menulis opini yang hasilnya dimuat di media sekolah menumbuhkan kepercayaan diri siswa."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Agus Setiawan, M.Pd', false,
  75, 'Sangat Baik', 211, 'Baik', 'Aman',
  '[{"kode":"L","nilai":73},{"kode":"E","nilai":76},{"kode":"A","nilai":75},{"kode":"D","nilai":76}]'::jsonb,
  '[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Pengalaman Mengelola Tim","isi":"Menjadi mentor guru baru lewat observasi kelas dua arah, saling memberi umpan balik."}]'::jsonb,
  '[]'::jsonb
),
(
  'YP-FAMMI', '2025-07', 'SMA Fammi', 'Nur Aini, S.Pd', false,
  70, 'Sangat Baik', 206, 'Baik', 'Aman',
  '[{"kode":"L","nilai":68},{"kode":"E","nilai":71},{"kode":"A","nilai":70},{"kode":"D","nilai":71}]'::jsonb,
  '[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb,
  '[{"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Konsultasi rutin perencanaan studi lanjut bersama siswa dan orang tua kelas XII."}]'::jsonb,
  '[]'::jsonb
);

-- ── 9. Rekomendasi tindak lanjut prioritas (3 program) ──────────────────────────────────────
insert into public.tindak_lanjut (
  sekolah_id, periode_id, modul, fokus, scope, scope_id, target_role, status, type,
  dimensi, title, teaser, mengapa_data, manfaat, hal_diwaspadai
) values
(
  'YP-FAMMI', '2025-07', 'lw', 'lead', 'sekolah', 'YP-FAMMI', 'yayasan', 'disetujui', 'perlu_perhatian',
  'Kepemimpinan Digital', 'Pelatihan Kepemimpinan Digital untuk Guru & Kepala Sekolah',
  'Pemanfaatan platform digital (Google Workspace, aplikasi penilaian, media sosial sekolah) untuk manajemen dan pembelajaran.',
  'Menjawab gap terbesar organisasi: indikator Kepemimpinan Digital rata-rata 58,30 dari 100, skor terendah di antara seluruh indikator LEAD.',
  '{"learning_outcome":"Guru dan kepala sekolah mampu memakai platform digital untuk komunikasi, administrasi, dan promosi sekolah."}'::jsonb,
  null
),
(
  'YP-FAMMI', '2025-07', 'lw', 'lead', 'sekolah', 'YP-FAMMI', 'yayasan', 'disetujui', 'perlu_perhatian',
  'Problem Solving', 'Pelatihan Creative Problem Solving untuk Tim Pengajar',
  'Teknik berpikir analitis dan kreatif, root cause analysis, dan studi kasus keseharian di tiap jenjang.',
  'Menjawab gap indikator Problem Solving, rata-rata organisasi 62,10 dari 100.',
  '{"learning_outcome":"Peserta mampu mengidentifikasi akar masalah dan memilih solusi praktis yang bisa langsung diterapkan."}'::jsonb,
  null
),
(
  'YP-FAMMI', '2025-07', 'lw', 'protek', 'sekolah', 'YP-FAMMI', 'yayasan', 'disetujui', 'perlu_perhatian',
  'Kemandirian', 'Program Pendampingan Kemandirian & Kepercayaan Diri Guru',
  'Sesi coaching berkala untuk melatih pengambilan keputusan mandiri dan keberanian menyuarakan pendapat.',
  'Menjawab temuan wellbeing: 4 dari 20 guru berkategori non-Baik pada dimensi Kemandirian, terbanyak di antara enam dimensi PROTEK.',
  '{"learning_outcome":"Guru terdampak menunjukkan peningkatan kategori Kemandirian pada asesmen periode berikutnya."}'::jsonb,
  null
);

-- ── 10. Briefing (ringkasan eksekutif, fokus wellbeing) ─────────────────────────────────────
-- Rilis pertama modul ini hanya menampilkan laporan Kesehatan Mental (keputusan pemilik produk
-- 2026-08-25), jadi briefing tidak menyebut bagian kesiapan memimpin/pengembangan yang
-- disembunyikan. Sinkron dengan lw.mock.js.
insert into public.briefing (sekolah_id, periode_id, modul, scope, scope_id, status, teks)
values (
  'YP-FAMMI', '2025-07', 'lw', 'sekolah', 'YP-FAMMI', 'disetujui',
  'Kondisi kesehatan mental 20 guru di empat jenjang Yayasan Pendidikan Fammi (TK, SD, SMP, SMA) secara keseluruhan berkategori Baik. Meski begitu, tiga dimensi menunjukkan guru yang perlu perhatian: Kemandirian (3 guru Perlu Perhatian dan 1 guru Waspada), Penerimaan Diri (3 guru), serta Eksplorasi Lingkungan (3 guru). Tekanan paling terkonsentrasi di unit SMP, sementara unit TK dalam kondisi paling sehat. Daftar nama tiap dimensi tersedia di bawah untuk ditindaklanjuti pimpinan.'
);

-- ── 11. Akun demo Yayasan (dipakai presentasi ke Yayasan) ───────────────────────────────────
-- Login: username "ypfammi", kode "ypfammi". Peran Yayasan, school_id YP-FAMMI -- begitu login
-- langsung mendarat di tab Leadership & Wellbeing karena itu satu-satunya modul aktif sekolah
-- ini (lihat defaultModuleForPeran di App.jsx). Ganti kodenya lewat Supabase Auth setelah
-- presentasi kalau akun ini mau dipakai jangka panjang. Pola provisioning sama seperti akun
-- uji Yayasan sebelumnya: auth.users + auth.identities + profiles, dijalankan lewat Supabase
-- SQL Editor. Idempoten: aman dijalankan ulang.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
)
select
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'ypfammi@fammi.internal', crypt('ypfammi', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
where not exists (select 1 from auth.users where email = 'ypfammi@fammi.internal');

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', u.id::text, now(), now(), now()
from auth.users u
where u.email = 'ypfammi@fammi.internal'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

insert into public.profiles (id, username, nama, peran, school_id)
select u.id, 'ypfammi', 'Yayasan Pendidikan Fammi', 'Yayasan', 'YP-FAMMI'
from auth.users u
where u.email = 'ypfammi@fammi.internal'
  and not exists (select 1 from public.profiles p where p.id = u.id);
