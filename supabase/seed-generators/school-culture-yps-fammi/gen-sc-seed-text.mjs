// Bagian 2 generator seed School Culture: kamus teks (jawaban esai, rencana aksi, lingkar
// kontribusi, tindak lanjut lembaga). Semua teks di sini FIKTIF, ditulis untuk data demo.

/** Q1 "gambaran lembaga": frasa pendek, dipakai verbatim jadi judul hero laporan individu
 * ("Anda melihat <lembaga> ini sebagai ..."), sekaligus jadi bahan word cloud 01-E. */
export const Q1 = [
  { teks: "rumah kedua yang hangat", frasa: "Rumah kedua", mood: 1 },
  { teks: "keluarga besar yang saling menutupi kekurangan", frasa: "Keluarga besar", mood: 1 },
  { teks: "tempat belajar yang ramai tapi menyenangkan", frasa: "Ramai tapi menyenangkan", mood: 1 },
  { teks: "ruang belajar bersama, bukan cuma tempat mengajar", frasa: "Ruang belajar bersama", mood: 1 },
  { teks: "tim yang kompak kalau sedang ada acara besar", frasa: "Kompak saat acara besar", mood: 0 },
  { teks: "sekolah yang rapi dan serba terjadwal", frasa: "Rapi dan terjadwal", mood: 0 },
  { teks: "tempat menitipkan harapan orang tua murid", frasa: "Titipan harapan orang tua", mood: 0 },
  { teks: "tempat kerja yang hangat tapi jadwalnya padat", frasa: "Hangat tapi padat", mood: 0 },
  { teks: "tempat yang aman, cuma kurang ruang mencoba", frasa: "Aman, kurang ruang mencoba", mood: -1 },
  { teks: "tempat yang tertib tapi agak kaku", frasa: "Tertib tapi kaku", mood: -1 },
  { teks: "mesin yang jalan rapi tapi jarang dievaluasi", frasa: "Rapi tapi jarang dievaluasi", mood: -1 },
  { teks: "kapal yang jalan terus tanpa sempat berhenti", frasa: "Jalan terus tanpa berhenti", mood: -1 },
];

/** Q2 "kejadian keseharian": satu adegan sehari-hari. Sumber kolom kiri word cloud 01-E. */
export const Q2 = [
  { teks: "Pagi-pagi guru piket sudah berdiri di gerbang, menyambut murid satu per satu.", frasa: "Sambutan pagi di gerbang", mood: 1 },
  { teks: "Kalau ada guru yang sakit, jam mengajarnya langsung ditutup rekan satu jenjang tanpa perlu diminta.", frasa: "Saling menutup jam kosong", mood: 1 },
  { teks: "Guru saling bertukar bahan ajar lewat grup jenjang, kadang malam hari sekalipun.", frasa: "Tukar bahan ajar", mood: 1 },
  { teks: "Kalau ada acara besar, hampir semua turun tangan sampai lewat jam pulang.", frasa: "Turun tangan sampai malam", mood: 0 },
  { teks: "Murid yang bermasalah dibahas dulu bersama wali kelas dan guru BK sebelum orang tuanya dihubungi.", frasa: "Kasus murid dibahas bersama", mood: 1 },
  { teks: "Guru senior biasanya diminta menemani guru baru di minggu-minggu pertama.", frasa: "Pendampingan guru baru", mood: 1 },
  { teks: "Setiap Senin ada briefing singkat sebelum jam pertama dimulai.", frasa: "Briefing Senin pagi", mood: 0 },
  { teks: "Rapat mingguan sering molor karena satu agenda dibahas berulang.", frasa: "Rapat sering molor", mood: -1 },
  { teks: "Pengumuman kegiatan sering datang mendadak, kadang dua hari sebelum acara.", frasa: "Pengumuman mendadak", mood: -1 },
  { teks: "Laporan administrasi menumpuk di akhir bulan dan dikerjakan sampai lewat jam pulang.", frasa: "Administrasi menumpuk", mood: -1 },
  { teks: "Kalau ada ide baru, biasanya berhenti di forum karena belum jelas siapa yang memutuskan.", frasa: "Ide berhenti di forum", mood: -1 },
  { teks: "Jam istirahat sering habis untuk mengejar koreksi pekerjaan murid.", frasa: "Istirahat dipakai koreksi", mood: -1 },
];

