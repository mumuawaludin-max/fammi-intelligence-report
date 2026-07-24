# Prompt: isi kolom `laporan_json` (laporan individu School Culture)

Jalur perumusan laporan individu SC **di luar Gemini API**. Dipakai saat Gemini sedang padat
(503 berjam-jam pernah menggagalkan generate massal berkali-kali, lihat riwayat di
`supabase/functions/_shared/geminiPrompt.ts`) atau kapan pun pemilik produk mau merumuskan
laporan di luar jam kerja admin.

## Cara pakai

1. Buka file Excel School Culture yang biasa diupload (sheet `Personal` + `Lembaga`).
2. Buka claude.ai, lampirkan file Excel-nya, tempel prompt di bawah.
   - Model: **Claude Opus 4.8** atau **Fable 5**. Jangan Haiku: laporan enam belas orang harus
     konsisten dan JSON-nya harus valid semua.
3. Claude mengembalikan file Excel yang sama dengan kolom baru `laporan_json` di sheet Personal.
4. Cek acak dua tiga sel: harus diawali `{`, diakhiri `}`, tanpa pagar markdown.
5. Upload seperti biasa lewat CMS. Layar Upload akan menampilkan berapa responden yang laporannya
   siap pakai, dan baris mana yang JSON-nya tidak terbaca.

Baris yang `laporan_json`-nya kosong atau rusak **tidak menggagalkan import**, cuma jatuh kembali
ke jalur Gemini seperti biasa. Semua laporan, dari jalur mana pun, tetap masuk antrian
`menunggu_persetujuan` dan wajib disetujui admin sebelum tayang.

## Prompt

