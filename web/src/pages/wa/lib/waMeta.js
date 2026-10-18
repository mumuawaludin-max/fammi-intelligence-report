// Metadata modul Wellbeing Assessment (wa): aspek PROTEK, dimensi kepuasan, kategori, pertanyaan
// pilihan ganda dan terbuka. Berkas ini sengaja tanpa impor apa pun supaya bisa dipakai pembaca
// (Node) dan uji. Ikon ada di waIkon.js, warna di waTokens.module.css.
//
// Label kategori dan judul tab dikumpulkan di satu tempat (KATEGORI_PROTEK, JUDUL_TAB_WELLBEING).
// Kategori terbawah tampil sebagai "Perlu Pendampingan" (keputusan pemilik produk 2026-10-19).

export const MODUL_WA = "wa";

/** Enam aspek PROTEK, urutan tetap p r o t e k. Label produk dari sheet PARAMETER berkas olahan. */
export const ASPEK = [
  {
    kunci: "p", huruf: "P", label: "Penerimaan Diri",
    arti: "Seberapa nyaman menerima diri sendiri, termasuk perjalanan hidup dan pencapaian sejauh ini.",
  },
  {
    kunci: "r", huruf: "R", label: "Relasi dengan Orang Lain",
    arti: "Hubungan yang hangat dan saling percaya dengan keluarga, teman, dan rekan kerja.",
  },
  {
    kunci: "o", huruf: "O", label: "Optimalisasi Potensi Diri",
    arti: "Keyakinan bahwa diri masih terus belajar dan berkembang, serta mau mencoba hal baru.",
  },
  {
    kunci: "t", huruf: "T", label: "Tujuan Hidup",
    arti: "Arah dan makna dalam keseharian, serta rencana yang ingin diwujudkan ke depan.",
  },
  {
    kunci: "e", huruf: "E", label: "Eksplorasi Tempat Kerja",
    arti: "Kemampuan mengatur tanggung jawab sehari-hari dan menata lingkungan sesuai kebutuhan.",
  },
  {
    kunci: "k", huruf: "K", label: "Kemandirian Personal",
    arti: "Keberanian bersikap dan menilai diri dengan ukuran sendiri, tanpa mudah terbawa tekanan orang lain.",
  },
];

export const KUNCI_ASPEK = ASPEK.map((a) => a.kunci);

export function infoAspek(kunci) {
  return ASPEK.find((a) => a.kunci === kunci) || null;
}

/** Enam dimensi kepuasan kerja, dua item tiap dimensi (lihat sheet PARAMETER). */
export const DIMENSI_KEPUASAN = [
  { kunci: "peran_pekerjaan", label: "Peran & Pekerjaan", baris: ["Peran &", "Pekerjaan"], arti: "Kepuasan pada pekerjaan dan tugas yang diberikan." },
  { kunci: "kepemimpinan_keputusan", label: "Kepemimpinan & Keputusan", baris: ["Kepemimpinan", "& Keputusan"], arti: "Kepuasan pada kepemimpinan pimpinan dan keputusan yang diambil." },
  { kunci: "relasi_budaya", label: "Relasi & Budaya Kerja", baris: ["Relasi & Budaya", "Kerja"], arti: "Kepuasan pada hubungan dengan rekan kerja dan budaya kolaborasi." },
  { kunci: "organisasi_komunikasi", label: "Organisasi & Komunikasi", baris: ["Organisasi &", "Komunikasi"], arti: "Kepuasan pada pencapaian lembaga dan keterbukaan komunikasi." },
  { kunci: "pengembangan_karir", label: "Pengembangan & Karir", baris: ["Pengembangan", "& Karir"], arti: "Kepuasan pada pengembangan diri dan peluang karier di tempat kerja." },
  { kunci: "keseimbangan_apresiasi", label: "Keseimbangan & Apresiasi", baris: ["Keseimbangan", "& Apresiasi"], arti: "Kepuasan pada keseimbangan kerja dan hidup, serta sistem penghargaan." },
];

export const KUNCI_DIMENSI = DIMENSI_KEPUASAN.map((d) => d.kunci);

export function infoDimensi(kunci) {
  return DIMENSI_KEPUASAN.find((d) => d.kunci === kunci) || null;
}

// ── Kategori ────────────────────────────────────────────────────────────────────────────────

export const JUDUL_TAB_WELLBEING = "Kesehatan Mental";

/** Kategori PROTEK. Kunci tetap; label boleh diganti di sini saja. */
export const KATEGORI_PROTEK = [
  { kunci: "baik", label: "Baik", warna: "var(--wa-baik)", teks: "#ffffff", arti: "Skor di rentang atas: total 141 sampai 252, atau 29 sampai 42 per aspek." },
  { kunci: "perluPerhatian", label: "Perlu Perhatian", warna: "var(--wa-perhatian)", warnaTeks: "#c28a00", teks: "#222222", arti: "Skor di rentang tengah: total 71 sampai 140, atau 15 sampai 28 per aspek." },
  { kunci: "pendampingan", label: "Perlu Pendampingan", warna: "var(--wa-pendampingan)", teks: "#ffffff", arti: "Skor di rentang bawah: total 70 ke bawah, atau 14 ke bawah per aspek." },
];

