# Akses demo halaman masuk

Ada dua layar yang terpisah:

- **Halaman masuk** (alamat biasa). Kiri: pengantar "One School. Five Intelligence Systems." bernada
  deck Fammi, lima ubin informasi tanpa tombol, stabilo kuning, rasi titik. Kanan: kartu form masuk
  akun (username + kode khusus ke Supabase Auth), alurnya tidak berubah. Di bawah ubin ada tautan
  kecil **Lihat demo aplikasi** untuk pemegang kode demo; sengaja tidak mencolok karena fokus halaman
  ini informasi dan masuk akun. Di laptop (tinggi jendela 600 px ke atas) halaman ini muat satu
  layar tanpa gulir. Di ponsel semua ditumpuk dengan form tepat sesudah judul.
- **Layar demo** (`#demo`), hanya terbuka sesudah server menerima kode demo. Tidak ada form username
  dan kode khusus di sini. Tiap ubin membawa tombol tampilannya, satu klik langsung membuka:

| Sistem | Tombol | Isi |
| --- | --- | --- |
| 01 Education & Character | Rapor Karakter: Kepala Sekolah, Wali Kelas | Dashboard Rapor Karakter sungguhan, masuk sebagai akun demo |
| 02 Safety & Crisis Management | Kesehatan Mental Anak 4-10 tahun | Screening anak (modul Perilaku Anak), akun demo Yayasan TK Fammi |
| 03 Talent & Life Design | Multiple Intelligence | Laporan MI, akun demo |
| 04 Teacher Growth & Support | Culture: Kelompok, Perorangan | School Culture lembaga dan laporan perorangan, akun demo YPS Fammi |
| 05 Finance & Planning | Dashboard Keuangan | Laporan HTML yang disimpan server (`supabase/demo/laporan-keuangan.html`), di `#demo/finance-planning` |

Alurnya: tautan **Lihat demo aplikasi**, dialog kode demo, server memverifikasi, layar demo terbuka.
Layar demo menampilkan masa berlaku akses, tombol **Akhiri demo**, dan tautan kembali ke halaman
masuk. Selama sesi demo masih sah, halaman masuk menampilkan "Akses demo Anda aktif hingga ...
Lanjutkan demo" di tempat tautan demo. Tombol Back browser berpindah antarlayar seperti biasa.

## Pemasangan

Lakukan berurutan. Sebelum langkah 1, tombol **Verifikasi kode** selalu membalas "Terjadi kendala
saat memverifikasi kode" karena fungsi `demo_verify` belum ada.

1. **Migration.** Jalankan `supabase/migrations/20261111100000_demo_access.sql` di SQL Editor.
   Aman dijalankan ulang.
2. **Laporan keuangan.** Jalankan `supabase/demo/laporan-keuangan.sql` di SQL Editor (sekitar
   260 KB, menyimpan dashboard keuangan ke tabel `demo_reports`). Aman dijalankan ulang.
3. **Edge Function.** Deploy `supabase/functions/demo-masuk/index.ts`:
   `supabase functions deploy demo-masuk`, atau Dashboard > Edge Functions > Deploy a new function >
   Via Editor, nama `demo-masuk`, tempel isi berkasnya. Berkas ini sengaja satu berkas. Biarkan
   "Enforce JWT verification" menyala; browser mengirim anon key.
4. **Secret akun demo.** Dashboard > Edge Functions > Secrets, buat `DEMO_AKUN` berisi username
   akun demo saja. **Tidak ada kata sandi di mana pun**: kode khusus akun demo tidak dipakai, tidak
   disimpan, dan tidak perlu dikirim ke siapa pun.

   ```json
   {
     "karakter-kepsek":       "<username akun Kepala Sekolah>",
     "karakter-walas":        "<username akun Wali Kelas>",
     "kesehatan-mental-anak": "<username akun screening anak>",
     "multiple-intelligence": "<username akun MI>",
     "culture-kelompok":      "<username akun Culture lembaga>",
     "culture-perorangan":    "<username akun Culture staf>"
   }
   ```

   Username persis seperti yang diketik di form masuk: email asli (mengandung `@`) dipakai apa
   adanya, selain itu jadi `username@fammi.internal`. Huruf besar kecil tidak berpengaruh. Tampilan
   yang tidak ada di secret membalas "Tampilan demo ini belum disiapkan tim Fammi" tanpa merusak
   tampilan lain; username yang tidak terdaftar membalas "Tampilan demo belum bisa dibuka" dan tidak
   pernah membuat akun baru. Perubahan secret langsung berlaku tanpa deploy ulang.