```text
Kamu perumus laporan pribadi School Culture untuk staf sekolah. Saya melampirkan file Excel berisi sheet "Personal": satu baris per orang, berisi data asesmen final (sudah dihitung, jangan hitung ulang, jangan mengarang angka).

TUGAS: untuk SETIAP baris sheet Personal, tulis satu objek JSON laporan pribadi, lalu kembalikan file Excel yang SAMA PERSIS dengan tambahan satu kolom baru bernama "laporan_json" di paling kanan sheet Personal, berisi JSON itu dalam SATU BARIS (minified, tanpa ganti baris, tanpa markdown fence). Kolom dan sheet lain jangan diubah satu sel pun.

CARA MEMBACA DATA PER BARIS:
- Identitas: identitas_nama (nama), demografi_peran (Guru/Tenaga Kependidikan/Pimpinan Unit), demografi_unit.
- Budaya, 4 tipe dengan label produk WAJIB persis: Kekeluargaan, Inovasi, Orientasi, Aturan. Kondisi saat ini = t_konversi_gambaran_<tipe>, harapan = t_konversi_harapan_<tipe>, selisih = gap_<tipe> (positif berarti orang ini berharap tipe itu lebih kuat, negatif berarti berharap lebih ringan).
- Profil organisasi, 6 dimensi: nilai_karakter_lembaga (Karakter Lembaga), nilai_kepemimpinan (Kepemimpinan), nilai_management (Manajemen), nilai_sinergi (Sinergi Tim), nilai_fokus (Fokus Strategis), nilai_performance (Kinerja/Performa).
- Kesejahteraan, 5 subdimensi: kepuasan_kepemimpinan (Kepuasan pada Kepemimpinan), kenyamanan_bekerja (Kenyamanan Bekerja), pengembangan_diri (Pengembangan Diri), ekspektasi (Ekspektasi Terpenuhi), work_life_balance (Work-Life Balance).
- Esai orang itu sendiri: survey_q4_alasan_betah dan survey_q5_hal_menguras_energi (dipakai untuk konteks cermin, JANGAN dikutip ulang), survey_q3_yang_ingin_diubah dan lainnya sebagai konteks tambahan.

SKEMA JSON WAJIB, persis kunci-kunci ini:
{
  "header": { "hook": "1 kalimat personal menangkap pola dominan jawaban orang ini", "sub_hook": "1 kalimat pelengkap" },
  "bagian_budaya": { "narasi": "2-4 kalimat: budaya yang paling terasa vs harapannya sendiri, sebut tipe dengan gap terbesar" },
  "bagian_kesejahteraan": { "narasi": "2-4 kalimat: kondisi kesejahteraannya, sebut subdimensi terkuat dan terlemah" },
  "bagian_profil_organisasi": { "narasi": "2-3 kalimat: dimensi yang paling menonjol untuk orang ini" },
  "cermin_konteks": "1-2 kalimat konteks reflektif menemani kutipan esainya, TANPA mengutip/memparafrase isi esai. Kalau esainya kosong, tulis ajakan reflektif umum yang hangat",
  "bagian_refleksi": "1 kalimat pertanyaan terbuka/ajakan renungan untuk orang ini",
  "rencana_aksi": [
    { "judul": "kalimat aksi diawali kata kerja, maks 12 kata", "alasan": "1-2 kalimat kenapa cocok untuk profil datanya", "terkait": "label subdimensi/tipe budaya sumber saran", "jangka": "Minggu ini / Bulan ini / 3 bulan", "ikon": "1 emoji relevan" }
  ],
  "lingkar_kontribusi": [
    { "locus": "control", "mengapa_fokus": "1-2 kalimat kenapa area kendali pribadi relevan untuk orang INI, sebut pola spesifik dari datanya", "langkah": [ { "judul": "maks 8 kata", "instruksi": "1 kalimat ajakan konkret, mis. 'Setiap awal pekan, tuliskan:'", "contoh": ["2-4 butir contoh pendek"], "tujuan": "1 kalimat manfaat langkah ini" } ] },
    { "locus": "influence", "...": "struktur sama" },
    { "locus": "system", "...": "struktur sama" }
  ]
}

ATURAN ISI:
1. rencana_aksi: 2-4 item, langkah kecil yang bisa dijalankan orang itu SENDIRI tanpa menunggu pimpinan, item pertama kemenangan cepat. Sesuaikan dengan demografi_peran (keseharian Guru beda dari Tenaga Kependidikan beda dari Pimpinan Unit).
2. lingkar_kontribusi: TEPAT 3 objek, urutan locus control, influence, system. Masing-masing TEPAT 3 langkah. control = bisa diputuskan dan dijalankan sendiri; influence = butuh percakapan/kerja sama dengan rekan atau pimpinan tapi orang ini bisa mendorongnya; system = persoalan level keputusan lembaga, TAPI langkahnya tetap hal yang bisa DIMULAI orang ini sendiri (menyuarakan, mendokumentasikan pola, mengusulkan lewat jalur yang ada), bukan menyalahkan sistem.
3. WAJIB personal per orang: mengapa_fokus dan langkah harus menyebut pola spesifik dari data orang itu (tipe budaya dengan gap terbesar, subdimensi kesejahteraan terlemah/terkuat, dimensi profil menonjol). Dua orang dengan data berbeda HARUS menghasilkan isi yang benar-benar berbeda, bukan template diganti nama. Tiga locus untuk satu orang juga harus membahas hal yang berbeda satu sama lain.
4. SAPAAN: header, narasi, cermin_konteks, bagian_refleksi boleh menyapa "Anda". SEBALIKNYA rencana_aksi (judul, alasan) dan SELURUH lingkar_kontribusi DILARANG memakai "Anda"/"saya"/kata ganti orang apa pun; tulis kalimat perintah langsung ("Ajak diskusi singkat dengan rekan sejenjang") dan penjelasan netral ("Cocok karena gap terbesar ada pada ruang mencoba metode baru").

ATURAN BAHASA, WAJIB SEMUA:
- Bahasa Indonesia hangat dan langsung, seperti asisten yang benar-benar membaca jawaban orang itu.
- DILARANG kata "staf" dan "pegawai" (pakai "Tim" bila perlu menyebut kolektif).
- DILARANG istilah akademik: OCAI, Klan, Adhokrasi, Pasar, Hierarki, T-score. Pakai hanya Kekeluargaan/Inovasi/Orientasi/Aturan.
- DILARANG em-dash dan "--". Pakai koma atau pecah kalimat.
- DILARANG menulis ANGKA/DIGIT di semua teks; tulis dengan kata ("tiga belas poin", "paling rendah di antara lima subdimensi") atau kualitatif.
- Maksimal 4 kalimat per field naratif.
- DILARANG pola tulisan AI: "sangat penting", "pada dasarnya", "perlu dicatat", "komprehensif", "holistik", "merupakan", "terdapat", "dengan demikian", "tentu saja", tiga sinonim beruntun.
- JSON harus valid: kutip ganda di-escape, tidak ada baris baru mentah di dalam string, satu baris per sel.

Kerjakan semua baris, jangan ada yang dilewati. Kalau ada baris yang datanya kosong sebagian, tetap buat laporan dari data yang ada, jangan mengarang angka yang tidak ada.
```

## Kenapa aturan bahasanya seketat itu

Bukan gaya-gayaan: tiap larangan di atas punya penegak otomatis di `computeQcFlags()`
(`supabase/functions/generate-sc-individu/index.ts`) yang menandai draf saat masuk antrian
persetujuan. Angka/digit, em-dash, istilah OCAI mentah, dan kalimat lebih dari empat akan
memunculkan badge peringatan QC ke reviewer. Larangan kata ganti orang di `rencana_aksi` dan
`lingkar_kontribusi` sebabnya beda: kedua bagian itu ikut tampil ke pimpinan saat drill-down ke
laporan orang lain, jadi sapaan "Anda" di situ akan salah alamat.

## Kaitan ke kode

- Kolom database: `sc_personal.pregen_laporan` (migration `20260728100000`).
- Pembaca Excel: `parsePregenLaporan()` di `web/src/pages/admin/importers/scImporter.js`.
- Pemakai: `supabase/functions/generate-sc-individu/index.ts`, blok `pakaiPregen`.
- Badge reviewer: "📄 Dari Excel" di layar Persetujuan School Culture.
