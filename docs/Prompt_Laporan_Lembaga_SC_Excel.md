# Prompt: isi kolom `briefing_json` + `tindak_lanjut_json` (laporan lembaga School Culture)

Jalur perumusan laporan AGREGAT (lembaga/kelompok) SC **di luar Gemini API**, padanan langsung
`docs/Prompt_Laporan_Individu_SC_Excel.md` yang sudah dipakai laporan per orang. Dipakai saat
Gemini sedang padat (503 berjam-jam pernah menggagalkan generate massal, lihat riwayat di
`supabase/functions/_shared/geminiPrompt.ts`) atau kapan pun pemilik produk mau merumuskan
briefing dan tindak lanjut lembaga di luar jam kerja admin.

Ini mengisi bagian dashboard "Laporan Lembaga" yang selama ini kosong: narasi briefing, "Cerita
dari Tim" (word cloud tiga kolom), "Suara Tim" (Kesejahteraan), dan kartu "Tindak Lanjut yang
Perlu Dilakukan" -- **satu kartu untuk SETIAP dimensi budaya dan SETIAP subdimensi kesejahteraan**
(bukan cuma dua rekomendasi prioritas), lengkap dengan Fokus/Langkah/Indikator Keberhasilan/Hal
yang Perlu Diwaspadai, untuk role Manajemen, Kepala Sekolah, dan Yayasan sekaligus.

## Cara pakai

1. Buka file Excel School Culture yang biasa diupload (sheet `Personal` + `Lembaga`).
2. Di sheet `Lembaga`, cari baris yang kolom `unit`-nya KOSONG -- itu baris ringkasan
   seluruh sekolah (bukan baris per unit/jenjang). Cuma baris ini yang perlu diisi, baris per
   unit dibiarkan seperti biasa.
3. Buka claude.ai, lampirkan file Excel-nya, tempel prompt di bawah.
   - Model: **Claude Opus 4.8** atau **Fable 5**. Jangan Haiku: sembilan rekomendasi tindak
     lanjut untuk tiga role sekaligus harus konsisten dan JSON-nya harus valid semua.
4. Claude mengembalikan file Excel yang sama dengan dua kolom baru di sheet Lembaga, di baris
   ringkasan sekolah itu saja: `briefing_json` dan `tindak_lanjut_json`.
5. Cek sel itu: harus diawali `{`, diakhiri `}`, tanpa pagar markdown, satu baris (tanpa ganti
   baris di dalam sel).
6. Upload seperti biasa lewat CMS. Layar Upload akan menampilkan apakah briefing/tindak lanjut
   lembaga siap pakai, dan pesan kalau JSON-nya tidak terbaca.

Kalau salah satu atau kedua kolom kosong/rusak, itu **tidak menggagalkan import** -- jalur itu
saja yang jatuh kembali ke Gemini seperti biasa saat admin memicu generate dari layar "Trigger &
Gemini". Semua hasil, dari jalur mana pun, tetap masuk `menunggu_persetujuan` dan wajib disetujui
admin sebelum tayang di dashboard -- **tidak ada jalur yang melewati gerbang persetujuan ini**,
termasuk yang dari Excel (lihat CLAUDE.md butir 6).

## Prompt

