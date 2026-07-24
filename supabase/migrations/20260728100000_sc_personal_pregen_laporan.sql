-- Kolom "pregen_laporan": laporan individu School Culture yang SUDAH dirumuskan di hulu, di luar
-- FIR, lalu ditempel ke file Excel sebagai kolom "laporan_json" di sheet Personal (satu sel JSON
-- per responden). Kalau kolom ini terisi dan bentuknya valid, generate-sc-individu memakainya apa
-- adanya dan TIDAK memanggil Gemini sama sekali untuk responden itu.
--
-- Kenapa ada: sepanjang 2026-07 generate massal berkali-kali gagal total karena Gemini API
-- membalas 503 "high demand" berjam-jam, menimpa model utama maupun cadangan (lihat log produksi
-- dan riwayat perbaikan di _shared/geminiPrompt.ts). Jalur ini memberi pemilik produk cara
-- merumuskan laporan di luar jam padat/di luar API, tanpa menyandera admin menunggu di depan
-- layar. Ini BUKAN melewati gerbang persetujuan manusia (CLAUDE.md butir 6) -- hasilnya tetap
-- masuk sc_hasil berstatus 'menunggu_persetujuan' persis seperti jalur Gemini, dan tetap harus
-- disetujui admin sebelum tayang. Yang dilewati cuma perumusnya, bukan gerbangnya.
--
-- Konsisten juga dengan CLAUDE.md yang sejak awal menyebut DUA jalur perumusan: pipeline hulu
-- batch di luar repo ini, dan trigger on-demand lewat Edge Function. Kolom ini jalur pertama.
--
-- Bentuk isinya PERSIS sama dengan keluaran Gemini (SYSTEM_INSTRUCTION_SC_INDIVIDU di
-- _shared/geminiPromptSc.ts): header/bagian_budaya/bagian_kesejahteraan/bagian_profil_organisasi/
-- cermin_konteks/bagian_refleksi/rencana_aksi/lingkar_kontribusi. Sengaja tidak dipasang
-- CHECK constraint bentuk di sini: validasi dilakukan berlapis di sisi yang bisa memberi pesan
-- jelas ke admin (scImporter.js saat parse Excel, generate-sc-individu sebelum dipakai), bukan
-- error Postgres mentah yang menggagalkan seluruh transaksi import 16 orang gara-gara satu sel.

alter table public.sc_personal add column if not exists pregen_laporan jsonb;

-- CREATE OR REPLACE, bukan migration terpisah untuk RPC-nya -- signature (nama, tipe parameter)
-- tidak berubah, cuma daftar kolom insert di dalam body yang bertambah satu, jadi aman ditimpa
-- langsung tanpa drop function lebih dulu. Pola identik migration 20260725110000 (bersedia).
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
