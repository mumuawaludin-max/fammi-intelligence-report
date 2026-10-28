# Prompt: isi kolom `laporan_json` (laporan individu Multiple Intelligence)

Jalur perumusan narasi laporan MI **di luar Gemini API**, padanan
`docs/Prompt_Laporan_Individu_SC_Excel.md` untuk School Culture. Narasi ditulis di claude.ai,
hasilnya ditempel sebagai satu kolom di Excel yang sama, lalu Excel itu diunggah lewat CMS.

Kolomnya opsional. Baris tanpa `laporan_json`, atau yang JSON-nya ditolak, tetap dirumuskan
Gemini seperti biasa. Siswa yang kedelapan skornya 0 tidak dibuatkan laporan lewat jalur mana pun.

## Alur kerja

1. Siapkan Excel MI: satu sheet, satu baris per siswa. Kolom yang dibaca: nama siswa (`Nama` atau
   `nama_siswa`), `kelas_id`, `sekolah_id`, `periode`, delapan skor (`R INTER` atau `r_inter`,
   dan seterusnya), `mapel_sulit_1/2`, dan kolom esai `essay_*`. Besar kecil huruf, spasi, dan
   garis bawah di judul kolom tidak berpengaruh. `periode` wajib terisi. `kelas_id` boleh
   kosong: laporannya tetap dibuat dan bisa dibuka siswa, orang tua, dan Kepala Sekolah, tapi
   Wali Kelas tidak bisa melihatnya dan siswa itu tidak masuk tabel per kelas.
   Kolom keluaran lama dari pipeline Sheets (`PRED ...`, `NARASI ...`, `TOP ...`, teks per
   kecerdasan, `MAPEL SULIT ... DESC`) boleh tetap ada di berkas: prompt dan importer
   mengabaikannya, karena isinya dihitung ulang sistem atau tidak tampil di laporan.
2. Buka claude.ai di chat baru, lampirkan Excel itu, tempel prompt di bawah.
   - Model: **Claude Fable**, versi terbaru yang tersedia. Jangan Haiku: JSON per siswa
     panjang dan harus valid semua.
   - Satu siswa menghasilkan JSON sekitar 1.500 kata. Untuk kelas besar, minta per kelompok
     20 baris ("kerjakan baris 2 sampai 21"), lalu lanjutkan di pesan berikutnya ke berkas yang
     sama. Jangan minta 100 siswa sekaligus.
3. Claude mengembalikan Excel yang sama dengan kolom baru `laporan_json` di paling kanan.
4. Cek acak dua tiga sel sebelum mengunggah:
   - diawali `{` dan diakhiri `}`, tanpa pagar markdown;
   - isi `"top"` cocok dengan tiga skor tertinggi siswa itu;
   - siswa yang kedelapan skornya 0 atau kosong berisi `TIDAK_DINILAI`, bukan JSON.
5. Unggah lewat CMS Admin Fammi, menu Upload, modul MI, seperti biasa. Sebelum tombol Generate,
   layar menampilkan berapa siswa yang narasinya siap pakai, baris mana yang `laporan_json`-nya
   ditolak beserta alasannya (baris itu dirumuskan Gemini), dan siswa yang dilewati karena
   skornya 0 semua.
6. Tinjau di menu Persetujuan MI. Draf dari Excel bertanda "📄 Dari Excel" dan tetap wajib
   ditinjau sebelum tayang. Tanda "⚠ catatan QC" muncul kalau ada nama profesi yang tidak cocok
   dengan kamus; profesi itu tidak punya penjelasan saat tombolnya diketuk di laporan.

## Pembagian kerja sistem dan prompt

Yang **dihitung sistem**, tidak ditulis prompt (aturan pasti, sama untuk semua jalur):

- level tiap kecerdasan: 75 ke atas Kuat, 50 sampai 74 Sedang, di bawah 50 Berkembang;
- urutan Top 1, 2, 3;
- teks kamus per kecerdasan: arti, yang perlu dijaga, kegiatan, daftar profesi, ciri yang terlihat;
- `aha_persen`.

Prompt tetap diminta menuliskan `"top"` supaya importer bisa memastikan narasinya ditulis untuk
Top yang sama dengan hitungan sistem. Kalau berbeda, JSON baris itu ditolak dan baris itu
dikerjakan Gemini.

Yang **ditulis prompt** hanya bagian yang tampil di laporan siswa sekarang:

