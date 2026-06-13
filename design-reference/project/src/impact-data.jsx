// ============================================================
// IMPACT DATA — "Dampak Fammi" untuk Yayasan.
// Menjawab dua pertanyaan strategis dengan bukti:
//   1) Fammi meningkatkan KUALITAS PENDIDIKAN
//   2) Fammi meningkatkan CITRA SEKOLAH di mata orang tua
// Semua angka adalah contoh untuk rancangan.
// Tiap blok membawa "insight" (artinya apa) agar mudah dipahami.
// ============================================================

const IMPACT_TERMS = ["Sem 1\n23/24", "Sem 2\n23/24", "Sem 1\n24/25", "Sem 2\n24/25", "Sem 1\n25/26"];
const IMPACT_SINCE = "Sejak memakai Fammi · 5 semester terakhir";

// ---- Pilar 1: KUALITAS PENDIDIKAN ----
const Q_HEADLINE = { since: "+11", unit: "poin", label: "kenaikan rata-rata capaian karakter sejak memakai Fammi" };

// tren naik: capaian karakter (tertimbang) & % siswa "Aman"
const Q_GROWTH = {
  karakter: [71, 74, 77, 79, 82],   // %
  aman: [62, 66, 70, 73, 76],       // % siswa Aman (screening)
};
const Q_GROWTH_INSIGHT_KAR = "Capaian karakter naik konsisten lima semester berturut — pembiasaan di sekolah benar-benar berbuah, bukan kebetulan satu periode.";
const Q_GROWTH_INSIGHT_AMAN = "Makin banyak siswa berada di zona Aman tiap semester — iklim sosial-emosional sekolah membaik secara terukur.";

// corong deteksi dini → pendampingan → pulih (1 tahun ajaran)
const Q_FUNNEL = [
  { label: "Terdeteksi lebih dini", value: 142, note: "sinyal tertangkap sebelum jadi masalah besar", tone: "ungu" },
  { label: "Mendapat pendampingan", value: 128, note: "ditindaklanjuti guru / BK", tone: "perhatian" },
  { label: "Membaik / pulih", value: 96, note: "kembali ke kondisi sehat", tone: "aman" },
];
const Q_FUNNEL_INSIGHT = "Dari 142 siswa yang terdeteksi dini, 96 sudah membaik. Tanpa screening rutin, sebagian besar sinyal ini baru ketahuan saat sudah terlambat.";

// penurunan siswa berisiko (before → now)
const Q_RISK = { before: 38, now: 24, beforeLabel: "Sebelum Fammi", nowLabel: "Sekarang" };
const Q_RISK_INSIGHT = "Proporsi siswa berisiko turun dari 38% menjadi 24% — setara ±170 siswa lintas yayasan yang kondisinya kini lebih baik.";

// penyelesaian tindak lanjut & guru menyesuaikan pendekatan
const Q_FOLLOWUP = { pct: 88, label: "tindak lanjut diselesaikan", note: "rekomendasi Fammi yang ditindaklanjuti tuntas" };
const Q_TEACHER = { pct: 91, label: "guru menyesuaikan pendekatan", note: "berkat memahami karakter & kondisi siswa dari laporan" };

// penjurusan sesuai bakat (produk Bakat)
const Q_TALENT = { matched: 410, label: "siswa diarahkan sesuai bakat", note: "ke ekstrakurikuler & peminatan yang cocok" };
const Q_TALENT_INSIGHT = "Pemetaan 8 kecerdasan membuat penjurusan dan ekskul lebih tepat sasaran — siswa belajar di jalur yang sungguh menjadi kekuatannya.";

// ringkasan "dengan cara apa" kualitas pendidikan meningkat
const Q_LEVERS = [
  { Icon: "IconHeart", prod: "karakter", title: "Pembiasaan karakter terpantau", text: "Sekolah melihat karakter mana yang menguat dan mana yang perlu dibiasakan, lalu menindak lebih terarah." },
  { Icon: "IconShield", prod: "screening", title: "Deteksi dini masalah emosi", text: "Sinyal sosial-emosional tertangkap lebih awal sehingga pendampingan diberikan sebelum terlambat." },
  { Icon: "IconBrain", prod: "mi", title: "Belajar sesuai kekuatan", text: "Pemetaan bakat mengarahkan siswa ke kegiatan dan jurusan yang paling cocok." },
  { Icon: "IconUsers", prod: null, title: "Guru lebih siap mendampingi", text: "Laporan menyatukan kondisi anak di sekolah dan rumah, membuat pendekatan guru lebih tepat." },
];

