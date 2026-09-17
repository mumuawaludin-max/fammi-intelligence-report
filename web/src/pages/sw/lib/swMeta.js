// Kamus modul Screening Awal Wellbeing (kode modul: sw).
//
// Bingkai modul: yang diukur adalah KONDISI KERJA, bukan kondisi mental perorangan. Pembacanya
// yayasan dan tim Human Capital, jadi label memakai bahasa sehari-hari yang langsung dipahami.
// Kata "kesehatan mental", "gangguan", "sehat", "tidak sehat", dan "waspada" tidak boleh muncul
// sebagai label di antarmuka modul ini (lihat uji di swPembaca.test.js).
//
// Tiap kamus punya `label` (pendek, untuk layar) dan `panjang` (satu-dua kalimat, untuk tooltip
// saat label itu disorot). `penjelas` adalah keterangan satu baris di bawah label.

export const MODUL_SW = "sw";

/** Lima subskala Form A. `kolom` = judul kolom di sheet "03 Skor Individu"/"05 Prioritas". */
export const SUBSKALA = [
  { kunci: "energi", label: "Energi dan Pemulihan", pendek: "Energi & istirahat", huruf: "E", kolom: "T_Energi",
    panjang: "Seberapa bertenaga saat bekerja dan seberapa pulih setelah istirahat. Makin tinggi makin baik." },
  { kunci: "fungsi", label: "Fungsi Sehari-hari", pendek: "Keseharian", huruf: "K", kolom: "T_Fungsi",
    panjang: "Seberapa lancar kegiatan kerja sehari-hari dijalani. Makin tinggi makin baik." },
  { kunci: "beban", label: "Beban dan Kendali", pendek: "Beban kerja", huruf: "B", kolom: "T_Beban",
    panjang: "Seberapa terkendali beban kerja. Makin tinggi berarti beban makin terasa ringan dan terkendali." },
  { kunci: "dukungan", label: "Dukungan", pendek: "Dukungan", huruf: "D", kolom: "T_Dukungan",
    panjang: "Seberapa terasa dukungan dari atasan dan rekan kerja. Makin tinggi makin baik." },
  { kunci: "makna", label: "Makna dan Keterikatan", pendek: "Makna kerja", huruf: "M", kolom: "T_Makna",
    panjang: "Seberapa berarti pekerjaan ini dan seberapa terikat dengan tempat kerja. Makin tinggi makin baik." },
];

export const INDEKS = {
  kunci: "indeks", label: "Skor kondisi kerja", pendek: "Skor total", kolom: "IKD",
  panjang: "Gabungan lima aspek, 0 sampai 100. Makin tinggi berarti kondisi kerja makin baik.",
};

/** Lima subskala ditambah indeks, urutan baris di peta panas dan perbandingan tiga lapis. */
export const BARIS_SKOR = [...SUBSKALA, INDEKS];

export function labelSubskala(kunci) {
  return BARIS_SKOR.find((s) => s.kunci === kunci)?.label || kunci;
}

/** Kunci subskala dari judul kolom Excel ("T_Beban" -> "beban"). */
export function kunciDariKolom(kolom) {
  return BARIS_SKOR.find((s) => s.kolom === kolom)?.kunci || null;
}

/**
 * Lima kategori kondisi. Batas bawah inklusif. Warna memakai token --fm-* di swTokens.module.css;
 * `teks` adalah warna tulisan di atas warna itu: putih di atas ungu dan jingga, gelap hanya di atas emas.
 */
export const KATEGORI_BAWAAN = [
  { kunci: "sangat_kurang", label: "Sangat perlu perhatian", min: 0, max: 24,
    warna: "var(--fm-jingga)", teks: "#FFFFFF" },
  { kunci: "kurang", label: "Perlu perhatian", min: 25, max: 41,
    warna: "var(--fm-jingga-muda)", teks: "#FFFFFF" },
  { kunci: "cukup", label: "Cukup", min: 42, max: 58,
    warna: "var(--fm-emas)", teks: "var(--fm-teks)" },
  { kunci: "menopang", label: "Baik", min: 59, max: 74,
    warna: "var(--fm-ungu-sedang)", teks: "#FFFFFF" },
  { kunci: "sangat_menopang", label: "Sangat baik", min: 75, max: 100,
    warna: "var(--fm-ungu)", teks: "#FFFFFF" },
];

