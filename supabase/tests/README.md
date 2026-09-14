# Uji migration di Postgres lokal

Migration di repo ini dijalankan manual lewat Supabase SQL Editor, jadi kesalahan SQL baru
ketahuan saat pemilik database menjalankannya. Dua kesalahan pada migration
`20260828110000_karakter_kerangka_per_jenjang.sql` lolos review dan baru muncul di sana
(`operator does not exist: name[] = text[]`, lalu `CREATE OR REPLACE VIEW` yang tidak boleh
menyisipkan kolom di tengah). Folder ini supaya itu tidak terulang.

`karakter_kerangka_baseline.sql` adalah replika keadaan produksi SEBELUM migration: tabel
Karakter, kedua tabel config beserta unique gaya lama (satu berbentuk constraint, satu berbentuk
index telanjang, karena keduanya sama-sama mungkin dibuat lewat SQL Editor), helper `auth.role()`
/ `is_admin_fammi()` / `my_yayasan_school_ids()`, role `authenticated`/`anon`/`service_role`, view
dan matview yang akan disentuh, plus data satu sekolah berkerangka tunggal untuk mengukur regresi.

`karakter_kerangka_verify.sql` memeriksa perilakunya sesudah migration, bukan cuma "SQL-nya jalan".

Jalankan (butuh Docker):

```bash
cd supabase/tests
docker run -d --name fir-pgtest -e POSTGRES_PASSWORD=x -e POSTGRES_DB=fir postgres:15
until docker exec fir-pgtest pg_isready -U postgres -d fir; do :; done
export MSYS_NO_PATHCONV=1   # Git Bash di Windows, kalau tidak path /tmp diterjemahkan
docker cp karakter_kerangka_baseline.sql fir-pgtest:/tmp/
docker cp karakter_kerangka_verify.sql fir-pgtest:/tmp/
docker cp ../migrations/20260828110000_karakter_kerangka_per_jenjang.sql fir-pgtest:/tmp/m.sql
docker exec fir-pgtest psql -U postgres -d fir -v ON_ERROR_STOP=1 -q -f /tmp/karakter_kerangka_baseline.sql
docker exec fir-pgtest psql -U postgres -d fir -v ON_ERROR_STOP=1 -f /tmp/m.sql
docker exec fir-pgtest psql -U postgres -d fir -v ON_ERROR_STOP=1 -f /tmp/m.sql   # idempotensi
docker exec fir-pgtest psql -U postgres -d fir -f /tmp/karakter_kerangka_verify.sql
docker rm -f fir-pgtest
```

Sudah dijalankan di postgres:15 dan postgres:17, keduanya lolos, 10 pemeriksaan LULUS 0 GAGAL.
Berkas verifikasi hanya boleh dijalankan SEKALI per database bersih -- ia menulis data, jadi
jalan kedua akan kena unique violation yang memang seharusnya.

## Migration kedua: penilaian pekanan (20260828120000)

Baseline yang sama dipakai untuk kedua migration, dijalankan berurutan:

```bash
docker cp karakter_kerangka_baseline.sql fir-pgtest:/tmp/base.sql
docker cp ../migrations/20260828110000_karakter_kerangka_per_jenjang.sql fir-pgtest:/tmp/m1.sql
docker cp ../migrations/20260828120000_karakter_skor_pekanan.sql fir-pgtest:/tmp/m2.sql
docker cp karakter_pekan_verify.sql fir-pgtest:/tmp/v.sql
docker exec fir-pgtest psql -U postgres -d fir -v ON_ERROR_STOP=1 -q -f /tmp/base.sql
docker exec fir-pgtest psql -U postgres -d fir -v ON_ERROR_STOP=1 -f /tmp/m1.sql
docker exec fir-pgtest psql -U postgres -d fir -v ON_ERROR_STOP=1 -f /tmp/m2.sql
docker exec fir-pgtest psql -U postgres -d fir -f /tmp/v.sql
```

