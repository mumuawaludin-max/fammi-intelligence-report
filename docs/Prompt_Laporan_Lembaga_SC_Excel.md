# Prompt: isi kolom `briefing_json` + `tindak_lanjut_json` (laporan lembaga School Culture)

Jalur perumusan laporan AGREGAT (lembaga/kelompok) SC **di luar Gemini API**, padanan langsung
`docs/Prompt_Laporan_Individu_SC_Excel.md` yang sudah dipakai laporan per orang. Dipakai saat
Gemini sedang padat (503 berjam-jam pernah menggagalkan generate massal, lihat riwayat di
`supabase/functions/_shared/geminiPrompt.ts`) atau kapan pun pemilik produk mau merumuskan
briefing dan tindak lanjut lembaga di luar jam kerja admin.

Ini mengisi dua bagian dashboard "Laporan Lembaga" yang selama ini kosong: bagian narasi
briefing dan section "Tindak Lanjut yang Perlu Dilakukan" per dimensi (budaya kerja/kesejahteraan
Tim), untuk role Manajemen, Kepala Sekolah, dan Yayasan sekaligus.

## Cara pakai

1. Buka file Excel School Culture yang biasa diupload (sheet `Personal` + `Lembaga`).
2. Di sheet `Lembaga`, cari baris yang kolom `unit`-nya KOSONG -- itu baris ringkasan
   seluruh sekolah (bukan baris per unit/jenjang). Cuma baris ini yang perlu diisi, baris per
   unit dibiarkan seperti biasa.
3. Buka claude.ai, lampirkan file Excel-nya, tempel prompt di bawah.
   - Model: **Claude Opus 4.8** atau **Fable 5**. Jangan Haiku: tindak lanjut untuk tiga role
     pimpinan sekaligus harus konsisten dan JSON-nya harus valid semua.
4. Claude mengembalikan file Excel yang sama dengan dua kolom baru di sheet Lembaga, di baris
   ringkasan sekolah itu saja: `briefing_json` dan `tindak_lanjut_json`.
5. Cek sel itu: harus diawali `{`, diakhiri `}`, tanpa pagar markdown, satu baris (tanpa ganti
   baris di dalam sel).
6. Upload seperti biasa lewat CMS. Layar Upload akan menampilkan apakah briefing/tindak lanjut
   lembaga siap pakai, dan pesan kalau JSON-nya tidak terbaca.

Kalau salah satu atau kedua kolom kosong/rusak, itu **tidak menggagalkan import** -- jalur itu
saja yang jatuh kembali ke Gemini seperti biasa saat admin memicu generate dari layar "Trigger &
Gemini". Semua hasil, dari jalur mana pun, tetap masuk `menunggu_persetujuan` dan wajib disetujui
admin sebelum tayang di dashboard.

## Keterbatasan yang perlu diketahui

Dua field di dashboard, "Indikator Keberhasilan" dan "Hal yang Perlu Diwaspadai" (`indicators`/
`warnings` pada tiap kartu perbandingan dimensi), **tidak bisa diisi lewat jalur ini** karena
memang belum ada kolom database untuk itu di skema saat ini -- bukan keterbatasan prompt, tapi
data gap yang sudah ada sebelum jalur pregen ini dibangun. Kartu itu akan tetap menampilkan
keadaan kosong ("belum tersedia") sampai ada keputusan produk untuk menambah kolom itu secara
resmi. Jangan mengarang isian untuk dua field ini lewat prompt manapun.

## Prompt

