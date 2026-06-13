// ============================================================
// DATA CONTOH — Fammi Intelligence Report
// Konteks: SMA Al Fath Cireundeu · semua angka di sini contoh
// ============================================================

const SCHOOL = "SMA Al Fath Cireundeu";
const ROLE = "Kepala Sekolah";
const PRINCIPAL = "Ibu Hj. Ratna Komalasari, M.Pd.";

// Skala status per modul (untuk legenda detail)
const SCALES = {
  karakter: ["Belum Muncul", "Kadang Muncul", "Sering Muncul", "Konsisten"],
  screening: ["Aman", "Perlu Perhatian", "Perlu Diwaspadai"],
  mi: ["Berkembang", "Sedang", "Kuat"],
};

// ---- Pilihan untuk filter periode ----
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const ROMAN = ["I", "II", "III", "IV", "V"];
const ACADEMIC_YEARS = ["2023/2024", "2024/2025", "2025/2026"];
const CAL_YEARS = [2024, 2025, 2026];

// Semester berdasarkan bulan: Juli–Desember = Ganjil, Januari–Juni = Genap
function semesterOf(month, calYear) {
  if (month >= 6) return { nama: "Ganjil", tahun: calYear + "/" + (calYear + 1) };
  return { nama: "Genap", tahun: (calYear - 1) + "/" + calYear };
}

// Label rentang waktu yang tampil di layar, dihitung dari pilihan filter
function computeRange(sel) {
  if (sel.type === "tahunan") return "Tahun Ajaran " + sel.year;
  if (sel.type === "bulanan") {
    const s = semesterOf(sel.month, sel.calYear);
    return MONTHS[sel.month] + " " + sel.calYear + " \u00b7 Semester " + s.nama + " " + s.tahun;
  }
  return "Minggu " + ROMAN[sel.week - 1] + " \u00b7 " + MONTHS[sel.month] + " " + sel.calYear;
}

