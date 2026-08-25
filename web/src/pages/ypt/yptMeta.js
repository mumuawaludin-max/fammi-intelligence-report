/**
 * Konstanta tampilan dashboard Yayasan Pendidikan Telkom: label menu/tab, pengelompokan jenjang,
 * koordinat kota untuk peta, daftar metrik Survey Kepuasan, dan pemetaan peran responden.
 *
 * Semua yang bisa berubah tanpa menyentuh logika ditaruh di sini, supaya menyesuaikan label
 * dengan Figma atau menambah kota baru tidak perlu membedah komponen.
 */

/** Id yayasan yang memakai tampilan khusus ini. Gerbangnya di App.jsx. */
export const YPT_ID = "YAY-PENDIDIKAN-TELKOM";

/** Empat menu utama di nav atas, urut sesuai Figma. */
export const YPT_MENUS = [
  { id: "rapor", label: "Rapor Karakter" },
  { id: "citra", label: "Citra Sekolah" },
  { id: "kepuasan", label: "Survey Kepuasan" },
  { id: "dokumentasi", label: "Dokumentasi Kegiatan" },
];

/** Sub-tab per menu (stepper berbentuk panah). */
export const YPT_TABS = {
  rapor: [
    { id: "rangkuman", label: "Rangkuman", icon: "◐" },
    { id: "jenjang", label: "Penilaian per Jenjang", icon: "▥" },
    { id: "karakter", label: "Penilaian per Karakter", icon: "☺" },
    { id: "sekolah", label: "Penilaian per Sekolah", icon: "▦" },
  ],
  citra: [
    { id: "keberhasilan", label: "Keberhasilan Sekolah", icon: "⌂" },
    { id: "dukungan", label: "Bentuk Dukungan", icon: "♡" },
    { id: "emosi", label: "Emosi Anak", icon: "☺" },
    { id: "testimoni", label: "Testimoni", icon: "❝" },
  ],
  kepuasan: [
    { id: "rangkuman", label: "Rangkuman", icon: "◐" },
    { id: "kualitatif", label: "Penilaian Kualitatif", icon: "❝" },
  ],
  dokumentasi: [],
};

/**
 * Pengelompokan jenjang untuk empat kartu ringkasan.
 * SMA dan SMK digabung jadi satu kartu "SMA/K" sesuai Figma -- YPT punya jauh lebih banyak SMK
 * daripada SMA, dan desainnya memang menyatukan keduanya.
 */
export const JENJANG_GROUPS = [
  { id: "TK", label: "TK", match: ["TK"] },
  { id: "SD", label: "SD", match: ["SD"] },
  { id: "SMP", label: "SMP", match: ["SMP"] },
  { id: "SMAK", label: "SMA/K", match: ["SMA", "SMK"] },
];

/** Kelompokkan satu nilai schools.jenjang ke id kartu jenjang. Null kalau tidak dikenali. */
export function groupJenjang(jenjang) {
  if (!jenjang) return null;
  const upper = String(jenjang).trim().toUpperCase();
  const found = JENJANG_GROUPS.find((g) => g.match.includes(upper));
  return found ? found.id : null;
}

/**
 * Ambang perubahan untuk panah tren di kartu jenjang: naik kalau selisih dengan periode
 * pembanding >= +2 poin persen, turun kalau <= -2, selain itu dianggap datar.
 * Dua poin dipilih supaya riak kecil antar bulan (yang wajar terjadi pada rata-rata ratusan
 * siswa) tidak terbaca sebagai perubahan arah.
 */
export const TREN_THRESHOLD = 2;

export function arahTren(sekarang, sebelumnya) {
  if (sekarang == null || sebelumnya == null) return "datar";
  const delta = sekarang - sebelumnya;
  if (delta >= TREN_THRESHOLD) return "naik";
  if (delta <= -TREN_THRESHOLD) return "turun";
  return "datar";
}

/**
 * Koordinat kota untuk peta titik Indonesia, dalam persen terhadap kotak peta (x dari kiri,
 * y dari atas). Nilainya HASIL PROYEKSI lon/lat asli kota lewat bingkai yang sama persis dengan
 * generator peta (lon 94..142, lat 7.5..-11.5) -- lihat scratchpad gen-peta.mjs. Karena
 * peta dasarnya (public/peta-indonesia-dots.svg) dibangkitkan dari bingkai itu juga, dan
 * DotMapIndonesia memakai aspect-ratio 48/19 yang sama, marker selalu menempel tepat di pulau.
 * JANGAN utak-atik angka ini manual; regenerasi lewat script kalau bingkainya berubah.
 *
 * Kota yang TIDAK ada di sini tetap tampil, sebagai daftar teks di bawah peta -- lihat
 * DotMapIndonesia. Jangan pernah membuang sekolah cuma karena kotanya belum dipetakan.
 */
export const KOTA_COORDS = {
  "Banda Aceh": { x: 2.7, y: 10.3 },
  Medan: { x: 9.7, y: 20.6 },
  Batam: { x: 20.9, y: 33.9 },
  Padang: { x: 13.2, y: 44.5 },
  Pekanbaru: { x: 15.5, y: 36.8 },
  Palembang: { x: 22.4, y: 55.2 },
  "Bandar Lampung": { x: 23.5, y: 68.1 },
  Jakarta: { x: 26.8, y: 72.2 },
  Bandung: { x: 28.4, y: 75.8 },
  Purwokerto: { x: 31.7, y: 78.5 },
  Semarang: { x: 34.2, y: 76.2 },
  Yogyakarta: { x: 34.1, y: 80.5 },
  Sidoarjo: { x: 39, y: 78.7 },
  Surabaya: { x: 39.1, y: 77.6 },
  Malang: { x: 38.8, y: 81.5 },
  Denpasar: { x: 44.2, y: 85.1 },
  Banjarbaru: { x: 43.4, y: 57.6 },
  Balikpapan: { x: 47.6, y: 46 },
  Pontianak: { x: 32, y: 39.6 },
  Makassar: { x: 53, y: 66.6 },
  Manado: { x: 64.3, y: 31.7 },
  Ternate: { x: 69.5, y: 35.3 },
  Ambon: { x: 71.2, y: 58.7 },
  Jayapura: { x: 97.3, y: 53.1 },
};

