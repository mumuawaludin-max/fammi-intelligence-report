/**
 * Data contoh layar Profil anak (artboard "4 · Profil anak" di kanvas Sekolah Proteksi): Raka
 * Pratama, kelas 2B, dilihat Bu Rina sebagai wali kelas. Semua nama, tanggal, dan angka di sini
 * contoh untuk demonstrasi.
 */

/** Skor skrining awal per aspek, skala 0-10: `ot` isian orang tua (3 Nov), `wk` isian wali kelas (23 Okt). */
export const ASPEK = [
  { id: "perasaan", t: "Perasaan", sub: "cemas, sedih, keluhan badan", ot: 6, wk: 4 },
  { id: "perilaku", t: "Perilaku", sub: "marah, menyakiti, aturan", ot: 2, wk: 1 },
  { id: "fokus", t: "Fokus & energi", sub: "perhatian, giliran", ot: 3, wk: 3 },
  { id: "pertemanan", t: "Pertemanan", sub: "bermain bersama, dijauhi", ot: 6, wk: 7 },
  { id: "kepedulian", t: "Kepedulian", sub: "kekuatan, makin tinggi makin baik", ot: 8, wk: 9, kekuatan: true },
];

/**
 * Kategori contoh dari skor tertinggi kedua pengisi, sama dengan catatan ambang di kartu: 0-3 sesuai
 * tahap, 4-5 perlu dipantau, 6-10 perlu dukungan. Kepedulian dibaca terbalik (skor tinggi berarti
 * kekuatan), jadi selalu tampil sebagai kekuatan.
 */
export function kategoriAspek(aspek) {
  if (aspek.kekuatan) return { label: "Kekuatan", pil: "ok" };
  const skor = Math.max(aspek.ot, aspek.wk);
  if (skor >= 6) return { label: "Perlu dukungan", pil: "bad" };
  if (skor >= 4) return { label: "Perlu dipantau", pil: "warn" };
  return { label: "Sesuai tahap", pil: "ok" };
}

/** Kartu "Yang Perlu Diketahui Tim". `nada` memilih warna latar kartu dan ikonnya. */
export const FAKTA = [
  {
    id: "kekuatan",
    nada: "ok",
    ikon: "bintang",
    judul: "Kekuatan: peduli pada teman",
    isi: "Suka membantu merapikan kelas dan menghibur teman yang menangis. Pakai ini sebagai pintu masuk, misalnya tugas piket bersama.",
  },
  {
    id: "pertemanan",
    nada: "warn",
    ikon: "kelompok",
    judul: "Pertemanan: sering sendiri saat istirahat",
    isi: "Orang tua dan wali kelas sama-sama melihatnya. Raka bercerita sering diejek kakak kelas di dekat kantin.",
  },
  {
    id: "perasaan",
    nada: "warn",
    ikon: "senyum",
    judul: "Perasaan: sakit perut di pagi hari",
    isi: "Muncul di rumah lebih kuat daripada di sekolah. Sering terjadi pada hari ada jam istirahat panjang.",
  },
  {
    id: "waktu",
    nada: "info",
    ikon: "jam",
    judul: "Pola waktu",
    isi: "Kejadian dan catatan observasi terkumpul di jam istirahat, sekitar kantin. Pengawasan di titik itu menjadi bagian rencana tindak KS-015.",
  },
];

/**
 * Langkah rencana dukungan. `jenis`: selesai (sudah beres sebelum hari ini), berjalan, terjadwal.
 * `milikSaya`: langkah milik Bu Rina (sudut pandang layar ini), jadi bisa ia tandai selesai.
 */
export const LANGKAH_RENCANA = [
  { t: "Obrolan hasil skrining dengan orang tua", who: "Bu Rina (wali kelas)", when: "Kamis, 5 Nov", jenis: "selesai", milikSaya: false },
  { t: "Teman pendamping dan kerja kelompok kecil", who: "Bu Rina (wali kelas)", when: "Mulai Senin, 9 Nov", jenis: "berjalan", milikSaya: true },
  { t: "Sesi konseling BK seminggu sekali", who: "Bu Laras (Guru BK)", when: "Mulai Kamis, 12 Nov", jenis: "terjadwal", milikSaya: false },
  { t: "Kelas kesadaran: Teman Baik Tidak Merundung", who: "Bu Rina (wali kelas)", when: "Kamis, 19 Nov", jenis: "terjadwal", milikSaya: true },
  { t: "Evaluasi 4 minggu bersama orang tua", who: "Bu Laras dan Ibu Dewi", when: "Kamis, 3 Des", jenis: "terjadwal", milikSaya: false },
];

