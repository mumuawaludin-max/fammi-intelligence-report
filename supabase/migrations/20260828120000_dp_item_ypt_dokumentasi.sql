-- Dokumentasi Kegiatan YPT: kolom baru + isi awal dari Google Drive dan spreadsheet rekaman.
--
-- ── Kenapa ada dua kolom baru ────────────────────────────────────────────────────────────────
-- 1. `sekolah_nama text[]`, bukan cuma `sekolah_id`.
--    Satu rekaman sosialisasi sering mencakup BEBERAPA sekolah sekaligus (mis. rekaman 13 Maret
--    2026 dipakai TK Telkom Makassar, SMK Telkom 1 Medan, dan TK Telkom Padang), jadi kolom
--    tunggal `sekolah_id` tidak cukup. Bentuknya sama persis dengan cs_testimoni.kategori yang
--    juga dinaikkan jadi text[] karena alasan yang sama.
--    Dipakai NAMA, bukan id ber-FK: daftar sekolah di spreadsheet berisi 26 sekolah Telkom,
--    jauh lebih banyak dari yang punya baris di `schools`. Memaksakan FK berarti membuang
--    rekaman sekolah yang belum terdaftar, padahal rekamannya ada dan yayasan berhak melihatnya.
--    `sekolah_id` TETAP ADA dan boleh diisi kalau sekolahnya memang terdaftar.
--
-- 2. `kategori text`.
--    Dokumentasi Telkom punya dua babak yang berbeda maknanya bagi yayasan: "Sosialisasi"
--    (Maret-April 2026, memperkenalkan program) dan "Pelaporan" (Agustus 2026, memaparkan hasil).
--    Tanpa kolom ini keduanya tercampur di satu deret dan tidak bisa disaring.
--
-- ── Kenapa foto disimpan sebagai URL Drive, bukan diunggah ke Storage ────────────────────────
-- Berkas fotonya sudah dibagikan "siapa saja dengan link" di Drive dan bisa dipasang langsung
-- lewat https://drive.google.com/thumbnail?id=...  (diuji di browser: berhasil, 1200x675).
-- Menyalinnya ke bucket Storage berarti menggandakan berkas yang sudah publik tanpa manfaat.
-- Kolom `url` memang sudah mengizinkan URL penuh; MediaEmbed.fotoUrl meneruskan apa adanya
-- kalau nilainya diawali http.
--
-- CATATAN LAJU: Drive membalas HTTP 500 kalau banyak gambar diminta serentak (terbukti saat
-- pengujian: enam permintaan sekaligus gagal semua, satu per satu berhasil). Galeri di
-- DokumentasiPage karena itu memuat bertahap dan mencoba ulang; jangan diubah jadi muat serentak.

alter table public.dp_item add column if not exists sekolah_nama text[];
alter table public.dp_item add column if not exists kategori     text;

comment on column public.dp_item.sekolah_nama is
  'Nama sekolah yang tercakup item ini, apa adanya dari sumber. Banyak rekaman mencakup lebih '
  'dari satu sekolah, dan tidak semua sekolah Telkom terdaftar di tabel schools.';
comment on column public.dp_item.kategori is
  'Babak kegiatan: Sosialisasi (Mar-Apr 2026) atau Pelaporan (Ags 2026). Dipakai sebagai saringan.';

create index if not exists dp_item_kategori_idx on public.dp_item (yayasan_id, kategori);

-- ── Isi awal ────────────────────────────────────────────────────────────────────────────────
-- Idempoten: baris lama yayasan ini dihapus dulu, lalu ditulis ulang. Aman karena dp_item BELUM
-- pernah diisi lewat jalur lain untuk yayasan ini (menu Dokumentasi masih kosong di produksi).
-- Kalau nanti ada item yang ditambahkan manual lewat CMS, JANGAN jalankan ulang blok ini apa
-- adanya; hapus per-url saja.
delete from public.dp_item where yayasan_id = 'YAY-PENDIDIKAN-TELKOM';

