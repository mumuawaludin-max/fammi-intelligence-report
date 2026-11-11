/**
 * HEART: lima aspek skrining perilaku dan mental anak, mengikuti laporan contoh pemilik produk
 * "Deteksi Dini Tantangan Perilaku dan Mental Anak" (2026-11-11). Sumber tunggal untuk semua layar
 * prototipe: Skrining, Laporan anak, Ruang wali kelas, Ringkasan, dan aplikasi orang tua.
 *
 * Skor tiap aspek 0-10. Makin tinggi makin perlu perhatian, termasuk Tolong Menolong (skornya
 * sudah dibalik saat pengolahan, seperti di laporan contoh). Ambang tiap aspek berbeda, persis
 * seperti di laporan contoh. Layar membaca status dari data; statusDariSkor hanya dipakai uji
 * untuk memastikan data contoh tidak saling bertentangan.
 *
 * Semua nama, kelas, tanggal, dan angka di sini data contoh untuk demonstrasi.
 */

/** Tiga status hasil, urut dari yang paling ringan. `nada` = kelas pil di proteksi.module.css. */
export const STATUS = {
  baik: {
    id: "baik",
    label: "Baik",
    nada: "ok",
    arti: "Anak dalam kondisi stabil pada aspek ini. Tetap dukung perkembangan positifnya.",
  },
  perhatian: {
    id: "perhatian",
    label: "Perlu Perhatian",
    nada: "warn",
    arti: "Mulai tampak tanda yang perlu diperhatikan, belum mengkhawatirkan. Pantau dan beri dukungan tambahan bila perlu.",
  },
  waspada: {
    id: "waspada",
    label: "Waspada",
    nada: "bad",
    arti: "Aspek ini memengaruhi kesejahteraan atau perilaku anak. Dampingi lebih intensif dan libatkan Guru BK atau ahli.",
  },
};

export const URUTAN_STATUS = ["baik", "perhatian", "waspada"];

/** Status anak yang belum punya hasil skrining (formulir wali kelas atau orang tua belum masuk). */
export const BELUM = { id: "belum", label: "Belum diskrining", nada: "gray" };

/** Lima aspek HEART, urut seperti di laporan. */
export const HEART = [
  {
    kode: "H",
    id: "hiperaktivitas",
    nama: "Hiperaktivitas",
    dinilai: "Tingkat aktivitas dan konsentrasi anak.",
    penting: "Mengenali masalah perhatian atau hiperaktivitas sejak dini.",
    ambang: { perhatian: 5, waspada: 7 },
    indikator: [
      "Gelisah dan tidak dapat diam",
      "Bergerak ketika gelisah",
      "Memusatkan perhatian",
      "Berpikir sebelum bertindak",
      "Memperhatikan",
    ],
  },
  {
    kode: "E",
    id: "emosional",
    nama: "Emosional",
    dinilai: "Stabilitas emosi dan kecemasan.",
    penting: "Menangani masalah emosi yang memengaruhi kesejahteraan anak.",
    ambang: { perhatian: 5, waspada: 7 },
    indikator: ["Merasakan sakit", "Kecemasan", "Perasaan bahagia", "Kepercayaan diri", "Rasa takut"],
  },
  {
    kode: "A",
    id: "agresi",
    nama: "Agresi",
    dinilai: "Tingkat agresi fisik dan verbal.",
    penting: "Mengenali masalah kontrol emosi dan perilaku agresif.",
    ambang: { perhatian: 3, waspada: 5 },
    indikator: [
      "Mengendalikan amarah",
      "Kepatuhan terhadap instruksi",
      "Memaksakan keinginan",
      "Berbohong",
      "Mengambil barang orang lain",
    ],
  },
  {
    kode: "R",
    id: "relasi",
    nama: "Relasi Pertemanan",
    dinilai: "Kemampuan menjalin hubungan sosial.",
    penting: "Menilai keterampilan sosial anak dan apakah ia diganggu teman.",
    ambang: { perhatian: 3, waspada: 6 },
    indikator: [
      "Berkumpul dengan teman",
      "Teman baik",
      "Disukai orang lain",
      "Diganggu teman",
      "Hubungan teman sebaya",
    ],
  },
  {
    kode: "T",
    id: "tolong",
    nama: "Tolong Menolong",
    dinilai: "Empati dan kesiapan membantu orang lain.",
    penting: "Melihat kemampuan anak menunjukkan empati dan kerja sama.",
    ambang: { perhatian: 4, waspada: 6 },
    indikator: [
      "Peduli perasaan orang lain",
      "Bersedia berbagi",
      "Menolong orang lain",
      "Bersikap baik",
      "Menawarkan bantuan",
    ],
  },
];

export const HEART_IDS = HEART.map((a) => a.id);

