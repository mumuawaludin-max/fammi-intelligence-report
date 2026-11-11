/**
 * Data contoh layar Skrining & pemetaan (kanvas desain pemilik produk 2026-11-11, artboard
 * "2 · Skrining perilaku & mental 4-10 tahun"). Semua nama, kelas, dan angka di sini contoh untuk
 * demonstrasi, bukan hasil skrining sungguhan.
 */

/** Kelompok hasil skrining. `daftar` = id daftar anak yang dibuka saat kartunya diklik. */
export const KATEGORI = [
  {
    nada: "ok",
    judul: "Sesuai tahap",
    jumlah: "221 anak",
    isi: "Ikut kelas kesadaran bersama teman sekelas, tanpa tindak lanjut khusus.",
    oleh: "Wali kelas",
    daftar: null,
  },
  {
    nada: "warn",
    judul: "Perlu dipantau",
    jumlah: "37 anak",
    isi: "Wali kelas mengamati 4 minggu dan mencatat observasi tiap minggu.",
    oleh: "Wali kelas",
    daftar: "pantau",
  },
  {
    nada: "bad",
    judul: "Perlu dukungan",
    jumlah: "18 anak",
    isi: "Guru BK menyusun rencana dukungan bersama wali kelas dan orang tua.",
    oleh: "Guru BK · wali kelas · orang tua",
    daftar: "dukung",
  },
  {
    nada: "crit",
    judul: "Tanda bahaya",
    jumlah: "2 anak",
    isi: "Otomatis menjadi kasus dan masuk alur penanganan dengan SLA.",
    oleh: "Koordinator BK",
    daftar: "tanda",
  },
];

/**
 * Aspek instrumen, urut seperti di formulir. `ikon` = nama di ikonData.js atau kunci IC di
 * Skrining.jsx. Nomor butir bersambung: aspek ke-i mulai dari i * 5 + 1.
 */
export const ASPEK = [
  {
    judul: "Perasaan",
    ringkas: "Cemas, sedih, keluhan badan",
    ikon: "senyum",
    butir: [
      "Mengeluh sakit perut, pusing, atau tidak enak badan menjelang berangkat sekolah.",
      "Terlihat murung atau menangis karena hal kecil.",
      "Sulit tidur atau sering terbangun karena mimpi buruk.",
      "Gelisah ketika berpisah dengan orang tua atau pengasuh.",
      "Menyampaikan rasa takut yang sulit diredakan.",
    ],
  },
  {
    judul: "Perilaku",
    ringkas: "Marah meledak, menyakiti, aturan",
    ikon: "tangan",
    butir: [
      "Meledak marah, berteriak, atau membanting barang saat keinginannya tidak dituruti.",
      "Sengaja menyakiti teman atau saudara, misalnya memukul atau mendorong.",
      "Menolak mengikuti aturan sederhana di rumah atau di kelas.",
      "Mengambil barang milik orang lain tanpa izin.",
      "Berkata kasar atau mengejek orang lain.",
    ],
  },
  {
    judul: "Fokus & energi",
    ringkas: "Duduk tenang, perhatian, giliran",
    ikon: "petir",
    butir: [
      "Sulit duduk tenang saat makan, belajar, atau mendengarkan cerita.",
      "Perhatiannya mudah teralih sebelum tugas sederhana selesai.",
      "Bertindak tanpa melihat bahaya, misalnya berlari ke jalan atau memanjat tinggi.",
      "Sulit menunggu giliran atau sering memotong pembicaraan.",
      "Kesulitan mengikuti instruksi dua sampai tiga langkah.",
    ],
  },
  {
    judul: "Pertemanan",
    ringkas: "Bermain bersama, dijauhi, diejek",
    ikon: "kelompok",
    butir: [
      "Lebih sering bermain sendiri daripada bersama teman sebaya.",
      "Bercerita tidak diajak bermain atau dijauhi teman.",
      "Lebih nyaman bersama orang dewasa daripada teman sebaya.",
      "Menjadi sasaran ejekan, dorongan, atau ancaman teman.",
      "Kesulitan bergabung ke permainan kelompok.",
    ],
  },
  {
    judul: "Kepedulian",
    ringkas: "Berbagi, menolong, empati (kekuatan)",
    ikon: "hati",
    kekuatan: true,
    butir: [
      "Mau berbagi mainan, makanan, atau alat tulis.",
      "Menolong teman yang jatuh, sedih, atau kesulitan.",
      "Mengajak teman yang sendirian untuk bermain.",
      "Mengucapkan terima kasih dan maaf tanpa diingatkan.",
      "Membantu pekerjaan sederhana tanpa disuruh.",
    ],
  },
  {
    judul: "Tanda keamanan",
    ringkas: "Luka, rahasia dengan orang dewasa, takut",
    ikon: "peringatan",
    keamanan: true,
    butir: [
      "Ada luka atau memar yang penjelasannya tidak masuk akal atau berubah-ubah.",
      "Tiba-tiba takut ke sekolah atau menolak bertemu orang tertentu.",
      "Menerima hadiah, uang, atau pesan dari orang dewasa di luar keluarga dan diminta merahasiakannya.",
      "Menunjukkan pengetahuan atau perilaku seksual yang tidak sesuai usianya.",
      "Bercerita pernah disakiti, diancam, atau dipermalukan.",
      "Menyakiti diri sendiri atau berkata ingin menghilang.",
    ],
  },
];

