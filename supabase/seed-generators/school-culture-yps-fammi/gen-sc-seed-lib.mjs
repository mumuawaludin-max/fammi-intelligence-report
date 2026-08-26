// Bagian 1 generator seed School Culture: PRNG, kamus nama, konfigurasi unit, dan pembangkit
// jawaban Likert mentah per responden. Dipakai gen-sc-seed.mjs.

/** PRNG deterministik (mulberry32) supaya menjalankan ulang generator menghasilkan SQL identik. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeUuidFactory(rand) {
  const hex = "0123456789abcdef";
  return function uuid() {
    let out = "";
    for (let i = 0; i < 32; i++) {
      if (i === 12) { out += "4"; continue; }
      if (i === 16) { out += hex[(Math.floor(rand() * 4) + 8)]; continue; }
      out += hex[Math.floor(rand() * 16)];
    }
    return `${out.slice(0, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}-${out.slice(16, 20)}-${out.slice(20)}`;
  };
}

export const NAMA_DEPAN_L = [
  "Ahmad", "Bagas", "Bayu", "Dedi", "Dimas", "Eko", "Fajar", "Farhan", "Gilang", "Hendra",
  "Ilham", "Irfan", "Joko", "Kurnia", "Lukman", "Mahfud", "Nanda", "Oki", "Panji", "Rizal",
  "Rangga", "Satria", "Taufik", "Umar", "Vino", "Wahyu", "Yusuf", "Zaki", "Adit", "Bimo",
  "Candra", "Doni", "Erlangga", "Fikri", "Galih", "Haris", "Iqbal", "Jefri", "Kemal", "Lutfi",
];
export const NAMA_DEPAN_P = [
  "Anisa", "Bunga", "Citra", "Dewi", "Elis", "Fitri", "Gita", "Hana", "Indah", "Julia",
  "Kartika", "Lestari", "Maya", "Nadia", "Oktavia", "Putri", "Ratna", "Sinta", "Tania", "Ulfa",
  "Vera", "Wulan", "Yani", "Zahra", "Alifia", "Bella", "Cindy", "Dinda", "Erika", "Fani",
  "Ghina", "Hesti", "Ika", "Jihan", "Kiki", "Laras", "Mira", "Nurul", "Olivia", "Prita",
];
/** Nama belakang netral, dipakai untuk semua responden. */
export const NAMA_BELAKANG = [
  "Pratama", "Wijaya", "Nugroho", "Santoso", "Kusuma", "Hidayat", "Maulana", "Setiawan",
  "Firmansyah", "Ramadhan", "Saputra", "Permana", "Wibowo", "Hakim", "Kurniawan", "Gunawan",
  "Sanjaya", "Ardiansyah", "Prasetyo", "Halim", "Nasution", "Siregar", "Cahyono", "Iskandar",
  "Pranata", "Wicaksono", "Herlambang", "Mahendra",
];
/** Nama belakang yang lazim dipakai perempuan, cuma dipasangkan ke responden perempuan supaya
 * kombinasi nama di daftar akun tidak terbaca janggal. */
export const NAMA_BELAKANG_P = [
  "Rahmawati", "Puspita", "Handayani", "Anggraini", "Lestari", "Suryani", "Safitri", "Marlina",
  "Utami", "Yuliana", "Rahayu", "Fauziah", "Amalia", "Wardani", "Novita", "Mulyani",
];

/**
 * Enam unit di bawah Yayasan Pendidikan Sekolah Fammi. `bias` menggeser rata-rata jawaban
 * Likert unit itu terhadap target lembaga, jadi tiap unit punya karakter sendiri di dashboard
 * (mis. SMP condong Aturan, SMA condong Orientasi) dan agregat sekolah tetap keluar dari
 * rata-rata jawaban yang benar-benar dibangkitkan, bukan angka yang ditulis terpisah.
 */