const ASPEK_MENURUT_ID = new Map(HEART.map((a) => [a.id, a]));
const ASPEK_MENURUT_KODE = new Map(HEART.map((a) => [a.kode, a]));

/** Aspek untuk id ("relasi") atau kode ("R"), atau null. */
export function cariAspek(idAtauKode) {
  return ASPEK_MENURUT_ID.get(idAtauKode) || ASPEK_MENURUT_KODE.get(idAtauKode) || null;
}

/** Meta status (label, nada); id tak dikenal dianggap belum diskrining. */
export function metaStatus(id) {
  return STATUS[id] || BELUM;
}

/** Status sesuai ambang laporan contoh. Hanya untuk uji konsistensi data, bukan untuk layar. */
export function statusDariSkor(aspek, skor) {
  if (skor >= aspek.ambang.waspada) return "waspada";
  if (skor >= aspek.ambang.perhatian) return "perhatian";
  return "baik";
}

/** Status terberat dari daftar status aspek. Hanya untuk uji konsistensi data. */
export function statusTerberat(daftar) {
  if (daftar.includes("waspada")) return "waspada";
  if (daftar.includes("perhatian")) return "perhatian";
  return "baik";
}

// ── Laporan individu contoh: Raka Pratama, kelas 2B ─────────────────────────────────────────────

/**
 * Laporan HEART Raka, bentuknya mengikuti laporan contoh: per aspek skor, status, lima indikator
 * (status + deskripsi), faktor pendukung (kebiasaan sehari-hari), dan saran untuk orang tua dan
 * sekolah ("lakukan" + "caranya").
 */