| Kunci JSON | Kolom `detail` yang diisi importer | Bagian laporan |
|---|---|---|
| `narasi_cover` | `narasi_cover` | Sampul |
| `cara_belajar.ringkasan` | `cara_belajar_summary` | Cara belajar |
| `cara_belajar.langkah[1..5]` | `cara_belajar_N_title`, `cara_belajar_N_body` | Cara belajar |
| `ciri_khas[1..4]` | `ciri_khas_N` | Ciri khas |
| `mapel_kuasai` | `mapel_kuasai` (digabung koma) | Peta mata pelajaran |
| `smart.s/m/a/r/t` | `smart_s` ... `smart_t` | SMART Goals |
| `hari[1..7]` | `hari_N` | 7 Hari Pertama |
| `komunikasi.lakukan[1..4]` | `gaya_kom_positif_N` | Cara bicara yang menjangkaunya |
| `komunikasi.hindari[1..3]` | `gaya_kom_hindari_N` | Cara bicara yang menjangkaunya |
| `komunikasi.kalimat_siswa[1..3]` | `gaya_kom_siswa_N_situasi`, `gaya_kom_siswa_N_script` | Cara bicara yang menjangkaunya |
| `sinyal_ortu[1..5]` | `sinyal_N_icon`, `sinyal_N_title`, `sinyal_N_body` | Tanda untuk orang tua |
| `refleksi[1..4]` | `refleksi_N` | Ruang refleksi |
| `diskusi[1..4]` | `diskusi_N` | Bahan diskusi keluarga |
| `jalur[N].jurusan` | `top_N_jurusan` (digabung koma) | Jalur, "Jurusan yang relevan" |
| `jalur[N].tip_ortu` | `top_N_parenttip` | Jalur, "Tips ortu" |
| `jalur[N].profesi_sorot` | `top_N_profesi_sorot`, `_desc`, `_skill_1..3`, `_jalur`, `_figur` | Jalur, "Profesi Unggulan" |
| `jalur[N].profesi_detail` | `top_N_profesi_detail` (satu baris per profesi, `nama\|desc\|skill1\|skill2\|skill3\|jalur`) | Dialog saat chip profesi diketuk |

Sengaja **tidak diminta** karena tidak tampil di laporan siswa: `narasi_hero`,
`narasi_kombinasi`, `narasi_profil_final`, `mapel_sulit_1_desc`, `mapel_sulit_2_desc`,
`mapel_sulit_narasi_final`, `aha_desc`. Untuk draf dari Excel, kolom-kolom ini kosong; dua yang
pertama ikut kosong di laci tinjau admin. Kalau kelak salah satunya ditampilkan, tambahkan
kuncinya di prompt dan di tabel ini sekaligus.

JSON dipakai, bukan kolom-kolom lama satu per satu, supaya Claude tidak perlu menghafal format
pipa dan koma. Importer yang merakit format lama itu, jadi tampilan tidak berubah.

## Prompt