/** Q3 "yang ingin diubah": sumber kolom kanan word cloud 01-E dan kutipan hero laporan individu. */
export const Q3 = [
  { teks: "Jadwal kegiatan dipetakan lebih awal, minimal satu bulan di depan.", frasa: "Jadwal dipetakan lebih awal", tema: "kepastian" },
  { teks: "Rapat dibuat lebih singkat dan selalu berakhir dengan keputusan.", frasa: "Rapat lebih singkat", tema: "kepastian" },
  { teks: "Ada waktu khusus untuk mencoba metode mengajar baru.", frasa: "Waktu untuk metode baru", tema: "inovasi" },
  { teks: "Beban administrasi guru dikurangi atau dibantu tenaga khusus.", frasa: "Beban administrasi dikurangi", tema: "beban" },
  { teks: "Jalur menyampaikan ide dibuat jelas, tidak berhenti di tengah jalan.", frasa: "Jalur ide diperjelas", tema: "inovasi" },
  { teks: "Pembagian tugas tambahan lebih merata antarguru.", frasa: "Tugas tambahan lebih merata", tema: "beban" },
  { teks: "Pelatihan dibuka untuk semua, bukan bergiliran orang yang sama.", frasa: "Pelatihan lebih merata", tema: "pengembangan" },
  { teks: "Ada kejelasan jenjang karier untuk guru dan tenaga kependidikan.", frasa: "Kejelasan jenjang karier", tema: "pengembangan" },
  { teks: "Keputusan penting dijelaskan alasannya, bukan cuma diumumkan.", frasa: "Keputusan dijelaskan alasannya", tema: "kepastian" },
  { teks: "Jam pulang dihormati, pekerjaan tidak lagi mengejar sampai rumah.", frasa: "Jam pulang dihormati", tema: "waktu" },
  { teks: "Kegiatan lintas jenjang diperbanyak supaya tidak jalan sendiri-sendiri.", frasa: "Kolaborasi lintas jenjang", tema: "sinergi" },
  { teks: "Evaluasi program dijalankan rutin, bukan cuma saat ada masalah.", frasa: "Evaluasi rutin", tema: "kepastian" },
];

/** Q4 alasan betah, Q5 hal menguras energi, Q6 yang ingin disampaikan: domain KESEJAHTERAAN,
 * jadi bahan tema_esai ("Suara Tim", section 02-C). `tema` menautkan tiap butir ke satu tema. */
export const Q4 = [
  { teks: "Rekan satu jenjang gampang diajak diskusi kalau ada murid yang butuh perhatian khusus.", tema: "dukungan_rekan" },
  { teks: "Suasana kerjanya hangat, tidak ada yang dibiarkan sendirian waktu kewalahan.", tema: "dukungan_rekan" },
  { teks: "Murid-muridnya bikin capek jadi terbayar.", tema: "makna_kerja" },
  { teks: "Pimpinan unit mau mendengar kalau ada keluhan yang disampaikan langsung.", tema: "kepemimpinan" },
  { teks: "Jarak dari rumah dekat dan jam kerjanya jelas.", tema: "waktu_pribadi" },
  { teks: "Sesama guru saling menutup kalau ada yang berhalangan hadir.", tema: "dukungan_rekan" },
  { teks: "Saya masih bisa belajar banyak dari rekan yang lebih senior.", tema: "pengembangan" },
  { teks: "Sekolah memberi kepercayaan untuk mengelola kelas dengan cara sendiri.", tema: "makna_kerja" },
];

export const Q5 = [
  { teks: "Laporan administrasi yang formatnya berubah-ubah menjelang tenggat.", tema: "beban_administrasi" },
  { teks: "Jadwal kegiatan tambahan yang sering muncul mendadak.", tema: "kepastian_jadwal" },
  { teks: "Rapat panjang yang berakhir tanpa keputusan.", tema: "kepastian_jadwal" },
  { teks: "Menghadapi keluhan orang tua murid sendirian tanpa panduan yang jelas.", tema: "dukungan_rekan" },
  { teks: "Pekerjaan yang terbawa sampai rumah hampir setiap malam.", tema: "waktu_pribadi" },
  { teks: "Tugas tambahan yang menumpuk di orang yang sama terus.", tema: "beban_administrasi" },
  { teks: "Menunggu keputusan yang tidak jelas siapa yang berwenang.", tema: "kepastian_jadwal" },
  { teks: "Koreksi pekerjaan murid yang menumpuk sampai akhir pekan.", tema: "waktu_pribadi" },
];

export const Q6 = [
  { teks: "Semoga ide dari guru yang lebih muda juga diberi ruang untuk dicoba.", tema: "pengembangan" },
  { teks: "Terima kasih untuk rekan-rekan yang selalu siap membantu.", tema: "dukungan_rekan" },
  { teks: "Mohon kejelasan soal jenjang karier dan penghargaan kerja.", tema: "pengembangan" },
  { teks: "Kalau bisa pelatihan dibuka untuk semua guru, bukan bergiliran orang yang sama.", tema: "pengembangan" },
  { teks: "Beban administrasi tolong ditinjau ulang supaya waktu mengajar tidak terpotong.", tema: "beban_administrasi" },
  { teks: "Komunikasi antarunit perlu diperkuat supaya tidak jalan sendiri-sendiri.", tema: "kepastian_jadwal" },
  { teks: "Semoga jam pulang benar-benar dihormati.", tema: "waktu_pribadi" },
  { teks: "Saya berharap keputusan sekolah dijelaskan alasannya ke semua staf.", tema: "kepemimpinan" },
];

