/**
 * Data contoh layar Skrining HEART (sudut pandang Koordinator BK, seluruh sekolah: 288 anak TK A
 * sampai kelas 4). Angka sekolah per status dan per aspek dibaca dari bersama/heart.js
 * (RINGKAS_SEKOLAH); berkas ini memuat kelas, daftar anak yang perlu ditindaklanjuti, isi formulir,
 * dan usulan tindak lanjut. Semua nama, kelas, dan angka di sini contoh untuk demonstrasi, bukan
 * hasil skrining sungguhan.
 *
 * Kode HEART tiap anak = lima huruf status urut H E A R T (b Baik, p Perlu Perhatian, w Waspada),
 * sama dengan bentuk ANAK_2B di bersama/heart.js. Anak kelas 2B wajib sama persis dengan ANAK_2B
 * (diuji di skriningData.test.js).
 */
import { HEART } from "../bersama/heart.js";

const KODE_STATUS = { b: "baik", p: "perhatian", w: "waspada" };

/** Kode lima huruf jadi { idAspek: status }, bentuk yang dibaca HurufHeart. */
export function bacaHeart(kode) {
  return Object.fromEntries(HEART.map((a, i) => [a.id, KODE_STATUS[kode[i]]]));
}

/** Aspek yang tidak Baik, Waspada lebih dulu, lalu urutan HEART: [{ aspek, status }]. */
export function aspekMenonjol(kode) {
  const daftar = HEART.map((aspek, i) => ({ aspek, status: KODE_STATUS[kode[i]] }));
  return [
    ...daftar.filter((x) => x.status === "waspada"),
    ...daftar.filter((x) => x.status === "perhatian"),
  ];
}

/**
 * Kelas. anak = jumlah anak, walas / ortu = formulir wali kelas / orang tua yang sudah masuk. Anak
 * terpetakan kalau formulir wali kelasnya sudah masuk (276 dari 288).
 */
export const KELAS = [
  { kelas: "TK A", wali: "Bu Nisa", anak: 20, walas: 20, ortu: 17 },
  { kelas: "TK B1", wali: "Bu Dian", anak: 22, walas: 22, ortu: 19 },
  { kelas: "TK B2", wali: "Bu Rahma", anak: 22, walas: 22, ortu: 18 },
  { kelas: "1A", wali: "Bu Wulan", anak: 28, walas: 28, ortu: 25 },
  { kelas: "1B", wali: "Pak Fajar", anak: 28, walas: 24, ortu: 21 },
  { kelas: "2A", wali: "Bu Intan", anak: 28, walas: 28, ortu: 24 },
  { kelas: "2B", wali: "Bu Rina", anak: 28, walas: 26, ortu: 23 },
  { kelas: "3A", wali: "Pak Yusuf", anak: 28, walas: 28, ortu: 22 },
  { kelas: "3B", wali: "Bu Maya", anak: 28, walas: 28, ortu: 25 },
  { kelas: "4A", wali: "Bu Fitri", anak: 28, walas: 22, ortu: 21 },
  { kelas: "4B", wali: "Pak Arif", anak: 28, walas: 28, ortu: 26 },
];

/** Nama wali kelas per kelas. */
export const WALI = Object.fromEntries(KELAS.map((k) => [k.kelas, k.wali]));

/** Kelas sudut pandang "walas" di prototipe (Bu Rina). Hanya tindak lanjut kelas ini yang masuk loncengnya. */
export const KELAS_WALAS = "2B";

/**
 * 18 anak Waspada, urut tampil: yang belum punya tindak lanjut di atas. `tindak.jenis`:
 *   belum     belum ada tindak lanjut; Guru BK menyusunnya (laci Susun tindak lanjut)
 *   laporan   Raka: laporan lengkap dan checklist hidup dari konteks, plus kasus `kasus`
 *   berjalan  tindak lanjut berjalan, `evaluasi` = tanggal evaluasi, `buddy` = teman pendamping
 *   kasus     juga ditangani di alur kejadian: `kasus` = id di Kasus, `tingkat`, `oleh`
 * `calonBuddy` = usulan wali kelas untuk laci Susun tindak lanjut. Fikri sudah diberi buddy oleh
 * wali kelasnya (BUDDY_2B), tapi checklist tindak lanjutnya belum disusun.
 */
