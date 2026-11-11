/**
 * Data contoh dan aturan layar Kasus & SLA (prototipe Sekolah Proteksi, kanvas desain pemilik
 * produk 2026-11-11). Semua nama, kelas, waktu, dan angka di sini data contoh untuk demonstrasi.
 *
 * Waktu disimpan sebagai menit sejak Senin 9 Nov 2026 pukul 00.00. Nilai negatif berarti minggu
 * sebelumnya atau Oktober. Jam prototipe mulai Rabu 11 Nov 10.30 dan maju beberapa menit setiap
 * ada tindakan, supaya cap waktu di riwayat kasus ikut bergerak.
 */

const MENIT_SEHARI = 1440;
const HARI = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

/** Rabu 11 Nov 2026, 10.30. */
export const JAM_AWAL = 2 * MENIT_SEHARI + 630;

// ---------- waktu ----------
export const hariKe = (t) => Math.floor(t / MENIT_SEHARI);
const namaHari = (hari) => HARI[((hari % 7) + 7) % 7];
const duaDigit = (n) => (n < 10 ? "0" : "") + n;

/** "10.30" */
export function jamMenit(t) {
  const m = ((t % MENIT_SEHARI) + MENIT_SEHARI) % MENIT_SEHARI;
  return duaDigit(Math.floor(m / 60)) + "." + duaDigit(m % 60);
}

/** "Rab 11 Nov", atau "Sel 27 Okt" untuk hari sebelum 1 Nov. */
export function labelHari(t) {
  const hari = hariKe(t);
  const tanggal = 9 + hari;
  return namaHari(hari) + " " + (tanggal >= 1 ? tanggal + " Nov" : 31 + tanggal + " Okt");
}

/** "Rab 11 Nov 10.30" */
export const waktuLengkap = (t) => labelHari(t) + " " + jamMenit(t);

/** Tanpa tanggal kalau harinya sama dengan hari ini: "Rab 10.30". */
export const waktuSingkat = (t, kini) =>
  (hariKe(t) === hariKe(kini) ? namaHari(hariKe(t)) + " " : labelHari(t) + " ") + jamMenit(t);

/** Cap waktu riwayat: hari dan jam saja, mis. "Rab 10.32". */
export const capWaktu = (kini) => namaHari(hariKe(kini)) + " " + jamMenit(kini);

/** Tambah n hari kerja (Senin sampai Jumat), jamnya tetap. */
export function tambahHariKerja(t, n) {
  let hasil = t;
  let sisa = n;
  while (sisa > 0) {
    hasil += MENIT_SEHARI;
    if (((hariKe(hasil) % 7) + 7) % 7 < 5) sisa -= 1;
  }
  return hasil;
}

/** "15 menit", "1 j 42 m", "2 hari". */
export function durasi(menit) {
  if (menit >= MENIT_SEHARI) return Math.round(menit / MENIT_SEHARI) + " hari";
  if (menit >= 60) return Math.floor(menit / 60) + " j " + (menit % 60) + " m";
  return menit + " menit";
}

// ---------- tingkat, tahap, SLA ----------
/** Batas respon pertama dan rencana tindak per tingkat. `tinjau` = jarak tinjau ulang (hari). */
export const ATURAN = {
  Darurat: { respon: (t) => t + 60, rencana: (t) => t + MENIT_SEHARI, responL: "1 jam", rencanaL: "24 jam", tinjau: 7 },
  Tinggi: { respon: (t) => t + 240, rencana: (t) => tambahHariKerja(t, 2), responL: "4 jam", rencanaL: "2 hari kerja", tinjau: 7 },
  Sedang: { respon: (t) => tambahHariKerja(t, 1), rencana: (t) => tambahHariKerja(t, 3), responL: "1 hari kerja", rencanaL: "3 hari kerja", tinjau: 14 },
  Rendah: { respon: (t) => tambahHariKerja(t, 2), rencana: (t) => tambahHariKerja(t, 5), responL: "2 hari kerja", rencanaL: "5 hari kerja", tinjau: 14 },
};

export const PIL_TINGKAT = { Darurat: "pill sm crit", Tinggi: "pill sm bad", Sedang: "pill sm warn", Rendah: "pill sm mid" };

/** Urutan tingkat untuk mengurutkan antrean (Darurat di atas). */
export const BOBOT_TINGKAT = { Darurat: 0, Tinggi: 1, Sedang: 2, Rendah: 3 };

export const TAHAP = {
  analisis: { label: "Perlu dianalisis", pil: "pill sm warn" },
  diteruskan: { label: "Diteruskan", pil: "pill sm mid" },
  rencana: { label: "Rencana tindak", pil: "pill sm mid" },
  pantau: { label: "Dipantau", pil: "pill sm gray" },
  selesai: { label: "Selesai", pil: "pill sm ok" },
};
export const URUTAN_TAHAP = ["analisis", "diteruskan", "rencana", "pantau", "selesai"];

/** Kartu "Alur Bila Terjadi Kejadian": satu tombol per tahap, sekaligus saringan antrean. */
export const TAHAP_ALUR = [
  { id: "analisis", judul: "1 · Analisis tingkat", ket: "Seberapa serius? Tetapkan tingkat" },
  { id: "diteruskan", judul: "2 · Diteruskan", ket: "Ke orang yang tepat, menunggu respon" },
  { id: "rencana", judul: "3 · Rencana tindak", ket: "Langkah penanganan dijalankan" },
  { id: "pantau", judul: "4 · Dipantau", ket: "Kondisi anak dicek ulang" },
  { id: "selesai", judul: "Selesai", ket: "Ditutup dengan catatan hasil" },
];

