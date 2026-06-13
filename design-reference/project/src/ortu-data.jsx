// ============================================================
// DATA CONTOH — Fammi Intelligence Report · Orang Tua / Siswa
// Konteks: Aisyah Putri Faisal · Kelas X-A · SMA Al Fath Cireundeu
// Versi individu (satu anak). Semua angka & narasi contoh.
// ============================================================

const CHILD = {
  name: "Aisyah Putri Faisal",
  panggilan: "Aisyah",
  kelas: "X-A",
  sekolah: "SMA Al Fath Cireundeu",
  jenis: "Perempuan",
  usia: "16 tahun",
  wali: "Bpk. Andi Wijaya, S.Pd.",
  periode: "Semester Ganjil, Tahun Ajaran 2025/2026",
  karakter: 86,
  karakterTrend: "naik",
};

// ---- Voice: nada untuk Orang Tua vs Siswa ----
// V(voice, "teks orang tua", "teks siswa")
function V(voice, ortu, siswa) { return voice === "siswa" ? siswa : ortu; }

// ---- 8 kecerdasan + skor individu (skala 0-25, seperti contoh laporan) ----
const O_INTEL = [
  { code: "Ie", name: "Interpersonal", score: 23, level: "Kuat",
    desc: "Aisyah mudah memahami perasaan orang lain dan nyaman menjalin pertemanan. Ia sering menjadi tempat bercerita bagi teman-temannya." },
  { code: "Sp", name: "Spasial", score: 22, level: "Kuat",
    desc: "Aisyah punya daya imajinasi visual yang kuat dan senang berkarya rupa. Ia menangkap bentuk, warna, dan ruang dengan baik." },
  { code: "Ia", name: "Intrapersonal", score: 19, level: "Sedang",
    desc: "Aisyah cukup mengenali perasaan dan tujuannya sendiri, dan bisa terus dikuatkan lewat kebiasaan refleksi." },
  { code: "Ve", name: "Verbal", score: 18, level: "Sedang",
    desc: "Aisyah berkomunikasi dengan baik dalam keseharian. Latihan menulis dan berbicara akan menajamkan potensi ini." },
  { code: "Na", name: "Naturalis", score: 16, level: "Sedang",
    desc: "Aisyah menikmati kegiatan di alam dalam batas wajar." },
  { code: "Mu", name: "Musikal", score: 15, level: "Sedang",
    desc: "Aisyah menikmati musik dan mampu mengikuti irama." },
  { code: "Lo", name: "Logika-Matematika", score: 13, level: "Berkembang",
    desc: "Kemampuan penalaran logis Aisyah sedang berkembang dan akan tumbuh dengan latihan bertahap." },
  { code: "Ki", name: "Kinestetik", score: 12, level: "Berkembang",
    desc: "Koordinasi gerak Aisyah sedang berkembang; aktivitas fisik yang menyenangkan akan membantu." },
];
const O_DOMINAN = ["Interpersonal", "Spasial"];

// Rekomendasi dari kombinasi Interpersonal + Spasial
const O_REKOM = {
  jurusan: ["IPS / Bahasa & Budaya", "Seni & Desain"],
  kuliah: ["Desain Komunikasi Visual", "Arsitektur", "Psikologi", "Ilmu Komunikasi", "Seni Rupa"],
  profesi: ["Desainer grafis / ilustrator", "Arsitek interior", "Perancang UI/UX", "Psikolog", "Hubungan masyarakat"],
  ekskul: ["Klub Seni Rupa", "Klub Desain & Fotografi", "Pengurus OSIS", "Mading sekolah"],
  lomba: ["Lomba poster & ilustrasi", "Lomba desain grafis", "Lomba debat / pidato"],
};

// Pernyataan langsung anak tentang dukungan yang ia perlukan
const O_DUKUNGAN = "Aku ingin difasilitasi untuk melukis, dan tidak terlalu banyak dikomentari soal apa yang sedang kukerjakan.";