export const UNITS = [
  {
    unit: "TK Fammi", jenjang: "TK", jumlah: 15,
    biasG: { kekeluargaan: 0.55, inovasi: 0.15, orientasi: -0.35, aturan: -0.2 },
    biasH: { kekeluargaan: 0.4, inovasi: 0.2, orientasi: -0.3, aturan: -0.25 },
    biasB: 0.35,
  },
  {
    unit: "SD Fammi", jenjang: "SD", jumlah: 45,
    biasG: { kekeluargaan: 0.3, inovasi: 0.05, orientasi: -0.1, aturan: 0 },
    biasH: { kekeluargaan: 0.2, inovasi: 0.15, orientasi: -0.05, aturan: -0.05 },
    biasB: 0.15,
  },
  {
    unit: "SMP Fammi", jenjang: "SMP", jumlah: 35,
    biasG: { kekeluargaan: -0.2, inovasi: -0.2, orientasi: 0.1, aturan: 0.4 },
    biasH: { kekeluargaan: 0.05, inovasi: 0.25, orientasi: 0.05, aturan: -0.15 },
    biasB: -0.15,
  },
  {
    unit: "SMA Fammi", jenjang: "SMA", jumlah: 30,
    biasG: { kekeluargaan: -0.3, inovasi: -0.15, orientasi: 0.45, aturan: 0.15 },
    biasH: { kekeluargaan: 0.15, inovasi: 0.3, orientasi: 0.2, aturan: -0.2 },
    biasB: -0.3,
  },
  {
    unit: "SMK Fammi", jenjang: "SMK", jumlah: 15,
    biasG: { kekeluargaan: -0.15, inovasi: 0.25, orientasi: 0.4, aturan: 0.05 },
    biasH: { kekeluargaan: 0.1, inovasi: 0.45, orientasi: 0.25, aturan: -0.15 },
    biasB: -0.2,
  },
  {
    unit: "Tata Usaha & Kantor Yayasan", jenjang: "Non-Jenjang (TU, Kantor Yayasan)", jumlah: 10,
    biasG: { kekeluargaan: 0.05, inovasi: -0.35, orientasi: 0.05, aturan: 0.45 },
    biasH: { kekeluargaan: 0.15, inovasi: 0.2, orientasi: 0, aturan: -0.1 },
    biasB: -0.05,
  },
];

export const TIPE_KODE = ["kekeluargaan", "inovasi", "orientasi", "aturan"];
export const TIPE_LABEL = {
  kekeluargaan: "Kekeluargaan", inovasi: "Inovasi", orientasi: "Orientasi", aturan: "Aturan",
};

export const DIMENSI = [
  { prefix: "karakter", kode: "karakter_lembaga", label: "Karakter Lembaga", offset: 0.3 },
  { prefix: "leadership", kode: "kepemimpinan", label: "Kepemimpinan", offset: -0.1 },
  { prefix: "manajemen", kode: "management", label: "Manajemen", offset: -0.15 },
  { prefix: "sinergi", kode: "sinergi", label: "Sinergi Tim", offset: -0.3 },
  { prefix: "fokus", kode: "fokus", label: "Fokus Strategis", offset: 0.15 },
  { prefix: "performance", kode: "performance", label: "Kinerja/Performa", offset: 0.05 },
];

/** Akhiran deskripsi butir, ikut pola kolom Excel hulu (gambaran_<dimensi>_<tipe>_<deskripsi>). */
export const ITEM_SUFFIX = {
  karakter: {
    kekeluargaan: "seperti_keluarga_besar", inovasi: "berani_mencoba_hal_baru",
    orientasi: "fokus_pada_pencapaian", aturan: "tertib_dan_terstruktur",
  },
  leadership: {
    kekeluargaan: "pimpinan_seperti_orang_tua", inovasi: "pimpinan_mendorong_ide_baru",
    orientasi: "pimpinan_menuntut_hasil", aturan: "pimpinan_menjaga_prosedur",
  },
  manajemen: {
    kekeluargaan: "gaya_kerja_kekeluargaan", inovasi: "gaya_kerja_memberi_ruang_coba",
    orientasi: "gaya_kerja_mengejar_target", aturan: "gaya_kerja_ikut_aturan_baku",
  },
  sinergi: {
    kekeluargaan: "perekat_rasa_saling_percaya", inovasi: "perekat_semangat_pembaruan",
    orientasi: "perekat_target_bersama", aturan: "perekat_aturan_yang_sama",
  },
  fokus: {
    kekeluargaan: "menekankan_kepedulian_antaranggota", inovasi: "menekankan_pengembangan_cara_baru",
    orientasi: "menekankan_capaian_terukur", aturan: "menekankan_kestabilan_kerja",
  },
  performance: {
    kekeluargaan: "sukses_diukur_dari_kekompakan", inovasi: "sukses_diukur_dari_terobosan",
    orientasi: "sukses_diukur_dari_hasil_akhir", aturan: "sukses_diukur_dari_ketertiban",
  },
};

