-- Unggah pekanan mengganti PEKAN YANG ADA DI BERKAS saja, bukan seluruh bulan.
--
-- Di 20260828120000 saya membuat DELETE mode 'ganti' menyapu seluruh pekan satu periode, dengan
-- alasan "unggahan menggantikan satu bulan penuh". Untuk sekolah yang menilai pekanan, itu
-- keliru dan merusak: sekolah mengekspor pekan terbaru saja (wajar, itu yang baru diisi guru),
-- lalu unggahan P2 MENGHAPUS P1 yang sudah tersimpan. Tidak ada peringatan, tidak ada error,
-- dan tidak ada cara mengembalikannya selain mengunggah ulang berkas lama.
--
-- Sekarang: kalau payload menyebut pekan mana saja yang ada di berkas (payload.pekan_list),
-- yang dihapus cuma pekan-pekan itu. Pekan lain di bulan yang sama tidak disentuh.
--
-- Kekhawatiran yang membuat saya memilih sapu-bersih dulu tetap sah: kalau cuma pekan di berkas
-- yang dihapus, pekan yang DIBATALKAN sekolah (salah input, lalu dihapus dari berkas) akan
-- tertinggal selamanya. Itu tidak hilang, cuma dipindah ke pilihan sadar: importer tetap bisa
-- meminta sapu-bersih dengan TIDAK mengirim pekan_list, dan Admin CMS menyediakan centang
-- "ganti seluruh bulan" untuk itu. Bawaannya yang aman, bukan yang destruktif.
--
-- KOMPATIBEL MUNDUR. Payload tanpa pekan_list berperilaku persis seperti sebelumnya (hapus
-- seluruh pekan), jadi importer lama maupun berkas bulanan tidak berubah sama sekali.
--
-- Idempoten, aman dijalankan ulang. Jalankan lewat Supabase SQL Editor.

