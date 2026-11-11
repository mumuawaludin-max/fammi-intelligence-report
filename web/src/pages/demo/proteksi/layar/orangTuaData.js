/**
 * Data contoh aplikasi ponsel orang tua (Ibu Dewi) dan mode cerita anak di prototipe Sekolah
 * Proteksi. Teksnya disalin apa adanya dari kanvas desain pemilik produk (2026-11-11). Semua nama,
 * kelas, jam, dan kode lacak adalah contoh untuk demonstrasi.
 */

/** Jalur ikon yang tidak ada di ikonData.js (viewBox 0 0 24 24). */
export const IC = {
  rumah: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  daftar: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
  tangan: "M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z",
  obrolan: "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z",
  sendiri: "M8.65 5.82C9.36 4.72 10.6 4 12 4c2.21 0 4 1.79 4 4 0 1.4-.72 2.64-1.82 3.35L8.65 5.82zM20 17.17c-.02-1.1-.63-2.11-1.61-2.62-.54-.28-1.13-.54-1.77-.76L20 17.17zm1.19 4.02L2.81 2.81 1.39 4.22l8.89 8.89c-1.81.23-3.39.79-4.67 1.45C4.61 15.07 4 16.1 4 17.22V20h13.17l2.61 2.61 1.41-1.42z",
  sedih: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 3c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z",
  lainnya: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  jempol: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
  keluarga: "M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7h-.08c-.65 0-1.22.42-1.42 1.03L15.5 12.5 13.43 14l.07.1L16 18v4h4zm-7.5-10.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6h1.5v7h4zm6.5 0v-4h1v-4c0-.82-.67-1.5-1.5-1.5h-2c-.83 0-1.5.68-1.5 1.5v4h1v4h3z",
};

/* ---------- skrining Nara (31 pernyataan) ---------- */
export const JUMLAH_SOAL = 31;
/** Indeks soal pertama bagian Tanda keamanan (soal 26 sampai 31). */
export const SOAL_KEAMANAN_AWAL = 25;

export const SOAL = [
  "Mengeluh sakit perut, pusing, atau tidak enak badan menjelang berangkat sekolah.",
  "Terlihat murung atau menangis karena hal kecil.",
  "Sulit tidur atau sering terbangun karena mimpi buruk.",
  "Gelisah ketika berpisah dengan orang tua atau pengasuh.",
  "Menyampaikan rasa takut yang sulit diredakan.",
  "Meledak marah, berteriak, atau membanting barang saat keinginannya tidak dituruti.",
  "Sengaja menyakiti teman atau saudara, misalnya memukul atau mendorong.",
  "Menolak mengikuti aturan sederhana di rumah.",
  "Mengambil barang milik orang lain tanpa izin.",
  "Berkata kasar atau mengejek orang lain.",
  "Sulit duduk tenang saat makan atau mendengarkan cerita.",
  "Perhatiannya mudah teralih sebelum tugas sederhana selesai.",
  "Bertindak tanpa melihat bahaya, misalnya berlari ke jalan.",
  "Sulit menunggu giliran atau sering memotong pembicaraan.",
  "Kesulitan mengikuti instruksi dua sampai tiga langkah.",
  "Lebih sering bermain sendiri daripada bersama teman sebaya.",
  "Bercerita tidak diajak bermain atau dijauhi teman.",
  "Lebih nyaman bersama orang dewasa daripada teman sebaya.",
  "Menjadi sasaran ejekan, dorongan, atau ancaman teman.",
  "Kesulitan bergabung ke permainan kelompok.",
  "Mau berbagi mainan atau makanan.",
  "Menolong orang yang jatuh, sedih, atau kesulitan.",
  "Mengajak anak yang sendirian untuk bermain.",
  "Mengucapkan terima kasih dan maaf tanpa diingatkan.",
  "Membantu pekerjaan rumah sederhana tanpa disuruh.",
  "Ada luka atau memar yang penjelasannya tidak masuk akal atau berubah-ubah.",
  "Tiba-tiba takut ke sekolah atau menolak bertemu orang tertentu.",
  "Menerima hadiah, uang, atau pesan dari orang dewasa di luar keluarga dan diminta merahasiakannya.",
  "Menunjukkan pengetahuan atau perilaku seksual yang tidak sesuai usianya.",
  "Bercerita pernah disakiti, diancam, atau dipermalukan.",
  "Menyakiti diri sendiri atau berkata ingin menghilang.",
];

