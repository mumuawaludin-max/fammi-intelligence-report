-- Modul School Culture (SC): tabel data mentah + RPC import atomik, pola identik
-- import_karakter_periode (20260712100000 + fix service_role 20260712140000).
--
-- sc_personal  = satu baris per staf responden per periode (padanan sheet "Personal" di
--                template Excel yang sudah disepakati pemilik produk).
-- sc_lembaga   = satu baris agregat per periode, opsional per unit kerja (padanan sheet
--                "Lembaga"). Kolom `unit` NULLABLE: null = agregat seluruh sekolah, terisi =
--                agregat satu unit kerja -- FIR TIDAK menghitung rata-rata per unit sendiri
--                (itu akan melanggar "FIR tidak menghitung apa pun", CLAUDE.md butir 3), jadi
--                baris per-unit cuma akan ada kalau pipeline hulu (di luar repo ini) mulai
--                mengekspor satu baris Lembaga per unit. Sampai saat itu, tabel ini cuma berisi
--                satu baris (unit = null) per periode.
--
-- Semua angka (budaya/profil_organisasi/kesejahteraan) sudah FINAL dari hulu (mean, t-score,
-- gap, kategori/predikat) -- importer di web/src/pages/admin/importers/scImporter.js cuma
-- memetakan kolom, tidak menghitung ulang apa pun.
--
-- CATATAN TERBUKA (lihat docs/Kerangka_School_Culture_FIR.md setelah dibuat): sheet "Personal"
-- tidak menyertakan predikat/kategori untuk nilai_karakter_lembaga..work_life_balance (beda
-- dari sheet "Lembaga" yang menyertakan predikat untuk semuanya) -- kategori di jsonb
-- profil_organisasi/kesejahteraan level sc_personal boleh null, BUKAN ditebak importer.

create table if not exists public.sc_personal (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id),
  periode_id text not null,
  nama_responden text,
  no_whatsapp text,
  email text,
  usia int,
  jenis_kelamin text,
  unit text,
  jenjang text,
  peran_kerja text,
  lama_kerja text,
  -- Jawaban 1-5 Likert mentah, disimpan untuk audit/regenerasi ulang tindak lanjut -- TIDAK
  -- PERNAH ditampilkan langsung ke UI maupun dikirim ke Gemini (lihat _shared/geminiPromptSc.ts).
  jawaban_mentah jsonb,
  -- 4 entri: {tipe, mean_gambaran, mean_harapan, t_gambaran, predikat_gambaran, t_harapan,
  --           predikat_harapan, gap, predikat_gap}
  budaya jsonb,
  -- 6 entri: {kode, label, nilai, kategori} -- kategori boleh null (lihat catatan di atas)
  profil_organisasi jsonb,
  -- 5 entri: {kode, label, nilai, kategori} -- kategori boleh null (lihat catatan di atas)
  kesejahteraan jsonb,
  -- survey_q2_kejadian_kesaharian, survey_q3_yang_ingin_diubah, survey_q4_alasan_betah,
  -- survey_q5_hal_menguras_energi, survey_q6_yang_ingin_disampaikan, survey_q7_essay_bebas
  essay jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sc_personal_sekolah_periode_idx on public.sc_personal (sekolah_id, periode_id);

create table if not exists public.sc_lembaga (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id),
  periode_id text not null,
  unit text,
  jumlah_responden int not null default 0,
  budaya jsonb,
  profil_organisasi jsonb,
  kesejahteraan jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sc_lembaga_sekolah_periode_idx on public.sc_lembaga (sekolah_id, periode_id);

alter table public.sc_personal enable row level security;
alter table public.sc_lembaga enable row level security;

-- Baca dibatasi ke pimpinan sekolah (Kepsek/Wakil sekolah-wide per CLAUDE.md, Manajemen/Yayasan
-- untuk modul SC) -- staf individu (Karyawan) TIDAK baca tabel mentah ini langsung, laporannya
-- sendiri datang dari sc_hasil.detail (lihat migration sc_hasil), supaya jawaban mentah/PII
-- (no_whatsapp, email) tidak ikut terbuka ke jalur baca staf biasa.
drop policy if exists sc_personal_baca on public.sc_personal;
create policy sc_personal_baca on public.sc_personal
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
);