/** Rasio lebar:tinggi bingkai peta (48 derajat lon : 19 derajat lat). WAJIB sama dengan
 * aspect-ratio kanvas di DotMapIndonesia supaya persen KOTA_COORDS jatuh tepat di pulau. */
export const PETA_RASIO = "48 / 19";

/**
 * Legenda warna pencapaian per wilayah di peta (permintaan pemilik produk 2026-08-26:
 * ">90% hijau, dst" supaya perkembangan karakter tiap wilayah gampang di-capture sekilas).
 * Batasnya sejalan dengan cutoff karakter yang ada: >= 90 sangat baik, 75-89 cukup,
 * di bawah 75 perlu penguatan. Dicek berurutan dari atas.
 */
export const PETA_BINS = [
  { min: 90, label: "≥ 90%", warna: "#10b981" },
  { min: 75, label: "75–89%", warna: "#f5b921" },
  { min: 0, label: "< 75%", warna: "#ee2c3c" },
];

/** Warna marker peta untuk satu nilai persen; abu untuk wilayah tanpa data. */
export function warnaPeta(nilai) {
  if (nilai == null) return "#b6bccb";
  const bin = PETA_BINS.find((b) => nilai >= b.min);
  return bin ? bin.warna : "#b6bccb";
}

/** Enam metrik Survey Kepuasan, urut sesuai kolom di spreadsheet respons form. */
export const KP_METRIK = [
  { id: "mudah_dipahami", label: "Laporan mudah dipahami" },
  { id: "kelengkapan", label: "Kelengkapan data yang disajikan" },
  { id: "relevansi", label: "Relevansi indikator dengan kondisi kelas" },
  { id: "kejelasan_rekomendasi", label: "Kejelasan rekomendasi tindak lanjut" },
  { id: "ketepatan_waktu", label: "Ketepatan waktu pengiriman laporan" },
  { id: "komunikasi", label: "Kualitas komunikasi Tim Fammi" },
];

/** Lima kelompok peran responden, label mengikuti chip di Figma. */
export const KP_PERAN = [
  { id: "KepalaSekolah", label: "Kepala Sekolah" },
  { id: "Wakasek", label: "Wakasek & Kaur" },
  { id: "BK", label: "BK" },
  { id: "WaliKelas", label: "Wali Kelas" },
  { id: "GuruMapel", label: "Guru" },
];

/** Empat kategori testimoni, warna mengikuti kartu donut di Figma 2d. */
export const CS_TESTIMONI_KATEGORI = [
  { id: "Apresiasi", label: "Apresiasi", warna: "var(--ypt-navy)" },
  { id: "Harapan", label: "Harapan", warna: "var(--ypt-sentimen-positif)" },
  { id: "SaranMasukan", label: "Saran & Masukan", warna: "var(--ypt-sentimen-negatif)" },
  { id: "KritikKeluhan", label: "Kritik & Keluhan", warna: "var(--ypt-sentimen-sangat-negatif)" },
];

/**
 * Warna per label emosi, kunci PERSIS nilai yang dikembalikan countEmosi() di karakterMeta.js
 * (EMOSI_ORDER: "Sangat Positif" | "Positif" | "Netral" | "Negatif" | "Sangat Negatif") --
 * exact match, bukan lagi pencocokan fuzzy .includes(), karena countEmosi sudah menjamin label
 * yang keluar selalu salah satu dari lima ini persis.
 */
export const CS_EMOSI_WARNA = {
  "Sangat Positif": "var(--ypt-sentimen-sangat-positif)",
  "Positif": "var(--ypt-sentimen-positif)",
  "Netral": "var(--ypt-sentimen-netral)",
  "Negatif": "var(--ypt-sentimen-negatif)",
  "Sangat Negatif": "var(--ypt-sentimen-sangat-negatif)",
};

const BULAN = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus",
  "September", "Oktober", "November", "Desember"];

/** "2026-05" -> "Mei 2026". String kosong kalau tidak bisa diurai. */
export function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const [y, m] = String(periodeId).split("-").map(Number);
  return `${BULAN[m - 1] || ""} ${y || ""}`.trim();
}

/** Bulatkan ke bilangan bulat, aman terhadap null. Dipakai semua tampilan persen. */
export function bulat(n) {
  return n == null || Number.isNaN(n) ? null : Math.round(n);
}

/**
 * Rata-rata tertimbang: dipakai di SEMUA agregasi antar sekolah (persen jenjang, persen yayasan,
 * persen aspek). Sengaja tertimbang jumlah siswa, bukan rata-rata dari rata-rata -- sekolah
 * dengan 800 siswa dan sekolah dengan 40 siswa tidak boleh berbobot sama pada angka yayasan.
 * Baris tanpa nilai atau tanpa bobot diabaikan, bukan dihitung sebagai nol.
 */
export function rataTertimbang(rows, ambilNilai, ambilBobot) {
  let totalNilai = 0;
  let totalBobot = 0;
  (rows || []).forEach((r) => {
    const nilai = ambilNilai(r);
    const bobot = ambilBobot(r);
    if (nilai == null || !bobot) return;
    totalNilai += nilai * bobot;
    totalBobot += bobot;
  });
  return totalBobot > 0 ? totalNilai / totalBobot : null;
}
