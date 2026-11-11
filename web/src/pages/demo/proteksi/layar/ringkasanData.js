/**
 * Data contoh layar Ringkasan (sudut pandang Kepala Sekolah) prototipe Sekolah Proteksi. Disalin
 * apa adanya dari kanvas desain pemilik produk (2026-11-11, artboard "1 · Ringkasan sekolah").
 * Semua nama, kelas, dan angka hanya contoh untuk demonstrasi.
 */

/** Tahap program semester. status: "done" selesai, "now" berjalan, "next" berikutnya. */
export const TAHAP = [
  { nama: "Persiapan", ket: "5–16 Okt. Penanggung jawab program dan kelas peserta ditetapkan.", status: "done" },
  { nama: "Pemetaan awal", ket: "19 Okt–13 Nov. Skrining oleh orang tua dan wali kelas, sesi edukasi.", status: "now" },
  { nama: "Kanal lapor & alur tindak", ket: "Aktif sejak 19 Okt. Laporan dinilai, diteruskan, dan dipantau.", status: "now" },
  { nama: "Refleksi & pemantauan", ket: "Des 2026–Feb 2027. Refleksi bulanan dan skrining akhir.", status: "next" },
  { nama: "Laporan akhir", ket: "Mar 2027. Perbandingan kondisi awal dan akhir untuk pimpinan.", status: "next" },
];

/** Label dan nada pil untuk tiap status tahap. */
export const STATUS_TAHAP = {
  done: { label: "Selesai", pil: "ok" },
  now: { label: "Berjalan", pil: "mid" },
  next: { label: "Berikutnya", pil: "gray" },
};

/** Empat angka kunci. nada = warna keterangan di bawah angka (mut, r, g). */
export const ANGKA_KUNCI = [
  { ikon: "hati", judul: ["Anak Perlu", "Dukungan"], angka: "18 anak", ket: "37 anak lain perlu dipantau di kelas", nada: "mut" },
  { ikon: "tiket", judul: ["Kasus", "Aktif"], angka: "8 kasus", ket: "1 lewat SLA · 1 menunggu analisis", nada: "r" },
  { ikon: "jam", judul: ["Ketepatan", "SLA"], angka: "96%", ket: "25 dari 26 tahap selesai tepat waktu", nada: "g" },
  { ikon: "buku", judul: ["Kelas", "Kesadaran"], angka: "23 / 44 sesi", ket: "4 tema untuk tiap kelas", nada: "g" },
];

/** Alur penanganan kasus. nada: "hot" tahap yang sedang menunggu, "done" kasus yang sudah ditutup. */
export const ALUR = [
  { judul: "1 · Analisis tingkat", jumlah: 1, ket: "Laporan baru, tingkat keseriusan sedang dinilai", oleh: "Koordinator BK", nada: "hot" },
  { judul: "2 · Diteruskan", jumlah: 1, ket: "Menunggu respon pertama penanggung jawab", oleh: "Wali kelas · Guru BK", nada: "" },
  { judul: "3 · Rencana tindak", jumlah: 3, ket: "Langkah penanganan sedang dijalankan", oleh: "Guru BK · wali kelas", nada: "" },
  { judul: "4 · Dipantau", jumlah: 3, ket: "Kondisi anak dicek ulang 2–4 minggu", oleh: "Wali kelas · psikolog Fammi", nada: "" },
  { judul: "Selesai", jumlah: 8, ket: "Ditutup dengan catatan hasil", oleh: "Sejak 19 Okt 2026", nada: "done" },
];

/**
 * Kasus yang perlu perhatian pimpinan sekarang. pil = nada pil tingkat, nada = latar baris,
 * warnaSla = warna teks tenggat (o jingga, r merah).
 */
export const PERHATIAN = [
  {
    id: "KS-016",
    tingkat: "Darurat",
    pil: "crit",
    nada: "warn",
    judul: "Dugaan pendekatan tidak wajar oleh orang dewasa",
    meta: "Kelas 3A · Lapor Aman tanpa nama · masuk 09.45",
    sla: "Respon pertama: sisa 15 menit",
    warnaSla: "o",
    oleh: "Bu Laras, Koordinator BK · Anda diberi tahu",
  },
  {
    id: "KS-010",
    tingkat: "Tinggi",
    pil: "bad",
    nada: "bad",
    judul: "Berkelahi dan memukul teman hingga memar",
    meta: "Kelas 4B · dilaporkan wali kelas · Kamis, 5 Nov",
    sla: "Rencana tindak: lewat 2 hari",
    warnaSla: "r",
    oleh: "Pak Arif dan Bu Laras · dieskalasi ke Anda",
  },
];

/** Grafik Hasil Pemetaan per Aspek: jumlah anak per aspek menurut sumber penilaian. */
export const ASPEK = ["Perasaan", "Perilaku", "Fokus & energi", "Pertemanan", "Kepedulian"];
export const SUMBER = [
  { id: "gab", label: "Gabungan" },
  { id: "ot", label: "Orang tua" },
  { id: "wk", label: "Wali kelas" },
];
export const NILAI_ASPEK = {
  gab: [24, 15, 29, 21, 11],
  ot: [27, 12, 24, 19, 9],
  wk: [19, 17, 31, 22, 12],
};

