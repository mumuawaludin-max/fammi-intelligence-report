/**
 * Data contoh aplikasi remaja Sekolah Proteksi: Kirana, 14 tahun, kelas 8B, yang mengisi skrining
 * HEART untuk dirinya sendiri (remaja boleh mengisi sendiri; anak kecil lewat orang tua). Bahasanya
 * bahasa remaja sesuai panduan ux-copy: singkat, akrab, tanpa istilah teknis, tanpa menghakimi.
 * Nama aspek, indikator, dan label status HEART tetap sama dengan seluruh prototipe.
 *
 * Screening HEART sudah diisi dan dikunci; membukanya lagi wewenang superadmin Fammi. Hasil, indikator,
 * dan perkembangan di sini data contoh. Tidak ada panggilan ke server dan tidak ada nomor telepon.
 */
import { HEART } from "../bersama/heart.js";
import { WAJAH } from "./orangTuaData.js";

export const REMAJA = { nama: "Kirana", namaLengkap: "Kirana Putri", usia: "14 tahun", kelas: "8B", inisial: "KP" };
export const GURU_BK = "Bu Laras";

/** Screening HEART yang sudah diisi; dibuka ulang hanya oleh tim Fammi. Video penjelasan untuk remaja. */
export const CEK_DIRI = { tanggal: "18 Nov 2026", idVideo: "Q2nk0srMtGc" };

/** Tab bawah aplikasi remaja (bilah melayang). */
export const TAB_REMAJA = [
  { id: "beranda", label: "Beranda", nama: "rumah" },
  { id: "hasil", label: "Hasilku", nama: "hati" },
  { id: "misi", label: "Misi", nama: "ceklis" },
  { id: "lapor", label: "Lapor", nama: "perisaiCentang" },
];

/**
 * Mood harian, digambar dengan wajah datar (bukan emoji). `tanya` = pertanyaan di kolom cerita
 * sesuai emosinya. Sesudah disimpan, `balas` mengakui perasaannya dan `manfaat` menjelaskan kenapa
 * menamai emosi membantu (pelabelan emosi menurunkan intensitasnya dan memudahkan mengaturnya).
 */
export const MOOD = [
  {
    id: "senang",
    label: "Seneng",
    isi: WAJAH[0].isi,
    mulut: WAJAH[0].mulut,
    tanya: "Apa yang bikin kamu seneng hari ini?",
    balas: "Ikut seneng dengernya.",
    manfaat: "Nyatet momen seneng bikin kamu lebih gampang ingat hal baik pas lagi down nanti.",
  },
  {
    id: "biasa",
    label: "B aja",
    isi: WAJAH[1].isi,
    mulut: WAJAH[1].mulut,
    tanya: "Hari ini gimana? Ada yang pengen kamu inget?",
    balas: "Tercatat. Hari yang biasa juga penting.",
    manfaat: "Nyatet tiap hari, termasuk yang biasa, bikin kamu kenal pola perasaanmu sendiri.",
  },
  {
    id: "capek",
    label: "Capek",
    isi: WAJAH[3].isi,
    mulut: "M9 15.5 L15 15.5",
    tanya: "Apa yang paling bikin kamu capek hari ini?",
    balas: "Makasih udah jujur. Capek itu tanda badan dan pikiranmu butuh jeda.",
    manfaat: "Dengan nyebut apa yang bikin capek, kamu jadi tahu apa yang perlu dikurangi atau dibagi.",
  },
  {
    id: "sedih",
    label: "Sedih",
    isi: WAJAH[2].isi,
    mulut: WAJAH[2].mulut,
    tanya: "Apa yang bikin kamu sedih?",
    balas: "Makasih udah cerita. Sedih itu boleh dirasain.",
    manfaat: "Menamai rasa sedih bikin perasaannya lebih ringan dan lebih gampang kamu atur.",
  },
  {
    id: "kesal",
    label: "Kesel",
    isi: WAJAH[4].isi,
    mulut: WAJAH[4].mulut,
    tanya: "Apa yang bikin kamu kesel hari ini?",
    balas: "Makasih udah cerita. Kesel itu manusiawi.",
    manfaat: "Nulis rasa kesel bantu emosimu reda dulu, jadi kamu bisa milih reaksi yang nggak kamu sesali.",
  },
];
export const MOOD_MENURUT_ID = Object.fromEntries(MOOD.map((m) => [m.id, m]));

