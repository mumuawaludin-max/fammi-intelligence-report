/**
 * Data CONTOH modul Perilaku Anak. Seluruh angka, nama, dan kutipan di berkas ini karangan
 * untuk membangun tampilan, BUKAN temuan nyata -- karena itu setiap tampilan yang memakainya
 * wajib memasang penanda "Contoh" (lihat PaFilterBar.jsx), sesuai aturan di CLAUDE.md.
 *
 * Alur data sungguhannya nanti sama dengan School Culture: admin mengunggah Excel, pipeline
 * hulu menghitung skor/status/agregat, FIR tinggal membaca hasil final dari Supabase. Bentuk
 * objek di sini sengaja sudah "sudah jadi" (persen dan jumlah tersimpan, tidak dihitung di
 * komponen) supaya penggantian ke data asli nanti tinggal menukar sumbernya saja.
 */

export const PA_PERIODE_OPTIONS = [
  { id: "2025-2026-genap", label: "Semester Genap 2025/2026" },
  { id: "2025-2026-ganjil", label: "Semester Ganjil 2025/2026" },
  { id: "2024-2025-genap", label: "Semester Genap 2024/2025" },
];

export const PA_UNIT_OPTIONS = [
  { id: "semua", label: "Semua unit sekolah" },
  { id: "sd", label: "SD Kajaolalido" },
  { id: "smp", label: "SMP Islam Athirah Bone" },
  { id: "sma", label: "SMA Islam Athirah Bone" },
];

/** Lima dimensi HEART. `huruf` dipakai sebagai kartu inisial besar di bagian 02. */
export const PA_DIMENSI = [
  { kode: "hiperaktivitas", huruf: "H", label: "Hiperaktivitas" },
  { kode: "emosional", huruf: "E", label: "Emosional" },
  { kode: "agresi", huruf: "A", label: "Agresi" },
  { kode: "relasi", huruf: "R", label: "Relasi" },
  { kode: "prososial", huruf: "T", label: "Tolong Menolong" },
];

/**
 * Kamus istilah lima domain HEART. Isinya penjelasan konstruk psikologi yang diukur, BUKAN
 * interpretasi data sekolah ini -- itu ada di `insight` (dihitung dari data, lihat lebih bawah)
 * dan `analisis` (narasi tindak lanjut, lihat PERHATIAN_ANALISIS). Dipakai bareng oleh bagian 02
 * (Hasil Asesmen) dan bagian 03 (Perlu Perhatian) supaya Yayasan yang bukan psikolog tetap tahu
 * persis apa yang sedang diukur sebelum membaca angkanya.
 *
 * Kelima domain ini adalah subskala SDQ (Strengths and Difficulties Questionnaire, Robert
 * Goodman) -- instrumen skrining yang sama yang jadi rujukan modul Screening, lihat
 * docs/Kerangka_Tindak_Lanjut_Keilmuan_FIR.md. Prinsip 1 di dokumen itu berlaku persis di sini:
 * skor tinggi berarti PERLU DITELAAH, bukan diagnosis. Tolong Menolong (prososial) SENGAJA
 * ditulis arah kebalikannya -- itu satu-satunya subskala "kekuatan" pada SDQ, jadi skor
 * RENDAH yang jadi perhatian, bukan skor tinggi, karena itu domain ini tidak masuk daftar
 * prioritas di bagian 03 (lihat catatan di PERHATIAN_DOMAIN).
 */
export const PA_GLOSARIUM = {
  hiperaktivitas: {
    definisi: "Mengukur seberapa sering anak kesulitan memusatkan perhatian, duduk tenang, atau menahan dorongan bertindak sebelum berpikir. Subskala SDQ, bukan alat diagnosis ADHD.",
    ciri_umum: ["Sulit duduk diam dalam waktu lama", "Perhatian mudah teralihkan", "Bertindak dulu, berpikir belakangan"],
    catatan: "Skor tinggi berarti perlu ditelaah lebih lanjut oleh guru BK, bukan tanda anak mengalami gangguan tertentu.",
  },
  emosional: {
    definisi: "Mengukur gejala cemas, khawatir, dan sedih yang tampak pada keseharian anak. Subskala SDQ yang memotret keadaan emosi yang teramati, bukan riwayat klinis.",
    ciri_umum: ["Sering tampak khawatir atau cemas", "Mudah takut pada situasi baru", "Kesulitan menenangkan diri saat sedih"],
    catatan: "Skor tinggi menandakan area yang perlu dipantau, bukan label kondisi kesehatan mental tertentu.",
  },
  agresi: {
    definisi: "Mengukur perilaku menentang, mudah marah, dan berselisih dengan orang lain. Disebut skala 'masalah perilaku' pada SDQ.",
    ciri_umum: ["Cepat tersulut emosi", "Sering berselisih dengan teman", "Sulit menerima aturan atau instruksi"],
    catatan: "Fokus tindak lanjutnya pada pola dan pemicu perilaku, bukan mencap anak sebagai 'nakal'.",
  },
  relasi: {
    definisi: "Mengukur kesulitan menjalin dan menjaga pertemanan, termasuk rasa diterima di lingkungan sekolah. Disebut skala hubungan teman sebaya pada SDQ.",
    ciri_umum: ["Lebih sering menyendiri", "Sulit memulai interaksi dengan teman", "Merasa tidak diterima kelompok"],
    catatan: "Skor tinggi mengarahkan perhatian ke kondisi lingkungan kelas, bukan menyalahkan anak yang menyendiri.",
  },
  prososial: {
    definisi: "Satu-satunya subskala 'kekuatan' pada SDQ, bukan subskala kesulitan seperti empat lainnya: mengukur kesediaan berbagi, menolong, dan berempati. Karena itu arah bacanya kebalikan dari empat domain lain, skor **rendah** yang perlu diperhatikan, bukan skor tinggi.",
    ciri_umum: ["Bersedia berbagi dengan orang lain", "Peka pada perasaan teman", "Menawarkan bantuan tanpa diminta"],
    catatan: "Karena arah skalanya kebalikan, domain ini sengaja tidak masuk daftar prioritas di bagian Perlu Perhatian.",
  },
};

export const PA_EMOSI_LEVELS = [
  { kode: "sangat_positif", label: "Sangat Positif" },
  { kode: "positif", label: "Positif" },
  { kode: "netral", label: "Netral" },
  { kode: "negatif", label: "Negatif" },
  { kode: "sangat_negatif", label: "Sangat Negatif" },
  { kode: "kosong", label: "Tidak Menjawab" },
];

// ── Tabel dasar per unit ────────────────────────────────────────────────────────────────────

const UNIT = {
  sd: { label: "SD Kajaolalido", total: 156, laki: 62, perempuan: 94, porsi: 32 },
  smp: { label: "SMP Islam Athirah Bone", total: 178, laki: 66, perempuan: 112, porsi: 37 },
  sma: { label: "SMA Islam Athirah Bone", total: 150, laki: 56, perempuan: 94, porsi: 31 },
};