export const WASPADA = [
  { nama: "Fikri Hidayat", kelas: "2B", heart: "wbpbb", tindak: { jenis: "belum", buddy: "Elang Mahesa", sejak: "6 Nov" } },
  { nama: "Rizal Fahmi", kelas: "1B", heart: "wpbbb", tindak: { jenis: "belum" }, calonBuddy: ["Damar Prasetya", "Hilmi Azhar"] },
  { nama: "Citra Lestari", kelas: "3A", heart: "bpbwp", tindak: { jenis: "belum" }, calonBuddy: ["Anisa Rahmawati", "Della Puspita"] },
  { nama: "Galih Saputra", kelas: "3B", heart: "pbwbb", tindak: { jenis: "belum" }, calonBuddy: ["Akmal Syahputra", "Dzaky Pranata"] },
  { nama: "Bayu Pamungkas", kelas: "4A", heart: "bbwpp", tindak: { jenis: "belum" }, calonBuddy: ["Rasya Mahendra", "Kenan Wijanarko"] },
  { nama: "Raka Pratama", kelas: "2B", heart: "bpbwb", tindak: { jenis: "laporan", kasus: "KS-015" } },
  { nama: "Aqila Zahra", kelas: "2B", heart: "bwpbb", tindak: { jenis: "berjalan", evaluasi: "2 Des", buddy: "Hana Safira" } },
  { nama: "Zahra Aulia", kelas: "TK B2", heart: "bbbwp", tindak: { jenis: "berjalan", evaluasi: "1 Des", buddy: "Kanaya Pertiwi" } },
  { nama: "Kevin Aditama", kelas: "TK A", heart: "bwbpb", tindak: { jenis: "berjalan", evaluasi: "26 Nov", buddy: "Gavin Ardiansyah" } },
  { nama: "Hafiz Ramadhan", kelas: "TK B1", heart: "wbbbb", tindak: { jenis: "berjalan", evaluasi: "3 Des", buddy: "Umar Habibi" } },
  { nama: "Dimas Pradipta", kelas: "1A", heart: "bwbbp", tindak: { jenis: "berjalan", evaluasi: "30 Nov", buddy: "Satya Wirawan" } },
  { nama: "Yusuf Hakim", kelas: "2A", heart: "wbpbb", tindak: { jenis: "berjalan", evaluasi: "4 Des", buddy: "Farel Anggoro" } },
  { nama: "Rafi Akbar", kelas: "3A", heart: "bwbpb", tindak: { jenis: "berjalan", evaluasi: "2 Des", buddy: "Naufal Rizki" } },
  { nama: "Alya Putri", kelas: "TK B2", heart: "bwwbb", tindak: { jenis: "kasus", kasus: "KS-009", tingkat: "Tinggi", oleh: "Bu Laras" } },
  { nama: "Dafa Ramadhan", kelas: "4B", heart: "pbwbw", tindak: { jenis: "kasus", kasus: "KS-010", tingkat: "Tinggi", oleh: "Pak Arif" } },
  { nama: "Nadia Safitri", kelas: "4A", heart: "bpbwb", tindak: { jenis: "kasus", kasus: "KS-014", tingkat: "Sedang", oleh: "Bu Laras" } },
  { nama: "Bima Aditya", kelas: "1B", heart: "bwbpb", tindak: { jenis: "kasus", kasus: "KS-012", tingkat: "Sedang", oleh: "Bu Laras" } },
  { nama: "Salsa Nabila", kelas: "3B", heart: "bbbwb", tindak: { jenis: "kasus", kasus: "KS-011", tingkat: "Rendah", oleh: "Bu Maya" } },
];

/**
 * 37 anak Perlu Perhatian: wali kelas mengamati 4 minggu. `minggu` = minggu observasi ke berapa,
 * `catatan` = catatan terakhir wali kelas. Urut dari observasi yang paling dekat selesai.
 */
