-- Fase E1: import Karakter satu transaksi di server.
--
-- Sebelum ini, web/src/pages/admin/importers/karakterImporter.js menulis langsung dari
-- browser lewat chunked upsert (500 baris per batch) ke empat tabel terpisah. Kalau koneksi
-- putus atau ada baris gagal di tengah chunk ke-3 dari 4 tabel, tiga tabel pertama sudah
-- terlanjur ditulis -- tidak ada rollback, laporan sekolah jadi campuran data lama dan baru
-- yang tidak konsisten sampai admin re-upload manual.
--
-- Fungsi ini memindahkan tulisan ke satu function Postgres per periode: DELETE baris lama
-- untuk (sekolah, periode) itu di keempat tabel, lalu INSERT baris baru, semua dalam satu
-- transaksi implisit function call. Gagal di mana pun berarti seluruh periode itu rollback
-- total, tidak ada sisa. Delete-then-insert (bukan upsert onConflict seperti sebelumnya) juga
-- sekaligus membuang murid yang hilang dari file baru (mis. pindah kelas/keluar) -- upsert
-- lama tidak bisa melakukan itu, cuma menimpa baris yang key-nya masih cocok.
--
-- security definer + pengecekan is_admin_fammi() di dalam supaya bisa dipanggil langsung
-- dari browser (anon key + JWT admin) tanpa perlu lewat Edge Function terpisah, sama seperti
-- helper my_peran() dkk. set search_path dipasang eksplisit (beda dari helper baca yang sudah
-- ada) karena function ini menulis data, bukan cuma membaca -- praktik standar untuk
-- SECURITY DEFINER yang melakukan DML supaya tidak bisa dibajak lewat search_path caller.

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
  if not is_admin_fammi() then
    raise exception 'Cuma AdminFammi yang boleh import data karakter.' using errcode = '42501';
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

grant execute on function public.import_karakter_periode(jsonb) to authenticated;
