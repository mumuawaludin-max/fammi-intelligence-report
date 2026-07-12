# Rencana Perbaikan FIR, Lanjutan Audit Juli 2026

Rencana kerja untuk semua temuan audit (`docs/Audit_Data_dan_Keamanan_FIR_2026-07.md`) yang belum dikerjakan. Item prioritas 2, 3, 4 sudah selesai di commit sebelumnya; dokumen ini mencakup item 1, 5, 6, 7 plus temuan kecil yang belum masuk daftar prioritas.

Tiap fase punya: langkah urut, berkas yang disentuh, cara verifikasi, dan penanda siapa yang harus bertindak. Penanda:

- `[kode]` bisa langsung dikerjakan di repo ini.
- `[manual]` butuh tindakan pemilik proyek di luar repo (dashboard Supabase, deploy Edge Function, jalankan SQL).
- `[keputusan]` butuh keputusan pemilik produk dulu, jangan ditebak.

Urutan fase disusun berdasar dampak dan dependensi. Fase A menopang semuanya; B dan C bisa jalan paralel setelahnya; D, E, F menyusul.

---

## Fase A. Versikan dan perketat RLS (prioritas tertinggi)

Seluruh keamanan data sekolah dan murid bergantung pada policy RLS yang saat ini hanya hidup di dashboard Supabase, tidak berversi, tidak bisa direview. Sebelum fase ini selesai, tidak ada temuan keamanan lain yang benar-benar tertutup.

**Status A1-A3: selesai dan terverifikasi (2026-07-11).** Policy live ditarik lewat query SQL Editor (bukan `supabase db pull`, karena CLI tidak tersedia di sesi ini -- hasilnya setara). Review menemukan dua celah nyata, keduanya sudah ditutup lewat migration dan dibuktikan lulus lewat `supabase/tests/rls_verify.sql` (4/4 skenario hijau, angka nyata dari database live):

- **Temuan A** (`supabase/migrations/20260711100000_rls_scope_hardening.sql`): policy baca `karakter_skor`, `karakter_skor_indikator`, `karakter_pernyataan_ortu`, `mi_hasil` cuma memfilter `sekolah_id` -- siapa pun yang login di satu sekolah (Wali Kelas kelas lain, akun Orang Tua/Siswa) bisa membaca nama dan skor SEMUA murid sekolah itu lewat REST langsung. Sekarang dibatasi ke `kelas_id` (Wali Kelas, dari `cakupan`) dan `murid_id` (Orang Tua/Siswa). Kepala Sekolah/Wakil tetap sekolah-wide (memang begitu desainnya). Sekalian: fungsi yatim `handle_new_user()` (tidak terikat trigger apa pun, sisa desain lama) dihapus, beberapa policy duplikat di `schools`/`school_modules` diringkas.
- **Temuan B** (`supabase/migrations/20260711113000_rls_tindak_lanjut_scope.sql`): policy baca `tindak_lanjut`/`briefing` cuma memfilter `sekolah_id` + `status` -- Wali Kelas bisa membaca tindak lanjut level Kepala Sekolah dan tindak lanjut kelas lain lewat REST langsung. Sekarang dibatasi ke `scope`/`scope_id`/`target_role` yang relevan per peran. Ditulis setelah verifikasi data live (tidak ada baris `target_role` kosong, `briefing` kosong sama sekali) supaya tidak berisiko menyembunyikan data yang sudah tayang.

Helper baru: `my_peran()`, `my_cakupan()`, `my_murid_id()` (pola sama dengan `my_school_id()` yang sudah ada).

**Keputusan yang diambil, dicatat supaya tidak perlu ditinjau ulang tanpa alasan baru:** policy `_baca_yayasan` (semua tabel) sengaja TIDAK dipersempit di kedua migration di atas -- Yayasan sudah dirancang punya akses lebih luas lintas sekolah untuk data mentahnya (termasuk nama murid di `karakter_pernyataan_ortu`), jadi tidak konsisten kalau tindak lanjutnya dibatasi sementara data sumbernya tidak. `mi_input` juga sengaja tidak disentuh -- struktur kolomnya belum diverifikasi dan tidak ada kode React yang memakainya.