/** Tujuh alasan rekomendasi, urutan tetap sesuai brief. */
export const ALASAN = [
  { kunci: "minta", label: "Minta dibantu", penjelas: "Menyatakan ingin didampingi.",
    panjang: "Menjawab \"Ya\" saat ditanya apakah ingin dibantu atau didampingi." },
  { kunci: "atasan", label: "Sudah cerita ke atasan", penjelas: "Pernah bilang sedang berat.",
    panjang: "Pernah menyampaikan sendiri ke atasannya bahwa sedang menghadapi keadaan berat, dan atasan mencatatnya." },
  { kunci: "fungsi", label: "Sulit menjalani keseharian", penjelas: "Skor keseharian sangat rendah.",
    panjang: "Skor Keseharian di bawah ambang (25 dari 100): kegiatan kerja sehari-hari terasa sulit dijalani." },
  { kunci: "ragu", label: "Masih ragu", penjelas: "Jawab \"mungkin\" soal bantuan.",
    panjang: "Menjawab \"Mungkin\" saat ditanya apakah ingin dibantu: belum yakin, tapi tidak menolak." },
  { kunci: "datar", label: "Merasa akan tetap berat", penjelas: "Berat, dan 3 bulan lagi diperkirakan tetap.",
    panjang: "Sekarang terasa berat (angka 2 ke bawah dari 5) dan harapannya 3 bulan lagi hampir tidak naik. Bukan berarti menyerah; ini tanda perlu ditanya lebih dulu." },
  { kunci: "tekanan", label: "Beban belum terlihat atasan", penjelas: "Atasan belum melihat bebannya.",
    panjang: "Pegawai merasa berat, tetapi atasan tidak menandai beban itu saat mengisi Form B." },
  { kunci: "wakil", label: "Perwakilan unit", penjelas: "Agar tiap unit terwakili.",
    panjang: "Diundang lewat kuota per unit atau kursi sisa supaya tiap unit terwakili, bukan karena tanda tertentu." },
];

export function infoAlasan(kunci) {
  return ALASAN.find((a) => a.kunci === kunci) || null;
}

/** Jalur masuk daftar peserta. Nilai sheet "06 Daftar Peserta" kolom Jalur. */
export const JALUR = [
  { kunci: "penanda", label: "Karena alasan khusus", pendek: "Alasan khusus", sumber: "Penanda",
    panjang: "Masuk daftar karena punya satu atau lebih alasan khusus (minta dibantu, sudah cerita ke atasan, dan seterusnya)." },
  { kunci: "kuota", label: "Kuota per unit", pendek: "Kuota unit", sumber: "Kuota unit",
    panjang: "Masuk daftar lewat jatah tiap unit supaya semua unit terwakili." },
  { kunci: "sisa", label: "Kursi sisa", pendek: "Kursi sisa", sumber: "Sisa kursi",
    panjang: "Mengisi kursi yang masih tersisa setelah alasan khusus dan kuota unit terpenuhi." },
];

export function labelJalur(kunci) {
  return JALUR.find((j) => j.kunci === kunci)?.label || kunci;
}

/** Pola dua sudut pandang. Nilai sheet "05 Prioritas" kolom Pola. */
export const POLA = [
  { kunci: "selaras", label: "Sejalan dengan atasan", sumber: "Selaras",
    panjang: "Yang dirasakan pegawai dan yang dilihat atasannya kurang lebih sama." },
  { kunci: "selisih", label: "Atasan melihat lebih berat", sumber: "Selisih sudut pandang",
    panjang: "Atasan menandai beban lebih berat daripada yang dirasakan pegawai sendiri." },
  { kunci: "tekanan", label: "Beban belum terlihat atasan", sumber: "Tekanan tak terlihat",
    panjang: "Pegawai merasa berat, tetapi atasan belum melihatnya." },
];

export function labelPola(kunci) {
  if (!kunci) return "Belum dinilai atasan";
  return POLA.find((p) => p.kunci === kunci)?.label || kunci;
}

