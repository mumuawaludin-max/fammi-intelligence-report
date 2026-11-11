import { HEART, LAPORAN_RAKA } from "../bersama/heart";
import { DUKUNGAN_RAKA } from "../bersama/dukungan";
import { checklistAnak } from "../bersama/tindakLanjut";
import { ALUR } from "../bersama/alur";

/**
 * Data contoh aplikasi ponsel orang tua (Ibu Dewi, ibu Raka Pratama kelas 2B) dan mode cerita anak
 * di prototipe Sekolah Proteksi. Hasil HEART, peta dukungan, dan checklist dibaca dari berkas
 * bersama (bersama/heart.js, dukungan.js, tindakLanjut.js) supaya sama dengan layar sekolah; berkas
 * ini hanya menyimpan yang khas aplikasi orang tua. Semua nama, kelas, jam, dan kode lacak adalah
 * contoh untuk demonstrasi.
 */

/** Jalur ikon yang tidak ada di ikonData.js (viewBox 0 0 24 24). */
export const IC = {
  daftar: "M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z",
  tangan: "M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z",
  obrolan: "M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z",
  sendiri: "M8.65 5.82C9.36 4.72 10.6 4 12 4c2.21 0 4 1.79 4 4 0 1.4-.72 2.64-1.82 3.35L8.65 5.82zM20 17.17c-.02-1.1-.63-2.11-1.61-2.62-.54-.28-1.13-.54-1.77-.76L20 17.17zm1.19 4.02L2.81 2.81 1.39 4.22l8.89 8.89c-1.81.23-3.39.79-4.67 1.45C4.61 15.07 4 16.1 4 17.22V20h13.17l2.61 2.61 1.41-1.42z",
  sedih: "M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 3c-2.33 0-4.31 1.46-5.11 3.5h10.22c-.8-2.04-2.78-3.5-5.11-3.5z",
  lainnya: "M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  jempol: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
  keluarga: "M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 7h-.08c-.65 0-1.22.42-1.42 1.03L15.5 12.5 13.43 14l.07.1L16 18v4h4zm-7.5-10.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5zM5.5 6c1.11 0 2-.89 2-2s-.89-2-2-2-2 .89-2 2 .89 2 2 2zm2 16v-7H9V9c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v6h1.5v7h4zm6.5 0v-4h1v-4c0-.82-.67-1.5-1.5-1.5h-2c-.83 0-1.5.68-1.5 1.5v4h1v4h3z",
};

/* ---------- navigasi ponsel ---------- */

/** Tab bawah. Id "heart", "checklist", "laporanku" juga dipakai aksi { jenis: "buka", id }. */
export const TAB = [
  { id: "beranda", label: "Beranda", nama: "rumah" },
  { id: "heart", label: "Hasil HEART", nama: "hati" },
  { id: "checklist", label: "Checklist", nama: "ceklis" },
  { id: "laporanku", label: "Laporanku", d: IC.daftar },
];
export const TAB_IDS = TAB.map((t) => t.id);

/** Judul kepala aplikasi di tiap tab. */
export const JUDUL_TAB = {
  beranda: "Halo, Ibu Dewi",
  heart: "Hasil HEART Raka",
  checklist: "Checklist Raka",
  laporanku: "Laporanku",
};

/**
 * Pintasan di samping ponsel (desktop saja): langkah dua alur yang bisa dicoba di aplikasi ini.
 * `id` = tab atau alur ("lapor") yang dibuka.
 */
export const PINTASAN = [
  {
    id: "cegah",
    nama: "Alur pencegahan",
    ikon: "perisaiCentang",
    langkah: [
      { id: "heart", label: "Hasil HEART", ket: "Arti tiap aspek dan saran di rumah" },
      { id: "checklist", label: "Checklist rumah", ket: "Dicentang Ibu, terlihat wali kelas" },
    ],
  },
  {
    id: "kejadian",
    nama: "Alur kejadian",
    ikon: "lapor",
    langkah: [
      { id: "lapor", label: "Lapor Aman", ket: "Bisa tanpa nama, ada mode cerita anak" },
      { id: "laporanku", label: "Laporanku", ket: "Tahap laporan dan pesan sekolah" },
    ],
  },
];

