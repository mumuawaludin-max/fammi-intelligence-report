# Prompt: olah `Athirah - Master.xlsx` jadi berkas siap impor modul Wellbeing Assessment

Modul baru, kode usulan `wa` (Wellbeing Assessment). Ini asesmen lanjutan dari modul `sw`
(Screening Awal Wellbeing): peserta yang masuk daftar 200 orang di screening mengisi instrumen
PROTEK (42 item, 6 aspek, skala 1-6) plus 12 item kepuasan kerja (skala 1-5), enam pilihan
ganda, dan empat pertanyaan terbuka. Dua laporan, dua login: laporan kelompok untuk Human
Capital, laporan individu untuk tiap pegawai.

Dokumen ini berisi prompt untuk claude.ai yang mengubah berkas skoring mentah jadi berkas
olahan berisi angka final, pengelompokan, dan narasi. Hasilnya nanti dibaca pembaca modul `wa`
(seperti `npm run sw:baca` di modul `sw`), bukan dihitung ulang di React.

## Apa yang ada di berkas mentah (diperiksa 2026-10-13)

- Sheet `HASIL PENGOLAHAN`: 199 baris terisi, 81 kolom (A sampai CB). Sheet `SKORING` berisi
  ambang kategori PROTEK saja.
- Kolom A sampai D identitas (nama, jenis kelamin, usia, unit dan jabatan dalam satu teks bebas).
  Kolom D punya 188 variasi tulisan untuk kira-kira 25 unit; perlu dinormalisasi.
- Kolom E `PROTEK TOTAL`, lalu per aspek 7 item diikuti kolom jumlah aspek: P (F sampai M),
  R (N sampai U), O (V sampai AC), T (AD sampai AK), E (AL sampai AS), K (AT sampai BA).
- Item berbunyi negatif SUDAH dibalik skornya: jumlah 7 item sama persis dengan kolom aspek di
  seluruh 199 baris, dan item negatif berkorelasi positif dengan item positif. Jangan dibalik lagi.
- Sebaran: total rata-rata 194 dari 252; 189 orang Baik, 10 Perlu Perhatian, 0 di kategori terbawah. Aspek
  terendah Kemandirian (78 orang Perlu Perhatian), tertinggi Pertumbuhan Diri.
- Kolom BB cerita kelelahan atau stres. Formulirnya menjanjikan "Rahasia terjamin, jawaban dari
  Ahli akan kami masukkan di dalam laporan". Jadi laporan individu wajib memuat respons untuk
  cerita itu, dan isinya tidak boleh bocor ke laporan kelompok.
- Kolom BC dan BD orang yang paling dipercaya di tempat kerja dan alasannya.
- Kolom BE sampai BP 12 item kepuasan (1-5), BQ rata-ratanya. Rata-rata lembaga 3,93. Berkas
  TIDAK memuat ambang kategori kepuasan; ambang di bawah adalah usulan.
- Kolom BR sampai BW enam pilihan ganda (jawaban dipisah koma). Ada salah ketik di sumber:
  "eningkatan kesempatan pengembangan diri" (105 kali), maksudnya "Peningkatan kesempatan
  pengembangan diri".
- Kolom BX sampai CA empat pertanyaan terbuka (bahan tab Testimoni). Kolom CB nomor WhatsApp.
- Data janggal: 4 nama ganda (Winda Meyzulvina, Syahriyanti, Ina Muthmainnah, Mursyidul Ummah;
  dua di antaranya skor kepuasannya berbeda antar baris), satu sel jenis kelamin berisi nama
  orang ("Citra Permata Sari" di baris Nurul Azizah).
- Korelasi PROTEK total dengan skor kepuasan 0,61: orang yang kurang puas cenderung skor
  wellbeing-nya juga lebih rendah. Ini bahan insight kelompok.

## Bentuk berkas keluaran

Satu berkas `Athirah - Master - Olahan.xlsx` dengan tujuh sheet. Semua angka dihitung lewat
kode di dalam claude.ai, narasi ditulis model.

| Sheet | Isi | Satu baris = |
|---|---|---|
| `INDIVIDU` | 81 kolom asli apa adanya + kolom turunan + `laporan_json` | satu pengisi |
| `KELOMPOK` | agregat per cakupan: lembaga, jenjang, unit, kelompok jabatan + `laporan_json` | satu cakupan |
| `PILIHAN` | frekuensi enam pilihan ganda per cakupan | satu pilihan per pertanyaan per cakupan |
| `TESTIMONI` | jawaban empat pertanyaan terbuka, verbatim, dengan penanda layak tampil | satu jawaban |
| `ITEM` | kamus 42 item PROTEK dan 12 item kepuasan (kode, aspek, teks, teks singkat) | satu item |
| `PARAMETER` | semua ambang, label, dan pemetaan yang dipakai | satu parameter |
| `CATATAN_QC` | isian ganda, unit yang tak terpetakan, data janggal, baris cerita yang perlu ahli | satu catatan |

Nama kolom turunan dan skema JSON ada di dalam prompt. Kalau mau diubah, ubah di prompt, bukan
di hasil, supaya pembaca modul `wa` nanti cukup mengenal satu bentuk.