/** Jawaban pertanyaan pendalaman (Personal Form kolom AH). */
export const PERMINTAAN = [
  { kunci: "ya", label: "Ya, merasa perlu", awalan: "Ya" },
  { kunci: "mungkin", label: "Mungkin, belum yakin", awalan: "Mungkin" },
  { kunci: "belum", label: "Belum perlu saat ini", awalan: "Belum" },
];

/** Label angka kondisi 1 sampai 5, mengikuti pilihan jawaban Personal Form kolom I. */
export const SKALA_KONDISI = [
  { nilai: 1, label: "Sangat berat", panjang: "Menjawab 1 dari 5: empat pekan terakhir terasa sangat berat." },
  { nilai: 2, label: "Berat", panjang: "Menjawab 2 dari 5: empat pekan terakhir terasa berat." },
  { nilai: 3, label: "Sedang", panjang: "Menjawab 3 dari 5: empat pekan terakhir terasa biasa saja." },
  { nilai: 4, label: "Baik", panjang: "Menjawab 4 dari 5: empat pekan terakhir terasa baik." },
  { nilai: 5, label: "Sangat baik", panjang: "Menjawab 5 dari 5: empat pekan terakhir terasa sangat baik." },
];

export function labelKondisi(n) {
  return SKALA_KONDISI.find((s) => s.nilai === n)?.label || "";
}

/** Kelompok harapan 3 bulan ke depan, dibandingkan dengan rasanya bekerja sekarang. */
export const HARAPAN = [
  { kunci: "naik", label: "Ingin membaik", warna: "var(--fm-ungu)",
    panjang: "Angka harapan 3 bulan lagi lebih tinggi dari angka sekarang." },
  { kunci: "tetap", label: "Mengira tetap", warna: "var(--fm-emas)",
    panjang: "Angka harapan 3 bulan lagi sama dengan angka sekarang." },
  { kunci: "turun", label: "Mengira memburuk", warna: "var(--fm-jingga)",
    panjang: "Angka harapan 3 bulan lagi lebih rendah dari angka sekarang." },
  { kunci: "sudahTertinggi", label: "Sudah di angka 5", warna: "var(--ink-4)",
    panjang: "Sekarang sudah 5 dari 5, jadi tidak bisa naik lagi dan dipisah dari hitungan." },
];

export const KALIMAT_BERAT_TETAP = "merasa berat sekarang dan mengira 3 bulan lagi masih sama beratnya";

/**
 * Tujuh pilihan kebutuhan dukungan. `awalan` adalah kata pertama pilihan, dipakai sama seperti
 * sheet "07 Unit" mencocokkan jawaban yang terpotong ("Waktu dan ruang istirahat ya...").
 */
export const KEBUTUHAN = [
  { kunci: "pelatihan", awalan: "Pelatihan", label: "Pelatihan keterampilan tertentu" },
  { kunci: "waktu", awalan: "Waktu", label: "Waktu dan ruang istirahat yang benar-benar bisa dipakai" },
  { kunci: "komunikasi", awalan: "Komunikasi", label: "Komunikasi yang lebih jelas dari pimpinan" },
  { kunci: "tempat", awalan: "Tempat", label: "Tempat berkonsultasi saat menghadapi siswa atau orang tua yang sulit" },
  { kunci: "kejelasan", awalan: "Kejelasan", label: "Kejelasan jalur pengembangan karier" },
  { kunci: "penataan", awalan: "Penataan", label: "Penataan ulang beban administrasi" },
  { kunci: "dukungan", awalan: "Dukungan", label: "Dukungan untuk kondisi pribadi di luar pekerjaan" },
];

export function labelKebutuhan(kunci) {
  return KEBUTUHAN.find((k) => k.kunci === kunci)?.label || kunci;
}

/** Empat ranah indikator Form B. Urutan tampil: kekuatan lebih dulu (brief, Tab 3 dan Tab 5). */
export const RANAH = [
  { kunci: "kekuatan", label: "Kekuatan", panjang: "Hal baik yang dilihat atasan: jadi tempat bercerita, siap membantu, membawa suasana enak." },
  { kunci: "beban", label: "Beban", panjang: "Tanda beban yang dilihat atasan: tugas tambahan, jam kerja panjang, tempat bergantung, tugas melebihi waktu." },
  { kunci: "perubahan", label: "Perubahan", panjang: "Perubahan yang dilihat atasan belakangan ini: semangat menurun, jarang terlibat, mudah lelah, menarik diri." },
  { kunci: "konteks", label: "Situasi", panjang: "Keadaan yang sedang dijalani: peran baru, baru kembali dari cuti panjang, kuliah sambil bekerja, sudah cerita ke atasan." },
];

