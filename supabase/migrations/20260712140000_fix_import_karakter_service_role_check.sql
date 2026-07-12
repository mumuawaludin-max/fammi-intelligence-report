-- Perbaiki import_karakter_periode: is_admin_fammi() bergantung pada auth.uid(), yang kosong
-- ketika function ini dipanggil lewat service_role (dari admin-actions Edge Function, action
-- "import-karakter") -- tidak ada JWT user yang menyertai panggilan service_role, jadi
-- auth.uid() null dan is_admin_fammi() selalu false, membuat RPC menolak dirinya sendiri
-- ("Cuma AdminFammi yang boleh import data karakter.") walau pemanggilnya memang AdminFammi
-- yang sudah diverifikasi satu lapis di atas oleh admin-actions lewat JWT-nya sendiri sebelum
-- beralih ke service_role.
--
-- auth.role() = 'service_role' cuma benar untuk request yang memang otentikasi pakai
-- SERVICE_ROLE_KEY (satu-satunya pemanggil function ini sekarang: admin-actions). Panggilan
-- langsung dari browser dengan anon/authenticated role tetap wajib lolos is_admin_fammi()
-- seperti sebelumnya -- meski secara praktis percuma karena RLS tabel sudah SELECT-saja,
-- ini tetap lapisan pertahanan kedua yang tidak merugikan untuk dipertahankan.

create or replace function public.import_karakter_periode(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sekolah_id text := payload->>'sekolah_id';
  v_periode_id text := payload->>'periode_id';
  v_skor_count int;
  v_skor_indikator_count int;
  v_pernyataan_count int;
  v_summary_count int;
begin
  if auth.role() <> 'service_role' and not is_admin_fammi() then
    raise exception 'Cuma AdminFammi yang boleh import data karakter.' USING ERRCODE = '42501';
  end if;
  if v_sekolah_id is null or v_periode_id is null then
    raise exception 'payload.sekolah_id dan payload.periode_id wajib diisi.';
  end if;

  delete from karakter_skor where sekolah_id = v_sekolah_id and periode_id = v_periode_id;
  delete from karakter_skor_indikator where sekolah_id = v_sekolah_id and periode_id = v_periode_id;
  delete from karakter_pernyataan_ortu where sekolah_id = v_sekolah_id and periode_id = v_periode_id;
  delete from karakter_summary where sekolah_id = v_sekolah_id and periode_id = v_periode_id;

  insert into karakter_skor (sekolah_id, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber, status)
  select sekolah_id, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber, status
  from jsonb_to_recordset(coalesce(payload->'skor_rows', '[]'::jsonb)) as x(
    sekolah_id text, kelas_id text, murid_id text, nama_murid text, periode_id text,
    aspek_kode text, skor int, sumber text, status text
  );
  get diagnostics v_skor_count = row_count;

  insert into karakter_skor_indikator (sekolah_id, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, sumber, status)
  select sekolah_id, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, sumber, status
  from jsonb_to_recordset(coalesce(payload->'skor_indikator_rows', '[]'::jsonb)) as x(
    sekolah_id text, kelas_id text, murid_id text, nama_murid text, periode_id text,
    aspek_kode text, indikator_kode text, skor int, sumber text, status text
  );
  get diagnostics v_skor_indikator_count = row_count;

  insert into karakter_pernyataan_ortu (
    sekolah_id, kelas_id, murid_id, nama_murid, periode_id, kategori_pernyataan, pernyataan,
    emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri, status
  )
  select
    sekolah_id, kelas_id, murid_id, nama_murid, periode_id, kategori_pernyataan, pernyataan,
    emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri, status
  from jsonb_to_recordset(coalesce(payload->'pernyataan_rows', '[]'::jsonb)) as x(
    sekolah_id text, kelas_id text, murid_id text, nama_murid text, periode_id text,
    kategori_pernyataan text, pernyataan text, emosi_anak text, alasan_emosi text,
    dukungan_dibutuhkan text, dukungan_lainnya text, hal_disyukuri text, status text
  );
  get diagnostics v_pernyataan_count = row_count;

  insert into karakter_summary (sekolah_id, scope, scope_id, periode_id, ringkasan, status)
  select sekolah_id, scope, scope_id, periode_id, ringkasan, status
  from jsonb_to_recordset(coalesce(payload->'summary_rows', '[]'::jsonb)) as x(
    sekolah_id text, scope text, scope_id text, periode_id text, ringkasan jsonb, status text
  );
  get diagnostics v_summary_count = row_count;

  return jsonb_build_object(
    'ok', true, 'periode_id', v_periode_id,
    'skor', v_skor_count, 'skor_indikator', v_skor_indikator_count,
    'pernyataan', v_pernyataan_count, 'summary', v_summary_count
  );
end;
$$;