/** Lima soal per aspek, kecuali Tanda keamanan yang enam soal. */
export const ASPEK = ["Perasaan", "Perilaku", "Fokus & energi", "Pertemanan", "Kepedulian", "Tanda keamanan"];
export const PILIHAN_UMUM = ["Tidak pernah", "Kadang-kadang", "Sering"];
/** Pilihan bagian Tanda keamanan. Indeks 2 (Ya) diberi warna merah dan memicu pemberitahuan. */
export const PILIHAN_KEAMANAN = ["Tidak", "Tidak yakin", "Ya"];

export const LANJUTAN_SKRINING = [
  "Jawaban Anda digabung dengan catatan Bu Dian, wali kelas Nara.",
  "Guru BK membaca hasilnya paling lambat 3 hari sekolah.",
  "Ringkasan untuk orang tua muncul di aplikasi ini, dimulai dari kekuatan Nara.",
];

/* ---------- ringkasan skrining Raka ---------- */
export const DILAKUKAN_SEKOLAH = [
  "Teman pendamping dan kerja kelompok kecil di kelas, sejak 9 Nov.",
  "Ngobrol dengan Bu Laras seminggu sekali, mulai Kamis 12 Nov.",
  'Kelas kesadaran "Teman Baik Tidak Merundung", Kamis 19 Nov.',
];
export const DI_RUMAH = [
  'Tanyakan "hari ini main sama siapa?", bukan "kamu dinakali tidak?".',
  "Ajak satu teman sekelas bermain di rumah akhir pekan ini.",
  "Saat sakit perut pagi, akui dulu rasa tidak enaknya, lalu tetap berangkat bila tidak demam.",
];

/* ---------- Lapor Aman ---------- */
/** `tingkat` menentukan janji respon sekolah, kecuali anak dalam bahaya (selalu Darurat). */
export const JENIS_KEJADIAN = [
  { label: "Disakiti secara fisik", d: IC.tangan, tingkat: "Tinggi" },
  { label: "Diejek atau dihina", d: IC.obrolan, tingkat: "Sedang" },
  { label: "Dijauhi atau dikucilkan", d: IC.sendiri, tingkat: "Sedang" },
  { label: "Orang dewasa bersikap tidak wajar", nama: "peringatan", tingkat: "Darurat" },
  { label: "Anak tampak sangat tertekan", d: IC.sedih, tingkat: "Tinggi" },
  { label: "Lainnya", d: IC.lainnya, tingkat: "Sedang" },
];
/** Indeks 2 (Ya) berarti anak dalam bahaya sekarang. */
export const PILIHAN_BAHAYA = ["Tidak", "Tidak yakin", "Ya"];
export const PILIHAN_ANAK = ["Raka", "Nara", "Anak lain"];
export const PILIHAN_KAPAN = ["Hari ini", "Kemarin", "Minggu ini", "Lebih lama"];
export const PILIHAN_TEMPAT = ["Kelas", "Kantin", "Halaman", "Toilet", "Antar-jemput", "Pesan atau daring", "Luar sekolah"];
export const NAMA_LANGKAH = ["Apa yang terjadi", "Cerita singkat", "Identitas dan kirim"];
export const JANJI_RESPON = {
  Darurat: "paling lambat 1 jam, Kepala Sekolah langsung menerima laporan ini",
  Tinggi: "paling lambat 4 jam di hari sekolah",
  Sedang: "paling lambat 1 hari sekolah",
  Rendah: "paling lambat 2 hari sekolah",
};
/** Laporan pertama memakai kode pertama, laporan berikutnya kode kedua (seperti desain). */
export const KODE_LACAK = ["LA-8M2T", "LA-3KQ7", "LA-5RW9"];
export const JAM_LAPORAN_BARU = "10.36";

/** Isian formulir saat Lapor Aman dibuka; dibuka ulang selalu mulai dari sini. */
export const ISIAN_AWAL = {
  jenis: "",
  bahaya: 0,
  anak: "Raka",
  kapan: "Hari ini",
  tempat: "Kantin",
  cerita: "",
  tanpaNama: false,
};