/** Lima belas indikator Form B. Teks diambil dari judul kolom Leader Form. */
export const INDIKATOR = [
  { kode: "K1", ranah: "beban", teks: "Memikul tugas tambahan di luar tugas pokok dalam tiga bulan terakhir" },
  { kode: "K2", ranah: "beban", teks: "Jam kerjanya kerap melampaui jam kerja yang wajar" },
  { kode: "K3", ranah: "beban", teks: "Paling sering menjadi tempat bergantung ketika ada pekerjaan mendadak" },
  { kode: "K4", ranah: "beban", teks: "Beban tugasnya tampak melebihi waktu yang tersedia" },
  { kode: "K5", ranah: "perubahan", teks: "Energi atau semangatnya tampak menurun dibanding beberapa bulan lalu" },
  { kode: "K6", ranah: "perubahan", teks: "Belakangan lebih jarang terlibat dalam kegiatan bersama" },
  { kode: "K7", ranah: "perubahan", teks: "Belakangan tampak lebih mudah lelah atau lebih sering menyebut dirinya capek" },
  { kode: "K8", ranah: "perubahan", teks: "Belakangan tampak lebih menarik diri dari pergaulan di unit" },
  { kode: "K9", ranah: "kekuatan", teks: "Menjadi tempat rekan lain bercerita ketika menghadapi kesulitan" },
  { kode: "K10", ranah: "kekuatan", teks: "Paling siap membantu ketika ada rekan yang kewalahan" },
  { kode: "K11", ranah: "kekuatan", teks: "Tampak menikmati pekerjaannya dan membawa suasana yang enak di unit" },
  { kode: "K12", ranah: "konteks", teks: "Mendapat peran atau penugasan baru dalam enam bulan terakhir" },
  { kode: "K13", ranah: "konteks", teks: "Baru kembali dari cuti panjang atau sakit" },
  { kode: "K14", ranah: "konteks", teks: "Sedang menempuh studi bersamaan dengan bekerja" },
  { kode: "K15", ranah: "konteks", teks: "Pernah menyampaikan sendiri kepada atasan bahwa sedang menghadapi keadaan berat" },
];

/** Indikator dikelompokkan per ranah, urutan ranah mengikuti RANAH (kekuatan lebih dulu). */
export function indikatorPerRanah() {
  return RANAH.map((r) => ({ ...r, indikator: INDIKATOR.filter((i) => i.ranah === r.kunci) }));
}

/** Frekuensi interaksi pimpinan dengan anggota tim (Leader Form). */
export const FREKUENSI = [
  "Hampir setiap hari",
  "Beberapa kali sepekan",
  "Beberapa kali sebulan",
  "Jarang",
  "Lebih dari satu jawaban",
  "Tidak tercatat",
];

/**
 * Empat kelompok pandangan pegawai dan atasan. Kelompok diturunkan dari kolom Pola sheet 05
 * (lihat kuadranDari di swPembaca.js); `arti` adalah satu kalimat penjelas untuk layar.
 * `posisi` menentukan letak di kotak 2x2: baris atas = pegawai merasa berat, kolom kanan =
 * atasan melihat berat.
 */
export const KUADRAN = [
  { kunci: "keduanya", label: "Berat, atasan tahu", arti: "Pegawai merasa berat dan atasan juga melihatnya.",
    posisi: { baris: 0, kolom: 1 } },
  { kunci: "tersembunyi", label: "Berat, atasan belum tahu", arti: "Pegawai merasa berat, tapi atasan belum melihatnya.",
    posisi: { baris: 0, kolom: 0 } },
  { kunci: "teramati", label: "Atasan melihat berat", arti: "Atasan melihat beban lebih berat dari yang dirasakan pegawai.",
    posisi: { baris: 1, kolom: 1 } },
  { kunci: "menopang", label: "Sama-sama baik", arti: "Pegawai dan atasan sama-sama melihat kondisi baik.",
    posisi: { baris: 1, kolom: 0 } },
];

