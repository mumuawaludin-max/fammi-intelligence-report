// DUMMY sementara untuk kartu Kebijakan Kepala Sekolah di Rapor Karakter.
// Bukan temuan nyata — dipakai untuk mematangkan struktur konten sebelum skema Gemini dibuat.
//
// term   : "short" (1-3 bulan, untuk Kepala Sekolah) | "long" (6 bulan, untuk Pimpinan Sekolah)
// type   : "perlu_perhatian" (mengatasi karakter yang lemah) | "pertahankan" (menjaga yang sudah baik)
// fokus  : "mutu" (mutu layanan pendidikan) | "citra" (citra sekolah di mata orang tua)
// mengapa_data       : alasan dari angka/temuan periode berjalan
// mengapa_perspektif : alasan dari sisi perkembangan anak ATAU kebijakan sekolah, bukan sekadar data
// Urutan tampil: perlu_perhatian selalu didahulukan.

export const KEBIJAKAN_KEPSEK = [
  // ── SHORT-TERM (1-3 bulan) ──
  {
    id: "st-perhatian-1",
    term: "short",
    type: "perlu_perhatian",
    fokus: "mutu",
    icon: "💬",
    title: "Gerakan Berbicara Yang Baik di seluruh kelas",
    teaser: "Skor terendah sekolah bulan ini. Mulai dari 3 kalimat wajib tiap pagi.",
    mengapa_data:
      "Aspek Berbicara Yang Baik jadi skor terendah sekolah periode ini (rata-rata 71%) dan sedikit turun dari bulan lalu.",
    mengapa_perspektif:
      "Di usia SD, pola bicara adalah keterampilan sosial yang paling cepat mengeras jadi kebiasaan; makin lama dibiarkan, makin mahal biaya membenahinya. Kelas yang bahasanya sehat juga terbukti lebih mudah diajak fokus belajar.",
    manfaat:
      "Suasana kelas lebih tenang, konflik kecil antar-siswa menurun, dan guru punya bahasa yang seragam untuk menegur tanpa mempermalukan anak.",
    konkret: [
      "Minggu 1: wali kelas menempel poster 3 kalimat wajib (tolong, maaf, terima kasih) di depan kelas.",
      "Tiap pagi 5 menit sebelum pelajaran pertama, guru memandu latihan 3 kalimat itu.",
      "Bagikan ke tiap guru 1 kartu saku berisi 5 kalimat pengganti untuk menegur tanpa membentak.",
      "Akhir bulan: kepala sekolah mengamati 2 kelas acak untuk memastikan pembiasaan jalan.",
    ],
  },
  {
    id: "st-perhatian-2",
    term: "short",
    type: "perlu_perhatian",
    fokus: "citra",
    icon: "🤝",
    title: "Buka wadah komunikasi dua arah dengan orang tua",
    teaser: "Permintaan terbanyak orang tua periode ini. Satu kanal resmi per kelas.",
    mengapa_data:
      "Dari refleksi orang tua periode ini, permintaan terbanyak di luar apresiasi adalah wadah komunikasi yang lebih fleksibel (grup WhatsApp, form umpan balik) dan konsultasi ringan dengan guru.",
    mengapa_perspektif:
      "Kepercayaan orang tua tidak dibangun dari laporan sepihak, tapi dari merasa didengar. Untuk anak, orang tua yang terhubung dengan sekolah lebih konsisten meneruskan pembiasaan yang sama di rumah, sehingga karakter tidak berhenti di gerbang sekolah.",
    manfaat:
      "Keluhan kecil tertangkap sebelum jadi kekecewaan, dan orang tua yang puas menjadi penyampai citra sekolah yang paling dipercaya.",
    konkret: [
      "Buka 1 grup WhatsApp resmi per kelas; wali kelas jadi admin, aturan grup ditulis di pesan pertama.",
      "Sediakan 1 form umpan balik online (tautan tetap) yang bisa diisi orang tua kapan saja.",
      "Janji balasan maksimal 2x24 jam pada hari kerja untuk tiap pertanyaan orang tua.",
      "Tiap akhir bulan, kepala sekolah kirim 1 pesan: masukan apa yang masuk dan apa yang sudah ditindaklanjuti.",
    ],
  },
  {
    id: "st-pertahankan-1",
    term: "short",
    type: "pertahankan",
    fokus: "mutu",
    icon: "💧",
    title: "Pertahankan pembiasaan Fiqih Berwudhu terpimpin",
    teaser: "Aspek terkuat sekolah (92%). Jaga polanya sampai jadi standar resmi.",
    mengapa_data:
      "Fiqih Berwudhu adalah aspek terkuat sekolah (rata-rata 92%), stabil beberapa bulan terakhir.",
    mengapa_perspektif:
      "Rutinitas ibadah yang terjaga memberi anak struktur harian yang aman dan bisa diprediksi, fondasi disiplin diri untuk aspek lain. Dari sisi kebijakan, ini bukti pola pendampingan sekolah yang berhasil dan layak dijadikan standar, bukan sekadar dipertahankan.",
    manfaat:
      "Kekuatan ibadah tetap terjaga sebagai identitas sekolah, dan pola pendampingannya bisa dipinjam untuk aspek yang masih lemah.",
    konkret: [
      "Kunci slot wudhu terpimpin di jadwal harian tiap kelas; tidak boleh dipotong walau jam padat.",
      "Rotasi guru pendamping tiap 2 minggu supaya standar bimbingan seragam antar kelas.",
      "Rekam 1 video langkah wudhu standar sekolah sebagai acuan guru baru.",
      "Tiap Jumat, guru mencatat 3 anak yang perlu pendampingan ekstra minggu depan.",
    ],
  },
  {
    id: "st-pertahankan-2",
    term: "short",
    type: "pertahankan",
    fokus: "citra",
    icon: "📣",
    title: "Rutinkan berbagi cerita baik anak ke orang tua",
    teaser: "Apresiasi sedang tinggi. Rawat momentumnya lewat cerita spesifik tiap anak.",
    mengapa_data:
      "Apresiasi mendominasi refleksi orang tua periode ini; banyak yang menyebut perubahan kecil anak di rumah sebagai hal yang paling disyukuri.",
    mengapa_perspektif:
      "Anak yang perubahan baiknya diakui dua pihak (guru dan orang tua) lebih cepat menginternalisasi perilaku itu sebagai identitasnya. Momentum apresiasi seperti ini adalah aset citra yang menguap kalau tidak dirawat secara sengaja.",
    manfaat:
      "Orang tua melihat langsung hasil kerja sekolah tiap pekan, dan cerita positif menyebar dari sumber yang paling kredibel: orang tua sendiri.",
    konkret: [
      "Tiap guru kirim minimal 1 cerita baik spesifik per anak ke orang tuanya setiap bulan (bukan pujian umum).",
      "Setiap akhir bulan, wali kelas kirim 1 rangkuman pencapaian kelas ke grup orang tua.",
      "Sediakan template catatan positif (situasi, perilaku baik anak, dampaknya) agar guru mudah menulis spesifik.",
    ],
  },

  // ── LONG-TERM (6 bulan) ──
  {
    id: "lt-perhatian-1",
    term: "long",
    type: "perlu_perhatian",
    fokus: "mutu",
    icon: "🌟",
    title: "Integrasikan Berpikir Positif ke kegiatan belajar",
    teaser: "Trennya naik-turun tanpa arah. Masukkan ke cara belajar harian, bukan acara.",
    mengapa_data:
      "Berpikir Positif bergerak naik-turun tiap bulan tanpa arah yang jelas di grafik tren sekolah.",
    mengapa_perspektif:
      "Ketahanan menghadapi kegagalan kecil (resiliensi) adalah fondasi belajar jangka panjang anak; ia tidak tumbuh dari acara sesekali, tapi dari cara guru merespons kesalahan setiap hari. Karena itu jalurnya harus lewat kegiatan belajar, bukan program tempelan.",
    manfaat:
      "Anak lebih berani mencoba dan tidak mudah menyerah, fondasi yang menopang aspek karakter lain dalam jangka panjang.",
    konkret: [
      "Guru menutup tiap pelajaran dengan 1 pertanyaan: apa yang tadi sulit, dan bagaimana kamu menghadapinya?",
      "Adakan 1 lokakarya guru: cara memuji usaha (bukan cuma hasil), lengkap dengan contoh kalimat.",
      "Kepala sekolah tinjau tren Berpikir Positif tiap 3 bulan, sesuaikan pendekatan per jenjang.",
    ],
  },
  {
    id: "lt-perhatian-2",
    term: "long",
    type: "perlu_perhatian",
    fokus: "citra",
    icon: "🎓",
    title: "Program keterlibatan orang tua: kelas parenting berkala",
    teaser: "Kelas parenting paling banyak diminta. Jadwalkan 6 sesi setahun.",
    mengapa_data:
      "Kelas parenting tematik masuk daftar dukungan yang paling banyak diminta orang tua, dan sebagian menyatakan ingin terlibat lebih aktif bulan depan.",
    mengapa_perspektif:
      "Perkembangan karakter anak paling kuat ketika sekolah dan rumah memakai bahasa pengasuhan yang sama. Sekolah yang memampukan orang tuanya, bukan hanya melayani anaknya, dipandang sebagai mitra tumbuh, dan itu citra yang tidak bisa dibeli lewat promosi.",
    manfaat:
      "Pembiasaan sekolah diteruskan di rumah dengan cara yang benar, dan orang tua merasa memiliki program sekolah, bukan sekadar penonton.",
    konkret: [
      "Jadwalkan kelas parenting tiap 2 bulan (6 sesi setahun); tema diambil dari data kebutuhan orang tua.",
      "Tiap sesi, 1 guru kelas jadi pemateri pendamping supaya contohnya kontekstual dengan anak-anak di sini.",
      "Catat jumlah hadir dan 1 umpan balik tiap sesi untuk menentukan tema berikutnya.",
    ],
  },
  {
    id: "lt-pertahankan-1",
    term: "long",
    type: "pertahankan",
    fokus: "mutu",
    icon: "🏫",
    title: "Lembagakan program karakter unggulan sekolah",
    teaser: "Kebiasaan baik masih hidup di kepala guru. Tuliskan jadi program resmi.",
    mengapa_data:
      "Kekuatan ibadah dan pembiasaan baik sekolah beberapa periode ini masih bertumpu pada rutinitas harian yang belum terdokumentasi.",
    mengapa_perspektif:
      "Dari sisi kebijakan, kebiasaan baik yang hanya hidup di kepala guru akan ikut pergi saat gurunya pindah. Melembagakannya ke kurikulum memastikan anak-anak angkatan berikutnya menerima kualitas pembinaan yang sama, bukan tergantung keberuntungan komposisi guru.",
    manfaat:
      "Identitas karakter sekolah bertahan lintas tahun ajaran dan pergantian guru, serta jadi nilai jual resmi ke yayasan dan calon orang tua.",
    konkret: [
      "Tulis 1 dokumen program karakter unggulan: aspek yang diprioritaskan, rutinitas hariannya, dan cara menilainya.",
      "Tunjuk 1 koordinator karakter dan tetapkan 3 indikator keberhasilan yang terukur.",
      "Koordinator lapor perkembangan ke yayasan tiap semester (2 kali setahun).",
    ],
  },
];