Yang diperiksa karakter_pekan_verify.sql, selain bahwa SQL-nya jalan: baris lama jatuh ke
pekan 0, empat penilaian pekanan satu murid boleh masuk semua, angka bulanan diambil dari
PEKAN TERAKHIR (88, bukan rata-rata 73), murid yang absen dua pekan terakhir tetap bernilai
dari pekan terisi terakhirnya, agregat jenjang/indeks sekolah/matview YPT semuanya memakai
pekan terakhir (77, bukan 68 yang berarti masih merata-rata seluruh pekan), unique baru
menolak duplikat pekan, RPC mengganti seluruh pekan satu periode, dan payload lama tanpa
field pekan tetap jatuh ke 0.

Sudah dijalankan di postgres:15 dan postgres:17, keduanya 11 LULUS 0 GAGAL, dan migration
keduanya idempoten. Sama seperti berkas verifikasi yang satunya: jalankan SEKALI per database
bersih, karena ia menulis data.

## Migration ketiga: bulanan = pekan terakhir (20260828130000)

Baseline dan urutan yang sama, tambah m3 dan karakter_pekan_terakhir_verify.sql.

Yang dibedakan migration ini dari yang sebelumnya cuma satu keadaan: bulan yang memuat baris
pekanan DAN baris bulanan sekaligus. Sebelum perbaikan, urutan pekan desc memilih pekan 3 dan
mengabaikan baris bulanan, padahal baris bulanan justru angka final bulan itu. Uji nomor 1 di
berkas verifikasinya persis memeriksa itu (91 dari baris bulanan, bukan 75 dari pekan 3).

Sudah dijalankan di postgres:15 dan postgres:17, keduanya 7 LULUS 0 GAGAL, idempoten.

## Migration keempat: hapus per pekan (20260901100000)

Urutan sama, tambah m4 dan karakter_import_per_pekan_verify.sql.

Yang diperiksa, selain SQL-nya jalan: unggah P1 lalu unggah P2 SAJA dan P1 harus selamat
(uji nomor 1, inti seluruh migration ini), unggah ulang P1 tidak menyentuh P2, berkas dua
pekan mengganti dua-duanya, payload TANPA pekan_list tetap menyapu seluruh bulan seperti
perilaku lama, pekan_list kosong tidak menggandakan data, berkas bulanan tidak berubah
perilakunya, dan periode lain tidak pernah tersentuh.

Sudah dijalankan di postgres:15 dan postgres:17, keduanya 8 LULUS 0 GAGAL, idempoten.

## Migration kelima: YPT skor 0 = tidak dinilai (20260901110000)

Urutan sama, tambah m5 dan ypt_skor_nol_verify.sql.

Latar belakangnya: sekolah Telkom mengunggah roster lengkap dan murid yang tidak dinilai guru
tersimpan sebagai skor 0, sehingga keempat matview YPT menyeret rata-rata sekolah ke bawah
(SMK Telkom Jakarta 2026-05 tampil 16% padahal rekap sekolahnya 80%). Migration ini menyaring
`skor > 0` di keempat matview.

Yang diperiksa, selain SQL-nya jalan: rata sekolah dan jumlah_siswa hanya dari murid yang
dinilai, murid nol-semua-aspek keluar dari peringkat siswa ekstrem, murid dinilai sebagian
dirata-rata dari aspek terisinya saja, rata per aspek dan per indikator ikut bersih, sekolah
tanpa baris nol tidak berubah, dan batas sekolah pekanan (nol di pekan terakhir membuat murid
hilang dari bulan itu) dipatok sebagai perilaku yang disadari.

Sudah dijalankan di postgres:15 dan postgres:17, keduanya 7 LULUS 0 GAGAL, idempoten.

## Migration keenam: YPT hanya penilaian guru (20260901130000)

Urutan sama, tambah m6 dan ypt_hanya_guru_verify.sql.

Keempat matview YPT menyaring `sumber = 'guru'`. Ini PENJAGA, bukan perbaikan angka: per
2026-09-01 seluruh baris skor YPT memang sudah `guru`, jadi migration ini tidak mengubah satu
angka pun hari ini. Gunanya menahan baris penilaian siswa atau orang tua yang kelak terkirim
supaya tidak masuk diam-diam ke rata-rata pencapaian.

Berkas ini dibungkus BEGIN/COMMIT, jadi kalau ada satu perintah gagal, database kembali persis
ke keadaan semula dan tidak ada view YPT yang tertinggal dalam keadaan sudah di-drop.