/**
 * Peta per kelas. anak = jumlah anak, walas / ortu = formulir wali kelas / orang tua yang sudah
 * masuk, aspek = jumlah anak perlu dipantau atau didukung per aspek (urutan kolom tabel Hasil per
 * aspek), tindak = anak perlu tindak lanjut di kelas itu.
 */
export const KELAS = [
  { kelas: "TK A", wali: "Bu Nisa", anak: 20, walas: 20, ortu: 17, aspek: [2, 1, 3, 1, 1], tindak: 3 },
  { kelas: "TK B1", wali: "Bu Dian", anak: 22, walas: 22, ortu: 19, aspek: [2, 1, 3, 2, 1], tindak: 4 },
  { kelas: "TK B2", wali: "Bu Rahma", anak: 22, walas: 22, ortu: 18, aspek: [3, 2, 4, 2, 1], tindak: 5 },
  { kelas: "1A", wali: "Bu Wulan", anak: 28, walas: 28, ortu: 25, aspek: [2, 1, 2, 1, 1], tindak: 4 },
  { kelas: "1B", wali: "Pak Fajar", anak: 28, walas: 24, ortu: 21, aspek: [3, 2, 3, 2, 1], tindak: 6 },
  { kelas: "2A", wali: "Bu Intan", anak: 28, walas: 28, ortu: 24, aspek: [2, 1, 3, 2, 1], tindak: 5 },
  { kelas: "2B", wali: "Bu Rina", anak: 28, walas: 26, ortu: 23, aspek: [3, 1, 3, 4, 1], tindak: 7 },
  { kelas: "3A", wali: "Pak Yusuf", anak: 28, walas: 28, ortu: 22, aspek: [2, 2, 2, 2, 1], tindak: 6 },
  { kelas: "3B", wali: "Bu Maya", anak: 28, walas: 28, ortu: 25, aspek: [2, 1, 2, 3, 1], tindak: 6 },
  { kelas: "4A", wali: "Bu Fitri", anak: 28, walas: 22, ortu: 21, aspek: [2, 2, 2, 1, 1], tindak: 5 },
  { kelas: "4B", wali: "Pak Arif", anak: 28, walas: 28, ortu: 26, aspek: [1, 1, 2, 1, 1], tindak: 4 },
];

/** Nama wali per kelas, untuk pilihan koordinator rencana. */
export const WALI = Object.fromEntries(KELAS.map((k) => [k.kelas, k.wali]));

export const TAB_PETA = [
  { id: "prog", label: "Progres pengisian" },
  { id: "hasil", label: "Hasil per aspek" },
];

/** Tiga daftar anak di bagian "Anak yang Perlu Ditindaklanjuti". */
export const DAFTAR = [
  {
    id: "dukung",
    label: "Perlu dukungan (18)",
    kolom: "Aspek menonjol",
    pengantar:
      "Utamakan anak yang belum punya rencana. Rencana disusun Guru BK bersama wali kelas dan orang tua, lalu tampil di profil anak.",
  },
  {
    id: "pantau",
    label: "Perlu dipantau (37)",
    kolom: "Aspek menonjol",
    pengantar:
      "Wali kelas mencatat observasi tiap minggu selama 4 minggu. Bila tidak membaik, anak naik ke kelompok perlu dukungan.",
    kaki: "Menampilkan 8 dari 37 anak. Daftar lengkap ada di ruang tiap wali kelas.",
  },
  {
    id: "tanda",
    label: "Tanda bahaya (2)",
    kolom: "Tanda yang muncul",
    pengantar:
      "Jawaban Ya pada tanda keamanan langsung menjadi kasus. Detailnya hanya bisa dibuka tim penanganan di Kasus & SLA.",
    kaki: "2 anak, keduanya sudah menjadi kasus.",
  },
];