```text
Kamu perumus briefing dan tindak lanjut AGREGAT untuk pimpinan sekolah, modul School Culture. Saya melampirkan file Excel berisi sheet "Personal" (satu baris per orang) dan sheet "Lembaga" (satu baris ringkasan per sekolah/unit, data sudah dihitung final, jangan hitung ulang, jangan mengarang angka).

TUGAS: cari baris di sheet Lembaga yang kolom "unit"-nya KOSONG -- itu ringkasan seluruh sekolah. HANYA untuk baris itu, tulis dua kolom baru di paling kanan sheet Lembaga: "briefing_json" (satu objek) dan "tindak_lanjut_json" (satu objek dikelompokkan per role). Isi keduanya dalam SATU BARIS per sel (minified, tanpa ganti baris, tanpa markdown fence). Baris unit lain dan kolom lain jangan diubah satu sel pun.

DATA YANG BOLEH DIRUJUK, HANYA dari baris ringkasan sekolah itu dan sheet Personal sebagai konteks tambahan:
- Budaya, 4 tipe dengan label produk WAJIB persis: Kekeluargaan, Inovasi, Orientasi, Aturan. Kondisi saat ini vs harapan Tim, plus gap dan arahnya.
- Profil organisasi, 6 dimensi: Karakter Lembaga, Kepemimpinan, Manajemen, Sinergi Tim, Fokus Strategis, Kinerja/Performa.
- Kesejahteraan, 5 subdimensi dengan kode PERSIS: kepuasan_kepemimpinan, kenyamanan_bekerja, pengembangan_diri, ekspektasi, work_life_balance.
- Perbandingan antarunit kalau lebih dari satu baris unit tersedia.
- Jumlah responden dan periode.
- Esai Tim di sheet Personal, ENAM kolom, dua kelompok terpisah (JANGAN dicampur, lihat bagian briefing_json di bawah): survey_q1_gambaran_lembaga, survey_q2_kejadian_kesaharian, survey_q3_yang_ingin_diubah (domain BUDAYA) -- survey_q4_alasan_betah, survey_q5_hal_menguras_energi, survey_q6_yang_ingin_disampaikan (domain KESEJAHTERAAN). SEMUA SUDAH ANONIM, jangan pernah dikaitkan ke nama orangnya.

ISTILAH WAJIB DAN LARANGAN:
- Data mentah pakai kerangka OCAI (Klan/Adhokrasi/Pasar/Hierarki). WAJIB pakai istilah produk: Klan->Kekeluargaan, Adhokrasi->Inovasi, Pasar->Orientasi, Hierarki->Aturan. DILARANG menulis "OCAI"/"Klan"/"Adhokrasi"/"Pasar"/"Hierarki"/"T-score"/"competing values framework"/"Cameron dan Quinn" di field yang tampil ke pengguna -- istilah akademik cuma boleh muncul di dasar_teori.
- Data ini tentang TIM sekolah (guru, tenaga kependidikan, pimpinan unit), BUKAN murid -- dilarang menyebut murid, nilai murid, atau rapor murid sama sekali.
- Dilarang menyebut nama anggota Tim tertentu. Semua data yang kamu terima sudah agregat.
- DILARANG kata "staf"/"pegawai" (pakai "Tim").

DASAR KEILMUAN, dasar_teori WAJIB berpijak pada salah satu dari lima ini, sesuai dimensi yang paling menonjol pada temuan:
1. Kerangka Nilai Bersaing (Cameron & Quinn) -- dasar radar budaya Kekeluargaan/Inovasi/Orientasi/Aturan, tidak ada budaya yang "paling benar", yang penting selisih kondisi sekarang vs harapan Tim.
2. Model Tuntutan-Sumber Daya Kerja (Bakker & Demerouti) -- untuk temuan beban kerja dan keseimbangan kerja-hidup, kelelahan muncul kalau tuntutan lebih besar dari sumber daya yang tersedia.
3. Teori Dua Faktor (Herzberg) -- untuk temuan kepuasan pada kepemimpinan dan pengembangan diri, faktor kebersihan cuma mencegah ketidakpuasan, faktor pendorong yang menaikkan motivasi.
4. Dimensi Kelelahan Kerja (Maslach) -- untuk menafsirkan kesejahteraan keseluruhan, kelelahan emosional/sinisme/menurunnya rasa mampu saling memperkuat kalau dibiarkan.
5. Perubahan Bertahap (Kotter/Lewin) -- untuk merumuskan LANGKAH prioritas supaya perubahan budaya tidak dipaksakan sekaligus, mulai dari kemenangan kecil.
Jangan menambah nama teori/tokoh di luar lima ini, jangan mengarang atribusi/kutipan/tahun.

BAGIAN 1 -- briefing_json, SKEMA WAJIB:
{
  "gambaran": "2-3 kalimat, sebut satu hal paling perlu perhatian atau paling patut dipertahankan, tampil ke sekolah",
  "catatan_internal": "opsional, cuma untuk reviewer Fammi",
  "tema_esai": [
    { "tema": "nama tema singkat maks 6 kata", "ringkasan": "1-2 kalimat pola yang muncul, PARAFRASE bukan kutipan verbatim", "jumlah_mention": 0 }
  ],
  "cerita_pegawai": {
    "gambaran_lembaga": [ { "frasa": "2-5 kata dari pola jawaban Q1, gaya word cloud", "jumlah_mention": 0 } ],
    "saat_ini": [ { "frasa": "2-5 kata dari pola jawaban Q2, gaya word cloud", "jumlah_mention": 0 } ],
    "ingin_diubah": [ { "frasa": "2-5 kata dari pola jawaban Q3, gaya word cloud", "jumlah_mention": 0 } ]
  }
}

Aturan tema_esai (dipakai "Suara Tim" di section Kesejahteraan): gabungkan pola dari Q4+Q5+Q6 (alasan betah, hal menguras energi, yang ingin disampaikan) lintas ketiga pertanyaan jadi satu daftar, bukan tiga daftar terpisah. Jangan pernah mengutip satu jawaban apa adanya sekalipun tanpa nama -- ini laporan agregat untuk pimpinan, kalimat khas satu orang yang dikutip persis bisa mengidentifikasi penulisnya. Maksimal 5 tema, urutkan dari paling sering muncul, jumlah_mention harus angka jujur. Kalau tidak ada pola berulang yang cukup kuat, kembalikan array kosong.

Aturan cerita_pegawai (dipakai "Cerita dari Tim" tiga kolom word cloud di section Budaya, sumbernya Q1/Q2/Q3, BEDA dari tema_esai di atas): setiap entri adalah FRASA PENDEK 2-5 kata gaya word cloud, BUKAN kalimat penuh bersubjek-predikat. Contoh benar: "ruang belajar terbuka", "beban kerja tidak merata". Contoh salah (terlalu panjang): "Tim ingin ruang belajar yang lebih terbuka". Setiap frasa WAJIB rangkuman pola dari BEBERAPA jawaban serupa, bukan potongan satu jawaban tertentu -- dilarang menyebut detail yang bisa mengidentifikasi satu orang (nama program spesifik, jabatan jarang, tahun masuk kerja). Maksimal 8 frasa per kolom, jumlah_mention harus angka jujur (menentukan ukuran tampilan word cloud, jangan mengarang biar kelihatan ramai). Kalau satu kolom tidak ada pola cukup kuat, array kosong untuk kolom itu saja.

BAGIAN 2 -- tindak_lanjut_json, SKEMA WAJIB, dikelompokkan per role tujuan:
{
  "manajemen": [ { ...9 objek rekomendasi, satu per dimensi... } ],
  "kepala_sekolah": [ { ...9 objek rekomendasi, satu per dimensi... } ],
  "yayasan": [ { ...9 objek rekomendasi, satu per dimensi... } ]
}

WAJIB kerjakan SEMUA TIGA role, dan untuk MASING-MASING role, buat TEPAT 9 objek rekomendasi -- satu untuk SETIAP dimensi berikut, tidak boleh ada yang dilewati atau dobel:
- Budaya (4): Kekeluargaan, Inovasi, Orientasi, Aturan.
- Kesejahteraan (5): kepuasan_kepemimpinan, kenyamanan_bekerja, pengembangan_diri, ekspektasi, work_life_balance.

Jadi total 27 objek (9 dimensi x 3 role). Dimensi dengan gap besar/kategori rendah pakai type "perlu_perhatian", yang kondisinya sudah baik pakai type "pertahankan" -- KEDUANYA tetap wajib dapat rekomendasi konkret, bukan cuma yang bermasalah.

Setiap objek rekomendasi:
{
  "dimensi": "Kekeluargaan | Inovasi | Orientasi | Aturan | kepuasan_kepemimpinan | kenyamanan_bekerja | pengembangan_diri | ekspektasi | work_life_balance",
  "term": "short | long",
  "type": "perlu_perhatian | pertahankan",
  "fokus": "budaya | kesejahteraan",
  "jenjang": null,
  "icon": "satu emoji relevan",
  "title": "judul aksi bukan judul masalah, maks 8 kata",
  "teaser": "1 kalimat pemantik rasa ingin tahu sebelum baca detail",
  "mengapa_data": "WAJIB mulai menyebut asal data (cakupan sekolah/yayasan, periode), lalu angka persen capaian dibulatkan tanpa desimal, baru artinya dalam bahasa biasa",
  "mengapa_perspektif": "sudut pandang beda dari mengapa_data, momen sadar berpijak salah satu dari 5 kerangka",
  "dasar_teori": "format: <nama kerangka> (<tokoh>): <makna 1 kalimat>",
  "manfaat": { "tim": "1-2 kalimat", "pimpinan": "1-2 kalimat", "sekolah": "1-2 kalimat" },
  "konkret": [ { "aksi": "bisa dibayangkan persis kejadiannya, bukan kategori umum", "waktu": "...", "kenapa": "..." } ],
  "indikator_keberhasilan": [ { "title": "penanda singkat maks 6 kata", "detail": "1 kalimat cara mengukurnya" } ],
  "hal_diwaspadai": [ "1 kalimat risiko spesifik kalau langkah ini dijalankan asal-asalan" ]
}

Aturan "dimensi": WAJIB persis salah satu dari sembilan nilai di atas (huruf besar-kecil sesuai contoh untuk yang budaya), dan field "fokus" harus konsisten (budaya untuk empat dimensi budaya, kesejahteraan untuk lima subdimensi kesejahteraan). Satu dimensi cuma boleh muncul SATU kali per role.

Aturan per role, WAJIB dibedakan sudut pandangnya:
- manajemen dan kepala_sekolah: kebijakan operasional satu sekolah/unit, berwenang atas kebijakan harian/jadwal/briefing Tim/komunikasi ke Tim sekolah itu. Jangan usulkan hal yang butuh anggaran besar atau persetujuan yayasan.
- yayasan: lintas sekolah, berwenang atas kebijakan besar/alokasi anggaran/pelatihan Tim lintas sekolah/arah program jangka panjang. Levelnya harus di atas kewenangan satu kepala sekolah, cuma pakai data yang memang bersifat agregat sekolah/yayasan.
Isi ketiga role JANGAN sekadar salin-tempel dengan ganti kata sapaan -- rekomendasi manajemen/kepala_sekolah harus benar-benar berbeda levelnya dari rekomendasi yayasan, karena wewenangnya beda. Boleh sama dimensi-nya (memang harus, sembilan dimensi yang sama dicek dari tiga sudut pandang), tapi ISI konkret/manfaat/dasar_teori harus benar-benar berbeda antar role.

Aturan konkret: minimal 3 langkah per rekomendasi, tiap objek wajib aksi/waktu/kenapa (array objek, BUKAN array string). Langkah pertama kemenangan cepat yang hasilnya kelihatan dalam hitungan minggu, ritme organisasi sekolah lebih lambat dari ritme satu kelas.

Aturan indikator_keberhasilan: WAJIB 2-3 item per rekomendasi, cara KONKRET pimpinan tahu langkah ini berhasil (bukan "budaya membaik", tapi penanda yang bisa diamati/dihitung langsung dari keseharian, mis. "jumlah rapat yang mulai tepat waktu", "jumlah tugas yang selesai sebelum tenggat").

Aturan hal_diwaspadai: WAJIB 1-2 kalimat per rekomendasi, risiko/efek samping SPESIFIK ke langkah yang diusulkan di konkret (mis. "kalau tenggat baku dipaksakan tanpa transisi, bisa terasa seperti aturan tambahan alih-alih bantuan"), BUKAN disclaimer generik seperti "perlu komitmen bersama".

ATURAN BAHASA, WAJIB SEMUA:
- Bahasa Indonesia langsung, seperti asisten yang paham konteks, bukan laporan teknis.
- Tulis 2-3 kalimat yang mengalir wajar untuk tiap field naratif, jangan satu kalimat kaku dipadatkan paksa. Pembaca (kepala sekolah, pimpinan yayasan) harus langsung paham tanpa menebak.
- DILARANG em-dash dan "--". Pakai koma atau pecah kalimat.
- DILARANG pola tulisan AI: "sangat penting", "pada dasarnya", "perlu dicatat", "komprehensif", "holistik", "sesungguhnya", "tentu saja", "dengan demikian", "merupakan", "terdapat", "berperan penting", "tak dapat dipungkiri", "mari kita", tiga sinonim beruntun. Jangan memulai kalimat dengan kata sambung setelah titik.
- JSON harus valid: kutip ganda di-escape, tidak ada baris baru mentah di dalam string, satu baris per sel.

Kerjakan sampai tuntas, jangan ada dimensi atau role yang dilewati. Kalau data esai tidak cukup untuk tema_esai/cerita_pegawai, kembalikan array kosong untuk bagian itu saja, jangan memaksakan isi dari data yang tidak ada -- tapi tindak_lanjut_json TETAP harus 9 dimensi x 3 role penuh, itu dari data kuantitatif yang sudah final, bukan dari esai, jadi tidak ada alasan datanya tidak cukup.
```

