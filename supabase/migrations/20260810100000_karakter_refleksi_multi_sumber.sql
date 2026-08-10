-- Rapor Karakter multi-sumber refleksi: refleksi siswa berdampingan dengan refleksi orang tua.
--
-- Latar: sampai sekarang satu murid punya paling banyak satu baris refleksi per periode, dan
-- baris itu selalu berasal dari orang tua (nama tabel karakter_pernyataan_ortu lahir dari
-- asumsi itu). File SMK Telkom Purwokerto membawa sheet kedua, detail_pernyataan_siswa, dengan
-- struktur kolom sejajar tapi respondennya murid itu sendiri. Tanpa perubahan ini, dua sumber
-- untuk murid dan periode yang sama saling menimpa karena unique constraint lama mengunci
-- (sekolah_id, murid_id, periode_id).
--
-- Sifat perubahan: penambahan, bukan penggantian. Tidak ada rename tabel maupun kolom lama.
-- Sekolah yang cuma punya refleksi orang tua tetap berjalan apa adanya: kolom baru `sumber`
-- punya default 'orangtua' sehingga seluruh baris lama valid tanpa backfill manual, dan payload
-- RPC lama (tanpa field sumber) tetap diterima lewat coalesce.
--
-- Risiko yang ditutup:
-- 1. Tabrakan data antar sumber. Unique baru menyertakan `sumber`, jadi refleksi orang tua dan
--    refleksi siswa untuk murid dan periode yang sama hidup berdampingan, bukan saling menimpa.
-- 2. Hilangnya refleksi sumber lain saat upload parsial. Delete pernyataan di RPC sekarang
--    dibatasi pada sumber yang benar-benar hadir di payload. Upload file skor-saja, atau file
--    yang cuma berisi satu sumber, tidak lagi mengosongkan refleksi sumber lain di periode yang
--    sama. Ini perubahan perilaku yang disengaja; alasannya ditulis ulang di dekat statement.
-- 3. Salah tafsir kolom `emosi_anak`. Maknanya beda per sumber (penilaian pihak ketiga vs lapor
--    diri), dan itu sekarang tercatat di comment kolom, bukan cuma di kepala orang.
--
-- Idempoten: seluruh statement aman dijalankan dua kali. Dijalankan manual lewat Supabase SQL
-- Editor (tidak ada CLI di lingkungan ini).
--
-- Edge Function admin-actions tidak perlu redeploy: handleImportKarakter meneruskan `payload`
-- apa adanya ke RPC tanpa memvalidasi bentuk item (supabase/functions/admin-actions/index.ts).

-- ── 1. Kolom sumber ────────────────────────────────────────────────────────────────────────
-- Default 'orangtua' membuat semua baris lama langsung valid dan not null aman ditegakkan.
alter table public.karakter_pernyataan_ortu
  add column if not exists sumber text not null default 'orangtua';

-- ── 2. Check constraint nilai sumber ───────────────────────────────────────────────────────
-- Drop dulu supaya bisa dijalankan ulang; daftar nilai sengaja tertutup, sumber baru (misal
-- guru) harus lewat migration sendiri supaya jalur baca ikut disesuaikan.
alter table public.karakter_pernyataan_ortu
  drop constraint if exists karakter_pernyataan_ortu_sumber_check;

alter table public.karakter_pernyataan_ortu
  add constraint karakter_pernyataan_ortu_sumber_check
  check (sumber in ('orangtua', 'siswa'));

-- ── 3. Lepas unique lama ───────────────────────────────────────────────────────────────────
-- Dibuat di 20260707120000_karakter_unique_constraints.sql baris 65-66, mengunci satu baris per
-- (sekolah, murid, periode). Itu yang membuat refleksi siswa menimpa refleksi orang tua.
alter table public.karakter_pernyataan_ortu
  drop constraint if exists karakter_pernyataan_ortu_sekolah_murid_periode_key;

-- ── 4. Unique baru, per sumber ─────────────────────────────────────────────────────────────
-- Kalau ADD di bawah gagal dengan "could not create unique index", artinya sudah ada duplikat
-- (sekolah, murid, periode) di tabel, yaitu migration 20260707120000 belum pernah dijalankan di
-- database ini. Bersihkan dulu dengan pola delete ... using ... where a.ctid < b.ctid dari
-- berkas tersebut (baris 57-62), baru jalankan ulang migration ini.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.karakter_pernyataan_ortu'::regclass
      and conname = 'karakter_pernyataan_sekolah_murid_periode_sumber_key'
  ) then
    alter table public.karakter_pernyataan_ortu
      add constraint karakter_pernyataan_sekolah_murid_periode_sumber_key
      unique (sekolah_id, murid_id, periode_id, sumber);
  end if;
