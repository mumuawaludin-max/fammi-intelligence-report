-- Kategori testimoni Citra Sekolah: satu kolom teks menjadi array label.
--
-- Alasan, dari verifikasi langsung spreadsheet sumber (14.754 baris, 2026-08-27):
--   1. Kolom "Kategori" di form MULTI-PILIH. Sekitar 39% baris membawa dua sampai empat label
--      sekaligus dalam satu sel ("Harapan, Ucapan Terimakasih"). Satu kolom teks tidak bisa
--      menampung itu tanpa kehilangan informasi.
--   2. Taksonomi yang dipakai skema lama tidak pernah ada di data. Label atomik yang benar-benar
--      muncul cuma lima: Ucapan Terimakasih (12.063), Harapan (4.807), Saran dan Masukan (3.250),
--      Keluhan (992), Kritik (130). Tidak ada "Apresiasi" maupun "KritikKeluhan".
--
-- Akibat sebelum perbaikan: sinkronisasi mencocokkan seluruh isi sel ke peta kategori dan
-- menjatuhkan yang tidak cocok ke "Apresiasi", sehingga sekitar 13.600 dari 14.754 baris menumpuk
-- di satu kategori. Donut empat kartu di dashboard Citra Sekolah karena itu tidak bermakna.
--
-- Nilai lama TIDAK dipetakan ulang ke taksonomi baru di sini. Percuma: nilainya sudah hasil
-- penjatuhan default, jadi tidak bisa dibedakan mana "Apresiasi" yang memang Ucapan Terimakasih
-- dan mana yang sebenarnya Keluhan. Yang lama dibungkus apa adanya jadi array satu elemen supaya
-- tabel tidak pernah kosong di tengah jalan, lalu SELURUHNYA tertimpa nilai benar begitu
-- sinkronisasi dijalankan lagi (upsert on conflict row_hash menimpa kolom kategori, dan row_hash
-- tidak ikut berubah karena rumusnya tetap waktu|sekolah|nama|teks).
--
-- Prasyarat: 20260825130000_ypt_kp_testimoni_dokumentasi sudah jalan.
-- Setelah migrasi ini: deploy ulang Edge Function sync-ypt-sheets, lalu jalankan sinkronisasi
-- sumber "testimoni" dari Admin CMS.

do $$
begin
  -- Idempotent: kalau kolomnya sudah bertipe array, migrasi ini sudah pernah jalan.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'cs_testimoni'
      and column_name  = 'kategori'
      and data_type   <> 'ARRAY'
  ) then
    alter table public.cs_testimoni rename column kategori to kategori_lama;
    alter table public.cs_testimoni add column kategori text[] not null default '{}';

    update public.cs_testimoni
       set kategori = case
             when coalesce(btrim(kategori_lama), '') = '' then '{}'::text[]
             else array[btrim(kategori_lama)]
           end;

    alter table public.cs_testimoni drop column kategori_lama;
  end if;
end $$;

comment on column public.cs_testimoni.kategori is
  'Daftar label kategori testimoni, multi-pilih. Nilai kanonik: Terimakasih | Harapan | '
  'SaranMasukan | Keluhan | Kritik. Label di luar daftar itu dilewatkan apa adanya oleh '
  'sync-ypt-sheets supaya opsi form baru terlihat di dashboard, bukan tenggelam di kategori lain. '
  'Array kosong berarti responden tidak memilih kategori apa pun.';

-- Dipakai kalau nanti penyaringan kategori dipindah ke sisi SQL. Saat ini dashboard menyaring di
-- klien (satu periode ditarik sekaligus untuk word cloud dan daftar detail), jadi indeks ini
-- belum terpakai; biayanya kecil dan memasangnya sekarang menghindari migrasi susulan.
create index if not exists cs_testimoni_kategori_idx
  on public.cs_testimoni using gin (kategori);

-- ══ Penulis testimoni: orang tua atau siswa sendiri ═════════════════════════════════════════
-- Kolom Nama di spreadsheet membawa penanda yang selama ini tidak dipakai. Orang tua menulis
-- "Orangtua <nama anak>", siswa menulis namanya sendiri tanpa awalan ("HANIF KHADAFI").
-- Diverifikasi terhadap 13.013 baris (2026-08-27): 5.376 orangtua, 7.637 siswa, tanpa nama
-- kosong. Sebarannya masuk akal, seluruh TK dan SD murni orang tua sedangkan SMP dan SMK
-- sebagian besar siswa, jadi ini konvensi form yang benar-benar dipegang, bukan kebetulan.
--
-- Diturunkan di Edge Function (normalSumber) lalu disimpan, bukan diurai ulang tiap kali dibaca.
-- FIR membaca kolom yang sudah final, sesuai kontrak baca di CLAUDE.md.
--
-- null berarti baris tersimpan sebelum kolom ini ada, atau kolom Nama kosong. Dashboard
-- menurunkannya sendiri dari nama untuk baris seperti itu, sebagai jembatan sampai sinkronisasi
-- berikutnya mengisinya.
alter table public.cs_testimoni
  add column if not exists sumber text
  check (sumber is null or sumber in ('orangtua', 'siswa'));

comment on column public.cs_testimoni.sumber is
  'Penulis testimoni: orangtua | siswa. Diturunkan dari awalan kolom Nama di spreadsheet oleh '
  'sync-ypt-sheets. null = baris lama sebelum kolom ini ada, atau nama kosong.';

create index if not exists cs_testimoni_sumber_idx
  on public.cs_testimoni (sekolah_id, periode_id, sumber) where tampilkan;