/** Catatan perasaan sebelumnya (contoh), terbaru di atas. */
export const CATATAN_AWAL = [
  { mood: "capek", tanggal: "Sel, 24 Nov 2026", cerita: "Ulangan dua hari berturut-turut." },
  { mood: "biasa", tanggal: "Sen, 23 Nov 2026", cerita: "" },
];

/** Tanggal hari ini dalam bahasa Indonesia, mis. "Rab, 25 Nov 2026". Dicatat sistem saat mood disimpan. */
export function tanggalHariIni() {
  return new Date().toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/**
 * Hasil Kirana per aspek: skor 0-10, status, arti, lima indikator (urut sama dengan HEART), dan
 * saran ("coba") untuk aspek yang perlu dijaga atau manfaat ("pertahanin") untuk aspek Baik.
 */
export const HASIL_KIRANA = {
  ringkas: "Hasil screening mengindikasikan kamu peduli sama orang lain dan bisa ngatur diri. Dua hal yang terindikasi perlu kamu jaga: perasaan dan pertemanan. Ini gambaran, bukan diagnosis.",
  aspek: {
    hiperaktivitas: {
      skor: 2,
      status: "baik",
      arti: "Terindikasi kamu cukup bisa ngatur energi dan fokus.",
      indikator: [
        ["baik", "Bisa duduk tenang pas pelajaran."],
        ["baik", "Jarang gelisah atau mainin barang terus."],
        ["perhatian", "Fokus kadang buyar kalau kelas lagi rame."],
        ["baik", "Biasanya mikir dulu sebelum bertindak."],
        ["baik", "Nyimak penjelasan guru sampai selesai."],
      ],
      pertahanin: "Fokus yang terjaga bikin kamu lebih santai ngerjain tugas dan nggak gampang ketinggalan pelajaran.",
    },
    emosional: {
      skor: 6,
      status: "perhatian",
      arti: "Terindikasi akhir-akhir ini kamu sering cemas dan mood-mu naik turun.",
      indikator: [
        ["perhatian", "Badan sering nggak enak pas mau berangkat sekolah."],
        ["perhatian", "Sering kepikiran hal yang bikin cemas."],
        ["perhatian", "Lagi jarang ngerasa happy."],
        ["baik", "Masih cukup pede sama kemampuanmu."],
        ["baik", "Jarang ngerasa takut tanpa alasan."],
      ],
      coba: [
        "Tulis 3 hal yang bikin kepikiran sebelum tidur, lalu tutup bukunya.",
        "Tarik napas 4 hitungan, tahan 4, buang 4, kalau mulai cemas.",
      ],
    },
    agresi: {
      skor: 1,
      status: "baik",
      arti: "Terindikasi kamu bisa nahan diri walaupun lagi kesel.",
      indikator: [
        ["baik", "Bisa ngendaliin marah."],
        ["baik", "Ngikutin aturan dan arahan guru."],
        ["baik", "Nggak maksa kemauan ke teman."],
        ["baik", "Jujur sama orang lain."],
        ["baik", "Nggak ngambil barang orang."],
      ],
      pertahanin: "Bisa nahan emosi bikin teman nyaman di dekatmu dan kamu jarang kejebak konflik.",
    },
    relasi: {
      skor: 4,
      status: "perhatian",
      arti: "Terindikasi kamu lagi ngerasa agak sendirian di sekolah.",
      indikator: [
        ["perhatian", "Jarang ikut ngumpul sama teman."],
        ["perhatian", "Belum punya teman dekat di kelas."],
        ["baik", "Disukai teman-teman."],
        ["perhatian", "Kadang dikatain di grup chat kelas."],
        ["baik", "Bisa akur sama teman sebaya."],
      ],
      coba: [
        "Ajak satu teman sekelas ngobrol atau makan bareng minggu ini.",
        "Kalau ada yang ngatain di chat, simpan tangkapan layarnya dan lapor.",
      ],
    },
    tolong: {
      skor: 2,
      status: "baik",
      arti: "Terindikasi kamu peka dan suka bantu orang lain.",
      indikator: [
        ["baik", "Peduli sama perasaan orang lain."],
        ["baik", "Mau berbagi barang atau waktu."],
        ["baik", "Suka nolongin teman."],
        ["baik", "Bersikap baik ke siapa aja."],
        ["perhatian", "Kadang sungkan nawarin bantuan duluan."],
      ],
      pertahanin: "Kepedulianmu bikin kamu dipercaya teman dan guru. Jangan lupa peduli sama dirimu sendiri juga.",
    },
  },
};

/** Status per aspek, bentuk yang dibaca PetaHati: { idAspek: status }. */
export const STATUS_KIRANA = Object.fromEntries(HEART.map((a) => [a.id, HASIL_KIRANA.aspek[a.id].status]));
export const ASPEK_DIJAGA = HEART.filter((a) => STATUS_KIRANA[a.id] !== "baik");
export const ASPEK_BAIK = HEART.filter((a) => STATUS_KIRANA[a.id] === "baik");

/** Perkembangan sesudah screening, untuk aspek yang perlu dijaga (skor makin rendah makin baik). */
export const PANTAU_KIRANA = {
  emosional: {
    tanya: "Minggu ini, seberapa sering kamu ngerasa cemas atau badan nggak enak pas mau sekolah?",
    riwayat: [
      { label: "Screening", tanggal: "18 Nov", skor: 6 },
      { label: "Minggu 1", tanggal: "25 Nov", skor: 5 },
    ],
  },
  relasi: {
    tanya: "Minggu ini, seberapa sering kamu ngerasa sendirian di sekolah?",
    riwayat: [
      { label: "Screening", tanggal: "18 Nov", skor: 4 },
      { label: "Minggu 1", tanggal: "25 Nov", skor: 4 },
    ],
  },
};

/** Misi kecil, tiap misi terkait satu aspek HEART supaya perkembangannya terlihat di aspek itu. */
export const MISI = [
  { id: "m1", aspek: "relasi", teks: "Ngobrol sama 1 teman sekelas yang jarang kamu ajak ngobrol." },
  { id: "m2", aspek: "relasi", teks: "Ikut satu kegiatan bareng teman, ekskul atau kerja kelompok." },
  { id: "m3", aspek: "emosional", teks: "Tulis 3 hal yang bikin kepikiran sebelum tidur, 3 malam minggu ini." },
  { id: "m4", aspek: "emosional", teks: "Latihan napas 4-4-4 tiap pagi sebelum berangkat." },
];

/** Misi menjaga bagian yang sudah Baik, supaya tetap ada yang dikerjakan (satu per aspek Baik). */
export const MISI_JAGA = [
  { id: "j-hiperaktivitas", aspek: "hiperaktivitas", teks: "Pertahanin jeda gerak 5 menit tiap jam belajar." },
  { id: "j-agresi", aspek: "agresi", teks: "Kalau mulai kesel, jalan sebentar dulu sebelum bales." },
  { id: "j-tolong", aspek: "tolong", teks: "Tawarin bantuan ke satu teman minggu ini, duluan." },
];

/* ---------- Lapor Aman versi remaja ---------- */

/**
 * Topik laporan. `ikon` dari ikonData atau `ic` dari IC (orangTuaData); `tingkat` = usulan untuk
 * sekolah, tidak ditampilkan ke remaja.
 */
export const TOPIK = [
  { id: "ejek", label: "Diejek atau dikatain", ic: "obrolan", tingkat: "Sedang" },
  { id: "kucil", label: "Dikucilin", ic: "sendiri", tingkat: "Sedang" },
  { id: "fisik", label: "Didorong, dipukul, diancam", ic: "tangan", tingkat: "Tinggi" },
  { id: "online", label: "Di-bully di chat atau medsos", ikon: "ponsel", tingkat: "Sedang" },
  { id: "dewasa", label: "Orang dewasa bikin nggak nyaman", ikon: "peringatan", tingkat: "Darurat" },
  { id: "down", label: "Lagi down banget", ic: "sedih", tingkat: "Tinggi" },
  { id: "lain", label: "Hal lain", ic: "lainnya", tingkat: "Sedang" },
];
/** Pilihan kapan; "Pilih tanggal" membuka kalender. */
export const KAPAN = ["Hari ini", "Kemarin", "Minggu ini", "Udah lama", "Pilih tanggal"];

/** Janji tanggapan Guru BK menurut tingkat, dalam bahasa remaja. */
export const JANJI = {
  Darurat: "dalam 1 jam",
  Tinggi: "hari ini juga",
  Sedang: "paling lambat besok",
};

/** Laporan yang pernah dikirim Kirana (contoh), urut terbaru. */
export const LAPORAN_AWAL = [
  { kode: "RJ-2K8Q", topik: "Di-bully di chat atau medsos", tanggal: "12 Nov", status: "Sedang ditangani", nada: "mid" },
];