## Cara pakai

1. Buka claude.ai, mulai percakapan baru, pilih model **Claude Opus 4.8** atau **Fable 5**.
   Pastikan fitur analisis data atau pembuatan berkas aktif, karena prompt ini mewajibkan angka
   dihitung dengan kode. Jangan Haiku.
2. Lampirkan `Athirah - Master.xlsx`, tempel seluruh blok prompt di bawah.
3. Prompt bertahap. Tahap A (kode, angka, tujuh sheet) dan Tahap B (narasi kelompok) selesai
   dalam satu balasan. Tahap C (narasi 199 individu) dikerjakan per 40 baris; tiap kali Claude
   berhenti, balas "lanjutkan". Claude menulis ke berkas yang sama setiap batch, jadi kalau
   percakapan terputus, lampirkan berkas olahan terakhir dan minta lanjut dari baris berikutnya.
4. Di akhir Claude menjalankan kode pemeriksaan sendiri (semua `laporan_json` terbaca, kunci
   lengkap, tanpa digit di narasi individu, tanpa kata terlarang). Minta ringkasan hasilnya.
5. Periksa cepat di Excel: sheet `CATATAN_QC` (terutama pemetaan unit), tiga sel `laporan_json`
   acak (diawali `{`, diakhiri `}`, satu baris), dan jumlah baris `INDIVIDU` yang `dipakai = Ya`.
6. Kirim berkas olahan ke sesi Claude Code ini untuk tahap berikutnya (rencana pengembangan).

Narasi dari berkas ini adalah DRAF. Di FIR ia tetap masuk gerbang persetujuan manusia sebelum
tayang (CLAUDE.md butir 6). Khusus respons cerita stres, peninjaunya harus psikolog Fammi.

## Parameter yang belum diputuskan pemilik produk

Semua ada di blok PARAMETER di dalam prompt, tinggal diganti sebelum ditempel.

1. **Ambang kategori kepuasan.** Berkas tidak punya. Usulan: lima tingkat selebar 0,8 pada skala
   1-5 (Sangat Puas ≥ 4,20; Puas 3,40-4,19; Netral 2,60-3,39; Tidak Puas 1,80-2,59; Sangat Tidak
   Puas < 1,80), dan tiga tingkat untuk kartu ringkasan (Puas ≥ 3,40; Netral 2,60-3,39; Tidak
   Puas < 2,60). Dengan ambang ini: Puas 183, Netral 15, Tidak Puas 1.
2. **Ambang item kuat atau perlu penguatan.** Individu: skor item 5-6 kuat, 4 cukup, 1-3 perlu
   penguatan. Kelompok: rata-rata item ≥ 5,0 kuat, < 4,0 perlu penguatan.
3. **Label kategori.** DIPUTUSKAN 2026-10-19: kategori terbawah tampil sebagai "Perlu
   Pendampingan"; label lama dari sheet SKORING dilarang muncul di mana pun. Prompt di bawah
   sudah memakainya. Berkas olahan lama yang masih memakai label lama tetap terbaca: pembaca
   (`waPembaca.js`) memetakan kolomnya dan mengganti kata itu di narasi, kecuali kutipan
   verbatim pegawai. Judul "Kesehatan Mental" masih mengikuti desain.
4. **Nama pegawai di tab Testimoni dan Top 5.** Desain menampilkan nama. Untuk Human Capital
   ini sejalan dengan `sw` (Human Capital boleh lihat nama). Yang perlu ditegaskan: kutipan
   testimoni tampil verbatim dengan nama, jadi prompt memberi penanda `layak_tampil` untuk
   jawaban yang menyebut nama orang lain atau berisi keluhan ke individu tertentu.
5. **Tema cerita stres di laporan kelompok.** Prompt mengizinkan rangkuman TEMA (tanpa kutipan,
   tanpa identitas, minimal 5 orang per tema) dari kolom BB. Kalau pemilik produk mau cerita itu
   benar-benar hanya untuk orangnya sendiri dan psikolog, hapus bagian `tema_cerita` dari skema.
6. **Isian ganda.** Mengikuti `sw`: nama dan unit sama dianggap orang yang sama, dipakai isian
   terakhir (baris paling bawah). Untuk Winda Meyzulvina dan Mursyidul Ummah dua barisnya beda
   nomor WhatsApp dan beda skor kepuasan, jadi mungkin memang dua orang; dicatat di `CATATAN_QC`.

## Yang saya perlukan untuk tahap 2 (rencana pengembangan)

Berkas olahan hasil prompt ini, plus keputusan untuk enam parameter di atas. Dari situ saya akan
menyusun rencana modul `wa`: tabel Supabase dan RLS (pola `sw_dataset`/`sw_unit`/`sw_individu`),
pembaca berkas (`npm run wa:baca`), dua shell (Human Capital desktop lima tab sesuai desain,
Pegawai ponsel), peran dan akun, serta jalur persetujuan narasi.

## Prompt