/* ---------- laporan saya ---------- */
/** Tahap laporan KS-015. status: done (selesai), now (sedang berjalan), next (belum). */
export const LANGKAH_KS015 = [
  { status: "done", judul: "Diterima", ket: "08.12" },
  { status: "done", judul: "Dinilai: tingkat Tinggi", ket: "08.40 · kekerasan fisik yang berulang" },
  { status: "done", judul: "Diteruskan ke wali kelas dan Guru BK", ket: "08.41 · Kepala Sekolah ikut diberi tahu" },
  {
    status: "now",
    judul: "Ditangani",
    ket: "Sekolah menemui Raka paling lambat 12.12 hari ini, lalu menyusun langkah penanganan paling lambat Jumat.",
  },
  { status: "next", judul: "Dipantau 2 sampai 4 minggu" },
  { status: "next", judul: "Selesai" },
];

export const PESAN_AWAL = [
  {
    saya: false,
    dari: "Bu Laras, Guru BK · 08.45",
    teks: "Terima kasih sudah melapor, Bu Dewi. Bu Rina akan menemui Raka sebelum istirahat kedua, dan kami kabari hasilnya hari ini.",
  },
];
export const PENGIRIM_BALASAN = "Anda · 10.38";

/* ---------- mode cerita anak ---------- */
/** Wajah perasaan: warna wajah dan jalur mulut (mata dan mulut ungu tua). */
export const WAJAH = [
  { label: "Senang", isi: "#FFD66B", mulut: "M8 14 Q12 18 16 14" },
  { label: "Biasa saja", isi: "#FFE7A8", mulut: "M8.5 15 L15.5 15" },
  { label: "Sedih", isi: "#A9C9F7", mulut: "M8 16.5 Q12 12.5 16 16.5" },
  { label: "Takut", isi: "#D5C6FA", mulut: "M10 16 Q12 14 14 16 Q12 18 10 16" },
  { label: "Marah", isi: "#FFB199", mulut: "M8 16.5 Q12 13 16 16.5 M7.5 7.5 L10.5 8.8 M16.5 7.5 L13.5 8.8" },
];

/** `nada` = warna ubin ikon: r merah, a kuning, p ungu, g hijau. */
export const GAMBAR_KEJADIAN = [
  { label: "Ada yang memukul atau mendorongku", d: IC.tangan, nada: "r" },
  { label: "Ada yang mengejekku", d: IC.obrolan, nada: "a" },
  { label: "Aku tidak diajak main", d: IC.sendiri, nada: "a" },
  { label: "Ada orang dewasa yang membuatku tidak nyaman", nama: "peringatan", nada: "r" },
  { label: "Aku sedih terus", d: IC.sedih, nada: "p" },
  { label: "Tidak ada, aku baik-baik saja", d: IC.jempol, nada: "g" },
];
/** Pilihan yang menutup mode anak tanpa membuat laporan. */
export const KEJADIAN_BAIK = "Tidak ada, aku baik-baik saja";

/** `sapaan` dipakai di layar terima kasih dan di pemberitahuan sesudahnya. */
export const ORANG_DIPERCAYA = [
  { label: "Ayah atau Ibu", d: IC.keluarga, nada: "g", sapaan: "Ayah atau Ibu" },
  { label: "Bu Guru di kelasku", nama: "orang", nada: "p", sapaan: "Bu Guru" },
  { label: "Bu Laras, guru BK", nama: "hati", nada: "a", sapaan: "Bu Laras" },
];
export const ORANG_TUA_SENDIRI = "Ayah atau Ibu";

/* ---------- navigasi ponsel ---------- */
export const TAB = [
  { id: "beranda", label: "Beranda", d: IC.rumah },
  { id: "skrining", label: "Skrining", nama: "skrining" },
  { id: "lapor", label: "Lapor", nama: "perisaiCentang" },
  { id: "lacak", label: "Laporan", d: IC.daftar },
];

/** Judul bilah atas tiap layar ponsel. Beranda tidak punya bilah. */
export const JUDUL_BILAH = {
  pengantar: "Skrining Nara",
  pertanyaan: "Skrining Nara",
  terkirim: "Skrining Nara",
  hasil: "Ringkasan skrining Raka",
  lapor: "Lapor Aman",
  diterima: "Lapor Aman",
  lacak: "Laporan saya",
  anak1: "Aku mau cerita",
  anak2: "Aku mau cerita",
  anak3: "Aku mau cerita",
  anak4: "Aku mau cerita",
};