export const PERHATIAN = [
  { nama: "Nabila Rahma", kelas: "TK A", heart: "bpbbb", minggu: 3, catatan: "Menangis saat berpisah di gerbang, tenang sesudah 10 menit." },
  { nama: "Zidan Alfarizi", kelas: "TK A", heart: "pbbbb", minggu: 3, catatan: "Sering berdiri saat makan bersama, kembali duduk bila diingatkan." },
  { nama: "Ahmad Fauzan", kelas: "TK B1", heart: "pbbbb", minggu: 3, catatan: "Bisa mengikuti cerita sampai selesai bila duduk dekat guru." },
  { nama: "Rayyan Fadhil", kelas: "TK B1", heart: "pbpbb", minggu: 3, catatan: "Dua kali merebut mainan, mau mengembalikan sesudah diingatkan." },
  { nama: "Keanu Ardana", kelas: "TK B2", heart: "bbpbb", minggu: 3, catatan: "Mulai bilang \"aku kesal\" sebelum marah." },
  { nama: "Bintang Prakoso", kelas: "TK B2", heart: "pbbbp", minggu: 3, catatan: "Sulit menunggu giliran saat bermain balok." },
  { nama: "Tiara Sekar", kelas: "1A", heart: "bpbpb", minggu: 3, catatan: "Tidak lagi diejek cengeng, mulai bermain di kelompok kecil." },
  { nama: "Kayla Anjani", kelas: "1A", heart: "bbbpb", minggu: 3, catatan: "Duduk sendiri saat istirahat dua kali minggu ini." },
  { nama: "Reno Pradana", kelas: "1B", heart: "pbpbb", minggu: 3, catatan: "Sekali memukul meja saat kalah bermain, tenang sesudah jeda." },
  { nama: "Danish Firmansyah", kelas: "1B", heart: "bbbbp", minggu: 3, catatan: "Mau berbagi alat tulis bila diminta, belum menawarkan sendiri." },
  { nama: "Arjuna Wibisono", kelas: "2A", heart: "pbbbb", minggu: 3, catatan: "Bisa fokus 15 menit, lalu butuh jeda gerak." },
  { nama: "Mayla Rahmadani", kelas: "2A", heart: "bpbbb", minggu: 3, catatan: "Lebih ceria sejak duduk dekat sahabatnya." },
  { nama: "Sekar Ayuningtyas", kelas: "2A", heart: "bbbpb", minggu: 3, catatan: "Mulai diajak bermain bekel oleh teman sebangku." },
  { nama: "Keisha Ananda", kelas: "2B", heart: "bpbbb", minggu: 3, catatan: "Mau bercerita saat pagi, masih menangis bila dijemput terlambat." },
  { nama: "Rizky Maulana", kelas: "2B", heart: "pbbbb", minggu: 3, catatan: "Lebih tenang setelah duduk di depan, tugas selesai 3 dari 5." },
  { nama: "Naura Salsabila", kelas: "2B", heart: "bbbpb", minggu: 3, catatan: "Mulai ikut main lompat tali bersama 2 teman." },
  { nama: "Arka Wijaya", kelas: "2B", heart: "bbpbb", minggu: 3, catatan: "Sekali mendorong teman saat antre, langsung minta maaf." },
  { nama: "Daniel Santoso", kelas: "3A", heart: "pbbbb", minggu: 3, catatan: "Butuh pengingat tiap 10 menit untuk kembali ke tugas." },
  { nama: "Raisa Damayanti", kelas: "3A", heart: "bpbpb", minggu: 3, catatan: "Murung sesudah istirahat dua kali, bercerita tidak diajak bermain." },
  { nama: "Fadil Kurniawan", kelas: "3A", heart: "bbpbb", minggu: 3, catatan: "Tidak ada kejadian berebut minggu ini." },
  { nama: "Rangga Wiratama", kelas: "3B", heart: "pbpbb", minggu: 3, catatan: "Lebih tenang di kelas, masih berlari di koridor." },
  { nama: "Haikal Ramdani", kelas: "3B", heart: "bbbbp", minggu: 3, catatan: "Menolong teman membereskan buku saat diminta." },
  { nama: "Puspa Andini", kelas: "3B", heart: "bpbbb", minggu: 3, catatan: "Menangis saat ulangan, tenang sesudah diberi waktu tambahan." },
  { nama: "Bagus Setiawan", kelas: "4A", heart: "bbpbb", minggu: 3, catatan: "Mau menunggu giliran bicara saat diskusi kelompok." },
  { nama: "Iqbal Firdaus", kelas: "4B", heart: "pbbbb", minggu: 3, catatan: "Tugas lebih sering selesai dengan daftar centang di meja." },
  { nama: "Nadine Oktaviani", kelas: "4B", heart: "bpbpb", minggu: 3, catatan: "Bercerita sedih karena sahabatnya pindah kelas." },
  { nama: "Syifa Maulida", kelas: "TK B1", heart: "bpbpb", minggu: 2, catatan: "Lebih banyak menonton teman bermain, mau ikut bila diajak guru." },
  { nama: "Aisyah Nuraini", kelas: "TK B2", heart: "bpbbb", minggu: 2, catatan: "Takut ikut kegiatan baru, mau mencoba bila ditemani teman." },
  { nama: "Fathir Nugroho", kelas: "1A", heart: "pbbbb", minggu: 2, catatan: "Tugas selesai bila dipecah jadi dua bagian." },
  { nama: "Mutiara Sari", kelas: "1B", heart: "bpbbb", minggu: 2, catatan: "Mengeluh sakit perut dua kali minggu ini." },
  { nama: "Alesha Kamila", kelas: "1B", heart: "bbbpb", minggu: 2, catatan: "Bermain bersama satu teman yang sama setiap hari." },
  { nama: "Ghani Pratomo", kelas: "2A", heart: "bbpbp", minggu: 2, catatan: "Berkata kasar sekali minggu ini, sudah minta maaf." },
  { nama: "Cinta Amelia", kelas: "3B", heart: "bbbpb", minggu: 2, catatan: "Ikut kelompok piket, belum ikut bermain saat istirahat." },
  { nama: "Felicia Hartanti", kelas: "4A", heart: "bpbbb", minggu: 2, catatan: "Mengeluh pusing tiap Senin pagi." },
  { nama: "Theo Kusnadi", kelas: "4B", heart: "bbpbp", minggu: 2, catatan: "Sekali mengejek adik kelas, sudah dibicarakan bersama." },
  { nama: "Nindya Paramitha", kelas: "3A", heart: "bpbbb", minggu: 1, catatan: "Sering bertanya apakah jawabannya sudah benar." },
  { nama: "Laila Fitriani", kelas: "4A", heart: "bbbpb", minggu: 1, catatan: "Makan siang sendiri di kelas tiga hari berturut-turut." },
];