export const LAPORAN_RAKA = {
  anak: {
    nama: "Raka Pratama",
    inisial: "RP",
    kelas: "2B",
    usia: "7 tahun",
    wali: "Bu Rina Kartika",
    ortu: "Ibu Dewi Lestari",
  },
  tanggal: "3 Nov 2026",
  sumber: "Isian orang tua (3 Nov) dan wali kelas (23 Okt)",
  disusun: "Disusun, diskor, dan dianalisis tim ahli dan psikolog Fammi. Hasil skrining bukan diagnosis.",
  status: "waspada",
  ringkas:
    "Raka kuat dalam tolong menolong dan tenang di kelas. Relasi pertemanan perlu didampingi segera: ia sering sendiri saat istirahat dan diganggu kakak kelas di dekat kantin. Keluhan sakit perut di pagi hari ikut muncul.",
  aspek: {
    hiperaktivitas: {
      skor: 3,
      status: "baik",
      indikator: [
        { status: "baik", deskripsi: "Bisa duduk tenang saat belajar dan makan." },
        { status: "baik", deskripsi: "Jarang bergerak gelisah di kursinya." },
        { status: "perhatian", deskripsi: "Kadang perhatiannya teralih saat kelas sedang ramai." },
        { status: "baik", deskripsi: "Biasanya menunggu giliran dan berpikir dulu sebelum bertindak." },
        { status: "baik", deskripsi: "Menyimak penjelasan dan menyelesaikan tugas sampai selesai." },
      ],
      pendukung: [
        ["Kebiasaan belajar yang membuatnya fokus", "Di meja belajar yang tenang"],
        ["Kebiasaan menyelesaikan tugas", "Dikerjakan setelah makan siang"],
        ["Gadget untuk hiburan per hari", "1 sampai 2 jam"],
      ],
      saran: [
        {
          lakukan: "Pertahankan rutinitas belajar dan bermain",
          caranya: [
            "Beri waktu belajar, bermain, dan istirahat yang seimbang setiap hari.",
            "Tanyakan kegiatan yang ia sukai, misalnya sepak bola atau menggambar.",
          ],
        },
        {
          lakukan: "Beri apresiasi saat ia fokus",
          caranya: ["Puji usahanya secara spesifik: \"Hebat, PR-nya selesai tanpa diingatkan.\""],
        },
      ],
    },
    emosional: {
      skor: 6,
      status: "perhatian",
      indikator: [
        { status: "waspada", deskripsi: "Sering mengeluh sakit perut di pagi hari, terutama di hari ada istirahat panjang." },
        { status: "perhatian", deskripsi: "Kadang tampak khawatir saat akan berangkat sekolah." },
        { status: "perhatian", deskripsi: "Kadang terlihat murung sesudah jam istirahat." },
        { status: "baik", deskripsi: "Percaya diri saat tampil di depan kelas." },
        { status: "perhatian", deskripsi: "Kadang takut melewati area kantin." },
      ],
      pendukung: [
        ["Respons terhadap situasi baru", "Butuh waktu, lalu mau mencoba"],
        ["Tempat yang paling membuat nyaman dan aman", "Di rumah"],
        ["Respons saat gagal atau dimarahi", "Diam lalu menangis"],
        ["Suasana hati 2 bulan terakhir", "Cenderung sedih"],
      ],
      saran: [
        {
          lakukan: "Ajak Raka mengenali emosinya",
          caranya: [
            "Namai perasaan bersama: senang, sedih, takut, marah.",
            "Tanyakan perasaannya sepulang sekolah dengan nada santai.",
          ],
        },
        {
          lakukan: "Tenangkan saat ia cemas",
          caranya: [
            "Ajak duduk tenang dan tarik napas pelan bersama.",
            "Akui perasaannya: \"Mama paham kamu khawatir soal istirahat besok.\"",
          ],
        },
        {
          lakukan: "Catat keluhan sakit perut",
          caranya: [
            "Catat hari dan jam keluhan muncul, lalu bagikan ke wali kelas.",
            "Bila berlanjut lebih dari dua minggu, periksakan ke dokter.",
          ],
        },
      ],
    },
    agresi: {
      skor: 1,
      status: "baik",
      indikator: [
        { status: "baik", deskripsi: "Bisa menenangkan diri saat kecewa." },
        { status: "baik", deskripsi: "Biasanya mengikuti arahan guru dan orang tua." },
        { status: "baik", deskripsi: "Mau menerima saat keinginannya belum bisa dipenuhi." },
        { status: "baik", deskripsi: "Tidak terindikasi berbohong atau berbuat curang." },
        { status: "baik", deskripsi: "Selalu meminta izin sebelum meminjam barang." },
      ],
      pendukung: [
        ["Respons saat marah atau kecewa", "Menangis"],
        ["Sikap saat beda pendapat dengan teman", "Mengalah lalu menjauh"],
      ],
      saran: [
        {
          lakukan: "Pertahankan aturan yang konsisten",
          caranya: ["Sepakati aturan rumah bersama dan jelaskan alasannya."],
        },
        {
          lakukan: "Puji cara Raka menenangkan diri",
          caranya: ["Sebutkan perilakunya: \"Terima kasih sudah bilang kalau kamu kesal.\""],
        },
      ],
    },
    relasi: {
      skor: 7,
      status: "waspada",
      indikator: [
        { status: "waspada", deskripsi: "Sering bermain sendiri saat jam istirahat." },
        { status: "perhatian", deskripsi: "Punya satu teman dekat (Alif), sulit bergaul dengan teman lain." },
        { status: "baik", deskripsi: "Merasa disukai teman sekelasnya." },
        { status: "waspada", deskripsi: "Sering diejek dan didorong kakak kelas di dekat kantin." },
        { status: "perhatian", deskripsi: "Lebih nyaman bersama orang dewasa daripada teman seusianya." },
      ],
      pendukung: [
        ["Orang yang paling nyaman diajak ngobrol", "Mama"],
        ["Tempat bercerita saat ada masalah", "Mama dan Bu Rina"],
        ["Orang yang paling dipercaya saat ini", "Mama"],
      ],
      saran: [
        {
          lakukan: "Cari tahu penyebab Raka menyendiri",
          caranya: [
            "Dengarkan ceritanya tanpa memotong.",
            "Tanyakan dengan siapa ia bermain dan di mana ia merasa tidak nyaman.",
          ],
        },
        {
          lakukan: "Pastikan lingkungannya aman",
          caranya: [
            "Ajarkan Raka berani bilang tidak dan mencari orang dewasa saat diganggu.",
            "Sampaikan ke wali kelas setiap ada cerita diejek atau didorong.",
          ],
        },
        {
          lakukan: "Atur waktu bermain bersama teman",
          caranya: [
            "Undang satu atau dua teman sekelas bermain di rumah.",
            "Mulai dari teman yang sudah dekat, misalnya Alif.",
          ],
        },
      ],
    },
    tolong: {
      skor: 2,
      status: "baik",
      indikator: [
        { status: "baik", deskripsi: "Sering menghibur teman yang menangis." },
        { status: "baik", deskripsi: "Mau berbagi bekal dan alat tulis." },
        { status: "baik", deskripsi: "Menolong teman yang jatuh atau kesulitan." },
        { status: "baik", deskripsi: "Bersikap baik pada adik kelas." },
        { status: "perhatian", deskripsi: "Kadang menawarkan bantuan, lebih sering menunggu diminta." },
      ],
      pendukung: [
        ["Saat ada teman sedih", "Menghibur dan mengajak bermain"],
        ["Saat teman kesulitan mengerjakan tugas", "Membantu menjelaskan"],
        ["Saat diminta bantuan kecil", "Langsung membantu dengan senang hati"],
        ["Alasan peduli dan membantu orang lain", "Supaya teman tidak sedih"],
      ],
      saran: [
        {
          lakukan: "Libatkan Raka dalam kegiatan menolong",
          caranya: ["Ajak mengumpulkan buku atau mainan layak pakai untuk dibagikan."],
        },
        {
          lakukan: "Jadikan kekuatan ini pintu masuk",
          caranya: ["Beri tugas piket bersama teman supaya ia punya alasan untuk bergabung."],
        },
      ],
    },
  },
};

