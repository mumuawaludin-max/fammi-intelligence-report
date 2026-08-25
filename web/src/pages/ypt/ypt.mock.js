/**
 * Data CONTOH untuk pratinjau lepas-login dashboard YPT (?preview=ypt-data).
 *
 * Bentuknya sengaja dibuat persis sama dengan keluaran useYptKarakter/useCsData/useKpData supaya
 * komponen tampilan bisa diperiksa berdampingan dengan Figma tanpa akun produksi dan tanpa
 * menunggu migration jalan. TIDAK PERNAH dipakai jalur produk: hanya YptPreviewData yang
 * mengimpornya, dan itu cuma bisa dibuka lewat ?preview= di dev server.
 *
 * Angka di sini karangan. Jangan dipakai sebagai acuan apa pun.
 */

const SEKOLAH = [
  { id: "TK-TELKOM-PADANG", nama: "TK Telkom Padang", jenjang: "TK", kota: "Padang", grup: "TK", rata: 100, siswa: 62 },
  { id: "TK-TELKOM-BANDUNG", nama: "TK Telkom Bandung", jenjang: "TK", kota: "Bandung", grup: "TK", rata: 86, siswa: 78 },
  { id: "TK-TELKOM-BANJARBARU", nama: "TK Telkom Banjarbaru", jenjang: "TK", kota: "Banjarbaru", grup: "TK", rata: 92, siswa: 54 },
  { id: "TK-TELKOM-TERNATE", nama: "TK Telkom Ternate", jenjang: "TK", kota: "Ternate", grup: "TK", rata: 79, siswa: 41 },
  { id: "SD-TELKOM-PADANG", nama: "SD Telkom Padang", jenjang: "SD", kota: "Padang", grup: "SD", rata: 92, siswa: 310 },
  { id: "SD-TELKOM-BATAM", nama: "SD Telkom Batam", jenjang: "SD", kota: "Batam", grup: "SD", rata: 86, siswa: 288 },
  { id: "SD-TELKOM-BANJARBARU", nama: "SD Telkom Banjarbaru", jenjang: "SD", kota: "Banjarbaru", grup: "SD", rata: 84, siswa: 201 },
  { id: "SMP-TELKOM-PADANG", nama: "SMP Telkom Padang", jenjang: "SMP", kota: "Padang", grup: "SMP", rata: 92, siswa: 240 },
  { id: "SMP-TELKOM-MAKASSAR", nama: "SMP Telkom Makassar", jenjang: "SMP", kota: "Makassar", grup: "SMP", rata: 74, siswa: 321 },
  { id: "SMP-TELKOM-PURWOKERTO", nama: "SMP Telkom Purwokerto", jenjang: "SMP", kota: "Purwokerto", grup: "SMP", rata: 68, siswa: 190 },
  { id: "SMK-PARIWISATA-TELKOM-BANDUNG", nama: "SMK Pariwisata Telkom Bandung", jenjang: "SMK", kota: "Bandung", grup: "SMAK", rata: 97, siswa: 412 },
  { id: "SMK-TELKOM-PURWOKERTO", nama: "SMK Telkom Purwokerto", jenjang: "SMK", kota: "Purwokerto", grup: "SMAK", rata: 88, siswa: 640 },
  { id: "SMK-TELKOM-MAKASSAR", nama: "SMK Telkom Makassar", jenjang: "SMK", kota: "Makassar", grup: "SMAK", rata: 81, siswa: 520 },
  { id: "SMK-TELKOM-LAMPUNG", nama: "SMK Telkom Lampung", jenjang: "SMK", kota: "Bandar Lampung", grup: "SMAK", rata: 90, siswa: 480 },
  { id: "SMK-TELKOM-2-MEDAN", nama: "SMK Telkom 2 Medan", jenjang: "SMK", kota: "Medan", grup: "SMAK", rata: 76, siswa: 355 },
  // Satu sekolah sengaja tanpa data periode ini, untuk menguji penanda "belum ada".
  { id: "SMK-TELKOM-SIDOARJO", nama: "SMK Telkom Sidoarjo", jenjang: "SMK", kota: "Sidoarjo", grup: "SMAK", rata: null, siswa: 0 },
];

const ASPEK = ["Mandiri", "Empati", "Tanggung Jawab", "7 Kebiasaan", "Inisiatif", "Disiplin"];

const INDIKATOR_CONTOH = [
  "Mengikuti kegiatan pertama pada jam pelajaran dengan fokus tanpa perlu ditegur berulang.",
  "Merapikan alat belajar sendiri setelah selesai digunakan tanpa diminta.",
  "Menawarkan bantuan kepada teman yang terlihat kesulitan mengerjakan tugas.",
  "Menyelesaikan tugas yang menjadi bagiannya sampai tuntas walau tidak diawasi.",
  "Mengakui kesalahan dan memperbaikinya tanpa mencari pembenaran.",
];

