// ============================================================
// DATA CONTOH — Fammi Intelligence Report · Wali Kelas
// Konteks: SMA Al Fath Cireundeu · Kelas X-A (23 siswa)
// Nama siswa mengikuti contoh laporan; semua angka contoh.
// ============================================================

const W_TITLE = "Kelas X-A";
const W_SUBTITLE = "SMA Al Fath Cireundeu · Wali kelas Bpk. Andi Wijaya, S.Pd.";
const W_ROLE = "Wali Kelas";

// ---- Filter periode ----
const W_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const W_ROMAN = ["I", "II", "III", "IV", "V"];
const W_ACADEMIC_YEARS = ["2023/2024", "2024/2025", "2025/2026"];
const W_CAL_YEARS = [2024, 2025, 2026];
function wSemesterOf(month, calYear) {
  if (month >= 6) return { nama: "Ganjil", tahun: calYear + "/" + (calYear + 1) };
  return { nama: "Genap", tahun: (calYear - 1) + "/" + calYear };
}
function wComputeRange(sel) {
  if (sel.type === "tahunan") return "Tahun Ajaran " + sel.year;
  if (sel.type === "bulanan") {
    const s = wSemesterOf(sel.month, sel.calYear);
    return W_MONTHS[sel.month] + " " + sel.calYear + " \u00b7 Semester " + s.nama + " " + s.tahun;
  }
  return "Minggu " + W_ROMAN[sel.week - 1] + " \u00b7 " + W_MONTHS[sel.month] + " " + sel.calYear;
}

// ---- Delapan kecerdasan (Multiple Intelligence) ----
const INTEL = [
  { code: "Lo", name: "Logika-Matematika" },
  { code: "Na", name: "Naturalis" },
  { code: "Ve", name: "Verbal" },
  { code: "Ia", name: "Intrapersonal" },
  { code: "Sp", name: "Spasial" },
  { code: "Mu", name: "Musikal" },
  { code: "Ki", name: "Kinestetik" },
  { code: "Ie", name: "Interpersonal" },
];
const INTEL_NAME = Object.fromEntries(INTEL.map((i) => [i.code, i.name]));

// ---- Navigasi utama Wali Kelas ----
const W_NAV = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "siswa", label: "Daftar Siswa" },
  { id: "karakter", label: "Rapor Karakter" },
  { id: "screening", label: "Screening & Mental" },
  { id: "mi", label: "Bakat & Kecerdasan" },
  { id: "kepuasan", label: "Kepuasan" },
];

const W_STATUS = {
  aman: { label: "Aman", fg: "var(--aman)", bg: "var(--aman-bg)" },
  perhatian: { label: "Perlu perhatian", fg: "var(--perhatian)", bg: "var(--perhatian-bg)" },
  waspada: { label: "Perlu diwaspadai", fg: "var(--waspada)", bg: "var(--waspada-bg)" },
};

// ---- Ringkasan kelas ----
const W_CLASS = {
  siswa: 23,
  karakter: 84,
  aman: 18, perhatian: 4, waspada: 1,
  briefing: {
    lead: "Kelas X-A dalam kondisi baik dan terus menguat.",
    rest: "Mandiri menjadi karakter terkuat, sementara Santun masih perlu pembiasaan. Satu siswa perlu diwaspadai pada aspek Emosional, dan empat siswa lain perlu perhatian Anda bulan ini.",
    meta: "Dirangkum dari 3 produk · 23 siswa",
  },
  // karakter level kelas (6 karakter custom)
  chars: [
    { name: "Mandiri", val: 90, trend: "naik" },
    { name: "Terampil", val: 86, trend: "stabil" },
    { name: "7 Kebiasaan Anak Hebat", val: 84, trend: "naik" },
    { name: "Aktif", val: 82, trend: "naik" },
    { name: "Religius", val: 78, trend: "stabil" },
    { name: "Santun", val: 73, trend: "turun" },
  ],
  // screening level kelas (5 aspek HEART, dari 23 siswa)
  aspects: [
    { name: "Tolong Menolong", aman: 20, perhatian: 3, waspada: 0 },
    { name: "Relasi Pertemanan", aman: 17, perhatian: 4, waspada: 2 },
    { name: "Hiperaktivitas", aman: 19, perhatian: 3, waspada: 1 },
    { name: "Emosional", aman: 16, perhatian: 5, waspada: 2 },
    { name: "Agresi", aman: 19, perhatian: 3, waspada: 1 },
  ],
};

