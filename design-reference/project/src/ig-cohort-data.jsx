// ============================================================
// INTELI-GEN · DATA MODEL — agregat (Wali Kelas / Sekolah / Yayasan)
// DATA CONTOH. Skala & index sama dengan ig-data.jsx.
// ============================================================

// subject clusters for the MI × mapel cross-tab
const SUBJECTS = ["MIPA", "Sosial", "Bahasa", "Seni", "Olahraga"];

// ---------- KELAS X-A (Wali Kelas) ----------
const IG_CLASS = {
  scope: "wali",
  scopeKicker: "Kelas",
  scopeName: "X-A",
  parentName: "SMA Al Fath Cireundeu",
  nSiswa: 28,
  nKelas: null,

  // sebaran kecerdasan DOMINAN (berapa siswa yang puncaknya di tiap kecerdasan)
  miDist: [
    { code: "Ie", n: 6 }, { code: "Sp", n: 5 }, { code: "Ve", n: 4 }, { code: "Ki", n: 4 },
    { code: "Na", n: 3 }, { code: "Lo", n: 3 }, { code: "Ia", n: 2 }, { code: "Mu", n: 1 },
  ],
  // rata-rata index per kecerdasan (radar kelas)
  miAvg: { Ie: 71, Sp: 68, Ve: 66, Ki: 63, Na: 59, Lo: 57, Ia: 55, Mu: 48 },

  // perjalanan rata-rata kelas (baseline → bulan 6)
  journey: { sa: [52, 55, 57, 59, 62, 65, 68], lb: [50, 51, 54, 56, 58, 61, 63], cf: [41, 44, 46, 50, 54, 57, 61] },

  // indikator kunci kelas
  flags: {
    cemasTinggi: 5,      // siswa dengan skor kelola-cemas rendah
    fokusRendah: 4,
    awarenessNaik: 79,   // % siswa Self-Awareness naik vs baseline
    citaJelas: 64,       // % siswa cita-cita sudah jelas (CF1)
    digitalKenal: 57,    // % kenal ≥3 profesi digital
  },

  // MI (dominan, dikelompokkan) × rumpun mapel favorit — jumlah siswa
  // baris = kecerdasan, kolom = SUBJECTS
  heat: {
    rows: ["Ie", "Sp", "Ve", "Lo", "Ki", "Na"],
    matrix: [
      [1, 3, 1, 1, 0], // Interpersonal
      [2, 0, 0, 3, 0], // Spasial
      [0, 1, 3, 0, 0], // Linguistik
      [3, 0, 0, 0, 0], // Logis
      [0, 0, 0, 1, 3], // Kinestetik
      [2, 1, 0, 0, 0], // Naturalis
    ],
  },

  // sampel siswa (untuk tabel) — index bulan terakhir + delta vs baseline
  students: [
    { nama: "Aisyah Putri Faisal", top: "Ie", sa: 75, lb: 68, cf: 67, saD: 21, lbD: 19, cfD: 29, flag: null },
    { nama: "Bima Arya Nugraha", top: "Lo", sa: 70, lb: 72, cf: 58, saD: 14, lbD: 16, cfD: 12, flag: null },
    { nama: "Citra Maharani", top: "Ve", sa: 66, lb: 54, cf: 61, saD: 9, lbD: 4, cfD: 18, flag: "cemas" },
    { nama: "Daffa Pratama", top: "Ki", sa: 58, lb: 49, cf: 44, saD: 6, lbD: -3, cfD: 8, flag: "fokus" },
    { nama: "Elsa Wijayanti", top: "Sp", sa: 74, lb: 66, cf: 70, saD: 18, lbD: 15, cfD: 22, flag: null },
    { nama: "Fadhil Rahman", top: "Na", sa: 62, lb: 60, cf: 49, saD: 11, lbD: 9, cfD: 7, flag: null },
    { nama: "Gita Ayu Lestari", top: "Ie", sa: 69, lb: 57, cf: 64, saD: 13, lbD: 7, cfD: 16, flag: null },
    { nama: "Hanif Maulana", top: "Lo", sa: 55, lb: 47, cf: 41, saD: 4, lbD: -2, cfD: 5, flag: "cemas" },
    { nama: "Intan Permata", top: "Sp", sa: 72, lb: 64, cf: 66, saD: 16, lbD: 13, cfD: 20, flag: null },
    { nama: "Joko Susilo", top: "Ki", sa: 60, lb: 52, cf: 47, saD: 8, lbD: 5, cfD: 9, flag: null },
  ],

  // tema refleksi yang sering muncul + kutipan contoh
  themes: [
    { theme: "Belajar visual (diagram, warna, peta)", n: 11, quote: "Materi jadi nyangkut kalau saya gambar ulang jadi diagram." },
    { theme: "Belajar bersama teman", n: 9, quote: "Lebih fokus kalau belajar bareng, tidak gampang buka HP." },
    { theme: "Mengatasi rasa cemas ujian", n: 7, quote: "Saya mulai membuat ringkasan jauh hari, tidak menumpuk semalam." },
    { theme: "Memberi makna pada pelajaran", n: 5, quote: "Belajar terasa beda saat tahu untuk apa nantinya." },
  ],
};

