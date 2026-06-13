// ============================================================
// INTELI-GEN · DATA MODEL — individual (Siswa / Orang Tua)
// Program: Fammi Multiple Intelligence Screening + Pemantauan
// Bulanan. Semua angka di sini DATA CONTOH.
//
// Skala sumber (lihat spesifikasi form):
//   - Skala MI    : 56 butir, 7 butir/kecerdasan, maks 4 → 28/kecerdasan
//   - Skala SA/CF : Skala B (kesesuaian diri 1–4)
//   - Skala LB    : Skala C (frekuensi 1–4)
//   Semua dinormalisasi ke INDEX 0–100 untuk tampilan.
// ============================================================

// ---- 8 kecerdasan: identitas, warna, terjemahan ke aksi ----
const MI = [
  { code: "Ie", key: "interpersonal", name: "Interpersonal", full: "Interpersonal", color: "#1E94A6",
    tagline: "Paham lewat diskusi & belajar bersama",
    icon: "Ie",
    strategi: ["Belajar kelompok & saling menjelaskan", "Diskusikan materi sebelum menyimpulkan", "Amati cara teman menyelesaikan soal"],
    karir: ["Psikolog", "Guru", "Marketing", "Diplomat"] },
  { code: "Sp", key: "spasial", name: "Spasial", full: "Spasial–Visual", color: "#6E3AD1",
    tagline: "Paham lewat gambar, diagram & ruang",
    icon: "Sp",
    strategi: ["Ubah materi jadi peta pikiran & diagram", "Pakai warna dan simbol pada catatan", "Tonton video atau visualisasi konsep"],
    karir: ["UI/UX Designer", "Arsitek", "Animator", "Fotografer"] },
  { code: "Ve", key: "linguistik", name: "Linguistik", full: "Verbal–Linguistik", color: "#2F6BD4",
    tagline: "Paham lewat bacaan, tulisan & kata",
    icon: "Ve",
    strategi: ["Rangkum materi dengan kata-kata sendiri", "Jelaskan ulang topik ke orang lain", "Belajar lewat membaca menyeluruh"],
    karir: ["Jurnalis", "Penulis", "Pengacara", "Content Writer"] },
  { code: "Ia", key: "intrapersonal", name: "Intrapersonal", full: "Intrapersonal", color: "#8A4FB8",
    tagline: "Paham lewat refleksi mandiri",
    icon: "Ia",
    strategi: ["Sediakan waktu refleksi setelah belajar", "Kaitkan materi dengan tujuan pribadi", "Tulis jurnal belajar"],
    karir: ["Peneliti", "Penulis", "Wirausaha", "Konselor"] },
  { code: "Na", key: "naturalis", name: "Naturalis", full: "Naturalis", color: "#3E9B6B",
    tagline: "Paham lewat alam & contoh nyata",
    icon: "Na",
    strategi: ["Kaitkan konsep dengan contoh alam", "Belajar lewat observasi & lapangan", "Kelompokkan materi berdasarkan ciri"],
    karir: ["Peneliti", "Dokter Hewan", "Ahli Lingkungan", "Biolog"] },
  { code: "Mu", key: "musikal", name: "Musikal", full: "Musikal", color: "#B5485F",
    tagline: "Paham lewat irama, nada & bunyi",
    icon: "Mu",
    strategi: ["Buat jingle untuk menghafal", "Belajar dengan pola bunyi teratur", "Kaitkan konsep dengan irama"],
    karir: ["Musisi", "Sound Designer", "Produser", "Guru Musik"] },
  { code: "Lo", key: "logis", name: "Logis-Matematis", full: "Logis–Matematis", color: "#3B4DA8",
    tagline: "Paham lewat logika, pola & angka",
    icon: "Lo",
    strategi: ["Pecah masalah jadi langkah berurutan", "Cari pola & hubungan sebab-akibat", "Gunakan tabel, data, dan angka"],
    karir: ["Data Analyst", "Insinyur", "Aktuaris", "Programmer"] },
  { code: "Ki", key: "kinestetik", name: "Kinestetik", full: "Kinestetik", color: "#C57A2C",
    tagline: "Paham lewat gerak & praktik langsung",
    icon: "Ki",
    strategi: ["Praktik & simulasi langsung", "Belajar sambil bergerak", "Gunakan alat peraga / demonstrasi"],
    karir: ["Atlet", "Dokter Bedah", "Chef", "Teknisi"] },
];
const MI_BY = {}; MI.forEach((m) => { MI_BY[m.code] = m; });

// ---- index → level (Index + level, sesuai pilihan) ----
const LEVELS = [
  { key: "Kuat",       min: 70, color: "var(--ungu)",     bg: "var(--ungu-100)",     fg: "var(--ungu-700)" },
  { key: "Sedang",     min: 45, color: "var(--ungu-300)", bg: "var(--ungu-050)",     fg: "var(--ungu)" },
  { key: "Berkembang", min: 0,  color: "var(--ink-4)",    bg: "var(--bg-2)",         fg: "var(--ink-3)" },
];
function levelOf(idx) { return LEVELS.find((l) => idx >= l.min) || LEVELS[LEVELS.length - 1]; }

// raw 0–28 → index 0–100
function miIndex(raw) { return Math.round((raw / 28) * 100); }

