-- Modul baru: Leadership & Wellbeing Assessment (lw). Dua tabel bespoke (lw_lembaga/lw_personal)
-- plus pemakaian tabel generik tindak_lanjut/briefing yang sudah ada, mengikuti pola SC/PA.
--
-- BEDA PENTING dari migration SC/PA sebelumnya: modul ini TIDAK punya RPC impor massal
-- (import_lw_periode) karena datanya bukan pipeline CMS berulang -- ini SATU laporan final,
-- satu lembaga, satu periode (Juli 2025), dari Dinas Pendidikan Kota Bandung, langsung
-- diimplementasikan sebagai data produksi atas instruksi eksplisit pemilik produk. Kalau nanti
-- ada laporan lain (sekolah/periode berbeda), migration baru dengan pola serupa cukup, atau RPC
-- impor bisa ditambah kalau frekuensinya sudah butuh CMS.
--
-- CATATAN SENSITIVITAS: seluruh data guru di bawah (nama, skor kesehatan mental, skor
-- kepemimpinan) berasal dari dokumen berklasifikasi "RAHASIA -- Hanya untuk Pimpinan dan Yang
-- Berwenang". RLS di bawah membatasi baca ke peran pimpinan sekolah ini saja (KepalaSekolah/
-- WakilKepalaSekolah/Manajemen/Yayasan) + Admin Fammi, sama seperti pola SC/PA.

-- ── 1. Tabel agregat lembaga ────────────────────────────────────────────────────────────────
-- Satu baris per (sekolah, periode). Modul ini belum punya kebutuhan breakdown per unit di
-- level agregat (4 unit TKN yang ada semuanya digabung jadi satu gambaran lembaga, sesuai
-- dokumen sumber) -- kolom `unit` tetap disediakan (selalu null untuk saat ini) supaya skema
-- konsisten dengan sc_lembaga/pa_lembaga kalau nanti dibutuhkan breakdown per unit.
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
  kondisi_psikologis_kategori text not null,   -- skala 4-tingkat (Baik/Perlu Perhatian/Waspada/Perlu Konsultasi), dari Laporan Analisis Kesehatan Mental Guru
  kondisi_psikologis_label text,               -- label tri-state dokumen Leadership (mis. "Aman"), disimpan terpisah -- BUKAN dihitung ulang dari kategori di atas
  lead_aspek jsonb,       -- [{kode, nilai}] x4 (L/E/A/D)
  protek_dimensi jsonb,   -- [{kode, nilai, kategori}] x6 (P/R/O/T/E/K)
  narasi_pengalaman jsonb,  -- [{tema, isi}] jawaban skenario kepemimpinan
  cerita_terbaik jsonb,     -- [{judul, isi, bullet_poin}] kutipan lampiran "Cerita Pengalaman Terbaik", [] kalau tidak ada
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
-- Entitas baru: klaster TK Negeri Pembina Kota Bandung, empat unit (TKN Pembina Citarip/
-- Sadang Serang/Centeh/04 Batununggal) dalam SATU baris schools -- pola sama dengan Sekolah
-- Islam Athirah (satu baris schools/satu login mencakup beberapa unit sekaligus, lihat
-- 20260801140000_school_jenjang.sql).
insert into public.schools (id, nama, jenjang)
values ('TKN-PEMBINA-BANDUNG', 'TK Negeri Pembina Kota Bandung', 'TK')
on conflict (id) do nothing;

insert into public.school_modules (school_id, modul, aktif)
values ('TKN-PEMBINA-BANDUNG', 'lw', true)
on conflict (school_id, modul) do update set aktif = true;