const TOTAL_SEMUA = { label: "Semua unit sekolah", total: 484, laki: 184, perempuan: 300, porsi: 100 };

/** Sebaran enam tingkat emosi per unit (lima tingkat + "tidak menjawab"), tiap baris berjumlah 100. */
const EMOSI = {
  semua: [15, 26, 31, 17, 9, 2],
  sd: [18, 25, 33, 14, 7, 3],
  smp: [11, 24, 31, 20, 12, 2],
  sma: [15, 27, 29, 18, 9, 2],
};

/** Hasil asesmen per dimensi: [aman, perlu perhatian, perlu diwaspadai], tiap baris berjumlah 100.
 * Nama tingkat di sini PERSIS sama dengan kunci field asli (lihat TINGKAT di PaHasilAsesmen.jsx)
 * supaya mock dan data asli dipetakan komponen yang sama tanpa terjemahan nama tambahan. */
const ASESMEN = {
  semua: { hiperaktivitas: [74, 19, 7], emosional: [68, 22, 10], agresi: [81, 14, 5], relasi: [71, 21, 8], prososial: [84, 12, 4] },
  sd: { hiperaktivitas: [78, 17, 5], emosional: [72, 20, 8], agresi: [85, 11, 4], relasi: [76, 18, 6], prososial: [88, 9, 3] },
  smp: { hiperaktivitas: [69, 22, 9], emosional: [63, 24, 13], agresi: [77, 16, 7], relasi: [66, 24, 10], prososial: [80, 14, 6] },
  sma: { hiperaktivitas: [75, 18, 7], emosional: [70, 21, 9], agresi: [82, 13, 5], relasi: [72, 20, 8], prososial: [85, 11, 4] },
};

const KELAS = {
  sd: ["Kelas V AR RAHMAN", "Kelas VI AL FATIH"],
  smp: ["Kelas VIII AR RASYID", "Kelas IX AL KHAWARIZMI"],
  sma: ["Kelas XI IPA 2", "Kelas XII IPS 1"],
};

// ── Kasus per siswa (bagian 03) ──────────────────────────────────────────────────────────────
//
// Empat kartu ringkas di kepala bagian 03 sempat berisi "Tinjau 7 hari", "Orang tua dihubungi",
// "Pendampingan aktif" -- semua itu metrik manajemen kasus yang butuh seseorang mencatat
// tindakannya secara manual (siapa sudah dihubungi, pendampingan mana yang jalan). Itu TIDAK
// bisa "diolah otomatis dari data yang ada" karena data itu sendiri belum ada di skema mana
// pun, harus dibangun sistem pencatatan kasus terpisah lebih dulu.
//
// Empat metrik pengganti (lihat `perhatian.ringkas` di paLaporanContoh) semuanya turunan
// langsung dari skor asesmen per siswa per domain -- persis yang akan tersedia begitu pipeline
// hulu menulis hasil akhirnya ke Supabase. Supaya turunannya jujur (bukan angka ringkasan yang
// ditulis terpisah dan kebetulan konsisten), berkas ini membangun dulu KUMPULAN KASUS per siswa
// (nama, kelas, domain mana saja yang skornya tinggi, skor tertingginya), lalu seluruh angka
// bagian 03 -- jumlah per domain, jumlah gabungan, jumlah lintas-domain, rata-rata keparahan,
// daftar nama di dialog -- dihitung dari kumpulan itu, bukan dari tabel angka terpisah.

const KASUS_NAMA_DEPAN = [
  "Andi", "Muhammad", "Nur", "Siti", "Ahmad", "Putri", "Fatimah", "Rizky", "Aulia", "Syifa",
  "Bayu", "Dewi", "Fajar", "Intan", "Rendra", "Salsabila", "Taufik", "Zahra", "Farel", "Kirana",
  "Yusuf", "Alya", "Rafi", "Naila",
];
const KASUS_NAMA_BELAKANG = [
  "Nugraha", "Pratama", "Ramadhani", "Anandya", "Wijaya", "Kusuma", "Saputra", "Amalia",
  "Firmansyah", "Az-Zahra", "Maulana", "Permata", "Wibowo", "Utami", "Prasetyo", "Handayani",
  "Setiawan", "Lestari",
];

/** Kombinasi nama depan x belakang supaya pool besar tidak kelihatan mengulang nama yang sama. */
function namaKasus(i) {
  const depan = KASUS_NAMA_DEPAN[i % KASUS_NAMA_DEPAN.length];
  const belakang = KASUS_NAMA_BELAKANG[(i * 7 + 3) % KASUS_NAMA_BELAKANG.length];
  return `${depan} ${belakang}`;
}

/** PRNG deterministik (mulberry32) -- angka contoh tetap sama tiap dimuat, tidak dipakai Math.random. */
function mulberry32(seed) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DOMAIN_PERHATIAN_KODE = ["emosional", "relasi", "hiperaktivitas", "agresi"];

/**
 * Bangun kumpulan kasus satu unit: tiap entri satu siswa yang skornya di atas ambang di
 * SATU domain atau lebih (`domains`), lengkap skor tertingginya. Ukuran pool proporsional ke
 * total siswa unit (dikira-kira 16% masuk salah satu dari empat domain), dan 30% di antaranya
 * sengaja ditandai tinggi di domain kedua sekaligus -- itulah yang membuat metrik "lebih dari
 * satu domain" punya arti nyata, bukan angka yang ditulis terpisah.
 */
function bangunKasusUnit(u, total, seed) {
  const acak = mulberry32(seed);
  // Dasar ~16% dari total siswa, diberi variasi kecil dari seed supaya tiap unit tidak persis
  // proporsional (dunia nyata tidak pernah rapi begitu).
  const dasar = total * 0.16;
  const jumlahKasus = Math.max(6, Math.round(dasar + (acak() - 0.5) * dasar * 0.3));

  return Array.from({ length: jumlahKasus }, (_, i) => {
    const domainUtama = DOMAIN_PERHATIAN_KODE[Math.floor(acak() * DOMAIN_PERHATIAN_KODE.length)];
    const domains = new Set([domainUtama]);
    if (acak() < 0.3) {
      domains.add(DOMAIN_PERHATIAN_KODE[Math.floor(acak() * DOMAIN_PERHATIAN_KODE.length)]);
    }
    const skor = 6 + Math.floor(acak() * 5); // 6-10, ambang "perlu perhatian" ke atas
    return {
      nama: namaKasus(seed * 31 + i),
      unit: UNIT[u].label,
      kelas: KELAS[u][i % KELAS[u].length],
      domains: [...domains],
      skor,
      // Status CONTOH, bukan ambang skor asli per domain (itu beda-beda tiap domain SDQ, lihat
      // catatan panjang di PaPerluPerhatian.jsx) -- cukup untuk mewarnai badge di preview visual.
      status: skor >= 9 ? "Perlu Diwaspadai" : "Perlu Perhatian",
    };
  });
}