/**
 * Anak dengan jawaban Ya pada pertanyaan keamanan (di luar HEART). Keduanya juga punya hasil HEART
 * (ada di daftar Waspada). `butir` = indeks di PERTANYAAN_KEAMANAN.
 */
export const TANDA_BAHAYA = [
  { nama: "Bima Aditya", kelas: "1B", butir: 1, sumber: "Orang tua", kasus: "KS-012", tingkat: "Sedang", oleh: "Bu Laras" },
  { nama: "Kevin Aditama", kelas: "TK A", butir: 4, sumber: "Orang tua", kasus: "KS-007", selesai: "ditutup 5 Nov" },
];

/** Kode HEART semua anak di daftar, menurut nama. */
export const HEART_ANAK = Object.fromEntries([...WASPADA, ...PERHATIAN].map((a) => [a.nama, a.heart]));

// ── Formulir ────────────────────────────────────────────────────────────────────────────────────

export const VERSI = [
  { id: "ot", label: "Versi orang tua" },
  { id: "wk", label: "Versi wali kelas" },
];

export const SUB_FORMULIR = {
  ot: "Versi orang tua · dibuka dari tautan WhatsApp · sekitar 8 menit · tentang anak di rumah sebulan terakhir",
  wk: "Versi wali kelas · diisi di aplikasi sekolah · sekitar 3 menit per anak · tentang anak di sekolah sebulan terakhir",
};