end $$;

-- ── 5. Dokumentasi tabel dan kolom ─────────────────────────────────────────────────────────
comment on table public.karakter_pernyataan_ortu is
  'Refleksi naratif per murid per periode untuk modul Rapor Karakter. Akhiran _ortu pada nama '
  'tabel adalah peninggalan dari masa sebelum multi-sumber, ketika satu-satunya responden '
  'adalah orang tua. Nama sengaja TIDAK di-rename supaya policy RLS, RPC import_karakter_periode, '
  'query di web/src/pages/karakter/useKarakterData.js, dan pipeline Gemini di hulu tidak perlu '
  'dirombak. Isi tabel sekarang mencakup semua sumber refleksi; bedakan lewat kolom sumber.';

comment on column public.karakter_pernyataan_ortu.sumber is
  'Responden refleksi: orangtua atau siswa. Default orangtua supaya baris lama dan payload '
  'importer lama tetap valid tanpa backfill.';

comment on column public.karakter_pernyataan_ortu.emosi_anak is
  'Perasaan anak pada periode ini. Maknanya beda per sumber: sumber=orangtua berarti penilaian '
  'pihak ketiga (orang tua menilai perasaan anaknya), sumber=siswa berarti lapor diri (murid '
  'melaporkan perasaannya sendiri). Jangan gabungkan dua sumber ini jadi satu agregat tanpa '
  'label; label tampilannya diatur di web/src/pages/karakter/karakterMeta.js (REFLEKSI_META).';

-- ── 6. RPC import: terima kolom sumber, delete per sumber ──────────────────────────────────
-- Salinan dari 20260712140000_fix_import_karakter_service_role_check.sql dengan tiga perubahan:
-- delete pernyataan dibatasi per sumber, jsonb_to_recordset dan insert menerima kolom sumber,
-- dan hasil balik menambah hitungan per sumber. Jalur skor, skor_indikator, dan summary tidak
-- berubah sedikit pun.
--
-- Pengecekan pemanggil tetap sama: is_admin_fammi() bergantung pada auth.uid() yang kosong saat
-- dipanggil lewat service_role dari admin-actions, jadi auth.role() = 'service_role' dipakai
-- sebagai jalur sah; panggilan dari browser dengan anon/authenticated tetap wajib AdminFammi.
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

  delete from karakter_skor where sekolah_id = v_sekolah_id and periode_id = v_periode_id;
  delete from karakter_skor_indikator where sekolah_id = v_sekolah_id and periode_id = v_periode_id;

  -- Pernyataan dihapus HANYA untuk sumber yang hadir di payload, bukan seluruh periode.
  -- Alasannya: satu periode bisa diisi lewat beberapa berkas. File yang cuma memuat sheet
  -- detail_pernyataan_siswa tidak boleh menghapus refleksi orang tua yang sudah masuk dari
  -- berkas sebelumnya, dan sebaliknya. Kalau pernyataan_rows kosong (file skor-saja), tidak ada
  -- pernyataan yang dihapus sama sekali. Idempotensi upload ulang tetap terjaga karena berkas
  -- yang sama membawa sumber yang sama, jadi baris lamanya tetap tergantikan.
  delete from karakter_pernyataan_ortu
   where sekolah_id = v_sekolah_id and periode_id = v_periode_id
     and sumber in (
       select distinct coalesce(x->>'sumber', 'orangtua')
       from jsonb_array_elements(coalesce(payload->'pernyataan_rows', '[]'::jsonb)) x);

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

  -- Satu insert untuk semua sumber; hitungan per sumber diambil dari RETURNING lewat CTE,
  -- bukan dua insert terpisah, supaya perilaku dan urutan tulis tetap sama seperti sebelumnya.
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
  -- dua field baru cuma tambahan untuk log admin di CMS.
  return jsonb_build_object(
    'ok', true, 'periode_id', v_periode_id,
    'skor', v_skor_count, 'skor_indikator', v_skor_indikator_count,
    'pernyataan', v_pernyataan_count,
    'pernyataan_orangtua', v_pernyataan_ortu_count,
    'pernyataan_siswa', v_pernyataan_siswa_count,
    'summary', v_summary_count
  );
end;
$$;
