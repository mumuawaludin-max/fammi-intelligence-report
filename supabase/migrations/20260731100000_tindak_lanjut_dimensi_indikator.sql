-- Kartu "Tindak Lanjut yang Perlu Dilakukan" di dashboard Laporan Lembaga SC (section 01-C/02-C)
-- menampilkan satu kartu per DIMENSI (4 corak budaya + 5 subdimensi kesejahteraan), bukan per
-- rekomendasi prioritas seperti Antrian pimpinan biasa. Field "Indikator Keberhasilan" dan "Hal
-- yang Perlu Diwaspadai" SELALU kosong sejak desain ini dibuat -- bukan bug, memang tidak ada
-- kolom database untuk itu (lihat catatan lama di sc.types.ts RadarBudayaPoint/
-- SubdimensiKesejahteraan: "indicators/warnings DATA GAP MURNI").
--
-- Masalah kedua yang ditemukan bareng ini: pencocokan tindak_lanjut ke satu dimensi
-- (cocokkanTlKeLabel di useScData.js) SEBELUMNYA cuma substring-match nama dimensi ke dalam
-- title/teaser/mengapa_data/mengapa_perspektif -- rapuh, dan skema lama cuma mewajibkan
-- "minimal 1 perlu_perhatian + 1 pertahankan" per role (bisa cuma 2 item total), jadi banyak
-- dari 4+5 dimensi TIDAK PERNAH dapat rekomendasi yang cocok sama sekali.
--
-- Perbaikan: tambah kolom "dimensi" (exact match ke kode dimensi, mis. "orientasi",
-- "kepuasan_kepemimpinan") supaya pencocokan tidak lagi bergantung tebak-tebak teks, plus dua
-- kolom baru utk konten yang sebelumnya data gap. Nullable tanpa default -- baris Karakter yang
-- sudah ada (tabel ini generik, dipakai bareng Karakter) otomatis tetap null, tidak terdampak.
alter table public.tindak_lanjut add column if not exists dimensi text;
alter table public.tindak_lanjut add column if not exists indikator_keberhasilan jsonb;
alter table public.tindak_lanjut add column if not exists hal_diwaspadai jsonb;