```text
Kamu perumus briefing dan tindak lanjut AGREGAT untuk pimpinan sekolah, modul School Culture. Saya melampirkan file Excel berisi sheet "Personal" (satu baris per orang) dan sheet "Lembaga" (satu baris ringkasan per sekolah/unit, data sudah dihitung final, jangan hitung ulang, jangan mengarang angka).

TUGAS: cari baris di sheet Lembaga yang kolom "unit"-nya KOSONG -- itu ringkasan seluruh sekolah. HANYA untuk baris itu, tulis dua kolom baru di paling kanan sheet Lembaga: "briefing_json" (satu objek) dan "tindak_lanjut_json" (satu objek dikelompokkan per role). Isi keduanya dalam SATU BARIS per sel (minified, tanpa ganti baris, tanpa markdown fence). Baris unit lain dan kolom lain jangan diubah satu sel pun.

DATA YANG BOLEH DIRUJUK, HANYA dari baris ringkasan sekolah itu dan sheet Personal sebagai konteks tambahan:
- Budaya, 4 tipe dengan label produk WAJIB persis: Kekeluargaan, Inovasi, Orientasi, Aturan. Kondisi saat ini vs harapan Tim, plus gap dan arahnya.
- Profil organisasi, 6 dimensi: Karakter Lembaga, Kepemimpinan, Manajemen, Sinergi Tim, Fokus Strategis, Kinerja/Performa.
- Kesejahteraan, 5 subdimensi: Kepuasan pada Kepemimpinan, Kenyamanan Bekerja, Pengembangan Diri, Ekspektasi Terpenuhi, Keseimbangan Kerja-Hidup.
- Perbandingan antarunit kalau lebih dari satu baris unit tersedia.
- Jumlah responden dan periode.
- Esai Tim di sheet Personal (survey_q2_kejadian_kesaharian, survey_q3_yang_ingin_diubah, survey_q5_hal_menguras_energi, survey_q6_yang_ingin_disampaikan) -- SEMUA SUDAH ANONIM, jangan pernah dikaitkan ke nama orangnya.

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
    "saat_ini": ["kalimat sintesis pola dari jawaban Q2 (gambaran tempat kerja saat ini), maks 5"],
    "ingin_diubah": ["kalimat sintesis pola dari jawaban Q3 (yang ingin diubah), maks 5"]
  }
}

Aturan tema_esai: gabungkan pola dari Q3+Q5+Q6 lintas ketiga pertanyaan jadi satu daftar (bukan tiga daftar terpisah). Jangan pernah mengutip satu jawaban apa adanya sekalipun tanpa nama -- ini laporan agregat untuk pimpinan, beda dari laporan individu yang boleh mengutip verbatim, kalimat khas satu orang yang dikutip persis bisa mengidentifikasi penulisnya buat orang yang kenal Tim itu. Maksimal 5 tema, urutkan dari paling sering muncul, jumlah_mention harus angka jujur. Kalau tidak ada pola berulang yang cukup kuat, kembalikan array kosong.

Aturan cerita_pegawai (Q2/Q3 murni, JAUH LEBIH KETAT dari tema_esai): setiap kalimat WAJIB buatanmu sendiri mensintesis pola umum dari beberapa jawaban, bukan menulis ulang satu jawaban dengan kata beda tipis. Satu kalimat generik mewakili beberapa jawaban serupa, bukan satu kalimat per satu orang. DILARANG menyebut detail yang bisa mengidentifikasi satu orang: nama program/proyek spesifik, jabatan spesifik yang jarang, angka tahun masuk kerja. Maksimal 5 kalimat per daftar, cuma tulis kalau memang didukung beberapa jawaban -- satu jawaban unik yang berdiri sendiri TIDAK cukup. Kalau tidak ada pola cukup kuat, array kosong.

BAGIAN 2 -- tindak_lanjut_json, SKEMA WAJIB, dikelompokkan per role tujuan:
{
  "manajemen": [ { ...objek rekomendasi... } ],
  "kepala_sekolah": [ { ...objek rekomendasi... } ],
  "yayasan": [ { ...objek rekomendasi... } ]
}

Kerjakan SEMUA TIGA role di atas (manajemen, kepala_sekolah, yayasan), masing-masing minimal dua objek rekomendasi (satu perlu_perhatian dari sisi paling lemah, satu pertahankan dari sisi paling kuat), lebih banyak kalau temuannya memang lebih banyak. Setiap objek rekomendasi:
{
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
  "konkret": [ { "aksi": "bisa dibayangkan persis kejadiannya, bukan kategori umum", "waktu": "...", "kenapa": "..." } ]
}

Aturan per role, WAJIB dibedakan sudut pandangnya:
- manajemen dan kepala_sekolah: kebijakan operasional satu sekolah/unit, berwenang atas kebijakan harian/jadwal/briefing Tim/komunikasi ke Tim sekolah itu. Jangan usulkan hal yang butuh anggaran besar atau persetujuan yayasan.
- yayasan: lintas sekolah, berwenang atas kebijakan besar/alokasi anggaran/pelatihan Tim lintas sekolah/arah program jangka panjang. Levelnya harus di atas kewenangan satu kepala sekolah, cuma pakai data yang memang bersifat agregat sekolah/yayasan.
Isi ketiga role JANGAN sekadar salin-tempel dengan ganti kata sapaan -- rekomendasi manajemen/kepala_sekolah harus benar-benar berbeda levelnya dari rekomendasi yayasan, karena wewenangnya beda.

Aturan konkret: minimal 3 langkah per rekomendasi, tiap objek wajib aksi/waktu/kenapa (array objek, BUKAN array string). Langkah pertama kemenangan cepat yang hasilnya kelihatan dalam hitungan minggu, ritme organisasi sekolah lebih lambat dari ritme satu kelas.

ATURAN BAHASA, WAJIB SEMUA:
- Bahasa Indonesia langsung, seperti asisten yang paham konteks, bukan laporan teknis.
- Tulis 2-3 kalimat yang mengalir wajar untuk tiap field naratif, jangan satu kalimat kaku dipadatkan paksa. Pembaca (kepala sekolah, pimpinan yayasan) harus langsung paham tanpa menebak.
- DILARANG em-dash dan "--". Pakai koma atau pecah kalimat.
- DILARANG pola tulisan AI: "sangat penting", "pada dasarnya", "perlu dicatat", "komprehensif", "holistik", "sesungguhnya", "tentu saja", "dengan demikian", "merupakan", "terdapat", "berperan penting", "tak dapat dipungkiri", "mari kita", tiga sinonim beruntun. Jangan memulai kalimat dengan kata sambung setelah titik.
- JSON harus valid: kutip ganda di-escape, tidak ada baris baru mentah di dalam string, satu baris per sel.

Kerjakan sampai tuntas, jangan ada bagian yang dilewati. Kalau data esai tidak cukup untuk tema_esai/cerita_pegawai, kembalikan array kosong untuk bagian itu saja, jangan memaksakan isi dari data yang tidak ada.
```

## Kaitan ke kode

- Kolom database: `sc_lembaga.pregen_briefing`, `sc_lembaga.pregen_tindak_lanjut`, plus kolom
  penanda asal `tindak_lanjut.draf_asal`/`briefing.draf_asal` (migration
  `20260729100000_sc_lembaga_pregen.sql`).
- Pembaca Excel: `parsePregenJson()` + `validasiBentukBriefing()`/
  `validasiBentukTindakLanjutAgregat()` di `web/src/pages/admin/importers/scImporter.js`.
- Pemakai: `generateAndInsertDraftSc()` di `supabase/functions/_shared/geminiPromptSc.ts` --
  dicek di awal fungsi, sebelum memanggil Gemini sama sekali, untuk `tipe === "briefing"` dan
  untuk tindak lanjut per `role`.
- Badge reviewer: rencananya sama pola "📄 Dari Excel" seperti laporan individu, dibaca dari
  `draf_asal = 'excel'` di layar Persetujuan School Culture (belum ditambah di iterasi ini --
  UI badge untuk level lembaga masih pending, cuma jalur data dan generate-nya yang sudah siap).