Yang diperiksa: baris siswa dan orangtua bernilai ekstrem disisipkan, lalu dipastikan rata
sekolah, rata per aspek, dan rata per indikator tetap dari guru saja, murid dari baris itu tidak
masuk peringkat siswa ekstrem, aturan skor 0 dari migration sebelumnya masih berlaku, sekolah
yang datanya murni guru tidak berubah sama sekali, dan tiga uji terakhir khusus memastikan
SEKOLAH PEKANAN tidak tersentuh: empat pekan tetap empat titik terpisah di karakter_pekan_avg,
angka bulanannya tetap diambil dari pekan terakhir (90, bukan rata-rata 75), dan view pekanan
dari migration 20260901120000 (karakter_pekan_tersedia, karakter_murid_pekan_avg) tetap hidup.

Rantai ujinya memakai urutan lengkap m1..m6 termasuk 20260901120000_karakter_view_pekan_lengkap,
supaya bentrok nomor migration ketahuan kalau terulang.

Sudah dijalankan di postgres:15 dan postgres:17, keduanya 9 LULUS 0 GAGAL, idempoten.

## Migration ketujuh: YPT membaca rekap sekolah (20260914100000)

Urutan sama, tambah m7 dan ypt_rekap_sekolah_verify.sql.

`ypt_k_sekolah_mat.rata_total` dan `ypt_k_aspek_mat.rata` tidak lagi dihitung dari
karakter_skor_bulanan, melainkan dibaca dari `karakter_summary` scope='sekolah' -- rekap yang
sama dengan yang dipakai kartu hero Kepala Sekolah. Hitungan lama tetap ada sebagai cadangan
untuk sekolah-bulan yang rekapnya belum masuk, dan `jumlah_siswa` tetap dari skor karena ia
cuma bobot agregasi.

Yang diperiksa: rata_total ikut rekap (88, bukan 75 hasil hitungan sendiri) sementara
jumlah_siswa tetap dari skor, sekolah tanpa kolom `rata_pencapaian_guru` jatuh ke rata-rata
kolom per karakter dan BUKAN ke `pencapaian_guru` yang artinya kelengkapan input, nilai per
karakter ikut rekap kalau kolomnya ada dan jatuh ke cadangan kalau tidak, label aspek dan
jumlah_siswa per aspek tidak ikut berubah, `ypt_pct()` membaca keempat bentuk nilai yang nyata
ada di berkas ("95 %", "84,67 %", pecahan Excel 0.91, angka biasa) plus nilai kosong, periode
tanpa rekap tetap memakai hitungan lama, rekap tanpa skor sama sekali tidak memunculkan periode
baru, baris rekap ganda dimenangkan yang terakhir masuk, baris scope='kelas' tidak ikut terbaca,
`pencapaian_guru` dipakai HANYA kalau tingkat 1 dan 2 sama-sama tidak ada (parity dengan React),
dan ketiga view rekap internal tidak di-grant ke `authenticated`.

CATATAN JUJUR SOAL CARA MENJALANKANNYA: Docker Desktop tidak bisa start di mesin tempat
migration ini ditulis (backend process exited), jadi rantai ini BELUM dijalankan di
postgres:15/postgres:17 lewat perintah docker di atas seperti enam migration sebelumnya.
Yang dipakai sebagai gantinya adalah Postgres embedded `@electric-sql/pglite` (mesin Postgres 17)
dengan rantai berkas yang sama persis: 11 LULUS 0 GAGAL, dan idempoten (berkas migration
dijalankan tiga kali berturut-turut, hasil uji tetap sama). Jalankan ulang lewat Docker kalau
mesin lain sudah bisa, terutama untuk memastikan postgres:15 juga lolos.

Selain berkas verifikasi, angkanya dicocokkan ke berkas rekap sungguhan ("Summary Sekolah
YPT.xlsx", 26 sekolah x 3 bulan = 78 baris): ke-78 baris dimuat ke karakter_summary, lalu
`ypt_k_sekolah_mat.rata_total` dibandingkan dengan `nilaiGuruSekolah()` di React. 78 dari 78
sama persis, dan tidak ada satu baris pun yang jatuh ke cadangan. Artinya dashboard YPT dan
layar Kepala Sekolah kini menampilkan angka yang sama untuk sekolah yang sama.