/** Grafik Laporan Masuk per Kategori: label singkat di bawah batang, nama lengkap untuk pembaca layar. */
export const KATEGORI = ["Ejekan", "Fisik", "Konflik teman", "Dikucilkan", "Tidak wajar", "Emosi", "Skrining", "Cedera"];
export const KATEGORI_LENGKAP = [
  "Perundungan verbal",
  "Perundungan fisik",
  "Konflik antarteman",
  "Dikucilkan teman",
  "Pendekatan tidak wajar",
  "Emosi dan perilaku",
  "Tanda bahaya dari skrining",
  "Cedera atau kecelakaan",
];
export const RENTANG = [
  { id: "all", label: "Sejak 19 Okt" },
  { id: "nov", label: "November" },
];
export const NILAI_KATEGORI = {
  all: [3, 3, 2, 1, 2, 2, 2, 1],
  nov: [1, 2, 0, 1, 1, 1, 1, 1],
};
export const CATATAN_RENTANG = {
  all: "16 laporan sejak kanal dibuka 19 Okt 2026.",
  nov: "8 laporan sejak 1 November 2026.",
};
export const CATATAN_KATEGORI =
  "Ejekan dan fisik = perundungan; tidak wajar = pendekatan tidak wajar oleh orang dewasa; skrining = tanda bahaya dari hasil skrining.";

/** Peta kelas: anak terpetakan dari jumlah anak; status menentukan pil dan saringan. */
export const KELAS = [
  { kelas: "2B", wali: "Bu Rina", terpetakan: 26, jumlah: 28, pantau: 4, dukung: 3, kasus: "1 · Tinggi", status: "Prioritas", tindak: "3 rencana dukungan, 1 kasus menunggu respon" },
  { kelas: "3A", wali: "Pak Yusuf", terpetakan: 28, jumlah: 28, pantau: 4, dukung: 2, kasus: "1 · Darurat", status: "Prioritas", tindak: "Kasus darurat menunggu analisis" },
  { kelas: "4B", wali: "Pak Arif", terpetakan: 28, jumlah: 28, pantau: 3, dukung: 1, kasus: "1 · Tinggi", status: "Prioritas", tindak: "Rencana tindak terlambat, dieskalasi" },
  { kelas: "TK B2", wali: "Bu Rahma", terpetakan: 22, jumlah: 22, pantau: 3, dukung: 2, kasus: "1 · Tinggi", status: "Perlu perhatian", tindak: "Didampingi psikolog Fammi" },
  { kelas: "1B", wali: "Pak Fajar", terpetakan: 24, jumlah: 28, pantau: 4, dukung: 2, kasus: "1 · Sedang", status: "Perlu perhatian", tindak: "4 formulir wali kelas belum diisi" },
  { kelas: "3B", wali: "Bu Maya", terpetakan: 28, jumlah: 28, pantau: 4, dukung: 2, kasus: "1 · Rendah", status: "Perlu perhatian", tindak: "Kasus dipantau sampai 20 Nov" },
  { kelas: "4A", wali: "Bu Fitri", terpetakan: 22, jumlah: 28, pantau: 3, dukung: 2, kasus: "1 · Sedang", status: "Perlu perhatian", tindak: "6 formulir wali kelas belum diisi" },
  { kelas: "TK A", wali: "Bu Nisa", terpetakan: 20, jumlah: 20, pantau: 2, dukung: 1, kasus: "0", status: "Aman", tindak: "1 rencana dukungan berjalan" },
  { kelas: "TK B1", wali: "Bu Dian", terpetakan: 22, jumlah: 22, pantau: 3, dukung: 1, kasus: "0", status: "Aman", tindak: "1 rencana dukungan berjalan" },
  { kelas: "1A", wali: "Bu Wulan", terpetakan: 28, jumlah: 28, pantau: 3, dukung: 1, kasus: "0", status: "Aman", tindak: "1 rencana dukungan berjalan" },
  { kelas: "2A", wali: "Bu Intan", terpetakan: 28, jumlah: 28, pantau: 4, dukung: 1, kasus: "0", status: "Aman", tindak: "1 rencana dukungan berjalan" },
];

/** Nada pil untuk tiap status kelas. */
export const PIL_STATUS_KELAS = { Prioritas: "bad", "Perlu perhatian": "warn", Aman: "ok" };

/** Saringan tabel Peta Kelas. status null = semua kelas. */
export const SARINGAN_KELAS = [
  { id: "semua", label: "Semua (11)", status: null },
  { id: "prioritas", label: "Prioritas (3)", status: "Prioritas" },
  { id: "perhatian", label: "Perlu perhatian (4)", status: "Perlu perhatian" },
  { id: "aman", label: "Aman (4)", status: "Aman" },
];

/** Pemberitahuan tombol Akses Cepat yang tidak berpindah layar. */
export const PESAN_PENGINGAT = "Pengingat WhatsApp terkirim ke 47 orang tua yang belum mengisi skrining";
export const PESAN_UNDUH = "Laporan pimpinan (PDF) sedang disiapkan";