-- ── 7. Data agregat lembaga (periode 2025-07) ───────────────────────────────────────────────
-- Seluruh angka di bawah dikutip/dirata-ratakan langsung dari "Hasil Pemetaan Asesmen Wellbeing
-- & Leadership" dan "Laporan Analisis Kesehatan Mental Guru" (Dinas Pendidikan Kota Bandung,
-- Juli 2025). lead_aspek dan protek_dimensi (nilai rata-rata) dihitung sebagai rata-rata
-- sederhana dari 8 skor kandidat yang SUDAH FINAL di lw_personal (bagian 8) -- bukan skor baru,
-- murni rata-rata angka yang sudah ada, konsisten dengan cara sc_lembaga/pa_lembaga dirakit.
insert into public.lw_lembaga (
  sekolah_id, periode_id, unit,
  lead_distribusi, lead_aspek, lead_top_skill, lead_skill_gap,
  protek_distribusi, protek_dimensi, protek_temuan_spesifik
) values (
  'TKN-PEMBINA-BANDUNG', '2025-07', null,
  '[
    {"kategori":"Istimewa","persen":50,"jumlah":4},
    {"kategori":"Sangat Baik","persen":50,"jumlah":4},
    {"kategori":"Baik","persen":0,"jumlah":0},
    {"kategori":"Cukup Baik","persen":0,"jumlah":0},
    {"kategori":"Perlu Penguatan","persen":0,"jumlah":0}
  ]'::jsonb,
  '[
    {"kode":"L","nilai":76.9},
    {"kode":"E","nilai":78.3},
    {"kode":"A","nilai":84.0},
    {"kode":"D","nilai":80.5}
  ]'::jsonb,
  '[
    {"indikator":"Berorientasi pada Siswa dan Orangtua","nilai":92.6},
    {"indikator":"Manajemen Keuangan","nilai":92.6},
    {"indikator":"Empati","nilai":90.0},
    {"indikator":"Adaptif","nilai":87.6},
    {"indikator":"Kolaboratif (Internal)","nilai":87.6}
  ]'::jsonb,
  '[
    {"indikator":"Problem Solving","nilai":47.6},
    {"indikator":"Inovatif","nilai":75.0},
    {"indikator":"Kepemimpinan Digital","nilai":77.6}
  ]'::jsonb,
  '[
    {"kategori":"Baik","persen":100,"jumlah":8},
    {"kategori":"Perlu Perhatian","persen":0,"jumlah":0},
    {"kategori":"Waspada","persen":0,"jumlah":0},
    {"kategori":"Perlu Konsultasi","persen":0,"jumlah":0}
  ]'::jsonb,
  '[
    {"kode":"P","baik_persen":75,"baik_jumlah":6,"perlu_perhatian_persen":25,"perlu_perhatian_jumlah":2,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"R","baik_persen":100,"baik_jumlah":8,"perlu_perhatian_persen":0,"perlu_perhatian_jumlah":0,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"O","baik_persen":100,"baik_jumlah":8,"perlu_perhatian_persen":0,"perlu_perhatian_jumlah":0,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"T","baik_persen":100,"baik_jumlah":8,"perlu_perhatian_persen":0,"perlu_perhatian_jumlah":0,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"E","baik_persen":87,"baik_jumlah":7,"perlu_perhatian_persen":13,"perlu_perhatian_jumlah":1,"waspada_persen":0,"waspada_jumlah":0},
    {"kode":"K","baik_persen":75,"baik_jumlah":6,"perlu_perhatian_persen":25,"perlu_perhatian_jumlah":2,"waspada_persen":0,"waspada_jumlah":0}
  ]'::jsonb,
  '[
    {"dimensi":"Penerimaan Diri","pernyataan":"Sikap terhadap diri sendiri cenderung lebih negatif dari kebanyakan orang.","persen":25,"jumlah":2},
    {"dimensi":"Penerimaan Diri","pernyataan":"Tidak menyukai sebagian besar kepribadian diri sendiri.","persen":13,"jumlah":1},
    {"dimensi":"Penerimaan Diri","pernyataan":"Tidak nyaman dengan diri sendiri saat dibandingkan dengan orang lain.","persen":13,"jumlah":1},
    {"dimensi":"Tujuan Hidup","pernyataan":"Sering merasa tidak ada lagi yang perlu dilakukan dalam hidup.","persen":63,"jumlah":5},
    {"dimensi":"Eksplorasi Lingkungan","pernyataan":"Kesulitan mengatur hidup agar memuaskan diri sendiri.","persen":13,"jumlah":1},
    {"dimensi":"Eksplorasi Lingkungan","pernyataan":"Sering merasa terbebani oleh tanggung jawab yang dimiliki.","persen":13,"jumlah":1},
    {"dimensi":"Kemandirian","pernyataan":"Keputusan sering kali dipengaruhi oleh tindakan orang lain.","persen":25,"jumlah":2},
    {"dimensi":"Kemandirian","pernyataan":"Sering terpengaruh oleh orang-orang yang memiliki pendapat kuat.","persen":13,"jumlah":1},
    {"dimensi":"Kemandirian","pernyataan":"Menilai diri sendiri berdasarkan standar orang lain, bukan nilai pribadi.","persen":13,"jumlah":1}
  ]'::jsonb
);