// ---------- SMA AL FATH CIREUNDEU (Kepala Sekolah) ----------
const IG_SCHOOL = {
  scope: "sekolah",
  scopeKicker: "Sekolah",
  scopeName: "SMA Al Fath Cireundeu",
  parentName: "Yayasan Pendidikan Al Fath",
  nSiswa: 67,
  nKelas: 3,

  miDist: [
    { code: "Ie", n: 14 }, { code: "Sp", n: 12 }, { code: "Ve", n: 10 }, { code: "Ki", n: 9 },
    { code: "Na", n: 8 }, { code: "Lo", n: 7 }, { code: "Ia", n: 4 }, { code: "Mu", n: 3 },
  ],
  miAvg: { Ie: 69, Sp: 66, Ve: 64, Ki: 61, Na: 58, Lo: 56, Ia: 54, Mu: 49 },
  journey: { sa: [53, 55, 58, 60, 62, 64, 67], lb: [51, 52, 53, 56, 58, 60, 62], cf: [43, 45, 48, 51, 54, 57, 60] },
  flags: { cemasTinggi: 12, fokusRendah: 10, awarenessNaik: 76, citaJelas: 61, digitalKenal: 54 },
  heat: {
    rows: ["Ie", "Sp", "Ve", "Lo", "Ki", "Na"],
    matrix: [
      [3, 6, 3, 2, 0], [5, 1, 1, 5, 0], [1, 3, 6, 0, 0],
      [6, 1, 0, 0, 0], [0, 1, 1, 2, 5], [4, 3, 1, 0, 0],
    ],
  },
  // rincian per kelas
  breakdown: [
    { name: "X-A", nSiswa: 28, topMI: "Ie", sa: 68, lb: 63, cf: 61, saD: 16, lbD: 13, cfD: 20, cemas: 5 },
    { name: "XI-IPA", nSiswa: 21, topMI: "Sp", sa: 67, lb: 62, cf: 60, saD: 14, lbD: 11, cfD: 17, cemas: 4 },
    { name: "XII-IPS", nSiswa: 18, topMI: "Ve", sa: 66, lb: 60, cf: 58, saD: 12, lbD: 9, cfD: 15, cemas: 3 },
  ],
  themes: IG_CLASS.themes,
};

// ---------- YAYASAN PENDIDIKAN AL FATH (6 sekolah) ----------
const IG_FOUNDATION = {
  scope: "yayasan",
  scopeKicker: "Yayasan",
  scopeName: "Yayasan Pendidikan Al Fath",
  parentName: "6 sekolah · 3 jenjang",
  nSiswa: 1209,
  nKelas: 46,

  miDist: [
    { code: "Ie", n: 248 }, { code: "Ki", n: 226 }, { code: "Sp", n: 198 }, { code: "Na", n: 171 },
    { code: "Ve", n: 142 }, { code: "Lo", n: 118 }, { code: "Ia", n: 64 }, { code: "Mu", n: 42 },
  ],
  miAvg: { Ie: 67, Ki: 64, Sp: 63, Na: 61, Ve: 60, Lo: 57, Ia: 53, Mu: 50 },
  journey: { sa: [51, 53, 56, 58, 60, 62, 65], lb: [49, 51, 52, 54, 56, 58, 60], cf: [42, 44, 47, 50, 53, 56, 59] },
  flags: { cemasTinggi: 214, fokusRendah: 186, awarenessNaik: 74, citaJelas: 58, digitalKenal: 51 },
  heat: {
    rows: ["Ie", "Ki", "Sp", "Na", "Ve", "Lo"],
    matrix: [
      [4, 7, 3, 2, 1], [0, 1, 1, 2, 6], [6, 1, 1, 5, 0],
      [5, 4, 1, 0, 1], [1, 3, 6, 0, 0], [6, 1, 0, 0, 0],
    ],
  },
  // rincian per sekolah (jenjang)
  breakdown: [
    { name: "SD Al Fath Cireundeu", jenjang: "SD", nSiswa: 312, topMI: "Ki", sa: 66, lb: 61, cf: 55, saD: 15, lbD: 12, cfD: 14, cemas: 38 },
    { name: "SD Al Fath Pamulang", jenjang: "SD", nSiswa: 268, topMI: "Na", sa: 64, lb: 60, cf: 53, saD: 13, lbD: 11, cfD: 13, cemas: 31 },
    { name: "SMP Al Fath Cireundeu", jenjang: "SMP", nSiswa: 224, topMI: "Ie", sa: 65, lb: 60, cf: 58, saD: 14, lbD: 10, cfD: 16, cemas: 42 },
    { name: "SMP Al Fath Depok", jenjang: "SMP", nSiswa: 196, topMI: "Ki", sa: 61, lb: 56, cf: 54, saD: 9, lbD: 6, cfD: 11, cemas: 49 },
    { name: "SMA Al Fath Cireundeu", jenjang: "SMA", nSiswa: 67, topMI: "Ie", sa: 67, lb: 62, cf: 60, saD: 16, lbD: 12, cfD: 18, cemas: 12 },
    { name: "SMA Al Fath Serpong", jenjang: "SMA", nSiswa: 142, topMI: "Ia", sa: 63, lb: 58, cf: 57, saD: 11, lbD: 8, cfD: 14, cemas: 42 },
  ],
  themes: [
    { theme: "Belajar visual (diagram, warna, peta)", n: 287, quote: "Materi jadi nyangkut kalau saya gambar ulang jadi diagram." },
    { theme: "Belajar bersama teman", n: 241, quote: "Lebih fokus kalau belajar bareng, tidak gampang buka HP." },
    { theme: "Mengatasi rasa cemas ujian", n: 198, quote: "Saya mulai membuat ringkasan jauh hari, tidak menumpuk semalam." },
    { theme: "Belajar lewat praktik langsung", n: 164, quote: "Saya lebih paham kalau langsung mencoba, bukan cuma membaca." },
    { theme: "Memberi makna pada pelajaran", n: 132, quote: "Belajar terasa beda saat tahu untuk apa nantinya." },
  ],
};

const COHORTS = { wali: IG_CLASS, sekolah: IG_SCHOOL, yayasan: IG_FOUNDATION };

Object.assign(window, { SUBJECTS, IG_CLASS, IG_SCHOOL, IG_FOUNDATION, COHORTS });