```text
Kamu analis yang menyiapkan laporan Wellbeing Assessment untuk pegawai sebuah lembaga pendidikan. Saya melampirkan satu berkas Excel. Sheet "HASIL PENGOLAHAN" berisi satu baris per pengisi dengan skor yang SUDAH FINAL (item negatif sudah dibalik, jumlah aspek dan total sudah dihitung). Sheet "SKORING" berisi ambang kategori PROTEK.

TUGAS: hasilkan berkas Excel baru bernama "Athirah - Master - Olahan.xlsx" dengan tujuh sheet (INDIVIDU, KELOMPOK, PILIHAN, TESTIMONI, ITEM, PARAMETER, CATATAN_QC), lalu isi kolom narasi "laporan_json" di sheet KELOMPOK dan INDIVIDU. Kerjakan dalam tiga tahap, A lalu B lalu C.

PRINSIP, berlaku di semua tahap:
1. SEMUA ANGKA dihitung dengan kode Python (pandas dan openpyxl), tidak ada angka yang kamu ketik tangan. Narasi kamu tulis berdasarkan angka hasil kode.
2. Jangan menghitung ulang atau "memperbaiki" skor yang sudah ada. Jangan membalik item apa pun. Jangan mengubah satu sel pun dari 81 kolom asli; kolom turunan ditambahkan di sebelah kanannya.
3. Nomor WhatsApp (kolom CB) hanya boleh ada di sheet INDIVIDU. Jangan menyalinnya ke sheet lain, JSON, atau jawabanmu di chat.
4. Kolom BB (cerita kelelahan atau stres) RAHASIA. Isinya hanya dipakai untuk draf respons di laporan individu orang itu sendiri (respons_cerita). Jangan pernah mengutip, memparafrase, atau menyebut detailnya di sheet KELOMPOK, PILIHAN, TESTIMONI, insight kelompok, maupun di chat. Satu-satunya pengecualian adalah tema_cerita di KELOMPOK cakupan lembaga: nama tema beserta jumlah orang, tanpa kutipan, hanya tema yang dialami minimal MIN_TEMA_CERITA orang.
5. Kamu bukan psikolog yang mendiagnosis. Dilarang kata "gangguan", "depresi", "cemas" sebagai label, "tidak sehat", "sakit mental", "burnout" sebagai vonis. Pakai bahasa kondisi: terasa berat, perlu dukungan, sudah kuat, masih bisa ditingkatkan. Label kategori terbawah di sheet SKORING juga dilarang dalam bentuk apa pun (kata benda maupun kata sifat); tulis "Perlu Pendampingan", atau "berhati-hati" kalau maksudnya sikap.
6. Nama orang hanya tampil di sheet INDIVIDU dan TESTIMONI. Narasi KELOMPOK tidak menyebut nama siapa pun.

PARAMETER (dipakai kode dan narasi; tulis juga ke sheet PARAMETER):
- Aspek PROTEK, kunci dan label produk: p = "Penerimaan Diri" (kolom F-L, jumlah di M), r = "Relasi dengan Orang Lain" (N-T, jumlah U), o = "Optimalisasi Potensi Diri" (V-AB, jumlah AC), t = "Tujuan Hidup" (AD-AJ, jumlah AK), e = "Eksplorasi Tempat Kerja" (AL-AR, jumlah AS), k = "Kemandirian Personal" (AT-AZ, jumlah BA). Total di kolom E, maksimum 252, per aspek maksimum 42, per item maksimum 6.
- Kategori per aspek (ambang dari sheet SKORING): 1-14 "Perlu Pendampingan", 15-28 "Perlu Perhatian", 29-42 "Baik". Kategori total: 1-70 "Perlu Pendampingan", 71-140 "Perlu Perhatian", 141-252 "Baik". Sheet SKORING memakai label lain untuk kategori terbawah; label itu DILARANG muncul di mana pun di berkas olahan, termasuk nama kolom dan narasi. Pakai "Perlu Pendampingan".
- Persen: pct = skor / maksimum x 100, satu desimal.
- Item PROTEK: skor 5-6 "kuat", 4 "cukup", 1-3 "perlu penguatan". Untuk rata-rata kelompok: ≥ 5,0 "kuat", 4,0 sampai 4,99 "cukup", < 4,0 "perlu penguatan". Kode item: huruf aspek kapital + nomor urut, P1 sampai K7.
- Kepuasan, 12 item kolom BE-BP skala 1-5, rata-rata di BQ. Enam dimensi, dua item tiap dimensi, rata-rata dua desimal: peran_pekerjaan = "Peran & Pekerjaan" (BE, BH); kepemimpinan_keputusan = "Kepemimpinan & Keputusan" (BF, BG); relasi_budaya = "Relasi & Budaya Kerja" (BI, BP); organisasi_komunikasi = "Organisasi & Komunikasi" (BJ, BO); pengembangan_karir = "Pengembangan & Karir" (BK, BL); keseimbangan_apresiasi = "Keseimbangan & Apresiasi" (BM, BN).
- Kategori kepuasan lima tingkat (untuk rata-rata orang, rata-rata dimensi, dan rata-rata kelompok): ≥ 4,20 "Sangat Puas"; 3,40-4,19 "Puas"; 2,60-3,39 "Netral"; 1,80-2,59 "Tidak Puas"; < 1,80 "Sangat Tidak Puas". Tiga tingkat: ≥ 3,40 "Puas"; 2,60-3,39 "Netral"; < 2,60 "Tidak Puas". Bintang = rata-rata dibulatkan ke setengah terdekat.
- Pilihan ganda, enam kolom dan kode pertanyaan: BR disukai, BS tidak_disukai, BT mudah, BU sulit, BV keputusan_disukai, BW keputusan_tidak_disukai. Jawaban dipisah koma. Rapikan ejaan ke daftar pilihan resmi yang muncul di data; "eningkatan kesempatan pengembangan diri" dibaca "Peningkatan kesempatan pengembangan diri". Jangan mengarang pilihan baru.
- Pertanyaan terbuka dan kode: BX tempat_kerja_lebih_baik, BY kebijakan_diubah, BZ pimpinan_efektif, CA pelatihan_dibutuhkan.
- Daftar unit baku (unit_normal), pilih yang paling cocok dari teks kolom D: "TK Athirah Kajaolalido" (TK Islam Athirah Makassar atau TK Islam Athirah 1), "TK Athirah Baruga", "SD Athirah Kajaolalido" (SD Islam Athirah Makassar atau SD Islam Athirah 1), "SD Athirah Baruga" (SD Islam Athirah 2), "SD Athirah Bone", "SMP Athirah Kajaolalido" (SMP Islam Athirah Makassar), "SMP Athirah Baruga", "SMP Athirah Bone", "SMA Athirah Kajaolalido" (SMA Islam Athirah Makassar atau SMA Islam Athirah 1), "SMA Athirah Baruga", "SMA Athirah Bone", "Asrama Athirah Baruga" (Boarding Bukit Baruga, termasuk dapur dan OB asrama Baruga), "Boarding Bone" (Asrama Bone, termasuk dapur dan OB asrama Bone), "Departemen HC", "Departemen ICT", "Departemen Keuangan", "Departemen Humas", "Departemen Sarling" (sarana dan lingkungan, security, maintenance, OB kantor), "Departemen Procurement", "Departemen Kurikulum", "Pendidikan Inklusi" (GPK yang tidak menyebut sekolah), "QGDP TK dan SD" (guru Al-Qur'an TK atau SD yang tidak menyebut sekolah), "QGDP SMP dan SMA", "LPMP", "Sekretariat", "Direktur dan Wakil Direktur". Kalau teks menyebut sekolah DAN jabatan GPK atau guru Al-Qur'an, unit_normal ikut sekolahnya. "Kajol" = Kajaolalido, "BB" = Bukit Baruga = Baruga. Kalau benar-benar tidak bisa ditentukan (mis. hanya "Guru"), isi "Tidak teridentifikasi" dan catat di CATATAN_QC.
- Jenjang dari unit_normal: TK, SD, SMP, SMA, Asrama (dua unit asrama), Kantor (semua departemen, sekretariat, LPMP, QGDP, inklusi, kurikulum, direksi). Unit tak teridentifikasi: jenjang "Tidak teridentifikasi".
- Kelompok jabatan (kelompok_jabatan) dari teks kolom D: "Pimpinan" (kepala sekolah, wakasek, wakakur, kepala TK, kepala asrama, kepala departemen, kepala seksi, koordinator, supervisor, direktur), "Guru" (guru, guru kelas, guru mapel, guru BK, guru Al-Qur'an, GPK, guru pendamping, asisten guru, pembina OSN), "Pembina Asrama", "Tenaga Kependidikan" (tata usaha, laboran, perpustakaan, UKS, ICT, staf administrasi sekolah), "Staf Kantor" (staf departemen, analis, HC, keuangan, humas, LPMP, procurement, aset), "Pendukung Layanan" (OB, cleaning service, dapur, security, satpam, maintenance, operator fotokopi, baby house). Kalau tidak jelas: "Tidak teridentifikasi".
- peran_testimoni untuk chip di tab Testimoni: Pimpinan -> "Pimpinan Sekolah"; Guru dan Pembina Asrama -> "Guru"; Tenaga Kependidikan, Staf Kantor, Pendukung Layanan -> "Staf dan Karyawan"; lainnya -> "Lainnya".
- Isian ganda: nama (tanpa gelar, huruf kecil, spasi dirapikan) dan unit_normal sama = orang yang sama; dipakai baris PALING BAWAH, baris lain dipakai = "Tidak". Catat semuanya di CATATAN_QC, termasuk kalau nomor WhatsApp dua barisnya berbeda (tulis "nomor WA berbeda", jangan tulis nomornya).
- Jenis kelamin hanya boleh "Perempuan" atau "Laki-laki"; nilai lain dikosongkan dan dicatat.
- MIN_N_NARASI = 5 (narasi kelompok hanya untuk cakupan dengan pengisi ≥ 5). MIN_TEMA_CERITA = 5.

TAHAP A, KODE. Buat tujuh sheet berikut dan simpan berkasnya.

Sheet INDIVIDU: 81 kolom asli (A sampai CB, nama kolom asli dipertahankan) lalu kolom turunan ini, urut:
id_responden ("R001" dst mengikuti urutan baris asli), dipakai (Ya/Tidak), isian_ganda (Ya/Tidak), jenis_kelamin_bersih, usia, unit_asli (salinan D), unit_normal, jenjang, kelompok_jabatan, jabatan_bersih (jabatan saja, dirapikan huruf kapitalnya, maks 6 kata), peran_testimoni,
protek_total, protek_pct, protek_kategori,
p_skor, p_pct, p_kategori, r_skor, r_pct, r_kategori, o_skor, o_pct, o_kategori, t_skor, t_pct, t_kategori, e_skor, e_pct, e_kategori, k_skor, k_pct, k_kategori,
aspek_tertinggi (kunci huruf; kalau seri, yang urutannya lebih dulu dalam p r o t e k), aspek_terendah,
n_item_kuat, n_item_cukup, n_item_perlu,
item_json (array 42 objek {"kode":"P1","aspek":"p","skor":6,"pct":100.0,"kategori":"kuat"} urut kode; teks item tidak perlu, ada di sheet ITEM),
kepuasan_rata, kepuasan_kategori5, kepuasan_kategori3, kepuasan_bintang,
kep_peran_pekerjaan, kep_peran_pekerjaan_kategori, kep_kepemimpinan_keputusan, kep_kepemimpinan_keputusan_kategori, kep_relasi_budaya, kep_relasi_budaya_kategori, kep_organisasi_komunikasi, kep_organisasi_komunikasi_kategori, kep_pengembangan_karir, kep_pengembangan_karir_kategori, kep_keseimbangan_apresiasi, kep_keseimbangan_apresiasi_kategori,
kep_dimensi_tertinggi, kep_dimensi_terendah (kunci dimensi),
pilihan_disukai_json, pilihan_tidak_disukai_json, pilihan_mudah_json, pilihan_sulit_json, pilihan_keputusan_disukai_json, pilihan_keputusan_tidak_disukai_json (masing-masing array string pilihan yang sudah dirapikan),
orang_dipercaya (salinan BC dirapikan, kosong kalau "-" atau "tidak ada"), alasan_dipercaya (salinan BD),
cerita_ada (Ya kalau BB terisi lebih dari 3 kata dan bukan "tidak ada"), cerita_perlu_ahli (diisi di Tahap C, sementara kosong),
laporan_json (diisi di Tahap C, sementara kosong).

Sheet KELOMPOK: satu baris per cakupan, hanya dari baris dipakai = Ya. Cakupan: "lembaga" (satu baris, nama "Sekolah Islam Athirah"), "jenjang" (satu baris per jenjang), "unit" (satu baris per unit_normal), "kelompok_jabatan" (satu baris per kelompok). Kolom:
cakupan, nama, n_responden, n_perempuan, n_laki, usia_rata, usia_min, usia_max,
protek_rata, protek_pct, n_baik, n_perlu_perhatian, n_pendampingan, pct_baik, pct_perlu_perhatian, pct_pendampingan,
untuk tiap aspek X dalam p r o t e k: X_rata, X_pct, X_n_baik, X_n_perlu_perhatian, X_n_pendampingan,
aspek_tertinggi, aspek_terendah,
item_json (array 42 objek {"kode","aspek","rata","pct","kategori"} urut kode; kategori memakai ambang kelompok),
n_item_kuat, n_item_cukup, n_item_perlu,
kepuasan_rata, kepuasan_kategori5, kepuasan_bintang, n_puas, n_netral, n_tidak_puas, pct_puas, pct_netral, pct_tidak_puas,
untuk tiap dimensi D: kep_D_rata, kep_D_kategori5, kep_D_n_sangat_puas, kep_D_n_puas, kep_D_n_netral, kep_D_n_tidak_puas, kep_D_n_sangat_tidak_puas,
kep_dimensi_tertinggi, kep_dimensi_terendah,
korelasi_protek_kepuasan (Pearson, dua desimal, kosong kalau n < 10),
n_cerita (jumlah cerita_ada = Ya),
laporan_json (diisi di Tahap B).

Sheet PILIHAN: cakupan, nama, pertanyaan_kode, pilihan, jumlah, pct_responden (jumlah / n_responden cakupan x 100, satu desimal). Semua cakupan yang ada di KELOMPOK. Urut cakupan, pertanyaan, jumlah menurun.

Sheet TESTIMONI: id_responden, nama, unit_normal, jenjang, peran_testimoni, pertanyaan_kode, jawaban (verbatim, hanya dirapikan spasi), panjang_kata, layak_tampil (Ya/Tidak), alasan_tidak_tampil, tema (1-3 kata, kamu yang mengisi di Tahap B). layak_tampil = Tidak kalau: kosong, "-", kurang dari 4 kata, "tidak ada", menyebut nama orang lain, memuat nomor telepon, atau berisi keluhan yang mengarah ke individu tertentu. Hanya baris dipakai = Ya.

Sheet ITEM: kode, instrumen ("protek" atau "kepuasan"), aspek_atau_dimensi (kunci), label_aspek, teks_asli (judul kolom asli tanpa awalan "P - "), teks_singkat (parafrase netral maks 12 kata yang kamu tulis, arah positif, cocok untuk label bar; mis. P6 "Puas dengan pencapaian hidup sendiri"), arah_asli ("positif" atau "negatif", dilihat dari bunyi kalimatnya; ini sekadar catatan, skor sudah dibalik).

Sheet PARAMETER: nama, nilai, keterangan. Tulis semua ambang, label, pemetaan dimensi, daftar unit baku, MIN_N_NARASI, MIN_TEMA_CERITA, tanggal pengolahan, dan jumlah baris dipakai.

Sheet CATATAN_QC: jenis (isian_ganda | unit_tak_terpetakan | jenis_kelamin | pilihan_dirapikan | cerita_perlu_ahli | lainnya), id_responden, keterangan. Untuk cerita_perlu_ahli cukup id dan satu frasa alasan umum, tanpa kutipan.

Setelah sheet jadi, tampilkan di chat: jumlah baris dipakai, tabel unit_normal dengan jumlahnya, jumlah per kategori total dan kepuasan tiga tingkat. Lanjutkan ke Tahap B tanpa menunggu.

TAHAP B, NARASI KELOMPOK. Isi laporan_json di sheet KELOMPOK untuk cakupan lembaga dan untuk setiap cakupan lain yang n_responden ≥ MIN_N_NARASI. Isi juga kolom tema di sheet TESTIMONI. Satu objek JSON per sel, minified satu baris, tanpa pagar markdown.

Skema laporan_json KELOMPOK (semua kunci wajib ada; untuk cakupan selain lembaga, bagian "survey", "testimoni", "tema_cerita", dan "insight" boleh berisi array kosong atau string kosong kalau datanya tipis):
{
  "ringkasan": {
    "wellbeing": "2-3 kalimat untuk kartu ungu di bawah skor: sebut aspek yang jadi kekuatan kelompok dan aspek yang relatif rendah, pakai label produk",
    "kepuasan": "2-3 kalimat untuk kartu kuning: dimensi paling memuaskan dan yang belum sesuai harapan"
  },
  "wellbeing": {
    "hal_baik": "1-2 kalimat untuk kartu plus: hal yang sudah kuat, sebut aspek dan satu item kuat dengan kata-kata biasa",
    "hal_ditingkatkan": "1-2 kalimat untuk kartu minus",
    "resume_kuat": "1 kalimat untuk halaman detail: faktor apa yang paling menopang kelompok yang Baik",
    "resume_lemah": "1 kalimat: aspek apa yang paling sering rendah pada kelompok Perlu Perhatian atau Perlu Pendampingan"
  },
  "kepuasan": {
    "hal_baik": "1-2 kalimat",
    "hal_ditingkatkan": "1-2 kalimat"
  },
  "survey": {
    "fokus_kekuatan": "1-2 kalimat untuk kartu hijau 'Fokus pada kekuatan lembaga', dari pilihan disukai + mudah + keputusan disukai",
    "perbaikan_segera": "1-2 kalimat untuk kartu jingga 'Lakukan perbaikan segera', dari pilihan tidak disukai + sulit + keputusan tidak disukai",
    "narasi": {
      "disukai": "1-2 kalimat di bawah grafik", "tidak_disukai": "...", "mudah": "...", "sulit": "...", "keputusan_disukai": "...", "keputusan_tidak_disukai": "..."
    }
  },
  "testimoni": {
    "tema": {
      "tempat_kerja_lebih_baik": [ {"tema": "maks 5 kata", "jumlah": 0, "ringkasan": "1 kalimat parafrase pola, bukan kutipan"} ],
      "kebijakan_diubah": [ ... ], "pimpinan_efektif": [ ... ], "pelatihan_dibutuhkan": [ ... ]
    }
  },
  "tema_cerita": [ {"tema": "maks 5 kata", "jumlah": 0} ],
  "insight": [
    {"judul": "maks 8 kata", "isi": "2-3 kalimat temuan lintas data yang tidak terlihat dari satu grafik saja", "bukti": "angka pendukung dari kode, boleh memuat digit"}
  ],
  "tindak_lanjut": [
    {"prioritas": "tinggi | sedang | rendah", "untuk": "Human Capital | Pimpinan unit | Direksi", "judul": "aksi diawali kata kerja, maks 8 kata", "mengapa": "2 kalimat berpijak pada data", "terkait": "kunci aspek, dimensi kepuasan, atau pertanyaan", "langkah": ["3 langkah konkret yang bisa dibayangkan kejadiannya"], "indikator": ["2 penanda yang bisa diamati atau dihitung"]}
  ]
}

Aturan Tahap B:
- Tema testimoni: maksimal 6 tema per pertanyaan, urut jumlah menurun, jumlah harus jujur dari penghitungan kode (beri setiap jawaban satu tema di kolom tema sheet TESTIMONI dulu, lalu hitung). Hanya dari jawaban layak_tampil = Ya. Untuk pelatihan_dibutuhkan, tema sebaiknya nama jenis pelatihan, karena ini bahan langsung untuk Human Capital.
- tema_cerita: hanya cakupan lembaga, hanya tema dengan jumlah ≥ MIN_TEMA_CERITA, tanpa kutipan, tanpa unit, tanpa jabatan. Cakupan lain: array kosong.
- insight: 4-6 untuk lembaga, 1-3 untuk cakupan lain. Harus lintas data: perbandingan antar unit atau jenjang atau kelompok jabatan, hubungan wellbeing dengan kepuasan, aspek yang serentak rendah, kesenjangan antara pilihan ganda dan skor, kelompok yang perlu perhatian lebih. Sebut cakupan pembanding dengan nama, tanpa nama orang.
- tindak_lanjut: 4-6 untuk lembaga, 1-3 untuk cakupan lain. Yang untuk "Pimpinan unit" harus bisa dijalankan tanpa anggaran baru; yang untuk "Direksi" boleh kebijakan lintas unit. Jangan menyalin isi antar cakupan dengan mengganti nama.
- Di narasi kelompok, angka boleh ditulis sebagai persen bulat tanpa desimal atau jumlah orang. Jangan menulis angka yang tidak ada di sheet.

TAHAP C, NARASI INDIVIDU. Isi laporan_json dan cerita_perlu_ahli untuk setiap baris dipakai = Ya, 40 baris per batch, urut id_responden. Setelah tiap batch: simpan berkas, laporkan rentang id yang selesai dan jumlah yang tersisa, lalu berhenti dan tunggu saya menulis "lanjutkan". Kalau saya melampirkan berkas olahan dan minta lanjut, teruskan dari baris pertama yang laporan_json-nya kosong.

Skema laporan_json INDIVIDU (semua kunci wajib):
{
  "ringkasan": {
    "wellbeing": "2 kalimat untuk kartu ungu: aspek yang jadi kekuatan utama Anda, dan aspek yang relatif rendah. Sebut label produk persis",
    "kepuasan": "2 kalimat untuk kartu kuning: dimensi yang paling memuaskan dan yang belum sesuai harapan"
  },
  "wellbeing": {
    "hal_kuat": "1-2 kalimat untuk kartu plus, berangkat dari item berskor tertinggi, ditulis dengan kata-kata biasa",
    "hal_tantangan": "1-2 kalimat untuk kartu minus, berangkat dari item berskor terendah, nada menemani bukan menilai"
  },
  "kepuasan": {
    "hal_kuat": "1 kalimat",
    "hal_tantangan": "1 kalimat"
  },
  "refleksi": "1 kalimat pertanyaan terbuka yang mengaitkan pilihan ganda orang ini (hal disukai, sulit, keputusan) dengan aspek terendahnya",
  "aspek": {
    "p": {"arti": "1-2 kalimat: apa yang terlihat dari tujuh pernyataan aspek ini (yang sudah terasa dan yang belum) dan artinya dalam keseharian orang ini", "langkah": "1-2 kalimat: yang bisa ia lakukan sendiri, konkret (apa, kapan, dengan siapa); aspek kuat = cara menjaga dan memakainya, aspek lemah = satu latihan kecil yang menyasar pernyataan terendahnya"},
    "r": {"arti": "...", "langkah": "..."}, "o": {"arti": "...", "langkah": "..."}, "t": {"arti": "...", "langkah": "..."}, "e": {"arti": "...", "langkah": "..."}, "k": {"arti": "...", "langkah": "..."}
  },
  "langkah_kecil": [
    {"judul": "kalimat perintah tanpa kata ganti orang, maks 10 kata", "alasan": "1 kalimat netral kenapa cocok untuk pola datanya", "terkait": "kunci aspek atau dimensi", "jangka": "Minggu ini | Bulan ini | 3 bulan"}
  ],
  "respons_cerita": {
    "ada": true,
    "draf": "tanggapan untuk cerita di kolom BB, 90-150 kata, satu sampai tiga paragraf dipisah \n\n, mengikuti ATURAN TANGGAPAN CERITA di bawah. Jika BB kosong: 25-45 kata, menulis cerita tidak wajib, hasil tetap bisa dibaca, dan bila kolom BC jelas satu kalimat bersyarat yang menyebut orang itu lewat perannya; tanpa rujukan dan tanpa terima kasih di pembuka",
    "perlu_perhatian_ahli": false,
    "alasan_perhatian": "kosong, atau satu frasa umum tanpa kutipan"
  }
}

Aturan Tahap C:
- aspek: WAJIB untuk keenam aspek PROTEK, kuat maupun lemah; setiap orang perlu tahu arti hasilnya sendiri di tiap aspek dan apa yang bisa dilakukan (keputusan pemilik produk 2026-10-19). Spesifik pada pola pernyataan orang itu, bukan definisi aspek. Tiap isian maksimal 45 kata, tanpa angka. Jangan mengulang langkah_kecil. Saran ke Human Capital untuk dihubungkan dengan psikolog hanya di aspek Perlu Pendampingan yang memang berat.
- langkah_kecil: 2-3 item, item pertama kemenangan cepat, sesuaikan dengan kelompok_jabatan (keseharian guru beda dari pembina asrama beda dari staf kantor beda dari pendukung layanan).
- perlu_perhatian_ahli = true (dan tulis "Ya" di kolom cerita_perlu_ahli, serta baris di CATATAN_QC) kalau cerita menyebut: tubuh sampai tumbang atau dirawat, sedih berkepanjangan, merasa dikhianati atau diperlakukan tidak adil oleh pimpinan, lingkungan yang disebut toxic, kesepian yang dalam, putus asa, menyakiti diri, atau permintaan bantuan langsung. Respons untuk kasus ini mengikuti ATURAN TANGGAPAN CERITA (pertanyaan gejala dijawab dulu, saran konsultasi psikolog ditulis sebagai pertanyaan ke Human Capital). Draf ini akan ditinjau psikolog sebelum dikirim.
- DILARANG menawarkan apa pun atas nama Fammi: percakapan, percakapan lanjutan, sesi, konsultasi, konseling, pendampingan, "ruang aman", "siap mendengar". Jangan menyebut "tim pendamping", "tim Fammi", atau "kami" di teks individu, termasuk langkah_kecil (bukan "Hubungi tim pendamping..."). Kebutuhan bantuan ahli selalu diarahkan lewat Human Capital sebagai pertanyaan ("Anda bisa menanyakan akses konsultasi psikolog kepada Human Capital"), bukan dijanjikan; psikolog di luar sekolah boleh disebut sebagai pilihan.
- Dilarang menjanjikan tindakan lembaga ("pimpinan akan...", "Human Capital akan..."). Dilarang membocorkan bahwa Human Capital membaca skor.
- SAPAAN: ringkasan, wellbeing, kepuasan, refleksi, respons_cerita memakai "Anda". langkah_kecil (judul dan alasan) DILARANG memakai kata ganti orang; tulis kalimat perintah dan penjelasan netral.
- DILARANG menulis ANGKA atau DIGIT di semua teks individu (angka sudah tampil di layar); tulis kualitatif: "paling tinggi di antara enam aspek", "satu-satunya aspek yang masuk Perlu Perhatian".
- Dua orang dengan data berbeda harus menghasilkan teks yang benar-benar berbeda, bukan template ganti nama. Jangan menyebut nama orang di dalam JSON.

ATURAN BAHASA, semua tahap:
- Bahasa Indonesia hangat dan langsung, seperti asisten yang sungguh membaca jawaban orang itu. Untuk kelompok: seperti analis yang bicara ke Human Capital, lugas, tanpa jargon.
- Maksimal 3 kalimat per field naratif. respons_cerita dibatasi kata (90-150), bukan kalimat.
- DILARANG em-dash dan "--". Pakai koma atau pecah kalimat.
- Pakai "jika", bukan "kalau" (keputusan pemilik produk 2026-10-19: "kalau" dianggap tidak baku).
- DILARANG pola tulisan AI: "sangat penting", "pada dasarnya", "perlu dicatat", "komprehensif", "holistik", "sesungguhnya", "tentu saja", "dengan demikian", "merupakan", "terdapat", "berperan penting", "tak dapat dipungkiri", "mari kita", tiga sinonim beruntun, kalimat dibuka kata sambung setelah titik.
- DILARANG istilah akademik di teks tampilan: Ryff, psychological well-being, PWB, autonomy, environmental mastery, Likert, Pearson (boleh di bukti insight).
- JSON valid: kutip ganda di-escape, tanpa baris baru mentah di dalam string, satu baris per sel, tanpa pagar markdown.

PEMERIKSAAN AKHIR (jalankan dengan kode setelah batch terakhir, laporkan hasilnya): semua baris dipakai = Ya punya laporan_json yang terbaca json.loads dengan semua kunci wajib; semua cakupan dengan n ≥ MIN_N_NARASI punya laporan_json; tidak ada digit di teks individu kecuali di dalam kunci "terkait"; tidak ada kata terlarang; tidak ada kata "Anda" atau "saya" di langkah_kecil; tidak ada nomor WhatsApp di luar sheet INDIVIDU; jumlah tema testimoni sama dengan hitungan kolom tema. Kalau ada yang gagal, perbaiki dan jalankan ulang pemeriksaan.
```

## Kaitan ke modul `sw` dan kode yang akan dibuat

- Daftar unit baku di prompt disalin dari `web/sw-data-lokal/athirah.json` (25 unit modul `sw`),
  supaya nanti `wa` bisa ditautkan ke unit dan akun `sw` yang sudah ada (`profiles.sw_unit_id`,
  `sw_unit_binaan`), bukan membuat pohon unit kedua.
- Pembaca berkas `wa` nanti memindahkan angka apa adanya dari sheet `INDIVIDU` dan `KELOMPOK`,
  mengikuti pola `web/src/pages/sw/lib/swPembaca.js`. Satu-satunya yang dihitung ulang kalau
  pemilik produk mengubah parameter adalah pengolahan ulang di claude.ai, bukan di React.
- Narasi `laporan_json` masuk sebagai draf `menunggu_persetujuan`; `respons_cerita` dengan
  `perlu_perhatian_ahli = true` harus punya jalur tinjau psikolog terpisah di layar persetujuan.