drop policy if exists sc_lembaga_baca on public.sc_lembaga;
create policy sc_lembaga_baca on public.sc_lembaga
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
);

-- RPC import atomik: DELETE lalu INSERT kedua tabel untuk (sekolah, periode) dalam satu
-- transaksi, dipanggil lewat admin-actions Edge Function (action "import-sc") dengan
-- service_role -- pola identik import_karakter_periode.
create or replace function public.import_sc_periode(
  p_sekolah_id text, p_periode_id text, p_personal jsonb, p_lembaga jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_personal_count int;
  v_lembaga_count int;
begin
  if auth.role() <> 'service_role' and not is_admin_fammi() then
    raise exception 'Cuma AdminFammi yang boleh import data School Culture.' using errcode = '42501';
  end if;
  if p_sekolah_id is null or p_periode_id is null then
    raise exception 'p_sekolah_id dan p_periode_id wajib diisi.';
  end if;

  delete from sc_personal where sekolah_id = p_sekolah_id and periode_id = p_periode_id;
  delete from sc_lembaga where sekolah_id = p_sekolah_id and periode_id = p_periode_id;

  insert into sc_personal (
    sekolah_id, periode_id, nama_responden, no_whatsapp, email, usia, jenis_kelamin,
    unit, jenjang, peran_kerja, lama_kerja, jawaban_mentah, budaya, profil_organisasi,
    kesejahteraan, essay
  )
  select
    sekolah_id, periode_id, nama_responden, no_whatsapp, email, usia, jenis_kelamin,
    unit, jenjang, peran_kerja, lama_kerja, jawaban_mentah, budaya, profil_organisasi,
    kesejahteraan, essay
  from jsonb_to_recordset(coalesce(p_personal, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, nama_responden text, no_whatsapp text, email text,
    usia int, jenis_kelamin text, unit text, jenjang text, peran_kerja text, lama_kerja text,
    jawaban_mentah jsonb, budaya jsonb, profil_organisasi jsonb, kesejahteraan jsonb, essay jsonb
  );
  get diagnostics v_personal_count = row_count;

  insert into sc_lembaga (sekolah_id, periode_id, unit, jumlah_responden, budaya, profil_organisasi, kesejahteraan)
  select sekolah_id, periode_id, unit, jumlah_responden, budaya, profil_organisasi, kesejahteraan
  from jsonb_to_recordset(coalesce(p_lembaga, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, unit text, jumlah_responden int,
    budaya jsonb, profil_organisasi jsonb, kesejahteraan jsonb
  );
  get diagnostics v_lembaga_count = row_count;

  return jsonb_build_object('ok', true, 'periode_id', p_periode_id, 'personal', v_personal_count, 'lembaga', v_lembaga_count);
end;
$$;

grant execute on function public.import_sc_periode(text, text, jsonb, jsonb) to authenticated;

-- Izinkan nilai 'sc' (School Culture) di school_modules.modul, pola dinamis sama seperti
-- 'cw' ditambahkan di 20260720110000_school_modules_allow_cw.sql -- tidak menghardcode daftar
-- lama supaya baris produksi yang mungkin sudah punya nilai lain tidak ikut ditolak.
do $$
declare
  daftar text;
begin
  select string_agg(quote_literal(v), ', ' order by v)
    into daftar
  from (
    select unnest(array['karakter', 'mi', 'screening', 'cw', 'sc']) as v
    union
    select distinct modul from public.school_modules where modul is not null
  ) s;

  execute 'alter table public.school_modules drop constraint if exists school_modules_modul_check';
  execute format(
    'alter table public.school_modules add constraint school_modules_modul_check check (modul in (%s))',
    daftar
  );
end $$;
