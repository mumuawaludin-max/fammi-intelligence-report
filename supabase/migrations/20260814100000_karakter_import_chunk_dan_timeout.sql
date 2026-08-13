-- Perbaikan dua kegagalan import Rapor Karakter yang terekam di import_log (Agustus 2026):
--
-- 1. SMK Telkom Purwokerto, 27.522 baris, 3 bulan:
--    "Periode 2026-05: canceling statement due to statement timeout".
--    Satu panggilan RPC per periode berarti satu statement Postgres harus menghapus lalu
--    memasukkan ~10.000 baris ke empat tabel sekaligus, dan statement itu tunduk pada
--    statement_timeout milik role service_role (jalur Edge Function admin-actions). Dua periode
--    pertama lolos, periode ketiga kena batas waktu dan seluruh periode itu rollback.
--
-- 2. TK Telkom Batam, 580 baris:
--    "Periode 2026-03: duplicate key value violates unique constraint
--    karakter_skor_sekolah_murid_periode_aspek_key".
--    Berkasnya memuat baris ganda untuk (murid, periode, aspek) yang sama. Penyaringannya ada di
--    sisi importer (web/src/pages/admin/importers/karakterImporter.js, lihat dedupeByKey) karena
--    di sanalah admin bisa diberi tahu murid mana yang ganda sebelum menekan konfirmasi; berkas
--    ini menangani sisi servernya saja.
--
-- Tiga perubahan di sini, semuanya penambahan yang kompatibel mundur:
--   a. payload.mode -- 'ganti' (default, sama persis dengan perilaku sebelumnya: hapus dulu lalu
--      isi) atau 'lanjut' (isi saja, tanpa hapus). Ini yang membuat importer bisa memecah satu
--      periode besar jadi beberapa panggilan kecil: chunk pertama 'ganti', sisanya 'lanjut'.
--      Payload lama tanpa field mode tetap berperilaku persis seperti sebelumnya.
--   b. Daftar sumber refleksi yang dihapus dihitung SEKALI ke variabel array, bukan lewat
--      subquery di dalam WHERE. Bentuk lama (`sumber in (select distinct ... from
--      jsonb_array_elements(payload->'pernyataan_rows'))`) menggantungkan biayanya pada rencana
--      yang dipilih planner: kalau subplan-nya tidak di-hash, seluruh array jsonb (yang untuk
--      berkas ini berukuran megabyte) diurai ulang untuk tiap baris kandidat. Dihitung sekali di
--      luar statement, biayanya pasti, tidak lagi bergantung nasib.
--      Importer sekarang juga mengirim payload.pernyataan_sumber eksplisit -- wajib, karena chunk
--      pertama belum tentu memuat semua sumber yang ada di periode itu. Kalau field itu tidak
--      dikirim (pemanggil lama), daftarnya tetap diturunkan dari pernyataan_rows seperti dulu.
--   c. Indeks (sekolah_id, periode_id) untuk keempat tabel, supaya DELETE per periode tidak
--      menyapu seluruh baris sekolah itu. Unique constraint yang ada memang berawalan sekolah_id,
--      tapi periode_id ada di posisi ketiga, jadi tiap DELETE ikut membaca baris periode lain --
--      makin banyak bulan yang sudah masuk, makin mahal, persis sekolah seperti SDIP Al Madani
--      yang riwayat bulannya paling panjang.
--
-- Idempoten, aman dijalankan ulang. Jalankan lewat Supabase SQL Editor (tidak ada CLI di
-- lingkungan ini). Edge Function admin-actions TIDAK perlu redeploy: handleImportKarakter
-- meneruskan payload apa adanya ke RPC tanpa memvalidasi bentuknya.

-- ── 1. Indeks pendukung DELETE per periode ────────────────────────────────────────────────
create index if not exists karakter_skor_sekolah_periode_idx
  on public.karakter_skor (sekolah_id, periode_id);

create index if not exists karakter_skor_indikator_sekolah_periode_idx
  on public.karakter_skor_indikator (sekolah_id, periode_id);

-- Kolom sumber ikut karena DELETE pernyataan memang menyaring per sumber sejak migration
-- 20260810100000.
create index if not exists karakter_pernyataan_ortu_sekolah_periode_sumber_idx
  on public.karakter_pernyataan_ortu (sekolah_id, periode_id, sumber);

create index if not exists karakter_summary_sekolah_periode_idx
  on public.karakter_summary (sekolah_id, periode_id);

-- ── 2. Batas waktu statement untuk service_role ───────────────────────────────────────────
-- service_role tidak pernah dipegang browser (cuma Edge Function server-side), jadi batas waktu
-- longgar di sini tidak membuka jalur penyalahgunaan dari klien. Ini jaring pengaman, BUKAN
-- perbaikan utamanya: perbaikan utamanya memecah statement supaya tetap kecil. Tanpa ini, upload
-- sekolah besar berikutnya tinggal menunggu giliran kena batas yang sama.
-- notify pgrst diperlukan supaya PostgREST memuat ulang setelan role, bukan memakai yang lama.
-- Kalau dua baris ini ditolak "must have admin option on role", lewati saja: bagian 1 dan 3
-- berdiri sendiri dan sudah cukup untuk memperbaiki kegagalannya.
alter role service_role set statement_timeout = '120s';
notify pgrst, 'reload config';