```text
Kamu perumus laporan bakat personal Multiple Intelligence untuk siswa SMP dan SMA, termasuk siswa madrasah dan pesantren. Saya melampirkan file Excel: satu baris per siswa, berisi skor final delapan kecerdasan (0-100, sudah dihitung, jangan dihitung ulang, jangan mengarang angka), mata pelajaran yang dirasa sulit, dan jawaban esai siswa.

MEMBACA BERKAS:
- Kerjakan sheet yang berisi kolom nama siswa dan delapan skor. Kalau ada lebih dari satu sheet, abaikan sheet lain.
- Judul kolom tidak peka besar kecil huruf, spasi, dan garis bawah: "R INTER" sama dengan r_inter, "Nama" sama dengan nama_siswa.
- Yang dipakai HANYA: nama siswa, kelas_id, sekolah_id, delapan skor, mapel_sulit_1, mapel_sulit_2, dan semua kolom yang judulnya diawali essay_.
- ABAIKAN kolom lain, termasuk PRED ..., NARASI ..., TOP ..., teks per kecerdasan (MUSIKAL ARTI, SPASIAL JAGA, dan sejenisnya), MAPEL SULIT ... DESC, dan MAPEL SULIT NARASI FINAL. Itu keluaran lama yang tidak konsisten (Top-nya sering tidak sesuai skor, sebagian berisi "Contoh" atau "Lorem ipsum"). Jangan menyalin, merujuk, atau memperbaikinya.

TUGAS: untuk SETIAP baris, tulis satu objek JSON laporan, lalu kembalikan file Excel yang SAMA PERSIS dengan tambahan satu kolom baru bernama "laporan_json" di paling kanan, berisi JSON itu dalam SATU BARIS (minified, tanpa ganti baris, tanpa markdown fence). Kolom lain jangan diubah satu sel pun. Kalau saya menyebut rentang baris, kerjakan rentang itu saja dan biarkan sel laporan_json baris lain apa adanya.

LANGKAH 1, HITUNG DENGAN KODE (bukan dikira-kira):
- Delapan skor: r_musikal (Musikal), r_spasial (Spasial), r_linguistik (Linguistik), r_logmat (Logika-Matematika), r_kines (Kinestetik), r_inter (Interpersonal), r_intra (Intrapersonal), r_naturalis (Naturalis).
- Bulatkan tiap skor ke bilangan bulat terdekat lebih dulu, setengah dibulatkan ke atas (74,5 jadi 75; jangan pakai round() Python yang membulatkan ke genap). Semua langkah berikut memakai skor yang sudah dibulatkan.
- Kalau kedelapan skor 0 atau kosong, siswa ini belum ikut tes: isi laporan_json dengan teks TIDAK_DINILAI saja, lalu lanjut ke baris berikutnya.
- Top 1, 2, 3 = tiga skor tertinggi. Kalau skor sama, urutan penentunya: Musikal, Spasial, Linguistik, Logika-Matematika, Kinestetik, Interpersonal, Intrapersonal, Naturalis. Aturan ini wajib persis, karena sistem menghitung Top dengan cara yang sama dan akan menolak JSON yang Top-nya beda.
- Level tiap kecerdasan: skor 75 ke atas Kuat, 50 sampai 74 Sedang, di bawah 50 Berkembang.
- Panggilan = kata pertama nama_siswa.
- Jenjang dari kelas_id: angka 7-9 atau tulisan SMP, MTs, Wustha = SMP; angka 10-12 atau tulisan SMA, MA, Ulya = SMA. Kalau tidak bisa ditentukan, tulis dengan bahasa yang cocok untuk SMP maupun SMA dan jangan menyebut kelas.
- Madrasah atau pesantren: kalau sekolah_id memuat kata Diniyah, Pesantren, Madrasah, MTs, atau MA, atau mapel sulitnya mapel keagamaan (Nahwu, Sharaf, Bahasa Arab, Fiqih, dan sejenisnya), anggap siswa belajar di lingkungan pesantren. Mapel keagamaan boleh masuk mapel_kuasai, contoh kegiatan boleh memakai keseharian pesantren (halaqah, setoran hafalan, kajian), dan jurusan boleh memuat jurusan keislaman yang relevan dengan Top-nya.

LANGKAH 2, TULIS JSON dengan kunci persis seperti ini:
{
  "top": ["<nama Top 1>", "<nama Top 2>", "<nama Top 3>"],
  "narasi_cover": "",
  "cara_belajar": { "ringkasan": "", "langkah": [ { "judul": "", "isi": "" } ] },
  "ciri_khas": [""],
  "mapel_kuasai": [""],
  "smart": { "s": "", "m": "", "a": "", "r": "", "t": "" },
  "hari": [""],
  "komunikasi": { "lakukan": [""], "hindari": [""], "kalimat_siswa": [ { "situasi": "", "kalimat": "" } ] },
  "sinyal_ortu": [ { "ikon": "", "judul": "", "isi": "" } ],
  "refleksi": [""],
  "diskusi": [""],
  "jalur": [
    {
      "kecerdasan": "<sama persis dengan top[0], lalu top[1], lalu top[2]>",
      "jurusan": [""],
      "tip_ortu": "",
      "profesi_sorot": { "nama": "", "deskripsi": "", "skill": ["", "", ""], "jalur": "", "figur": [""] },
      "profesi_detail": [ { "nama": "", "deskripsi": "", "skill": ["", "", ""], "jalur": "" } ]
    }
  ]
}

ISI TIAP KUNCI:
- top: nama kecerdasan persis seperti daftar di LANGKAH 1 (tulis "Logika-Matematika", bukan "Logis-Matematis").
- narasi_cover: 1 kalimat, paling banyak 12 kata. Kalimat pembuka tentang cara panggilan berpikir dan belajar, dari kombinasi Top 1 dan Top 2. Jangan diawali "Kamu" atau "Dia". Kata visual, gambar, atau diagram hanya boleh dipakai kalau Spasial masuk Top 3.
- cara_belajar.ringkasan: 1-2 kalimat cara belajar paling efektif untuk panggilan, dari Top 1 dan Top 2.
- cara_belajar.langkah: TEPAT 5. judul 3-5 kata, isi 1-2 kalimat konkret. Acuannya GAYA BELAJAR PER KECERDASAN di bawah untuk Top 1 dan Top 2, jangan mengarang gaya belajar lain.
- ciri_khas: TEPAT 4 frasa pendek, 3-5 kata, perilaku yang mungkin sudah terlihat sehari-hari.
- mapel_kuasai: 5-6 nama mata pelajaran yang sesuai jenjang dan cocok dengan Top 3.
- smart: masing-masing 1 paragraf pendek. s = satu aktivitas konkret yang bisa dimulai sekarang; m = cara panggilan tahu dirinya maju; a = kenapa realistis di usianya; r = kaitannya dengan Top 1; t = kapan dan bagaimana mengevaluasi.
- hari: TEPAT 7 tugas harian, ringan di hari 1, makin menantang di hari 6-7. Tiap tugas bisa dikerjakan dalam 15-30 menit tanpa biaya.
- komunikasi.lakukan: TEPAT 4 panduan untuk orang tua atau guru saat berbicara dengan panggilan.
- komunikasi.hindari: TEPAT 3 hal yang sebaiknya dihindari saat berbicara dengan panggilan.
- komunikasi.kalimat_siswa: TEPAT 3. situasi 2-5 kata (mis. "Saat butuh bantuan"), kalimat = contoh kalimat yang bisa diucapkan panggilan sendiri, ditulis tanpa tanda petik.
- sinyal_ortu: TEPAT 5 tanda yang mungkin sudah lama terlihat orang tua di rumah. ikon = TEPAT satu emoji, judul 3-6 kata, isi 1-2 kalimat untuk orang tua.
- refleksi: TEPAT 4 pertanyaan untuk panggilan sendiri, menyapa "kamu".
- diskusi: TEPAT 4 pertanyaan untuk dibahas panggilan bersama orang tua.
- jalur: TEPAT 3 objek, urut Top 1, Top 2, Top 3.
  - jurusan: 3-5 jurusan kuliah yang relevan dengan kecerdasan itu.
  - tip_ortu: 1-2 kalimat tips konkret untuk orang tua mendukung kecerdasan itu di rumah.
  - profesi_sorot: satu profesi unggulan. Kalau level kecerdasan itu Kuat atau Sedang, pilih dari KAMUS PROFESI kecerdasan dan level itu. Kalau Berkembang, pilih satu profesi nyata yang memadukan kecerdasan itu dengan Top 1. deskripsi 2-3 kalimat (apa yang dikerjakan, di mana bekerja, kenapa cocok untuk panggilan); skill TEPAT 3; jalur 1-2 kalimat jalur pendidikan dan karier; figur 1-3 nama tokoh nyata yang dikenal publik di profesi itu (Indonesia lebih baik). Jangan mengarang nama tokoh; kalau ragu, tulis satu nama saja yang pasti.
  - profesi_detail: SATU objek untuk SETIAP profesi di KAMUS PROFESI kecerdasan dan level itu, dengan nama yang DISALIN PERSIS dari kamus (sistem mencocokkan nama ini dengan tombol profesi di layar). deskripsi 2 kalimat, skill TEPAT 3, jalur 1 kalimat.

MENGGUNAKAN ESAI SISWA (semua kolom essay_ yang ada, mis. essay_kelebihan_cara_berpikir, essay_cara_belajar, essay_cara_belajar_paling_berhasil, essay_citacita_profesi, essay_alasan_pilih_profesi, essay_eskul, essay_penggunaan_ai):
- Pakai sebagai konteks supaya isi terasa milik anak ini: cara belajar yang menurutnya berhasil, cita-cita, alasannya, ekstrakurikuler yang dia ikuti.
- essay_eskul cocok dipakai di hari, smart, dan contoh kegiatan (mis. anak yang ikut futsal diberi latihan yang bisa dikerjakan di lapangan).
- JANGAN mengutip ulang atau memparafrase kalimat esainya; kutipan aslinya sudah tampil di laporan.
- Kalau cita-citanya sejalan dengan salah satu Top, boleh dikaitkan di profesi_sorot.deskripsi.
- mapel_sulit_1 dan mapel_sulit_2 boleh dijadikan konteks untuk cara_belajar dan smart, tanpa menyebut anak itu lemah.

SAPAAN:
- Bagian untuk siswa (narasi_cover, cara_belajar, ciri_khas, smart, hari, refleksi, kalimat_siswa) menyapa dengan "kamu" atau nama panggilan.
- Bagian untuk orang tua (komunikasi.lakukan, komunikasi.hindari, sinyal_ortu, tip_ortu) menyebut anak dengan nama panggilan, bukan "kamu" dan bukan "anak Anda".

ATURAN BAHASA:
1. Bahasa Indonesia sehari-hari yang hangat dan lugas, sesuai usia SMP atau SMA.
2. DILARANG em-dash dan double dash. Pakai koma, titik dua, atau pecah kalimat.
3. DILARANG kata dan frasa: sangat penting, perlu dicatat, pada dasarnya, sesungguhnya, tentu saja, dengan demikian, merupakan, terdapat, komprehensif, holistik.
4. Jangan menulis angka skor di dalam teks; angkanya sudah tampil di peta kecerdasan.
5. Jangan menyebut kecerdasan Berkembang sebagai kelemahan atau kekurangan. Jangan memberi label diagnosis apa pun.
6. Tidak boleh ada karakter | di teks mana pun. Di dalam isi jurusan, figur, dan mapel_kuasai juga tidak boleh ada koma atau titik koma, karena sistem menggabungkan daftar itu dengan koma.
7. Dua siswa dengan Top dan esai berbeda HARUS menghasilkan isi yang benar-benar berbeda, bukan template yang diganti nama.

GAYA BELAJAR PER KECERDASAN (acuan cara_belajar, jangan diubah):
- Musikal: belajar lewat ritme, melodi, pola suara, nyanyian, latar musik saat belajar, mengingat dengan irama dan nada
- Spasial: belajar lewat gambar, diagram, peta pikiran, visualisasi, warna, tata letak visual, sketsa dan ilustrasi, imajinasi ruang
- Linguistik: belajar lewat membaca, menulis, mendengar penjelasan verbal, bercerita, diskusi, debat, catatan tertulis, bermain kata dan bahasa
- Logika-Matematika: belajar lewat penalaran sebab-akibat, pola angka dan logika, eksperimen sistematis, pemecahan masalah terstruktur langkah demi langkah, suka data dan bukti
- Kinestetik: belajar lewat gerakan, praktik langsung, mencoba-coba secara fisik, proyek berwujud, belajar sambil bergerak atau menggunakan tangan
- Interpersonal: belajar lewat diskusi kelompok, mengajar teman, kolaborasi, mendengar cerita orang lain, debat dan tukar pendapat, peka terhadap dinamika sosial
- Intrapersonal: belajar mandiri, refleksi lewat jurnal, penetapan target sendiri, butuh waktu hening untuk memproses, koneksi ke nilai dan pengalaman pribadi, lebih suka belajar tanpa tekanan sosial
- Naturalis: belajar lewat observasi langsung di alam, mencari pola, mengklasifikasi makhluk hidup dan fenomena, eksplorasi mandiri di luar ruangan, proyek penelitian kecil berbasis pengamatan

KAMUS PROFESI (nama di profesi_detail WAJIB disalin persis dari sini, sesuai kecerdasan dan level siswa):
Musikal | Kuat: Musisi atau komposer; Produser musik dan sound engineer; Guru atau dosen seni musik; Music therapist; Penyanyi atau vokalis profesional; Penata suara film dan podcast; Music director acara
Musikal | Sedang: Content creator dengan elemen audio; Guru kelas yang memakai lagu sebagai media ajar; Penyiar radio atau podcaster; Event organizer bidang seni; Editor video dengan kepekaan scoring; Marketing kreatif industri hiburan
Musikal | Berkembang: Peran pendukung di tim produksi acara; Teknisi audio dasar dengan pelatihan; Pengelola konten media sosial; Profesi yang bertumpu pada kecerdasan lain, dengan musik sebagai hobi penyeimbang
Spasial | Kuat: Arsitek; Desainer grafis atau UI/UX; Insinyur sipil; Animator dan ilustrator; Fotografer atau videografer; Perencana tata kota; Desainer interior
Spasial | Sedang: Drafter atau juru gambar teknik; Content creator visual; Asisten desain produk; Guru yang banyak memakai media visual; Surveyor pemetaan; Editor foto dan video
Spasial | Berkembang: Peran administratif dengan dukungan alat visual; Operator yang dilatih membaca panduan bergambar; Profesi berbasis kata atau angka, dengan keterampilan visual sebagai pelengkap; Asisten lapangan dengan panduan denah
Linguistik | Kuat: Jurnalis atau editor; Penulis dan content writer; Pengacara; Dosen atau guru bahasa; Penerjemah; Public relations; Penyiar atau presenter
Linguistik | Sedang: Staf administrasi dan korespondensi; Customer relations; Guru mata pelajaran umum; Marketing komunikasi; Asisten redaksi; Content creator berbasis teks
Linguistik | Berkembang: Profesi berbasis keterampilan teknis atau visual; Peran lapangan yang sedikit menuntut tulisan panjang; Bidang angka, desain, atau praktik dengan bahasa sebagai pelengkap; Pekerjaan tim dengan rekan yang menangani komunikasi tertulis
Logika-Matematika | Kuat: Data scientist atau analis data; Programmer dan software engineer; Insinyur berbagai bidang; Akuntan atau aktuaris; Peneliti sains; Ekonom; Ahli statistik
Logika-Matematika | Sedang: Teknisi atau operator sistem; Staf keuangan dan administrasi data; Quality control; Asisten riset; Guru matematika tingkat dasar; Wirausaha dengan pengelolaan angka
Logika-Matematika | Berkembang: Profesi berbasis kreativitas, bahasa, atau interaksi sosial; Peran yang memakai alat hitung otomatis dengan panduan; Bidang seni, komunikasi, atau pelayanan dengan logika sebagai pendukung; Pekerjaan tim dengan rekan yang menangani analisis angka
Kinestetik | Kuat: Atlet atau pelatih olahraga; Fisioterapis; Chef atau ahli kuliner; Teknisi dan mekanik; Penari atau koreografer; Dokter bedah; Instruktur kebugaran
Kinestetik | Sedang: Teknisi terlatih; Staf operasional lapangan; Perawat atau tenaga kesehatan pendukung; Wirausaha kuliner; Guru olahraga atau keterampilan; Operator mesin dengan pelatihan
Kinestetik | Berkembang: Profesi berbasis analisis, bahasa, atau interaksi sosial; Peran yang dominan duduk dengan aktivitas fisik sebagai penyeimbang; Bidang akademik atau administratif dengan keterampilan praktis pendukung; Pekerjaan dengan rekan tim untuk tugas yang menuntut fisik
Interpersonal | Kuat: Psikolog atau konselor; Guru atau pendidik; Manajer SDM; Diplomat atau negosiator; Tenaga pemasaran dan humas; Perawat; Pekerja sosial
Interpersonal | Sedang: Staf pelayanan pelanggan; Anggota tim penjualan; Asisten guru atau tutor; Koordinator acara skala kecil; Staf komunitas; Resepsionis atau front office
Interpersonal | Berkembang: Profesi berbasis riset, teknis, atau kreatif individual; Peran kerja mandiri dengan interaksi sosial terbatas; Bidang analisis, seni, atau teknologi dengan kerja tim seperlunya; Pekerjaan dengan struktur sosial yang jelas dan terprediksi
Intrapersonal | Kuat: Penulis atau peneliti mandiri; Psikolog atau terapis; Wirausaha visioner; Filsuf atau akademisi; Konselor spiritual; Pengembang diri dan coach; Seniman dengan kedalaman personal
Intrapersonal | Sedang: Profesi mandiri dengan target pribadi; Wirausaha skala kecil; Peneliti atau analis; Pekerja kreatif individual; Perencana atau penasihat; Bidang yang menuntut kedisiplinan diri
Intrapersonal | Berkembang: Profesi dengan struktur dan arahan eksternal yang jelas; Peran tim dengan tujuan yang sudah ditetapkan; Bidang teknis atau praktis yang fokus pada tugas konkret; Pekerjaan dengan bimbingan mentor untuk arah pribadi
Naturalis | Kuat: Ahli biologi atau ekolog; Dokter hewan; Ahli pertanian atau agronomi; Konservasionis lingkungan; Ahli kelautan; Peneliti satwa liar; Ahli kehutanan
Naturalis | Sedang: Petugas taman atau konservasi pendukung; Staf pertanian atau perkebunan; Pemandu wisata alam; Wirausaha tanaman atau hewan; Penyuluh lingkungan; Content creator bertema alam
Naturalis | Berkembang: Profesi berbasis teknologi, kota, atau interaksi manusia; Peran di lingkungan dalam ruangan dengan minat alam sebagai hobi; Bidang sosial, teknis, atau kreatif dengan kepedulian lingkungan sebagai pelengkap; Pekerjaan tim dengan rekan yang menangani aspek lingkungan

SEBELUM MENGEMBALIKAN FILE, PERIKSA DENGAN KODE untuk setiap baris yang kamu kerjakan:
- laporan_json bisa di-parse sebagai JSON, atau persis TIDAK_DINILAI;
- top sama dengan hasil LANGKAH 1;
- jumlah item sesuai aturan TEPAT di atas, tidak ada string kosong;
- setiap nama di profesi_detail ada di KAMUS PROFESI untuk kecerdasan dan level itu, dan jumlahnya sama dengan jumlah profesi di kamus;
- tidak ada em-dash, double dash, karakter |, atau kata terlarang.
Perbaiki baris yang gagal sebelum mengembalikan file. Di akhir, tulis ringkasan singkat: berapa baris dikerjakan, berapa TIDAK_DINILAI, dan baris mana yang perlu saya periksa manual.
```