const KASUS_SEED_UNIT = { sd: 101, smp: 102, sma: 103 };

function kumpulanKasus(unitIds) {
  return unitIds.flatMap((u) => bangunKasusUnit(u, UNIT[u].total, KASUS_SEED_UNIT[u]));
}

// ── Kalimat insight, dihitung dari data yang sudah ada di atas ───────────────────────────────
//
// Bukan narasi yang ditulis lepas dan kebetulan konsisten -- tiap kalimat di bawah ini genuinely
// hasil bandingan angka (domain mana tertinggi, unit mana menonjol, berapa kali lipat). Begitu
// pipeline hulu sungguhan siap, kalimat sekelas ini akan digantikan narasi hasil Gemini yang
// jauh lebih kaya konteks -- fungsi-fungsi ini cuma pratinjau NILAI dari insight semacam itu,
// bukan pengganti permanen.

/** Satu kalimat headline bagian 02: domain mana yang porsi "perlu perhatian"+"perlu diwaspadai"
 * gabungan tertinggi. Nama field di sini (aman/perhatian/diwaspadai) PERSIS sama dengan kunci
 * yang dibaca TingkatList di PaHasilAsesmen.jsx. */
function insightUtamaAsesmen(ringkasan, perUnit, unitId) {
  const tertinggi = ringkasan.reduce((acc, d) => (!acc || (d.perhatian + d.diwaspadai) > (acc.perhatian + acc.diwaspadai) ? d : acc), null);
  if (!tertinggi) return "";
  const gabungan = Math.round((tertinggi.perhatian + tertinggi.diwaspadai) * 10) / 10;
  let kalimat = `${tertinggi.label} adalah domain dengan porsi "perlu perhatian" dan "perlu diwaspadai" tertinggi periode ini, ${gabungan}% dari siswa yang diases.`;
  if (unitId === "semua" && perUnit.length > 1) {
    const unitTertinggi = unitPalingMenonjol(perUnit, tertinggi.kode);
    if (unitTertinggi) kalimat += ` Paling menonjol di ${unitTertinggi.label} (${unitTertinggi.v}%).`;
  }
  return kalimat;
}

/** Cari unit dengan porsi "perhatian"+"diwaspadai" gabungan tertinggi untuk satu domain. */
function unitPalingMenonjol(perUnit, domainKode) {
  return perUnit.reduce((acc, u) => {
    const d = u.dimensi.find((x) => x.kode === domainKode);
    const v = d ? Math.round((d.perhatian + d.diwaspadai) * 10) / 10 : 0;
    return !acc || v > acc.v ? { label: u.label, v } : acc;
  }, null);
}

/** Kalimat insight per domain (dipakai di panel "artinya" bagian 02 saat domain itu dipilih). */
function insightAsesmenDomain(d, ringkasan, perUnit, unitId) {
  const gabungan = Math.round((d.perhatian + d.diwaspadai) * 10) / 10;
  const rataRata = ringkasan.reduce((s, r) => s + r.perhatian + r.diwaspadai, 0) / ringkasan.length;
  const selisih = Math.round((gabungan - rataRata) * 10) / 10;
  const arah = selisih > 0.4 ? "di atas" : selisih < -0.4 ? "di bawah" : "setara dengan";
  let kalimat = `Porsi "perlu perhatian" + "perlu diwaspadai" domain ini ${gabungan}%, ${arah} rata-rata lima domain (${rataRata.toFixed(1).replace(".", ",")}%).`;
  if (unitId === "semua" && perUnit.length > 1) {
    const unitTertinggi = unitPalingMenonjol(perUnit, d.kode);
    if (unitTertinggi && unitTertinggi.v > 0) kalimat += ` Paling menonjol di ${unitTertinggi.label} (${unitTertinggi.v}%).`;
  }
  return kalimat;
}

/** Satu kalimat headline bagian 03: domain paling mendesak, dibandingkan domain paling ringan. */
function insightUtamaPerhatian(domainTerurut) {
  if (domainTerurut.length < 2 || domainTerurut[0].jumlah === 0) return "";
  const top = domainTerurut[0];
  const bawah = domainTerurut[domainTerurut.length - 1];
  let kalimat = `${top.label} adalah domain paling mendesak periode ini, ${top.jumlah} siswa perlu ditelaah.`;
  if (bawah.jumlah > 0) {
    const rasio = Math.round((top.jumlah / bawah.jumlah) * 10) / 10;
    if (rasio >= 1.3) kalimat += ` Jumlahnya ${rasio.toString().replace(".", ",")}x lipat dibanding domain paling ringan, ${bawah.label}.`;
  }
  return kalimat;
}

/**
 * Antrean prioritas bagian 03. Empat domain saja: Tolong Menolong SENGAJA tidak masuk sini
 * karena domain itu mengukur kekuatan prososial, skor rendah di sana bukan kasus yang perlu
 * telaah individual, melainkan bahan penguatan yang sudah tampil di bagian 02.
 *
 * `status` (prioritas tertinggi / perlu penguatan / dst) diperlakukan sebagai LABEL DATA dari
 * hulu, bukan diturunkan dari urutan di sini -- supaya nanti bisa berbeda dari sekadar ranking
 * jumlah kalau pertimbangan ahli berkata lain.
 *
 * `share` = porsi siswa domain ini yang menunjukkan perilaku tersebut. Satu siswa bisa
 * menunjukkan lebih dari satu perilaku, jadi jumlah share memang boleh lebih dari 1.
 */
// `nilai` = pencapaian indikator itu sendiri (dari 100%, angka independen dari share/jumlah
// siswa) -- lihat catatan panjang di PaPerluPerhatian.jsx soal kenapa dua angka ini HARUS
// ditampilkan terpisah dan dilabeli, bukan digabung jadi satu baris seperti versi sebelumnya.
const PERHATIAN_DOMAIN = [
  {
    kode: "emosional", huruf: "E", label: "Emosional", status: "prioritas tertinggi",
    perilaku: [
      { label: "Tampak khawatir atau tegang", share: 0.52, nilai: 1.12 },
      { label: "Mudah takut pada situasi baru", share: 0.43, nilai: 0.95 },
      { label: "Kesulitan mengelola kesedihan", share: 0.34, nilai: 0.78 },
    ],
  },
  {
    kode: "relasi", huruf: "R", label: "Relasi", status: "perlu penguatan",
    perilaku: [
      { label: "Merasa sendiri di lingkungan sekolah", share: 0.516, nilai: 1.05 },
      { label: "Sulit memulai interaksi dengan teman", share: 0.419, nilai: 0.88 },
      { label: "Merasa tidak diterima kelompok", share: 0.306, nilai: 0.66 },
    ],
  },
  {
    kode: "hiperaktivitas", huruf: "H", label: "Hiperaktivitas", status: "pantau per kelas",
    perilaku: [
      { label: "Sulit diam saat kegiatan belajar", share: 0.661, nilai: 1.15 },
      { label: "Bertindak sebelum memikirkan akibat", share: 0.518, nilai: 0.97 },
      { label: "Mudah kehilangan fokus", share: 0.446, nilai: 0.84 },
    ],
  },
  {
    kode: "agresi", huruf: "A", label: "Agresi", status: "butuh pencegahan",
    perilaku: [
      { label: "Bereaksi keras saat kecewa", share: 0.558, nilai: 1.02 },
      { label: "Konflik berulang dengan teman", share: 0.419, nilai: 0.86 },
      { label: "Sulit menghentikan pertengkaran", share: 0.349, nilai: 0.71 },
    ],
  },
];