-- ── 8. Data per kandidat (8 kandidat, periode 2025-07) ──────────────────────────────────────
insert into public.lw_personal (
  sekolah_id, periode_id, unit, nama, is_kepsek_saat_ini,
  kesiapan_memimpin_skor, kesiapan_memimpin_kategori,
  kondisi_psikologis_skor, kondisi_psikologis_kategori, kondisi_psikologis_label,
  lead_aspek, protek_dimensi, narasi_pengalaman, cerita_terbaik
) values
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'TKN Pembina Citarip', 'Nenden Teja', false,
  90, 'Istimewa', 247, 'Baik', 'Aman',
  '[{"kode":"L","nilai":88},{"kode":"E","nilai":92},{"kode":"A","nilai":93},{"kode":"D","nilai":88}]'::jsonb,
  '[{"kode":"P","nilai":42,"kategori":"Baik"},{"kode":"R","nilai":42,"kategori":"Baik"},{"kode":"O","nilai":41,"kategori":"Baik"},{"kode":"T","nilai":42,"kategori":"Baik"},{"kode":"E","nilai":41,"kategori":"Baik"},{"kode":"K","nilai":39,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Selalu melibatkan anak dan orang tua dalam membuat kebijakan dan terbuka dalam menerima saran dan kritikan, serta senantiasa memotivasi orang tua untuk mau belajar dan berubah demi kepentingan perkembangan anak."},
    {"tema":"Kemitraan Strategis Sekolah","isi":"Mengundang dan meminta mitra dari berbagai unsur untuk duduk bersama dan membuat MoU kerja sama untuk mendukung dan mewujudkan pendidikan yang baik dan memfasilitasi anak untuk tumbuh kembang dengan optimal."},
    {"tema":"Pengalaman Mengelola Tim","isi":"Membuat RKAS sesuai kebutuhan dan menentukan skala prioritas untuk menentukan anggaran yang akan terserap, serta membuat jaringan partisipasi masyarakat agar ikut membantu dalam pemenuhan kebutuhan sekolah."},
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Mengorganisir tim, mempelajari dan memahami akar permasalahan, membuka ruang diskusi untuk menemukan masalah dan menyelesaikan masalah berdasarkan argumen dan hipotesis di lapangan, lalu menentukan solusi."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'TKN Pembina Sadang Serang', 'Ani Yuliani', false,
  84, 'Istimewa', 188, 'Baik', 'Aman',
  '[{"kode":"L","nilai":74},{"kode":"E","nilai":82},{"kode":"A","nilai":92},{"kode":"D","nilai":89}]'::jsonb,
  '[{"kode":"P","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":30,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Pengalaman Mengelola Tim","isi":"Dapat dilakukan beberapa upaya seperti pelatihan dan pengembangan yang berkelanjutan, pemberian tugas sesuai keahlian, menciptakan lingkungan kerja yang positif, memberikan kesempatan untuk brainstorming, dan menerapkan sistem reward dan punishment yang adil."},
    {"tema":"Menyelesaikan Masalah yang Pelik","isi":"Ketika ada permasalahan, kami diskusikan dulu dengan tim, keputusan diambil berdasarkan kesepakatan dan relevan."},
    {"tema":"Inovasi yang Membawa Dampak Nyata","isi":"Membuat ide-ide dalam pembelajaran seperti media pembelajaran, biasanya juga berkolaborasi dengan guru/teman sejawat lainnya."},
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Ketika dihadapkan pada perubahan, biasanya membutuhkan kombinasi strategi seperti komunikasi yang jelas dengan tim, pembentukan budaya positif, pendelegasian tugas yang tepat, serta pengembangan anggota tim, karena pemimpin yang baik harus mampu memotivasi dan menangani konflik secara efektif."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'TKN Centeh', 'Dewi Rosmawati, S.Pd.AUD', true,
  83, 'Istimewa', 204, 'Baik', 'Aman',
  '[{"kode":"L","nilai":85},{"kode":"E","nilai":81},{"kode":"A","nilai":81},{"kode":"D","nilai":84}]'::jsonb,
  '[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Melakukan perencanaan yang sesuai dengan perubahan di sekolah, dilakukan bersama-sama dengan seluruh PTK, berkomunikasi yang baik, berkolaborasi memberikan kesempatan kepada seluruh PTK untuk menyampaikan pendapatnya, lalu membuat keputusan dari hasil kesepakatan."},
    {"tema":"Efisiensi Tanpa Mengorbankan Mutu","isi":"Melakukan identifikasi kebutuhan sekolah, membuat Rencana Anggaran Sekolah, dan melakukan penganggaran/pembelian sesuai rencana bersama guru, TU, dan operator."},
    {"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Mensosialisasikan program sekolah dan melibatkan orang tua dalam penutupan MPLS, peringatan HUT RI, dan kegiatan lain -- orang tua merasa dihargai dan pembentukan karakter anak dapat berlanjut di rumah."}
  ]'::jsonb,
  '[
    {"judul":"Menciptakan Solusi Inovatif di Sekolah","isi":"Ketika pertama masuk sekolah baru, ditemukan pengaturan penganggaran yang belum tersusun transparan, sehingga dilakukan perubahan membuat laporan keuangan lebih transparan dengan strategi yang sudah terbukti di sekolah sebelumnya.","bullet_poin":[]},
    {"judul":"Menghadapi Perubahan Besar di Sekolah","isi":"Perencanaan perubahan dilakukan bersama seluruh PTK lewat komunikasi dan kolaborasi terbuka, keputusan diambil dari hasil kesepakatan, dengan pendekatan percakapan coaching yang terbukti berhasil.","bullet_poin":[]}
  ]'::jsonb
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'TKN 04 Batununggal', 'Nenden Susilowati, M.Pd', true,
  83, 'Istimewa', 237, 'Baik', 'Aman',
  '[{"kode":"L","nilai":89},{"kode":"E","nilai":76},{"kode":"A","nilai":87},{"kode":"D","nilai":81}]'::jsonb,
  '[{"kode":"P","nilai":41,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":42,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":40,"kategori":"Baik"},{"kode":"K","nilai":38,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Selalu melakukan komunikasi dengan seluruh warga sekolah, dimulai dari alasan dan tujuan perubahan, membentuk tim perubahan bersama guru dan pendukung lainnya, dilakukan secara bertahap agar guru lebih memahami, serta terus memonitor dan merefleksikan perubahan yang terjadi."},
    {"tema":"Keputusan Sulit demi Integritas","isi":"Keputusan sulit diambil ketika orang tua protes anaknya tidak dilibatkan dalam satu kegiatan prasiaga -- diberikan pengertian bahwa pelibatan dilakukan pembina dari luar, dan pihak sekolah tetap terbuka menerima kembali jika ingin bersekolah."},
    {"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Sekolah melibatkan siswa dan orang tua lewat forum komunikasi via WhatsApp dan parenting, kolaborasi kegiatan orang tua-anak seperti market day dan gebyar prasiaga, serta pelibatan orang tua sebagai guru inspiratif di kelas."}
  ]'::jsonb,
  '[
    {"judul":"Memimpin Tim Menghadapi Perubahan Besar","isi":"Dalam menghadapi perubahan besar di sekolah, kami selalu melakukan komunikasi dengan seluruh warga sekolah, dimulai dengan alasan dan tujuan perubahan itu sendiri, lalu membentuk tim perubahan bersama guru dan pendukung lainnya.","bullet_poin":["Melakukan komunikasi dengan seluruh warga sekolah","Membentuk tim perubahan bersama guru dan pendukung lainnya","Memfasilitasi/mengikuti informasi dan pelatihan terkait perubahan","Memonitor dan mengevaluasi perubahan yang terjadi","Berkolaborasi agar perubahan sesuai yang diharapkan"]},
    {"judul":"Melibatkan Siswa dan Orang Tua dalam Program Sekolah","isi":"Sekolah melibatkan siswa dan orang tua lewat forum komunikasi via WhatsApp dan parenting, kolaborasi kegiatan orang tua-anak seperti market day dan gebyar prasiaga, serta pelibatan orang tua sebagai guru inspiratif di kelas.","bullet_poin":[]}
  ]'::jsonb
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'TKN 04 Batununggal', 'Siti Sutini, S.Pd. AUD, M.Pd', false,
  80, 'Sangat Baik', 223, 'Baik', 'Aman',
  '[{"kode":"L","nilai":71},{"kode":"E","nilai":71},{"kode":"A","nilai":91},{"kode":"D","nilai":87}]'::jsonb,
  '[{"kode":"P","nilai":39,"kategori":"Baik"},{"kode":"R","nilai":42,"kategori":"Baik"},{"kode":"O","nilai":39,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Inovasi yang Membawa Dampak Nyata","isi":"Halaman samping sekolah yang tidak tertata diubah menjadi taman yang indah dan rapi atas ide yang disampaikan kepada Kepala Sekolah dan disetujui."},
    {"tema":"Efisiensi Tanpa Mengorbankan Mutu","isi":"Membuat rencana anggaran sekolah berupa pendapatan dan pengeluaran, dengan prioritas pengeluaran dibagi ke beberapa unsur seperti kurikulum, APE, dan pemeliharaan sarana prasarana."},
    {"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Salah satu kegiatan P5 di bulan Ramadan yaitu berbagi sembako kepada anak yatim dan duafa, melibatkan siswa dan orang tua, menanamkan nilai moral agama."},
    {"tema":"Keputusan Sulit demi Integritas","isi":"Keputusan sulit diambil saat mengingatkan guru yang sering datang terlambat, karena kedisiplinan guru berdampak terhadap siswa dan sekolah."}
  ]'::jsonb,
  '[
    {"judul":"Menciptakan Solusi Inovatif di Sekolah","isi":"Halaman samping sekolah yang tidak tertata diubah menjadi taman yang indah dan rapi atas ide yang disampaikan kepada Kepala Sekolah dan disetujui.","bullet_poin":[]}
  ]'::jsonb
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'TKN Pembina Citarip', 'Siti Romadoh', true,
  76, 'Sangat Baik', 239, 'Baik', 'Aman',
  '[{"kode":"L","nilai":74},{"kode":"E","nilai":79},{"kode":"A","nilai":80},{"kode":"D","nilai":70}]'::jsonb,
  '[{"kode":"P","nilai":41,"kategori":"Baik"},{"kode":"R","nilai":40,"kategori":"Baik"},{"kode":"O","nilai":41,"kategori":"Baik"},{"kode":"T","nilai":41,"kategori":"Baik"},{"kode":"E","nilai":41,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]'::jsonb,
  '[
    {"tema":"Pengalaman Mengelola Tim","isi":"Melihat kemampuan guru masing-masing yang perlu ditingkatkan, memanggil narasumber untuk memberikan pembelajaran tambahan, dan melakukan kombel pada bagian yang dirasa masih kurang."},
    {"tema":"Inovasi yang Membawa Dampak Nyata","isi":"Saat jumlah guru berkurang karena P3K dan pensiun, seluruh guru berembuk mengikuti acara gugus 4 TK Negeri, saling melatih dan membagi tugas sehingga seluruh permasalahan tetap terselesaikan."},
    {"tema":"Efisiensi Tanpa Mengorbankan Mutu","isi":"Saat menerima anak yang tidak mampu, dilaksanakan subsidi silang agar kebutuhan anak tetap terserap sesuai kebutuhan tanpa menurunkan kualitas pembelajaran."},
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Saat pandemi Covid-19, pembelajaran dialihkan ke daring lewat Zoom, dengan sebagian kecil tatap muka terbatas dua kali seminggu agar tidak terjadi kerumunan."}
  ]'::jsonb,
  '[
    {"judul":"Menciptakan Jalur Pertumbuhan SDM Jangka Panjang","isi":"Saat jumlah guru berkurang karena P3K dan pensiun, seluruh guru berembuk mengikuti acara gugus 4 TK Negeri, saling melatih dan membagi tugas sehingga seluruh permasalahan tetap terselesaikan.","bullet_poin":[]},
    {"judul":"Mengambil Keputusan Sulit demi Integritas","isi":"Saat pandemi Covid-19, pembelajaran dialihkan ke daring lewat Zoom, dengan sebagian kecil tatap muka terbatas dua kali seminggu agar tidak terjadi kerumunan.","bullet_poin":[]}
  ]'::jsonb
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'TKN Pembina Sadang Serang', 'Tita Ariyanti', true,
  73, 'Sangat Baik', 185, 'Baik', 'Aman',
  '[{"kode":"L","nilai":70},{"kode":"E","nilai":74},{"kode":"A","nilai":74},{"kode":"D","nilai":73}]'::jsonb,
  '[{"kode":"P","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":29,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":25,"kategori":"Perlu Perhatian"}]'::jsonb,
  '[
    {"tema":"Inovasi yang Membawa Dampak Nyata","isi":"Menciptakan solusi inovatif lewat pendekatan yang lebih manusiawi dengan membuat analisa SWOT sehingga permasalahan yang harus diangkat menjadi lebih fokus dan terarah."},
    {"tema":"Kemitraan Strategis Sekolah","isi":"Kemitraan parenting kesehatan gigi membuka wawasan anak sekaligus mendorong orang tua berkolaborasi lewat pemeriksaan gigi bersama."},
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Memimpin tim sekolah menghadapi perubahan dimulai dari komunikasi yang jelas, membangun empati, menyusun strategi yang terencana dan terbuka, menyampaikan visi-misi yang jelas, menerima masukan tim, dan selalu melibatkan tim dalam setiap proses perubahan."},
    {"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Inisiatif program beasiswa dan pendidikan gratis mengurangi beban finansial orang tua sehingga anak lebih berfokus pada pembelajaran, sekaligus mendorong pemerataan pendidikan."}
  ]'::jsonb,
  '[
    {"judul":"Melibatkan Siswa dan Orang Tua dalam Program Sekolah","isi":"Inisiatif program beasiswa dan pendidikan gratis mengurangi beban finansial orang tua sehingga anak lebih berfokus pada pembelajaran, sekaligus mendorong pemerataan pendidikan.","bullet_poin":[]}
  ]'::jsonb
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'TKN Centeh', 'Siti Maesaroh, S.Pd', false,
  70, 'Sangat Baik', 205, 'Baik', 'Aman',
  '[{"kode":"L","nilai":64},{"kode":"E","nilai":71},{"kode":"A","nilai":74},{"kode":"D","nilai":72}]'::jsonb,
  '[{"kode":"P","nilai":31,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":38,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":28,"kategori":"Perlu Perhatian"}]'::jsonb,
  '[
    {"tema":"Kemitraan Strategis Sekolah","isi":"Kemitraan dengan Museum Geologi, pasar tradisional dan modern, serta stasiun kereta api dan pemadam kebakaran memperluas pengenalan anak terhadap lingkungan sekitar."},
    {"tema":"Kolaborasi dengan Siswa dan Orangtua","isi":"Bekerja sama dengan orang tua dalam proses pembelajaran, misalnya tugas membawa benda sesuai huruf awalan supaya anak mengenal huruf tanpa drilling."},
    {"tema":"Kepemimpinan di Masa Perubahan","isi":"Perubahan dari Kurikulum 13 ke Kurikulum Merdeka berhasil diimplementasikan dan dibagikan sebagai praktik baik ke PAUD terdekat dan IGTKI kecamatan."}
  ]'::jsonb,
  '[
    {"judul":"Menciptakan Solusi Inovatif Lainnya di Sekolah","isi":"Sebagai guru inti, ilmu yang didapat diimplementasikan lewat RPP baru dan pembelajaran berdiferensiasi bersama seluruh guru, termasuk pengimbasan ke PAUD terdekat.","bullet_poin":[]}
  ]'::jsonb
);

