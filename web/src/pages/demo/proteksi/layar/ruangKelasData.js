/**
 * Data contoh layar Ruang wali kelas (Kelas 2B, Bu Rina). Disalin apa adanya dari kanvas desain
 * pemilik produk 2026-11-11 (artboard "3 · Ruang wali kelas"). Semua nama dan angka fiktif.
 */

/** 31 pernyataan skrining versi wali kelas. Indeks 25 sampai 30 adalah tanda keamanan. */
export const BUTIR_SKRINING = [
  "Mengeluh sakit perut, pusing, atau tidak enak badan selama di sekolah.",
  "Terlihat murung atau menangis karena hal kecil.",
  "Tampak lelah atau mengantuk di kelas seperti kurang tidur.",
  "Gelisah ketika berpisah dengan orang tua saat diantar.",
  "Menyampaikan rasa takut yang sulit diredakan.",
  "Meledak marah, berteriak, atau membanting barang saat keinginannya tidak dituruti.",
  "Sengaja menyakiti teman, misalnya memukul atau mendorong.",
  "Menolak mengikuti aturan kelas yang sederhana.",
  "Mengambil barang milik teman tanpa izin.",
  "Berkata kasar atau mengejek teman.",
  "Sulit duduk tenang saat belajar atau mendengarkan cerita.",
  "Perhatiannya mudah teralih sebelum tugas sederhana selesai.",
  "Bertindak tanpa melihat bahaya, misalnya memanjat tinggi atau berlari di tangga.",
  "Sulit menunggu giliran atau sering memotong pembicaraan.",
  "Kesulitan mengikuti instruksi dua sampai tiga langkah.",
  "Lebih sering bermain sendiri daripada bersama teman.",
  "Tidak diajak bermain atau dijauhi teman.",
  "Lebih nyaman bersama guru daripada teman sebaya.",
  "Menjadi sasaran ejekan, dorongan, atau ancaman teman.",
  "Kesulitan bergabung ke permainan kelompok.",
  "Mau berbagi mainan, makanan, atau alat tulis.",
  "Menolong teman yang jatuh, sedih, atau kesulitan.",
  "Mengajak teman yang sendirian untuk bermain.",
  "Mengucapkan terima kasih dan maaf tanpa diingatkan.",
  "Membantu pekerjaan kelas tanpa disuruh.",
  "Ada luka atau memar yang penjelasannya tidak masuk akal atau berubah-ubah.",
  "Tiba-tiba takut ke sekolah atau menolak bertemu orang tertentu.",
  "Menerima hadiah, uang, atau pesan dari orang dewasa di luar keluarga dan diminta merahasiakannya.",
  "Menunjukkan pengetahuan atau perilaku seksual yang tidak sesuai usianya.",
  "Bercerita pernah disakiti, diancam, atau dipermalukan.",
  "Menyakiti diri sendiri atau berkata ingin menghilang.",
];

export const JUMLAH_BUTIR = BUTIR_SKRINING.length;

/** Butir pertama kelompok tanda keamanan (jawabannya Tidak / Tidak yakin / Ya). */
export const AWAL_TANDA_KEAMANAN = 25;

/** Judul kelompok, tampil di atas butir dengan indeks ini. */
export const KEPALA_BUTIR = {
  0: "Perasaan",
  5: "Perilaku",
  10: "Fokus & energi",
  15: "Pertemanan",
  20: "Kepedulian (kekuatan)",
  25: "Tanda keamanan",
};

export const SKALA = ["Tidak pernah", "Kadang", "Sering"];
export const SKALA_AMAN = ["Tidak", "Tidak yakin", "Ya"];

/** Anak yang formulir wali kelasnya belum diisi, urut seperti di desain. */
export const ANAK_BELUM_DIISI = ["Bagas Prasetyo", "Putri Ayu"];

/** Kategori hasil skrining: label dan kelas pil. Kunci juga dipakai sebagai kelas avatar (.kav). */
export const KATEGORI = {
  dukung: { label: "Perlu dukungan", pil: "pill sm bad" },
  pantau: { label: "Perlu dipantau", pil: "pill sm warn" },
  belum: { label: "Belum terpetakan", pil: "pill sm gray" },
  sesuai: { label: "Sesuai tahap", pil: "pill sm ok" },
};

/** Urutan pil sebaran di kartu Skrining Kelas 2B. */
export const URUT_SEBARAN = ["dukung", "pantau", "sesuai", "belum"];

/**
 * Hasil sementara satu formulir (aturan contoh dari desain, hanya untuk demo). Jawaban 0/1/2.
 * Empat kelompok kesulitan (butir 1-20) dijumlah per lima butir: 6 ke atas "dukung", 4 ke atas
 * "pantau". Kelompok Kepedulian dibalik: makin jarang muncul, makin berat.
 */
export function hasilSementara(m) {
  let terberat = "sesuai";
  for (let g = 0; g < 4; g += 1) {
    let jumlah = 0;
    for (let k = 0; k < 5; k += 1) jumlah += m[g * 5 + k] || 0;
    if (jumlah >= 6) terberat = "dukung";
    else if (jumlah >= 4 && terberat !== "dukung") terberat = "pantau";
  }
  let kurangPeduli = 0;
  for (let k = 20; k < 25; k += 1) kurangPeduli += 2 - (m[k] == null ? 2 : m[k]);
  if (kurangPeduli >= 6) terberat = "dukung";
  else if (kurangPeduli >= 4 && terberat === "sesuai") terberat = "pantau";
  return terberat;
}

/** Benar kalau ada jawaban "Ya" di kelompok tanda keamanan. */
export function adaTandaKeamanan(m) {
  for (let i = AWAL_TANDA_KEAMANAN; i < JUMLAH_BUTIR; i += 1) {
    if (m[i] === 2) return true;
  }
  return false;
}