export const Q7 = [
  "Kalau boleh memilih satu hal untuk diperbaiki lebih dulu, saya memilih kepastian jadwal. Sisanya bisa menyusul.",
  "Saya betah di sini karena orangnya, bukan karena sistemnya. Dua-duanya sebenarnya bisa sama baiknya.",
  "Sekolah ini punya modal kekompakan yang jarang dipunyai tempat lain. Sayang kalau habis dipakai untuk menambal jadwal mendadak.",
  "Saya ingin tetap mengajar lama di sini, asal ada ruang untuk berkembang, bukan cuma menjalankan yang sudah ada.",
];

/** Judul tema untuk section 02-C (Suara Tim). Kunci cocok dengan field `tema` di Q4/Q5/Q6. */
export const TEMA_ESAI_META = {
  beban_administrasi: {
    tema: "Beban administrasi di luar jam mengajar",
    ringkasan: "Pekerjaan administrasi yang formatnya berubah dan menumpuk di akhir bulan berulang kali disebut sebagai penguras energi utama, terutama oleh guru yang juga memegang tugas tambahan.",
  },
  kepastian_jadwal: {
    tema: "Kepastian jadwal dan kejelasan keputusan",
    ringkasan: "Jadwal kegiatan yang muncul mendadak dan rapat yang berakhir tanpa keputusan disebut membuat persiapan mengajar terganggu, bukan karena beban kerjanya berat, tapi karena tidak bisa direncanakan.",
  },
  waktu_pribadi: {
    tema: "Pekerjaan yang terbawa sampai rumah",
    ringkasan: "Koreksi dan laporan yang dikerjakan di rumah muncul di banyak jawaban, sejalan dengan Work-Life Balance sebagai subdimensi kesejahteraan paling rendah periode ini.",
  },
  dukungan_rekan: {
    tema: "Dukungan antarrekan sebagai penopang utama",
    ringkasan: "Alasan paling sering disebut untuk tetap bertahan adalah rekan kerja yang saling menutup dan mudah diajak berdiskusi. Ini kekuatan yang menopang saat hal lain terasa berat.",
  },
  pengembangan: {
    tema: "Ruang belajar dan kejelasan jenjang karier",
    ringkasan: "Permintaan pelatihan yang merata dan kejelasan jenjang karier muncul berulang, sejalan dengan Pengembangan Diri yang berada di kategori Sedang.",
  },
  kepemimpinan: {
    tema: "Keputusan yang dijelaskan alasannya",
    ringkasan: "Staf menghargai pimpinan yang mau mendengar, dan meminta keputusan penting disertai alasannya, bukan cuma diumumkan.",
  },
  makna_kerja: {
    tema: "Murid sebagai sumber makna kerja",
    ringkasan: "Sebagian staf menyebut murid dan kepercayaan mengelola kelas sebagai alasan utama bertahan, terlepas dari beban kerja yang ada.",
  },
};

/** Rencana aksi pribadi terkait tipe budaya dengan gap terbesar. arah "naik" = harapan lebih
 * tinggi dari kondisi sekarang, "turun" = kondisi sekarang dirasa berlebih. */
export const AKSI_BUDAYA = {
  Kekeluargaan: {
    naik: { judul: "Sisihkan satu jam untuk menemani rekan satu unit.", terkait: "Kekeluargaan", jangka: "Bulan ini", ikon: "🤝",
      alasan: "Harapan Anda pada kedekatan antarrekan lebih tinggi dari yang Anda rasakan sekarang. Kedekatan tumbuh dari pertemuan yang disengaja, bukan dari kebetulan berpapasan di koridor." },
    turun: { judul: "Pisahkan urusan pribadi dan urusan kerja di forum unit.", terkait: "Kekeluargaan", jangka: "Bulan ini", ikon: "🧭",
      alasan: "Anda merasakan sisi kekeluargaan lebih besar dari yang Anda butuhkan. Kehangatan tetap terjaga kalau keputusan kerja punya forumnya sendiri." },
  },
  Inovasi: {
    naik: { judul: "Ajukan satu metode mengajar baru untuk diuji coba.", terkait: "Inovasi", jangka: "Bulan ini", ikon: "💡",
      alasan: "Ruang mencoba hal baru jadi jarak terbesar antara kondisi sekarang dan harapan Anda. Satu ide konkret lebih menggerakkan daripada menunggu ruangnya dibuka lebih dulu." },
    turun: { judul: "Rapikan dulu satu cara kerja yang sudah berjalan.", terkait: "Inovasi", jangka: "Bulan ini", ikon: "🔧",
      alasan: "Perubahan terasa lebih cepat dari yang Anda butuhkan. Menyelesaikan satu perbaikan sampai tuntas lebih berguna daripada menambah hal baru." },
  },
  Orientasi: {
    naik: { judul: "Tetapkan satu ukuran keberhasilan untuk kelas Anda.", terkait: "Orientasi", jangka: "Minggu ini", ikon: "🎯",
      alasan: "Anda mengharapkan arah kerja yang lebih terukur. Satu ukuran yang Anda tentukan sendiri lebih mudah dijaga daripada target yang datang dari luar." },
    turun: { judul: "Beri ruang proses, bukan cuma angka capaian.", terkait: "Orientasi", jangka: "Bulan ini", ikon: "🌱",
      alasan: "Tekanan capaian terasa lebih besar dari yang Anda harapkan. Mencatat kemajuan proses menjaga motivasi tetap hidup saat angka belum bergerak." },
  },
  Aturan: {
    naik: { judul: "Rapikan satu prosedur yang sering bikin bingung.", terkait: "Aturan", jangka: "Bulan ini", ikon: "📋",
      alasan: "Anda mengharapkan kerja yang lebih tertata dari kondisi sekarang. Satu prosedur yang jelas mengurangi waktu yang habis untuk saling bertanya." },
    turun: { judul: "Coba satu keputusan kecil tanpa menunggu prosedur baru.", terkait: "Aturan", jangka: "Minggu ini", ikon: "🚪",
      alasan: "Aturan terasa lebih mengikat dari yang Anda butuhkan. Mengambil satu keputusan di wilayah Anda sendiri membuktikan ruang gerak itu sebenarnya ada." },
  },
};