/** Langkah di stepper laci detail. */
export const LANGKAH = ["Masuk", "Analisis", "Diteruskan", "Rencana tindak", "Dipantau", "Selesai"];

/** Tombol utama dan catatan kaki laci detail per tahap. */
export const AKSI_TAHAP = {
  analisis: { label: "Tetapkan tingkat dan teruskan", catatan: "Setelah diteruskan, penanggung jawab menerima notifikasi aplikasi dan WhatsApp." },
  diteruskan: { label: "Catat respon pertama", catatan: "Respon pertama = anak sudah ditemui dan pelapor dikabari." },
  rencana: { label: "Pindah ke pemantauan", catatan: "Pindahkan setelah langkah utama rencana tindak berjalan." },
  pantau: { label: "Tutup kasus", catatan: "Pilih hasil akhir di atas sebelum menutup." },
  selesai: { label: "", catatan: "Kasus selesai. Riwayat tetap tersimpan untuk laporan pimpinan." },
};

/** Pilihan hasil akhir saat menutup kasus. `ringkas` dipakai di riwayat. */
export const HASIL_AKHIR = [
  { id: "aman", label: "Tertangani, anak merasa aman", ringkas: "tertangani, anak merasa aman" },
  { id: "rujuk", label: "Dirujuk ke layanan luar, sekolah tetap memantau", ringkas: "dirujuk ke layanan luar, sekolah tetap memantau" },
  { id: "tidak", label: "Tidak terbukti, tetap dipantau wali kelas", ringkas: "tidak terbukti, tetap dipantau wali kelas" },
];

/** Status SLA satu kasus untuk kolom "SLA berikutnya" dan kartu angka. */
export function slaKasus(c, kini) {
  if (c.tahap === "selesai") return { nama: "Selesai " + c.selesaiLabel, label: "Tepat waktu", pil: "pill sm ok", telat: false };
  if (c.tahap === "pantau") return { nama: "Pemantauan", label: "Tinjau " + c.tinjauLabel, pil: "pill sm mid", telat: false };
  const aturan = ATURAN[c.tingkat];
  const tahapRespon = c.tahap === "analisis" || c.tahap === "diteruskan";
  const batas = tahapRespon ? aturan.respon(c.masuk) : aturan.rencana(c.masuk);
  const sisa = batas - kini;
  const nama = tahapRespon ? "Respon pertama" : "Rencana tindak";
  if (sisa < 0) return { nama, label: "Lewat " + durasi(-sisa), pil: "pill sm bad", telat: true };
  return {
    nama,
    label: hariKe(batas) === hariKe(kini) ? "Sisa " + durasi(sisa) : "Batas " + waktuLengkap(batas),
    pil: sisa / (batas - c.masuk) < 0.3 ? "pill sm warn" : "pill sm ok",
    telat: false,
  };
}

/**
 * Tiga baris kotak "Status SLA" di laci detail. `tingkatHitung` = tingkat hasil triase (saat
 * tahap analisis bisa berbeda dari tingkat tersimpan karena jawaban sedang dikoreksi).
 */
export function barisSla(c, kini, tingkatHitung) {
  if (c.terbatas) return [];
  const tersimpan = ATURAN[c.tingkat];
  const hitung = ATURAN[tingkatHitung];
  const urutan = URUTAN_TAHAP.indexOf(c.tahap);
  const baris = [];

  if (c.responLabel) {
    baris.push({ judul: "Respon pertama", target: "Target " + tersimpan.responL, status: c.responLabel, pil: "pill sm ok" });
  } else if (c.tRespon != null) {
    const batas = tersimpan.respon(c.masuk);
    const tepat = c.tRespon <= batas;
    baris.push({
      judul: "Respon pertama",
      target: "Target " + tersimpan.responL + " · batas " + waktuLengkap(batas),
      status: "Tercatat " + waktuSingkat(c.tRespon, kini) + (tepat ? " · tepat waktu" : " · terlambat"),
      pil: tepat ? "pill sm ok" : "pill sm bad",
    });
  } else {
    const batas = hitung.respon(c.masuk);
    const sisa = batas - kini;
    baris.push({
      judul: "Respon pertama",
      target: "Target " + hitung.responL + " · batas " + waktuLengkap(batas),
      status: sisa >= 0 ? "Sisa " + durasi(sisa) : "Lewat " + durasi(-sisa),
      pil: sisa < 0 ? "pill sm bad" : sisa / (batas - c.masuk) < 0.3 ? "pill sm warn" : "pill sm ok",
    });
  }

  if (c.rencanaLabel) {
    baris.push({ judul: "Rencana tindak", target: "Target " + tersimpan.rencanaL, status: c.rencanaLabel, pil: "pill sm ok" });
  } else if (c.tRencana != null) {
    const batas = tersimpan.rencana(c.masuk);
    const tepat = c.tRencana <= batas;
    baris.push({
      judul: "Rencana tindak",
      target: "Target " + tersimpan.rencanaL + " · batas " + waktuLengkap(batas),
      status: "Siap " + waktuSingkat(c.tRencana, kini) + (tepat ? " · tepat waktu" : " · terlambat"),
      pil: tepat ? "pill sm ok" : "pill sm bad",
    });
  } else {
    const batas = hitung.rencana(c.masuk);
    const sisa = batas - kini;
    baris.push({
      judul: "Rencana tindak",
      target: "Target " + hitung.rencanaL + " · batas " + waktuLengkap(batas),
      status: sisa < 0 ? "Lewat " + durasi(-sisa) : urutan < 2 ? "Setelah respon pertama" : "Sisa " + durasi(sisa),
      pil: sisa < 0 ? "pill sm bad" : urutan < 2 ? "pill sm gray" : "pill sm ok",
    });
  }

  baris.push({
    judul: "Pemantauan",
    target: "Cek ulang tiap minggu, 2–4 minggu",
    status: c.tahap === "pantau" ? "Tinjau " + c.tinjauLabel : c.tahap === "selesai" ? "Ditutup " + c.selesaiLabel : "Belum dimulai",
    pil: c.tahap === "pantau" ? "pill sm mid" : c.tahap === "selesai" ? "pill sm ok" : "pill sm gray",
  });
  return baris;
}

