// ============================================================
// DATA CONTOH — Fammi Intelligence Report · Yayasan
// Konteks: Yayasan Pendidikan Al Fath (6 sekolah · 3 jenjang)
// Semua angka di sini adalah contoh.
// ============================================================

const FOUNDATION = "Yayasan Pendidikan Al Fath";
const Y_ROLE = "Pengurus Yayasan";

// ---- Pilihan filter periode (sama pola dengan dashboard sekolah) ----
const Y_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const Y_ROMAN = ["I", "II", "III", "IV", "V"];
const Y_ACADEMIC_YEARS = ["2023/2024", "2024/2025", "2025/2026"];
const Y_CAL_YEARS = [2024, 2025, 2026];

function ySemesterOf(month, calYear) {
  if (month >= 6) return { nama: "Ganjil", tahun: calYear + "/" + (calYear + 1) };
  return { nama: "Genap", tahun: (calYear - 1) + "/" + calYear };
}
function yComputeRange(sel) {
  if (sel.type === "tahunan") return "Tahun Ajaran " + sel.year;
  if (sel.type === "bulanan") {
    const s = ySemesterOf(sel.month, sel.calYear);
    return Y_MONTHS[sel.month] + " " + sel.calYear + " \u00b7 Semester " + s.nama + " " + s.tahun;
  }
  return "Minggu " + Y_ROMAN[sel.week - 1] + " \u00b7 " + Y_MONTHS[sel.month] + " " + sel.calYear;
}

// ---- Jenjang ----
const JENJANG = [
  { id: "SD", label: "SD", full: "Sekolah Dasar" },
  { id: "SMP", label: "SMP", full: "Sekolah Menengah Pertama" },
  { id: "SMA", label: "SMA", full: "Sekolah Menengah Atas" },
];

// ---- Sekolah dalam naungan yayasan ----
// karakter & aman dalam persen; waspada = jumlah siswa berstatus perlu diwaspadai
const SCHOOLS = [
  { id: "sd-cir", name: "SD Al Fath Cireundeu", short: "SD Cireundeu", jenjang: "SD", kota: "Tangerang Selatan",
    siswa: 312, kelas: 12, karakter: 86, karakterTrend: "naik", amanPct: 81, perhatianPct: 14, waspadaPct: 5, waspada: 6,
    mi: "Kinestetik", topChar: "Mandiri", weakChar: "Santun", weakAspect: "Hiperaktivitas", status: "baik" },
  { id: "sd-pam", name: "SD Al Fath Pamulang", short: "SD Pamulang", jenjang: "SD", kota: "Tangerang Selatan",
    siswa: 268, kelas: 10, karakter: 83, karakterTrend: "stabil", amanPct: 78, perhatianPct: 16, waspadaPct: 6, waspada: 9,
    mi: "Naturalis", topChar: "Aktif", weakChar: "Religius", weakAspect: "Emosional", status: "baik" },
  { id: "smp-cir", name: "SMP Al Fath Cireundeu", short: "SMP Cireundeu", jenjang: "SMP", kota: "Tangerang Selatan",
    siswa: 224, kelas: 8, karakter: 80, karakterTrend: "naik", amanPct: 74, perhatianPct: 19, waspadaPct: 7, waspada: 11,
    mi: "Interpersonal", topChar: "Terampil", weakChar: "Santun", weakAspect: "Relasi Pertemanan", status: "baik" },
  { id: "smp-dep", name: "SMP Al Fath Depok", short: "SMP Depok", jenjang: "SMP", kota: "Depok",
    siswa: 196, kelas: 7, karakter: 76, karakterTrend: "turun", amanPct: 68, perhatianPct: 22, waspadaPct: 10, waspada: 14,
    mi: "Kinestetik", topChar: "Aktif", weakChar: "Santun", weakAspect: "Emosional", status: "perhatian" },
  { id: "sma-cir", name: "SMA Al Fath Cireundeu", short: "SMA Cireundeu", jenjang: "SMA", kota: "Tangerang Selatan",
    siswa: 67, kelas: 3, karakter: 82, karakterTrend: "naik", amanPct: 72, perhatianPct: 21, waspadaPct: 7, waspada: 5,
    mi: "Interpersonal", topChar: "Mandiri", weakChar: "Santun", weakAspect: "Emosional", status: "baik" },
  { id: "sma-ser", name: "SMA Al Fath Serpong", short: "SMA Serpong", jenjang: "SMA", kota: "Tangerang Selatan",
    siswa: 142, kelas: 6, karakter: 78, karakterTrend: "stabil", amanPct: 70, perhatianPct: 21, waspadaPct: 9, waspada: 12,
    mi: "Intrapersonal", topChar: "Religius", weakChar: "Santun", weakAspect: "Relasi Pertemanan", status: "perhatian" },
];

// ---- Agregat per jenjang (dihitung, tertimbang jumlah siswa) ----
function jenjangAgg(jid) {
  const list = SCHOOLS.filter((s) => s.jenjang === jid);
  const siswa = list.reduce((a, s) => a + s.siswa, 0);
  const kelas = list.reduce((a, s) => a + s.kelas, 0);
  const waspada = list.reduce((a, s) => a + s.waspada, 0);
  const wKar = Math.round(list.reduce((a, s) => a + s.karakter * s.siswa, 0) / siswa);
  const wAman = Math.round(list.reduce((a, s) => a + s.amanPct * s.siswa, 0) / siswa);
  const perhatian = list.filter((s) => s.status === "perhatian").length;
  return { jid, sekolah: list.length, siswa, kelas, waspada, karakter: wKar, aman: wAman, perhatian, list };
}

// ---- Briefing tingkat yayasan ----
const Y_BRIEFING = {
  eyebrow: "RINGKASAN LINTAS SEKOLAH",
  lead: "Secara umum keenam sekolah dalam kondisi sehat dan membaik.",
  rest: "Dua sekolah perlu perhatian, yaitu SMP Al Fath Depok dan SMA Al Fath Serpong. Aspek Emosional dan Relasi Pertemanan paling sering muncul sebagai area yang perlu dijaga di jenjang menengah.",
  meta: "Dirangkum dari 3 produk · 6 sekolah · 1.209 siswa",
};

// ---- Navigasi utama Yayasan ----
const Y_NAV = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "dampak", label: "Dampak Fammi" },
  { id: "jenjang", label: "Per Jenjang" },
  { id: "banding", label: "Bandingkan Sekolah" },
  { id: "kepuasan", label: "Kepuasan" },
];

const Y_STATUS = {
  baik: { label: "Stabil", fg: "var(--aman)", bg: "var(--aman-bg)" },
  perhatian: { label: "Perlu perhatian", fg: "var(--perhatian)", bg: "var(--perhatian-bg)" },
};

Object.assign(window, {
  FOUNDATION, Y_ROLE, Y_MONTHS, Y_ROMAN, Y_ACADEMIC_YEARS, Y_CAL_YEARS, yComputeRange,
  JENJANG, SCHOOLS, jenjangAgg, Y_BRIEFING, Y_NAV, Y_STATUS,
});