export const JAWABAN_HEART = ["Tidak pernah", "Kadang-kadang", "Sering"];
export const JAWABAN_KEAMANAN = ["Ya", "Tidak", "Tidak yakin"];

/**
 * Lima pernyataan per aspek HEART, urut sama dengan HEART[].indikator (butir ke-i menilai indikator
 * ke-i). Untuk anak 4-10 tahun, perilaku yang bisa diamati orang tua maupun wali kelas. Butir
 * Tolong Menolong berbunyi positif dan skornya dibalik saat diolah.
 */
export const BUTIR_HEART = {
  hiperaktivitas: [
    "Sulit diam, terus berlari atau memanjat saat seharusnya duduk.",
    "Tangan atau kakinya terus bergerak, atau menggeliat di kursi.",
    "Perhatiannya mudah teralih oleh suara atau benda di sekitarnya.",
    "Bertindak tanpa berpikir dulu, misalnya menyeberang tanpa melihat.",
    "Sulit menyimak sampai penjelasan atau kegiatan selesai.",
  ],
  emosional: [
    "Mengeluh sakit perut, pusing, atau tidak enak badan, terutama menjelang sekolah.",
    "Tampak khawatir tentang banyak hal.",
    "Tampak murung, sedih, atau mudah menangis.",
    "Gugup di situasi baru dan cepat kehilangan rasa percaya diri.",
    "Mudah takut pada banyak hal.",
  ],
  agresi: [
    "Marah meledak, berteriak, atau membanting barang saat kecewa.",
    "Menolak mengikuti arahan orang tua atau guru.",
    "Memaksakan keinginannya kepada teman, misalnya merebut atau mendorong.",
    "Berbohong atau berbuat curang saat bermain.",
    "Mengambil barang milik orang lain tanpa izin.",
  ],
  relasi: [
    "Lebih sering bermain sendiri daripada bersama teman.",
    "Bercerita tidak punya teman dekat untuk bermain.",
    "Tidak diajak bermain oleh teman sebaya.",
    "Diejek, didorong, atau diganggu teman.",
    "Lebih nyaman bersama orang dewasa daripada teman seusianya.",
  ],
  tolong: [
    "Memperhatikan perasaan orang lain, misalnya bertanya saat teman sedih.",
    "Mau berbagi mainan, bekal, atau alat tulis.",
    "Menolong teman yang jatuh, sakit, atau kesulitan.",
    "Bersikap baik kepada anak yang lebih kecil.",
    "Menawarkan bantuan tanpa diminta.",
  ],
};

/**
 * Isian pendukung (tidak diskor): mengisi faktor pendukung dan peta dukungan di laporan anak
 * (orang dewasa yang dipercaya, teman, tempat aman, titik rawan).
 */
export const PENDUKUNG = {
  ot: {
    judul: "Kebiasaan dan dukungan di rumah",
    butir: [
      "Orang dewasa yang paling dipercaya anak saat ini",
      "Tempat yang paling membuat anak merasa nyaman dan aman",
      "Respons anak saat gagal atau dimarahi",
      "Lama bermain gawai untuk hiburan per hari",
      "Kegiatan yang paling ia sukai",
    ],
  },
  wk: {
    judul: "Dukungan di sekolah",
    butir: [
      "Teman yang paling sering bersamanya",
      "Orang dewasa di sekolah tempat ia bercerita",
      "Tempat di sekolah yang membuatnya tenang",
      "Tempat atau waktu ia tampak tidak nyaman",
    ],
  },
};

/** Pertanyaan keamanan, di luar HEART. Jawaban Ya langsung menjadi laporan kejadian. */
export const PERTANYAAN_KEAMANAN = [
  "Ada luka atau memar yang penjelasannya tidak masuk akal atau berubah-ubah.",
  "Tiba-tiba takut ke sekolah atau menolak bertemu orang tertentu.",
  "Menerima hadiah, uang, atau pesan dari orang dewasa di luar keluarga dan diminta merahasiakannya.",
  "Menunjukkan pengetahuan atau perilaku seksual yang tidak sesuai usianya.",
  "Bercerita pernah disakiti, diancam, atau dipermalukan.",
  "Menyakiti diri sendiri atau berkata ingin menghilang.",
];