/**
 * Kartu kelima bagian 03: Tolong Menolong (prososial). Beda perlakuan dari empat domain di atas
 * -- lihat catatan panjang soal arah skala terbalik di PA_GLOSARIUM.prososial dan di
 * paAssembler.js. Status SELALU "butuh penguatan" (bukan ranking prioritas seperti domain lain),
 * dan jumlahnya TIDAK ikut dihitung ke metrik gabungan `perhatian.ringkas` (perlu_telaah/rasio/
 * lintas_domain/keparahan) -- itu tetap murni dari `kumpulanKasus` empat domain kesulitan.
 */
const PERHATIAN_PROSOSIAL = {
  kode: "prososial", huruf: "T", label: "Tolong Menolong", status: "butuh penguatan",
  perilaku: [
    { label: "Jarang menawarkan bantuan tanpa diminta", share: 0.41, nilai: 0.68 },
    { label: "Kurang peka saat teman terlihat kesulitan", share: 0.33, nilai: 0.55 },
    { label: "Enggan berbagi saat punya kelebihan", share: 0.27, nilai: 0.45 },
  ],
};

/**
 * Narasi analisis lengkap per domain prioritas, dibuka lewat tombol "Baca analisis lengkap" di
 * tiap kartu bagian 03. Ditulis dengan nada yang sama seperti contoh "versi berbobot" di
 * docs/Kerangka_Tindak_Lanjut_Keilmuan_FIR.md: menyebut sumber sinyal, tidak mendiagnosis,
 * membingkai sebagai area yang sedang ditelaah/dipantau (bukan vonis), dan menyasar sistem di
 * sekitar anak (kelas, rumah) alih-alih menyalahkan anak sebagai individu.
 *
 * Ini narasi CONTOH untuk membangun tampilan. Pemilik produk akan merumuskan narasi versi
 * sungguhan lewat pipeline terpisah (aturan deterministik + Gemini + gerbang persetujuan
 * psikolog, sama seperti tindak lanjut modul lain) -- bentuk objek di sini sengaja jadi
 * bayangan kasar bentuk JSON yang nanti dipakai, belum jadi skema final.
 */
const PERHATIAN_ANALISIS = {
  emosional: {
    interpretasi: "Skor tinggi pada domain ini menandakan siswa lebih sering menunjukkan tanda cemas, khawatir, atau sedih dibanding teman sebayanya pada periode skrining ini. Ini sinyal untuk ditelaah dan dipantau, sesuai maksud SDQ sebagai alat skrining, bukan indikasi gangguan kecemasan tertentu.",
    kemungkinan_penyebab: [
      "Tekanan akademik atau ekspektasi nilai yang tinggi",
      "Transisi jenjang atau perubahan lingkungan sosial",
      "Kurangnya ruang bercerita yang dirasa aman, di sekolah maupun di rumah",
    ],
    rekomendasi: [
      "Wali kelas melakukan check-in singkat dan personal ke siswa yang tercatat, tanpa membuka skor di depan kelas",
      "Sediakan waktu khusus dengan guru BK untuk siswa yang tercatat berulang di beberapa periode",
      "Selaraskan dengan orang tua lewat komunikasi ringan di tahap awal, bukan pemanggilan formal",
    ],
    tanda_keberhasilan: [
      "Siswa lebih terbuka bercerita ke wali kelas atau guru BK",
      "Frekuensi tampak cemas menurun pada asesmen periode berikutnya",
      "Orang tua melaporkan suasana hati yang lebih stabil di rumah",
    ],
  },
  relasi: {
    interpretasi: "Skor tinggi menunjukkan siswa lebih sering mengalami kesulitan menjalin pertemanan atau merasa kurang diterima kelompok. Sinyal ini lebih tepat dibaca sebagai kondisi lingkungan kelas yang perlu ditelaah, bukan semata kekurangan pada diri anak.",
    kemungkinan_penyebab: [
      "Komposisi kelompok belajar yang jarang dirotasi",
      "Eksklusi halus antarsiswa yang tidak selalu terlihat guru",
      "Siswa baru pindah atau baru naik jenjang yang belum menemukan lingkaran pertemanan",
    ],
    rekomendasi: [
      "Rotasi kelompok belajar secara berkala supaya interaksi antarsiswa lebih merata",
      "Amati pola duduk dan bermain saat istirahat untuk siswa yang tercatat",
      "Libatkan siswa dalam kegiatan berbasis peran supaya punya alasan konkret untuk berinteraksi",
    ],
    tanda_keberhasilan: [
      "Siswa mulai terlihat berinteraksi di luar kelompok lamanya",
      "Berkurangnya laporan merasa sendiri pada asesmen berikutnya",
      "Guru melaporkan siswa lebih aktif dalam kerja kelompok",
    ],
  },
  hiperaktivitas: {
    interpretasi: "Skor tinggi menandakan siswa lebih sering kesulitan memusatkan perhatian atau menahan dorongan bertindak dibanding teman sekelasnya. Ini sinyal untuk dipantau dalam konteks kelas, bukan diagnosis ADHD, yang berada di luar cakupan instrumen skrining ini.",
    kemungkinan_penyebab: [
      "Durasi duduk diam yang panjang tanpa jeda gerak",
      "Rangsangan berlebih dari gawai menjelang jam belajar",
      "Materi belajar yang kurang melibatkan aktivitas fisik atau praktik langsung",
    ],
    rekomendasi: [
      "Sisipkan jeda gerak singkat di tengah jam pelajaran yang panjang",
      "Dudukkan lebih dekat dengan guru untuk siswa yang tercatat, tanpa menandai secara terbuka",
      "Diskusikan pola penggunaan gawai menjelang waktu belajar bersama orang tua",
    ],
    tanda_keberhasilan: [
      "Durasi fokus siswa saat mengerjakan tugas bertambah",
      "Guru melaporkan siswa lebih mudah kembali tenang setelah jeda",
      "Skor domain ini menurun pada asesmen periode berikutnya",
    ],
  },
  agresi: {
    interpretasi: "Skor tinggi menandakan siswa lebih sering menunjukkan perilaku menentang, mudah marah, atau berselisih dengan orang lain. Fokus tindak lanjutnya pada pola dan pemicunya, bukan mencap anak sebagai bermasalah.",
    kemungkinan_penyebab: [
      "Kesulitan mengungkapkan kekecewaan dengan kata-kata",
      "Konflik berulang dengan kelompok pertemanan yang sama",
      "Aturan kelas yang tidak konsisten diterapkan antarguru",
    ],
    rekomendasi: [
      "Ajarkan kalimat sederhana untuk mengungkapkan kekecewaan sebelum bereaksi",
      "Telaah pola pemicu bersama wali kelas, siapa saja yang biasanya terlibat",
      "Terapkan konsekuensi yang konsisten dan disepakati bersama, bukan berbeda-beda antarguru",
    ],
    tanda_keberhasilan: [
      "Frekuensi konflik dengan teman menurun",
      "Siswa mulai memakai kalimat sebelum bertindak, bukan langsung bereaksi",
      "Guru melaporkan lebih mudah menenangkan siswa saat kecewa",
    ],
  },
  prososial: {
    interpretasi: "Skor **rendah** pada domain ini (kebalikan dari empat domain lain) menandakan siswa jarang menunjukkan kesediaan berbagi, menolong, atau berempati dibanding teman sebayanya. Ini bahan penguatan, bukan kasus yang perlu ditelaah seperti domain kesulitan.",
    kemungkinan_penyebab: [
      "Belum banyak kesempatan berlatih menolong dalam situasi nyata",
      "Contoh perilaku prososial di lingkungan sekitar masih terbatas",
      "Ragu bertindak karena belum yakin caranya membantu tanpa terlihat ikut campur",
    ],
    rekomendasi: [
      "Berikan tugas kelompok yang mengharuskan peran saling membantu",
      "Apresiasi terbuka setiap kali muncul perilaku menolong, sekecil apa pun",
      "Ajak diskusi kelas tentang situasi sehari-hari yang butuh empati",
    ],
    tanda_keberhasilan: [
      "Siswa lebih sering menawarkan bantuan tanpa diminta",
      "Guru melaporkan siswa lebih peka pada teman yang kesulitan",
      "Skor domain ini meningkat pada asesmen periode berikutnya",
    ],
  },
};