-- ── 3. RPC import: mode ganti/lanjut, daftar sumber dihitung sekali ────────────────────────
-- Salinan dari 20260810100000_karakter_refleksi_multi_sumber.sql dengan perubahan (a) dan (b) di
-- atas. Jalur INSERT keempat tabel tidak berubah sama sekali.
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
  v_sumber text[];
  v_skor_count int;
  v_skor_indikator_count int;
  v_pernyataan_count int;
  v_pernyataan_ortu_count int;
  v_pernyataan_siswa_count int;
  v_summary_count int;
begin
  -- Gerbang tetap sama: is_admin_fammi() bergantung pada auth.uid() yang kosong saat dipanggil
  -- lewat service_role dari admin-actions, jadi auth.role() = 'service_role' dipakai sebagai
  -- jalur sah; panggilan dari browser dengan anon/authenticated tetap wajib AdminFammi.
  if auth.role() <> 'service_role' and not is_admin_fammi() then
    raise exception 'Cuma AdminFammi yang boleh import data karakter.' USING ERRCODE = '42501';
  end if;
  if v_sekolah_id is null or v_periode_id is null then
    raise exception 'payload.sekolah_id dan payload.periode_id wajib diisi.';
  end if;
  if v_mode not in ('ganti', 'lanjut') then
    raise exception 'payload.mode harus ''ganti'' atau ''lanjut'', dapat: %', v_mode;
  end if;

  if v_mode = 'ganti' then
    -- Daftar sumber dihitung SEKALI ke variabel, lalu dipakai sebagai array konstan di WHERE.
    -- pernyataan_sumber yang dikirim importer lebih dipercaya daripada isi pernyataan_rows chunk
    -- ini, karena chunk pertama belum tentu memuat semua sumber periode tersebut.
    -- jsonb_typeof, bukan operator `?`: ini sekaligus menolak field yang ada tapi isinya null
    -- atau bukan array (payload salah bentuk jatuh ke jalur turunan yang aman, bukan error).
    if jsonb_typeof(payload->'pernyataan_sumber') = 'array' then
      select coalesce(array_agg(distinct s), '{}'::text[]) into v_sumber
      from jsonb_array_elements_text(payload->'pernyataan_sumber') as t(s);
    else
      select coalesce(array_agg(distinct coalesce(x->>'sumber', 'orangtua')), '{}'::text[])
      into v_sumber
      from jsonb_array_elements(coalesce(payload->'pernyataan_rows', '[]'::jsonb)) as t(x);
    end if;

    delete from karakter_skor where sekolah_id = v_sekolah_id and periode_id = v_periode_id;
    delete from karakter_skor_indikator where sekolah_id = v_sekolah_id and periode_id = v_periode_id;

    -- Pernyataan dihapus HANYA untuk sumber yang hadir di berkas, bukan seluruh periode.
    -- Alasannya (dari migration 20260810100000): satu periode bisa diisi lewat beberapa berkas.
    -- Berkas yang cuma memuat sheet detail_pernyataan_siswa tidak boleh menghapus refleksi orang
    -- tua yang sudah masuk dari berkas sebelumnya, dan sebaliknya. Kalau tidak ada sumber sama
    -- sekali (berkas skor-saja), tidak ada pernyataan yang dihapus.
    if array_length(v_sumber, 1) is not null then
      delete from karakter_pernyataan_ortu
       where sekolah_id = v_sekolah_id and periode_id = v_periode_id
         and sumber = any(v_sumber);
    end if;

    delete from karakter_summary where sekolah_id = v_sekolah_id and periode_id = v_periode_id;
  end if;

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

  -- Satu insert untuk semua sumber; hitungan per sumber diambil dari RETURNING lewat CTE.
  -- coalesce(x.sumber, 'orangtua') menjaga payload lama (tanpa field sumber) tetap sah.
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

  -- Field 'pernyataan' dipertahankan (total semua sumber) supaya pemanggil lama tidak pecah;
  -- 'mode' ditambahkan supaya log admin bisa membedakan chunk pertama dari lanjutannya.
  return jsonb_build_object(
    'ok', true, 'periode_id', v_periode_id, 'mode', v_mode,
    'skor', v_skor_count, 'skor_indikator', v_skor_indikator_count,
    'pernyataan', v_pernyataan_count,
    'pernyataan_orangtua', v_pernyataan_ortu_count,
    'pernyataan_siswa', v_pernyataan_siswa_count,
    'summary', v_summary_count
  );
end;
$$;

grant execute on function public.import_karakter_periode(jsonb) to authenticated;