const PERIODS = {
  mingguan: {
    id: "mingguan",
    label: "Mingguan",
    range: "Minggu IV · 24–30 Maret 2026",
    short: "minggu ini",
    empty: true,
  },
  bulanan: {
    id: "bulanan",
    label: "Bulanan",
    range: "Maret 2026 · Semester Genap 2025/2026",
    short: "bulan ini",
    empty: false,
    briefing: [
      "Ada dua hal yang perlu perhatian Anda bulan ini.",
      "Sebagian siswa di kelas X-A dan X-B masuk kategori perlu perhatian pada Screening, dan mayoritas orang tua meminta panduan pendampingan di rumah.",
    ],
    briefingMeta: "Dirangkum dari 3 produk \u00b7 67 siswa \u00b7 3 kelas",
    followups: [
      {
        priority: "tinggi",
        action: "Tindak lanjuti hasil Screening kelas X-B bersama guru BK.",
        trigger: "Beberapa siswa berstatus perlu diwaspadai pada aspek Emosional dan Relasi Pertemanan.",
        module: "Screening",
      },
      {
        priority: "sedang",
        action: "Pertimbangkan menjadwalkan seminar parenting semester ini.",
        trigger: "Sebagian besar orang tua meminta pendampingan yang lebih terstruktur di rumah.",
        module: "Rapor Karakter",
      },
      {
        priority: "sedang",
        action: "Tinjau pendekatan belajar kelas X-A.",
        trigger: "Kecerdasan dominan kelas adalah Interpersonal dan Kinestetik, cocok untuk metode kolaboratif dan praktik.",
        module: "Multiple Intelligence",
      },
    ],
    modules: {
      karakter: {
        headline: "Karakter Mandiri menguat bulan ini; Santun masih paling perlu pembiasaan.",
        metricLabel: "Capaian karakter lembaga",
        metric: "82%",
        metricNote: "Sangat Baik",
        // sebaran murid pada 4 tingkat status (% dari 67 siswa)
        dist: [
          { level: "Belum Muncul", value: 4 },
          { level: "Kadang Muncul", value: 17 },
          { level: "Sering Muncul", value: 41 },
          { level: "Konsisten", value: 38 },
        ],
        detail: {
          intro: "Enam karakter custom SMA Al Fath, dinilai dari dua sumber: sekolah dan rumah.",
          rows: [
            { name: "Mandiri", value: 90, trend: "naik" },
            { name: "Terampil", value: 84, trend: "stabil" },
            { name: "7 Kebiasaan Anak Hebat", value: 83, trend: "naik" },
            { name: "Aktif", value: 80, trend: "stabil" },
            { name: "Religius", value: 77, trend: "naik" },
            { name: "Santun", value: 74, trend: "turun" },
          ],
          note: "93% orang tua meminta panduan sederhana untuk membantu pembiasaan anak di rumah.",
        },
      },
      screening: {
        headline: "Mayoritas siswa berstatus Aman. Lima siswa di X-B perlu diwaspadai.",
        metricLabel: "Siswa berstatus Aman",
        metric: "72%",
        metricNote: "48 dari 67 siswa",
        dist: [
          { level: "Aman", value: 72, count: 48 },
          { level: "Perlu Perhatian", value: 21, count: 14 },
          { level: "Perlu Diwaspadai", value: 7, count: 5 },
        ],
        detail: {
          intro: "Lima aspek HEART. Nama siswa disamarkan dengan kode demi privasi.",
          rows: [
            { name: "Tolong Menolong", aman: 58, perhatian: 8, waspada: 1 },
            { name: "Relasi Pertemanan", aman: 51, perhatian: 13, waspada: 3 },
            { name: "Hiperaktivitas", aman: 54, perhatian: 11, waspada: 2 },
            { name: "Emosional", aman: 47, perhatian: 16, waspada: 4 },
            { name: "Agresi", aman: 55, perhatian: 10, waspada: 2 },
          ],
          flagged: [
            { code: "SMA-024", kelas: "X-B", note: "Emosional · Relasi Pertemanan" },
            { code: "SMA-031", kelas: "X-B", note: "Emosional" },
            { code: "SMA-038", kelas: "X-B", note: "Relasi Pertemanan" },
            { code: "SMA-052", kelas: "X-A", note: "Emosional" },
            { code: "SMA-061", kelas: "X-B", note: "Agresi" },
          ],
          note: "Topik ini sensitif, jadi rincian tiap siswa hanya dibuka bersama guru BK.",
        },
      },
      mi: {
        headline: "Kecerdasan dominan sekolah condong ke Interpersonal dan Kinestetik.",
        metricLabel: "Kecerdasan dominan teratas",
        metric: "Interpersonal",
        metricNote: "60% siswa · 40 dari 67",
        // top dominan (% siswa berstatus Kuat)
        dist: [
          { level: "Interpersonal", value: 60 },
          { level: "Intrapersonal", value: 45 },
          { level: "Kinestetik", value: 39 },
        ],
        detail: {
          intro: "Delapan kecerdasan, diukur pada 67 siswa. Persentase siswa berstatus Kuat.",
          rows: [
            { name: "Interpersonal", value: 60 },
            { name: "Intrapersonal", value: 45 },
            { name: "Kinestetik", value: 39 },
            { name: "Naturalis", value: 33 },
            { name: "Spasial", value: 33 },
            { name: "Verbal", value: 30 },
            { name: "Logika-Matematika", value: 25 },
            { name: "Musikal", value: 24 },
          ],
          note: "Profil ini cocok untuk metode kolaboratif, praktik langsung, dan kegiatan reflektif.",
        },
      },
    },
  },
  tahunan: {
    id: "tahunan",
    label: "Tahunan",
    range: "Tahun Ajaran 2025/2026",
    short: "tahun ini",
    empty: false,
    briefing: [
      "Secara umum kondisi sekolah stabil dan membaik dibanding tahun lalu.",
      "Tren karakter naik tipis sepanjang tahun, sementara aspek Emosional pada Screening tetap menjadi area yang perlu dijaga konsistensinya.",
    ],
    briefingMeta: "Rangkuman 2 semester \u00b7 3 produk \u00b7 67 siswa",
    followups: [
      {
        priority: "sedang",
        action: "Jadikan pendampingan emosional bagian dari program rutin tahunan.",
        trigger: "Aspek Emosional konsisten menjadi area paling sering perlu perhatian sepanjang tahun.",
        module: "Screening",
      },
      {
        priority: "sedang",
        action: "Lanjutkan program parenting yang sudah berjalan semester ini.",
        trigger: "Permintaan pendampingan di rumah tetap tinggi di kedua semester.",
        module: "Rapor Karakter",
      },
    ],
    modules: {
      karakter: {
        headline: "Capaian karakter naik dari 79% menjadi 82% sepanjang tahun.",
        metricLabel: "Capaian karakter lembaga",
        metric: "82%",
        metricNote: "naik dari 79%",
        dist: [
          { level: "Belum Muncul", value: 3 },
          { level: "Kadang Muncul", value: 15 },
          { level: "Sering Muncul", value: 42 },
          { level: "Konsisten", value: 40 },
        ],
        detail: {
          intro: "Rata-rata dua semester. Enam karakter custom SMA Al Fath.",
          rows: [
            { name: "Mandiri", value: 89, trend: "naik" },
            { name: "Terampil", value: 85, trend: "naik" },
            { name: "7 Kebiasaan Anak Hebat", value: 82, trend: "stabil" },
            { name: "Aktif", value: 81, trend: "naik" },
            { name: "Religius", value: 78, trend: "stabil" },
            { name: "Santun", value: 76, trend: "naik" },
          ],
          note: "Tren tahunan menunjukkan pembiasaan di sekolah mulai konsisten.",
        },
      },
      screening: {
        headline: "Proporsi siswa Aman membaik, namun aspek Emosional perlu dijaga.",
        metricLabel: "Siswa berstatus Aman",
        metric: "75%",
        metricNote: "rata-rata tahunan",
        dist: [
          { level: "Aman", value: 75, count: 50 },
          { level: "Perlu Perhatian", value: 19, count: 13 },
          { level: "Perlu Diwaspadai", value: 6, count: 4 },
        ],
        detail: {
          intro: "Rata-rata dua semester. Lima aspek HEART, nama disamarkan.",
          rows: [
            { name: "Tolong Menolong", aman: 59, perhatian: 7, waspada: 1 },
            { name: "Relasi Pertemanan", aman: 52, perhatian: 12, waspada: 3 },
            { name: "Hiperaktivitas", aman: 55, perhatian: 10, waspada: 2 },
            { name: "Emosional", aman: 49, perhatian: 15, waspada: 3 },
            { name: "Agresi", aman: 56, perhatian: 9, waspada: 2 },
          ],
          flagged: [],
          note: "Aspek Emosional konsisten menjadi area yang paling perlu perhatian.",
        },
      },
      mi: {
        headline: "Profil kecerdasan sekolah stabil: Interpersonal dan Kinestetik dominan.",
        metricLabel: "Kecerdasan dominan teratas",
        metric: "Interpersonal",
        metricNote: "59% siswa · rata-rata tahunan",
        dist: [
          { level: "Interpersonal", value: 59 },
          { level: "Intrapersonal", value: 44 },
          { level: "Kinestetik", value: 40 },
        ],
        detail: {
          intro: "Rata-rata dua semester pada 67 siswa.",
          rows: [
            { name: "Interpersonal", value: 59 },
            { name: "Intrapersonal", value: 44 },
            { name: "Kinestetik", value: 40 },
            { name: "Naturalis", value: 34 },
            { name: "Spasial", value: 32 },
            { name: "Verbal", value: 31 },
            { name: "Logika-Matematika", value: 26 },
            { name: "Musikal", value: 23 },
          ],
          note: "Konsisten sepanjang tahun, cocok dijadikan dasar program pengembangan.",
        },
      },
    },
  },
};