// ---- 6 karakter custom sekolah (level individu) ----
// skala: Belum Muncul / Kadang Muncul / Sering Muncul / Konsisten
const O_KARAKTER = [
  { name: "Mandiri", level: "Konsisten", val: 92, trend: "naik",
    note: "Aisyah mengerjakan tugas dan keperluannya tanpa banyak diingatkan." },
  { name: "7 Kebiasaan Anak Hebat", level: "Konsisten", val: 88, trend: "naik",
    note: "Kebiasaan baik harian seperti beribadah dan merapikan diri sudah melekat." },
  { name: "Aktif", level: "Sering Muncul", val: 85, trend: "naik",
    note: "Aisyah aktif bertanya dan ikut serta dalam kegiatan kelas." },
  { name: "Terampil", level: "Sering Muncul", val: 84, trend: "stabil",
    note: "Terampil berkarya, terutama dalam kegiatan seni dan kerajinan." },
  { name: "Religius", level: "Sering Muncul", val: 82, trend: "stabil",
    note: "Menjalankan ibadah dengan kesadaran sendiri." },
  { name: "Santun", level: "Kadang Muncul", val: 74, trend: "naik",
    note: "Kesantunan dalam tutur kata sedang dibiasakan, dan menunjukkan kemajuan." },
];
const KAR_SCALE = ["Belum Muncul", "Kadang Muncul", "Sering Muncul", "Konsisten"];

// ---- Sosial-Emosional (Screening HEART, level individu) ----
const O_ASPEK = [
  { name: "Tolong Menolong", status: "aman",
    ortu: "Aisyah mudah membantu teman dan peka pada kebutuhan sekitar.",
    siswa: "Kamu mudah membantu teman dan peka pada keadaan sekitar." },
  { name: "Relasi Pertemanan", status: "aman",
    ortu: "Aisyah punya pertemanan yang sehat dan saling mendukung.",
    siswa: "Kamu punya pertemanan yang sehat dan saling mendukung." },
  { name: "Hiperaktivitas", status: "aman",
    ortu: "Aisyah mampu menjaga fokus dan tenang saat belajar.",
    siswa: "Kamu mampu menjaga fokus dan tenang saat belajar." },
  { name: "Emosional", status: "perhatian",
    ortu: "Aisyah sesekali memendam perasaan saat sedang banyak pikiran. Ruang bercerita yang hangat akan sangat membantunya.",
    siswa: "Kadang kamu memendam perasaan saat banyak pikiran. Tidak apa-apa, cerita ke orang yang kamu percaya bisa membantu." },
  { name: "Agresi", status: "aman",
    ortu: "Aisyah jarang menunjukkan reaksi kasar dan bisa menahan diri.",
    siswa: "Kamu jarang bereaksi kasar dan bisa menahan diri dengan baik." },
];

// ---- Navigasi ----
const O_NAV = [
  { id: "ringkasan", label: "Ringkasan", short: "Ringkasan" },
  { id: "karakter", label: "Karakter", short: "Karakter" },
  { id: "emosi", label: "Perasaan & Pertemanan", short: "Perasaan" },
  { id: "bakat", label: "Bakat Ananda", short: "Bakat" },
];

const O_STATUS = {
  aman: { label: "Berkembang baik", fg: "var(--aman)", bg: "var(--aman-bg)" },
  perhatian: { label: "Perlu didampingi", fg: "var(--perhatian)", bg: "var(--perhatian-bg)" },
};
const O_LEVEL = {
  Konsisten: { fg: "#fff", bg: "var(--ungu)" },
  "Sering Muncul": { fg: "var(--ungu-700)", bg: "var(--ungu-100)" },
  "Kadang Muncul": { fg: "var(--perhatian)", bg: "var(--perhatian-bg)" },
  "Belum Muncul": { fg: "var(--ink-3)", bg: "var(--bg-2)" },
  Kuat: { fg: "#fff", bg: "var(--ungu)" },
  Sedang: { fg: "var(--ungu-700)", bg: "var(--ungu-100)" },
  Berkembang: { fg: "var(--ink-3)", bg: "var(--bg-2)" },
};

Object.assign(window, {
  CHILD, V, O_INTEL, O_DOMINAN, O_REKOM, O_DUKUNGAN, O_KARAKTER, KAR_SCALE,
  O_ASPEK, O_NAV, O_STATUS, O_LEVEL,
});