/** Tahap penanganan KS-015. `jenis`: done (beres), now (sedang ditunggu), next (berikutnya). */
export const LANGKAH_KASUS = [
  { t: "Laporan masuk", d: "Rabu 08.12 · Ibu Dewi lewat Lapor Aman", jenis: "done", s: "Selesai" },
  { t: "Analisis tingkat", d: "08.40 · Tinggi: kekerasan fisik oleh kakak kelas", jenis: "done", s: "Selesai" },
  { t: "Diteruskan", d: "08.41 · Bu Rina dan Bu Laras; Kepala Sekolah diberi tahu", jenis: "done", s: "Selesai" },
  { t: "Respon pertama", d: "Temui Raka dan catat kronologi · batas 12.12", jenis: "now", s: "Menunggu" },
  { t: "Rencana tindak", d: "Batas Jumat 13 Nov 08.12", jenis: "next", s: "Berikutnya" },
  { t: "Dipantau sampai selesai", d: "Cek ulang kondisi Raka tiap minggu selama 2–4 minggu", jenis: "next", s: "Berikutnya" },
];

/** Pil status tiap tahap kasus. */
export const PIL_KASUS = { done: "ok", now: "warn", next: "gray" };

/**
 * Riwayat awal, terbaru di atas. `jenis`: skr (skrining), obs (observasi), kasus, plan (rencana
 * dukungan); menentukan ikon dan saringan. `x` keterangan sesudah judul.
 */
export const RIWAYAT_AWAL = [
  { id: "r1", d: "Rabu, 11 Nov", jenis: "kasus", t: "Laporan KS-015 masuk", x: "Ibu Dewi melapor Raka didorong dan dipukul kakak kelas di dekat kantin. Tingkat Tinggi." },
  { id: "r2", d: "Selasa, 10 Nov", jenis: "obs", t: "Observasi Bu Rina", x: "Bermain dengan Alif dan Gibran saat istirahat, terlihat lebih ceria." },
  { id: "r3", d: "Jumat, 6 Nov", jenis: "obs", t: "Observasi Bu Rina", x: "Menyendiri di pojok kelas saat istirahat, menolak ke kantin. Dibahas dengan Guru BK." },
  { id: "r4", d: "Kamis, 5 Nov", jenis: "plan", t: "Rencana dukungan dibuat", x: "Bu Laras menyusun 5 langkah; Ibu Dewi menyetujui di aplikasi." },
  { id: "r5", d: "Selasa, 3 Nov", jenis: "skr", t: "Skrining orang tua masuk", x: "Perasaan dan pertemanan perlu dukungan." },
  { id: "r6", d: "Jumat, 30 Okt", jenis: "kasus", t: "Kasus KS-008", x: "Saling ejek saat antre. Dimediasi wali kelas, selesai 3 Nov." },
  { id: "r7", d: "Jumat, 23 Okt", jenis: "skr", t: "Skrining wali kelas masuk", x: "Pertemanan perlu dukungan, kepedulian menjadi kekuatan." },
];

/** Ikon riwayat menurut jenisnya (nama di ikonData.js). */
export const IKON_RIWAYAT = { skr: "skrining", obs: "pena", kasus: "tiket", plan: "hati" };

/** Saringan riwayat. "Skrining & rencana" ikut memuat entri rencana dukungan. */
export const SARING_RIWAYAT = [
  { id: "semua", label: "Semua" },
  { id: "skr", label: "Skrining & rencana" },
  { id: "obs", label: "Observasi" },
  { id: "kasus", label: "Kasus" },
];

/** Penanda cepat di laci Catat observasi. */
export const PENANDA = ["Menyendiri", "Menangis", "Marah", "Konflik dengan teman", "Takut pada seseorang", "Membaik"];