// ---- Data per kelas (periode bulanan berjalan) ----
// Angka direkonsiliasi dengan total lembaga: 67 siswa, Aman 48, Perhatian 14, Waspada 5.
const CLASSES = [
  { id: "X-A", wali: "Bpk. Andi Wijaya, S.Pd.", siswa: 23, karakter: 84, karakterTrend: "naik", aman: 18, perhatian: 4, waspada: 1, mi: "Interpersonal", status: "baik" },
  { id: "X-B", wali: "Ibu Sri Lestari, S.Pd.", siswa: 22, karakter: 79, karakterTrend: "turun", aman: 13, perhatian: 5, waspada: 4, mi: "Kinestetik", status: "perhatian" },
  { id: "X-C", wali: "Ibu Maya Putri, M.Pd.", siswa: 22, karakter: 83, karakterTrend: "naik", aman: 17, perhatian: 5, waspada: 0, mi: "Interpersonal", status: "baik" },
];

// ---- Navigasi utama Kepala Sekolah ----
const NAV = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "kelas", label: "Per Kelas" },
  { id: "karakter", label: "Rapor Karakter" },
  { id: "screening", label: "Screening & Mental" },
  { id: "analitik", label: "Analitik" },
  { id: "mi", label: "Bakat & Kecerdasan" },
  { id: "kepuasan", label: "Kepuasan" },
];

const MODULE_META = {
  karakter: { title: "Rapor Karakter", sub: "6 karakter · 4 tingkat status", Icon: window.IconHeart },
  screening: { title: "Screening Perilaku & Mental", sub: "5 aspek HEART · 3 tingkat status", Icon: window.IconShield },
  mi: { title: "Multiple Intelligence", sub: "8 kecerdasan · 3 tingkat status", Icon: window.IconBrain },
};

// pemetaan warna status (dipakai hemat, hanya penanda kecil)
const STATUS_TONE = {
  "Aman": "aman", "Konsisten": "aman", "Sering Muncul": "aman",
  "Perlu Perhatian": "perhatian", "Kadang Muncul": "perhatian",
  "Perlu Diwaspadai": "waspada", "Belum Muncul": "waspada",
};

Object.assign(window, { SCHOOL, ROLE, PRINCIPAL, SCALES, PERIODS, MODULE_META, STATUS_TONE, MONTHS, ROMAN, ACADEMIC_YEARS, CAL_YEARS, computeRange, CLASSES, NAV });
