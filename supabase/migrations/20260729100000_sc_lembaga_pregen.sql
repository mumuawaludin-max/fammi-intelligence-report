-- Jalur perumusan siap pakai untuk konten AGREGAT School Culture (briefing + tindak lanjut per
-- role), padanan langsung sc_personal.pregen_laporan (migration 20260728100000) yang sudah
-- dipakai laporan INDIVIDU. Latar belakang sama: Gemini API sempat membalas 503 "high demand"
-- berjam-jam berkali-kali sepanjang 2026-07, menggagalkan generate massal -- jalur ini memberi
-- cara merumuskan konten di hulu (Claude, di luar FIR dan di luar jam padat), ditempel ke sheet
-- "Lembaga" sebagai dua kolom JSON, dipakai apa adanya tanpa memanggil Gemini.
--
-- BUKAN melewati gerbang persetujuan manusia (CLAUDE.md butir 6) -- hasilnya tetap masuk
-- tindak_lanjut/briefing berstatus 'menunggu_persetujuan', tetap wajib ditinjau admin sebelum
-- tayang, persis jalur Gemini. Yang dilewati cuma perumusnya.
--
-- pregen_briefing: satu objek {gambaran, catatan_internal, tema_esai[], cerita_pegawai{}} --
-- padanan keluaran SYSTEM_INSTRUCTION_SC_BRIEFING (_shared/geminiPromptSc.ts).
-- pregen_tindak_lanjut: satu objek dikelompokkan per target_role, mis.
-- {"manajemen": [...], "kepala_sekolah": [...], "yayasan": [...]} -- karena generate-tindak-lanjut
-- dipicu SATU role per panggilan (lihat generate-tindak-lanjut/index.ts), bukan array datar.
alter table public.sc_lembaga add column if not exists pregen_briefing jsonb;
alter table public.sc_lembaga add column if not exists pregen_tindak_lanjut jsonb;

-- draf_asal ('excel' | 'gemini') -- BUKAN memakai kolom `sumber` yang sudah ada di briefing
-- (dipakai untuk arti lain, array label sumber mis. ["School Culture"], lihat
-- generateAndInsertDraftSc) -- nama kolom baru sengaja beda supaya tidak menimpa makna existing.
-- Ditambahkan ke KEDUA tabel generik (dipakai bareng modul Karakter) -- aman, kolom baru
-- nullable tanpa default, baris Karakter yang sudah ada otomatis tetap null tanpa terpengaruh.
alter table public.tindak_lanjut add column if not exists draf_asal text;
alter table public.briefing add column if not exists draf_asal text;

-- CREATE OR REPLACE, bukan migration terpisah -- signature (nama, tipe parameter) tidak
-- berubah, cuma daftar kolom insert sc_lembaga yang bertambah dua, pola sama migration
-- 20260728100000 (pregen_laporan di sc_personal).
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
    unit, jenjang, peran_kerja, lama_kerja, bersedia, jawaban_mentah, budaya,
    profil_organisasi, kesejahteraan, essay, pregen_laporan
  )
  select
    sekolah_id, periode_id, nama_responden, no_whatsapp, email, usia, jenis_kelamin,
    unit, jenjang, peran_kerja, lama_kerja, bersedia, jawaban_mentah, budaya,
    profil_organisasi, kesejahteraan, essay, pregen_laporan
  from jsonb_to_recordset(coalesce(p_personal, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, nama_responden text, no_whatsapp text, email text,
    usia int, jenis_kelamin text, unit text, jenjang text, peran_kerja text, lama_kerja text,
    bersedia boolean, jawaban_mentah jsonb, budaya jsonb, profil_organisasi jsonb,
    kesejahteraan jsonb, essay jsonb, pregen_laporan jsonb
  );
  get diagnostics v_personal_count = row_count;

  insert into sc_lembaga (
    sekolah_id, periode_id, unit, jumlah_responden, budaya, profil_organisasi, kesejahteraan,
    pregen_briefing, pregen_tindak_lanjut
  )
  select
    sekolah_id, periode_id, unit, jumlah_responden, budaya, profil_organisasi, kesejahteraan,
    pregen_briefing, pregen_tindak_lanjut
  from jsonb_to_recordset(coalesce(p_lembaga, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, unit text, jumlah_responden int,
    budaya jsonb, profil_organisasi jsonb, kesejahteraan jsonb,
    pregen_briefing jsonb, pregen_tindak_lanjut jsonb
  );
  get diagnostics v_lembaga_count = row_count;

  return jsonb_build_object('ok', true, 'periode_id', p_periode_id, 'personal', v_personal_count, 'lembaga', v_lembaga_count);
end;
$$;
