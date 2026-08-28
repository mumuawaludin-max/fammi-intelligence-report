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
