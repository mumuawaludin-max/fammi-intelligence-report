import { rakitLaporanLw } from "./lwAssembler";

/**
 * lw.mock.js -- data CONTOH (dummy) untuk pratinjau lepas-login (LwPreview.jsx) modul
 * Leadership & Wellbeing: Yayasan Pendidikan Fammi, 20 guru di 4 jenjang (TK/SD/SMP/SMA),
 * periode Juli 2025. Angkanya sama persis dengan seed di migration
 * 20260803100000_lw_tables_and_seed.sql (data demo, bukan hasil asesmen sungguhan).
 *
 * Bentuk datanya SENGAJA berupa baris mentah seperti tabel Supabase (lembagaRow/personalRows/
 * tlRows/briefingRow), lalu dirakit lewat rakitLaporanLw yang sama dengan jalur produksi --
 * supaya pratinjau tidak pernah bisa beda bentuk dari data asli.
 *
 * Alur cerita datanya dibuat supaya pimpinan yayasan mudah membacanya:
 * - Seluruh guru berkategori Baik secara keseluruhan (skor total 141-252).
 * - Tiga dimensi menonjol: Kemandirian (3 Perlu Perhatian + 1 Waspada), Penerimaan Diri (3),
 *   Eksplorasi Lingkungan (3); Relasi Positif 100% Baik.
 * - Tekanan terkonsentrasi di unit SMP (Sari Wulandari paling berat), TK paling sehat.
 */

const LEMBAGA_ROW = {
  periode_id: "2025-07",
  unit: null,
  lead_distribusi: [
    { kategori: "Istimewa", persen: 15, jumlah: 3 },
    { kategori: "Sangat Baik", persen: 70, jumlah: 14 },
    { kategori: "Baik", persen: 15, jumlah: 3 },
    { kategori: "Cukup Baik", persen: 0, jumlah: 0 },
    { kategori: "Perlu Penguatan", persen: 0, jumlah: 0 },
  ],
  lead_aspek: [
    { kode: "L", nilai: 70.1 },
    { kode: "E", nilai: 73.0 },
    { kode: "A", nilai: 71.9 },
    { kode: "D", nilai: 72.9 },
  ],
  lead_top_skill: [
    { indikator: "Empati", nilai: 88.4 },
    { indikator: "Berorientasi Pada Siswa & Orangtua", nilai: 86.2 },
    { indikator: "Kolaboratif (Internal)", nilai: 84.5 },
    { indikator: "Teladan & Integritas", nilai: 83.9 },
    { indikator: "Adaptif", nilai: 82.7 },
  ],
  lead_skill_gap: [
    { indikator: "Kepemimpinan Digital", nilai: 58.3 },
    { indikator: "Problem Solving", nilai: 62.1 },
    { indikator: "Komersial & Pendanaan Sekolah", nilai: 64.5 },
  ],
  protek_distribusi: [
    { kategori: "Baik", persen: 100, jumlah: 20 },
    { kategori: "Perlu Perhatian", persen: 0, jumlah: 0 },
    { kategori: "Waspada", persen: 0, jumlah: 0 },
    { kategori: "Perlu Konsultasi", persen: 0, jumlah: 0 },
  ],
  protek_dimensi: [
    { kode: "P", baik_persen: 85, baik_jumlah: 17, perlu_perhatian_persen: 15, perlu_perhatian_jumlah: 3, waspada_persen: 0, waspada_jumlah: 0 },
    { kode: "R", baik_persen: 100, baik_jumlah: 20, perlu_perhatian_persen: 0, perlu_perhatian_jumlah: 0, waspada_persen: 0, waspada_jumlah: 0 },
    { kode: "O", baik_persen: 95, baik_jumlah: 19, perlu_perhatian_persen: 5, perlu_perhatian_jumlah: 1, waspada_persen: 0, waspada_jumlah: 0 },
    { kode: "T", baik_persen: 90, baik_jumlah: 18, perlu_perhatian_persen: 10, perlu_perhatian_jumlah: 2, waspada_persen: 0, waspada_jumlah: 0 },
    { kode: "E", baik_persen: 85, baik_jumlah: 17, perlu_perhatian_persen: 15, perlu_perhatian_jumlah: 3, waspada_persen: 0, waspada_jumlah: 0 },
    { kode: "K", baik_persen: 80, baik_jumlah: 16, perlu_perhatian_persen: 15, perlu_perhatian_jumlah: 3, waspada_persen: 5, waspada_jumlah: 1 },
  ],
  protek_temuan_spesifik: [
    { dimensi: "Penerimaan Diri", pernyataan: "Merasa kurang puas dengan pencapaian diri selama menjadi pendidik.", persen: 15, jumlah: 3 },
    { dimensi: "Penerimaan Diri", pernyataan: "Tidak nyaman saat membandingkan diri dengan rekan sejawat.", persen: 10, jumlah: 2 },
    { dimensi: "Tujuan Hidup", pernyataan: "Merasa rutinitas mengajar berjalan tanpa arah pengembangan yang jelas.", persen: 10, jumlah: 2 },
    { dimensi: "Eksplorasi Lingkungan", pernyataan: "Sering merasa terbebani tanggung jawab administrasi di luar mengajar.", persen: 15, jumlah: 3 },
    { dimensi: "Kemandirian", pernyataan: "Keputusan sering menunggu arahan pimpinan sebelum berani diambil.", persen: 20, jumlah: 4 },
    { dimensi: "Kemandirian", pernyataan: "Khawatir terhadap penilaian rekan kerja saat menyampaikan pendapat berbeda.", persen: 10, jumlah: 2 },
  ],
};