5. **Kode demo pertama** (bagian berikut), lalu coba semua tombol di layar demo.

## Urutan go-live

1. Pastikan akun-akun untuk `DEMO_AKUN` berdata contoh (bagian "Yang wajib diketahui" di bawah):
   ```sql
   select p.username, p.peran, p.school_id, s.nama as sekolah
   from public.profiles p left join public.schools s on s.id = p.school_id
   where p.username in ('yayasantkfammi', 'mumu', 'ypsfammi', 'ypsstaf001', '<akun Kepala Sekolah>', '<akun Wali Kelas>');
   ```
   Kalau akun demo masih memakai kode khusus bawaan yang tertulis di migration seed, ganti di
   Dashboard > Authentication. Demo tidak memakai kode khusus itu.
2. Supabase dulu, sesuai urutan Pemasangan di atas (migration, laporan keuangan, Edge Function,
   secret, kode demo uji). Pemeriksaan cepat sesudahnya:
   `select public.demo_semua_sistem();` (lima id) dan
   `select system_id, enabled, octet_length(html) from public.demo_reports;` (finance-planning).
3. Baru sesudah itu frontend: push ke master, Vercel memasang ke produksi. Kalau frontend terpasang
   lebih dulu, form masuk tetap jalan; hanya dialog kode demo yang membalas "Terjadi kendala".
4. Uji di produksi memakai jendela Incognito/Private: masuk dan keluar dengan akun biasa, lalu
   Lihat demo aplikasi, kode uji, ketujuh tombol tampilan beserta Kembali, Akhiri demo. Sesudah itu
   periksa header IP (bagian Keamanan kode demo), buat kode untuk presentasi sungguhan, dan cabut
   kode uji.
5. Saat presentasi, buka demo di jendela Incognito/Private atau browser lain, jangan di browser yang
   sedang login akun Fammi Anda. Supabase menyimpan sesi masuk per browser, bukan per tab, jadi
   tab lain di browser yang sama ikut berganti ke akun demo dan ikut keluar saat demo ditutup.