**Status A4: selesai (2026-07-11).** Edge Function `supabase/functions/admin-actions/index.ts` menangani lima aksi (approve/reject, update-profile, add-school, toggle-module, update-schedule) meniru pola `create-user`. Sudah dites lewat aplikasi sungguhan (toggle modul berhasil), lalu migration `20260711140000_narrow_admin_write_rls.sql` mempersempit policy `*_admin_all` untuk enam tabel jadi SELECT-only. Fase A tuntas seluruhnya.

### A1. Tarik skema dan policy ke repo `[manual]` lalu `[kode]`

1. Di mesin yang punya akses proyek Supabase: `supabase login`, `supabase link --project-ref hypzmczwpigkyomzgjdb`.
2. `supabase db pull` untuk menghasilkan migration berisi skema penuh termasuk semua `create policy`, function helper (`my_school_id()` atau setara), dan status `enable row level security` per tabel.
3. Commit hasilnya ke `supabase/migrations/`. Mulai titik ini, SEMUA perubahan policy wajib lewat migration di repo, bukan diedit di dashboard.
4. Alternatif kalau CLI tidak bisa dipakai: otorisasi konektor Supabase MCP di pengaturan claude.ai, lalu minta sesi agen membaca `pg_policies` dan menyalinnya ke migration. Konektor itu saat ini belum diotorisasi, jadi jalur CLI yang utama.

### A2. Review policy terhadap kontrak peran `[kode]` setelah A1

Buat matriks tabel x peran di `docs/` dan cocokkan tiap policy dengan kontrak ini:

1. `profiles`: SELECT hanya baris sendiri (`id = auth.uid()`) untuk non-admin; UPDATE/INSERT/DELETE HANYA AdminFammi. Titik paling kritis: kalau ada policy UPDATE longgar, user bisa menaikkan `peran`-nya sendiri jadi AdminFammi dan mengambil alih semuanya.
2. `tindak_lanjut` dan `briefing`: SELECT non-admin wajib membatasi `status = 'disetujui'` DAN cakupan (sekolah/kelas/murid sesuai peran). Tanpa syarat status di policy, siapa pun bisa membaca draf `menunggu_persetujuan` termasuk `catatan_internal` dan `opsi_kandidat` reviewer lewat REST langsung, walau UI tidak menampilkannya. UPDATE hanya AdminFammi (gerbang persetujuan).
3. `karakter_skor`, `karakter_skor_indikator`, `karakter_pernyataan_ortu`: SELECT Wali Kelas dibatasi `kelas_id` dalam `cakupan`-nya, bukan sekadar `sekolah_id`; Kepsek/Wakasek per sekolah; Yayasan per daftar sekolah di bawah yayasannya; Siswa/OrangTua tidak perlu akses tabel ini sama sekali (tampilan mereka tidak memakainya). INSERT/UPSERT hanya AdminFammi (dipakai importer).
4. `mi_hasil`: Siswa hanya baris `murid_id` miliknya; OrangTua baris anaknya; Wali Kelas kelas cakupannya; Kepsek/Wakasek sekolahnya.
5. `schools`, `school_modules`, `yayasan`, `karakter_aspek_config`, `karakter_indikator_config`: SELECT boleh luas (bukan data pribadi), tulis hanya AdminFammi.
6. `gemini_schedule`, `gemini_feedback`, `import_log`: baca dan tulis hanya AdminFammi.
7. Setiap policy yang menyebut `KepalaSekolah` wajib juga mencakup `WakilKepalaSekolah` (aturan CLAUDE.md).

Tulis perbaikan sebagai migration baru, satu berkas per kelompok tabel, dengan komentar alasan.

### A3. Tes akses otomatis per peran `[kode]` + `[manual]` sekali

