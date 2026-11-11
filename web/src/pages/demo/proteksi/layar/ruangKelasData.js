/**
 * Data contoh khusus layar Ruang wali kelas (Kelas 2B, Bu Rina). Anak, status HEART, buddy, dan
 * checklist dibaca dari data bersama (bersama/heart.js, dukungan.js, tindakLanjut.js); berkas ini
 * hanya menyimpan yang tidak dipakai layar lain: formulir skrining versi wali kelas, pengelompokan
 * waktu checklist, kelas kesadaran, dan catatan observasi. Semua nama dan angka fiktif.
 */
import { ANAK_2B, HEART, STATUS, URUTAN_STATUS } from "../bersama/heart.js";

// ── Anak kelas 2B ──────────────────────────────────────────────────────────────────────────────

const ANAK_MENURUT_NAMA = new Map(ANAK_2B.map((a) => [a.nama, a]));

/** Anak kelas 2B menurut nama lengkap, atau null. */
export function cariAnak(nama) {
  return ANAK_MENURUT_NAMA.get(nama) || null;
}

/** Nama depan: "Raka Pratama" -> "Raka". */
export function namaDepan(nama) {
  return String(nama || "").split(" ")[0];
}

/** Anak yang formulir wali kelasnya belum diisi (status HEART belum ada). */
export const ANAK_BELUM_DIISI = ANAK_2B.filter((a) => a.status === "belum").map((a) => a.nama);

/** Anak berstatus Perlu Perhatian: diobservasi tiap minggu selama 4 minggu. */
export const ANAK_OBSERVASI = ANAK_2B.filter((a) => a.status === "perhatian").map((a) => a.nama);


/** Status dari teks alasan buddy ("Relasi Pertemanan: Waspada" -> "waspada"), atau null. */
export function statusAlasan(alasan) {
  const label = String(alasan || "").split(":").pop().trim();
  return URUTAN_STATUS.find((id) => STATUS[id].label === label) || null;
}

// ── Checklist: kelompok waktu ──────────────────────────────────────────────────────────────────

/** Hari demo: Rabu, 11 November 2026. Minggu ini berakhir Minggu, 15 November. */
export const HARI_DEMO = { tanggal: 11, akhirMinggu: 15, label: "Rabu, 11 Nov", sejak: "11 Nov" };

/** Kelompok checklist, urut tampil. */
export const KELOMPOK_CHECKLIST = [
  { id: "hari", label: "Hari ini" },
  { id: "minggu", label: "Minggu ini" },
  { id: "nanti", label: "Berikutnya" },
  { id: "selesai", label: "Selesai" },
];

/** Petunjuk kelompok untuk butir yang teks waktunya tidak cukup (id butir -> id kelompok). */
const PETUNJUK_KELOMPOK = {};

/** Aksi singkat butir yang tidak bisa ditebak dari alur atau anaknya (id butir -> jenis aksi). */
export const AKSI_KHUSUS = {
  "2b-buddy-rizky": "buddy",
  "2b-observasi": "observasi",
};

const BULAN = { Okt: -31, Nov: 0, Des: 30 };

/** Urutan hari dihitung dari 1 November ("Jumat, 13 Nov" -> 13, "3 Des" -> 33), atau null. */
export function urutanHari(waktu) {
  const cocok = /(\d{1,2}) (Okt|Nov|Des)/.exec(String(waktu || ""));
  return cocok ? Number(cocok[1]) + BULAN[cocok[2]] : null;
}

/**
 * Kelompok waktu satu butir yang belum selesai, dibaca dari teks `waktu` di data bersama:
 * "Hari ini ..." dan "Setiap ..." masuk Hari ini, rutinitas "Mulai ..." masuk Minggu ini, tanggal
 * yang sudah lewat ikut Hari ini (terlambat), sampai Minggu 15 Nov masuk Minggu ini, sisanya
 * Berikutnya.
 */
export function kelompokWaktu(butir) {
  if (PETUNJUK_KELOMPOK[butir.id]) return PETUNJUK_KELOMPOK[butir.id];
  const w = String(butir.waktu || "").toLowerCase();
  if (w.startsWith("hari ini") || w.startsWith("setiap")) return "hari";
  if (w.startsWith("mulai")) return "minggu";
  const hari = urutanHari(butir.waktu);
  if (hari == null) return "minggu";
  if (hari <= HARI_DEMO.tanggal) return "hari";
  if (hari <= HARI_DEMO.akhirMinggu) return "minggu";
  return "nanti";
}