/**
 * Anak perlu dukungan. jenis: "kasus" (sudah jadi kasus, `kasus` = id di Kasus & SLA),
 * "rencana" (rencana dukungan berjalan), "belum" (belum ada rencana). `profil` = aksinya membuka
 * profil anak, bukan kasus. Delapan baris pertama tampil tanpa "Tampilkan semua".
 */
export const DUKUNGAN = [
  { nama: "Raka Pratama", kelas: "2B", aspek: "Pertemanan, Perasaan", sumber: "Orang tua dan wali kelas", jenis: "kasus", kasus: "KS-015", ket: "Tinggi", profil: true },
  { nama: "Alya Putri", kelas: "TK B2", aspek: "Perasaan, Perilaku", sumber: "Orang tua dan wali kelas", jenis: "kasus", kasus: "KS-009", ket: "dipantau" },
  { nama: "Dafa Ramadhan", kelas: "4B", aspek: "Perilaku", sumber: "Wali kelas", jenis: "kasus", kasus: "KS-010", ket: "Tinggi" },
  { nama: "Nadia Safitri", kelas: "4A", aspek: "Pertemanan, Perasaan", sumber: "Orang tua dan wali kelas", jenis: "kasus", kasus: "KS-014", ket: "Sedang" },
  { nama: "Bima Aditya", kelas: "1B", aspek: "Perasaan", sumber: "Orang tua", jenis: "kasus", kasus: "KS-012", ket: "Sedang" },
  { nama: "Salsa Nabila", kelas: "3B", aspek: "Pertemanan", sumber: "Orang tua dan wali kelas", jenis: "kasus", kasus: "KS-011", ket: "dipantau" },
  { nama: "Rizal Fahmi", kelas: "1B", aspek: "Fokus & energi", sumber: "Wali kelas", jenis: "belum" },
  { nama: "Citra Lestari", kelas: "3A", aspek: "Pertemanan", sumber: "Wali kelas", jenis: "belum" },
  { nama: "Galih Saputra", kelas: "3B", aspek: "Perilaku", sumber: "Wali kelas", jenis: "belum" },
  { nama: "Bayu Pamungkas", kelas: "4A", aspek: "Perilaku", sumber: "Orang tua", jenis: "belum" },
  { nama: "Aqila Zahra", kelas: "2B", aspek: "Perasaan", sumber: "Orang tua", jenis: "rencana", ket: "evaluasi 2 Des" },
  { nama: "Fikri Hidayat", kelas: "2B", aspek: "Fokus & energi", sumber: "Wali kelas", jenis: "rencana", ket: "evaluasi 4 Des" },
  { nama: "Zahra Aulia", kelas: "TK B2", aspek: "Pertemanan", sumber: "Orang tua dan wali kelas", jenis: "rencana", ket: "evaluasi 1 Des" },
  { nama: "Kevin Aditama", kelas: "TK A", aspek: "Perasaan", sumber: "Orang tua", jenis: "rencana", ket: "evaluasi 26 Nov" },
  { nama: "Hafiz Ramadhan", kelas: "TK B1", aspek: "Fokus & energi", sumber: "Orang tua dan wali kelas", jenis: "rencana", ket: "evaluasi 3 Des" },
  { nama: "Dimas Pradipta", kelas: "1A", aspek: "Perasaan", sumber: "Orang tua", jenis: "rencana", ket: "evaluasi 30 Nov" },
  { nama: "Yusuf Hakim", kelas: "2A", aspek: "Fokus & energi", sumber: "Wali kelas", jenis: "rencana", ket: "evaluasi 4 Des" },
  { nama: "Rafi Akbar", kelas: "3A", aspek: "Perasaan", sumber: "Orang tua dan wali kelas", jenis: "rencana", ket: "evaluasi 2 Des" },
];