1. Buat akun tes satu per peran di sekolah dummy (lewat CMS atau Edge Function create-user). `[manual]` sekali, kredensialnya disimpan sebagai secret CI, bukan di repo.
2. Buat skrip `scripts/rls-test.mjs`: login berturut-turut sebagai tiap peran memakai anon key, lalu jalankan daftar percobaan yang HARUS gagal, antara lain: baca `tindak_lanjut` berstatus `menunggu_persetujuan`; baca `karakter_skor` sekolah lain; baca kelas di luar `cakupan` untuk Wali Kelas; UPDATE `profiles.peran` milik sendiri; UPDATE `tindak_lanjut.status` jadi `disetujui`; baca `mi_hasil` murid lain untuk Siswa. Plus daftar percobaan yang HARUS berhasil (jalur baca normal tiap peran), supaya policy yang terlalu ketat juga ketahuan.
3. Skrip keluar dengan kode gagal kalau ada satu saja ekspektasi meleset. Jalankan manual dulu; kalau repo nanti punya CI, jadikan langkah wajib.

Kriteria selesai fase A: semua policy ada di repo sebagai migration, matriks review terisi, skrip tes hijau.

### A4. Kecilkan permukaan policy tulis admin `[kode]` + `[manual]` deploy

Mutasi admin saat ini jalan dari browser (approve/tolak, ubah profil, tambah sekolah, toggle modul, ubah jadwal Gemini), memaksa banyak policy tulis berbasis "caller AdminFammi" yang semuanya harus sempurna. Kurangi risikonya:

1. Buat Edge Function `admin-actions` meniru pola `create-user`: verifikasi JWT caller AdminFammi di server, lalu jalankan mutasi dengan service_role. Endpoint per aksi: `approve`, `reject`, `update-profile`, `add-school`, `toggle-module`, `update-schedule`.
2. Pindahkan pemanggilnya di `useAdminCmsData.js` (`actApprovalAction`, `updateUserAction`, `addSchoolAction`, `toggleModuleAction`, `updateGeminiScheduleAction`) ke `supabase.functions.invoke`.
3. Setelah itu HAPUS policy INSERT/UPDATE/DELETE berbasis peran untuk tabel-tabel itu; sisakan SELECT. Import Karakter boleh menyusul dipindah di Fase E1 (satu function dengan transaksi sekalian).
4. `[manual]` deploy: `supabase functions deploy admin-actions`.

Fase A4 boleh digeser setelah B/C kalau kapasitas terbatas, asal A1 sampai A3 sudah membuktikan policy tulis yang sekarang memang ketat.

---

## Fase B. Satukan sumber angka (item 5 audit)

Tujuan: tidak ada lagi dua angka berbeda untuk hal yang sama antara kartu, detail, dan teks tindak lanjut, dan nilai kosong tidak lagi menyamar jadi nol.

**Status: selesai seluruhnya (2026-07-11).**

- **B1**: bug nyata dan live ditemukan di radar MI (`readScore_` di `miMeta.js`) -- skor kecerdasan yang belum tercatat diperlakukan sama seperti skor 0, menyeret rata-rata sekolah turun tanpa alasan. Diperbaiki dengan membedakan "kolom kosong sama sekali" dari "kolom terisi (termasuk 0)", tanpa menyentuh pertanyaan terbuka soal validitas skor 0 Interpersonal. Komponen radar/compare Karakter (`KarakterShared.jsx`) dan `groupTindakLanjut` juga diperbaiki pola sama, tapi ternyata kode mati (tidak diimpor di mana pun) -- tetap diperbaiki untuk jaga-jaga.
- **B2**: semua cutoff sementara (80, 80/60, 75/50) dipusatkan ke `web/src/lib/cutoffs.js`, termasuk label legenda MI di `SiswaPage.jsx` yang sebelumnya berisiko tidak sinkron.
- **B3**: ternyata `mi_hasil.detail` (jsonb, terisi 100% di semua baris live) menyimpan `top_1/2/3` final dari hulu, plus `pred_musikal/naturalis/spasial` yang tadinya dikira tidak ada sama sekali. `SiswaPage.jsx` sudah benar memakainya (lewat `transformMIData`) -- tidak ada bug di laporan individu murid. `MIPage.jsx` (agregat sekolah) diperbaiki supaya membaca `detail->>top_1` alih-alih menghitung ulang dari argmax skor, plus filter periode ditambahkan. Ditemukan dan ditutup sekaligus: hulu menulis "Logika-Matematika" sementara kode lama mengharap persis "Logis-Matematis" (exact-match) -- diganti pencocokan substring yang sudah ada di `miTransform.js` (`nameToCode`/`norm`, sekarang di-export dan dipakai bersama).
- **B4**: agregat indikator Yayasan pindah dari klien ke view `karakter_indikator_sekolah_avg` (migration `20260711150000`). `security_invoker = true` dipasang eksplisit -- tanpa itu view buatan migration akan bypass RLS untuk semua pemakainya, membatalkan Fase A.