// ── Survei kebiasaan ────────────────────────────────────────────────────────────────────────
//
// `interpretasi` -- satu kalimat pembacaan data per kategori, ditulis dengan nada yang sama
// dengan glosarium/analisis bagian 02-03 (menyebut angka asli, bukan vonis). `sinyal: true` di
// satu opsi menandai jawaban yang paling layak diperhatikan (bukan selalu "opsi terburuk" --
// untuk Kebiasaan Belajar semua opsi cuma preferensi, jadi tidak ada yang ditandai). Penanda ini
// dipakai insightUtamaSurvey untuk memilih temuan utama, bukan cuma dekorasi.

/** Sama persis CTA_PER_DOMAIN di paAssembler.js, disalin (bukan diimpor) supaya jalur mock dan
 * jalur asli tetap berdiri sendiri (pola yang sama dipakai seluruh berkas ini). */
const CTA_PER_DOMAIN_MOCK = {
  hiperaktivitas: "Bahas pola ini di rapat wali kelas berkala, dan sepakati satu rutinitas kelas untuk mengimbanginya.",
  emosional: "Sediakan waktu check-in ringan dengan wali kelas atau guru BK untuk siswa yang termasuk kelompok ini.",
  agresi: "Telaah bersama wali kelas pola pemicunya, lalu sepakati konsekuensi yang konsisten antarguru.",
  relasi: "Rancang kegiatan kelompok yang mendorong interaksi lintas lingkaran pertemanan.",
  prososial: "Perkuat lewat contoh dan apresiasi terbuka setiap kali muncul perilaku menolong.",
};

/** `domain` dipakai mengelompokkan pertanyaan ke kartu domain HEART di bagian 04, pola yang
 * sama dengan klasifikasiPertanyaan di paAssembler.js -- satu domain boleh menaungi lebih dari
 * satu pertanyaan (Hiperaktivitas di sini menaungi tiga). */
const SURVEY = [
  {
    kode: "kebiasaan_belajar",
    domain: "hiperaktivitas",
    judul: "Kebiasaan Belajar",
    interpretasi: "Mayoritas siswa (46%) sudah terbiasa belajar mandiri di ruangan tenang, modal awal yang baik untuk kebiasaan belajar mandiri di rumah.",
    opsi: [
      { label: "Sendiri di ruangan tenang", persen: 46 },
      { label: "Sambil dengar musik atau bergerak", persen: 31 },
      { label: "Ditemani orang lain", persen: 23 },
    ],
  },
  {
    kode: "penyelesaian_tugas",
    domain: "hiperaktivitas",
    judul: "Penyelesaian Tugas",
    interpretasi: "42% siswa masih butuh banyak pengingat dari orang lain untuk menyelesaikan tugas -- kemandirian menyelesaikan tugas belum terbentuk merata.",
    opsi: [
      { label: "Butuh banyak pengingat dari orang lain", persen: 42, sinyal: true },
      { label: "Butuh waktu tapi selesai juga", persen: 35 },
      { label: "Sering ditunda-tunda", persen: 23 },
    ],
  },
  {
    kode: "penggunaan_gadget",
    domain: "hiperaktivitas",
    judul: "Penggunaan Gadget",
    interpretasi: "44% siswa memakai gadget 2-4 jam sehari, durasi yang perlu diimbangi rutinitas non-layar menjelang waktu belajar.",
    opsi: [
      { label: "2-4 jam per hari", persen: 44, sinyal: true },
      { label: "1-2 jam per hari", persen: 33 },
      { label: "Tidak pasti, tergantung hari", persen: 23 },
    ],
  },
  {
    kode: "tempat_bercerita",
    domain: "relasi",
    judul: "Tempat Bercerita",
    interpretasi: "17% siswa belum tahu harus bercerita ke siapa saat menghadapi masalah -- sejalan dengan temuan serupa di jawaban esai terbuka (lihat Ruang Baca Esai).",
    opsi: [
      { label: "Keluarga", persen: 48 },
      { label: "Teman", persen: 35 },
      { label: "Belum tahu harus ke siapa", persen: 17, sinyal: true },
    ],
  },
  {
    kode: "permintaan_bantuan",
    domain: "prososial",
    judul: "Saat Guru atau Orang Tua Minta Bantuan",
    interpretasi: "14% siswa cenderung menolak saat diminta bantuan -- bisa jadi sinyal kelelahan atau kurang merasa mampu, bukan semata sikap enggan menolong.",
    opsi: [
      { label: "Langsung membantu dengan senang hati", persen: 52 },
      { label: "Membantu tapi sambil mengeluh", persen: 34 },
      { label: "Menolak untuk membantu", persen: 14, sinyal: true },
    ],
  },
];

