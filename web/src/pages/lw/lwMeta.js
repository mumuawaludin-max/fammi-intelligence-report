/**
 * Kamus statis modul Leadership & Wellbeing -- padanan scMeta.js. Definisi, daftar indikator,
 * dan cutoff kategori di sini dikutip persis dari kedua laporan sumber (Hasil Pemetaan Asesmen
 * Wellbeing & Leadership, dan Laporan Analisis Kesehatan Mental Guru, Dinas Pendidikan Kota
 * Bandung). Cutoff HANYA dipakai untuk catatan tampilan (footnote skala) -- kategori tiap baris
 * data sudah final dari sumbernya, FIR tidak menghitung ulang status dari skor di sini.
 */

export const LEAD_ASPEK_INFO = {
  L: {
    label: "Leadership & Innovation",
    deskripsi: "Kemampuan memimpin perubahan, mengelola risiko, dan berkolaborasi secara internal di tengah keberagaman tim.",
    indikator: ["Inovatif", "Manajemen Krisis dan Risiko", "Adaptif", "Mengelola Keberagaman", "Kolaboratif (Internal)"],
  },
  E: {
    label: "External Collaboration",
    deskripsi: "Kemampuan membangun kemitraan, kolaborasi, dan eksekusi program bersama siswa, orang tua, serta mitra sekolah.",
    indikator: ["Kepemimpinan Digital", "Berorientasi Pada Siswa & Orangtua", "Kemitraan & Kolaborasi", "Perencanaan Strategis", "Mendorong Eksekusi Program"],
  },
  A: {
    label: "Administrative Excellence",
    deskripsi: "Kemampuan mengelola keuangan, operasional, teknologi, dan pengembangan SDM sekolah.",
    indikator: ["Manajemen Keuangan", "Komersial & Pendanaan Sekolah", "Sistem & Operasional Sekolah", "Tech Savvy (Paham Teknologi)", "Pengembangan SDM"],
  },
  D: {
    label: "Dedication to Growth",
    deskripsi: "Keteladanan, integritas, dan kemampuan menyelesaikan masalah serta berkomunikasi secara efektif dan empatik.",
    indikator: ["Teladan & Integritas", "Problem Solving", "Manajemen Waktu & Prioritas", "Komunikasi Efektif", "Empati"],
  },
};

/** Urutan tampilan 4 aspek LEAD, dipakai kartu skor section 01-A. */
export const LEAD_ASPEK_URUTAN = ["L", "E", "A", "D"];

/** Cutoff persentase skor LEAD -> kategori kesiapan memimpin (skala 0-100), dikutip persis dari
 * legenda "PENILAIAN ASESMEN KEPEMIMPINAN (LEADERSHIP)" di dokumen sumber. */
export const LEAD_CUTOFF = [
  { kategori: "Perlu Penguatan", min: 0, max: 20, toneVar: "--lw-lead-perlu-penguatan" },
  { kategori: "Cukup Baik", min: 21, max: 40, toneVar: "--lw-lead-cukup-baik" },
  { kategori: "Baik", min: 41, max: 60, toneVar: "--lw-lead-baik" },
  { kategori: "Sangat Baik", min: 61, max: 80, toneVar: "--lw-lead-sangat-baik" },
  { kategori: "Istimewa", min: 81, max: 100, toneVar: "--lw-lead-istimewa" },
];

export function leadKategoriTone(kategori) {
  return LEAD_CUTOFF.find((c) => c.kategori === kategori)?.toneVar || "--lw-lead-baik";
}

export const PROTEK_DIMENSI_INFO = {
  P: {
    label: "Penerimaan Diri",
    icon: "P",
    deskripsi: "Sikap positif terhadap diri sendiri dengan menerima kekurangan dan pengalaman masa lalu sebagai bagian dari pertumbuhan pribadi.",
  },
  R: {
    label: "Relasi Positif dengan Orang Lain",
    icon: "R",
    deskripsi: "Kemampuan membangun hubungan kerja yang hangat, bermakna, serta didasari empati dan kepedulian.",
  },
  O: {
    label: "Optimalisasi Potensi Diri",
    icon: "O",
    deskripsi: "Kesadaran untuk terus mengembangkan keterampilan dan kompetensi guna mencapai performa terbaik.",
  },
  T: {
    label: "Tujuan Hidup",
    icon: "T",
    deskripsi: "Kejelasan visi dan arah dalam bekerja serta keyakinan terhadap tujuan jangka panjang yang ingin dicapai.",
  },
  E: {
    label: "Eksplorasi Lingkungan",
    icon: "Ek",
    deskripsi: "Kemampuan menciptakan lingkungan kerja yang kondusif untuk pertumbuhan psikologis dan kolaborasi aktif.",
  },
  K: {
    label: "Kemandirian",
    icon: "K",
    deskripsi: "Kemampuan mengambil keputusan berdasarkan standar profesional tanpa bergantung pada validasi eksternal.",
  },
};

/** Urutan tampilan 6 dimensi PROTEK, dipakai kartu skor section 02-A. */
export const PROTEK_DIMENSI_URUTAN = ["P", "R", "O", "T", "E", "K"];

/** Cutoff skor total PROTEK (gabungan 6 dimensi x 7 item, skala 1-252) -> kategori kondisi
 * kesehatan mental, dikutip persis dari halaman 4 Laporan Analisis Kesehatan Mental Guru.
 * Tidak ada cutoff resmi per-dimensi di dokumen sumber -- kategori per-dimensi tiap guru
 * dipakai apa adanya dari data, bukan dihitung ulang dari rentang ini. */
export const PROTEK_CUTOFF = [
  { kategori: "Perlu Konsultasi", min: 1, max: 35, toneVar: "--lw-protek-perlu-konsultasi" },
  { kategori: "Waspada", min: 36, max: 70, toneVar: "--lw-protek-waspada" },
  { kategori: "Perlu Perhatian", min: 71, max: 140, toneVar: "--lw-protek-perlu-perhatian" },
  { kategori: "Baik", min: 141, max: 252, toneVar: "--lw-protek-baik" },
];

export function protekKategoriTone(kategori) {
  return PROTEK_CUTOFF.find((c) => c.kategori === kategori)?.toneVar || "--lw-protek-baik";
}

/** Tone kotak status per kategori dimensi (Baik/Perlu Perhatian/Waspada), dipakai kartu
 * perbandingan section 02-B -- padanan statusTone() di ScDimensiPerbandingan.jsx. */
export function protekStatusTone(kategori) {
  if (kategori === "Baik") return "aligned";
  if (kategori === "Perlu Perhatian") return "attention";
  if (kategori === "Waspada" || kategori === "Perlu Konsultasi") return "attention";
  return "light";
}