/** Kunci urut di dalam satu kelompok: kasus dulu, lalu tenggat terdekat, rutinitas terakhir. */
export function kunciUrut(butir) {
  if (butir.alur === "kejadian") return -1;
  const hari = urutanHari(butir.waktu);
  if (String(butir.waktu || "").toLowerCase().startsWith("mulai")) return 1000 + (hari ?? 0);
  return hari ?? 500;
}

// ── Formulir skrining HEART versi wali kelas ───────────────────────────────────────────────────

export const SKALA = ["Tidak pernah", "Kadang", "Sering"];
export const SKALA_AMAN = ["Tidak", "Tidak yakin", "Ya"];

/**
 * Lima pernyataan per aspek, urut sama dengan HEART[].indikator, tentang yang wali kelas lihat di
 * sekolah selama sebulan terakhir.
 */
const BUTIR_HEART = {
  hiperaktivitas: [
    "Gelisah dan sulit diam di tempat duduknya saat belajar.",
    "Tangan atau kakinya terus bergerak ketika gelisah.",
    "Bisa memusatkan perhatian pada satu tugas sampai selesai.",
    "Berpikir dulu sebelum bertindak, misalnya menunggu giliran.",
    "Memperhatikan saat guru menjelaskan atau bercerita.",
  ],
  emosional: [
    "Mengeluh sakit perut, pusing, atau tidak enak badan di sekolah.",
    "Tampak cemas, misalnya sebelum pelajaran atau saat berpisah dengan orang tua.",
    "Terlihat senang dan ceria selama di sekolah.",
    "Percaya diri saat mencoba hal baru atau tampil di depan kelas.",
    "Mudah takut pada orang, tempat, atau situasi tertentu.",
  ],
  agresi: [
    "Bisa menahan amarah saat kecewa atau keinginannya tidak dituruti.",
    "Mengikuti instruksi guru dan aturan kelas.",
    "Memaksakan keinginan pada teman, misalnya merebut atau mendorong.",
    "Berbohong atau berbuat curang.",
    "Mengambil barang milik teman tanpa izin.",
  ],
  relasi: [
    "Berkumpul dan bermain bersama teman saat istirahat.",
    "Punya setidaknya satu teman baik di kelas.",
    "Disukai teman-teman sekelasnya.",
    "Diganggu, diejek, atau didorong teman atau kakak kelas.",
    "Lebih nyaman bersama orang dewasa daripada teman seusianya.",
  ],
  tolong: [
    "Peduli saat teman sedih, kecewa, atau takut.",
    "Mau berbagi bekal, mainan, atau alat tulis.",
    "Menolong teman yang jatuh atau kesulitan.",
    "Bersikap baik pada teman dan adik kelas.",
    "Menawarkan bantuan tanpa diminta.",
  ],
};

/** Pertanyaan keamanan di luar HEART. Jawaban Ya menjadi laporan kejadian (alur kejadian). */
const PERTANYAAN_KEAMANAN = [
  "Ada luka atau memar yang penjelasannya tidak masuk akal atau berubah-ubah.",
  "Tiba-tiba takut ke sekolah atau menolak bertemu orang tertentu.",
  "Menerima hadiah, uang, atau pesan dari orang dewasa di luar keluarga dan diminta merahasiakannya.",
  "Menunjukkan pengetahuan atau tindakan seksual yang tidak sesuai usianya.",
  "Bercerita pernah disakiti, diancam, atau dipermalukan.",
  "Menyakiti diri sendiri atau berkata ingin menghilang.",
];

/** Bagian formulir: lima aspek HEART lalu pertanyaan keamanan. `awal` = nomor butir pertama. */
export const LANGKAH_SKRINING = (() => {
  const langkah = [
    ...HEART.map((a) => ({ id: a.id, kode: a.kode, nama: a.nama, ket: a.dinilai, butir: BUTIR_HEART[a.id], skala: SKALA })),
    {
      id: "keamanan",
      kode: null,
      nama: "Pertanyaan keamanan",
      ket: "Di luar HEART. Jawaban Ya langsung menjadi laporan kejadian untuk Guru BK.",
      butir: PERTANYAAN_KEAMANAN,
      skala: SKALA_AMAN,
      keamanan: true,
    },
  ];
  let awal = 1;
  return langkah.map((l) => {
    const isi = { ...l, awal };
    awal += l.butir.length;
    return isi;
  });
})();