-- ── 1. Rekaman YouTube (23 item) ────────────────────────────────────────────────────────────
-- Sumber: spreadsheet "Rekaman" milik pemilik produk, sheet pertama.
-- Semua tautan berbentuk youtube.com/live/<id>; youtubeId() di MediaEmbed.jsx sudah menangani
-- bentuk /live/ lewat pola umum, dan thumbnail diturunkan dari id-nya.
insert into public.dp_item (yayasan_id, jenis, kategori, judul, url, tanggal, sekolah_nama, urutan)
values
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Sistem Digital Rapor Karakter Sekolah Telkom', 'https://www.youtube.com/live/UoDBkQUutRk', '2026-03-12', array['SMK Telkom Lampung'], 1),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Sistem Digital Rapor Karakter Sekolah Telkom', 'https://www.youtube.com/live/o1mixhafFKQ', '2026-03-13', array['TK Telkom Makassar','SMK Telkom 1 Medan','TK Telkom Padang'], 2),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Sistem Digital Rapor Karakter Sekolah', 'https://www.youtube.com/live/fDDO0ZtYGFI', '2026-03-13', array['SMK Telkom Purwokerto'], 3),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Sistem Digital Rapor Karakter Sekolah Telkom', 'https://www.youtube.com/live/Y-dVVdPYkbY', '2026-03-17', array['TK Telkom Dayeuhkolot'], 4),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Sistem Digital Rapor Karakter Sekolah Telkom', 'https://www.youtube.com/live/0mKudmDH6a4', '2026-03-25', array['TK Telkom Banjarbaru'], 5),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Sistem Digital Rapor Karakter Sekolah Telkom', 'https://www.youtube.com/live/gKtPrvHjZCE', '2026-03-26', array['SMK Telkom Makassar'], 6),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Sistem Digital Rapor Karakter Sekolah Telkom', 'https://www.youtube.com/live/36iUhDJCgCo', '2026-03-27', array['TK Telkom Buah Batu'], 7),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Sistem Digital Rapor Karakter Sekolah Telkom', 'https://www.youtube.com/live/OIRhGfUPrOQ', '2026-04-02', array['SD Telkom Makassar','SMP Telkom Purwokerto'], 8),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Sistem Digital Rapor Karakter Sekolah Telkom', 'https://www.youtube.com/live/I2wBk2wz3qk', '2026-04-06', array['SMP Telkom Makassar'], 9),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Rapor Karakter Telkom School', 'https://www.youtube.com/live/favJKuZoSxY', '2026-04-07', array['SMA Telkom Bandung','TK Telkom Ternate'], 10),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Rapor Karakter Telkom School', 'https://www.youtube.com/live/AsBOr4w-KbE', '2026-04-08', array['SMK Telkom Bandung'], 11),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Rapor Karakter SMK Telkom Jakarta', 'https://www.youtube.com/live/h6oBuXg_g98', '2026-04-14', array['SMK Telkom Jakarta'], 12),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Rapor Karakter Telkom School', 'https://www.youtube.com/live/4XDh7w3zmQM', '2026-04-15', array['TK Telkom Batam','SMP Telkom Padang'], 13),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Sosialisasi', 'Sosialisasi Program Rapor Karakter Telkom School', 'https://www.youtube.com/live/9d-sw4oE3tM', '2026-04-16', array['SD Telkom Padang'], 14),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Pelaporan', 'Pelaporan dan Persiapan Rapor Karakter SMK Telkom Makassar', 'https://www.youtube.com/live/_JffNS_afsw', '2026-08-13', array['SMK Telkom Makassar'], 15),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Pelaporan', 'Pelaporan dan Persiapan Rapor Karakter SMK Pariwisata Telkom Bandung', 'https://www.youtube.com/live/rsByBPZ7Csw', '2026-08-14', array['SMK Pariwisata Telkom Bandung'], 16),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Pelaporan', 'Pelaporan dan Persiapan Rapor Karakter SMK Telkom Purwokerto', 'https://www.youtube.com/live/m0O2KOkehRg', '2026-08-19', array['SMK Telkom Purwokerto'], 17),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Pelaporan', 'Pelaporan dan Persiapan Rapor Karakter TK Telkom Buah Batu', 'https://www.youtube.com/live/dG77yYwbASk', '2026-08-20', array['TK Telkom Buah Batu'], 18),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Pelaporan', 'Pelaporan dan Persiapan Rapor Karakter SMA Telkom Bandung', 'https://www.youtube.com/live/vv525M01Qx0', '2026-08-20', array['SMA Telkom Bandung'], 19),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Pelaporan', 'Pelaporan dan Persiapan Rapor Karakter SMK Telkom Bandung', 'https://www.youtube.com/live/Q3I3qkQvxbs', '2026-08-20', array['SMK Telkom Bandung'], 20),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Pelaporan', 'Pelaporan dan Persiapan Rapor Karakter SMK Telkom Banjarbaru', 'https://www.youtube.com/live/6nfX8QDw7Ng', '2026-08-21', array['SMK Telkom Banjarbaru'], 21),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Pelaporan', 'Pelaporan dan Persiapan Rapor Karakter SMK Telkom 1 Medan', 'https://www.youtube.com/live/7lJB65MDZa8', '2026-08-21', array['SMK Telkom 1 Medan'], 22),
  ('YAY-PENDIDIKAN-TELKOM', 'video', 'Pelaporan', 'Pelaporan dan Persiapan Rapor Karakter SD Telkom Padang', 'https://www.youtube.com/live/ocFFAZX6m3s', '2026-08-26', array['SD Telkom Padang'], 23);