/** Rencana aksi terkait subdimensi kesejahteraan TERENDAH milik orang itu. */
export const AKSI_KESEJAHTERAAN_RENDAH = {
  kepuasan_kepemimpinan: { judul: "Bawa satu masalah nyata ke pimpinan unit.", jangka: "Bulan ini", ikon: "🗣️",
    alasan: "Kepuasan pada Kepemimpinan jadi sisi terendah Anda. Menyampaikan satu masalah konkret dengan usulan solusinya membuka percakapan yang selama ini tertunda." },
  kenyamanan_bekerja: { judul: "Perbaiki satu hal di ruang kerja Anda sendiri.", jangka: "Minggu ini", ikon: "🪑",
    alasan: "Kenyamanan Bekerja jadi sisi terendah Anda. Mulai dari yang benar-benar bisa Anda ubah sendiri, bukan dari yang butuh keputusan orang lain." },
  pengembangan_diri: { judul: "Pilih satu keterampilan untuk didalami tiga bulan ini.", jangka: "3 bulan", ikon: "📚",
    alasan: "Pengembangan Diri jadi sisi terendah Anda. Menetapkan satu fokus membuat waktu belajar yang sempit tetap membekas." },
  ekspektasi: { judul: "Tuliskan ulang harapan Anda pada peran ini.", jangka: "Bulan ini", ikon: "📝",
    alasan: "Ekspektasi Terpenuhi jadi sisi terendah Anda. Menuliskan harapan yang belum terpenuhi membuatnya bisa dibicarakan, bukan cuma dipendam." },
  work_life_balance: { judul: "Tetapkan satu jam yang tidak diganggu pekerjaan.", jangka: "Minggu ini", ikon: "🕰️",
    alasan: "Work-Life Balance jadi sisi terendah Anda. Satu jam yang dijaga konsisten lebih realistis daripada menunggu beban kerja berkurang sendiri." },
};

/** Rencana aksi ketiga: memanfaatkan subdimensi kesejahteraan TERTINGGI sebagai modal. */
export const AKSI_KESEJAHTERAAN_KUAT = {
  kepuasan_kepemimpinan: { judul: "Jadi penyambung suara rekan ke pimpinan.", jangka: "3 bulan", ikon: "🔗",
    alasan: "Kepuasan Anda pada kepemimpinan jadi yang tertinggi. Kepercayaan itu paling berguna kalau dipakai membawa masukan rekan yang belum berani menyampaikan." },
  kenyamanan_bekerja: { judul: "Ajak satu rekan baru masuk ke lingkaran kerja Anda.", jangka: "3 bulan", ikon: "🫱",
    alasan: "Kenyamanan Bekerja jadi sisi terkuat Anda. Kekuatan ini bernilai kalau ditularkan ke orang yang belum merasakannya." },
  pengembangan_diri: { judul: "Bagikan satu hal yang baru Anda pelajari ke rekan.", jangka: "3 bulan", ikon: "🎓",
    alasan: "Pengembangan Diri jadi sisi terkuat Anda. Membagikannya membuat yang Anda pelajari mengendap lebih dalam." },
  ekspektasi: { judul: "Ceritakan alasan Anda bertahan ke rekan yang ragu.", jangka: "3 bulan", ikon: "🌤️",
    alasan: "Ekspektasi Terpenuhi jadi sisi terkuat Anda. Cerita yang jujur lebih menular daripada ajakan untuk bertahan." },
  work_life_balance: { judul: "Tunjukkan cara Anda menjaga batas jam kerja.", jangka: "3 bulan", ikon: "⚖️",
    alasan: "Work-Life Balance jadi sisi terkuat Anda, jarang di lembaga ini. Cara Anda menjaganya layak dicontoh rekan lain." },
};