Migration `20260711150000_karakter_indikator_sekolah_view.sql` perlu dijalankan manual oleh pemilik database.

### B1. Nilai kosong tampil sebagai "tidak ada data", bukan 0 `[kode]`

1. Di `web/src/pages/karakter/KarakterShared.jsx` baris 127, 177, 212, 269 sampai 270, 300, 318: ganti pola `ringkasanAspekValue(...) || 0` menjadi nilai null yang dipertahankan.
2. Komponen radar/bar menerima null: sumbu aspek tanpa data digambar kosong atau diberi label "belum ada data", bukan digambar di titik nol. Cek komponen `RadarChart`/`BarList` menerima null tanpa crash; kalau tidak, tambahkan penanganan di situ.
3. `skorRata` (KarakterShared.jsx:269) dirata-rata HANYA dari aspek yang bernilai; kalau semua kosong, tampilkan tanda strip.
4. `groupTindakLanjut` di `karakterMeta.js:143`: kelas dengan `classifyPencapaian` null pindah ke bucket `lainnya`, bukan `perlu_perhatian`, sesuai komentar di berkas itu sendiri.
5. Verifikasi: buat satu kelas uji yang summary-nya hanya punya 3 dari 6 aspek, pastikan radar tidak anjlok ke nol dan rata-rata dihitung dari 3 aspek itu saja.

### B2. Pusatkan cutoff yang masih sementara `[kode]` lalu `[keputusan]`

1. Buat `web/src/lib/cutoffs.js` berisi SEMUA ambang yang sekarang tersebar: 80 (`classifyPencapaian`), 80/60 (`classifyBarTone`), 75/50 (`computeLevel` MI), plus konstanta indikator lemah `< 80` di KepsekView/WaliKelasView/YayasanView.
2. Semua pemakai impor dari berkas itu. Tiap konstanta diberi komentar "sementara, menunggu penetapan pemilik produk" merujuk daftar parameter terbuka di CLAUDE.md.
3. `[keputusan]` Ajukan ke pemilik produk empat parameter terbuka CLAUDE.md plus ambang-ambang ini sebagai satu paket keputusan. Setelah ditetapkan, nilai finalnya diganti di satu tempat.

### B3. MI berhenti menghitung dominan dan level sendiri `[kode]` + `[keputusan]`

1. Periksa isi tabel `mi_hasil` di database live: apakah kolom `top_1`/`dominan_flag` dan `pred_musikal`/`pred_naturalis`/`pred_spasial` tersedia dari pipeline hulu. (Butuh A1 selesai atau akses dashboard.)
2. Kalau tersedia: `MIPage.jsx` mengganti `deriveTop1` dengan membaca kolom final; `miTransform.js` melengkapi `PRED_KEYS` untuk Mu/Na/Sp dan berhenti memanggil `computeLevel` kecuali sebagai fallback bertanda.
3. Kalau TIDAK tersedia: `[keputusan]` minta pipeline hulu menambahkannya, atau pemilik produk menetapkan aturan seri skor secara eksplisit (saat ini seri diputuskan urutan array di kode, tanpa dasar).
4. Tambahkan filter periode ke query `mi_hasil` di `MIPage.jsx`: ambil `periode_id` terbaru per murid (atau ikat ke PeriodPicker, lihat C2), supaya murid yang diases dua periode tidak dihitung dua kali.

### B4. Agregat indikator Yayasan pindah dari klien ke database `[kode]` + `[manual]`