export const JUMLAH_BUTIR = LANGKAH_SKRINING.reduce((n, l) => n + l.butir.length, 0);

/** Jumlah jawaban satu bagian. `jawaban` = { idLangkah: { indeks: pilihan } }. */
export function terjawabLangkah(jawaban, idLangkah) {
  return Object.keys(jawaban?.[idLangkah] || {}).length;
}

/** Jumlah jawaban seluruh formulir. */
export function terjawabSemua(jawaban) {
  return LANGKAH_SKRINING.reduce((n, l) => n + terjawabLangkah(jawaban, l.id), 0);
}

/** Bagian pertama yang belum lengkap, atau bagian terakhir kalau semua sudah. */
export function langkahBelumLengkap(jawaban) {
  const l = LANGKAH_SKRINING.find((x) => terjawabLangkah(jawaban, x.id) < x.butir.length);
  return (l || LANGKAH_SKRINING[LANGKAH_SKRINING.length - 1]).id;
}

/** Benar kalau ada jawaban "Ya" (indeks 2) pada pertanyaan keamanan. */
export function adaTandaBahaya(jawaban) {
  return Object.values(jawaban?.keamanan || {}).includes(2);
}

// ── Kelas kesadaran dan catatan observasi ──────────────────────────────────────────────────────

/**
 * Empat sesi kelas kesadaran. `aspek` = aspek HEART yang dilatih, `keamanan` = sesi keamanan diri
 * (di luar HEART). tahap: done (selesai), next (berikutnya), plan (terjadwal). Sesi berikutnya
 * berganti ke `waktuSelesai` sesudah ditandai selesai.
 */
export const SESI_KESADARAN = [
  {
    judul: "Kenali Emosiku",
    isi: "Menamai rasa senang, sedih, takut, dan marah lewat kartu wajah.",
    aspek: ["emosional"],
    waktu: "Selesai · 22 Okt",
    tahap: "done",
  },
  {
    judul: "Tubuhku Milikku",
    isi: "Bagian tubuh pribadi, sentuhan aman dan tidak aman, boleh bilang tidak.",
    keamanan: true,
    waktu: "Selesai · 29 Okt",
    tahap: "done",
  },
  {
    judul: "Rahasia Aman dan Rahasia Tidak Aman",
    isi: "Rahasia yang membuat takut atau sedih harus diceritakan ke orang dewasa yang dipercaya.",
    keamanan: true,
    waktu: "Kamis, 12 Nov · 07.30",
    waktuSelesai: "Selesai · 11 Nov",
    tahap: "next",
  },
  {
    judul: "Teman Baik Tidak Merundung",
    isi: "Mengenali ejekan dan dorongan, membela teman, tahu ke mana melapor.",
    aspek: ["relasi", "agresi", "tolong"],
    waktu: "Kamis, 19 Nov · 07.30",
    tahap: "plan",
  },
];

/** Warna pil waktu per tahap sesi. */
export const PIL_TAHAP = { done: "ok", next: "mid", plan: "gray" };

export const PESAN_MATERI = "Materi sesi 3 (PDF, 6 halaman) dan 12 kartu cerita siap diunduh";

/**
 * Catatan observasi yang sudah ada, terbaru di atas. `aspek` = aspek HEART yang terlihat,
 * `membaik` = ada perbaikan, `bk` = dibahas dengan Guru BK.
 */
export const CATATAN_AWAL = [
  {
    id: "awal-1",
    anak: "Raka Pratama",
    tgl: "Selasa, 10 Nov",
    teks: "Bermain dengan Alif dan Gibran saat istirahat, terlihat lebih ceria.",
    aspek: ["relasi"],
    membaik: true,
  },
  {
    id: "awal-2",
    anak: "Keisha Ananda",
    tgl: "Senin, 9 Nov",
    teks: "Menangis saat dijemput terlambat, tenang setelah diajak menggambar.",
    aspek: ["emosional"],
  },
  {
    id: "awal-3",
    anak: "Arka Wijaya",
    tgl: "Jumat, 6 Nov",
    teks: "Mendorong teman saat antre, langsung minta maaf setelah diingatkan.",
    aspek: ["agresi"],
  },
  {
    id: "awal-4",
    anak: "Raka Pratama",
    tgl: "Jumat, 6 Nov",
    teks: "Menyendiri di pojok kelas saat istirahat, menolak ke kantin.",
    aspek: ["relasi"],
    bk: true,
  },
];