// ---------- triase enam pertanyaan ----------
export const PERTANYAAN = [
  "Anak dalam bahaya saat ini atau butuh pertolongan medis?",
  "Ada dugaan kekerasan seksual atau pendekatan tidak wajar oleh orang dewasa?",
  "Ada kekerasan fisik atau cedera?",
  "Terjadi berulang atau dilakukan lebih dari satu orang?",
  "Terlapor adalah guru atau staf sekolah?",
  "Anak tampak sangat tertekan, menolak sekolah, atau menyakiti diri?",
];
const SEBAB = [
  "ada bahaya saat ini",
  "dugaan kekerasan seksual atau pendekatan tidak wajar",
  "kekerasan fisik",
  "berulang",
  "terlapor staf sekolah",
  "anak sangat tertekan",
];
/** Indeks jawaban: 0 Tidak, 1 Tidak yakin, 2 Ya. */
export const JAWABAN = ["Tidak", "Tidak yakin", "Ya"];

/** Tingkat dari enam jawaban triase. */
export function tingkatDari(q) {
  if (q[0] === 2 || q[1] === 2 || q[4] === 2) return "Darurat";
  if (q[2] === 2 || q[5] === 2 || q[0] === 1 || q[1] === 1 || q[4] === 1) return "Tinggi";
  if (q[3] === 2 || q.some((x) => x === 1)) return "Sedang";
  return "Rendah";
}

/** Alasan tingkat dalam satu kalimat pendek. */
export function alasanDari(q) {
  const ya = SEBAB.filter((_, i) => q[i] === 2);
  const ragu = SEBAB.filter((_, i) => q[i] === 1);
  const teks = (ya.length ? "Ya: " + ya.join(", ") + ". " : "") + (ragu.length ? "Tidak yakin: " + ragu.join(", ") + "." : "");
  return teks.trim() || "Tidak ada tanda bahaya. Ditangani wali kelas.";
}

// ---------- penerusan ----------
/** Wali kelas per kelas: [inisial, nama, peran]. Urutan kunci = urutan pilihan Kelas di formulir. */
const WALI_KELAS = {
  "TK A": ["NR", "Bu Nisa", "Wali kelas TK A"],
  "TK B1": ["DN", "Bu Dian", "Wali kelas TK B1"],
  "TK B2": ["RH", "Bu Rahma", "Wali kelas TK B2"],
  "1A": ["WL", "Bu Wulan", "Wali kelas 1A"],
  "1B": ["FJ", "Pak Fajar", "Wali kelas 1B"],
  "2A": ["IN", "Bu Intan", "Wali kelas 2A"],
  "2B": ["RK", "Bu Rina", "Wali kelas 2B"],
  "3A": ["YS", "Pak Yusuf", "Wali kelas 3A"],
  "3B": ["MY", "Bu Maya", "Wali kelas 3B"],
  "4A": ["FT", "Bu Fitri", "Wali kelas 4A"],
  "4B": ["AR", "Pak Arif", "Wali kelas 4B"],
};
const WALI_UMUM = ["WK", "Wali kelas", "Wali kelas"];
export const KELAS = Object.keys(WALI_KELAS);

/** Penanggung jawab menurut tingkat dan jawaban triase: [[inisial, nama, peran], ...]. */
export function rute(tingkat, q, kelas) {
  if (q[4] === 2) return [["HW", "Bu Hartini", "Kepala Sekolah"], ["PF", "Pendamping Fammi", "Psikolog"]];
  if (tingkat === "Darurat") return [["HW", "Bu Hartini", "Kepala Sekolah"], ["LA", "Bu Laras", "Koordinator BK"], ["PF", "Pendamping Fammi", "Psikolog"]];
  if (tingkat === "Tinggi") return [WALI_KELAS[kelas] || WALI_UMUM, ["LA", "Bu Laras", "Guru BK"]];
  if (tingkat === "Sedang") return [["LA", "Bu Laras", "Guru BK"]];
  return [WALI_KELAS[kelas] || WALI_UMUM];
}