create or replace function public.import_karakter_periode(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sekolah_id text := payload->>'sekolah_id';
  v_periode_id text := payload->>'periode_id';
  v_mode text := coalesce(payload->>'mode', 'ganti');
  v_jenjang text := nullif(payload->>'jenjang', '');
  v_pekan smallint[];
  v_sumber text[];
  v_skor_count int;
  v_skor_indikator_count int;
  v_pernyataan_count int;
  v_pernyataan_ortu_count int;
  v_pernyataan_siswa_count int;
  v_summary_count int;
begin
  if auth.role() <> 'service_role' and not is_admin_fammi() then
    raise exception 'Cuma AdminFammi yang boleh import data karakter.' USING ERRCODE = '42501';
  end if;
  if v_sekolah_id is null or v_periode_id is null then
    raise exception 'payload.sekolah_id dan payload.periode_id wajib diisi.';
  end if;
  if v_mode not in ('ganti', 'lanjut') then
    raise exception 'payload.mode harus ''ganti'' atau ''lanjut'', dapat: %', v_mode;
  end if;

  -- jsonb_typeof, bukan operator `?`: ini sekaligus menolak field yang ada tapi isinya null atau
  -- bukan array, jadi payload salah bentuk jatuh ke perilaku lama yang aman alih-alih error.
  -- Array kosong juga diperlakukan sebagai "tidak disebut", karena menghapus nol pekan lalu
  -- menulis baris baru akan menggandakan data.
  if jsonb_typeof(payload->'pekan_list') = 'array' then
    select array_agg(distinct (t.v)::smallint) into v_pekan
    from jsonb_array_elements_text(payload->'pekan_list') as t(v)
    where t.v ~ '^[0-9]+$';
    if array_length(v_pekan, 1) is null then v_pekan := null; end if;
  end if;

  if v_mode = 'ganti' then
    if jsonb_typeof(payload->'pernyataan_sumber') = 'array' then
      select coalesce(array_agg(distinct s), '{}'::text[]) into v_sumber
      from jsonb_array_elements_text(payload->'pernyataan_sumber') as t(s);
    else
      select coalesce(array_agg(distinct coalesce(x->>'sumber', 'orangtua')), '{}'::text[])
      into v_sumber
      from jsonb_array_elements(coalesce(payload->'pernyataan_rows', '[]'::jsonb)) as t(x);
    end if;

    -- v_pekan null -> hapus seluruh pekan, yaitu perilaku 20260828120000 persis.
    delete from karakter_skor
     where sekolah_id = v_sekolah_id and periode_id = v_periode_id
       and (v_jenjang is null or jenjang = v_jenjang)
       and (v_pekan is null or pekan = any(v_pekan));

    delete from karakter_skor_indikator
     where sekolah_id = v_sekolah_id and periode_id = v_periode_id
       and (v_jenjang is null or jenjang = v_jenjang)
       and (v_pekan is null or pekan = any(v_pekan));

    if v_jenjang is null and array_length(v_sumber, 1) is not null then
      delete from karakter_pernyataan_ortu
       where sekolah_id = v_sekolah_id and periode_id = v_periode_id
         and sumber = any(v_sumber);
    end if;

    -- karakter_summary tidak punya kolom pekan: satu baris per (scope, scope_id, periode).
    -- Ringkasan bulan itu memang selalu digantikan yang terbaru, sejalan dengan aturan
    -- "angka bulanan = pekan terakhir" -- berkas pekan terbaru membawa ringkasan terbaru.
    if v_jenjang is null then
      delete from karakter_summary where sekolah_id = v_sekolah_id and periode_id = v_periode_id;
    else
      delete from karakter_summary
       where sekolah_id = v_sekolah_id and periode_id = v_periode_id
         and scope = 'jenjang' and scope_id = v_jenjang;
    end if;
  end if;

  insert into karakter_skor (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber, status)
  select sekolah_id, coalesce(x.jenjang, '*'), coalesce(x.pekan, 0), kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor, sumber, status
  from jsonb_to_recordset(coalesce(payload->'skor_rows', '[]'::jsonb)) as x(
    sekolah_id text, jenjang text, pekan smallint, kelas_id text, murid_id text, nama_murid text,
    periode_id text, aspek_kode text, skor int, sumber text, status text
  );
  get diagnostics v_skor_count = row_count;

  insert into karakter_skor_indikator (sekolah_id, jenjang, pekan, kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, sumber, status)
  select sekolah_id, coalesce(x.jenjang, '*'), coalesce(x.pekan, 0), kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor, sumber, status
  from jsonb_to_recordset(coalesce(payload->'skor_indikator_rows', '[]'::jsonb)) as x(
    sekolah_id text, jenjang text, pekan smallint, kelas_id text, murid_id text, nama_murid text,
    periode_id text, aspek_kode text, indikator_kode text, skor int, sumber text, status text
  );
  get diagnostics v_skor_indikator_count = row_count;

  with ins as (
    insert into karakter_pernyataan_ortu (
      sekolah_id, kelas_id, murid_id, nama_murid, periode_id, kategori_pernyataan, pernyataan,
      emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri, status,
      sumber
    )
    select
      sekolah_id, kelas_id, murid_id, nama_murid, periode_id, kategori_pernyataan, pernyataan,
      emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri, status,
      coalesce(x.sumber, 'orangtua')
    from jsonb_to_recordset(coalesce(payload->'pernyataan_rows', '[]'::jsonb)) as x(
      sekolah_id text, kelas_id text, murid_id text, nama_murid text, periode_id text,
      kategori_pernyataan text, pernyataan text, emosi_anak text, alasan_emosi text,
      dukungan_dibutuhkan text, dukungan_lainnya text, hal_disyukuri text, status text,
      sumber text
    )
    returning sumber
  )
  select
    (count(*))::int,
    (count(*) filter (where sumber = 'orangtua'))::int,
    (count(*) filter (where sumber = 'siswa'))::int
  into v_pernyataan_count, v_pernyataan_ortu_count, v_pernyataan_siswa_count
  from ins;

  insert into karakter_summary (sekolah_id, scope, scope_id, periode_id, ringkasan, status)
  select sekolah_id, scope, scope_id, periode_id, ringkasan, status
  from jsonb_to_recordset(coalesce(payload->'summary_rows', '[]'::jsonb)) as x(
    sekolah_id text, scope text, scope_id text, periode_id text, ringkasan jsonb, status text
  );
  get diagnostics v_summary_count = row_count;

  -- 'pekan_diganti' dikembalikan supaya importer bisa memastikan RPC yang dipanggil memang versi
  -- yang mengenal cakupan per pekan. Tanpa gerbang itu, frontend baru di atas database lama akan
  -- mengirim pekan_list yang DIABAIKAN, dan unggahan P2 tetap menghapus P1 tanpa satu pun tanda.
  -- Pola gerbang yang sama sudah dipakai untuk 'mode', 'jenjang', dan 'pekan'.
  return jsonb_build_object(
    'ok', true, 'periode_id', v_periode_id, 'mode', v_mode,
    'jenjang', coalesce(v_jenjang, '*semua*'),
    'pekan', true,
    'pekan_diganti', coalesce(to_jsonb(v_pekan), to_jsonb('*semua*'::text)),
    'skor', v_skor_count, 'skor_indikator', v_skor_indikator_count,
    'pernyataan', v_pernyataan_count,
    'pernyataan_orangtua', v_pernyataan_ortu_count,
    'pernyataan_siswa', v_pernyataan_siswa_count,
    'summary', v_summary_count
  );
end;
$$;

grant execute on function public.import_karakter_periode(jsonb) to authenticated;
