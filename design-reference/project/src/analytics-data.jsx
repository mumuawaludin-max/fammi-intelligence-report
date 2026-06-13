// ============================================================
// ANALYTICS DATA — deeper, explorable screening analysis.
// Konteks: SMA Al Fath Cireundeu · 67 siswa · 3 kelas · contoh.
// Lima aspek HEART: Tolong Menolong, Relasi Pertemanan,
// Hiperaktivitas, Emosional, Agresi.
// ============================================================

const A_ASPECTS = [
  { key: "TM", name: "Tolong Menolong" },
  { key: "RP", name: "Relasi Pertemanan" },
  { key: "HA", name: "Hiperaktivitas" },
  { key: "EM", name: "Emosional" },
  { key: "AG", name: "Agresi" },
];
const A_MONTHS = ["Okt", "Nov", "Des", "Jan", "Feb", "Mar"];

// % siswa berisiko (perhatian + waspada) per aspek, 6 bulan
const A_TREND = {
  EM: [22, 24, 26, 27, 29, 30],
  RP: [20, 21, 21, 22, 23, 24],
  HA: [18, 17, 18, 19, 19, 19],
  AG: [16, 15, 16, 17, 18, 18],
  TM: [12, 12, 11, 13, 12, 13],
};

// peta panas: % berisiko per aspek (baris) × kelas (kolom)
const A_CLASSES = ["X-A", "X-B", "X-C"];
const A_HEAT = {
  TM: { "X-A": 9, "X-B": 14, "X-C": 9 },
  RP: { "X-A": 14, "X-B": 30, "X-C": 13 },
  HA: { "X-A": 12, "X-B": 22, "X-C": 14 },
  EM: { "X-A": 22, "X-B": 38, "X-C": 18 },
  AG: { "X-A": 11, "X-B": 20, "X-C": 12 },
};

// aliran status dibanding periode lalu (total 67 siswa)
const A_FLOW = [
  { key: "tetap_aman", label: "Tetap aman", value: 42, tone: "aman", desc: "Stabil di zona aman sejak bulan lalu." },
  { key: "pulih", label: "Pulih", value: 6, tone: "aman", desc: "Naik dari berisiko menjadi aman.", sign: "+" },
  { key: "baru", label: "Risiko baru", value: 9, tone: "perhatian", desc: "Turun dari aman menjadi berisiko bulan ini.", sign: "!" },
  { key: "menetap", label: "Menetap berisiko", value: 10, tone: "waspada", desc: "Belum membaik selama 2 bulan atau lebih." },
];

// keterkaitan antar-aspek pada siswa berisiko (berapa siswa mengalami keduanya)
const A_COOCCUR = [
  { a: "Emosional", b: "Relasi Pertemanan", n: 7 },
  { a: "Emosional", b: "Hiperaktivitas", n: 4 },
  { a: "Relasi Pertemanan", b: "Agresi", n: 3 },
  { a: "Hiperaktivitas", b: "Agresi", n: 3 },
  { a: "Emosional", b: "Agresi", n: 2 },
];

// sebaran per gender (% berisiko per aspek utama)
const A_GENDER = [
  { aspek: "Emosional", "Perempuan": 33, "Laki-laki": 27 },
  { aspek: "Relasi Pertemanan", "Perempuan": 22, "Laki-laki": 26 },
  { aspek: "Agresi", "Perempuan": 12, "Laki-laki": 24 },
];