/* ---------- hasil HEART Raka ---------- */

export const ANAK = LAPORAN_RAKA.anak;

/** Status per aspek, bentuk yang dibaca PetaHati dan HurufHeart: { idAspek: status }. */
export const HASIL_RAKA = Object.fromEntries(HEART.map((a) => [a.id, LAPORAN_RAKA.aspek[a.id].status]));

/** Aspek dikelompokkan menurut status, urut HEART. */
export const ASPEK_PER_STATUS = {
  waspada: HEART.filter((a) => HASIL_RAKA[a.id] === "waspada"),
  perhatian: HEART.filter((a) => HASIL_RAKA[a.id] === "perhatian"),
  baik: HEART.filter((a) => HASIL_RAKA[a.id] === "baik"),
};

/** Aspek yang dibuka pertama kali: yang paling perlu didampingi. */
export const ASPEK_UTAMA = (ASPEK_PER_STATUS.waspada[0] || ASPEK_PER_STATUS.perhatian[0] || HEART[0]).id;

/** Nada catatan "Artinya" di detail aspek, menurut status. */
export const CATATAN_STATUS = {
  baik: { nada: "ok", ikon: "sukses" },
  perhatian: { nada: "warn", ikon: "info" },
  waspada: { nada: "bad", ikon: "peringatan" },
};

/* ---------- siapa yang mendampingi Raka ---------- */

const PENDAMPING_SEKOLAH = ["Bu Rina Kartika", "Bu Laras"];
const BUKAN_KELUARGA = DUKUNGAN_RAKA.kelompok.filter((k) => k.id !== "keluarga").flatMap((k) => k.orang);

/** Ditonjolkan: buddy, wali kelas, dan Guru BK. */
export const PENDAMPING_UTAMA = BUKAN_KELUARGA.filter((o) => o.buddy || PENDAMPING_SEKOLAH.includes(o.nama));
/** Orang lain di peta dukungan, cukup disebut sekali. */
export const PENDAMPING_LAIN = BUKAN_KELUARGA.filter((o) => !PENDAMPING_UTAMA.includes(o));

/* ---------- checklist ---------- */

const BUTIR_RAKA = checklistAnak(ANAK.nama);
/** Tugas di rumah: boleh dicentang Ibu Dewi. */
export const TUGAS_RUMAH = BUTIR_RAKA.filter((c) => c.oleh === "ortu");
/** Tugas wali kelas, Guru BK, dan guru piket: hanya dibaca di aplikasi orang tua. */
export const TUGAS_SEKOLAH = BUTIR_RAKA.filter((c) => c.oleh !== "ortu");
export const EVALUASI = BUTIR_RAKA.find((c) => c.id === "raka-evaluasi")?.waktu || "Kamis, 3 Des";

/* ---------- laporan (alur kejadian) ---------- */

/** Lima langkah alur kejadian, label dari bersama/alur.js. */
export const LANGKAH_KEJADIAN = ALUR.kejadian.langkah.map((l) => ({ id: l.id, label: l.label }));