// ── Level WALI KELAS: aksi kelas & rumah, bukan kebijakan sekolah ──
export const KEBIJAKAN_WALIKELAS = [
  {
    id: "wk-st-perhatian-1",
    term: "short",
    type: "perlu_perhatian",
    fokus: "mutu",
    icon: "💬",
    title: "Latihan kalimat baik 5 menit tiap pagi",
    teaser: "Aspek Berbicara Yang Baik paling rendah di kelas ini. Mulai dari rutinitas kecil.",
    mengapa_data:
      "Berbicara Yang Baik jadi aspek terendah kelas periode ini, dan beberapa siswa turun dari bulan lalu.",
    mengapa_perspektif:
      "Di usia ini anak meniru pola bicara orang terdekat, termasuk teman sekelas. Lima menit latihan terpimpin tiap pagi jauh lebih efektif daripada teguran panjang saat masalah sudah terjadi.",
    manfaat:
      "Suasana kelas lebih tenang, dan anak yang tadinya sering kelepasan bicara kasar punya contoh kalimat pengganti yang jelas.",
    konkret: [
      "Tiap pagi 5 menit sebelum pelajaran pertama, pandu latihan 3 kalimat: tolong, maaf, terima kasih.",
      "Tunjuk 2 duta kata baik bergilir tiap minggu untuk memberi contoh.",
      "Catat 1 momen kata baik per hari di papan kelas, apresiasi di akhir minggu.",
    ],
  },
  {
    id: "wk-st-perhatian-2",
    term: "short",
    type: "perlu_perhatian",
    fokus: "citra",
    icon: "🤝",
    title: "Balas refleksi orang tua yang meminta dukungan",
    teaser: "Ada orang tua di kelas ini yang minta panduan & konsultasi. Balas satu per satu.",
    mengapa_data:
      "Dari refleksi periode ini, beberapa orang tua kelas ini meminta panduan pembiasaan di rumah dan konsultasi ringan dengan guru.",
    mengapa_perspektif:
      "Orang tua yang merasa dijawab akan meneruskan pembiasaan kelas di rumah, sehingga anak mendapat pesan yang sama di dua tempat. Yang tidak dijawab pelan-pelan berhenti mengisi refleksi.",
    manfaat:
      "Pembiasaan kelas berlanjut di rumah, dan pengisian refleksi bulan berikutnya tetap tinggi.",
    konkret: [
      "Buka daftar orang tua yang minta dukungan di tab Suara Orang Tua, balas dalam 3 hari kerja.",
      "Kirim 1 panduan pembiasaan sederhana (1 halaman) ke grup kelas.",
      "Tawarkan 2 slot konsultasi ringan 15 menit per minggu.",
    ],
  },
  {
    id: "wk-st-pertahankan-1",
    term: "short",
    type: "pertahankan",
    fokus: "mutu",
    icon: "💧",
    title: "Jaga rutinitas wudhu terpimpin kelas",
    teaser: "Aspek terkuat kelas. Jangan dikurangi saat jadwal padat.",
    mengapa_data:
      "Fiqih Berwudhu jadi aspek terkuat kelas ini beberapa bulan berturut-turut.",
    mengapa_perspektif:
      "Rutinitas yang stabil memberi anak struktur harian yang aman. Sekali bolong karena jadwal padat, anak yang paling butuh struktur justru yang paling cepat kehilangan ritme.",
    manfaat:
      "Kekuatan kelas tetap terjaga dan bisa jadi contoh pola pendampingan untuk aspek lain.",
    konkret: [
      "Kunci slot wudhu terpimpin di jadwal harian, jangan dipotong walau jam padat.",
      "Tiap Jumat catat 3 anak yang butuh pendampingan ekstra minggu depan.",
      "Bagikan 1 foto/cerita rutinitas ini ke grup orang tua tiap bulan.",
    ],
  },
  {
    id: "wk-lt-perhatian-1",
    term: "long",
    type: "perlu_perhatian",
    fokus: "mutu",
    icon: "🌟",
    title: "Dampingi 5 siswa yang paling butuh penguatan",
    teaser: "Ada siswa di bawah 80%. Enam bulan pendampingan personal, bukan hukuman.",
    mengapa_data:
      "Daftar top 5 siswa perlu penguatan kelas ini menunjukkan beberapa anak konsisten di bawah 80% lebih dari satu periode.",
    mengapa_perspektif:
      "Anak yang tertinggal di aspek karakter jarang tertolong oleh program klasikal; mereka butuh orang dewasa yang memperhatikan secara personal. Enam bulan cukup untuk membentuk kebiasaan baru kalau konsisten.",
    manfaat:
      "Jarak antar siswa mengecil, dan tidak ada anak yang tertinggal diam-diam sampai akhir tahun ajaran.",
    konkret: [
      "Pilih 5 siswa dari daftar perlu penguatan, buat 1 target kecil per anak per bulan.",
      "Sapa personal 5 anak itu tiap pagi (cukup 1 menit per anak).",
      "Hubungi orang tuanya sekali sebulan: ceritakan kemajuan, bukan keluhan.",
    ],
  },
  {
    id: "wk-lt-pertahankan-1",
    term: "long",
    type: "pertahankan",
    fokus: "citra",
    icon: "📣",
    title: "Rutinkan cerita baik anak ke orang tua",
    teaser: "Apresiasi orang tua kelas ini tinggi. Rawat dengan cerita spesifik tiap anak.",
    mengapa_data:
      "Refleksi orang tua kelas ini didominasi apresiasi dan cerita perubahan kecil anak di rumah.",
    mengapa_perspektif:
      "Anak yang perubahan baiknya diakui guru dan orang tua sekaligus lebih cepat menjadikan perilaku itu identitasnya. Kepercayaan orang tua juga aset kelas yang menguap kalau tidak dirawat.",
    manfaat:
      "Orang tua melihat hasil kerja kelas tiap bulan, dan cerita positif menyebar dari sumber paling kredibel.",
    konkret: [
      "Kirim 1 cerita baik spesifik per anak ke orang tuanya minimal sebulan sekali.",
      "Pakai template: situasi, perilaku baik anak, dampaknya.",
      "Akhir bulan kirim 1 rangkuman pencapaian kelas ke grup orang tua.",
    ],
  },
];