-- ── 2. Foto kegiatan (20 item, 4 sekolah) ───────────────────────────────────────────────────
-- Sumber: folder Drive "Dokumentasi Kegiatan" milik pemilik produk.
--
-- HANYA empat sekolah ini yang benar-benar punya berkas foto. Folder untuk SMK Telkom 2 Medan,
-- TK Telkom Buahbatu, dan SMK Telkom Malang ADA tapi ISINYA KOSONG; SMK Pariwisata Telkom
-- Bandung dan SMK Telkom Purwokerto cuma berisi subfolder contoh rapor, bukan foto kegiatan.
-- Sesuai permintaan: yang ditampilkan hanya yang memang ada fotonya.
insert into public.dp_item (yayasan_id, jenis, kategori, judul, url, tanggal, sekolah_nama, urutan)
values
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Padang', 'https://drive.google.com/thumbnail?id=1yLUJHkwPHjpejiO5m7uoJ4LwtLyCRFOM&sz=w1600', '2026-03-13', array['TK Telkom Padang'], 1),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Padang', 'https://drive.google.com/thumbnail?id=1hbQQmWG0tVftUvDN2krfg95gZmBNHLAM&sz=w1600', '2026-03-13', array['TK Telkom Padang'], 2),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Padang', 'https://drive.google.com/thumbnail?id=1DKOTXikY3o3XUqu4slGK74olF63cY5Gt&sz=w1600', '2026-03-13', array['TK Telkom Padang'], 3),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Padang', 'https://drive.google.com/thumbnail?id=1MUl1fpsJnGVAq4LzmKBoRVjujCvHxrou&sz=w1600', '2026-03-13', array['TK Telkom Padang'], 4),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Padang', 'https://drive.google.com/thumbnail?id=1fAkpkvMSsNjs0G3dl2TeclxYLOTOuFx5&sz=w1600', '2026-03-13', array['TK Telkom Padang'], 5),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1B8NxVgS90yUyuJv4rC8o4ZN96cLDO0rI&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 6),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1q5uFFwcYNEHy36HXib8Ex12CrOYf06da&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 7),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1JkPCIy9r_Qi3w2mjM94Ao7P__VID_lgB&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 8),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1wr0kJQ-d1HWbu3XpNw5icv9A9aQzUQ4q&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 9),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1f9ntCfe2lbMwxj1zHlAIPn1HaWxim_58&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 10),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1eG8xClIcw75z_WscDJ52TciL_HO36tl2&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 11),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=12OXxbS3QnjjjHsEP305OZm4MpGbGwIU6&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 12),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1Ri-MD3b7HknIzxBpzmTbsXu-3uMx7pLD&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 13),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1EDgYinh-j-zAD_drQegU7htmBuBBTHlf&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 14),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1e2padPFqHPMw8nnqdsLjLBmIklGoKZNJ&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 15),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1cbIhySFL98J1dJKdjwwcf9AoQqfI3Uh0&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 16),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter TK Telkom Makassar', 'https://drive.google.com/thumbnail?id=1Xc4p3BAOT7E9WHTDTljvYSc5TtPsNCZo&sz=w1600', '2026-03-13', array['TK Telkom Makassar'], 17),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter SD Telkom Makassar', 'https://drive.google.com/thumbnail?id=1YGErgzHJjS_e-y14OpHQHqG7oDmt8x0L&sz=w1600', '2026-04-02', array['SD Telkom Makassar'], 18),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Sosialisasi', 'Sosialisasi Rapor Karakter SD Telkom Makassar', 'https://drive.google.com/thumbnail?id=1mfrvyVXZ3uiaOFq_9jL9KMJWiqehCN4K&sz=w1600', '2026-04-14', array['SD Telkom Makassar'], 19),
  ('YAY-PENDIDIKAN-TELKOM', 'foto', 'Pelaporan', 'Paparan Hasil Rapor Karakter SMK Telkom Bandung', 'https://drive.google.com/thumbnail?id=1dZ7X3mclQmgKWOkJqJowngCiCO2wU-oX&sz=w1600', '2026-08-20', array['SMK Telkom Bandung'], 20);