export const ATURAN_TEKS = {
  Darurat: "Aturan Darurat: Kepala Sekolah, Koordinator BK, dan pendamping Fammi menerima notifikasi bersamaan. Rujukan ke UPTD PPA atau layanan kesehatan bila perlu.",
  Tinggi: "Aturan Tinggi: wali kelas dan Guru BK menangani bersama; Kepala Sekolah diberi tahu tanpa perlu bertindak.",
  Sedang: "Aturan Sedang: Guru BK menangani dan melibatkan wali kelas bila perlu.",
  Rendah: "Aturan Rendah: wali kelas menangani; Guru BK melihat ringkasannya.",
};

// ---------- laci Aturan SLA ----------
/** Baris tabel aturan. Batas respon dan rencana tindak dibaca dari ATURAN. */
export const ATURAN_SLA = [
  { tingkat: "Darurat", contoh: "Anak dalam bahaya, dugaan kekerasan seksual atau pendekatan tidak wajar, terlapor staf", ke: "Kepala Sekolah, Koordinator BK, pendamping Fammi" },
  { tingkat: "Tinggi", contoh: "Kekerasan fisik, perundungan berulang, anak sangat tertekan", ke: "Guru BK dan wali kelas; Kepala Sekolah diberi tahu" },
  { tingkat: "Sedang", contoh: "Ejekan, pengucilan, tanda dari skrining, jawaban tidak yakin", ke: "Guru BK" },
  { tingkat: "Rendah", contoh: "Konflik ringan, kekhawatiran umum", ke: "Wali kelas" },
];

export const CATATAN_ATURAN = [
  "Lewat batas, kasus otomatis naik satu tingkat penanggung jawab: wali kelas, lalu Guru BK, lalu Kepala Sekolah. Notifikasi dikirim lewat aplikasi dan WhatsApp.",
  "Terlapor guru atau staf: hanya Kepala Sekolah dan pendamping Fammi yang bisa membuka detail. Staf terlapor tidak melihat kasusnya.",
  "Pemantauan setelah rencana tindak: tiap minggu selama 2 sampai 4 minggu. Kasus ditutup dengan catatan hasil.",
  "Pelapor, termasuk orang tua dan anak, melihat tahap dan perkiraan waktu, bukan catatan internal.",
  "Hari kerja dihitung Senin sampai Jumat.",
];

// ---------- formulir Lapor kejadian ----------
export const JENIS_KEJADIAN = [
  "Perundungan fisik",
  "Perundungan verbal",
  "Dikucilkan",
  "Pendekatan tidak wajar oleh orang dewasa",
  "Kekerasan oleh orang dewasa",
  "Emosi atau perilaku anak",
  "Cedera atau kecelakaan",
  "Lainnya",
];
export const LOKASI = ["Kelas", "Kantin", "Halaman bermain", "Toilet", "Antar-jemput", "Pesan atau daring", "Luar sekolah"];
export const WAKTU_KEJADIAN = ["Hari ini", "Kemarin", "Minggu ini", "Lebih lama"];

/** Isian awal formulir lapor. */
export function laporKosong() {
  return { jenis: "", nama: "", kelas: "2B", lokasi: "Kelas", kapan: "Hari ini", cerita: "", jawaban: [0, 0, 0, 0, 0, 0] };
}

/** Rencana tindak bawaan untuk laporan baru: [langkah, oleh, batas]. */
export const RENCANA_BARU = {
  Darurat: [
    ["Pastikan anak aman dan didampingi orang dewasa tepercaya", "Koordinator BK", "Hari ini"],
    ["Kabari orang tua dengan tenang", "Koordinator BK", "Hari ini"],
    ["Konsultasi pendamping Fammi", "Psikolog Fammi", "24 jam"],
    ["Rujuk ke layanan luar bila perlu", "Kepala Sekolah", "24 jam"],
    ["Catat kronologi satu kali", "Koordinator BK", "24 jam"],
  ],
  Tinggi: [
    ["Temui anak, pastikan aman, catat kronologi", "Wali kelas", "Hari ini"],
    ["Kabari orang tua", "Wali kelas", "Hari ini"],
    ["Bina pihak yang terlibat dan kabari orang tuanya", "Guru BK", "2 hari kerja"],
    ["Atur pengawasan di lokasi kejadian", "Guru piket", "2 hari kerja"],
    ["Cek kondisi anak tiap minggu", "Wali kelas", "4 minggu"],
  ],
  Sedang: [
    ["Temui anak dan dengarkan ceritanya", "Guru BK", "1 hari kerja"],
    ["Bicara dengan pihak yang terlibat", "Guru BK", "3 hari kerja"],
    ["Kabari orang tua", "Wali kelas", "3 hari kerja"],
    ["Cek ulang dua minggu", "Wali kelas", "2 minggu"],
  ],
  Rendah: [
    ["Bicara dengan anak-anak yang terlibat", "Wali kelas", "2 hari kerja"],
    ["Kesepakatan di kelas", "Wali kelas", "5 hari kerja"],
    ["Cek ulang dua minggu", "Wali kelas", "2 minggu"],
  ],
};

