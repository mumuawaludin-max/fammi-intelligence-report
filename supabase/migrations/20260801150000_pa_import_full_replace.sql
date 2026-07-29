-- import_pa_periode sebelumnya delete-then-insert yang DILINGKUPI (sekolah_id, periode_id):
-- mengunggah ulang periode yang SAMA memang mengganti isinya, tapi mengunggah berkas dengan
-- periode BERBEDA menyisakan seluruh data periode lama di tabel. Akibatnya dropdown periode di
-- dashboard menumpuk periode-periode lama yang sebenarnya sudah tidak dipakai, dan angka periode
-- lama tetap bisa dibuka seolah masih berlaku.
--
-- Keputusan eksplisit pemilik produk (2026-08): satu unggahan = SATU sumber kebenaran untuk
-- sekolah itu. Unggahan baru menghapus SELURUH data Perilaku Anak sekolah tersebut (semua
-- periode), lalu menulis ulang isi berkas yang baru. Modul ini memang belum punya kebutuhan
-- membandingkan antarperiode (lihat catatan "tidak ada pembanding periode lalu" di pa.mock.js),
-- jadi menyimpan periode lama tidak memberi nilai tambah, cuma menimbulkan kebingungan.
--
-- CATATAN untuk yang mengubah ini nanti: begitu modul ini butuh perbandingan antarperiode,
-- JANGAN sekadar mengembalikan filter periode_id di DELETE -- pikirkan dulu bagaimana admin bisa
-- membedakan "unggah ulang untuk memperbaiki periode ini" dari "unggah periode baru", karena
-- keduanya tidak bisa dibedakan dari isi berkas saja.

create or replace function public.import_pa_periode(
  p_sekolah_id text,
  p_periode_id text,
  p_lembaga jsonb,
  p_siswa jsonb,
  p_esai jsonb
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

  -- Full replace per SEKOLAH (bukan per periode) -- lihat catatan panjang di kepala berkas.
  delete from public.pa_lembaga where sekolah_id = p_sekolah_id;
  get diagnostics v_lembaga_hapus = row_count;
  delete from public.pa_siswa where sekolah_id = p_sekolah_id;
  get diagnostics v_siswa_hapus = row_count;
  delete from public.pa_esai where sekolah_id = p_sekolah_id;
  get diagnostics v_esai_hapus = row_count;

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