1. Buat migration view: `create view karakter_indikator_sekolah_avg as select sekolah_id, periode_id, aspek_kode, indikator_kode, round(avg(skor)) as skor from karakter_skor_indikator group by 1,2,3,4;` dengan RLS/grant secukupnya (view membaca lewat policy tabel dasar bila `security_invoker`).
2. `useKarakterYayasan` mengganti fetch `karakter_skor_indikator` mentah + agregasi klien (useKarakterData.js:358 sekitar) dengan membaca view ini. Bonus: menghapus salah satu query terbesar yang tadinya butuh paginasi.
3. `[manual]` jalankan migration.
4. Verifikasi: angka indikator per sekolah sebelum dan sesudah sama untuk data tanpa duplikat.

---

## Fase C. Konsistensi filter dan periode (item 6 audit)

### C1. Ringkasan memfilter target_role seperti halaman modul `[kode]`

1. Di `useOverviewBriefing.js`, tambah pemetaan peran ke `target_role`: WaliKelas ke `wali_kelas`, Kepsek/Wakasek ke `kepala_sekolah`, Yayasan ke `yayasan`, OrangTua ke `orang_tua`.
2. Tambahkan `.eq("target_role", ...)` di kedua query `tindak_lanjut` (cabang Yayasan dan cabang peran lain). Perhatikan baris lama yang `target_role`-nya null: putuskan ikut tampil untuk kepala_sekolah (kompatibilitas mundur, pakai `.or()`) atau tidak; cek dulu berapa baris null di produksi.
3. Verifikasi: login Kepsek, kartu di tab Ringkasan sama persis dengan kartu di halaman Karakter untuk periode yang sama.

### C2. Perbaiki penentuan periode lintas tabel dan lintas modul `[kode]`

Masalah: periode aktif ditentukan dari satu tabel (summary, atau briefing di Ringkasan) lalu tabel lain diiris dengan periode itu; baris yang periodenya tidak persis sama lenyap.

1. `useAvailablePeriods.js`: daftar periode diambil dari GABUNGAN `karakter_summary`, `briefing`, dan `tindak_lanjut` (union periode_id), supaya tidak ada bulan berdata yang tak terjangkau dari picker.
2. `useOverviewBriefing.js`: tentukan periode terbaru PER MODUL secara terpisah (briefing terbaru modul X + tindak lanjut terbaru modul X), bukan satu periode global untuk semua modul; modul yang datanya lebih lama tetap tampil dengan label periodenya sendiri.
3. Di hook Karakter: kalau tindak lanjut `disetujui` ada untuk periode yang dipilih tapi summary tidak (atau sebaliknya), tetap tampilkan yang ada; jangan saling menggugurkan. Praktisnya: hilangkan ketergantungan `periode` pada `summaryRows` saja; pakai union periode dari summary+tl+briefing untuk validasi pilihan picker.
4. Verifikasi: skenario summary 2026-07 + TL 2026-06; TL harus tetap bisa ditemukan lewat picker 2026-06 dan Ringkasan tidak kosong.

### C3. Baris tindak lanjut skema lama tetap tampil `[kode]`

1. `KebijakanGoals`/pemakai `isKebijakanReady`: baris `disetujui` yang tidak lolos `isKebijakanReady` di-render sebagai kartu sederhana dari `action` + `trigger_desc` + `priority` (kontrak FollowupCard lama), bukan disaring hilang.
2. Opsional setelahnya: SQL satu kali untuk menandai atau memigrasi baris lama, tapi fallback render tetap dipertahankan sebagai jaring pengaman.
3. Verifikasi: sisipkan baris uji tanpa `title/konkret` berstatus `disetujui`, pastikan tampil sebagai kartu sederhana.

### C4. MI tidak mencampur data contoh dengan data asli `[kode]`

1. `MIPage.jsx`: kalau `mi_hasil` kosong TETAPI ada tindak lanjut asli, tampilkan empty state untuk bagian statistik ("data hasil MI belum diunggah") dan tetap tampilkan tindak lanjut asli; jangan tampilkan statistik contoh berdampingan dengan kartu asli. Data contoh hanya muncul kalau DUA-DUANYA kosong.

---

## Fase D. Keamanan operasional (item 7 audit)