## Kaitan ke kode

- Kolom database: `sc_lembaga.pregen_briefing`, `sc_lembaga.pregen_tindak_lanjut` (migration
  `20260729100000_sc_lembaga_pregen.sql`), `tindak_lanjut.dimensi`/`indikator_keberhasilan`/
  `hal_diwaspadai` (migration `20260731100000_tindak_lanjut_dimensi_indikator.sql`), plus
  penanda asal `tindak_lanjut.draf_asal`/`briefing.draf_asal`.
- Pembaca Excel: `parsePregenJson()` + `validasiBentukBriefing()`/
  `validasiBentukTindakLanjutAgregat()` di `web/src/pages/admin/importers/scImporter.js` --
  keduanya tidak perlu tahu field baru (dimensi/indikator_keberhasilan/hal_diwaspadai/
  gambaran_lembaga) secara eksplisit, field ekstra ikut lewat apa adanya.
- Pemakai: `generateAndInsertDraftSc()` di `supabase/functions/_shared/geminiPromptSc.ts` --
  dicek di awal fungsi, sebelum memanggil Gemini sama sekali, untuk `tipe === "briefing"` dan
  untuk tindak lanjut per `role`. Normalisasi `dimensi` ke sembilan nilai yang dikenal (nilai lain
  dijadikan null, TIDAK ditebak) supaya tidak ada kartu dimensi yang diam-diam menampilkan
  konten dimensi lain.
- Pencocokan ke kartu dashboard: `cocokkanTlKeLabel()` di `web/src/pages/sc/useScData.js` --
  exact match ke `dimensi` dulu, fallback ke heuristik teks lama HANYA untuk baris tanpa
  `dimensi` (draf sebelum kolom ini ada).
- Render: `ScDimensiTindakLanjut.jsx` (Fokus/Langkah/Indikator/Waspada per dimensi),
  `ScBudayaCeritaPegawai.jsx` (tiga kolom word cloud), `ScKesejahteraanSuaraTim.jsx` (Suara Tim
  dari `tema_esai` + arah tindakan dari tindak lanjut dimensi kesejahteraan terpilih).