/** 13 butir kesejahteraan mentah, dikelompokkan sesuai KESEJAHTERAAN_B_GROUPS di useScData.js. */
export const B_ITEMS = [
  { n: 1, kode: "kepuasan_kepemimpinan", nama: "survey_b1_puas_dengan_cara_kerja_pimpinan", base: 3.2 },
  { n: 2, kode: "kepuasan_kepemimpinan", nama: "survey_b2_percaya_pada_keputusan_pimpinan", base: 3.3 },
  { n: 3, kode: "kepuasan_kepemimpinan", nama: "survey_b3_informasi_dari_pimpinan_terbuka", base: 3.0 },
  { n: 4, kode: "kenyamanan_bekerja", nama: "survey_b4_nyaman_dengan_suasana_kerja", base: 4.0 },
  { n: 5, kode: "kenyamanan_bekerja", nama: "survey_b5_terbiasa_bekerja_sama_dengan_rekan", base: 3.9 },
  { n: 6, kode: "pengembangan_diri", nama: "survey_b6_punya_kesempatan_belajar_hal_baru", base: 3.0 },
  { n: 7, kode: "pengembangan_diri", nama: "survey_b7_didorong_mengembangkan_kemampuan", base: 2.9 },
  { n: 8, kode: "pengembangan_diri", nama: "survey_b8_jalur_pengembangan_karier_terasa_jelas", base: 2.6 },
  { n: 9, kode: "ekspektasi", nama: "survey_b9_beban_kerja_sesuai_yang_dijanjikan", base: 3.2 },
  { n: 10, kode: "ekspektasi", nama: "survey_b10_penghargaan_sepadan_dengan_kerja", base: 3.2 },
  { n: 11, kode: "ekspektasi", nama: "survey_b11_harapan_awal_bekerja_terpenuhi", base: 3.5 },
  { n: 12, kode: "work_life_balance", nama: "survey_b12_punya_waktu_cukup_untuk_keluarga", base: 2.5 },
  { n: 13, kode: "work_life_balance", nama: "survey_b13_bisa_istirahat_tanpa_dikejar_pekerjaan", base: 2.4 },
];

export const KESEJAHTERAAN_LABEL = {
  kepuasan_kepemimpinan: "Kepuasan pada Kepemimpinan",
  kenyamanan_bekerja: "Kenyamanan Bekerja",
  pengembangan_diri: "Pengembangan Diri",
  ekspektasi: "Ekspektasi Terpenuhi",
  work_life_balance: "Work-Life Balance",
};

/** Target rata-rata jawaban Likert seluruh lembaga (skala 1-5) per tipe budaya. Angka inilah
 * yang membentuk cerita periode ini: Kekeluargaan paling terasa, Inovasi paling jauh dari
 * harapan, Aturan dirasa berlebih, Orientasi sudah selaras. */
export const TARGET_G = { kekeluargaan: 3.35, inovasi: 2.45, orientasi: 2.75, aturan: 3.05 };
export const TARGET_H = { kekeluargaan: 3.42, inovasi: 3.2, orientasi: 2.8, aturan: 2.85 };

/** Ambang tampilan T-score/persen 0-100, sama persis kategoriDariNilai() di useScData.js. */
export function kategoriDariNilai(nilai) {
  if (nilai == null) return null;
  if (nilai <= 24) return "Sangat Rendah";
  if (nilai <= 41) return "Rendah";
  if (nilai <= 58) return "Sedang";
  if (nilai <= 74) return "Tinggi";
  return "Sangat Tinggi";
}

export const bulat2 = (n) => Math.round(n * 100) / 100;
export const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
export function sd(arr) {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) * (b - m), 0) / arr.length) || 1;
}
export function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }

/** Likert 1-5 bulat di sekitar target, dengan sebaran yang cukup lebar supaya sebaran per orang
 * tidak seragam (ada yang jauh di bawah dan di atas rata-rata unitnya). */
export function likert(rand, target) {
  const noise = (rand() + rand() + rand() - 1.5) * 1.15;
  return clamp(Math.round(target + noise), 1, 5);
}