// ---- Daftar siswa (kode privasi opsional di tampilan sensitif) ----
// kuat & sedang = kode kecerdasan; sisanya dianggap "Berkembang"
const STUDENTS = [
  { id: 1, name: "Aisyah Putri Faisal", kar: 86, karTrend: "naik", scr: "perhatian", kuat: ["Ie", "Sp"], sedang: ["Ia", "Ve"], scrNote: "Emosional", support: "Dukungan fasilitas, dan tidak terlalu banyak mengomentari apa yang saya lakukan." },
  { id: 2, name: "Archie Bhadrika Faeyza", kar: 88, karTrend: "naik", scr: "aman", kuat: ["Ki", "Ie"], sedang: ["Na", "Sp"], support: "Orang tua sudah cukup mendukung hal-hal positif yang saya lakukan." },
  { id: 3, name: "Arkana Trystan Kaindra", kar: 90, karTrend: "naik", scr: "aman", kuat: ["Ki", "Ia"], sedang: ["Ie", "Mu"], support: "Doa dan kata penyemangat dari orang tua sebelum bertanding." },
  { id: 4, name: "Aruna Arsacetta Dyah Putri", kar: 85, karTrend: "stabil", scr: "aman", kuat: ["Sp", "Ie"], sedang: ["Ve", "Mu"], support: "Dukungan biaya alat dan kesediaan mendengarkan keinginan saya." },
  { id: 5, name: "Arya Febrizki Hutomo", kar: 70, karTrend: "turun", scr: "waspada", kuat: ["Ki", "Lo"], sedang: ["Sp", "Na"], scrNote: "Emosional · Relasi Pertemanan", support: "Ingin didukung tanpa selalu dikritik soal performa." },
  { id: 6, name: "Azra Nurwin Magani", kar: 84, karTrend: "naik", scr: "aman", kuat: ["Sp", "Mu"], sedang: ["Ie", "Ve"], support: "Ingin diberi ruang mengembangkan keterampilan melukis." },
  { id: 7, name: "Farrell Pratama Celo", kar: 83, karTrend: "stabil", scr: "aman", kuat: ["Mu", "Ki"], sedang: ["Ie", "Sp"], support: "Alat musik seperti gitar dan bass." },
  { id: 8, name: "Fawza Naima Syakira", kar: 87, karTrend: "naik", scr: "aman", kuat: ["Ie", "Ve"], sedang: ["Ia", "Sp"], support: "Fasilitas untuk menumbuhkan keterampilan dan mencoba hal baru." },
  { id: 9, name: "Ikhlas Alberga Mamesah", kar: 82, karTrend: "stabil", scr: "aman", kuat: ["Ia", "Ie"], sedang: ["Na", "Lo"], support: "Doa terbaik dari orang tua." },
  { id: 10, name: "Jihan Amirah Sesariana", kar: 85, karTrend: "naik", scr: "aman", kuat: ["Ie", "Ve"], sedang: ["Mu", "Ia"], support: "Dukungan berupa kata-kata penyemangat." },
  { id: 11, name: "Khairul Achmad Ramdhany", kar: 84, karTrend: "stabil", scr: "aman", kuat: ["Lo", "Ia"], sedang: ["Ki", "Sp"], support: "Cukup mendukung keputusan yang saya ambil." },
  { id: 12, name: "Khansa Athfah Syadza", kar: 80, karTrend: "turun", scr: "perhatian", kuat: ["Ia", "Ve"], sedang: ["Ie", "Mu"], scrNote: "Emosional", support: "Dukungan sepenuh hati, bukan hanya soal ekonomi; ingin memilih sesuai minat." },
  { id: 13, name: "Muhamad Razaan 'Ariq", kar: 86, karTrend: "naik", scr: "aman", kuat: ["Lo", "Ki"], sedang: ["Na", "Sp"], support: "Didukung mengikuti les seperti matematika, kimia, dan fisika." },
  { id: 14, name: "Muhammad Pasya Wajendra", kar: 78, karTrend: "turun", scr: "perhatian", kuat: ["Ki", "Mu"], sedang: ["Ie", "Sp"], scrNote: "Relasi Pertemanan", support: "Ingin orang tua memahami alasan saya memilih mengembangkan minat." },
  { id: 15, name: "Nazwa Alifa Dayana", kar: 81, karTrend: "stabil", scr: "perhatian", kuat: ["Sp", "Ie"], sedang: ["Ve", "Ia"], scrNote: "Emosional", support: "Tidak terlalu ditekan, cukup diarahkan dan difasilitasi." },
  { id: 16, name: "Raisya Azzaria Putri Calistya", kar: 85, karTrend: "naik", scr: "aman", kuat: ["Ve", "Ia"], sedang: ["Ie", "Na"], support: "Bantuan mencari tempat les bahasa asing yang cocok dan jadwal yang pas." },
  { id: 17, name: "Rania Maharani Putri", kar: 88, karTrend: "naik", scr: "aman", kuat: ["Ie", "Sp"], sedang: ["Mu", "Ve"], support: "Dukungan dan kepercayaan untuk mencoba kegiatan baru." },
  { id: 18, name: "Rasyid Theodore Ramadhan", kar: 87, karTrend: "stabil", scr: "aman", kuat: ["Lo", "Ia"], sedang: ["Ki", "Na"], support: "Diskusi yang terbuka untuk memilih jurusan." },
  { id: 19, name: "Sachio Rico Widjoyo", kar: 84, karTrend: "naik", scr: "aman", kuat: ["Ki", "Sp"], sedang: ["Ie", "Lo"], support: "Dukungan untuk menyalurkan energi lewat olahraga." },
  { id: 20, name: "Sakha Nararya Adewiyastra", kar: 86, karTrend: "naik", scr: "aman", kuat: ["Ia", "Lo"], sedang: ["Ve", "Ie"], support: "Ruang yang tenang untuk fokus belajar di rumah." },
  { id: 21, name: "Vanessa Alyf Prameiswari", kar: 85, karTrend: "stabil", scr: "aman", kuat: ["Ie", "Mu"], sedang: ["Sp", "Ve"], support: "Apresiasi atas hasil karya dan usaha yang saya lakukan." },
  { id: 22, name: "Zaidan Abiyyu Januar", kar: 89, karTrend: "naik", scr: "aman", kuat: ["Lo", "Ki"], sedang: ["Na", "Ia"], support: "Fasilitas dan arahan untuk minat di bidang teknologi." },
  { id: 23, name: "Zalika Rajni Ramadhani", kar: 86, karTrend: "naik", scr: "aman", kuat: ["Ie", "Ia"], sedang: ["Ve", "Sp"], support: "Dukungan emosional dan kepercayaan dari orang tua." },
];

// level kecerdasan untuk satu siswa pada satu kode
function intelLevel(student, code) {
  if (student.kuat.includes(code)) return "Kuat";
  if (student.sedang.includes(code)) return "Sedang";
  return "Berkembang";
}
// hitung top-3 kecerdasan dominan kelas (berdasarkan jumlah "Kuat")
function classTopIntel() {
  const count = {};
  INTEL.forEach((i) => count[i.code] = 0);
  STUDENTS.forEach((s) => s.kuat.forEach((c) => count[c]++));
  return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([code, n]) => ({ code, name: INTEL_NAME[code], n, pct: Math.round(n / STUDENTS.length * 100) }));
}

Object.assign(window, {
  W_TITLE, W_SUBTITLE, W_ROLE, W_MONTHS, W_ROMAN, W_ACADEMIC_YEARS, W_CAL_YEARS, wComputeRange,
  INTEL, INTEL_NAME, W_NAV, W_STATUS, W_CLASS, STUDENTS, intelLevel, classTopIntel,
});