/** Laporan Ibu Dewi tentang Raka. Sama dengan KS-015 di layar Kasus. `tahap` = langkah yang sedang berjalan. */
export const KS015 = {
  kode: "KS-015",
  judul: "Raka didorong dan dipukul kakak kelas",
  dikirim: "dikirim hari ini 08.12",
  tingkat: "Tinggi",
  tahap: "tangani",
  sla: {
    judul: "Respon pertama sebelum 12.12 hari ini",
    ket: "Raka ditemui dan dipastikan aman, lalu Ibu dikabari.",
  },
  penangan: [
    { inisial: "RK", nama: "Bu Rina", peran: "wali kelas 2B" },
    { inisial: "LA", nama: "Bu Laras", peran: "Guru BK" },
  ],
  langkah: {
    lapor: { waktu: "08.12", ket: "Laporan Ibu masuk lewat Lapor Aman." },
    triage: { waktu: "08.40", ket: "Bu Laras menilai tingkatnya Tinggi: kekerasan fisik yang berulang." },
    tugas: { waktu: "08.41", ket: "Bu Rina dan Bu Laras ditugaskan. Kepala Sekolah ikut diberi tahu." },
    tangani: {
      waktu: "sebelum 12.12",
      ket: "Bu Rina menemui Raka dan mencatat kronologi. Rencana penanganan disusun paling lambat Jumat, 13 Nov.",
    },
    pantau: { waktu: "2-4 minggu", ket: "Kondisi Raka dicek tiap minggu, lalu laporan ditutup bersama Ibu." },
  },
};

/** Kejadian lain yang melibatkan Raka dan sudah selesai (KS-008 di layar Kasus). */
export const RIWAYAT_LAPORAN = [
  {
    kode: "KS-008",
    judul: "Saling ejek dan dorong saat antre",
    tanggal: "Jum 30 Okt",
    selesai: "Sel 3 Nov",
    oleh: "dilaporkan wali kelas 2B",
  },
];

/** Janji respon sekolah per tingkat, dipakai Lapor Aman dan laporan baru. */
export const JANJI_RESPON = {
  Darurat: "paling lambat 1 jam, Kepala Sekolah langsung menerima laporan ini",
  Tinggi: "paling lambat 4 jam di hari sekolah",
  Sedang: "paling lambat 1 hari sekolah",
  Rendah: "paling lambat 2 hari sekolah",
};

/** Laporan yang dibuat selama demo selalu mulai di langkah Triage. */
export function laporanBaru({ kode, judul, tingkat, sumber, jam }) {
  return {
    kode,
    judul,
    dikirim: `dikirim hari ini ${jam}`,
    tingkat,
    tahap: "triage",
    sla: {
      judul: `Sekolah merespons ${JANJI_RESPON[tingkat]}`,
      ket: "Guru BK menilai tingkat keseriusan, lalu menunjuk penanggung jawab.",
    },
    langkah: {
      lapor: { waktu: jam, ket: `Laporan masuk lewat ${sumber}.` },
      triage: { ket: "Guru BK menilai tingkat keseriusan laporan." },
      tugas: { ket: "Sekolah menunjuk penanggung jawab dan batas waktunya." },
      tangani: { ket: "Respon pertama: anak ditemui dan Ibu dikabari." },
      pantau: { ket: "Kondisi anak dicek 2 sampai 4 minggu, lalu laporan ditutup." },
    },
  };
}

/** Kode lacak laporan baru selama demo, dipakai berurutan. */
export const KODE_LACAK = ["LA-8M2T", "LA-3KQ7", "LA-5RW9"];
export const JAM_LAPORAN_BARU = "10.36";

export const PESAN_AWAL = [
  {
    saya: false,
    dari: "Bu Laras, Guru BK · 08.45",
    teks: "Terima kasih sudah melapor, Bu Dewi. Bu Rina akan menemui Raka sebelum istirahat kedua, dan kami kabari hasilnya hari ini.",
  },
];
export const PENGIRIM_BALASAN = "Anda · 10.38";

/* ---------- Lapor Aman ---------- */