/**
 * Kalimat insight utama bagian Survey. Prioritas pertama: silang-rujuk "Tempat Bercerita" dengan
 * statistik esai berkode sama (`esaiStatistik` di bawah) -- dua instrumen berbeda (pilihan
 * tertutup dan jawaban terbuka) menunjuk pola yang sama, itu bukti yang lebih kuat daripada satu
 * angka survei saja. Kalau silang-rujuk itu tidak tersedia, jatuh ke opsi bertanda `sinyal`
 * dengan persentase tertinggi antarkategori.
 */
function insightUtamaSurvey(survey, esaiStatistik) {
  const bercerita = survey.find((k) => k.kode === "tempat_bercerita");
  const sinyalBercerita = bercerita?.opsi.find((o) => o.sinyal);
  const esaiStat = esaiStatistik.find((s) => s.kode === "tempat_bercerita");
  if (sinyalBercerita && esaiStat) {
    return `${sinyalBercerita.persen}% siswa mengaku belum tahu harus bercerita ke siapa saat menghadapi masalah, sejalan dengan ${esaiStat.nilai} jawaban esai terbuka yang menyebut tema serupa -- dua sumber data berbeda menunjuk pola yang sama.`;
  }

  const kandidat = survey
    .map((k) => ({ judul: k.judul, opsi: k.opsi.find((o) => o.sinyal) }))
    .filter((k) => k.opsi);
  if (!kandidat.length) return "";
  const top = kandidat.reduce((acc, k) => (!acc || k.opsi.persen > acc.opsi.persen ? k : acc), null);
  return `${top.opsi.persen}% siswa menjawab "${top.opsi.label}" pada kategori ${top.judul}.`;
}

// ── Ruang baca jawaban esai ─────────────────────────────────────────────────────────────────

/**
 * Jawaban esai SELALU memakai kode anonim (SIA-08-104), bukan nama siswa -- sama seperti
 * modul Screening. Guru bisa membaca isi ceritanya tanpa membuka identitas anak.
 *
 * `domain` dan `pertanyaan_kode` di sini PERSIS memakai kode dari PA_DOMAIN_META/
 * PA_ESAI_PERTANYAAN di paAssembler.js (tolong_menolong, bukan "prososial" seperti PA_DIMENSI di
 * berkas ini) -- PaRuangBacaEsai.jsx impor kedua kamus itu langsung dari paAssembler.js untuk
 * label domain dan teks pertanyaan, dipakai bareng oleh jalur mock dan jalur asli. `prioritas`
 * (bukan lagi `status`) juga disamakan namanya dengan field pa_esai.anotasi.prioritas asli.
 */
const ESAI = [
  {
    id: "SIA-08-104",
    unit: "SMP Islam Athirah Bone",
    domain: "relasi",
    pertanyaan_kode: "orang_yang_dipercaya_untuk_cerita",
    prioritas: "Pantau",
    jawaban:
      "Saya biasanya cerita ke ibu karena ibu mendengarkan sampai selesai dan tidak langsung marah. Tetapi kalau masalahnya tentang nilai, saya kadang memilih diam karena takut membuat ibu khawatir. Di sekolah saya punya teman dekat, tetapi saya belum terlalu nyaman cerita kepada guru. Saya akan lebih mudah bicara kalau ada waktu khusus dan tidak didengar teman lain.",
    tema: ["dukungan keluarga", "takut membebani", "privasi"],
    sinyal:
      "Perlu dipantau. Siswa memiliki dukungan keluarga, tetapi menahan cerita ketika terkait prestasi.",
    saran:
      "Wali kelas dapat menawarkan check-in privat dan menjelaskan jalur konseling tanpa menekan siswa untuk langsung bercerita.",
  },
  {
    id: "SIA-05-219",
    unit: "SD Kajaolalido",
    domain: "relasi",
    pertanyaan_kode: "orang_yang_dipercaya_untuk_cerita",
    prioritas: "Pencegahan",
    jawaban:
      "Kalau banyak tugas bersamaan saya bingung harus mulai dari yang mana. Biasanya saya kerjakan yang paling gampang dulu, lalu yang susah tidak sempat selesai. Kadang saya minta bantuan kakak, tapi kakak juga sibuk. Saya ingin ada yang mengingatkan urutan mengerjakan.",
    tema: ["beban tugas", "manajemen waktu", "butuh pendampingan"],
    sinyal:
      "Sinyal ringan. Kesulitannya soal cara mengatur urutan kerja, bukan kemampuan akademiknya.",
    saran:
      "Ajarkan satu teknik memecah tugas di kelas dan bagikan lembar urutan pengerjaan ke orang tua.",
  },
  {
    id: "SIA-11-357",
    unit: "SMA Islam Athirah Bone",
    domain: "relasi",
    pertanyaan_kode: "orang_yang_dipercaya_untuk_cerita",
    prioritas: "Prioritas",
    jawaban:
      "Saya cerita ke teman karena belum tahu harus menemui siapa di sekolah. Guru BK pernah masuk kelas sekali di awal tahun, setelah itu saya tidak tahu ruangannya di mana dan jam berapa bisa datang. Kalau ada masalah besar saya biasanya diam saja sampai reda sendiri. Sebenarnya saya ingin bicara dengan orang dewasa, tapi saya takut dianggap berlebihan.",
    tema: ["akses layanan", "takut dinilai", "isolasi"],
    sinyal:
      "Prioritas. Siswa tidak tahu jalur bantuan formal dan cenderung memendam masalah besar.",
    saran:
      "Umumkan jadwal dan lokasi layanan konseling secara berkala, lalu buka kanal janji temu yang tidak perlu izin wali kelas.",
  },
  {
    id: "SIA-08-243",
    unit: "SMP Islam Athirah Bone",
    domain: "tolong_menolong",
    pertanyaan_kode: "kenapa_penting_peduli",
    prioritas: "Pantau",
    jawaban:
      "Saya ingin membantu, tapi takut salah bicara dan membuat suasana lebih buruk. Waktu itu ada teman yang menangis di kelas dan saya cuma diam di tempat duduk. Setelah itu saya menyesal. Saya tidak tahu kalimat apa yang aman untuk dipakai.",
    tema: ["niat menolong", "kurang keterampilan", "penyesalan"],
    sinyal:
      "Perlu dipantau. Niat prososialnya kuat, yang kurang adalah keterampilan praktis menolong.",
    saran:
      "Latih kalimat pembuka sederhana lewat simulasi singkat di jam wali kelas.",
  },
  {
    id: "SIA-12-401",
    unit: "SMA Islam Athirah Bone",
    domain: "relasi",
    pertanyaan_kode: "orang_yang_dipercaya_untuk_cerita",
    prioritas: "Pencegahan",
    jawaban:
      "Saya merasa paling diterima waktu kerja kelompok proyek karena semua orang punya bagian dan pendapat saya dipakai. Di luar itu saya lebih banyak sendiri saat istirahat. Saya tidak masalah sendiri, tapi kadang ingin ada yang mengajak duluan.",
    tema: ["rasa diterima", "kerja kelompok", "inisiatif sosial"],
    sinyal:
      "Sinyal ringan. Rasa diterima muncul saat ada struktur peran yang jelas.",
    saran:
      "Perbanyak tugas berbasis peran dan rotasi anggota kelompok supaya lingkaran pertemanan melebar.",
  },
  {
    id: "SIA-06-133",
    unit: "SD Kajaolalido",
    domain: "relasi",
    pertanyaan_kode: "orang_yang_dipercaya_untuk_cerita",
    prioritas: null,
    jawaban:
      "Perut saya sakit sehari sebelum ujian, padahal sudah belajar. Saya takut nilainya turun dan orang tua kecewa. Kalau sudah masuk ruangan biasanya membaik, tapi malamnya susah tidur.",
    tema: [],
    sinyal: null,
    saran: null,
  },
  {
    id: "SIA-09-288",
    unit: "SMP Islam Athirah Bone",
    domain: "relasi",
    pertanyaan_kode: "orang_yang_dipercaya_untuk_cerita",
    prioritas: "Prioritas",
    jawaban:
      "Pulang sekolah sore, lalu masih ada les dan tugas. Saya sering tidur lewat tengah malam dan bangun masih capek. Kalau minta libur les rasanya tidak enak karena sudah dibayar. Jadi saya jalani saja walaupun sering tidak fokus di kelas.",
    tema: ["kelelahan", "jadwal padat", "sungkan menolak"],
    sinyal:
      "Prioritas. Pola tidur terganggu berulang dan berdampak ke fokus belajar di kelas.",
    saran:
      "Bicarakan beban jadwal dengan orang tua dalam pertemuan kelas dan tawarkan opsi pengurangan tugas rumah pada pekan padat.",
  },
  {
    id: "SIA-10-052",
    unit: "SD Kajaolalido",
    domain: "tolong_menolong",
    pertanyaan_kode: "kenapa_penting_peduli",
    prioritas: "Pencegahan",
    jawaban:
      "Karena saya pernah kesulitan dan ada yang bantu tanpa saya minta. Rasanya lega sekali. Jadi kalau ada yang kesulitan dan saya bisa, saya akan bantu. Tapi saya tidak mau terlihat sok tahu, jadi saya tunggu sampai dia cerita dulu.",
    tema: ["timbal balik", "empati", "hati-hati"],
    sinyal:
      "Sinyal positif. Motivasi menolong tumbuh dari pengalaman pribadi yang baik.",
    saran:
      "Libatkan siswa seperti ini sebagai teman sebaya pendamping di kegiatan orientasi.",
  },
];