// ---- timeline: baseline + 6 bulan ----
const TL = [
  { key: "base", short: "Awal",   label: "Baseline · Jun" },
  { key: "b1",   short: "Bln 1",  label: "Bulan 1 · Jul" },
  { key: "b2",   short: "Bln 2",  label: "Bulan 2 · Agu" },
  { key: "b3",   short: "Bln 3",  label: "Bulan 3 · Sep" },
  { key: "b4",   short: "Bln 4",  label: "Bulan 4 · Okt" },
  { key: "b5",   short: "Bln 5",  label: "Bulan 5 · Nov" },
  { key: "b6",   short: "Bln 6",  label: "Bulan 6 · Des" },
];

// ============================================================
// SATU SISWA — Aisyah Putri Faisal · X-A · SMA Al Fath Cireundeu
// ============================================================
const STUDENT = {
  id: "S-0142",
  nama: "Aisyah Putri Faisal",
  panggilan: "Aisyah",
  kelas: "X-A",
  sekolah: "SMA Al Fath Cireundeu",
  usia: 16,
  jk: "Perempuan",

  // profil MI — index 0–100 (diukur sekali di awal program)
  mi: { Ie: 86, Sp: 82, Ve: 74, Ia: 61, Na: 57, Mu: 52, Lo: 44, Ki: 41 },

  // survei kontekstual (sekali, awal)
  mapel: { suka: "Biologi", mudah: "Seni Budaya", sulit: "Matematika" },
  cita: { profesi: "UI/UX Designer", alasan: "Ingin membuat aplikasi yang mudah dipakai semua orang, terutama lansia." },
  ai: { pakai: true, cara: "Merangkum bab panjang jadi poin-poin dan bertanya ketika tidak paham penjelasan guru." },
  digitalProf: "3 sampai 4", // CF3
  esai: {
    kekuatan: "Saya cepat menangkap suasana hati teman, jadi sering jadi tempat curhat dan bisa mengajak kelompok tetap kompak.",
    metode: "Saya paling paham kalau menggambar ulang materi jadi diagram, lalu menjelaskannya ke teman sekelompok.",
  },

  // jurnal index bulanan (baseline → bulan 6), 0–100
  journey: {
    sa: [54, 58, 61, 60, 66, 71, 75], // Self-Awareness
    lb: [49, 52, 50, 57, 61, 64, 68], // Learning Behaviour
    cf: [38, 41, 45, 52, 55, 60, 67], // Career & Future
  },

  // rincian Learning Behaviour bulan terakhir (index 0–100)
  lbBreak: [
    { label: "Belajar rutin", value: 68, note: "LB1 — tidak hanya saat ujian" },
    { label: "Fokus saat belajar", value: 64, note: "LB2 · LB3 (dibalik)" },
    { label: "Kelola cemas & stres", value: 58, note: "LB4 · LB5 (dibalik)" },
    { label: "Aktif terlibat di kelas", value: 76, note: "LB6 — bertanya & mencatat" },
  ],
  // lingkungan ternyaman (LB7 — butir profil, tidak diskor)
  environment: "Bersama teman",

  // rincian Self-Awareness bulan terakhir
  saBreak: [
    { label: "Kenal kekuatan diri", value: 80 },
    { label: "Tahu pemicu semangat", value: 74 },
    { label: "Yakin pada kemampuan", value: 70 },
    { label: "Punya alasan belajar", value: 78 },
  ],
  // rincian Career & Future bulan terakhir
  cfBreak: [
    { label: "Gambaran cita-cita jelas", value: 72 },
    { label: "Kenal profesi digital", value: 64 },
    { label: "Tahu langkah persiapan", value: 60 },
    { label: "Aktif cari informasi", value: 70 },
  ],

  // refleksi bulanan — kata-kata siswa (R1–R6, beda tiap bulan)
  reflections: [
    { tl: "b1", prompt: "Cara belajar apa yang paling berhasil bulan ini?", text: "Menggambar ulang materi Biologi jadi diagram, lalu menjelaskannya ke kelompok. Saya jadi ingat lebih lama." },
    { tl: "b2", prompt: "Apa yang membuatmu cepat bosan, dan bagaimana mengatasinya?", text: "Bosan kalau hanya membaca teks panjang. Saya akali dengan memberi warna dan simbol di catatan." },
    { tl: "b3", prompt: "Apa yang membuatmu lebih fokus akhir-akhir ini?", text: "Belajar di perpustakaan bareng dua teman. Kalau ada yang menemani, saya tidak gampang buka HP." },
    { tl: "b4", prompt: "Cara belajar apa saat menghadapi ujian bulan ini?", text: "Membuat ringkasan visual per bab seminggu sebelum ujian, bukan menghafal semalam." },
    { tl: "b5", prompt: "Satu hal baru tentang dirimu sebagai pelajar?", text: "Ternyata saya paling cepat paham kalau menjelaskan ke orang lain, bukan diam membaca sendirian." },
    { tl: "b6", prompt: "Setelah enam bulan, perubahan apa yang paling terasa?", text: "Saya lebih tahu cara belajar yang cocok untuk saya, dan tidak lagi panik tiap menghadapi Matematika." },
  ],
};

// derive: MI list sorted by index, with level
function studentMIList() {
  return Object.entries(STUDENT.mi)
    .map(([code, idx]) => ({ ...MI_BY[code], index: idx, level: levelOf(idx) }))
    .sort((a, b) => b.index - a.index);
}

// helper: delta vs baseline
function delta(arr) { return arr[arr.length - 1] - arr[0]; }

Object.assign(window, { MI, MI_BY, LEVELS, levelOf, miIndex, TL, STUDENT, studentMIList, delta });