/** Lingkar Kontribusi area "control": disusun dari subdimensi kesejahteraan terendah. */
export const LINGKAR_CONTROL = {
  kepuasan_kepemimpinan: [
    { judul: "Catat pola masalah sebelum menyampaikannya", instruksi: "Selama dua minggu, catat setiap kali:", contoh: ["Keputusan yang tidak jelas dasarnya.", "Informasi yang datang terlambat.", "Dampaknya pada pekerjaan Anda hari itu."], tujuan: "Supaya yang Anda sampaikan berupa pola, bukan kesan sesaat." },
    { judul: "Siapkan satu usulan, bukan cuma keluhan", instruksi: "Untuk satu masalah yang paling sering muncul, tuliskan:", contoh: ["Apa yang terjadi sekarang.", "Apa yang Anda usulkan.", "Apa yang Anda siap kerjakan sendiri."], tujuan: "Percakapan dengan pimpinan berjalan lebih jauh kalau ada usulan konkret di dalamnya." },
    { judul: "Pilih waktu bicara yang bukan saat genting", instruksi: "Cari satu momen tenang untuk bicara, misalnya:", contoh: ["Setelah jam mengajar terakhir.", "Di luar minggu ujian.", "Bukan lewat pesan singkat."], tujuan: "Isi pembicaraan lebih terdengar kalau waktunya tepat." },
  ],
  kenyamanan_bekerja: [
    { judul: "Rapikan satu sudut ruang kerja Anda", instruksi: "Minggu ini, kerjakan satu hal kecil:", contoh: ["Rapikan berkas yang menumpuk di meja.", "Pindahkan barang yang tidak lagi dipakai.", "Siapkan satu tempat tetap untuk bahan ajar."], tujuan: "Kenyamanan sering berubah dari hal kecil yang sepenuhnya di tangan Anda." },
    { judul: "Sepakati satu kebiasaan kerja dengan rekan terdekat", instruksi: "Bicarakan dengan satu rekan satu ruang:", contoh: ["Jam mana yang dipakai untuk kerja fokus.", "Cara menitip pesan saat sedang mengajar.", "Batas suara di ruang bersama."], tujuan: "Sebagian besar gangguan kenyamanan bisa selesai lewat satu kesepakatan kecil." },
    { judul: "Kenali pemicu tidak nyaman Anda sendiri", instruksi: "Selama seminggu, tandai:", contoh: ["Jam berapa Anda paling terganggu.", "Kegiatan apa yang membuatnya muncul.", "Apa yang biasanya menenangkan."], tujuan: "Pola yang dikenali lebih mudah disiasati daripada rasa yang cuma dirasakan." },
  ],
  pengembangan_diri: [
    { judul: "Pilih satu keterampilan, bukan banyak sekaligus", instruksi: "Tentukan satu hal untuk didalami tiga bulan ke depan:", contoh: ["Satu metode mengajar tertentu.", "Satu alat bantu ajar yang belum dikuasai.", "Satu cara menilai yang lebih cepat."], tujuan: "Fokus yang sempit lebih mungkin selesai daripada rencana besar tanpa waktu." },
    { judul: "Sisihkan 30 menit belajar dalam sepekan", instruksi: "Blokir satu slot tetap di jadwal Anda:", contoh: ["Hari dan jam yang sama tiap pekan.", "Bahan yang sudah disiapkan sebelumnya.", "Catatan singkat setelah selesai."], tujuan: "Kesempatan belajar jarang datang sendiri, ia harus dijadwalkan." },
    { judul: "Cari satu rekan sebagai teman belajar", instruksi: "Ajak satu orang yang minatnya dekat:", contoh: ["Sepakati apa yang mau dipelajari bersama.", "Tentukan kapan saling mengabari kemajuan.", "Coba satu praktik di kelas masing-masing."], tujuan: "Belajar berdua membuat komitmen lebih sulit ditinggalkan." },
  ],
  ekspektasi: [
    { judul: "Tuliskan harapan awal Anda saat masuk", instruksi: "Luangkan 20 menit untuk menulis:", contoh: ["Apa yang Anda bayangkan saat pertama bergabung.", "Bagian mana yang sudah terpenuhi.", "Bagian mana yang belum."], tujuan: "Harapan yang tertulis bisa ditinjau, harapan yang dipendam cuma jadi kecewa." },
    { judul: "Pisahkan yang bisa dan tidak bisa Anda ubah", instruksi: "Dari daftar tadi, tandai:", contoh: ["Yang sepenuhnya keputusan Anda.", "Yang butuh persetujuan orang lain.", "Yang di luar kendali siapa pun di sini."], tujuan: "Energi tidak habis di hal yang memang bukan wilayah Anda." },
    { judul: "Bicarakan satu harapan yang paling mungkin dipenuhi", instruksi: "Pilih satu yang realistis, lalu sampaikan:", contoh: ["Ke pimpinan unit, bukan lewat pihak ketiga.", "Dengan alasan yang jelas.", "Dengan tawaran langkah pertama dari Anda."], tujuan: "Satu harapan yang terpenuhi memulihkan lebih banyak daripada daftar panjang yang menggantung." },
  ],
  work_life_balance: [
    { judul: "Tetapkan jam berhenti kerja setiap hari", instruksi: "Pilih satu jam sebagai batas, lalu:", contoh: ["Tutup pekerjaan administrasi di jam itu.", "Simpan berkas yang belum selesai untuk besok.", "Beri tahu rekan terdekat soal batas itu."], tujuan: "Batas yang diumumkan lebih mudah dijaga daripada niat yang disimpan sendiri." },
    { judul: "Kelompokkan pekerjaan koreksi di satu waktu", instruksi: "Alih-alih dicicil setiap malam:", contoh: ["Tentukan dua slot koreksi dalam sepekan.", "Siapkan semua bahan sebelum mulai.", "Kerjakan di sekolah, bukan di rumah."], tujuan: "Pekerjaan yang dikelompokkan selesai lebih cepat dan tidak menempel sepanjang minggu." },
    { judul: "Jaga satu hari tanpa pekerjaan sekolah", instruksi: "Pilih satu hari dalam sepekan, lalu:", contoh: ["Jangan buka berkas pekerjaan hari itu.", "Beri tahu rekan sejak awal pekan.", "Isi dengan hal yang benar-benar memulihkan."], tujuan: "Pemulihan butuh jeda yang utuh, bukan sisa waktu di sela pekerjaan." },
  ],
};