/** Kasus baru dari formulir lapor. `id` mis. "KS-017", `kini` = waktu laporan masuk. */
export function kasusDariLapor(lapor, id, kini) {
  const tingkat = tingkatDari(lapor.jawaban);
  const nama = lapor.nama.trim();
  return {
    id,
    judul: lapor.jenis + " · " + lapor.lokasi.toLowerCase(),
    kategori: lapor.jenis,
    anak: nama || "Belum diketahui",
    anakSingkat: nama
      ? nama
          .split(" ")
          .filter(Boolean)
          .map((w) => w.charAt(0) + ".")
          .join(" ")
      : "Belum diketahui",
    kelas: lapor.kelas,
    sumber: "Bu Laras (staf) · aplikasi sekolah",
    uraian: (lapor.cerita.trim() || "Pelapor belum menambahkan cerita.") + " Waktu: " + lapor.kapan.toLowerCase() + ".",
    tingkat,
    tahap: "analisis",
    milikSaya: true,
    masuk: kini,
    jawaban: lapor.jawaban.slice(),
    penangan: [["LA", "Bu Laras", "Koordinator BK · penerima"]],
    rencana: RENCANA_BARU[tingkat].map((p) => [...p, false]),
    riwayat: [
      [
        capWaktu(kini),
        "Laporan dibuat. Tingkat awal " + tingkat + " dari penilaian pelapor." + (tingkat === "Darurat" ? " Kepala Sekolah diberi tahu otomatis." : ""),
      ],
    ],
  };
}

// ---------- perpindahan tahap ----------
/**
 * Tombol utama laci detail. Mengembalikan `pesan` untuk pemberitahuan, plus `ubah` (fungsi
 * kasus lama -> perubahan) kalau kasusnya memang pindah tahap. Rencana tindak baru boleh masuk
 * pemantauan sesudah separuh langkahnya dijalankan. `jawaban` = jawaban triase yang sudah
 * dikoreksi (dipakai di tahap analisis), `hasil` = isi HASIL_AKHIR yang dipilih saat menutup.
 */
export function langkahBerikut(c, kini, jawaban, hasil) {
  const cap = capWaktu(kini);
  if (c.tahap === "analisis") {
    const tingkat = tingkatDari(jawaban);
    const penangan = rute(tingkat, jawaban, c.kelas);
    const nama = penangan.map((w) => w[1]).join(", ");
    return {
      ubah: (x) => ({
        tahap: "diteruskan",
        tingkat,
        jawaban: jawaban.slice(),
        penangan,
        riwayat: [[cap, "Bu Laras menetapkan tingkat " + tingkat + ". Diteruskan ke " + nama + "."], ...x.riwayat],
      }),
      pesan: c.id + " diteruskan ke " + nama + ". Respon pertama paling lambat " + jamMenit(ATURAN[tingkat].respon(c.masuk)) + ".",
    };
  }
  if (c.tahap === "diteruskan") {
    const tepat = kini <= ATURAN[c.tingkat].respon(c.masuk) ? ", tepat waktu." : ", terlambat.";
    return {
      ubah: (x) => ({
        tahap: "rencana",
        tRespon: kini,
        riwayat: [[cap, "Respon pertama tercatat" + tepat + " Anak sudah ditemui, pelapor dikabari."], ...x.riwayat],
      }),
      pesan:
        "Respon pertama " + c.id + " tercatat " + jamMenit(kini) + tepat +
        " Rencana tindak paling lambat " + waktuLengkap(ATURAN[c.tingkat].rencana(c.masuk)) + ".",
    };
  }
  if (c.tahap === "rencana") {
    const minimal = Math.ceil(c.rencana.length / 2);
    if (c.rencana.filter((p) => p[3]).length < minimal) return { pesan: "Jalankan minimal " + minimal + " langkah rencana tindak dulu" };
    const tinjau = labelHari(kini + ATURAN[c.tingkat].tinjau * MENIT_SEHARI);
    return {
      ubah: (x) => ({
        tahap: "pantau",
        tRencana: x.tRencana != null ? x.tRencana : kini,
        tinjauLabel: tinjau,
        riwayat: [[cap, "Masuk pemantauan. Tinjau ulang " + tinjau + "."], ...x.riwayat],
      }),
      pesan: c.id + " masuk pemantauan. Pengingat tinjau ulang " + tinjau + " dikirim ke penanggung jawab.",
    };
  }
  if (c.tahap === "pantau") {
    return {
      ubah: (x) => ({
        tahap: "selesai",
        selesaiLabel: labelHari(kini),
        riwayat: [[cap, "Kasus ditutup: " + hasil.ringkas + "."], ...x.riwayat],
      }),
      pesan: c.id + " ditutup. Pelapor menerima kabar bahwa kasus selesai.",
    };
  }
  return null;
}

// ---------- kasus contoh ----------
/*
 * Bentuk satu kasus:
 *   id, judul, kategori, anak, anakSingkat (dipakai di daftar untuk kasus Darurat), kelas, sumber,
 *   uraian, tingkat, tahap, milikSaya (tugas Bu Laras), terbatas (terlapor staf), eskalasi,
 *   masuk / tRespon / tRencana (menit, lihat atas) atau label tetap untuk kasus lama:
 *   masukLabel, responLabel, rencanaLabel, tinjauLabel, selesaiLabel,
 *   jawaban (enam jawaban triase), penangan [[inisial, nama, peran]],
 *   rencana [[langkah, oleh, batas, sudah]], riwayat [[waktu, catatan]] (terbaru di atas).
 */