Mematikan demo tanpa menyentuh form masuk: cabut semua kode
(`select public.demo_code_revoke(id) from public.demo_access_codes where revoked_at is null;`,
sesi berjalan ikut berhenti), atau kosongkan secret `DEMO_AKUN` (tombol akun membalas "belum
disiapkan"). Log `demo-masuk` hanya mencatat id tampilan, tidak pernah username.

## Membuat, melihat, dan mencabut kode

```sql
select public.demo_code_create(
  'Presentasi Yayasan X',      -- label untuk pengelola, wajib
  'Rapat 14 November',         -- catatan, boleh null
  now() + interval '7 days',   -- kedaluwarsa, null berarti tanpa batas waktu
  25,                          -- batas pemakaian (jumlah sesi), null berarti tanpa batas
  null,                        -- sistem yang dibuka, null berarti kelima sistem
  180                          -- umur satu sesi dalam menit, 5 sampai 1440
);
select * from public.demo_code_list();
select public.demo_code_revoke('<id kode>');
```

Field `code` di keluaran `demo_code_create` adalah kode mentah berformat `XXXX-XXXX-XXXX`, hanya
tampil sekali. Database menyimpan HMAC-nya saja. Membuka sebagian sistem saja:
`array['talent-life-design', 'education-character']`. Pengunjung boleh mengetik huruf kecil, spasi,
atau tanpa tanda hubung.

Pencabutan dan kedaluwarsa mematikan sesi demo yang sedang berjalan. Layar demo, halaman masuk, dan
bilah "Mode demo" di dalam aplikasi memeriksa ulang sesi tiap 60 detik, setiap tab kembali terlihat,
dan saat sesinya habis; begitu server menolak, pengunjung dikeluarkan dari akun demo dan kembali ke
halaman masuk dengan pesan yang sesuai. Jatah pakai yang habis hanya menahan sesi baru.

## Cara kerja tampilan akun

1. Pengunjung menekan tombol tampilan di layar demo, misalnya Rapor Karakter Kepala Sekolah.
2. Browser memanggil Edge Function `demo-masuk` dengan **token sesi demo** dan **id tampilan** saja.
3. `demo-masuk` meminta Postgres memeriksa sesi demo (`demo_session`): masih sah dan sistemnya
   termasuk kode demo itu. Username akun diambil dari secret `DEMO_AKUN`.
4. Dengan kunci service_role (tersedia otomatis di Edge Function, tidak pernah ke browser),
   `demo-masuk` memastikan akun itu sudah ada (`demo_akun_email`, hanya bisa dipanggil
   service_role). Pemeriksaan ini wajib: `generateLink` tipe magiclink membuat akun baru kalau
   emailnya belum terdaftar.
5. `demo-masuk` membuat tautan masuk sekali pakai untuk akun itu (`auth.admin.generateLink`, tidak
   mengirim email) dan langsung menukarnya jadi sesi (`verifyOtp`). Yang dibalas ke browser hanya
   access_token dan refresh_token.
6. Browser memasang sesi itu dan membuka aplikasi seperti login biasa, dengan penanda `demo` di sesi
   FIR. Peran akun menentukan tampilannya (Kepala Sekolah ke Rapor Karakter, Yayasan TK Fammi ke
   screening anak, staf ke laporan Culture perorangan, dan seterusnya).
7. Bilah mengambang **Mode demo** tampil di semua shell. Tombol **Kembali**, maupun tombol Keluar
   di aplikasi, keluar dari akun demo **hanya di browser ini** (`signOut` scope local), supaya
   pengunjung lain yang memakai akun demo yang sama tidak ikut keluar, lalu kembali ke layar demo
   dengan fokus di tombol yang tadi dibuka. Token demo tetap tersimpan.

## Yang wajib diketahui sebelum mengisi DEMO_AKUN

- **Pengunjung demo memegang sesi sungguhan akun demo itu.** Ia bisa membaca apa pun yang bisa
  dibaca akun itu lewat RLS, dan melakukan apa pun yang boleh dilakukan akun itu. Karena itu akun di
  `DEMO_AKUN` **wajib akun demo berisi data contoh**, bukan akun sekolah sungguhan. Akun Yayasan TK
  Fammi dan YPS Fammi dibuat migration seed di repo ini, jadi datanya data contoh. Akun Rapor Karakter
  dan Multiple Intelligence dibuat langsung di produksi; pastikan sekolahnya sekolah demo dan nama
  murid di dalamnya bukan anak sungguhan sebelum dimasukkan.
- **Tulis yang masih bisa dilakukan.** Dari akun-akun ini, satu-satunya tabel yang boleh ditulis
  adalah komitmen 30 hari milik staf Culture sendiri (`sc_komitmen`). Selain itu setiap akun Supabase
  bisa mengganti kode khusus atau emailnya sendiri lewat Auth API. Tampilan demo tetap jalan kalau
  kode khususnya diganti (tidak ada kata sandi yang dipakai), tapi tim Fammi sendiri tidak bisa lagi
  masuk ke akun itu dengan kode lama sampai diatur ulang di Dashboard > Authentication. Ganti email
  akun @fammi.internal tidak bisa selesai karena konfirmasinya tidak pernah terkirim.
- **Sesi akun bisa tersisa.** Saat pengunjung menutup tab tanpa menekan Kembali, sesi akun demo
  tertinggal di browsernya sampai kedaluwarsa. Memutus semua sesi satu akun demo lewat SQL Editor:
  `delete from auth.sessions where user_id = (select id from auth.users where email = '<email akun>');`
  Access token yang sudah terbit tetap berlaku sampai habis umurnya (bawaan satu jam).
- **Akun yang sama dipakai orang lain.** Pengunjung demo mendapat sesi sendiri; kata sandi akun
  tidak disentuh, dan Kembali maupun Akhiri demo hanya mengakhiri sesi milik browser pengunjung
  (`signOut` scope local). Orang yang sedang masuk ke akun yang sama dari perangkat lain tidak ikut
  keluar. Pengecualiannya kalau setelan "single session per user" di Dashboard > Authentication >
  Sessions dinyalakan: setiap masuk, demo maupun biasa, memutus sesi lain akun itu. Biarkan mati.
- **Batas laju Supabase Auth.** Setiap tombol tampilan menukar satu tautan masuk, dan semuanya
  berasal dari IP Edge Function. Demo serentak dalam jumlah besar bisa menyentuh batas laju
  verifikasi token; naikkan di Dashboard > Authentication > Rate Limits bila perlu.

## Laporan HTML

Dashboard keuangan disimpan sebagai HTML di tabel `demo_reports` dan hanya keluar dari fungsi
`demo_report_html` untuk sesi demo yang sah dan sistem yang dibuka kodenya. Tidak ada path berkas.
Di browser, HTML dirender di iframe `sandbox="allow-scripts allow-popups"` lewat `srcdoc`, tanpa
`allow-same-origin`: skripnya berjalan di origin kosong dan tidak bisa membaca token, sessionStorage,
cookie, atau DOM aplikasi (sudah diuji). Laporan keuangan ini memuat React dan font dari CDN, jadi
butuh koneksi internet.

Mengganti atau menambah laporan HTML:

```bash
npm run demo:laporan -- ../supabase/demo/laporan-keuangan.html finance-planning "Dashboard Keuangan Sekolah" ../supabase/demo/laporan-keuangan.sql
```

lalu jalankan SQL hasilnya di SQL Editor. Mematikan tanpa menghapus:
`update public.demo_reports set enabled = false where system_id = 'finance-planning';`

## Keamanan kode demo

- Kode diperiksa hanya di Postgres (`demo_verify`), disimpan sebagai HMAC-SHA256 dengan kunci
  rahasia di `demo_secret`. React tidak memegang kode, daftar kode, maupun keputusan sah tidaknya.
- Sesi demo: token acak 256 bit, database menyimpan HMAC-nya, umur yang lebih pendek antara
  `session_minutes` dan `expires_at` kode. Browser menyimpan token itu (bukan kodenya) di
  `sessionStorage`, yang hilang saat tab ditutup. Cookie HttpOnly tidak dipakai karena API Supabase
  berada di domain lain dari aplikasi.
- Batas percobaan gagal: 10 per pengunjung per 15 menit, 300 dari seluruh pengunjung per 10 menit.
  IP disimpan sebagai HMAC dan catatannya dihapus setelah dua hari.
- Pesan di layar selalu dari tabel pesan di `demoAturan.js`, tidak pernah teks mentah server.
- Layar demo dan laporan hanya tampil selama server menyatakan sesi demo sah. Membuka `#demo` atau
  `#demo/<id>` tanpa sesi itu kembali ke halaman masuk; hash hanya dibaca sebagai id registri.

Periksa header IP sekali sesudah migration dijalankan: coba beberapa kode salah dari dua jaringan
berbeda, lalu `select client_key, count(*) from public.demo_verify_attempts group by 1;` harus
menghasilkan dua `client_key`. Kalau hanya satu, seluruh pengunjung berbagi satu batas per IP; batas
global tetap bekerja.

## Lain-lain

- Registri tunggal sistem dan tampilan: `DEMO_SYSTEMS` di `web/src/pages/demo/demoSystems.js`. Id
  sistem wajib sama dengan `public.demo_semua_sistem()` di migration, dan id tampilan berjenis akun
  wajib sama dengan `TAMPILAN_AKUN` di Edge Function; `demoAturan.test.js` memeriksa keduanya.
- Berkas: halaman masuk `web/src/pages/LoginPage.jsx` (juga pengatur ketiga layar lewat hash,
  `demo/ruteDemo.js`), layar demo `web/src/pages/demo/DemoBeranda.jsx`, ubin bersama
  `web/src/pages/login/MozaikSistem.jsx`, unsur merek `web/src/pages/login/MerekFammi.jsx`.
- Belum ada layar pengelola kode di Admin CMS; pengelolaan lewat SQL Editor. Fungsinya sudah bisa
  dipanggil akun Admin Fammi lewat `supabase.rpc`.
- Font tetap Google Sans Flex sesuai aturan satu font di CLAUDE.md.

## Uji

- `npm test` di `web/`: `src/pages/demo/demoAturan.test.js` (registri, keselarasan dengan migration
  dan Edge Function, rute hash, tafsir balasan server, penyimpanan token, tampilan akun, demo-masuk
  tanpa kata sandi).
- `supabase/tests/demo_access_verify.sql` di atas `demo_access_baseline.sql`: 90 pemeriksaan,
  termasuk `demo_akun_email` yang tertutup untuk browser. Cara menjalankannya di
  `supabase/tests/README.md`.
- `deno check supabase/functions/demo-masuk/index.ts` memeriksa tipe Edge Function.
- Tampilan akun sungguhan hanya bisa diuji sesudah langkah 3 dan 4 di produksi.