/** Tiga selisih pandangan pegawai dan atasan (Gap_Beban, Gap_Energi, Gap_Dukungan dari sheet 05). */
export const GAP_PANDANGAN = [
  { kunci: "beban", label: "Beban kerja", kiri: "Atasan melihat lebih berat", kanan: "Pegawai merasa lebih berat",
    panjang: "Selisih tanda beban dari atasan dengan beban yang dirasakan pegawai. Ke kanan berarti pegawai merasa lebih berat daripada yang dilihat atasan." },
  { kunci: "energi", label: "Tenaga", kiri: "Atasan melihat lebih lelah", kanan: "Pegawai merasa lebih lelah",
    panjang: "Selisih tanda perubahan tenaga dari atasan dengan energi yang dirasakan pegawai. Ke kanan berarti pegawai merasa lebih lelah daripada yang dilihat atasan." },
  { kunci: "dukungan", label: "Dukungan", kiri: "Pegawai merasa lebih didukung", kanan: "Atasan melihat lebih kuat",
    panjang: "Selisih tanda kekuatan dari atasan dengan dukungan yang dirasakan pegawai. Ke kanan berarti atasan melihat pegawai ini lebih kuat daripada dukungan yang ia rasakan." },
];

export function infoKuadran(kunci) {
  return KUADRAN.find((k) => k.kunci === kunci) || null;
}

/**
 * Label selisih pandangan atasan dan tim, dari label gap berkas. `panjang` dibuat lewat fungsi
 * karena ambangnya dibaca dari asumsi berkas.
 */
export const SELISIH = {
  Selaras: { label: "Sejalan", panjang: (g) => `Selisih ${g.selaras} ke bawah: isian pegawai dan penilaian atasan hampir sama.` },
  Ringan: { label: "Sedikit beda", panjang: (g) => `Selisih ${g.selaras + 1} sampai ${g.ringan}: ada perbedaan kecil, masih wajar terjadi.` },
  Sedang: { label: "Cukup beda", panjang: (g) => `Selisih ${g.ringan + 1} sampai ${g.sedang}: ada hal yang belum tersampaikan antara tim dan atasan.` },
  Signifikan: { label: "Jauh beda", panjang: (g) => `Selisih di atas ${g.sedang}: yang dirasakan tim dan yang dilihat atasan jauh berbeda; bahan percakapan, bukan penilaian.` },
};

/** Status tindak lanjut Human Capital pada Profil Pegawai. */
export const STATUS_TINJAUAN = [
  { kunci: "belum", label: "Belum dihubungi" },
  { kunci: "dijadwalkan", label: "Dijadwalkan asesmen" },
  { kunci: "selesai", label: "Sudah ditindaklanjuti" },
  { kunci: "tidak_lanjut", label: "Tidak perlu tindak lanjut" },
];

/** Kelompok unit, dari kolom B Personal Form ("sekolah"/"non"). */
export const KELOMPOK_UNIT = [
  { kunci: "sekolah", label: "Sekolah dan asrama" },
  { kunci: "layanan", label: "Departemen dan layanan" },
];

export function labelKelompok(kunci) {
  return KELOMPOK_UNIT.find((k) => k.kunci === kunci)?.label || kunci;
}

export const JENJANG = ["TK", "SD", "SMP", "SMA", "Boarding", "Lintas jenjang"];

/**
 * Urutan daftar pegawai di pemilih Profil Pegawai. `nilai(o)` mengambil angka yang diurutkan,
 * `arah` "naik" berarti angka terkecil lebih dulu. Semua angkanya final dari berkas.
 */
