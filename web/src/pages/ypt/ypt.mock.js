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

/**
 * Berkunci aspek_kode ("karakter1"..), sama seperti keluaran useYptKarakter yang sebenarnya.
 *
 * Sengaja meniru kondisi produksi: hanya SEBAGIAN aspek yang punya nama, sisanya kosong. Di data
 * asli cuma 1 dari 12 sekolah SMA/K yang mengisi karakter_aspek_config, dan itulah yang dulu
 * memecah satu karakter jadi dua batang. Kalau pratinjau memakai data yang semuanya berlabel
 * rapi, cacat seperti itu tidak akan pernah terlihat di sini.
 */
const KODE_ASPEK = ASPEK.map((_, i) => `karakter${i + 1}`);

const aspekPerSekolah = {};
SEKOLAH.forEach((s, i) => {
  if (s.rata == null) return;
  aspekPerSekolah[s.id] = {};
  KODE_ASPEK.forEach((kode, j) => {
    aspekPerSekolah[s.id][kode] = Math.max(45, Math.min(100, s.rata + ((i + j) % 7) - 3));
  });
});

/** Nama cuma dideklarasikan dua sekolah pertama, meniru konfigurasi yang belum lengkap. */
function aspekContoh(kode, i, nilai, jumlahSekolah) {
  return {
    kode,
    nama: ASPEK[i],
    namaAsli: true,
    nilai,
    jumlahSekolah,
    sekolahBerlabel: 2,
    labelBentrok: false,
  };
}

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
  aspekYayasan: KODE_ASPEK.map((kode, i) => aspekContoh(kode, i, [92, 88, 76, 95, 83, 80][i], 15 - i)),
  aspekPerGrup: () => KODE_ASPEK.slice(0, 4).map((kode, i) => aspekContoh(kode, i, [100, 82, 76, 95][i], 12)),
  // Meniru kontrak asli: grupId null (tabel campur semua jenjang) memakai nama generik, filter per
  // jenjang memakai nama aspek sebenarnya.
  kolomAspekPerGrup: (grupId) => KODE_ASPEK.map((kode, i) => ({
    kode,
    nama: grupId == null ? `Karakter ${i + 1}` : ASPEK[i],
  })),
  aspekPerSekolah,
  aspekLabel: (grupId, kode) => {
    const i = KODE_ASPEK.indexOf(kode);
    if (i < 0) return kode;
    return grupId == null ? `Karakter ${i + 1}` : ASPEK[i];
  },
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

// Peringkas testimoni dipakai ulang dari jalur produksi, jangan ditiru ulang di sini.
import { ringkasTestimoni } from "./citra/useCsData";

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
  ...contohTestimoni(),
};

/**
 * Testimoni contoh untuk pratinjau tab Testimoni.
 *
 * Dibangkitkan lalu dilewatkan ke ringkasTestimoni() yang SAMA dengan jalur produksi, bukan
 * ditulis tangan dalam bentuk akhirnya. Dengan begitu pratinjau tidak bisa diam-diam menyimpang
 * dari bentuk data nyata, dan perubahan pada peringkasnya langsung terlihat di sini juga.
 *
 * Kalimatnya karangan, bukan salinan dari spreadsheet. Testimoni asli memuat nama anak dan
 * keluhan yang bisa dilacak ke orang tertentu; itu tidak boleh masuk ke berkas yang ikut
 * ter-commit. Yang ditiru cuma bentuk dan proporsinya: sebaran kategori mengikuti data produksi
 * (Ucapan Terimakasih paling banyak, Kritik paling sedikit), dan tumpang tindih labelnya dibuat
 * sekitar 39% seperti data asli supaya tampilan diuji pada kondisi yang benar.
 */