/** Lingkar Kontribusi area "influence": disusun dari tipe budaya dengan gap terbesar. */
export const LINGKAR_INFLUENCE = {
  Kekeluargaan: [
    { judul: "Mulai satu kebiasaan menyapa di unit", instruksi: "Di pekan berikutnya, coba:", contoh: ["Sapa rekan yang jarang Anda ajak bicara.", "Tanyakan kabar pekerjaannya, bukan cuma agendanya.", "Lakukan berulang, bukan sekali."], tujuan: "Kedekatan tumbuh dari kebiasaan kecil yang diulang, bukan dari acara besar." },
    { judul: "Usulkan satu momen kumpul tanpa agenda kerja", instruksi: "Sampaikan ke koordinator unit:", contoh: ["Waktu singkat setelah rapat rutin.", "Tanpa materi dan tanpa laporan.", "Bergantian yang menyiapkan."], tujuan: "Ruang bicara di luar agenda kerja membuat masalah kecil ketahuan lebih awal." },
    { judul: "Temani satu rekan yang sedang kewalahan", instruksi: "Kalau ada rekan yang jelas kelebihan beban:", contoh: ["Tawarkan bantuan yang spesifik, bukan basa-basi.", "Ambil satu bagian pekerjaannya.", "Ceritakan ke koordinator kalau polanya berulang."], tujuan: "Kekeluargaan terasa nyata saat beban benar-benar berpindah, bukan cuma disimpati." },
  ],
  Inovasi: [
    { judul: "Ajukan ide metode mengajar di forum jenjang", instruksi: "Pada pertemuan rutin berikutnya, sampaikan:", contoh: ["Satu metode yang ingin dicoba dan alasannya.", "Dukungan yang Anda butuhkan.", "Rencana waktu uji cobanya."], tujuan: "Ruang eksperimen lebih cepat terbuka lewat usulan konkret daripada lewat keluhan." },
    { judul: "Ajak satu rekan mencoba bersama", instruksi: "Sebelum forum berikutnya, tanyakan ke satu rekan:", contoh: ["Ide mengajar yang ingin dia coba.", "Kendala yang selama ini menahannya.", "Kesediaannya ikut menyampaikan."], tujuan: "Dua suara lebih sulit diabaikan daripada satu." },
    { judul: "Catat hasil percobaan Anda sendiri", instruksi: "Setelah mencoba, tuliskan:", contoh: ["Apa yang berubah pada murid.", "Kendala yang muncul.", "Apa yang perlu diperbaiki kalau diulang."], tujuan: "Catatan hasil membuat ide berikutnya lebih mudah disetujui." },
  ],
  Orientasi: [
    { judul: "Sepakati satu ukuran bersama di unit", instruksi: "Bawa ke pertemuan unit:", contoh: ["Satu ukuran yang bisa dipantau bersama.", "Cara mencatatnya tanpa menambah laporan baru.", "Kapan ditinjau ulang."], tujuan: "Arah kerja lebih jelas kalau ukurannya disepakati, bukan diturunkan." },
    { judul: "Bagikan cara Anda menjaga capaian kelas", instruksi: "Di forum jenjang, ceritakan:", contoh: ["Cara Anda memantau kemajuan murid.", "Apa yang Anda lakukan saat capaian melambat.", "Alat bantu yang Anda pakai."], tujuan: "Praktik yang berhasil lebih berguna kalau ditiru, bukan disimpan." },
    { judul: "Ingatkan tujuan di balik target", instruksi: "Saat target dibahas, ajukan pertanyaan:", contoh: ["Untuk apa angka ini dikejar.", "Apa yang berubah pada murid kalau tercapai.", "Apa yang dikorbankan kalau dipaksakan."], tujuan: "Target yang jelas alasannya lebih mudah dijalankan bersama." },
  ],
  Aturan: [
    { judul: "Usulkan satu prosedur yang perlu disederhanakan", instruksi: "Pilih satu prosedur yang paling sering menghambat, lalu:", contoh: ["Tuliskan langkah yang sebenarnya tidak perlu.", "Perkirakan waktu yang bisa dihemat.", "Sampaikan ke koordinator unit."], tujuan: "Aturan yang dirapikan mengembalikan waktu ke pekerjaan utama." },
    { judul: "Bantu perjelas satu alur kerja yang membingungkan", instruksi: "Bersama satu rekan, buat:", contoh: ["Daftar langkah dari awal sampai selesai.", "Nama orang yang bertanggung jawab tiap langkah.", "Contoh berkas yang benar."], tujuan: "Kebingungan berulang biasanya bukan soal orangnya, tapi alurnya yang tidak pernah dituliskan." },
    { judul: "Sampaikan aturan yang sudah tidak relevan", instruksi: "Kalau ada aturan yang tidak lagi cocok:", contoh: ["Ceritakan kapan terakhir itu berguna.", "Jelaskan hambatannya sekarang.", "Usulkan penggantinya, bukan cuma penghapusannya."], tujuan: "Usulan yang membawa pengganti lebih mungkin dipertimbangkan." },
  ],
};