// ── Tindak lanjut ───────────────────────────────────────────────────────────────────────────────

/**
 * Usulan butir checklist per aspek HEART. `oleh` = kunci PEMILIK (bersama/tindakLanjut.js). Laci
 * Susun tindak lanjut mengambil 4 butir pertama untuk aspek Waspada dan 2 butir pertama untuk aspek
 * Perlu Perhatian, jadi butir paling penting ditaruh di depan.
 */
export const USULAN = {
  hiperaktivitas: [
    { teks: "Pecah tugas jadi langkah pendek, beri tanda tiap langkah selesai", oleh: "walas" },
    { teks: "Duduk dekat guru, jauh dari pintu dan jendela", oleh: "walas" },
    { teks: "Sesi BK: latihan berhenti, berpikir, lalu bertindak", oleh: "bk" },
    { teks: "Jam tidur dan batas gawai yang sama setiap hari", oleh: "ortu" },
    { teks: "Jeda gerak 2 menit tiap 20 menit belajar", oleh: "walas" },
  ],
  emosional: [
    { teks: "Obrolan hasil skrining dengan orang tua", oleh: "walas" },
    { teks: "Sesi BK mingguan: mengenali dan menamai perasaan", oleh: "bk" },
    { teks: "Pojok tenang dan kartu perasaan di kelas", oleh: "walas" },
    { teks: "Tanyakan perasaannya sepulang sekolah", oleh: "ortu" },
    { teks: "Catat keluhan sakit badan: hari, jam, pemicunya", oleh: "ortu" },
  ],
  agresi: [
    { teks: "Kesepakatan aturan kelas dan pujian untuk sikap yang diharapkan", oleh: "walas" },
    { teks: "Sesi BK: mengenali pemicu marah dan cara aman menyalurkannya", oleh: "bk" },
    { teks: "Awasi jam istirahat, pisahkan bila mulai berebut", oleh: "piket" },
    { teks: "Aturan rumah yang selaras dengan aturan kelas", oleh: "ortu" },
  ],
  relasi: [
    { teks: "Kerja kelompok kecil bersama teman yang sudah dekat", oleh: "walas" },
    { teks: "Awasi tempat bermain saat istirahat", oleh: "piket" },
    { teks: "Sesi BK: berani bilang tidak dan mencari bantuan", oleh: "bk" },
    { teks: "Undang 1 atau 2 teman sekelas bermain di rumah", oleh: "ortu" },
  ],
  tolong: [
    { teks: "Tugas piket berpasangan supaya ada alasan bekerja sama", oleh: "walas" },
    { teks: "Puji secara spesifik saat ia berbagi atau menolong", oleh: "walas" },
    { teks: "Ajak membantu pekerjaan kecil di rumah", oleh: "ortu" },
    { teks: "Sesi BK: membaca perasaan teman lewat gambar wajah", oleh: "bk" },
  ],
};

/** Usulan butir untuk satu anak: 4 butir per aspek Waspada, 2 butir per aspek Perlu Perhatian. */
export function usulanAnak(kode) {
  return aspekMenonjol(kode).flatMap(({ aspek, status }) =>
    USULAN[aspek.id]
      .slice(0, status === "waspada" ? 4 : 2)
      .map((u, i) => ({ ...u, id: `${aspek.id}-${i}`, aspek: aspek.id })),
  );
}

/** Tanggal evaluasi untuk pilihan "N minggu lagi" (dihitung dari hari demo, Rabu 11 Nov 2026). */
export const EVALUASI = [
  { id: "2", label: "2 minggu lagi", tanggal: "25 Nov" },
  { id: "4", label: "4 minggu lagi", tanggal: "9 Des" },
  { id: "6", label: "6 minggu lagi", tanggal: "23 Des" },
];