function contohTestimoni() {
  const KALIMAT = [
    ["Terimakasih untuk bimbingan ibu guru, anak saya jadi lebih mandiri dan berani bercerita di rumah.", ["Terimakasih"]],
    ["Terimakasih atas perhatian wali kelas selama satu semester ini, perkembangan belajarnya terasa sekali.", ["Terimakasih"]],
    ["Terimakasih sudah mencontohkan kebiasaan baik, ananda mulai terbiasa merapikan barangnya sendiri.", ["Terimakasih"]],
    ["Terimakasih kepada seluruh guru yang sabar mendidik, lingkungan sekolahnya nyaman untuk anak.", ["Terimakasih"]],
    ["Terimakasih atas ilmu dan pembiasaan positif yang diberikan, karakter anak semakin terbentuk.", ["Terimakasih"]],
    ["Terimakasih, semoga kedepannya kegiatan pembiasaan seperti ini terus berjalan dan makin banyak yang terlibat.", ["Terimakasih", "Harapan"]],
    ["Harapan saya semoga anak semakin percaya diri dan betah belajar di sekolah.", ["Harapan"]],
    ["Semoga kedepannya komunikasi antara wali kelas dan orang tua bisa lebih sering, terimakasih.", ["Harapan", "Terimakasih"]],
    ["Harapannya fasilitas belajar terus ditambah supaya anak makin semangat mengikuti kegiatan.", ["Harapan"]],
    ["Semoga anak saya bisa mengikuti pelajaran dengan baik dan menemukan teman yang mendukung.", ["Harapan"]],
    ["Saran saya kegiatan ekstrakurikuler bisa dimulai lebih awal supaya tidak bentrok dengan tugas.", ["SaranMasukan"]],
    ["Mohon guru memperhatikan semua murid, bukan hanya yang aktif di kelas. Terimakasih sebelumnya.", ["SaranMasukan", "Terimakasih"]],
    ["Masukan dari saya, informasi kegiatan sebaiknya disampaikan lebih awal agar orang tua bisa menyiapkan.", ["SaranMasukan"]],
    ["Saran untuk sekolah, tolong tugas rumah jangan menumpuk di akhir pekan supaya anak tetap istirahat.", ["SaranMasukan", "Harapan"]],
    ["Ruang kelas terasa panas di siang hari, anak jadi sulit berkonsentrasi saat belajar.", ["Keluhan"]],
    ["Jaringan wifi sering bermasalah sehingga tugas yang butuh internet jadi terhambat.", ["Keluhan"]],
    ["Kadang informasi dari sekolah terlambat sampai ke orang tua, mohon diperbaiki alurnya.", ["Keluhan", "SaranMasukan"]],
    ["Anak mengeluh kamar mandi kurang bersih, tolong kebersihannya lebih diperhatikan lagi.", ["Keluhan", "SaranMasukan"]],
    ["Aturan potong rambut terasa terlalu ketat dan tidak dijelaskan alasannya kepada siswa.", ["Kritik"]],
    ["Kegiatan osis kurang melibatkan siswa kelas bawah, terkesan hanya berputar di kelompok yang sama.", ["Kritik", "SaranMasukan"]],
  ];

  // Kelas mengikuti jenjang sekolahnya. Kalau diambil dari satu daftar campur, pratinjau
  // menampilkan "TK Telkom Padang, Kelas XI TKJ 2" dan siapa pun yang melihat tangkapan layarnya
  // akan mengira ada yang salah di pemetaan sekolah.
  const KELAS = {
    TK: ["Kelas A1", "Kelas A2", "Kelas B1"],
    SD: ["Kelas 2A", "Kelas 4B", "Kelas 5A"],
    SMP: ["Kelas VII-1", "Kelas VIII-2", "Kelas IX-3"],
    SMAK: ["Kelas X RPL 1", "Kelas XI TKJ 2", "Kelas XI PPLG 1"],
  };

  // Bobot per sekolah dibuat timpang seperti data asli: sekolah menengah menyumbang jauh lebih
  // banyak testimoni daripada TK, sehingga grafik "Suara per Sekolah" diuji pada rentang yang
  // memang lebar, bukan pada batang yang sama panjang semua.
  const BOBOT = [3, 2, 6, 5, 9, 14, 11];

  // Tujuh sekolah mencakup keempat kelompok jenjang, supaya grafik komposisi per jenjang punya
  // isi di semua barisnya.
  const dipakai = [
    SEKOLAH[0], SEKOLAH[3], SEKOLAH[4], SEKOLAH[6], SEKOLAH[8], SEKOLAH[11], SEKOLAH[13],
  ];

  const meta = {};
  dipakai.forEach((s) => { meta[s.id] = s; });

  const baris = [];
  dipakai.forEach((sekolah, iS) => {
    const banyak = BOBOT[iS % BOBOT.length] * 4;
    for (let i = 0; i < banyak; i++) {
      // Indeks kalimat digeser deterministik, bukan acak: pratinjau harus tampil sama tiap muat
      // ulang, kalau tidak membandingkannya dengan tangkapan layar sebelumnya jadi percuma.
      const [teks, kategori] = KALIMAT[(i * 7 + iS * 3) % KALIMAT.length];
      baris.push({
        id: `${sekolah.id}-${i}`,
        sekolah_id: sekolah.id,
        periode_id: "2026-05",
        // Penulis ditiru dari pola nyata: TK dan SD diisi orang tua ("Orangtua <nama anak>"),
        // SMP dan SMA/K sebagian besar diisi siswanya sendiri (nama sendiri, kapital semua).
        // Tanpa campuran ini, grafik "Orangtua Berbicara Apa, Siswa Berbicara Apa" tidak pernah
        // muncul di pratinjau dan tidak akan pernah diperiksa.
        nama: sekolah.grup === "TK" || sekolah.grup === "SD"
          ? `Orangtua Siswa ${i + 1}`
          : (i % 4 === 0 ? `Orangtua Siswa ${i + 1}` : `SISWA CONTOH ${i + 1}`),
        kelas: KELAS[sekolah.grup][(i + iS) % KELAS[sekolah.grup].length],
        kategori,
        teks,
      });
    }
  });

  return ringkasTestimoni(baris, meta);
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