### D1. Password generate-an lebih kuat `[kode]` + `[manual]` deploy

1. `supabase/functions/create-user/index.ts` `generatePassword()`: ganti pola "kata + 3 digit" (900 kemungkinan) menjadi kata + 6 digit acak dari `crypto.getRandomValues` (bukan `Math.random`), contoh "wiwifarida304857". Tetap huruf kecil semua sesuai kebutuhan minim salah ketik.
2. Alur distribusi tidak berubah: password tetap dikembalikan sekali ke admin untuk dibagikan.
3. `[manual]` `supabase functions deploy create-user`, lalu jalankan "Reset & Export kode" untuk akun-akun lama yang masih memakai pola 3 digit, minimal untuk akun staf.
4. `[manual]` Di dashboard Supabase Auth: perketat rate limit sign-in.

### D2. Persempit CORS `[kode]` + `[manual]` deploy

1. `_shared/cors.ts`: ganti `"*"` dengan pembacaan `Deno.env.get("ALLOWED_ORIGIN")` (domain produksi FIR) dan refleksikan origin hanya kalau cocok daftar izin; localhost diizinkan lewat entri kedua untuk develop.
2. `[manual]` `supabase secrets set ALLOWED_ORIGIN=...` lalu deploy ulang ketiga functions.
3. Verifikasi: panggil function dari origin lain, preflight harus gagal; dari domain FIR tetap jalan.

### D3. Bersihkan sisa era GAS `[kode]`

1. Hapus `web/src/lib/gasClient.js` dan `web/src/lib/useGasRead.js` (sudah tidak diimpor siapa pun) plus entri `VITE_GAS_*` di `web/.env.local.example`.
2. Tulis ulang `docs/Implementation_Guide_FIR.md` bagian arsitektur supaya menggambarkan Supabase + RLS + Edge Functions, bukan GAS/Sheets; atau minimal beri peringatan tebal di atasnya bahwa bagian GAS sudah usang.
3. Bersihkan teks error di `MIPage.jsx` `ErrorState` yang masih menyebut "Sheets belum terhubung" dan nama-nama sheet GAS.

### D4. Konfigurasi lewat env `[kode]`

1. Pindahkan `SUPABASE_URL` dan `SUPABASE_ANON_KEY` dari hardcode `web/src/lib/supabase.js` ke `import.meta.env.VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` dengan fallback nilai sekarang; tambahkan ke `.env.local.example` dan konfigurasi Vercel. Bukan soal rahasia (anon key memang publik), tapi supaya rotasi key tidak butuh rilis kode.

---

## Fase E. Ketahanan import lanjutan (sisa item 3)

### E1. Import satu transaksi di server `[kode]` + `[manual]`

1. Buat RPC Postgres `import_karakter(payload jsonb)` (migration) yang menerima empat kelompok baris, menjalankan delete-then-insert per (sekolah, periode) DALAM SATU TRANSAKSI, dan mengembalikan ringkasan jumlah baris. Security definer dengan pemeriksaan peran caller AdminFammi di dalamnya, atau dibungkus Edge Function `admin-actions` (Fase A4).
2. `importKarakterWorkbook` beralih memanggil RPC itu; hapus loop chunk insert dari klien. Gagal di tengah berarti rollback total, tidak ada lagi sisa setengah import.
3. Perhatikan ukuran payload: satu file besar bisa ribuan baris JSON; kalau melewati batas request, kirim per periode (tiap periode satu transaksi utuh, itu sudah cukup atomik untuk kasus nyata).
4. `[manual]` jalankan migration; uji dengan sengaja membuat baris rusak di tengah file, pastikan database tidak berubah sama sekali.

### E2. Berhenti menebak bulan sheet summary `[kode]`

1. Di `karakterImporter.js`: fallback `periodeDominan` hanya boleh dipakai kalau seluruh file memuat SATU periode. Kalau `periodeCount` berisi lebih dari satu periode dan ada baris summary tanpa kolom bulan, kembalikan error jelas yang meminta kolom bulan diisi di sheet summary, bukan menebak.
2. Verifikasi: file dua bulan dengan summary tanpa kolom bulan harus ditolak dengan pesan itu; file satu bulan tetap jalan seperti sekarang.