// ── Level YAYASAN: keputusan lintas sekolah ──
export const KEBIJAKAN_YAYASAN = [
  {
    id: "yy-st-perhatian-1",
    term: "short",
    type: "perlu_perhatian",
    fokus: "mutu",
    icon: "🏫",
    title: "Review sekolah dengan pencapaian karakter terendah",
    teaser: "Ada sekolah yang tertinggal dari rata-rata yayasan. Mulai dari percakapan, bukan sanksi.",
    mengapa_data:
      "Perbandingan antar sekolah periode ini menunjukkan selisih pencapaian karakter yang cukup lebar antara sekolah terkuat dan terlemah.",
    mengapa_perspektif:
      "Selisih antar sekolah biasanya soal pola pendampingan guru, bukan kualitas anak. Dari sisi tata kelola, yayasan yang turun tangan lebih awal mencegah masalah kecil jadi reputasi.",
    manfaat:
      "Sekolah yang tertinggal dapat dukungan sebelum orang tuanya kecewa, dan standar yayasan tetap merata.",
    konkret: [
      "Jadwalkan 1 kunjungan review ke sekolah dengan skor terendah bulan ini.",
      "Bandingkan pola pendampingan dengan sekolah terkuat, catat 3 perbedaan utama.",
      "Sepakati 1 rencana perbaikan 3 bulan bersama kepala sekolahnya.",
    ],
  },
  {
    id: "yy-st-pertahankan-1",
    term: "short",
    type: "pertahankan",
    fokus: "citra",
    icon: "📣",
    title: "Angkat cerita keberhasilan sekolah ke kanal yayasan",
    teaser: "Suara orang tua sedang positif. Jadikan bukti citra, bukan arsip.",
    mengapa_data:
      "Refleksi orang tua lintas sekolah periode ini didominasi apresiasi dan cerita keberhasilan.",
    mengapa_perspektif:
      "Citra yayasan dibangun dari cerita orang tua yang nyata, bukan iklan. Momen positif yang tidak diangkat akan lewat begitu saja, padahal calon orang tua mencarinya.",
    manfaat:
      "Kepercayaan orang tua lama menguat dan jadi referensi alami bagi calon pendaftar.",
    konkret: [
      "Pilih 2 cerita orang tua terbaik per sekolah tiap bulan (seizin yang bersangkutan).",
      "Terbitkan di kanal resmi yayasan dengan format seragam.",
      "Kirim apresiasi ke sekolah yang ceritanya diangkat.",
    ],
  },
  {
    id: "yy-lt-perhatian-1",
    term: "long",
    type: "perlu_perhatian",
    fokus: "mutu",
    icon: "🎓",
    title: "Standarkan pembinaan karakter lintas sekolah",
    teaser: "Hasil tiap sekolah masih tergantung gurunya. Buat standar yayasan.",
    mengapa_data:
      "Selisih skor antar sekolah untuk aspek yang sama menunjukkan pendekatan pembinaan belum seragam.",
    mengapa_perspektif:
      "Anak di semua sekolah yayasan berhak mendapat kualitas pembinaan yang sama. Standar tertulis membuat kualitas tidak bergantung pada keberuntungan komposisi guru di tiap sekolah.",
    manfaat:
      "Kualitas merata lintas sekolah dan memudahkan evaluasi tahunan yayasan.",
    konkret: [
      "Susun 1 panduan pembinaan karakter standar yayasan (ambil dari praktik sekolah terkuat).",
      "Adakan pelatihan guru lintas sekolah 2 kali setahun.",
      "Masukkan konsistensi pembinaan karakter ke evaluasi kepala sekolah.",
    ],
  },
  {
    id: "yy-lt-pertahankan-1",
    term: "long",
    type: "pertahankan",
    fokus: "mutu",
    icon: "🧭",
    title: "Jadikan Rapor Karakter reviu rutin yayasan",
    teaser: "Data karakter sudah rapi tiap bulan. Kunci jadi agenda tetap.",
    mengapa_data:
      "Data pencapaian karakter per sekolah kini tersedia rutin tiap periode di laporan ini.",
    mengapa_perspektif:
      "Yang diukur dan direviu rutin akan membaik; yang hanya dilihat sesekali akan terlupakan. Menjadikannya agenda tetap memastikan karakter setara pentingnya dengan keuangan di mata yayasan.",
    manfaat:
      "Arah pembinaan karakter yayasan konsisten lintas tahun ajaran, tidak tergantung momentum.",
    konkret: [
      "Masukkan reviu Rapor Karakter sebagai agenda tetap rapat yayasan bulanan (15 menit cukup).",
      "Tetapkan 3 angka yang selalu dipantau: rata-rata yayasan, sekolah terendah, tren 3 bulan.",
      "Sekali setahun, tetapkan 1 target karakter yayasan untuk tahun ajaran berikutnya.",
    ],
  },
];