/** Lingkar Kontribusi area "system": disusun dari dimensi profil organisasi terendah. */
export const LINGKAR_SYSTEM = {
  karakter_lembaga: [
    { judul: "Sampaikan nilai mana yang belum terasa", instruksi: "Lewat forum resmi yang ada, sampaikan:", contoh: ["Nilai yang sering disebut lembaga.", "Bentuk nyatanya yang belum terlihat di unit Anda.", "Contoh kejadian yang bisa dipakai sebagai bahan."], tujuan: "Nilai lembaga jadi nyata kalau jaraknya dengan keseharian ikut dibicarakan." },
    { judul: "Usulkan cara mengenalkan nilai ke staf baru", instruksi: "Sampaikan ke pimpinan unit:", contoh: ["Apa yang Anda alami saat pertama masuk.", "Informasi yang dulu tidak Anda dapat.", "Bentuk pengenalan yang menurut Anda cukup."], tujuan: "Karakter lembaga paling mudah dititipkan pada orang yang baru bergabung." },
    { judul: "Dokumentasikan kebiasaan baik unit Anda", instruksi: "Catat dan bagikan:", contoh: ["Kebiasaan yang sudah berjalan bertahun-tahun.", "Alasan kebiasaan itu bertahan.", "Cara unit lain bisa menirunya."], tujuan: "Kebiasaan yang tertulis lebih tahan pergantian orang." },
  ],
  kepemimpinan: [
    { judul: "Bawa pola berulang ke jalur resmi", instruksi: "Lewat rapat atau laporan rutin, sampaikan:", contoh: ["Pola keputusan yang sering terlambat.", "Dampaknya pada kesiapan mengajar.", "Usulan jalur konfirmasi yang lebih awal."], tujuan: "Pola yang tercatat bisa jadi bahan kebijakan, keluhan sesaat tidak." },
    { judul: "Usulkan jadwal bicara rutin dengan pimpinan", instruksi: "Ajukan usulan sederhana:", contoh: ["Waktu singkat berkala per unit.", "Agenda dibuka dari staf, bukan dari pimpinan.", "Catatan hasil yang bisa ditagih."], tujuan: "Percakapan yang terjadwal menutup jarak lebih cepat daripada menunggu momen." },
    { judul: "Minta alasan di balik keputusan besar", instruksi: "Saat ada kebijakan baru, tanyakan:", contoh: ["Apa yang mendasari keputusan itu.", "Pilihan apa saja yang sempat dipertimbangkan.", "Bagaimana keberhasilannya akan dinilai."], tujuan: "Kebiasaan bertanya membentuk kebiasaan menjelaskan." },
  ],
  management: [
    { judul: "Usulkan penyederhanaan satu laporan", instruksi: "Pilih laporan yang paling memakan waktu, lalu:", contoh: ["Tandai bagian yang datanya sudah ada di tempat lain.", "Hitung waktu yang habis tiap bulan.", "Sampaikan ke bagian yang memintanya."], tujuan: "Waktu administrasi yang kembali langsung terasa di jam mengajar." },
    { judul: "Bantu bakukan satu alur yang sering berubah", instruksi: "Bersama unit Anda, sepakati:", contoh: ["Format yang dipakai seterusnya.", "Tenggat yang realistis.", "Siapa yang menjawab kalau ada pertanyaan."], tujuan: "Format yang stabil menghilangkan pekerjaan ulang yang tidak perlu." },
    { judul: "Ajukan kalender kegiatan satu semester", instruksi: "Usulkan ke pimpinan:", contoh: ["Kegiatan tetap yang sudah pasti.", "Batas waktu penambahan kegiatan baru.", "Cara mengumumkan perubahan."], tujuan: "Kepastian jadwal adalah keluhan yang paling sering muncul dan paling mudah diperbaiki." },
  ],
  sinergi: [
    { judul: "Usulkan satu pertemuan lintas jenjang", instruksi: "Sampaikan ke pimpinan unit:", contoh: ["Topik yang dibutuhkan dua jenjang sekaligus.", "Waktu yang paling mungkin untuk keduanya.", "Hasil yang diharapkan dari pertemuan itu."], tujuan: "Silo antarjenjang jarang hilang sendiri, ia perlu satu pertemuan pertama." },
    { judul: "Bagikan bahan ajar Anda ke jenjang lain", instruksi: "Pilih satu bahan yang bisa dipakai ulang:", contoh: ["Kirim ke rekan jenjang di atas atau di bawah.", "Jelaskan konteks pemakaiannya.", "Minta masukan balik."], tujuan: "Kerja sama tumbuh lebih cepat lewat pertukaran yang nyata daripada lewat ajakan." },
    { judul: "Usulkan satu proyek kecil bersama", instruksi: "Ajukan proyek yang butuh dua unit:", contoh: ["Lingkupnya kecil dan selesai dalam satu bulan.", "Tugas tiap unit jelas.", "Ada hasil yang bisa dilihat murid."], tujuan: "Keberhasilan kecil lintas unit membuka jalan untuk yang lebih besar." },
  ],
  fokus: [
    { judul: "Minta prioritas program dijelaskan ulang", instruksi: "Di forum resmi, tanyakan:", contoh: ["Program mana yang paling utama semester ini.", "Program mana yang bisa ditunda.", "Ukuran keberhasilan tiap program."], tujuan: "Fokus yang tidak dinyatakan membuat semua program terasa sama pentingnya." },
    { judul: "Usulkan penghentian satu kegiatan yang tumpang tindih", instruksi: "Sampaikan dengan data sederhana:", contoh: ["Kegiatan yang tujuannya sama dengan kegiatan lain.", "Waktu dan tenaga yang terpakai.", "Usulan penggabungannya."], tujuan: "Fokus bertambah dari yang dihentikan, bukan dari yang ditambahkan." },
    { judul: "Kaitkan pekerjaan unit dengan tujuan lembaga", instruksi: "Di rapat unit, coba:", contoh: ["Sebutkan tujuan lembaga yang sedang dikejar.", "Tunjukkan bagian yang dikerjakan unit Anda.", "Tandai yang tidak terhubung ke mana-mana."], tujuan: "Pekerjaan yang jelas kaitannya lebih mudah dipertahankan saat jadwal padat." },
  ],
  performance: [
    { judul: "Usulkan cara menilai yang lebih masuk akal", instruksi: "Sampaikan ke pimpinan:", contoh: ["Ukuran yang sekarang dipakai.", "Bagian yang tidak menggambarkan kerja sebenarnya.", "Usulan ukuran penggantinya."], tujuan: "Penilaian yang dipercaya membuat orang bekerja untuk hasil, bukan untuk laporan." },
    { judul: "Minta umpan balik berkala, bukan tahunan", instruksi: "Ajukan usulan sederhana:", contoh: ["Umpan balik singkat tiap semester.", "Fokus pada satu hal yang perlu diperbaiki.", "Disertai contoh kejadian nyata."], tujuan: "Perbaikan lebih mungkin terjadi kalau umpan baliknya masih dekat dengan kejadiannya." },
    { judul: "Dokumentasikan hasil kerja unit Anda", instruksi: "Setiap akhir semester, catat:", contoh: ["Apa yang dicapai unit.", "Hambatan yang muncul.", "Dukungan yang dibutuhkan periode berikutnya."], tujuan: "Kerja yang tercatat lebih mudah dihargai dan lebih mudah diperbaiki." },
  ],
};