### E3. Identitas murid yang stabil `[keputusan]` lalu `[kode]`

1. `[keputusan]` Pemilik produk menetapkan kolom id murid stabil (NIS/NISN atau id dari sistem asesmen) untuk ditambahkan ke sheet ekspor sumber.
2. Setelah ada: importer memakai kolom itu sebagai kunci `murid_id` (nama hanya label tampilan), dengan migrasi pemetaan untuk data lama (cocokkan nama ternormalisasi sekali, simpan hasilnya).
3. Sampai keputusan itu ada, normalisasi nama yang sudah dipasang jadi mitigasi terbaik yang tersedia.

### E4. Constraint pernyataan ortu `[keputusan]`

Migration `20260707120000` memasang unique (sekolah, murid, periode) untuk `karakter_pernyataan_ortu` dengan asumsi satu pernyataan per anak per bulan. Konfirmasikan asumsi itu ke pemilik produk SEBELUM migration dijalankan; kalau ternyata boleh lebih dari satu, ganti kuncinya (mis. tambah hash pernyataan) sebelum dieksekusi.

---

## Fase F. Perbaikan kecil

1. `[kode]` `parseTop5Pair` (`karakterMeta.js:52`): split nama dan nilai TANPA filter baris kosong terpisah; pasangkan per indeks dulu, baru buang pasangan yang dua-duanya kosong, supaya satu nilai kosong tidak menggeser semua pasangan setelahnya.
2. `[kode]` Pencocokan multi-pilih (`countMultiValue`, `matchedOptions`): normalisasi kedua sisi (trim, satukan spasi, samakan kutip) sebelum `includes`, dan log opsi tak dikenal ke konsol saat develop supaya perubahan wording form cepat ketahuan. Jangka panjang: simpan daftar opsi di tabel config per sekolah, bukan beku di kode.
3. `[kode]` Segarkan profil tiap kali App dimuat: saat mount, re-fetch `profiles` dan `school_modules` memakai sesi Supabase aktif, perbarui `fir_session`; kalau sesi Supabase sudah mati, hapus sesi lokal dan arahkan ke login dengan pesan "sesi berakhir", bukan dashboard kosong.
4. `[kode]` Bersihkan error lint bawaan yang terkonfirmasi saat pengerjaan kemarin: `SAMPLE_FAKTA`, `expanded` tak terpakai di `MIPage.jsx`, escape berlebih dan destrukturisasi tak terpakai di `karakterImporter.js`, plus pola `setState` sinkron dalam effect yang ditandai `react-hooks/set-state-in-effect`. Setelah bersih, aktifkan `npm run lint` sebagai gerbang sebelum push.
5. `[kode]` `useAdminCmsData.js`: masukkan `scheduleRes.error` ke pemeriksaan `firstError` (satu-satunya yang belum dicek di berkas itu).

---

## Ringkasan keputusan yang ditunggu dari pemilik produk

1. Empat parameter terbuka CLAUDE.md + semua cutoff sementara (Fase B2, B3): nilai final ambang status.
2. Aturan seri skor dominan MI, atau pastikan kolom final dari pipeline hulu (B3).
3. Kolom id murid stabil di sheet sumber (E3).
4. Boleh tidaknya lebih dari satu pernyataan ortu per anak per bulan (E4), menentukan constraint sebelum migration dijalankan.
5. Domain produksi resmi untuk allowlist CORS (D2).

## Ringkasan tindakan manual yang ditunggu dari pemilik proyek

1. Jalankan migration `20260707120000_karakter_unique_constraints.sql` (prasyarat upload Karakter berikutnya, dari commit sebelumnya).
2. `supabase db pull` dan commit hasilnya (A1), atau otorisasi konektor Supabase MCP supaya sesi agen bisa membacanya.
3. Deploy ulang Edge Functions setiap ada perubahan (A4, D1, D2) dan set secret `ALLOWED_ORIGIN`.
4. Perketat rate limit Auth di dashboard (D1).
5. Buat akun tes per peran untuk skrip tes RLS (A3).