export const URUTAN_PROFIL = [
  { kunci: "spa", label: "Paling perlu didampingi (skor prioritas)", arah: "turun", satuan: "skor prioritas",
    nilai: (o) => o.spa, panjang: "Skor prioritas dari berkas olahan, gabungan isian diri, penilaian atasan, dan harapan. Angka internal, bukan peringkat orang." },
  { kunci: "indeks", label: "Skor kondisi kerja terendah", arah: "naik", satuan: "dari 100",
    nilai: (o) => o.indeks, panjang: "Skor kondisi kerja 0 sampai 100; makin rendah makin perlu perhatian." },
  { kunci: "beban", label: "Beban kerja paling terasa", arah: "naik", satuan: "skor beban",
    nilai: (o) => o.skor?.beban, panjang: "Skor Beban dan Kendali; makin rendah berarti beban makin terasa berat." },
  { kunci: "energi", label: "Energi paling terkuras", arah: "naik", satuan: "skor energi",
    nilai: (o) => o.skor?.energi, panjang: "Skor Energi dan Pemulihan; makin rendah berarti makin lelah." },
  { kunci: "fungsi", label: "Keseharian paling sulit", arah: "naik", satuan: "skor keseharian",
    nilai: (o) => o.skor?.fungsi, panjang: "Skor Fungsi Sehari-hari; makin rendah berarti kegiatan kerja makin sulit dijalani." },
  { kunci: "dukungan", label: "Dukungan paling kurang", arah: "naik", satuan: "skor dukungan",
    nilai: (o) => o.skor?.dukungan, panjang: "Skor Dukungan; makin rendah berarti makin sedikit dukungan yang terasa." },
  { kunci: "makna", label: "Makna kerja paling rendah", arah: "naik", satuan: "skor makna",
    nilai: (o) => o.skor?.makna, panjang: "Skor Makna dan Keterikatan; makin rendah berarti makin kurang merasa cocok dan terikat dengan tempat kerja." },
  { kunci: "kondisi", label: "Rasanya bekerja paling berat", arah: "naik", satuan: "dari 5",
    nilai: (o) => o.kondisi, panjang: "Jawaban 1 sampai 5 atas pertanyaan bagaimana rasanya bekerja 4 pekan terakhir." },
  { kunci: "gap", label: "Paling beda dengan pandangan atasan", arah: "turun", satuan: "selisih",
    nilai: (o) => o.pengamatan?.ketidakselarasan, panjang: "Selisih antara isian pegawai dan penilaian atasannya; makin besar makin jauh berbeda." },
  { kunci: "nama", label: "Nama A sampai Z", arah: "naik", satuan: "", nilai: () => null, panjang: "Urut abjad." },
];

/**
 * Ambang bawaan. Nilai bobot, ambang label gap, ambang pola, ambang Fungsi, dan batas Komp_C
 * PERSIS nilai blok "ASUMSI & AMBANG" di sheet "05 Prioritas" berkas Athirah; pembaca data
 * menimpanya dengan isi berkas yang sedang dibaca. Tiga nilai terakhir (batasKuadran,
 * qcPimpinan, harapanDatar) tidak tertulis sebagai sel asumsi di berkas: harapanDatar diturunkan
 * dari cara sheet 05 memberi penanda "Harapan datar", dua lainnya ambang penyajian usulan.
 */
export const ASUMSI_BAWAAN = {
  bobotDenganPengamatan: { A: 0.55, B: 0.2, C: 0.1, D: 0.15 },
  bobotTanpaPengamatan: { A: 0.79, D: 0.21 },
  labelGap: { selaras: 10, ringan: 25, sedang: 40 },
  ambangPola: 25,
  ambangFungsi: 25,
  batasKompC: 50,
  minPengisiUnit: 10,
  kategori: KATEGORI_BAWAAN.map(({ kunci, min, max }) => ({ kunci, min, max })),
  harapanDatar: { kondisiMaks: 2, gapMaks: 1 },
  batasKuadran: 30,
  qcPimpinan: { banyakMin: 0.5, sedikitMaks: 0.5, pusatMin: 0.6, pusatTimMin: 5 },
};

export const KALIMAT_FOOTER = "Data ini adalah awal percakapan, bukan kesimpulan.";
export const KALIMAT_BUKAN_DIAGNOSIS = "Gambaran ini berasal dari satu kali pengukuran dan bukan diagnosis.";
export const KALIMAT_JALUR =
  "Ketiga jalur bercampur dalam satu daftar. Keberadaan seseorang di daftar ini tidak bisa dibaca sebagai tanda apa pun tentang keadaannya.";
export const KALIMAT_PIMPINAN =
  "Data ini dipakai untuk pengembangan kepala unit, bukan untuk menilai kepala unit. Jarak yang besar berarti ada hal yang belum tersampaikan, bukan berarti ada yang lalai.";