// ── Kelas 2B: hasil HEART tiap anak ─────────────────────────────────────────────────────────────

/** Singkatan status di kolom `heart` (urut H, E, A, R, T). */
const KODE_STATUS = { b: "baik", p: "perhatian", w: "waspada" };

/**
 * 28 anak kelas 2B. `heart` = lima huruf status per aspek (b baik, p perlu perhatian, w waspada)
 * urut H E A R T, null kalau belum diskrining. `status` = status anak (aspek terberat).
 */
const ANAK_2B_MENTAH = [
  ["Raka Pratama", "bpbwb", "waspada"],
  ["Aqila Zahra", "bwpbb", "waspada"],
  ["Fikri Hidayat", "wbpbb", "waspada"],
  ["Keisha Ananda", "bpbbb", "perhatian"],
  ["Rizky Maulana", "pbbbb", "perhatian"],
  ["Naura Salsabila", "bbbpb", "perhatian"],
  ["Arka Wijaya", "bbpbb", "perhatian"],
  ["Bagas Prasetyo", null, "belum"],
  ["Putri Ayu", null, "belum"],
  ["Adinda Maharani", "bbbbb", "baik"],
  ["Alif Ramadhan", "bbbbb", "baik"],
  ["Bilqis Aulia", "bbbbb", "baik"],
  ["Cahya Kirana", "bbbbb", "baik"],
  ["Elang Mahesa", "bbbbb", "baik"],
  ["Farah Nabila", "bbbbb", "baik"],
  ["Gibran Akbar", "bbbbb", "baik"],
  ["Hana Safira", "bbbbb", "baik"],
  ["Ilham Nugraha", "bbbbb", "baik"],
  ["Jihan Aprilia", "bbbbb", "baik"],
  ["Kenzo Hartono", "bbbbb", "baik"],
  ["Lala Anindya", "bbbbb", "baik"],
  ["Mikha Yohana", "bbbbb", "baik"],
  ["Nayla Putri", "bbbbb", "baik"],
  ["Omar Faruq", "bbbbb", "baik"],
  ["Rafa Aditya", "bbbbb", "baik"],
  ["Shafa Azzahra", "bbbbb", "baik"],
  ["Tegar Wicaksono", "bbbbb", "baik"],
  ["Vania Larasati", "bbbbb", "baik"],
];

export const ANAK_2B = ANAK_2B_MENTAH.map(([nama, heart, status]) => ({
  nama,
  inisial: nama
    .split(/\s+/)
    .slice(0, 2)
    .map((k) => k[0])
    .join("")
    .toUpperCase(),
  status,
  heart: heart ? Object.fromEntries(HEART.map((a, i) => [a.id, KODE_STATUS[heart[i]]])) : null,
}));

/** Ringkasan kelas 2B per status anak. */
export const RINGKAS_2B = {
  total: ANAK_2B.length,
  baik: ANAK_2B.filter((a) => a.status === "baik").length,
  perhatian: ANAK_2B.filter((a) => a.status === "perhatian").length,
  waspada: ANAK_2B.filter((a) => a.status === "waspada").length,
  belum: ANAK_2B.filter((a) => a.status === "belum").length,
};

// ── Sekolah: ringkasan hasil HEART ──────────────────────────────────────────────────────────────

/**
 * Ringkasan sekolah (288 anak TK A sampai kelas 4). Angka anak per status sama dengan kartu di
 * layar Skrining dan Ringkasan. `perAspek` = sebaran status per aspek dari 276 anak yang sudah
 * terpetakan, sama persis dengan kode HEART 55 anak Perlu Perhatian dan Waspada di daftar layar
 * Skrining (221 anak Baik bernilai baik di semua aspek; diuji skriningData.test.js).
 * `tandaBahaya` = jawaban Ya pada pertanyaan keamanan (di luar HEART) yang langsung menjadi laporan
 * kejadian.
 */
export const RINGKAS_SEKOLAH = {
  total: 288,
  terpetakan: 276,
  baik: 221,
  perhatian: 37,
  waspada: 18,
  tandaBahaya: 2,
  perAspek: {
    hiperaktivitas: { baik: 259, perhatian: 13, waspada: 4 },
    emosional: { baik: 254, perhatian: 16, waspada: 6 },
    agresi: { baik: 260, perhatian: 12, waspada: 4 },
    relasi: { baik: 257, perhatian: 14, waspada: 5 },
    tolong: { baik: 266, perhatian: 9, waspada: 1 },
  },
};
