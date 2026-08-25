/**
 * Kamus statis modul Wellbeing Guru (kerangka PROTEK) -- padanan scMeta.js/paTokens.
 * Definisi dimensi dan ambang kategori di sini dikutip dari instrumen PROTEK yang dipakai
 * psikolog Fammi. Ambang HANYA untuk keperluan tampilan (legenda, warna, catatan kaki);
 * kategori tiap baris data sudah final dari hulu, FIR tidak menghitung ulang status.
 */

export const PROTEK_URUTAN = ["P", "R", "O", "T", "E", "K"];

export const PROTEK_INFO = {
  P: {
    label: "Penerimaan Diri",
    pendek: "Penerimaan",
    ringkas: "Menerima diri apa adanya",
    deskripsi: "Sikap positif terhadap diri sendiri: menerima kekurangan dan pengalaman masa lalu sebagai bagian dari pertumbuhan pribadi.",
    arti: "Guru yang sulit menerima diri cenderung menahan diri mencoba hal baru. Perbaikannya lewat umpan balik yang spesifik, bukan pujian umum.",
  },
  R: {
    label: "Relasi Positif",
    pendek: "Relasi",
    ringkas: "Hubungan hangat antarrekan",
    deskripsi: "Kemampuan membangun hubungan kerja yang hangat dan bermakna, didasari empati dan kepedulian antarrekan.",
    arti: "Dimensi ini biasanya jadi modal terkuat sebuah lembaga. Kalau kuat, ia bisa dipakai sebagai jalur pendampingan antarrekan untuk dimensi lain yang lemah.",
  },
  O: {
    label: "Optimalisasi Potensi",
    pendek: "Optimalisasi",
    ringkas: "Terus mengembangkan diri",
    deskripsi: "Kesadaran untuk terus mengembangkan keterampilan dan kompetensi guna mencapai performa terbaik sebagai pendidik.",
    arti: "Kalau hanya sedikit guru yang tertinggal di dimensi ini, persoalannya biasanya individual dan bukan sistemik.",
  },
  T: {
    label: "Tujuan Hidup",
    pendek: "Tujuan",
    ringkas: "Arah yang jelas dalam bekerja",
    deskripsi: "Kejelasan visi dan arah dalam bekerja serta keyakinan terhadap tujuan jangka panjang yang ingin dicapai.",
    arti: "Dimensi ini merespons percakapan pengembangan karier, bukan pelatihan teknis. Guru perlu tahu jalur lima tahun ke depannya seperti apa.",
  },
  E: {
    label: "Eksplorasi Lingkungan",
    pendek: "Eksplorasi",
    ringkas: "Menata beban dan lingkungan",
    deskripsi: "Kemampuan menata beban dan menciptakan lingkungan kerja yang kondusif bagi pertumbuhan psikologis serta kolaborasi.",
    arti: "Keluhan di dimensi ini biasanya menunjuk beban administrasi di luar mengajar, dan itu bisa diperbaiki lewat penataan proses, bukan pelatihan mental.",
  },
  K: {
    label: "Kemandirian",
    pendek: "Kemandirian",
    ringkas: "Berani memutuskan sendiri",
    deskripsi: "Kemampuan mengambil keputusan berdasarkan standar profesional tanpa bergantung pada validasi eksternal.",
    arti: "Kalau banyak guru tertinggal di dimensi ini, akarnya sering ada pada kebiasaan pengambilan keputusan di sekolah, jadi perbaikannya di sisi pimpinan.",
  },
};

/** Ambang kategori per dimensi (skala 0-42) yang dipakai psikolog Fammi. */
export const AMBANG_DIMENSI = { baik: 29, perluPerhatian: 23 };

export function katDimensi(nilai) {
  if (nilai >= AMBANG_DIMENSI.baik) return "Baik";
  if (nilai >= AMBANG_DIMENSI.perluPerhatian) return "Perlu Perhatian";
  return "Waspada";
}

/**
 * Ambang skor total (skala 1-252) mengikuti instrumen aslinya. Perhatikan bahwa ambang ini
 * TIDAK sebangun dengan ambang per dimensi di atas: keduanya diturunkan dari sumber berbeda,
 * jadi seorang guru bisa berkategori Baik pada skor total sekaligus punya dimensi tertinggal.
 * Itu bukan bug, dan catatan kaki di layar Analisis Dimensi menjelaskannya ke pengguna.
 */
export const PROTEK_CUTOFF = [
  { kategori: "Perlu Konsultasi", min: 1, max: 35, warna: "var(--lw-protek-perlu-konsultasi)" },
  { kategori: "Waspada", min: 36, max: 70, warna: "var(--lw-protek-waspada)" },
  { kategori: "Perlu Perhatian", min: 71, max: 140, warna: "var(--lw-protek-perlu-perhatian)" },
  { kategori: "Baik", min: 141, max: 252, warna: "var(--lw-protek-baik)" },
];

/** Warna tinta untuk sebuah kategori, dipakai pil, angka, dan batang. */
export function warnaKategori(kategori) {
  if (kategori === "Baik") return "var(--lw-protek-baik)";
  if (kategori === "Perlu Perhatian") return "var(--lw-protek-perlu-perhatian)";
  if (kategori === "Waspada") return "var(--lw-protek-waspada)";
  return "var(--lw-protek-perlu-konsultasi)";
}

export function latarKategori(kategori) {
  if (kategori === "Baik") return "var(--lw-protek-baik-bg)";
  if (kategori === "Perlu Perhatian") return "var(--lw-protek-perlu-perhatian-bg)";
  if (kategori === "Waspada") return "var(--lw-protek-waspada-bg)";
  return "var(--lw-protek-perlu-konsultasi-bg)";
}

/**
 * Skala warna peta jenjang x dimensi. Ambangnya dirapatkan ke rentang skor yang benar-benar
 * muncul di data (sekitar 27 sampai 39), supaya perbedaan antarsel terbaca dan tidak menumpuk
 * di satu warna. Lima tingkat, dari terkuat ke terlemah.
 */
export const SKALA_PETA = [
  { min: 36, bg: "#d6efe1", ink: "#1b6e42" },
  { min: 34, bg: "#e8f4ec", ink: "#2e9e6b" },
  { min: 32, bg: "#f6f2e5", ink: "#8a6c1c" },
  { min: 30, bg: "#faeed6", ink: "#a8760f" },
  { min: -Infinity, bg: "#f9dde1", ink: "#b8354a" },
];

export function warnaPeta(nilai) {
  return SKALA_PETA.find((s) => nilai >= s.min) || SKALA_PETA[SKALA_PETA.length - 1];
}

/** Label bulan dari periode_id "YYYY-MM". */
const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function labelPeriode(periodeId, pendek = false) {
  if (!periodeId) return "";
  const [tahun, bulan] = String(periodeId).split("-").map(Number);
  const nama = (pendek ? BULAN_PENDEK : BULAN)[bulan - 1] || "";
  return `${nama} ${tahun}`.trim();
}