/**
 * Label teks di berkas ke kunci kategori. Berkas lama memakai label kategori terbawah yang kini
 * dilarang tampil (keputusan pemilik produk 2026-10-19); label itu dan "Perlu Pendampingan"
 * sama-sama jatuh ke kunci pendampingan.
 */
export function kunciKategoriProtek(label) {
  const t = String(label || "").toLowerCase();
  if (t.includes("baik")) return "baik";
  if (t.includes("pendampingan") || t.includes(LABEL_LAMA_TERBAWAH)) return "pendampingan";
  if (t.includes("perlu")) return "perluPerhatian";
  return null;
}

/** Label kategori terbawah di berkas olahan lama. Hanya untuk membaca, tidak pernah tampil. */
export const LABEL_LAMA_TERBAWAH = "waspada";

/** Kata yang dilarang tampil di modul ini; dipakai uji dan normalisasi narasi di pembaca. */
export const KATA_TERLARANG = new RegExp(LABEL_LAMA_TERBAWAH, "i");

export function infoKategoriProtek(kunci) {
  return KATEGORI_PROTEK.find((k) => k.kunci === kunci) || null;
}

/** Kategori item PROTEK per orang dan per kelompok (kuat, cukup, perlu penguatan). */
export const KATEGORI_ITEM = [
  { kunci: "kuat", label: "Sudah kuat", warna: "var(--fm-ungu)" },
  { kunci: "cukup", label: "Cukup", warna: "var(--wa-ungu-lembut)" },
  { kunci: "perlu", label: "Perlu penguatan", warna: "var(--fm-jingga)" },
];

export function kunciKategoriItem(label) {
  const t = String(label || "").toLowerCase();
  if (t.startsWith("kuat")) return "kuat";
  if (t.startsWith("cukup")) return "cukup";
  if (t.startsWith("perlu")) return "perlu";
  return null;
}

/** Kepuasan lima tingkat, urut dari paling puas. */
export const KATEGORI_KEPUASAN_5 = [
  { kunci: "sangatPuas", label: "Sangat Puas", warna: "var(--fm-hijau)", teks: "#ffffff" },
  { kunci: "puas", label: "Puas", warna: "var(--wa-hijau-muda)", warnaTeks: "#2e9e6b", teks: "#ffffff" },
  { kunci: "netral", label: "Netral", warna: "var(--wa-netral)", warnaTeks: "var(--wa-netral-gelap)", teks: "#222222" },
  { kunci: "tidakPuas", label: "Tidak Puas", warna: "var(--wa-jingga-muda)", warnaTeks: "#e2603a", teks: "#ffffff" },
  { kunci: "sangatTidakPuas", label: "Sangat Tidak Puas", warna: "var(--fm-jingga)", teks: "#ffffff" },
];

/** Kepuasan tiga tingkat untuk kartu ringkasan. */
export const KATEGORI_KEPUASAN_3 = [
  { kunci: "puas", label: "Puas", warna: "var(--fm-hijau)", teks: "#ffffff", arti: "Rata-rata kepuasan 3,40 ke atas pada skala 1 sampai 5." },
  { kunci: "netral", label: "Netral", warna: "var(--wa-netral-gelap)", warnaBar: "var(--wa-netral)", teks: "#ffffff", arti: "Rata-rata kepuasan 2,60 sampai 3,39 pada skala 1 sampai 5." },
  { kunci: "tidakPuas", label: "Tidak Puas", warna: "var(--fm-jingga)", teks: "#ffffff", arti: "Rata-rata kepuasan di bawah 2,60." },
];

export function kunciKategoriKepuasan(label) {
  const t = String(label || "").toLowerCase().replace(/\s+/g, " ").trim();
  if (t === "sangat puas") return "sangatPuas";
  if (t === "puas") return "puas";
  if (t === "netral") return "netral";
  if (t === "tidak puas") return "tidakPuas";
  if (t === "sangat tidak puas") return "sangatTidakPuas";
  return null;
}

export function infoKepuasan5(kunci) {
  return KATEGORI_KEPUASAN_5.find((k) => k.kunci === kunci) || null;
}

export function infoKepuasan3(kunci) {
  return KATEGORI_KEPUASAN_3.find((k) => k.kunci === kunci) || null;
}

// ── Pertanyaan ──────────────────────────────────────────────────────────────────────────────

