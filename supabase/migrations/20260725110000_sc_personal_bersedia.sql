-- Kolom "bersedia" (consent tampil di drill-down individu pimpinan) -- sheet Personal punya
-- kolom ini ("Ya, saya bersedia" / "Tidak, saya tidak bersedia") yang sebelumnya tidak pernah
-- dibaca importer sama sekali. Staf yang menjawab tidak bersedia TETAP diikutkan di agregat
-- sc_lembaga (sudah final dari hulu, bukan urusan FIR memilah), tapi barisnya di sc_hasil tidak
-- boleh muncul di tabel "Laporan Individu" pimpinan -- lihat filter di useScRespondenList
-- (useScData.js).

alter table public.sc_personal add column if not exists bersedia boolean;

-- CREATE OR REPLACE, bukan migration terpisah untuk RPC-nya -- signature (nama, tipe parameter)
-- tidak berubah, cuma daftar kolom insert di dalam body yang bertambah satu, jadi aman ditimpa
-- langsung tanpa drop function lebih dulu.
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
    profil_organisasi, kesejahteraan, essay
  )
  select
    sekolah_id, periode_id, nama_responden, no_whatsapp, email, usia, jenis_kelamin,
    unit, jenjang, peran_kerja, lama_kerja, bersedia, jawaban_mentah, budaya,
    profil_organisasi, kesejahteraan, essay
  from jsonb_to_recordset(coalesce(p_personal, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, nama_responden text, no_whatsapp text, email text,
    usia int, jenis_kelamin text, unit text, jenjang text, peran_kerja text, lama_kerja text,
    bersedia boolean, jawaban_mentah jsonb, budaya jsonb, profil_organisasi jsonb,
    kesejahteraan jsonb, essay jsonb
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