// Kasus yang sudah ditutup bentuknya seragam, jadi dibuat dengan satu pembantu.
function kasusSelesai(id, judul, kategori, anak, kelas, tingkat, masukLabel, selesaiLabel, sumber) {
  return {
    id,
    judul,
    kategori,
    anak,
    anakSingkat: anak,
    kelas,
    tingkat,
    tahap: "selesai",
    milikSaya: false,
    masukLabel,
    selesaiLabel,
    responLabel: "Tepat waktu",
    rencanaLabel: "Tepat waktu",
    sumber,
    uraian: judul + ".",
    jawaban: [0, 0, 0, 0, 0, 0],
    penangan: [["LA", "Bu Laras", "Guru BK"]],
    rencana: [
      ["Langkah penanganan dijalankan", "Tim", masukLabel, true],
      ["Pemantauan selesai", "Wali kelas", selesaiLabel, true],
    ],
    riwayat: [
      [selesaiLabel, "Kasus ditutup: tertangani, anak merasa aman."],
      [masukLabel, "Laporan masuk dan diteruskan sesuai tingkat."],
    ],
  };
}

export const KASUS_AWAL = [
  {
    id: "KS-016",
    judul: "Orang dewasa memberi hadiah dan meminta anak merahasiakannya",
    kategori: "Pendekatan tidak wajar (dugaan)",
    anak: "Nayla Kusuma",
    anakSingkat: "N. K.",
    kelas: "3A",
    sumber: "Orang tua, tanpa nama · Lapor Aman",
    uraian:
      "Pelapor bercerita anaknya sering diberi hadiah dan pesan oleh guru les di luar sekolah, lalu diminta tidak bercerita kepada siapa pun. Anak tampak gelisah setiap jadwal les.",
    tingkat: "Darurat",
    tahap: "analisis",
    milikSaya: true,
    masuk: 3465,
    jawaban: [1, 2, 0, 2, 0, 1],
    penangan: [["LA", "Bu Laras", "Koordinator BK · penerima"]],
    rencana: [
      ["Pastikan anak aman hari ini dan tidak bertemu terlapor", "Bu Laras", "Hari ini", false],
      ["Hubungi orang tua dengan tenang, jangan menginterogasi anak", "Bu Laras", "Hari ini", false],
      ["Konsultasi dengan psikolog pendamping Fammi", "Psikolog Fammi", "24 jam", false],
      ["Rujuk ke UPTD PPA bila dugaan menguat", "Kepala Sekolah", "24 jam", false],
      ["Catat kronologi satu kali, tanpa wawancara berulang", "Bu Laras", "24 jam", false],
    ],
    riwayat: [
      ["Rab 09.46", "Pelapor menerima kode lacak dan perkiraan waktu respon."],
      ["Rab 09.45", "Sistem: tingkat awal Darurat dari jawaban pelapor. Kepala Sekolah diberi tahu otomatis."],
      ["Rab 09.45", "Laporan masuk lewat Lapor Aman, tanpa nama."],
    ],
  },
  {
    id: "KS-015",
    judul: "Didorong dan dipukul kakak kelas di dekat kantin",
    kategori: "Perundungan fisik",
    anak: "Raka Pratama",
    anakSingkat: "Raka Pratama",
    kelas: "2B",
    sumber: "Orang tua (Ibu Dewi) · Lapor Aman",
    uraian:
      "Raka pulang dengan lutut lecet dan bercerita didorong lalu dipukul dua kakak kelas saat istirahat. Menurut Raka ini bukan yang pertama.",
    tingkat: "Tinggi",
    tahap: "diteruskan",
    milikSaya: true,
    masuk: 3372,
    jawaban: [0, 0, 2, 2, 0, 0],
    penangan: [["RK", "Bu Rina", "Wali kelas 2B"], ["LA", "Bu Laras", "Guru BK"]],
    rencana: [
      ["Temui Raka, pastikan aman, catat kronologi", "Bu Rina", "Hari ini 12.12", false],
      ["Kabari Ibu Dewi langkah sekolah", "Bu Rina", "Hari ini", false],
      ["Panggil dan bina kakak kelas yang terlibat, kabari orang tuanya", "Bu Laras", "Jum 13 Nov", false],
      ["Guru piket berjaga di area kantin saat istirahat", "Pak Fajar", "Mulai Kam 12 Nov", false],
      ["Cek kondisi Raka tiap minggu selama 4 minggu", "Bu Rina", "Mulai 18 Nov", false],
    ],
    riwayat: [
      ["Rab 08.42", "Ibu Dewi menerima konfirmasi dan perkiraan waktu respon."],
      ["Rab 08.41", "Diteruskan ke Bu Rina dan Bu Laras. Kepala Sekolah diberi tahu."],
      ["Rab 08.40", "Bu Laras menetapkan tingkat Tinggi: kekerasan fisik, berulang."],
      ["Rab 08.12", "Laporan masuk lewat Lapor Aman."],
    ],
  },
  {
    id: "KS-014",
    judul: "Diejek soal fisik berulang oleh tiga teman",
    kategori: "Perundungan verbal",
    anak: "Nadia Safitri",
    anakSingkat: "Nadia Safitri",
    kelas: "4A",
    sumber: "Wali kelas 4A (Bu Fitri)",
    uraian:
      "Nadia menangis di kelas setelah dipanggil dengan julukan soal badannya. Tiga teman melakukannya sejak dua minggu terakhir.",
    tingkat: "Sedang",
    tahap: "rencana",
    milikSaya: true,
    masuk: 2240,
    tRespon: 2285,
    jawaban: [0, 0, 0, 2, 0, 0],
    penangan: [["LA", "Bu Laras", "Guru BK"], ["FT", "Bu Fitri", "Wali kelas 4A"]],
    rencana: [
      ["Sesi kelas: julukan soal fisik bukan candaan", "Bu Fitri", "Rab 11 Nov", true],
      ["Bicara dengan tiga teman dan orang tuanya", "Bu Laras", "Rab 11 Nov", true],
      ["Konseling Nadia dua kali", "Bu Laras", "Jum 13 Nov", false],
      ["Kabari orang tua Nadia tentang langkah sekolah", "Bu Fitri", "Kam 12 Nov", false],
      ["Cek ulang dua minggu", "Bu Fitri", "Rab 25 Nov", false],
    ],
    riwayat: [
      ["Rab 09.10", "Bu Laras berbicara dengan tiga anak dan menelepon orang tua mereka."],
      ["Sel 14.05", "Respon pertama: Bu Laras menemui Nadia."],
      ["Sel 13.25", "Tingkat Sedang, diteruskan ke Bu Laras."],
      ["Sel 13.20", "Dilaporkan Bu Fitri dari ruang wali kelas."],
    ],
  },
  {
    id: "KS-012",
    judul: "Tanda keamanan dari skrining: takut ke sekolah",
    kategori: "Tanda bahaya dari skrining",
    anak: "Bima Aditya",
    anakSingkat: "Bima Aditya",
    kelas: "1B",
    sumber: "Skrining orang tua · dibuat otomatis",
    uraian: "Orang tua menjawab Ya pada pernyataan tiba-tiba takut ke sekolah atau menolak bertemu orang tertentu.",
    tingkat: "Sedang",
    tahap: "rencana",
    milikSaya: true,
    masuk: 580,
    tRespon: 630,
    jawaban: [0, 0, 0, 0, 0, 1],
    penangan: [["LA", "Bu Laras", "Guru BK"]],
    rencana: [
      ["Telepon orang tua untuk menggali tanda", "Bu Laras", "Sen 9 Nov", true],
      ["Konseling Bima dengan media gambar", "Bu Laras", "Sel 10 Nov", true],
      ["Cari tahu siapa yang ditakuti Bima", "Bu Laras", "Rab 11 Nov", true],
      ["Putuskan: tutup, pantau, atau rujuk", "Bu Laras", "Kam 12 Nov", false],
    ],
    riwayat: [
      ["Rab 08.00", "Bima bercerita takut pada anak kelas 3 yang meminta uang jajannya."],
      ["Sen 10.30", "Respon pertama: Bu Laras menelepon orang tua."],
      ["Sen 09.40", "Kasus dibuat otomatis dari skrining orang tua."],
    ],
  },
  {
    id: "KS-010",
    judul: "Berkelahi dan memukul teman hingga memar",
    kategori: "Perundungan fisik",
    anak: "Dafa Ramadhan",
    anakSingkat: "Dafa Ramadhan",
    kelas: "4B",
    sumber: "Wali kelas 4B (Pak Arif)",
    uraian:
      "Dafa memukul teman sekelas saat bermain bola hingga lengan memar. Dafa juga tercatat perlu dukungan pada aspek perilaku.",
    tingkat: "Tinggi",
    tahap: "rencana",
    milikSaya: true,
    masuk: -5100,
    tRespon: -5030,
    jawaban: [0, 0, 2, 0, 0, 0],
    eskalasi: true,
    penangan: [["AR", "Pak Arif", "Wali kelas 4B"], ["LA", "Bu Laras", "Guru BK"], ["HW", "Bu Hartini", "Kepala Sekolah · eskalasi"]],
    rencana: [
      ["Pisahkan dan tenangkan kedua anak", "Pak Arif", "Kam 5 Nov", true],
      ["Periksa memar di UKS dan dokumentasikan", "Petugas UKS", "Kam 5 Nov", true],
      ["Pertemuan dengan kedua orang tua", "Bu Laras", "Sen 9 Nov", false],
      ["Kesepakatan perilaku dan konseling mengelola marah", "Bu Laras", "Sen 9 Nov", false],
      ["Pemantauan dua minggu di kelas", "Pak Arif", "Mulai 16 Nov", false],
    ],
    riwayat: [
      ["Sen 11.00", "Sistem: rencana tindak lewat batas, dieskalasi ke Kepala Sekolah."],
      ["Jum 15.20", "Bu Laras: orang tua Dafa belum bisa dihubungi."],
      ["Kam 12.10", "Respon pertama: Pak Arif memisahkan kedua anak, UKS memeriksa memar."],
      ["Kam 11.05", "Tingkat Tinggi, diteruskan ke Pak Arif dan Bu Laras."],
      ["Kam 11.00", "Dilaporkan Pak Arif."],
    ],
  },
  {
    id: "KS-011",
    judul: "Tidak diajak bermain dan dijauhi kelompoknya",
    kategori: "Dikucilkan",
    anak: "Salsa Nabila",
    anakSingkat: "Salsa Nabila",
    kelas: "3B",
    sumber: "Wali kelas 3B (Bu Maya)",
    uraian: "Salsa makan sendiri dan tidak diajak bermain oleh kelompoknya selama seminggu.",
    tingkat: "Rendah",
    tahap: "pantau",
    milikSaya: false,
    masukLabel: "Jum 6 Nov 10.15",
    responLabel: "Jum 6 Nov 11.30 · tepat waktu",
    rencanaLabel: "Sen 9 Nov · tepat waktu",
    tinjauLabel: "Jum 20 Nov",
    jawaban: [0, 0, 0, 0, 0, 0],
    penangan: [["MY", "Bu Maya", "Wali kelas 3B"]],
    rencana: [
      ["Kegiatan kelompok campuran di kelas", "Bu Maya", "Sen 9 Nov", true],
      ["Ngobrol dengan kelompok bermain Salsa", "Bu Maya", "Sen 9 Nov", true],
      ["Kabari orang tua Salsa", "Bu Maya", "Sel 10 Nov", true],
      ["Cek ulang: apakah Salsa punya teman bermain", "Bu Maya", "Jum 20 Nov", false],
    ],
    riwayat: [
      ["Sel 10 Nov", "Masuk pemantauan dua minggu."],
      ["Sen 9 Nov", "Rencana tindak siap."],
      ["Jum 6 Nov", "Dilaporkan Bu Maya, tingkat Rendah."],
    ],
  },
  {
    id: "KS-009",
    judul: "Tantrum berat dan memukul diri sendiri saat kecewa",
    kategori: "Emosi dan perilaku",
    anak: "Alya Putri",
    anakSingkat: "Alya Putri",
    kelas: "TK B2",
    sumber: "Wali kelas TK B2 (Bu Rahma)",
    uraian: "Alya beberapa kali memukul kepalanya sendiri saat kecewa. Orang tua menyampaikan hal serupa di rumah.",
    tingkat: "Tinggi",
    tahap: "pantau",
    milikSaya: true,
    masukLabel: "Rab 4 Nov 09.30",
    responLabel: "Rab 4 Nov 10.10 · tepat waktu",
    rencanaLabel: "Kam 5 Nov · tepat waktu",
    tinjauLabel: "Rab 18 Nov",
    jawaban: [0, 0, 0, 0, 0, 2],
    penangan: [["LA", "Bu Laras", "Guru BK"], ["PF", "Psikolog Fammi", "Pendamping"]],
    rencana: [
      ["Konsultasi psikolog Fammi bersama orang tua", "Psikolog Fammi", "Kam 5 Nov", true],
      ["Pojok tenang dan kartu perasaan di kelas", "Bu Rahma", "Jum 6 Nov", true],
      ["Catatan harian pemicu dan durasi tantrum", "Bu Rahma", "2 minggu", true],
      ["Evaluasi bersama psikolog", "Psikolog Fammi", "Rab 18 Nov", false],
    ],
    riwayat: [
      ["Sen 9 Nov", "Tantrum turun dari 4 menjadi 2 kali per minggu."],
      ["Kam 5 Nov", "Rencana tindak siap, didampingi psikolog Fammi."],
      ["Rab 4 Nov", "Dilaporkan Bu Rahma, tingkat Tinggi."],
    ],
  },
  {
    id: "KS-003",
    terbatas: true,
    judul: "Kasus akses terbatas",
    kategori: "Terlapor staf sekolah",
    anak: "Akses terbatas",
    anakSingkat: "Akses terbatas",
    kelas: "",
    tingkat: "Darurat",
    tahap: "pantau",
    milikSaya: false,
    masukLabel: "Rab 21 Okt",
    tinjauLabel: "Rab 18 Nov",
    jawaban: [0, 2, 0, 0, 2, 0],
    penangan: [["HW", "Bu Hartini", "Kepala Sekolah"], ["PF", "Pendamping Fammi", "Psikolog"]],
    rencana: [],
    riwayat: [["Rab 21 Okt", "Detail hanya untuk Kepala Sekolah dan pendamping Fammi."]],
  },
  kasusSelesai("KS-013", "Jatuh dari ayunan, lutut berdarah", "Cedera atau kecelakaan", "Kirana L.", "2A", "Rendah", "Sel 10 Nov", "Sel 10 Nov", "Guru piket"),
  kasusSelesai("KS-008", "Saling ejek dan dorong saat antre", "Konflik antarteman", "Raka P. dan 1 teman", "2B", "Rendah", "Jum 30 Okt", "Sel 3 Nov", "Wali kelas 2B"),
  kasusSelesai("KS-007", "Tanda dari skrining: diancam bila mengadu", "Tanda bahaya dari skrining", "Kevin A.", "TK A", "Sedang", "Kam 29 Okt", "Kam 5 Nov", "Skrining orang tua"),
  kasusSelesai("KS-006", "Uang jajan dipalak kakak kelas", "Perundungan fisik", "Rafi A.", "3A", "Sedang", "Rab 28 Okt", "Rab 4 Nov", "Wali kelas 3A"),
  kasusSelesai("KS-005", "Diejek cengeng saat bermain", "Perundungan verbal", "Tiara S.", "1A", "Rendah", "Sel 27 Okt", "Jum 30 Okt", "Anak · Pojok Cerita"),
  kasusSelesai("KS-004", "Berkelahi berebut bola", "Konflik antarteman", "2 anak", "4A", "Rendah", "Jum 23 Okt", "Sen 26 Okt", "Guru piket"),
  kasusSelesai("KS-002", "Murung dan menolak makan siang", "Emosi dan perilaku", "Dimas P.", "1A", "Rendah", "Sel 20 Okt", "Sel 27 Okt", "Wali kelas 1A"),
  kasusSelesai("KS-001", "Diejek soal pekerjaan orang tua", "Perundungan verbal", "3 anak", "2A", "Sedang", "Sen 19 Okt", "Jum 23 Okt", "Wali kelas 2A"),
];