// [nama, kategori, orang tua sudah mengisi, yang menonjol, tindak lanjut, usia]
const BARIS_KHUSUS = [
  ["Raka Pratama", "dukung", true, "Pertemanan dan perasaan perlu dukungan. Kekuatan: kepedulian.", "Rencana dukungan berjalan (Bu Laras), evaluasi 3 Des. Terhubung kasus KS-015.", "7 tahun"],
  ["Aqila Zahra", "dukung", true, "Perasaan perlu dukungan: sering mengeluh sakit perut pagi hari.", "Rencana dukungan berjalan, evaluasi 2 Des.", "7 tahun"],
  ["Fikri Hidayat", "dukung", true, "Fokus & energi perlu dukungan.", "Rencana dukungan berjalan, evaluasi 4 Des.", "8 tahun"],
  ["Keisha Ananda", "pantau", true, "Perasaan perlu dipantau.", "Observasi minggu 3 dari 4.", "7 tahun"],
  ["Rizky Maulana", "pantau", true, "Fokus & energi perlu dipantau.", "Observasi minggu 3 dari 4.", "7 tahun"],
  ["Naura Salsabila", "pantau", true, "Pertemanan perlu dipantau.", "Observasi minggu 3 dari 4.", "8 tahun"],
  ["Arka Wijaya", "pantau", true, "Perilaku perlu dipantau.", "Observasi minggu 3 dari 4.", "7 tahun"],
  ["Bagas Prasetyo", "belum", false, "Belum ada data.", "Formulir wali kelas dan orang tua belum diisi.", "7 tahun"],
  ["Putri Ayu", "belum", false, "Belum ada data.", "Formulir wali kelas dan orang tua belum diisi.", "7 tahun"],
];

const SESUAI_TAHAP = [
  "Adinda Maharani", "Alif Ramadhan", "Bilqis Aulia", "Cahya Kirana", "Elang Mahesa", "Farah Nabila",
  "Gibran Akbar", "Hana Safira", "Ilham Nugraha", "Jihan Aprilia", "Kenzo Hartono", "Lala Anindya",
  "Mikha Yohana", "Nayla Putri", "Omar Faruq", "Rafa Aditya", "Shafa Azzahra", "Tegar Wicaksono",
  "Vania Larasati",
];

/** Orang tuanya belum mengisi formulir. */
const ORTU_BELUM = new Set(["Kenzo Hartono", "Omar Faruq", "Vania Larasati"]);

/** 28 anak kelas 2B, urutan sama dengan peta kelas dan pilihan anak di formulir observasi. */
export const ANAK_2B = [
  ...BARIS_KHUSUS,
  ...SESUAI_TAHAP.map((nama) => [nama, "sesuai", !ORTU_BELUM.has(nama), "Semua aspek sesuai tahap.", "Ikut kelas kesadaran bersama kelas.", "7 tahun"]),
].map(([nama, kat, ortu, menonjol, tindak, usia]) => ({ nama, kat, ortu, menonjol, tindak, usia }));

/** Catatan observasi yang sudah ada, terbaru di atas. */
export const CATATAN_AWAL = [
  { id: "awal-1", anak: "Raka Pratama", tgl: "Selasa, 10 Nov", teks: "Bermain dengan Alif dan Gibran saat istirahat, terlihat lebih ceria.", tanda: "Membaik" },
  { id: "awal-2", anak: "Keisha Ananda", tgl: "Senin, 9 Nov", teks: "Menangis saat dijemput terlambat, tenang setelah diajak menggambar.", tanda: "Menangis" },
  { id: "awal-3", anak: "Arka Wijaya", tgl: "Jumat, 6 Nov", teks: "Mendorong teman saat antre, langsung minta maaf setelah diingatkan.", tanda: "Konflik dengan teman" },
  { id: "awal-4", anak: "Raka Pratama", tgl: "Jumat, 6 Nov", teks: "Menyendiri di pojok kelas saat istirahat, menolak ke kantin.", tanda: "Menyendiri · dibahas dengan Guru BK" },
];

/**
 * Empat sesi kelas kesadaran. tahap: done (selesai), next (berikutnya), plan (terjadwal).
 * Sesi 3 berganti ke `waktuSelesai` sesudah ditandai selesai.
 */
export const SESI_KESADARAN = [
  { judul: "Kenali Perasaanku", isi: "Menamai rasa senang, sedih, takut, dan marah lewat kartu wajah.", waktu: "Selesai · 22 Okt", tahap: "done" },
  { judul: "Tubuhku Milikku", isi: "Bagian tubuh pribadi, sentuhan aman dan tidak aman, boleh bilang tidak.", waktu: "Selesai · 29 Okt", tahap: "done" },
  {
    judul: "Rahasia Aman dan Rahasia Tidak Aman",
    isi: "Rahasia yang membuat takut atau sedih harus diceritakan ke orang dewasa tepercaya.",
    waktu: "Kamis, 12 Nov · 07.30",
    waktuSelesai: "Selesai · 11 Nov",
    tahap: "next",
  },
  { judul: "Teman Baik Tidak Merundung", isi: "Mengenali ejekan dan dorongan, membela teman, tahu ke mana melapor.", waktu: "Kamis, 19 Nov · 07.30", tahap: "plan" },
];

/** Warna pil waktu per tahap sesi. */
export const PIL_TAHAP = { done: "ok", next: "mid", plan: "gray" };

/** Penanda yang bisa dipilih di formulir observasi. */
export const TANDA_OBSERVASI = ["Menyendiri", "Menangis", "Marah", "Konflik dengan teman", "Takut pada seseorang", "Membaik"];