-- ── 3. Contoh rapor (5 PDF, 3 sekolah) ──────────────────────────────────────────────────────
-- Berkas ini terpisah dari foto kegiatan: isinya contoh rapor hasil program, bukan dokumentasi
-- acara. Ditampilkan sebagai section sendiri atas persetujuan pemilik produk.
-- URL memakai bentuk /view supaya fileEmbedUrl() di MediaEmbed.jsx mengubahnya jadi /preview.
insert into public.dp_item (yayasan_id, jenis, judul, url, tanggal, sekolah_nama, urutan)
values
  ('YAY-PENDIDIKAN-TELKOM', 'file', 'Contoh Rapor Siswa', 'https://drive.google.com/file/d/19Ak1-8CPyc3jUHTo4KuzuzrAKjD3L5zD/view', '2026-03-13', array['TK Telkom Makassar'], 1),
  ('YAY-PENDIDIKAN-TELKOM', 'file', 'Contoh Rapor Wali Kelas', 'https://drive.google.com/file/d/1GyBwM_GlhVQSvsVmP01JyylcsLIek8Eb/view', '2026-03-13', array['TK Telkom Makassar'], 2),
  ('YAY-PENDIDIKAN-TELKOM', 'file', 'Contoh Rapor Siswa', 'https://drive.google.com/file/d/1WZDM17YEQsCywq6uTSbS3249h2Dtyb4Q/view', '2026-03-13', array['SMK Telkom Purwokerto'], 3),
  ('YAY-PENDIDIKAN-TELKOM', 'file', 'Contoh Rapor Wali Kelas', 'https://drive.google.com/file/d/1ASCVGMT0az1waHKBClEqAO88hbgDMlOZ/view', '2026-03-13', array['SMK Telkom Purwokerto'], 4),
  ('YAY-PENDIDIKAN-TELKOM', 'file', 'Contoh Rapor Siswa', 'https://drive.google.com/file/d/1DC9kOYnwnycpRKCpx51BLfKYUaDn6J8D/view', '2026-04-01', array['SD Telkom Makassar'], 5);