function barisSekolah() {
  return SEKOLAH.map((s) => ({
    sekolah_id: s.id, periode_id: "2026-05", nama: s.nama, jenjang: s.jenjang,
    kota: s.kota, grup: s.grup, rata_total: s.rata, jumlah_siswa: s.siswa,
  }));
}

const aspekPerSekolah = {};
SEKOLAH.forEach((s, i) => {
  if (s.rata == null) return;
  aspekPerSekolah[s.id] = {};
  ASPEK.forEach((a, j) => {
    aspekPerSekolah[s.id][a] = Math.max(45, Math.min(100, s.rata + ((i + j) % 7) - 3));
  });
});

const siswaPerSekolah = {};
SEKOLAH.forEach((s) => {
  if (s.rata == null) return;
  const nama = ["ABDI MUSHAWWIRU RAISHA ALFATH", "AKIO TITO ATHAYA", "ALESHA RAFANI AZALIA",
    "ALLMERA KIMYA DELFIAN", "AMIRA ALYA VIKRI"];
  const kelas = ["Kelas 8D", "Kelas 7A", "Kelas 9E", "Kelas 8F", "Kelas 9C"];
  siswaPerSekolah[s.id] = {
    atas: nama.map((n, i) => ({ nama_murid: n, kelas_id: kelas[i], total_persen: 98 - i, peringkat: i + 1 })),
    bawah: nama.slice().reverse().map((n, i) => ({
      nama_murid: `${n.split(" ")[0]} ${["PRATAMA", "SAPUTRA", "WIJAYA", "LESTARI", "NUGROHO"][i]}`,
      kelas_id: kelas[i], total_persen: 52 + i, peringkat: i + 1,
    })),
  };
});

const semua = barisSekolah();
const berdata = semua.filter((s) => s.rata_total != null);

const kotaMap = {};
semua.forEach((s) => { (kotaMap[s.kota] ||= []).push(s); });

export const MOCK_RAPOR = {
  periode: "2026-05",
  periodeSebelum: "2026-04",
  totalYayasan: 78,
  jenjang: [
    { id: "TK", label: "TK", nilai: 86, jumlahSekolah: 12, jumlahSiswa: 235, tren: "naik" },
    { id: "SD", label: "SD", nilai: 92, jumlahSekolah: 25, jumlahSiswa: 799, tren: "datar" },
    { id: "SMP", label: "SMP", nilai: 72, jumlahSekolah: 18, jumlahSiswa: 751, tren: "turun" },
    { id: "SMAK", label: "SMA/K", nilai: 88, jumlahSekolah: 32, jumlahSiswa: 2407, tren: "naik" },
  ],
  aspekYayasan: ASPEK.map((a, i) => ({ nama: a, nilai: [92, 88, 76, 95, 83, 80][i], jumlahSekolah: 15 - i })),
  aspekPerGrup: () => ASPEK.slice(0, 4).map((a, i) => ({ nama: a, nilai: [100, 82, 76, 95][i], jumlahSekolah: 12 })),
  kolomAspek: ASPEK,
  aspekPerSekolah,
  indikatorPerGrup: () => INDIKATOR_CONTOH.map((label, i) => ({ label, nilai: [92, 83, 94, 87, 82][i] })),
  siswaPerSekolah,
  sekolah: berdata,
  sekolahLengkap: semua,
  berperingkat: [...berdata].sort((a, b) => b.rata_total - a.rata_total),
  kota: Object.entries(kotaMap).map(([nama, rows]) => ({
    nama,
    sekolah: rows.slice().sort((a, b) => (b.rata_total ?? -1) - (a.rata_total ?? -1)),
    nilai: Math.round(rows.filter((r) => r.rata_total != null)
      .reduce((a, r) => a + r.rata_total, 0) / Math.max(1, rows.filter((r) => r.rata_total != null).length)),
    jumlahSekolah: rows.length,
  })).sort((a, b) => a.nama.localeCompare(b.nama)),
  tanpaKota: [],
};

// ── Citra Sekolah ────────────────────────────────────────────────────────────────────────────
const JENJANG_CONTOH = [
  { id: "TK", label: "TK", persen: 67 },
  { id: "SD", label: "SD", persen: 89 },
  { id: "SMP", label: "SMP", persen: 43 },
  { id: "SMAK", label: "SMA/K", persen: 27 },
];

function kategori(nama, persen, jumlah) {
  return { nama, persen, jumlah, perJenjang: JENJANG_CONTOH };
}

