/**
 * Peta dukungan anak: siapa saja yang mendampingi seorang anak, termasuk buddy (teman sebaya
 * pendamping yang ditetapkan wali kelas), orang dewasa yang ia percaya, tempat aman, dan titik
 * rawan. Dipakai Laporan anak, Ruang wali kelas, dan aplikasi orang tua. Semua data contoh.
 */

/**
 * Peta dukungan Raka. `kelompok` urut dari yang paling dekat dengan anak. `utama` menandai orang
 * yang paling dipercaya anak (dari isian skrining), `buddy` menandai teman pendamping resmi.
 */
export const DUKUNGAN_RAKA = {
  anak: "Raka Pratama",
  diperbarui: "Disusun Bu Rina dan Bu Laras, 9 Nov, dari isian skrining dan obrolan dengan Raka.",
  kelompok: [
    {
      id: "keluarga",
      label: "Keluarga",
      orang: [
        { nama: "Ibu Dewi Lestari", inisial: "DL", peran: "Ibu", ket: "Orang yang paling dipercaya Raka", utama: true },
        { nama: "Pak Bambang", inisial: "BB", peran: "Ayah", ket: "Mengantar ke sekolah tiap pagi" },
      ],
    },
    {
      id: "teman",
      label: "Teman sebaya",
      orang: [
        {
          nama: "Alif Ramadhan",
          inisial: "AR",
          peran: "Buddy",
          ket: "Sejak 9 Nov. Duduk sebangku dan bermain bersama saat istirahat.",
          buddy: true,
        },
        { nama: "Gibran Akbar", inisial: "GA", peran: "Teman dekat", ket: "Sering ikut bermain bersama Alif dan Raka" },
      ],
    },
    {
      id: "sekolah",
      label: "Orang dewasa di sekolah",
      orang: [
        { nama: "Bu Rina Kartika", inisial: "RK", peran: "Wali kelas 2B", ket: "Penanggung jawab tindak lanjut" },
        { nama: "Bu Laras", inisial: "LA", peran: "Guru BK", ket: "Sesi BK tiap Kamis" },
        { nama: "Pak Hadi", inisial: "PH", peran: "Guru olahraga", ket: "Raka nyaman bercerita kepadanya" },
        { nama: "Pak Joko", inisial: "PJ", peran: "Guru piket istirahat", ket: "Mengawasi area kantin" },
      ],
    },
  ],
  tempatAman: ["Ruang BK", "Perpustakaan", "Kelas 2B saat istirahat"],
  titikRawan: ["Area kantin saat istirahat panjang"],
};

/**
 * Pasangan buddy kelas 2B. Buddy diberikan dulu kepada anak berstatus Waspada atau Perlu
 * Perhatian. `alasan` = aspek HEART yang membuat anak itu butuh buddy.
 */
export const BUDDY_2B = [
  { anak: "Raka Pratama", buddy: "Alif Ramadhan", sejak: "9 Nov", alasan: "Relasi Pertemanan: Waspada" },
  { anak: "Aqila Zahra", buddy: "Hana Safira", sejak: "6 Nov", alasan: "Emosional: Waspada" },
  { anak: "Fikri Hidayat", buddy: "Elang Mahesa", sejak: "6 Nov", alasan: "Hiperaktivitas: Waspada" },
  { anak: "Keisha Ananda", buddy: "Farah Nabila", sejak: "10 Nov", alasan: "Emosional: Perlu Perhatian" },
  { anak: "Naura Salsabila", buddy: "Lala Anindya", sejak: "10 Nov", alasan: "Relasi Pertemanan: Perlu Perhatian" },
  { anak: "Arka Wijaya", buddy: "Ilham Nugraha", sejak: "10 Nov", alasan: "Agresi: Perlu Perhatian" },
];

/** Anak yang butuh buddy tapi belum punya, beserta calon yang disarankan wali kelas. */
export const BELUM_BUDDY_2B = [
  { anak: "Rizky Maulana", alasan: "Hiperaktivitas: Perlu Perhatian", calon: ["Tegar Wicaksono", "Omar Faruq"] },
];