// ---- Pilar 2: CITRA SEKOLAH DI MATA ORANG TUA ----
const I_HEADLINE = { value: 86, unit: "%", label: "orang tua merekomendasikan sekolah ini ke keluarga lain" };

// tren kepuasan (rata-rata /5) naik
const I_SAT_TREND = [3.8, 3.9, 4.0, 4.1, 4.2];
const I_SAT_INSIGHT = "Kepuasan orang tua naik tiap semester sejak laporan Fammi hadir — komunikasi yang transparan menumbuhkan kepercayaan.";

// bukti citra sekolah (kartu statistik + makna)
const I_PROOF = [
  { key: "recommend", value: "86%", label: "Merekomendasikan sekolah", insight: "Orang tua yang puas menjadi 'duta' sekolah — promosi paling dipercaya calon orang tua baru.", Icon: "IconHeart", tone: "aman" },
  { key: "cared", value: "87%", label: "Merasa anak diperhatikan sekolah", insight: "Orang tua merasa tenang karena sekolah hadir konsisten, bukan hanya saat ada masalah.", Icon: "IconCalmFace", tone: "ungu" },
  { key: "engage", value: "83%", label: "Membaca laporan sampai tuntas", insight: "Laporan benar-benar dibaca, bukan diabaikan — bukti relevansi dan keterlibatan orang tua.", Icon: "IconLayers", tone: "ungu" },
  { key: "retain", value: "95%", label: "Daftar ulang tahun berikutnya", insight: "Kepercayaan berujung kesetiaan — orang tua memilih bertahan di sekolah yang sama.", Icon: "IconShield", tone: "aman" },
  { key: "referral", value: "34%", label: "Pendaftar baru dari rekomendasi", insight: "Sepertiga murid baru datang dari mulut ke mulut orang tua lama — citra sekolah tumbuh organik.", Icon: "IconUsers", tone: "perhatian" },
  { key: "response", value: "4,2/5", label: "Penilaian mutu laporan", insight: "Mutu komunikasi yang tinggi memperkuat persepsi profesionalisme sekolah.", Icon: "IconSparkle", tone: "ungu" },
];

// nada testimoni (donut) — apresiasi dominan
const I_SENTIMENT = [
  { label: "Apresiasi & terima kasih", value: 99, color: "var(--aman)" },
  { label: "Saran membangun", value: 1, color: "var(--ungu)" },
];
const I_SENTIMENT_INSIGHT = "Nyaris seluruh pesan orang tua bernada apresiasi — sentimen positif ini adalah modal citra yang sulit dibeli dengan iklan.";

// satu kutipan unggulan
const I_QUOTE = {
  text: "Banyak perubahan positif dari anak saya. Kami merasa tenang karena sekolah benar-benar mengenal dan mendampingi anak kami.",
  by: "Orang tua siswa · SMA Al Fath",
};

// ---- penutup: mengapa mempercayai Fammi (CTA) ----
const TRUST_POINTS = [
  { value: "1.209", label: "siswa terpantau menyeluruh", Icon: "IconUsers" },
  { value: "6", label: "sekolah dalam satu pandangan", Icon: "IconBuilding" },
  { value: "3", label: "dimensi: karakter, emosi, bakat", Icon: "IconLayers" },
];
const TRUST_LEAD = "Satu sistem yang membuat mutu pendidikan terukur dan citra sekolah menguat — dengan bukti, bukan klaim.";

Object.assign(window, {
  IMPACT_TERMS, IMPACT_SINCE, Q_HEADLINE, Q_GROWTH, Q_GROWTH_INSIGHT_KAR, Q_GROWTH_INSIGHT_AMAN,
  Q_FUNNEL, Q_FUNNEL_INSIGHT, Q_RISK, Q_RISK_INSIGHT, Q_FOLLOWUP, Q_TEACHER, Q_TALENT, Q_TALENT_INSIGHT, Q_LEVERS,
  I_HEADLINE, I_SAT_TREND, I_SAT_INSIGHT, I_PROOF, I_SENTIMENT, I_SENTIMENT_INSIGHT, I_QUOTE,
  TRUST_POINTS, TRUST_LEAD,
});