/** `tingkat` menentukan janji respon sekolah, kecuali anak dalam bahaya (selalu Darurat). */
export const JENIS_KEJADIAN = [
  { label: "Disakiti secara fisik", d: IC.tangan, tingkat: "Tinggi" },
  { label: "Diejek atau dihina", d: IC.obrolan, tingkat: "Sedang" },
  { label: "Dijauhi atau dikucilkan", d: IC.sendiri, tingkat: "Sedang" },
  { label: "Orang dewasa bersikap tidak wajar", nama: "peringatan", tingkat: "Darurat" },
  { label: "Anak tampak sangat tertekan", d: IC.sedih, tingkat: "Tinggi" },
  { label: "Lainnya", d: IC.lainnya, tingkat: "Sedang" },
];
/** Indeks 2 (Ya) berarti anak dalam bahaya sekarang. */
export const PILIHAN_BAHAYA = ["Tidak", "Tidak yakin", "Ya"];
export const PILIHAN_ANAK = ["Raka", "Anak lain"];
export const PILIHAN_KAPAN = ["Hari ini", "Kemarin", "Minggu ini", "Lebih lama"];
export const PILIHAN_TEMPAT = ["Kelas", "Kantin", "Halaman", "Toilet", "Antar-jemput", "Pesan atau daring", "Luar sekolah"];
export const NAMA_LANGKAH = ["Apa yang terjadi", "Cerita singkat", "Identitas dan kirim"];

/** Isian formulir saat Lapor Aman dibuka; dibuka ulang selalu mulai dari sini. */
export const ISIAN_AWAL = {
  jenis: "",
  bahaya: 0,
  anak: "Raka",
  kapan: "Hari ini",
  tempat: "Kantin",
  cerita: "",
  tanpaNama: false,
};

/* ---------- mode cerita anak ---------- */

/** Wajah perasaan: warna wajah dan jalur mulut (mata dan mulut ungu tua). Nilai dari kanvas desain. */
export const WAJAH = [
  { label: "Senang", isi: "#FFD66B", mulut: "M8 14 Q12 18 16 14" },
  { label: "Biasa saja", isi: "#FFE7A8", mulut: "M8.5 15 L15.5 15" },
  { label: "Sedih", isi: "#A9C9F7", mulut: "M8 16.5 Q12 12.5 16 16.5" },
  { label: "Takut", isi: "#D5C6FA", mulut: "M10 16 Q12 14 14 16 Q12 18 10 16" },
  { label: "Marah", isi: "#FFB199", mulut: "M8 16.5 Q12 13 16 16.5 M7.5 7.5 L10.5 8.8 M16.5 7.5 L13.5 8.8" },
];

/** `nada` = warna ubin ikon (r merah, a kuning, p ungu, g hijau); `tingkat` = tingkat awal laporannya. */
export const GAMBAR_KEJADIAN = [
  { label: "Ada yang memukul atau mendorongku", d: IC.tangan, nada: "r", tingkat: "Tinggi" },
  { label: "Ada yang mengejekku", d: IC.obrolan, nada: "a", tingkat: "Sedang" },
  { label: "Aku tidak diajak main", d: IC.sendiri, nada: "a", tingkat: "Sedang" },
  { label: "Ada orang dewasa yang membuatku tidak nyaman", nama: "peringatan", nada: "r", tingkat: "Darurat" },
  { label: "Aku sedih terus", d: IC.sedih, nada: "p", tingkat: "Tinggi" },
  { label: "Tidak ada, aku baik-baik saja", d: IC.jempol, nada: "g", tingkat: null },
];
/** Pilihan yang menutup mode anak tanpa membuat laporan. */
export const KEJADIAN_BAIK = "Tidak ada, aku baik-baik saja";

/**
 * Orang dewasa yang dipilih anak. `sapaan` dipakai di layar terima kasih, `peran` = sudut pandang
 * yang diberi tahu lewat lonceng (null: cerita disimpan untuk orang tua, tidak dikirim ke sekolah).
 */
export const ORANG_DIPERCAYA = [
  { label: "Ayah atau Ibu", d: IC.keluarga, nada: "g", sapaan: "Ayah atau Ibu", peran: null },
  { label: "Bu Guru di kelasku", nama: "orang", nada: "p", sapaan: "Bu Guru", peran: ["walas", "bk"] },
  { label: "Bu Laras, guru BK", nama: "hati", nada: "a", sapaan: "Bu Laras", peran: "bk" },
];