## Asal isi prompt ini

Aturan isi diturunkan dari lima prompt Gemini yang sekarang menghasilkan laporan MI
(`generateLaporanBagian1_` sampai `generateLaporanBagian4_` di
`supabase/functions/_shared/miPipeline.ts`), supaya laporan dari Excel setara dengan laporan yang
sudah tayang. Yang berubah dari versi Gemini:

- Hanya meminta bagian yang tampil di laporan siswa (lihat tabel di atas).
- Aturan seri Top ditulis eksplisit. Di produksi, 50 dari 109 laporan tayang punya skor
  tertinggi yang seri (pemeriksaan 2026-10-28).
- Siswa tanpa skor diberi penanda `TIDAK_DINILAI`. Di produksi ada 28 laporan tayang dengan
  kedelapan skor 0, semuanya ber-Top 1 Musikal karena urutan kode.
- Batasan isi daftar (tanpa koma di dalam item) karena importer menggabungkan daftar dengan koma
  dan tampilan memecahnya lagi.
- `GAYA BELAJAR` dan `KAMUS PROFESI` disalin dari `INTEL_GAYA_BELAJAR` dan `MASTER_MI` di berkas
  yang sama. Kalau salah satunya berubah di kode, perbarui salinan di prompt ini juga, atau nama
  profesi di `profesi_detail` tidak akan cocok dengan tombol di layar.

