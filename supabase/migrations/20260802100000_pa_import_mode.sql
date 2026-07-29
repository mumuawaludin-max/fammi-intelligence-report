-- Migration sebelumnya (20260801150000) membuat import_pa_periode full-replace PER SEKOLAH
-- (bukan per periode), dan sengaja menulis catatan di kepalanya: begitu modul ini butuh
-- membedakan "unggah ulang untuk memperbaiki periode ini" dari "unggah periode baru", jangan
-- sekadar mengembalikan filter periode_id di DELETE begitu saja -- admin harus bisa memilih.
--
-- Keputusan pemilik produk (2026-08): admin memilih salah satu mode secara eksplisit tiap kali
-- upload, lewat parameter p_mode:
--   'ulang' (default, sama seperti perilaku sebelumnya) -- hapus SELURUH data Perilaku Anak
--            sekolah ini (semua periode), lalu ganti total dengan isi berkas ini. Dipakai untuk
--            memperbaiki kesalahan pada periode yang SEDANG berjalan.
--   'baru'  -- hapus HANYA baris dengan periode_id yang sama (supaya unggahan yang diulang untuk
--            periode baru yang sama tetap idem-poten, tidak dobel), periode lain tidak disentuh.
--            Dipakai untuk menambah periode baru tanpa kehilangan riwayat periode sebelumnya.
--
-- Fungsi lama (5 parameter, tanpa p_mode) di-drop dulu supaya tidak ada dua overload yang bisa
-- ambigu dipanggil dengan 5 argumen (default p_mode tidak membedakan overload untuk Postgres).

drop function if exists public.import_pa_periode(text, text, jsonb, jsonb, jsonb);

create or replace function public.import_pa_periode(
  p_sekolah_id text,
  p_periode_id text,
  p_lembaga jsonb,
  p_siswa jsonb,
  p_esai jsonb,
  p_mode text default 'ulang'
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lembaga_count int := 0;
  v_siswa_count int := 0;
  v_esai_count int := 0;
  v_lembaga_hapus int := 0;
  v_siswa_hapus int := 0;
  v_esai_hapus int := 0;
begin
  -- Gerbang sama dengan import_sc_periode: cuma service_role (Edge Function) atau AdminFammi.
  if auth.role() <> 'service_role' and not is_admin_fammi() then
    raise exception 'Hanya Admin Fammi yang boleh mengimpor data Perilaku Anak.'
      using errcode = '42501';
  end if;

  if p_sekolah_id is null or p_periode_id is null then
    raise exception 'p_sekolah_id dan p_periode_id wajib diisi.';
  end if;

  if p_mode not in ('ulang', 'baru') then
    raise exception 'p_mode harus ''ulang'' atau ''baru'', dapat: %', p_mode;
  end if;

  if p_mode = 'baru' then
    -- Tambah periode baru: cuma hapus baris periode_id yang SAMA (supaya unggah ulang periode
    -- baru yang sama tetap idem-poten), periode lain milik sekolah ini tidak disentuh.
    delete from public.pa_lembaga where sekolah_id = p_sekolah_id and periode_id = p_periode_id;
    get diagnostics v_lembaga_hapus = row_count;
    delete from public.pa_siswa where sekolah_id = p_sekolah_id and periode_id = p_periode_id;
    get diagnostics v_siswa_hapus = row_count;
    delete from public.pa_esai where sekolah_id = p_sekolah_id and periode_id = p_periode_id;
    get diagnostics v_esai_hapus = row_count;
  else
    -- Unggah ulang (perbaiki): full replace per SEKOLAH, sama seperti sebelumnya.
    delete from public.pa_lembaga where sekolah_id = p_sekolah_id;
    get diagnostics v_lembaga_hapus = row_count;
    delete from public.pa_siswa where sekolah_id = p_sekolah_id;
    get diagnostics v_siswa_hapus = row_count;
    delete from public.pa_esai where sekolah_id = p_sekolah_id;
    get diagnostics v_esai_hapus = row_count;
  end if;

  insert into public.pa_lembaga (
    sekolah_id, periode_id, unit, jumlah_siswa,
    statistik, emosi, heart, indikator, survey, narasi
  )
  select
    x.sekolah_id, x.periode_id, x.unit, coalesce(x.jumlah_siswa, 0),
    x.statistik, x.emosi, x.heart, x.indikator, x.survey, x.narasi
  from jsonb_to_recordset(coalesce(p_lembaga, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, unit text, jumlah_siswa int,
    statistik jsonb, emosi jsonb, heart jsonb, indikator jsonb, survey jsonb, narasi jsonb
  );
  get diagnostics v_lembaga_count = row_count;

  insert into public.pa_siswa (
    sekolah_id, periode_id, nama, kelas, unit, domain, status, skor
  )
  select
    x.sekolah_id, x.periode_id, x.nama, x.kelas, x.unit, x.domain, x.status, x.skor
  from jsonb_to_recordset(coalesce(p_siswa, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, nama text, kelas text, unit text,
    domain text, status text, skor int
  );
  get diagnostics v_siswa_count = row_count;

  insert into public.pa_esai (
    sekolah_id, periode_id, kode_anonim, nama, kelas, unit,
    domain, pertanyaan_kode, jawaban_pilihan, jawaban_teks, anotasi
  )
  select
    x.sekolah_id, x.periode_id, x.kode_anonim, x.nama, x.kelas, x.unit,
    x.domain, x.pertanyaan_kode, x.jawaban_pilihan, x.jawaban_teks, x.anotasi
  from jsonb_to_recordset(coalesce(p_esai, '[]'::jsonb)) as x(
    sekolah_id text, periode_id text, kode_anonim text, nama text, kelas text, unit text,
    domain text, pertanyaan_kode text, jawaban_pilihan text, jawaban_teks text, anotasi jsonb
  );
  get diagnostics v_esai_count = row_count;

  return jsonb_build_object(
    'ok', true,
    'mode', p_mode,
    'lembaga', v_lembaga_count,
    'siswa', v_siswa_count,
    'esai', v_esai_count,
    'dihapus', jsonb_build_object(
      'lembaga', v_lembaga_hapus,
      'siswa', v_siswa_hapus,
      'esai', v_esai_hapus
    )
  );
end;
$$;