/** Enam pilihan ganda. `judul` untuk laporan kelompok, `judulSaya` untuk laporan individu. */
export const PERTANYAAN_PILIHAN = [
  { kode: "disukai", judul: "Hal yang paling disukai pegawai", judulSaya: "Saya paling menyukai", warna: "var(--fm-ungu)", nada: "positif" },
  { kode: "tidak_disukai", judul: "Hal yang paling tidak disukai", judulSaya: "Yang paling mengganggu saya", warna: "var(--wa-kuning)", nada: "negatif" },
  { kode: "mudah", judul: "Hal yang paling mudah dilakukan", judulSaya: "Yang terasa mudah", warna: "var(--fm-hijau)", nada: "positif" },
  { kode: "sulit", judul: "Hal yang paling sulit dilakukan", judulSaya: "Yang terasa sulit", warna: "var(--fm-jingga)", nada: "negatif" },
  { kode: "keputusan_disukai", judul: "Keputusan pimpinan yang disukai", judulSaya: "Keputusan pimpinan yang saya apresiasi", warna: "var(--fm-ungu)", nada: "positif" },
  { kode: "keputusan_tidak_disukai", judul: "Keputusan pimpinan yang tidak disukai", judulSaya: "Keputusan yang paling kurang saya sukai", warna: "var(--wa-kuning)", nada: "negatif" },
];

export const KODE_PILIHAN = PERTANYAAN_PILIHAN.map((p) => p.kode);

/** Pilihan "tidak ada" dan "belum bisa menjawab" ditampilkan redup di bawah daftar. */
export function pilihanNetral(teks) {
  return /belum bisa menjawab|^tidak ada/i.test(String(teks || "").trim());
}

/** Empat pertanyaan terbuka (bahan tab Testimoni). */
export const PERTANYAAN_TERBUKA = [
  { kode: "tempat_kerja_lebih_baik", judul: "Satu hal yang menurut pegawai bisa membuat tempat kerja lebih baik", pendek: "Tempat kerja lebih baik", warna: "var(--fm-ungu)" },
  { kode: "kebijakan_diubah", judul: "Satu kebijakan di tempat kerja yang ingin diubah, dan alasannya", pendek: "Kebijakan yang ingin diubah", warna: "var(--fm-hijau)" },
  { kode: "pimpinan_efektif", judul: "Saran agar pimpinan lebih efektif dalam mendukung tim", pendek: "Saran untuk pimpinan", warna: "var(--fm-jingga)" },
  { kode: "pelatihan_dibutuhkan", judul: "Keterampilan atau pelatihan yang dibutuhkan untuk berkembang", pendek: "Pelatihan yang dibutuhkan", warna: "var(--wa-kuning)" },
];

export const KODE_TERBUKA = PERTANYAAN_TERBUKA.map((p) => p.kode);

export function infoTerbuka(kode) {
  return PERTANYAAN_TERBUKA.find((p) => p.kode === kode) || null;
}

/** Chip peran di kartu testimoni. */
export const PERAN_TESTIMONI = ["Pimpinan Sekolah", "Guru", "Staf dan Karyawan", "Lainnya"];

// ── Cakupan ─────────────────────────────────────────────────────────────────────────────────

export const CAKUPAN = [
  { kunci: "lembaga", label: "Lembaga" },
  { kunci: "jenjang", label: "Jenjang" },
  { kunci: "unit", label: "Unit" },
  { kunci: "kelompok_jabatan", label: "Kelompok jabatan" },
];

/** Prioritas tindak lanjut. */
export const PRIORITAS = [
  { kunci: "tinggi", label: "Prioritas tinggi", warna: "var(--fm-jingga)" },
  { kunci: "sedang", label: "Prioritas sedang", warna: "var(--wa-kuning)" },
  { kunci: "rendah", label: "Prioritas rendah", warna: "var(--fm-hijau)" },
];

/**
 * Label untuk kunci di field "terkait" narasi ("sulit; kebijakan_diubah; e"). Kunci yang tidak
 * dikenal ditampilkan apa adanya supaya tidak ada informasi yang hilang diam-diam.
 */
export function labelTerkait(teks) {
  return String(teks || "")
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((k) => {
      const kecil = k.toLowerCase();
      const aspek = ASPEK.find((a) => a.kunci === kecil);
      if (aspek) return aspek.label;
      const dim = DIMENSI_KEPUASAN.find((d) => d.kunci === kecil);
      if (dim) return dim.label;
      const pil = PERTANYAAN_PILIHAN.find((p) => p.kode === kecil);
      if (pil) return pil.judul.replace(/ pegawai$/, "");
      const ter = PERTANYAAN_TERBUKA.find((p) => p.kode === kecil);
      if (ter) return ter.pendek;
      return k;
    });
}

/** Kalimat penutup laporan, dipakai di kaki halaman kedua laporan. */
export const KALIMAT_BUKAN_DIAGNOSIS =
  "Laporan ini menggambarkan jawaban saat asesmen diisi. Laporan ini bukan diagnosis dan bukan penilaian kinerja.";