function protek(p, r, o, t, e, k, kategoriMap = {}) {
  const kat = (kode) => kategoriMap[kode] || "Baik";
  return [
    { kode: "P", nilai: p, kategori: kat("P") },
    { kode: "R", nilai: r, kategori: kat("R") },
    { kode: "O", nilai: o, kategori: kat("O") },
    { kode: "T", nilai: t, kategori: kat("T") },
    { kode: "E", nilai: e, kategori: kat("E") },
    { kode: "K", nilai: k, kategori: kat("K") },
  ];
}

function lead(l, e, a, d) {
  return [
    { kode: "L", nilai: l },
    { kode: "E", nilai: e },
    { kode: "A", nilai: a },
    { kode: "D", nilai: d },
  ];
}

const PERSONAL_ROWS = [
  // ── TK Fammi (unit paling sehat: seluruh dimensi Baik) ─────────────────────────────────
  {
    id: "rina-kartika", unit: "TK Fammi", nama: "Rina Kartika, S.Pd", is_kepsek_saat_ini: true,
    kesiapan_memimpin_skor: 84, kesiapan_memimpin_kategori: "Istimewa",
    kondisi_psikologis_skor: 228, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(82, 85, 84, 85), protek_dimensi: protek(38, 40, 39, 37, 38, 36),
    narasi_pengalaman: [
      { tema: "Kepemimpinan di Masa Perubahan", isi: "Perubahan kurikulum di unit TK dijalankan bertahap: sosialisasi ke guru dulu, lalu pendampingan mingguan, supaya tidak ada yang merasa ditinggal." },
      { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Forum orang tua bulanan dan kegiatan market day membuat orang tua terlibat langsung dalam pembelajaran anak." },
    ],
    cerita_terbaik: [
      { judul: "Membangun Kebiasaan Positif Sejak TK", isi: "Program penyambutan pagi oleh guru bergilir membuat suasana sekolah hangat dan orang tua makin percaya.", bullet_poin: [] },
    ],
  },
  {
    id: "lina-marlina", unit: "TK Fammi", nama: "Lina Marlina, S.Pd.AUD", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 76, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 211, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(74, 78, 75, 77), protek_dimensi: protek(35, 38, 36, 34, 35, 33),
    narasi_pengalaman: [
      { tema: "Inovasi yang Membawa Dampak Nyata", isi: "Membuat media belajar dari barang bekas bersama anak-anak, sekaligus mengenalkan konsep daur ulang sejak dini." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "dewi-lestari", unit: "TK Fammi", nama: "Dewi Lestari, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 71, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 204, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(70, 72, 71, 71), protek_dimensi: protek(34, 36, 33, 35, 34, 32),
    narasi_pengalaman: [
      { tema: "Pengalaman Mengelola Tim", isi: "Berbagi tugas dengan rekan sejawat saat kegiatan besar sekolah supaya beban tidak menumpuk di satu orang." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "yuni-astuti", unit: "TK Fammi", nama: "Yuni Astuti, S.Pd.AUD", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 68, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 199, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(66, 69, 68, 69), protek_dimensi: protek(33, 35, 34, 32, 33, 32),
    narasi_pengalaman: [
      { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Melibatkan orang tua sebagai narasumber kelas sesuai profesi masing-masing." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "ratna-sari", unit: "TK Fammi", nama: "Ratna Sari, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 63, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 196, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(61, 64, 63, 64), protek_dimensi: protek(32, 34, 33, 33, 32, 32),
    narasi_pengalaman: [
      { tema: "Inovasi yang Membawa Dampak Nyata", isi: "Mengubah sudut baca kelas menjadi area bermain literasi yang membuat anak lebih betah membaca." },
    ],
    cerita_terbaik: [],
  },

  // ── SD Fammi (2 guru dengan dimensi perlu perhatian) ───────────────────────────────────
  {
    id: "ahmad-fauzi", unit: "SD Fammi", nama: "Ahmad Fauzi, M.Pd", is_kepsek_saat_ini: true,
    kesiapan_memimpin_skor: 86, kesiapan_memimpin_kategori: "Istimewa",
    kondisi_psikologis_skor: 234, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(85, 87, 86, 86), protek_dimensi: protek(39, 41, 40, 38, 39, 37),
    narasi_pengalaman: [
      { tema: "Kepemimpinan di Masa Perubahan", isi: "Transisi ke Kurikulum Merdeka dikawal lewat komunitas belajar internal; guru saling berbagi praktik tiap Jumat." },
      { tema: "Efisiensi Tanpa Mengorbankan Mutu", isi: "RKAS disusun terbuka bersama guru dan komite supaya prioritas anggaran dipahami semua pihak." },
    ],
    cerita_terbaik: [
      { judul: "Komunitas Belajar Guru SD", isi: "Komunitas belajar internal tiap Jumat membuat praktik baik cepat menular antarguru tanpa menunggu pelatihan eksternal.", bullet_poin: [] },
    ],
  },
  {
    id: "dewi-anggraini", unit: "SD Fammi", nama: "Dewi Anggraini, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 66, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 184, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(64, 67, 66, 67),
    protek_dimensi: protek(27, 34, 33, 32, 26, 32, { P: "Perlu Perhatian", E: "Perlu Perhatian" }),
    narasi_pengalaman: [
      { tema: "Pengalaman Mengelola Kelas", isi: "Menangani kelas besar dengan rotasi kelompok belajar supaya tiap anak tetap mendapat perhatian." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "budi-santoso", unit: "SD Fammi", nama: "Budi Santoso, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 58, kesiapan_memimpin_kategori: "Baik",
    kondisi_psikologis_skor: 193, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(56, 59, 58, 59),
    protek_dimensi: protek(33, 35, 34, 33, 32, 26, { K: "Perlu Perhatian" }),
    narasi_pengalaman: [
      { tema: "Inovasi yang Membawa Dampak Nyata", isi: "Membuat bank soal digital sederhana yang bisa dipakai bergantian oleh semua guru kelas atas." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "rahmat-hidayat", unit: "SD Fammi", nama: "Rahmat Hidayat, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 74, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 210, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(72, 75, 74, 75), protek_dimensi: protek(35, 37, 36, 34, 35, 33),
    narasi_pengalaman: [
      { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Program sarapan literasi tiap pagi melibatkan orang tua sebagai pembaca tamu." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "siti-nurhaliza", unit: "SD Fammi", nama: "Siti Nurhaliza, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 79, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 217, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(77, 80, 79, 80), protek_dimensi: protek(36, 38, 37, 36, 36, 34),
    narasi_pengalaman: [
      { tema: "Pengalaman Mengelola Tim", isi: "Menjadi koordinator lomba antarkelas dan membagi peran panitia ke guru muda supaya regenerasi berjalan." },
    ],
    cerita_terbaik: [
      { judul: "Regenerasi Panitia Kegiatan", isi: "Membagi peran panitia ke guru muda membuat kegiatan sekolah tidak lagi bergantung pada orang yang sama.", bullet_poin: [] },
    ],
  },

  // ── SMP Fammi (unit paling tertekan: 3 guru dengan dimensi non-Baik) ───────────────────
  {
    id: "hendra-gunawan", unit: "SMP Fammi", nama: "Hendra Gunawan, M.Pd", is_kepsek_saat_ini: true,
    kesiapan_memimpin_skor: 82, kesiapan_memimpin_kategori: "Istimewa",
    kondisi_psikologis_skor: 226, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(80, 83, 82, 83), protek_dimensi: protek(37, 40, 38, 37, 38, 36),
    narasi_pengalaman: [
      { tema: "Kepemimpinan di Masa Perubahan", isi: "Digitalisasi administrasi dimulai dari hal kecil: presensi dan jurnal kelas daring, sebelum masuk ke rapor digital." },
      { tema: "Keputusan Sulit demi Integritas", isi: "Menegakkan aturan disiplin yang sama untuk semua siswa tanpa pandang latar belakang, dengan komunikasi baik ke orang tuanya." },
    ],
    cerita_terbaik: [
      { judul: "Digitalisasi Bertahap di SMP", isi: "Dimulai dari presensi daring, kini seluruh jurnal kelas terdokumentasi rapi dan bisa dipantau bersama.", bullet_poin: [] },
    ],
  },
  {
    id: "sari-wulandari", unit: "SMP Fammi", nama: "Sari Wulandari, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 55, kesiapan_memimpin_kategori: "Baik",
    kondisi_psikologis_skor: 162, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(53, 56, 55, 56),
    protek_dimensi: protek(26, 33, 28, 27, 26, 22, { P: "Perlu Perhatian", O: "Perlu Perhatian", T: "Perlu Perhatian", E: "Perlu Perhatian", K: "Waspada" }),
    narasi_pengalaman: [
      { tema: "Pengalaman Mengelola Kelas", isi: "Mengajar sambil merangkap tugas administrasi kurikulum; sedang belajar memilah mana yang bisa didelegasikan." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "andi-prasetyo", unit: "SMP Fammi", nama: "Andi Prasetyo, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 60, kesiapan_memimpin_kategori: "Baik",
    kondisi_psikologis_skor: 187, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(58, 61, 60, 61),
    protek_dimensi: protek(27, 34, 33, 32, 33, 28, { P: "Perlu Perhatian", K: "Perlu Perhatian" }),
    narasi_pengalaman: [
      { tema: "Inovasi yang Membawa Dampak Nyata", isi: "Memakai proyek sederhana berbasis lingkungan sekolah supaya siswa belajar IPA dari hal nyata." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "citra-ayu", unit: "SMP Fammi", nama: "Citra Ayu, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 72, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 199, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(70, 73, 72, 73),
    protek_dimensi: protek(34, 36, 35, 28, 34, 32, { T: "Perlu Perhatian" }),
    narasi_pengalaman: [
      { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Membuat grup diskusi orang tua per angkatan untuk menyalurkan aspirasi sebelum jadi keluhan." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "maya-puspita", unit: "SMP Fammi", nama: "Maya Puspita, M.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 77, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 215, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(75, 78, 77, 78), protek_dimensi: protek(36, 38, 36, 35, 36, 34),
    narasi_pengalaman: [
      { tema: "Pengalaman Mengelola Tim", isi: "Memimpin tim penyusun modul ajar lintas mapel dan menjaga tenggat lewat papan kerja bersama." },
    ],
    cerita_terbaik: [],
  },

  // ── SMA Fammi (1 guru dengan dimensi perlu perhatian) ──────────────────────────────────
  {
    id: "bambang-wijaya", unit: "SMA Fammi", nama: "Bambang Wijaya, M.Pd", is_kepsek_saat_ini: true,
    kesiapan_memimpin_skor: 80, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 222, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(78, 81, 80, 81), protek_dimensi: protek(37, 39, 38, 36, 37, 35),
    narasi_pengalaman: [
      { tema: "Kepemimpinan di Masa Perubahan", isi: "Menyiapkan guru menghadapi kelas berbasis pilihan mapel lewat pemetaan kompetensi dan pelatihan bergilir." },
      { tema: "Kemitraan Strategis Sekolah", isi: "Menjalin kerja sama magang dengan dunia usaha lokal untuk memperluas ruang belajar siswa." },
    ],
    cerita_terbaik: [
      { judul: "Kemitraan Magang SMA", isi: "Kerja sama dengan dunia usaha lokal membuka ruang belajar nyata bagi siswa dan memperkuat citra sekolah.", bullet_poin: [] },
    ],
  },
  {
    id: "fajar-ramadhan", unit: "SMA Fammi", nama: "Fajar Ramadhan, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 65, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 189, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(63, 66, 65, 66),
    protek_dimensi: protek(33, 35, 34, 33, 27, 27, { E: "Perlu Perhatian", K: "Perlu Perhatian" }),
    narasi_pengalaman: [
      { tema: "Pengalaman Mengelola Kelas", isi: "Menyeimbangkan tugas wali kelas dan pembina ekskul; sedang menata ulang prioritas supaya keduanya tidak saling mengorbankan." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "indah-permatasari", unit: "SMA Fammi", nama: "Indah Permatasari, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 78, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 216, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(76, 79, 78, 79), protek_dimensi: protek(36, 38, 37, 35, 36, 34),
    narasi_pengalaman: [
      { tema: "Inovasi yang Membawa Dampak Nyata", isi: "Kelas menulis opini yang hasilnya dimuat di media sekolah menumbuhkan kepercayaan diri siswa." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "agus-setiawan", unit: "SMA Fammi", nama: "Agus Setiawan, M.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 75, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 211, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(73, 76, 75, 76), protek_dimensi: protek(35, 37, 36, 35, 35, 33),
    narasi_pengalaman: [
      { tema: "Pengalaman Mengelola Tim", isi: "Menjadi mentor guru baru lewat observasi kelas dua arah, saling memberi umpan balik." },
    ],
    cerita_terbaik: [],
  },
  {
    id: "nur-aini", unit: "SMA Fammi", nama: "Nur Aini, S.Pd", is_kepsek_saat_ini: false,
    kesiapan_memimpin_skor: 70, kesiapan_memimpin_kategori: "Sangat Baik",
    kondisi_psikologis_skor: 206, kondisi_psikologis_kategori: "Baik", kondisi_psikologis_label: "Aman",
    lead_aspek: lead(68, 71, 70, 71), protek_dimensi: protek(34, 36, 35, 34, 34, 33),
    narasi_pengalaman: [
      { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Konsultasi rutin perencanaan studi lanjut bersama siswa dan orang tua kelas XII." },
    ],
    cerita_terbaik: [],
  },
];

const TL_ROWS = [
  {
    id: "tl-kepemimpinan-digital",
    title: "Pelatihan Kepemimpinan Digital untuk Guru & Kepala Sekolah",
    dimensi: "Kepemimpinan Digital",
    teaser: "Pemanfaatan platform digital (Google Workspace, aplikasi penilaian, media sosial sekolah) untuk manajemen dan pembelajaran.",
    mengapa_data: "Menjawab gap terbesar organisasi: indikator Kepemimpinan Digital rata-rata 58,30 dari 100, skor terendah di antara seluruh indikator LEAD.",
    manfaat: { learning_outcome: "Guru dan kepala sekolah mampu memakai platform digital untuk komunikasi, administrasi, dan promosi sekolah." },
    hal_diwaspadai: null,
  },
  {
    id: "tl-problem-solving",
    title: "Pelatihan Creative Problem Solving untuk Tim Pengajar",
    dimensi: "Problem Solving",
    teaser: "Teknik berpikir analitis dan kreatif, root cause analysis, dan studi kasus keseharian di tiap jenjang.",
    mengapa_data: "Menjawab gap indikator Problem Solving, rata-rata organisasi 62,10 dari 100.",
    manfaat: { learning_outcome: "Peserta mampu mengidentifikasi akar masalah dan memilih solusi praktis yang bisa langsung diterapkan." },
    hal_diwaspadai: null,
  },
  {
    id: "tl-pendampingan-kemandirian",
    title: "Program Pendampingan Kemandirian & Kepercayaan Diri Guru",
    dimensi: "Kemandirian",
    teaser: "Sesi coaching berkala untuk melatih pengambilan keputusan mandiri dan keberanian menyuarakan pendapat.",
    mengapa_data: "Menjawab temuan wellbeing: 4 dari 20 guru berkategori non-Baik pada dimensi Kemandirian, terbanyak di antara enam dimensi PROTEK.",
    manfaat: { learning_outcome: "Guru terdampak menunjukkan peningkatan kategori Kemandirian pada asesmen periode berikutnya." },
    hal_diwaspadai: null,
  },
];

const BRIEFING_ROW = {
  teks: "Kondisi kesehatan mental 20 guru di empat jenjang Yayasan Pendidikan Fammi (TK, SD, SMP, SMA) secara keseluruhan berkategori Baik. Meski begitu, tiga dimensi menunjukkan guru yang perlu perhatian: Kemandirian (3 guru Perlu Perhatian dan 1 guru Waspada), Penerimaan Diri (3 guru), serta Eksplorasi Lingkungan (3 guru). Tekanan paling terkonsentrasi di unit SMP, sementara unit TK dalam kondisi paling sehat. Daftar nama tiap dimensi tersedia di bawah untuk ditindaklanjuti pimpinan.",
};

export const LW_LAPORAN_CONTOH = rakitLaporanLw({
  sekolahNama: "Yayasan Pendidikan Fammi",
  lembagaRow: LEMBAGA_ROW,
  personalRows: PERSONAL_ROWS,
  tlRows: TL_ROWS,
  briefingRow: BRIEFING_ROW,
});
