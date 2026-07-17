-- Idempotensi import Rapor Karakter.
--
-- Tanpa unique constraint, upload ulang file yang sama (atau file baru yang periodenya
-- tumpang tindih dengan yang sudah pernah masuk) menggandakan seluruh baris skor/pernyataan
-- murid di karakter_skor, karakter_skor_indikator, dan karakter_pernyataan_ortu. Ini akar dari
-- keluhan "angka kartu, angka detail, dan angka di teks tindak lanjut beda-beda", karena
-- rata-rata yang dihitung dari detail berubah bobotnya sementara karakter_summary tidak.
--
-- web/src/pages/admin/importers/karakterImporter.js sudah diubah untuk upsert ke tiga tabel
-- ini (menyamakan pola dengan karakter_summary yang sudah lama begini). Upsert onConflict
-- BUTUH constraint ini ada dulu di database -- tanpanya, Postgres menolak dengan error
-- "no unique or exclusion constraint matching the ON CONFLICT specification" dan import akan
-- gagal total sampai migration ini dijalankan.
--
-- PENTING SEBELUM MENJALANKAN INI DI PRODUKSI:
-- 1. Backup/snapshot database dulu. Migration ini MENGHAPUS baris duplikat yang mungkin
--    sudah terlanjur ada dari upload berulang sebelumnya (menyisakan satu baris per
--    kombinasi kunci, dipilih lewat ctid -- bukan berdasar timestamp, karena tabel-tabel ini
--    tidak punya kolom created_at yang bisa dipakai untuk memastikan mana yang "terbaru").
-- 2. Review dulu berapa baris yang akan terhapus (jalankan versi SELECT COUNT(*) dari WHERE
--    yang sama sebelum DELETE sungguhan) supaya tidak ada kejutan.
-- 3. Jalankan lewat Supabase SQL Editor atau `supabase db push`. Tidak dijalankan otomatis
--    oleh kode ini -- perlu tindakan manual pemilik database.

-- ── karakter_skor: satu baris per (sekolah, murid, periode, aspek) ─────────────────────────
delete from public.karakter_skor a
using public.karakter_skor b
where a.ctid < b.ctid
  and a.sekolah_id = b.sekolah_id
  and a.murid_id = b.murid_id
  and a.periode_id = b.periode_id
  and a.aspek_kode = b.aspek_kode;

alter table public.karakter_skor
  add constraint karakter_skor_sekolah_murid_periode_aspek_key
  unique (sekolah_id, murid_id, periode_id, aspek_kode);

-- ── karakter_skor_indikator: satu baris per (sekolah, murid, periode, aspek, indikator) ────
delete from public.karakter_skor_indikator a
using public.karakter_skor_indikator b
where a.ctid < b.ctid
  and a.sekolah_id = b.sekolah_id
  and a.murid_id = b.murid_id
  and a.periode_id = b.periode_id
  and a.aspek_kode = b.aspek_kode
  and a.indikator_kode = b.indikator_kode;

alter table public.karakter_skor_indikator
  add constraint karakter_skor_indikator_sekolah_murid_periode_aspek_ind_key
  unique (sekolah_id, murid_id, periode_id, aspek_kode, indikator_kode);

-- ── karakter_pernyataan_ortu: satu baris per (sekolah, murid, periode) ─────────────────────
-- Asumsi: satu pernyataan orang tua per murid per bulan. Kalau sekolah ternyata membolehkan
-- beberapa submission per bulan per anak, constraint ini KELIRU dan harus disesuaikan --
-- ini keputusan produk sejenis "parameter terbuka" di CLAUDE.md, bukan sesuatu yang aman
-- ditebak dari kode importer saja. Konfirmasi ke pemilik produk sebelum menjalankan kalau ragu.
delete from public.karakter_pernyataan_ortu a
using public.karakter_pernyataan_ortu b
where a.ctid < b.ctid
  and a.sekolah_id = b.sekolah_id
  and a.murid_id = b.murid_id
  and a.periode_id = b.periode_id;

alter table public.karakter_pernyataan_ortu
  add constraint karakter_pernyataan_ortu_sekolah_murid_periode_key
  unique (sekolah_id, murid_id, periode_id);