export const MOCK_CITRA = {
  keberhasilan: [
    kategori("Tumbuh Kebiasaan Positif", 68, 4312),
    kategori("Kepedulian Sekolah", 32, 3498),
    kategori("Perhatian yang Konsisten", 68, 271),
    kategori("Belajar Memahami Anak", 54, 2821),
    kategori("Perubahan yang Menyeluruh", 44, 2721),
    kategori("Momen Lebih Dekat", 41, 2567),
    kategori("Masih Berproses", 12, 821),
    kategori("Hal Lain", 8, 721),
    kategori("Belum Ada Bulan Ini", 3, 232),
  ],
  dukungan: [
    kategori("Panduan Pembiasaan di Rumah", 32, 4312),
    kategori("Konsultasi Pribadi dengan Guru", 21, 3821),
    kategori("Rekomendasi Aktivitas Bermain", 18, 3242),
    kategori("Kelas / Seminar Parenting Tematik", 13, 2212),
    kategori("Diskusi Reflektif dengan Orangtua Lain", 10, 1821),
    kategori("Wadah Komunikasi Dua Arah", 8, 1255),
    kategori("Ingin Terlibat Lebih Aktif", 4, 902),
    kategori("Tidak Butuh Dukungan Tambahan", 2, 321),
  ],
  emosi: [
    kategori("Sangat Positif", 34, 3120),
    kategori("Positif", 41, 3760),
    kategori("Netral", 15, 1380),
    kategori("Negatif", 7, 640),
    kategori("Sangat Negatif", 3, 275),
  ],
  testimoniByKategori: {
    Apresiasi: contohTestimoni("Apresiasi", 4),
    Harapan: contohTestimoni("Harapan", 3),
    SaranMasukan: contohTestimoni("Saran & Masukan", 2),
    KritikKeluhan: contohTestimoni("Kritik & Keluhan", 1),
  },
  totalTestimoni: 10,
};

function contohTestimoni(label, n) {
  const teks = [
    "Alhamdulillah saat ini dengan bertambahnya usia Gibran 10 tahun, tanggung jawab, percaya diri, berespon dan berani menanggapi perkataan dan nasehat orang tua.",
    "Untuk saat ini sudah cukup karena di sekolah juga dilakukan pembiasaan sederhana dan didampingi oleh guru. Tinggal penerapan di rumah.",
    "Karena anak terlihat lebih banyak ceria nya dibulan ini masih selalu mudah bergaul dengan teman serta mampu mengungkapkan perasaan dengan baik.",
    "Harapan saya semoga sekolah dapat membuat anak merasa aman dan nyaman disekolah, tidak ada kasus bullying, fasilitas mendukung belajar.",
  ];
  return Array.from({ length: n }, (_, i) => ({
    id: `${label}-${i}`,
    nama: ["Gibran Alfiansyah", "Tharena Silva Eljes", "Raihan Putra", "Kalila Azzahra"][i % 4],
    kelas: "Kelas 4B",
    sekolahNama: "SD Telkom Bandung",
    teks: teks[i % teks.length],
  }));
}

// ── Survey Kepuasan ──────────────────────────────────────────────────────────────────────────
import { KP_METRIK, KP_PERAN } from "./yptMeta";

function ringkasKp(skor, jumlah) {
  return {
    jumlah,
    skorTotal: skor,
    metrik: KP_METRIK.map((m, i) => ({ ...m, nilai: Math.min(5, skor / 2 + (i % 3) * 0.15) })),
  };
}

const KP_SEKOLAH = [
  { sekolah_id: "TK-TELKOM-PADANG", nama: "TK Telkom Padang", skor: 9.0 },
  { sekolah_id: "TK-TELKOM-BANDUNG", nama: "TK Telkom Bandung", skor: 9.0 },
  { sekolah_id: "TK-TELKOM-BANJARBARU", nama: "TK Telkom Banjarbaru", skor: 8.0 },
];

export const MOCK_KEPUASAN = {
  totalResponden: 122,
  perPeran: [
    { ...KP_PERAN[0], ...ringkasKp(8.67, 3) },
    { ...KP_PERAN[1], ...ringkasKp(6.71, 7) },
    { ...KP_PERAN[2], ...ringkasKp(7.8, 5) },
    { ...KP_PERAN[3], ...ringkasKp(7.14, 93) },
    { ...KP_PERAN[4], ...ringkasKp(7.43, 14) },
  ],
  keseluruhan: ringkasKp(7.4, 122),
  sekolahUntukPeran: () => KP_SEKOLAH.map((s) => ({
    ...s,
    ...ringkasKp(s.skor, 4),
    esaiDisukai: [
      "Karena rapor karakter Fammi membantu saya melihat perkembangan karakter siswa secara lebih menyeluruh, tidak hanya dari hasil akademik, tetapi juga dari sikap dan kebiasaan.",
    ],
    esaiSaran: [
      "Sebaiknya isian dibuat lebih praktis dan sederhana, dengan indikator yang jelas serta fitur rekap otomatis.",
    ],
    statusBaca: [{ nama: "Ya", jumlah: 3 }, { nama: "SebagianBaca", jumlah: 1 }],
    tindakLanjut: [
      { nama: "Mengecek daftar siswa \"Perlu Perhatian\"", jumlah: 4 },
      { nama: "Menyesuaikan pendekatan pembelajaran di kelas", jumlah: 3 },
    ],
  })),
};