// scatter per-siswa: capaian karakter (x) vs skor risiko screening (y)
// dibangkitkan deterministik agar konsisten tiap render
const A_SCATTER = (() => {
  const cls = [
    { id: "X-A", n: 23, kar: 84, risk: 22 },
    { id: "X-B", n: 22, kar: 79, risk: 41 },
    { id: "X-C", n: 22, kar: 83, risk: 23 },
  ];
  const rnd = (s) => { const x = Math.sin(s * 91.7) * 43758.5453; return x - Math.floor(x); };
  const pts = []; let i = 0;
  cls.forEach((c) => {
    for (let k = 0; k < c.n; k++) {
      const j = ++i;
      const kar = Math.max(58, Math.min(98, Math.round(c.kar + (rnd(j) - 0.5) * 26)));
      // korelasi negatif lembut: karakter tinggi → risiko cenderung rendah
      const base = c.risk + (rnd(j * 3.1) - 0.5) * 34 - (kar - c.kar) * 0.5;
      const risk = Math.max(2, Math.min(86, Math.round(base)));
      pts.push({ kelas: c.id, kar, risk });
    }
  });
  return pts;
})();

// daftar pantau dini (early warning) — kode samaran
const A_WATCH = [
  { code: "SMA-024", kelas: "X-B", score: 82, trend: "naik", status: "waspada", signals: ["Emosional menurun 3 bulan", "Kehadiran ikut turun"] },
  { code: "SMA-031", kelas: "X-B", score: 74, trend: "naik", status: "waspada", signals: ["Emosional fluktuatif tajam"] },
  { code: "SMA-052", kelas: "X-A", score: 69, trend: "naik", status: "perhatian", signals: ["Skor turun signifikan bulan ini"] },
  { code: "SMA-038", kelas: "X-B", score: 66, trend: "stabil", status: "perhatian", signals: ["Relasi pertemanan melemah"] },
  { code: "SMA-061", kelas: "X-B", score: 61, trend: "naik", status: "perhatian", signals: ["Indikasi Agresi meningkat"] },
  { code: "SMA-070", kelas: "X-C", score: 54, trend: "naik", status: "perhatian", signals: ["Sinyal awal Emosional"] },
];

// insight utama — temuan + bukti + mengapa penting + tindakan
const A_INSIGHTS = [
  {
    tone: "waspada",
    tag: "Tren menurun",
    finding: "Aspek Emosional terus melemah enam bulan terakhir.",
    evidence: "Siswa berisiko Emosional naik dari 22% ke 30%.",
    why: "Bila dibiarkan, tekanan emosi menurunkan fokus belajar dan kualitas relasi pertemanan.",
    action: "Jadwalkan sesi BK terfokus emosi dan pantau 8 siswa di daftar pantau dini.",
    metric: "+8 poin",
  },
  {
    tone: "perhatian",
    tag: "Terkonsentrasi",
    finding: "Beban risiko paling besar di kelas X-B.",
    evidence: "13 dari 19 siswa berisiko sekolah berasal dari X-B.",
    why: "Polanya kelas, bukan individu — menandakan dinamika kelas yang perlu dibenahi bersama.",
    action: "Obrolan dengan wali kelas X-B; pertimbangkan intervensi tingkat kelas, bukan hanya per anak.",
    metric: "68%",
  },
  {
    tone: "ungu",
    tag: "Keterkaitan",
    finding: "Emosional dan Relasi Pertemanan kerap muncul bersama.",
    evidence: "7 siswa mengalami keduanya sekaligus.",
    why: "Kesulitan relasi dan tekanan emosi saling memperkuat — menangani satu membantu yang lain.",
    action: "Program penguatan relasi sosial (mis. buddy system) menjawab dua aspek sekaligus.",
    metric: "7 siswa",
  },
];

// ringkasan angka untuk strip metrik atas
const A_KPI = [
  { label: "Siswa terpantau", value: "67", note: "3 kelas", tone: "ungu" },
  { label: "Berisiko saat ini", value: "19", note: "28% dari total", tone: "perhatian" },
  { label: "Perlu diwaspadai", value: "5", note: "butuh BK", tone: "waspada" },
  { label: "Pulih bulan ini", value: "6", note: "kembali aman", tone: "aman" },
];

Object.assign(window, {
  A_ASPECTS, A_MONTHS, A_TREND, A_CLASSES, A_HEAT, A_FLOW, A_COOCCUR,
  A_GENDER, A_SCATTER, A_WATCH, A_INSIGHTS, A_KPI,
});