## Kaitan ke kode

Dua lapis pemeriksaan, sama polanya dengan School Culture:

- `web/src/pages/admin/importers/miPregen.js` (diuji di `miPregen.test.js`): membaca sel,
  menghitung Top dengan aturan seri yang sama, memeriksa jumlah butir dan isi, lalu memecah JSON
  ke nama kolom `detail` sesuai tabel di atas. Dipanggil `miImporter.js`, yang juga menyaring
  siswa berskor 0 semua dan mengisi `pregenCount`, `pregenWarnings`, `tidakDinilai` untuk layar
  Upload.
- `supabase/functions/_shared/miPipeline.ts`, fungsi `pakaiPregen_`: memeriksa ulang Top dan
  kelengkapan kolom (daftar putih `KOLOM_PREGEN_`, jadi berkas tidak bisa menimpa skor atau teks
  kamus), membuang nama profesi di luar kamus `MASTER_MI` dan mencatatnya di `detail.qc_narasi`,
  lalu `buildOutputRow_` melewati kelima panggilan Gemini. `detail.sumber_narasi` berisi `excel`
  atau `gemini`.
- `supabase/functions/generate-mi/index.ts` menolak baris yang kedelapan skornya 0.
- `PersetujuanMi.jsx` dan `MiDetailDrawer.jsx` menampilkan badge "Dari Excel" dan catatan QC.

Daftar kolom wajib di `miPregen.js` dan `KOLOM_PREGEN_` harus sama. Kalau satu bagian laporan
ditambah atau dibuang, ubah keduanya, tabel di atas, dan skema di prompt sekaligus.

Perubahan di `_shared/miPipeline.ts` dan `generate-mi` baru berlaku setelah
`supabase functions deploy generate-mi` dijalankan lewat CLI.
