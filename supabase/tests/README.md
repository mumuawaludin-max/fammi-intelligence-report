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