/** Contoh anak perlu dipantau: minggu observasi dan catatan terakhir wali kelas. */
export const PANTAU = [
  { nama: "Keisha Ananda", kelas: "2B", aspek: "Perasaan", sumber: "Orang tua", minggu: "minggu 3 dari 4", catatan: "Mau bercerita saat pagi, masih menangis bila dijemput terlambat." },
  { nama: "Rizky Maulana", kelas: "2B", aspek: "Fokus & energi", sumber: "Wali kelas", minggu: "minggu 3 dari 4", catatan: "Lebih tenang setelah duduk di depan, tugas selesai 3 dari 5." },
  { nama: "Naura Salsabila", kelas: "2B", aspek: "Pertemanan", sumber: "Wali kelas", minggu: "minggu 3 dari 4", catatan: "Mulai ikut main lompat tali bersama 2 teman." },
  { nama: "Arka Wijaya", kelas: "2B", aspek: "Perilaku", sumber: "Orang tua dan wali kelas", minggu: "minggu 3 dari 4", catatan: "Satu kali mendorong teman saat antre, langsung minta maaf." },
  { nama: "Mutiara Sari", kelas: "1B", aspek: "Perasaan", sumber: "Orang tua", minggu: "minggu 2 dari 4", catatan: "Mengeluh sakit perut dua kali minggu ini." },
  { nama: "Daniel Santoso", kelas: "3A", aspek: "Fokus & energi", sumber: "Wali kelas", minggu: "minggu 3 dari 4", catatan: "Butuh pengingat tiap 10 menit untuk kembali ke tugas." },
  { nama: "Laila Fitriani", kelas: "4A", aspek: "Pertemanan", sumber: "Orang tua dan wali kelas", minggu: "minggu 1 dari 4", catatan: "Makan siang sendiri di kelas tiga hari berturut-turut." },
  { nama: "Ahmad Fauzan", kelas: "TK B1", aspek: "Fokus & energi", sumber: "Wali kelas", minggu: "minggu 3 dari 4", catatan: "Bisa mengikuti cerita sampai selesai dengan duduk di pangkuan guru." },
];

/** Anak dengan tanda bahaya; keduanya sudah menjadi kasus. */
export const TANDA = [
  { nama: "Bima Aditya", kelas: "1B", tanda: "Tiba-tiba takut ke sekolah dan menolak bertemu orang tertentu", sumber: "Orang tua", kasus: "KS-012", ket: "rencana tindak" },
  { nama: "Kevin Aditama", kelas: "TK A", tanda: "Bercerita diancam teman akan dipukul bila mengadu", sumber: "Orang tua", kasus: "KS-007", ket: "selesai" },
];

/**
 * Saran awal rencana dukungan menurut aspek pertama anak. langkah: [teks, penanggung jawab].
 * Aspek yang tidak ada di sini memakai saran Perasaan.
 */
export const SARAN = {
  Perasaan: {
    tujuan: "Anak merasa aman dan berani menyampaikan perasaannya.",
    langkah: [
      ["Obrolan hasil skrining dengan orang tua", "Wali kelas"],
      ["Sesi konseling BK seminggu sekali", "Guru BK"],
      ["Pojok tenang dan kartu perasaan di kelas", "Wali kelas"],
      ["Rutinitas pagi yang tenang di rumah", "Orang tua"],
    ],
  },
  Perilaku: {
    tujuan: "Anak mengenali rasa marah dan memakai cara aman untuk menyalurkannya.",
    langkah: [
      ["Kesepakatan aturan kelas dan pujian yang spesifik", "Wali kelas"],
      ["Sesi konseling BK: mengenali pemicu marah", "Guru BK"],
      ["Catatan perilaku harian selama 2 minggu", "Wali kelas"],
      ["Aturan rumah yang selaras dengan sekolah", "Orang tua"],
    ],
  },
  "Fokus & energi": {
    tujuan: "Anak menyelesaikan tugas singkat dengan pendampingan bertahap.",
    langkah: [
      ["Tugas dipecah menjadi langkah pendek", "Wali kelas"],
      ["Tempat duduk dekat guru, jauh dari jendela", "Wali kelas"],
      ["Jeda gerak 2 menit tiap 20 menit belajar", "Wali kelas"],
      ["Rujuk asesmen lanjutan bila 4 minggu belum membaik", "Guru BK"],
    ],
  },
  Pertemanan: {
    tujuan: "Anak punya teman bermain dan merasa diterima di kelas.",
    langkah: [
      ["Teman pendamping dan kerja kelompok kecil", "Wali kelas"],
      ["Pengawasan jam istirahat oleh guru piket", "Guru piket"],
      ["Sesi konseling BK: berani bilang tidak", "Guru BK"],
      ["Ajak bermain bersama teman sekelas di rumah", "Orang tua"],
    ],
  },
};

/** Tanggal evaluasi untuk pilihan "N minggu lagi" (dihitung dari hari demo, 11 Nov 2026). */
export const TANGGAL_EVALUASI = { 2: "25 Nov 2026", 4: "9 Des 2026", 6: "23 Des 2026" };

export const VERSI = [
  { id: "ot", label: "Versi orang tua" },
  { id: "wk", label: "Versi wali kelas" },
];

export const SUB_FORMULIR = {
  ot: "Versi orang tua · dibuka dari tautan WhatsApp · sekitar 8 menit · tentang anak di rumah selama sebulan terakhir",
  wk: "Versi wali kelas · diisi di aplikasi sekolah · sekitar 3 menit per anak · tentang anak di sekolah selama sebulan terakhir",
};