// ── Perakit ────────────────────────────────────────────────────────────────────────────────

function jumlahDari(persen, total) {
  return Math.round((persen / 100) * total);
}

/** "79 dari 484" -> "16,3" (koma desimal, gaya Indonesia). */
function persenSatuDesimal(bagian, total) {
  return ((bagian / total) * 100).toFixed(1).replace(".", ",");
}

/** Sama seperti persenSatuDesimal tapi mengembalikan angka (1 desimal), untuk kartu yang perlu memformat sendiri. */
function persenAngka(bagian, total) {
  return Math.round((bagian / total) * 1000) / 10;
}

/**
 * Rakit satu paket laporan contoh untuk unit tertentu. Di produk sungguhan, seluruh isi
 * kembalian ini datang jadi dari Supabase; pembagian jumlah siswa di sini murni supaya angka
 * contoh saling konsisten, bukan logika bisnis.
 */
export function paLaporanContoh(unitId = "semua") {
  const info = unitId === "semua" ? TOTAL_SEMUA : UNIT[unitId] || TOTAL_SEMUA;
  const unitAktif = unitId === "semua" ? ["sd", "smp", "sma"] : [unitId];

  // Kumpulan kasus periode ini, sumber tunggal untuk seluruh angka bagian 03 -- lihat catatan
  // panjang di bangunKasusUnit soal kenapa ini menggantikan tabel angka terpisah. Tidak ada
  // pembanding "periode lalu" -- data modul ini baru satu periode, membandingkan ke periode yang
  // belum pernah ada cuma akan mengarang tren yang tidak nyata.
  const kasus = kumpulanKasus(unitAktif);
  const totalPerluTelaah = kasus.length;
  const lintasDomain = kasus.filter((k) => k.domains.length > 1).length;
  const rataRataSkor = kasus.reduce((s, k) => s + k.skor, 0) / kasus.length;

  // Empat kartu domain "kesulitan", angkanya dari kumpulan kasus di atas.
  const perhatianDomainKesulitan = PERHATIAN_DOMAIN.map((d) => {
    const anggota = kasus.filter((k) => k.domains.includes(d.kode)).sort((a, b) => b.skor - a.skor);
    const jumlah = anggota.length;
    return {
      kode: d.kode,
      huruf: d.huruf,
      label: d.label,
      status: d.status,
      jumlah,
      persen: persenSatuDesimal(jumlah, info.total),
      perilaku: d.perilaku.map((p, i) => {
        const jumlahIndikator = Math.round(p.share * jumlah);
        return {
          rank: i + 1,
          label: p.label,
          nilai: p.nilai,
          jumlah: jumlahIndikator,
          persen: persenAngka(jumlahIndikator, info.total),
        };
      }),
      siswa: anggota.slice(0, 10),
      ...PA_GLOSARIUM[d.kode],
      analisis: PERHATIAN_ANALISIS[d.kode],
    };
  });

  // Kartu kelima, Tolong Menolong -- TIDAK dari kumpulan kasus di atas (itu cuma menaungi empat
  // domain kesulitan). Jumlahnya proksi dari tingkat "diwaspadai" (skor rendah, lihat catatan di
  // PERHATIAN_PROSOSIAL) domain prososial pada ASESMEN, status selalu "butuh penguatan".
  const prososialTier = ASESMEN[unitId]?.prososial || ASESMEN.semua.prososial;
  const prososialJumlah = jumlahDari(prososialTier[2], info.total);
  const perhatianPrososial = {
    kode: PERHATIAN_PROSOSIAL.kode,
    huruf: PERHATIAN_PROSOSIAL.huruf,
    label: PERHATIAN_PROSOSIAL.label,
    status: PERHATIAN_PROSOSIAL.status,
    jumlah: prososialJumlah,
    persen: persenSatuDesimal(prososialJumlah, info.total),
    perilaku: PERHATIAN_PROSOSIAL.perilaku.map((p, i) => {
      const jumlahIndikator = Math.round(p.share * prososialJumlah);
      return {
        rank: i + 1,
        label: p.label,
        nilai: p.nilai,
        jumlah: jumlahIndikator,
        persen: persenAngka(jumlahIndikator, info.total),
      };
    }),
    siswa: [],
    ...PA_GLOSARIUM.prososial,
    analisis: PERHATIAN_ANALISIS.prososial,
  };

  const perhatianDomain = [...perhatianDomainKesulitan, perhatianPrososial].sort((a, b) => b.jumlah - a.jumlah);

  const asesmenRingkasan = PA_DIMENSI.map((d) => {
    const [aman, perhatian, diwaspadai] = ASESMEN[unitId]?.[d.kode] || ASESMEN.semua[d.kode];
    return { ...d, aman, perhatian, diwaspadai, ...PA_GLOSARIUM[d.kode] };
  });
  const asesmenPerUnit = unitAktif.map((u) => ({
    kode: u,
    label: UNIT[u].label,
    dimensi: PA_DIMENSI.map((d) => {
      const [aman, perhatian, diwaspadai] = ASESMEN[u][d.kode];
      return { ...d, aman, perhatian, diwaspadai };
    }),
  }));

  // Dihitung lebih dulu (bukan langsung ditulis di dalam `esai:` di bawah) karena
  // insightUtamaSurvey perlu menyilang-rujuk kategori "Tempat Bercerita" dengan statistik esai
  // berkode sama -- lihat catatan panjang di insightUtamaSurvey.
  const esaiStatistik = [
    {
      kode: "terkumpul",
      nilai: unitId === "semua" ? "437" : String(jumlahDari(90, info.total)),
      label: "Jawaban esai terkumpul",
      detail: "90,3% responden mengisi sedikitnya satu pertanyaan terbuka.",
    },
    {
      kode: "tempat_bercerita",
      nilai: "17,2%",
      label: "Belum tahu tempat bercerita",
      detail: "Perlu penguatan akses ke orang dewasa tepercaya.",
    },
    {
      kode: "tekanan_belajar",
      nilai: "24,7%",
      label: "Menyebut tekanan belajar",
      detail: "Tema muncul pada tugas, ujian, dan ekspektasi nilai.",
    },
  ];

  return {
    meta: {
      lembaga: "Sekolah Islam Athirah",
      unit_label: info.label,
      diperbarui: "28 Juli 2026",
      responden: info.total,
    },

    statistik: {
      total: info.total,
      laki: { jumlah: info.laki, persen: Math.round((info.laki / info.total) * 100) },
      perempuan: { jumlah: info.perempuan, persen: Math.round((info.perempuan / info.total) * 100) },
      sebaran: unitAktif.map((u) => ({
        kode: u,
        label: UNIT[u].label,
        persen: unitId === "semua" ? UNIT[u].porsi : 100,
        total: UNIT[u].total,
      })),
      emosi: unitAktif.map((u) => ({
        kode: u,
        label: UNIT[u].label,
        segmen: PA_EMOSI_LEVELS.map((lvl, i) => ({ ...lvl, persen: EMOSI[u][i] })),
      })),
    },

    asesmen: {
      insight_utama: insightUtamaAsesmen(asesmenRingkasan, asesmenPerUnit, unitId),
      ringkasan: asesmenRingkasan.map((d) => ({
        ...d,
        insight: insightAsesmenDomain(d, asesmenRingkasan, asesmenPerUnit, unitId),
      })),
      per_unit: asesmenPerUnit,
    },

    perhatian: {
      ringkas: [
        {
          kode: "perlu_telaah", tipe: "angka", label: "Perlu perhatian", nilai: totalPerluTelaah,
          detail: "Siswa perlu telaah individual, digabung dari seluruh domain.", sorot: true,
        },
        {
          kode: "rasio", tipe: "persen", label: "Rasio dari total siswa",
          nilai: persenAngka(totalPerluTelaah, info.total),
          detail: "Proporsi siswa perlu perhatian dari total responden periode ini.",
        },
        {
          kode: "lintas_domain", tipe: "angka", label: "Lebih dari satu domain", nilai: lintasDomain,
          detail: "Siswa yang tinggi di lebih dari satu domain sekaligus, prioritas ditelaah lebih dulu.",
        },
        {
          kode: "keparahan", tipe: "skor", label: "Intensitas rata-rata", nilai: Math.round(rataRataSkor * 10) / 10,
          detail: "Rata-rata skor keparahan siswa yang tercatat, skala 1 sampai 10.",
        },
      ],
      // Insight dihitung dari EMPAT domain kesulitan saja (sudah terurut jumlah tertinggi->
      // terendah), bukan dari `perhatianDomain` yang lima -- kalau Tolong Menolong ikut masuk
      // perbandingan "paling mendesak vs paling ringan", dua makna beda (kasus yang perlu
      // ditelaah vs kekuatan yang perlu ditumbuhkan) akan tercampur dalam satu kalimat.
      insight_utama: insightUtamaPerhatian([...perhatianDomainKesulitan].sort((a, b) => b.jumlah - a.jumlah)),
      domain: perhatianDomain,
    },

    survey: {
      insight_utama: insightUtamaSurvey(SURVEY, esaiStatistik),
      per_domain: PA_DIMENSI.map((d) => {
        const pertanyaan = SURVEY.filter((s) => s.domain === d.kode);
        return {
          ...d,
          pertanyaan: pertanyaan.map((s) => ({
            kode: s.kode,
            judul: s.judul,
            opsi: s.opsi.map((o, i) => ({ ...o, rank: i + 1, jumlah: jumlahDari(o.persen, info.total) })),
            interpretasi: s.interpretasi,
          })),
        };
      }).filter((d) => d.pertanyaan.length > 0),
      // Padanan hitungTopPrioritasSurvey (paAssembler.js), tapi CONTOH ini pakai penanda
      // `sinyal:true` yang sudah dikurasi tangan di SURVEY di atas -- bukan re-derive heuristik
      // kata kunci yang sama, supaya preview visual tetap konsisten dengan opsi yang memang
      // sengaja ditandai penulis contoh ini.
      top_prioritas: SURVEY
        .map((s) => {
          const opsiSinyal = s.opsi.find((o) => o.sinyal);
          if (!opsiSinyal) return null;
          const d = PA_DIMENSI.find((x) => x.kode === s.domain);
          return {
            pertanyaanKode: s.kode,
            domainKode: s.domain,
            domainLabel: d?.label || s.domain,
            domainHuruf: d?.huruf || "?",
            pertanyaanJudul: s.judul,
            opsiLabel: opsiSinyal.label,
            jumlah: jumlahDari(opsiSinyal.persen, info.total),
            persen: opsiSinyal.persen,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.persen - a.persen)
        .slice(0, 3)
        .map((k, i) => ({
          ...k,
          rank: i + 1,
          cta: CTA_PER_DOMAIN_MOCK[k.domainKode] || "Diskusikan pola ini bersama wali kelas dan orang tua pada pertemuan berkala.",
        })),
    },

    // esai TIDAK disaring per unit -- pa_esai asli tidak punya kolom unit, lihat catatan kepala
    // paAssembler.js. Filter unit di halaman cuma memengaruhi bagian 01-03, bukan ruang baca esai.
    esai: {
      statistik: esaiStatistik,
      entri: ESAI,
    },
  };
}