-- ── 9. Rekomendasi tindak lanjut prioritas (4 program pengembangan) ─────────────────────────
-- Dua baris terakhir (Manajemen Risiko & Krisis, Kepemimpinan Digital) punya catatan di
-- hal_diwaspadai: fokus materi/learning outcome-nya tidak terbaca bersih dari PDF sumber akibat
-- tata letak dua kolom -- ditandai jujur, bukan dikarang. Lihat catatan lengkap di
-- extract_leadership_guru_part1 (percakapan sesi ini) untuk detail ambiguitas ekstraksi.
insert into public.tindak_lanjut (
  sekolah_id, periode_id, modul, fokus, scope, scope_id, target_role, status, type,
  dimensi, title, teaser, mengapa_data, manfaat, hal_diwaspadai
) values
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'lw', 'lead', 'sekolah', 'TKN-PEMBINA-BANDUNG', 'yayasan', 'disetujui', 'perlu_perhatian',
  'Problem Solving', 'Pelatihan Creative Problem Solving & Decision Making',
  'Teknik berpikir analitis & kreatif untuk menyelesaikan masalah, root cause analysis untuk kasus di sekolah, dan studi kasus keseharian guru TK.',
  'Menjawab gap terbesar organisasi: indikator Problem Solving rata-rata 47,60 dari 100, skor terendah di antara seluruh indikator LEAD.',
  '{"learning_outcome":"Peserta mampu mengidentifikasi masalah, mencari akar penyebab, dan memilih solusi praktis yang bisa langsung diterapkan di kelas atau manajemen sekolah."}'::jsonb,
  null
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'lw', 'lead', 'sekolah', 'TKN-PEMBINA-BANDUNG', 'yayasan', 'disetujui', 'perlu_perhatian',
  'Inovatif', 'Workshop Design Thinking for Educators',
  'Tahap empathize-define-ideate-prototype-test, mengembangkan ide kegiatan belajar yang seru dan bermakna, hingga menyusun kolaborasi antar guru untuk menciptakan inovasi.',
  'Menjawab gap indikator Inovatif, rata-rata organisasi 75,00 dari 100 -- salah satu dari tiga indikator yang paling perlu penguatan.',
  '{"learning_outcome":"Peserta menghasilkan minimal 1 prototipe inovasi pembelajaran kegiatan sekolah yang siap diuji di semester berjalan."}'::jsonb,
  null
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'lw', 'lead', 'sekolah', 'TKN-PEMBINA-BANDUNG', 'yayasan', 'disetujui', 'perlu_perhatian',
  null, 'Pelatihan Manajemen Risiko & Krisis Program Sekolah',
  null,
  'Bagian dari salah satu indikator inti Leadership & Innovation (Manajemen Krisis dan Risiko).',
  null,
  '["Fokus materi dan learning outcome untuk program ini tidak terbaca bersih dari dokumen sumber (tata letak dua kolom PDF) -- perlu diverifikasi ulang ke berkas asli sebelum ditampilkan sebagai final."]'::jsonb
),
(
  'TKN-PEMBINA-BANDUNG', '2025-07', 'lw', 'lead', 'sekolah', 'TKN-PEMBINA-BANDUNG', 'yayasan', 'disetujui', 'perlu_perhatian',
  'Kepemimpinan Digital', 'Pelatihan Kepemimpinan Digital untuk Sekolah',
  null,
  'Menjawab gap indikator Kepemimpinan Digital, rata-rata organisasi 77,60 dari 100.',
  '{"learning_outcome":"Peningkatan keterampilan kepala sekolah dan guru dalam menggunakan platform digital (WhatsApp Broadcast, Google Workspace, aplikasi penilaian, media sosial) untuk mendukung manajemen dan pembelajaran."}'::jsonb,
  '["Judul program ini tidak tertulis eksplisit di dokumen sumber (hilang akibat tata letak dua kolom); dirumuskan dari isi learning outcome-nya yang cocok dengan gap \"Kepemimpinan Digital\"."]'::jsonb
);

-- ── 10. Briefing (ringkasan eksekutif) ──────────────────────────────────────────────────────
insert into public.briefing (sekolah_id, periode_id, modul, scope, scope_id, status, teks)
values (
  'TKN-PEMBINA-BANDUNG', '2025-07', 'lw', 'sekolah', 'TKN-PEMBINA-BANDUNG', 'disetujui',
  'Dari 8 calon pemimpin yang dinilai di empat unit TK Negeri Pembina Kota Bandung, seluruhnya berada di kategori kesiapan memimpin Istimewa atau Sangat Baik, dengan kondisi psikologis aman di semua unit. Kekuatan utama ada pada orientasi terhadap siswa dan orang tua serta pengelolaan keuangan, sementara problem solving dan kepemimpinan digital masih perlu penguatan lebih lanjut. Empat program pengembangan prioritas sudah dirancang untuk menjawab celah tersebut.'
);

-- ── 11. (OPSIONAL) Akun uji Yayasan untuk lembaga ini ───────────────────────────────────────
-- Jalankan blok ini HANYA kalau Anda ingin akun login untuk memverifikasi modul ini di browser
-- sungguhan. Ganti password 'gantiSandiIni2026' sebelum dipakai -- data di baris 7-10 di atas
-- berklasifikasi RAHASIA (nama guru, skor kesehatan mental), jadi kredensial akun ini wajib
-- dijaga seketat data itu sendiri. Pola provisioning sama seperti akun uji Yayasan sebelumnya
-- (lihat memori sesi: provision_yayasan_mumu.sql) -- auth.users + auth.identities + profiles,
-- HARUS dijalankan manual lewat Supabase SQL Editor (bukan dari anon key browser).
--
-- insert into auth.users (
--   instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
--   raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
--   confirmation_token, recovery_token, email_change, email_change_token_new
-- ) values (
--   '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
--   'dinasbandung@fammi.internal', crypt('gantiSandiIni2026', gen_salt('bf')), now(),
--   '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
-- );
--
-- insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
-- select gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
-- from auth.users where email = 'dinasbandung@fammi.internal';
--
-- insert into public.profiles (id, username, nama, peran, school_id)
-- select id, 'dinasbandung', 'Dinas Pendidikan Kota Bandung', 'Yayasan', 'TKN-PEMBINA-BANDUNG'
-- from auth.users where email = 'dinasbandung@fammi.internal';
--
-- Login: username "dinasbandung", kode "gantiSandiIni2026" (atau apa pun yang Anda ganti di atas).
