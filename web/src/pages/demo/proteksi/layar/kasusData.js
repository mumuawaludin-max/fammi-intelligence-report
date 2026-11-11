/**
 * Data contoh dan aturan layar Kasus & penugasan (prototipe Sekolah Proteksi). Layar ini menjalankan
 * alur kejadian dari bersama/alur.js: lapor -> triage -> penugasan -> penanganan -> pantau dan
 * tutup. Tahap satu kasus memakai id TAHAP_KASUS: triage (tingkat belum ditetapkan), tugas (tingkat
 * sudah ditetapkan, penanggung jawab baru ditunjuk atau belum, respon pertama belum), tangani
 * (respon pertama dan rencana tindak berjalan), pantau (dipantau 2 sampai 4 minggu), selesai.
 *
 * Semua nama, kelas, waktu, dan angka di sini data contoh untuk demonstrasi.
 *
 * Waktu disimpan sebagai menit sejak Senin 9 Nov 2026 pukul 00.00. Nilai negatif berarti minggu
 * sebelumnya atau Oktober. Jam prototipe mulai Rabu 11 Nov 10.30 dan maju beberapa menit setiap
 * ada tindakan, supaya cap waktu di riwayat kasus ikut bergerak.
 *
 * Berkas JS biasa tanpa JSX (impor berekstensi .js) supaya bisa diuji di node (Kasus.test.js).
 */
import { ALUR, TAHAP_KASUS } from "../bersama/alur.js";
import { CHECKLIST } from "../bersama/tindakLanjut.js";

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

/** Batas dibaca dari hari ini: "hari ini 12.12", "Jum 13.20" (minggu ini), atau "Rab 25 Nov". */
export function batasDari(t, kini) {
  const selisih = hariKe(t) - hariKe(kini);
  if (selisih === 0) return "hari ini " + jamMenit(t);
  if (selisih > 0 && selisih <= 5) return namaHari(hariKe(t)) + " " + jamMenit(t);
  return labelHari(t);
}

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

// ---------- tingkat ----------
/** Batas respon pertama dan rencana tindak per tingkat. `tinjau` = jarak tinjau ulang (hari). */
export const ATURAN = {
  Darurat: { respon: (t) => t + 60, rencana: (t) => t + MENIT_SEHARI, responL: "1 jam", rencanaL: "24 jam", tinjau: 7 },
  Tinggi: { respon: (t) => t + 240, rencana: (t) => tambahHariKerja(t, 2), responL: "4 jam", rencanaL: "2 hari kerja", tinjau: 7 },
  Sedang: { respon: (t) => tambahHariKerja(t, 1), rencana: (t) => tambahHariKerja(t, 3), responL: "1 hari kerja", rencanaL: "3 hari kerja", tinjau: 14 },
  Rendah: { respon: (t) => tambahHariKerja(t, 2), rencana: (t) => tambahHariKerja(t, 5), responL: "2 hari kerja", rencanaL: "5 hari kerja", tinjau: 14 },
};

/** Urutan pilihan "Tetapkan tingkat", dari yang paling ringan. */
export const TINGKAT = ["Rendah", "Sedang", "Tinggi", "Darurat"];

export const PIL_TINGKAT = { Darurat: "pill sm crit", Tinggi: "pill sm bad", Sedang: "pill sm warn", Rendah: "pill sm mid" };

/** Urutan tingkat untuk mengurutkan antrean (Darurat di atas). */
export const BOBOT_TINGKAT = { Darurat: 0, Tinggi: 1, Sedang: 2, Rendah: 3 };

// ---------- tahap ----------
const LANGKAH_KEJADIAN = ALUR.kejadian.langkah;
const labelLangkah = (id) => LANGKAH_KEJADIAN.find((l) => l.id === id)?.label || id;

/**
 * Tahap kasus. `no` = nomor langkah di bilah alur kejadian (Lapor = 1), `label` = label langkah
 * alur supaya tabel, bilah alur, dan laci memakai nama yang sama.
 */
export const TAHAP = Object.fromEntries(
  TAHAP_KASUS.map((id) => {
    const no = LANGKAH_KEJADIAN.findIndex((l) => l.id === id);
    return [id, { no: no > -1 ? no + 1 : null, label: id === "selesai" ? "Selesai" : labelLangkah(id) }];
  }),
);
export const URUTAN_TAHAP = TAHAP_KASUS;

/** Respon pertama belum tercatat (kasus baru, atau penanggung jawab belum menemui anak). */
export const responBelum = (c) => c.tRespon == null && !c.responLabel;

/** Pilihan hasil akhir saat menutup kasus. `ringkas` dipakai di riwayat. */
export const HASIL_AKHIR = [
  { id: "aman", label: "Tertangani, anak merasa aman", ringkas: "tertangani, anak merasa aman" },
  { id: "rujuk", label: "Dirujuk ke layanan luar, sekolah tetap memantau", ringkas: "dirujuk ke layanan luar, sekolah tetap memantau" },
  { id: "tidak", label: "Tidak terbukti, tetap dipantau wali kelas", ringkas: "tidak terbukti, tetap dipantau wali kelas" },
];

// ---------- orang yang bisa ditugaskan ----------
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
export const KELAS = Object.keys(WALI_KELAS);

/**
 * Orang tetap yang bisa ditugaskan. `sudut` = id sudut pandang prototipe yang menerima notifikasi
 * lonceng (layarProteksi.js); orang tanpa sudut pandang tetap menerima notifikasi aplikasi dan
 * WhatsApp di cerita demo, hanya tidak punya lonceng sendiri.
 */
const ORANG_TETAP = {
  laras: { inisial: "LA", nama: "Bu Laras", peran: "Guru BK", sudut: "bk" },
  hartini: { inisial: "HW", nama: "Bu Hartini", peran: "Kepala Sekolah", sudut: "kepsek" },
  joko: { inisial: "PJ", nama: "Pak Joko", peran: "Guru piket", sudut: null },
  fammi: { inisial: "PF", nama: "Pendamping Fammi", peran: "Psikolog", sudut: null },
};

/** Penugasan dibaca dari sudut pandang Bu Laras (Koordinator BK), pemilik layar ini. */
export const SAYA = "laras";

/** Id wali kelas: "wk:<kelas>", mis. "wk:2B" untuk Bu Rina. */
const idWali = (kelas) => (kelas && WALI_KELAS[kelas] ? "wk:" + kelas : null);

/** Data satu orang dari id-nya, atau null. */
export function orangKasus(id) {
  if (ORANG_TETAP[id]) return { id, ...ORANG_TETAP[id] };
  if (typeof id === "string" && id.startsWith("wk:")) {
    const kelas = id.slice(3);
    const w = WALI_KELAS[kelas];
    if (w) return { id, inisial: w[0], nama: w[1], peran: w[2], sudut: kelas === "2B" ? "walas" : null };
  }
  return null;
}

/** Pilihan formulir Tugaskan: wali kelas anak (bila bukan 2B) lalu lima orang tetap. */
export function kandidatTugas(kelas) {
  const dasar = ["wk:2B", "laras", "hartini", "joko", "fammi"];
  const wali = idWali(kelas);
  return wali && !dasar.includes(wali) ? [wali, ...dasar] : dasar;
}

/** Usulan penugasan menurut tingkat dan jawaban triage: { utama, pendukung }. */
export function usulanTugas(tingkat, q, kelas) {
  const wali = idWali(kelas);
  if (q[4] === 2) return { utama: "hartini", pendukung: ["fammi"] };
  if (tingkat === "Darurat") return { utama: "laras", pendukung: ["hartini", "fammi"] };
  if (tingkat === "Tinggi") return wali ? { utama: wali, pendukung: ["laras"] } : { utama: "laras", pendukung: [] };
  if (tingkat === "Sedang") return { utama: "laras", pendukung: [] };
  return wali ? { utama: wali, pendukung: [] } : { utama: "laras", pendukung: [] };
}

/** Aturan penugasan per tingkat, satu kalimat untuk laci. */
export const ATURAN_TEKS = {
  Darurat: "Aturan Darurat: Guru BK memimpin, Kepala Sekolah dan pendamping Fammi ikut menangani. Rujukan ke UPTD PPA atau layanan kesehatan bila perlu.",
  Tinggi: "Aturan Tinggi: wali kelas menangani bersama Guru BK; Kepala Sekolah diberi tahu.",
  Sedang: "Aturan Sedang: Guru BK menangani dan melibatkan wali kelas bila perlu.",
  Rendah: "Aturan Rendah: wali kelas menangani; Guru BK melihat ringkasannya.",
};
export const ATURAN_STAF = "Terlapor staf sekolah: hanya Kepala Sekolah dan pendamping Fammi yang menangani, akses dibatasi.";

/** Nama orang dalam satu penugasan, utama dulu: ["Bu Rina", "Bu Laras"]. */
export function namaTugas(tugas) {
  if (!tugas) return [];
  return [tugas.utama, ...tugas.pendukung].map(orangKasus).filter(Boolean).map((o) => o.nama);
}

/** Bu Laras ikut ditugaskan atau sedang memegang langkah koordinator (triage dan penugasan). */
export function tugasSaya(c) {
  if (c.tahap === "selesai" || c.terbatas) return false;
  if (c.tahap === "triage" || c.tahap === "tugas") return true;
  return Boolean(c.tugas && (c.tugas.utama === SAYA || c.tugas.pendukung.includes(SAYA)));
}

/** Butir checklist yang lahir dari penugasan kasus ini (bersama/tindakLanjut.js). */
export const checklistKasus = (id) => CHECKLIST.filter((b) => b.kasus === id);

// ---------- SLA ----------
/** Status SLA satu kasus untuk kolom "SLA berikutnya" dan angka di atas antrean. */
export function slaKasus(c, kini) {
  if (c.tahap === "selesai") return { nama: "Ditutup " + c.selesaiLabel, label: "Tepat waktu", pil: "pill sm ok", telat: false };
  if (c.tahap === "pantau") return { nama: "Tinjau ulang", label: c.tinjauLabel, pil: "pill sm mid", telat: false };
  const aturan = ATURAN[c.tingkat];
  const tahapRespon = c.tahap === "triage" || c.tahap === "tugas" || responBelum(c);
  const batas = tahapRespon ? aturan.respon(c.masuk) : aturan.rencana(c.masuk);
  const sisa = batas - kini;
  const nama = tahapRespon ? "Respon pertama" : "Rencana tindak";
  if (sisa < 0) return { nama, label: "Lewat " + durasi(-sisa), pil: "pill sm bad", telat: true };
  const hariIni = hariKe(batas) === hariKe(kini);
  return {
    nama,
    label: hariIni ? "Sisa " + durasi(sisa) : "Batas " + batasDari(batas, kini),
    pil: sisa / (batas - c.masuk) < 0.3 ? "pill sm warn" : "pill sm ok",
    telat: false,
  };
}

/**
 * Tiga baris SLA di blok Penugasan laci detail. `tingkatHitung` = tingkat yang sedang dipilih
 * (saat triage bisa berbeda dari tingkat tersimpan).
 */
export function barisSla(c, kini, tingkatHitung) {
  if (c.terbatas) return [];
  const tersimpan = ATURAN[c.tingkat];
  const hitung = ATURAN[tingkatHitung];
  // Target selalu menyebut tingkatnya, mis. "Target Tinggi: 4 jam".
  const tSimpan = "Target " + c.tingkat + ": ";
  const tHitung = "Target " + tingkatHitung + ": ";
  const baris = [];

  if (c.responLabel) {
    baris.push({ judul: "Respon pertama", target: tSimpan + tersimpan.responL, status: c.responLabel, pil: "pill sm ok" });
  } else if (c.tRespon != null) {
    const batas = tersimpan.respon(c.masuk);
    const tepat = c.tRespon <= batas;
    baris.push({
      judul: "Respon pertama",
      target: tSimpan + tersimpan.responL + " · batas " + waktuLengkap(batas),
      status: "Tercatat " + waktuSingkat(c.tRespon, kini) + (tepat ? " · tepat waktu" : " · terlambat"),
      pil: tepat ? "pill sm ok" : "pill sm bad",
    });
  } else {
    const batas = hitung.respon(c.masuk);
    const sisa = batas - kini;
    baris.push({
      judul: "Respon pertama",
      target: tHitung + hitung.responL + " · batas " + waktuLengkap(batas),
      status: sisa >= 0 ? "Sisa " + durasi(sisa) : "Lewat " + durasi(-sisa),
      pil: sisa < 0 ? "pill sm bad" : sisa / (batas - c.masuk) < 0.3 ? "pill sm warn" : "pill sm ok",
    });
  }

  if (c.rencanaLabel) {
    baris.push({ judul: "Rencana tindak", target: tSimpan + tersimpan.rencanaL, status: c.rencanaLabel, pil: "pill sm ok" });
  } else if (c.tRencana != null) {
    const batas = tersimpan.rencana(c.masuk);
    const tepat = c.tRencana <= batas;
    baris.push({
      judul: "Rencana tindak",
      target: tSimpan + tersimpan.rencanaL + " · batas " + waktuLengkap(batas),
      status: "Siap " + waktuSingkat(c.tRencana, kini) + (tepat ? " · tepat waktu" : " · terlambat"),
      pil: tepat ? "pill sm ok" : "pill sm bad",
    });
  } else {
    const batas = hitung.rencana(c.masuk);
    const sisa = batas - kini;
    const belum = responBelum(c);
    baris.push({
      judul: "Rencana tindak",
      target: tHitung + hitung.rencanaL + " · batas " + waktuLengkap(batas),
      status: sisa < 0 ? "Lewat " + durasi(-sisa) : belum ? "Setelah respon pertama" : "Sisa " + durasi(sisa),
      pil: sisa < 0 ? "pill sm bad" : belum ? "pill sm gray" : "pill sm ok",
    });
  }

  baris.push({
    judul: "Pemantauan",
    target: "Cek ulang tiap minggu, 2 sampai 4 minggu",
    status: c.tahap === "pantau" ? "Tinjau " + c.tinjauLabel : c.tahap === "selesai" ? "Ditutup " + c.selesaiLabel : "Belum dimulai",
    pil: c.tahap === "pantau" ? "pill sm mid" : c.tahap === "selesai" ? "pill sm ok" : "pill sm gray",
  });
  return baris;
}

// ---------- triage: enam pertanyaan penilaian awal ----------
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

/** Usulan tingkat dari enam jawaban penilaian awal. */
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
  return teks.trim() || "Tidak ada tanda bahaya.";
}

// ---------- laci Aturan SLA ----------
/** Baris tabel aturan. Batas respon dan rencana tindak dibaca dari ATURAN. */
export const ATURAN_SLA = [
  { tingkat: "Darurat", contoh: "Anak dalam bahaya, dugaan kekerasan seksual atau pendekatan tidak wajar, terlapor staf", ke: "Guru BK (utama), Kepala Sekolah, pendamping Fammi" },
  { tingkat: "Tinggi", contoh: "Kekerasan fisik, perundungan berulang, anak sangat tertekan", ke: "Wali kelas (utama) dan Guru BK; Kepala Sekolah diberi tahu" },
  { tingkat: "Sedang", contoh: "Ejekan, pengucilan, tanda bahaya dari skrining, jawaban tidak yakin", ke: "Guru BK" },
  { tingkat: "Rendah", contoh: "Konflik ringan, kekhawatiran umum", ke: "Wali kelas" },
];

export const CATATAN_ATURAN = [
  "Alur: laporan masuk, Koordinator BK menetapkan tingkat (triage), menugaskan penanggung jawab, penanggung jawab merespon dan menjalankan rencana tindak, lalu kasus dipantau sampai ditutup.",
  "Jam SLA berjalan sejak laporan masuk. Lewat batas, kasus otomatis naik satu tingkat penanggung jawab: wali kelas, lalu Guru BK, lalu Kepala Sekolah.",
  "Terlapor guru atau staf: hanya Kepala Sekolah dan pendamping Fammi yang bisa membuka detail. Staf terlapor tidak melihat kasusnya.",
  "Pemantauan setelah rencana tindak: tiap minggu selama 2 sampai 4 minggu. Kasus ditutup dengan catatan hasil.",
  "Pelapor, termasuk orang tua dan anak, melihat tahap dan perkiraan waktu, bukan catatan internal. Hari kerja dihitung Senin sampai Jumat.",
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
    ["Pastikan anak aman dan didampingi orang dewasa tepercaya", "Guru BK", "Hari ini"],
    ["Kabari orang tua dengan tenang", "Guru BK", "Hari ini"],
    ["Konsultasi pendamping Fammi", "Pendamping Fammi", "24 jam"],
    ["Rujuk ke layanan luar bila perlu", "Kepala Sekolah", "24 jam"],
    ["Catat kronologi satu kali", "Guru BK", "24 jam"],
  ],
  Tinggi: [
    ["Kabari orang tua", "Wali kelas", "Hari ini"],
    ["Bina pihak yang terlibat dan kabari orang tuanya", "Guru BK", "2 hari kerja"],
    ["Atur pengawasan di lokasi kejadian", "Guru piket", "2 hari kerja"],
    ["Cek kondisi anak tiap minggu", "Wali kelas", "4 minggu"],
  ],
  Sedang: [
    ["Bicara dengan pihak yang terlibat", "Guru BK", "3 hari kerja"],
    ["Kabari orang tua", "Wali kelas", "3 hari kerja"],
    ["Cek ulang dua minggu", "Wali kelas", "2 minggu"],
  ],
  Rendah: [
    ["Kesepakatan di kelas", "Wali kelas", "5 hari kerja"],
    ["Cek ulang dua minggu", "Wali kelas", "2 minggu"],
  ],
};

const rencanaDari = (tingkat) => RENCANA_BARU[tingkat].map((p) => [...p, false]);

/** Kasus baru dari formulir lapor: masuk tahap triage. `id` mis. "KS-017", `kini` = waktu masuk. */
export function kasusDariLapor(lapor, id, kini, sumber = "Bu Laras (staf) · aplikasi sekolah") {
  const tingkat = tingkatDari(lapor.jawaban);
  const nama = lapor.nama.trim();
  const cap = capWaktu(kini);
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
    sumber,
    uraian: (lapor.cerita.trim() || "Pelapor belum menambahkan cerita.") + " Waktu: " + lapor.kapan.toLowerCase() + ".",
    tingkat,
    tahap: "triage",
    masuk: kini,
    jawaban: lapor.jawaban.slice(),
    tugas: null,
    waktu: { lapor: cap },
    rencanaBawaan: true,
    rencana: rencanaDari(tingkat),
    riwayat: [
      [
        cap,
        "Laporan dibuat. Usulan tingkat " + tingkat + " dari penilaian awal pelapor." + (tingkat === "Darurat" ? " Kepala Sekolah diberi tahu otomatis." : ""),
      ],
    ],
  };
}

// ---------- perpindahan tahap ----------
/*
 * Tiap fungsi di bawah mengembalikan { ubah, pesan } dan bila perlu `notifikasi` (isi beriTahu)
 * serta `centang` (id butir checklist yang ikut selesai). `ubah` = fungsi kasus terbaru ->
 * perubahan, dipanggil layar lewat setDaftar.
 */

/** Triage: tetapkan tingkat, kasus pindah ke penugasan. */
export function tetapkanTingkat(c, kini, tingkat, jawaban) {
  const cap = capWaktu(kini);
  const batas = batasDari(ATURAN[tingkat].respon(c.masuk), kini);
  // Rencana bawaan laporan baru ikut tingkat yang ditetapkan, selama belum ada langkah yang dicentang.
  const rencanaUlang = c.rencanaBawaan && !c.rencana.some((p) => p[3]) && tingkat !== c.tingkat;
  return {
    ubah: (x) => ({
      tahap: "tugas",
      tingkat,
      jawaban: jawaban.slice(),
      ...(rencanaUlang ? { rencana: rencanaDari(tingkat) } : {}),
      waktu: { ...x.waktu, triage: cap },
      riwayat: [[cap, "Bu Laras menetapkan tingkat " + tingkat + ". Respon pertama paling lambat " + batas + "."], ...x.riwayat],
    }),
    pesan: "Tingkat " + c.id + " ditetapkan " + tingkat + ". Berikutnya: tugaskan penanggung jawab.",
  };
}

/** Penugasan: tetapkan penanggung jawab utama dan pendukung, kasus pindah ke penanganan. */
export function tugaskan(c, kini, pilihan) {
  const cap = capWaktu(kini);
  const utama = orangKasus(pilihan.utama);
  const pendukung = pilihan.pendukung.map(orangKasus).filter(Boolean);
  const batas = batasDari(ATURAN[c.tingkat].respon(c.masuk), kini);
  const namaPendukung = pendukung.map((o) => o.nama).join(", ");
  const sudut = [...new Set([utama, ...pendukung].map((o) => o.sudut).filter(Boolean))];
  return {
    ubah: (x) => ({
      tahap: "tangani",
      tugas: { utama: utama.id, pendukung: pendukung.map((o) => o.id), waktu: cap, tetap: true },
      waktu: { ...x.waktu, tugas: cap },
      riwayat: [
        [
          cap,
          "Bu Laras menugaskan " + utama.nama + " sebagai penanggung jawab utama" + (namaPendukung ? ", didukung " + namaPendukung : "") +
            ". Respon pertama paling lambat " + batas + ".",
        ],
        ...x.riwayat,
      ],
    }),
    pesan:
      c.id + " ditugaskan ke " + utama.nama + (namaPendukung ? " (utama), " + namaPendukung : "") +
      ". Notifikasi aplikasi dan WhatsApp terkirim.",
    notifikasi: sudut.length
      ? {
          peran: sudut,
          ikon: "tugaskan",
          nada: "red",
          judul: "Anda ditugaskan di " + c.id,
          isi: "Utama: " + utama.nama + (namaPendukung ? ". Pendukung: " + namaPendukung : "") + ". Respon pertama paling lambat " + batas + ".",
          tujuan: { layar: "kasus", aksi: { jenis: "kasus", id: c.id } },
        }
      : null,
  };
}

/** Penanganan, langkah pertama: respon pertama tercatat. Butir checklist kasus ini ikut selesai. */
export function catatRespon(c, kini) {
  const cap = capWaktu(kini);
  const tepat = kini <= ATURAN[c.tingkat].respon(c.masuk);
  const utama = orangKasus(c.tugas?.utama);
  return {
    ubah: (x) => ({
      tRespon: kini,
      riwayat: [
        [cap, "Respon pertama tercatat" + (tepat ? ", tepat waktu." : ", terlambat.") + " " + (utama ? utama.nama : "Penanggung jawab") + " sudah menemui anak, pelapor dikabari."],
        ...x.riwayat,
      ],
    }),
    pesan:
      "Respon pertama " + c.id + " tercatat " + jamMenit(kini) + (tepat ? ", tepat waktu." : ", terlambat.") +
      " Rencana tindak paling lambat " + waktuLengkap(ATURAN[c.tingkat].rencana(c.masuk)) + ".",
    centang: checklistKasus(c.id).map((b) => b.id),
  };
}

/** Penanganan selesai: masuk pemantauan sesudah separuh langkah rencana tindak berjalan. */
export function kePantau(c, kini) {
  const minimal = Math.ceil(c.rencana.length / 2);
  if (c.rencana.filter((p) => p[3]).length < minimal) return { pesan: "Jalankan minimal " + minimal + " langkah rencana tindak dulu" };
  const cap = capWaktu(kini);
  const tinjau = labelHari(kini + ATURAN[c.tingkat].tinjau * MENIT_SEHARI);
  return {
    ubah: (x) => ({
      tahap: "pantau",
      tRencana: x.tRencana != null ? x.tRencana : kini,
      tinjauLabel: tinjau,
      waktu: { ...x.waktu, tangani: cap },
      riwayat: [[cap, "Masuk pemantauan. Tinjau ulang " + tinjau + "."], ...x.riwayat],
    }),
    pesan: c.id + " masuk pemantauan. Pengingat tinjau ulang " + tinjau + " dikirim ke penanggung jawab.",
  };
}

/** Pantau dan tutup: kasus selesai dengan catatan hasil. `hasil` = isi HASIL_AKHIR. */
export function tutupKasus(c, kini, hasil) {
  const cap = capWaktu(kini);
  return {
    ubah: (x) => ({
      tahap: "selesai",
      selesaiLabel: labelHari(kini),
      waktu: { ...x.waktu, pantau: cap },
      riwayat: [[cap, "Kasus ditutup: " + hasil.ringkas + "."], ...x.riwayat],
    }),
    pesan: c.id + " ditutup. Pelapor menerima kabar bahwa kasus selesai.",
  };
}

/** Tombol utama dan catatan kaki laci detail menurut tahap. */
export function aksiTahap(c) {
  if (c.tahap === "triage") return { label: "Tetapkan tingkat", catatan: "Tingkat menentukan batas respon pertama dan usulan penanggung jawab." };
  if (c.tahap === "tugas") return { label: "Tugaskan", catatan: "Penanggung jawab menerima notifikasi aplikasi dan WhatsApp." };
  if (c.tahap === "tangani" && responBelum(c)) return { label: "Catat respon pertama", catatan: "Respon pertama: anak sudah ditemui dan pelapor dikabari." };
  if (c.tahap === "tangani") return { label: "Pindah ke pemantauan", catatan: "Pindahkan setelah separuh langkah rencana tindak berjalan." };
  if (c.tahap === "pantau") return { label: "Tutup kasus", catatan: "Pilih hasil akhir di atas sebelum menutup." };
  return { label: "", catatan: "Kasus selesai. Riwayat tetap tersimpan untuk laporan pimpinan." };
}

// ---------- kasus contoh ----------
/*
 * Bentuk satu kasus:
 *   id, judul, kategori, anak, anakSingkat (dipakai di daftar untuk kasus Darurat), kelas, sumber,
 *   uraian, dariSkrining (lahir dari tanda bahaya di skrining HEART), tingkat, tahap (TAHAP_KASUS),
 *   terbatas (terlapor staf), eskalasi,
 *   masuk / tRespon / tRencana (menit, lihat atas) atau label tetap untuk kasus lama:
 *   masukLabel, responLabel, rencanaLabel, tinjauLabel, selesaiLabel,
 *   jawaban (enam jawaban penilaian awal),
 *   tugas { utama, pendukung: [id], waktu, tetap } atau null (id orang lihat orangKasus; tetap =
 *   sudah dikonfirmasi Koordinator BK, false = ditunjuk otomatis menurut aturan tingkat),
 *   waktu { lapor, triage, tugas, tangani, pantau } = kapan tiap langkah alur selesai,
 *   rencana [[langkah, oleh, batas, sudah]], riwayat [[waktu, catatan]] (terbaru di atas).
 */

// Kasus yang sudah ditutup bentuknya seragam, jadi dibuat dengan satu pembantu.
function kasusSelesai(id, judul, kategori, anak, kelas, tingkat, masukLabel, selesaiLabel, sumber, dariSkrining = false) {
  const utama = tingkat === "Rendah" && idWali(kelas) ? idWali(kelas) : SAYA;
  return {
    id,
    judul,
    kategori,
    dariSkrining,
    anak,
    anakSingkat: anak,
    kelas,
    tingkat,
    tahap: "selesai",
    masukLabel,
    selesaiLabel,
    responLabel: "Tepat waktu",
    rencanaLabel: "Tepat waktu",
    sumber,
    uraian: judul + ".",
    jawaban: [0, 0, 0, 0, 0, 0],
    tugas: { utama, pendukung: [], waktu: masukLabel, tetap: true },
    waktu: { lapor: masukLabel, triage: masukLabel, tugas: masukLabel, tangani: masukLabel, pantau: selesaiLabel },
    rencana: [
      ["Langkah penanganan dijalankan", orangKasus(utama).nama, masukLabel, true],
      ["Pemantauan selesai", "Wali kelas", selesaiLabel, true],
    ],
    riwayat: [
      [selesaiLabel, "Kasus ditutup: tertangani, anak merasa aman."],
      [masukLabel, "Laporan masuk, tingkat ditetapkan, dan ditugaskan ke " + orangKasus(utama).nama + "."],
    ],
  };
}

export const KASUS_AWAL = [
  {
    id: "KS-016",
    judul: "Hadiah dan pesan rahasia dari guru les",
    kategori: "Pendekatan tidak wajar (dugaan)",
    anak: "Nayla Kusuma",
    anakSingkat: "N. K.",
    kelas: "3A",
    sumber: "Orang tua, tanpa nama · Lapor Aman",
    uraian:
      "Pelapor bercerita anaknya sering diberi hadiah dan pesan oleh guru les di luar sekolah, lalu diminta tidak bercerita kepada siapa pun. Anak tampak gelisah setiap jadwal les.",
    tingkat: "Darurat",
    tahap: "triage",
    masuk: 3465,
    jawaban: [1, 2, 0, 2, 0, 1],
    tugas: null,
    waktu: { lapor: "Rab 09.45" },
    rencana: [
      ["Pastikan anak aman hari ini dan tidak bertemu terlapor", "Bu Laras", "Hari ini", false],
      ["Hubungi orang tua dengan tenang, jangan menginterogasi anak", "Bu Laras", "Hari ini", false],
      ["Konsultasi dengan psikolog pendamping Fammi", "Pendamping Fammi", "24 jam", false],
      ["Rujuk ke UPTD PPA bila dugaan menguat", "Bu Hartini", "24 jam", false],
      ["Catat kronologi satu kali, tanpa wawancara berulang", "Bu Laras", "24 jam", false],
    ],
    riwayat: [
      ["Rab 09.46", "Pelapor menerima kode lacak dan perkiraan waktu respon."],
      ["Rab 09.45", "Sistem: usulan tingkat Darurat dari jawaban pelapor. Kepala Sekolah diberi tahu otomatis."],
      ["Rab 09.45", "Laporan masuk lewat Lapor Aman, tanpa nama."],
    ],
  },
  {
    id: "KS-015",
    judul: "Dipukul kakak kelas di dekat kantin",
    kategori: "Perundungan fisik",
    anak: "Raka Pratama",
    anakSingkat: "Raka Pratama",
    kelas: "2B",
    sumber: "Orang tua (Ibu Dewi) · Lapor Aman",
    uraian:
      "Raka pulang dengan lutut lecet dan bercerita didorong lalu dipukul dua kakak kelas saat istirahat. Menurut Raka ini bukan yang pertama. Di skrining HEART, Relasi Pertemanan Raka berstatus Waspada.",
    tingkat: "Tinggi",
    tahap: "tugas",
    masuk: 3372,
    jawaban: [0, 0, 2, 2, 0, 0],
    // Ditunjuk otomatis menurut aturan Tinggi (notifikasi Bu Rina 08.41, butir checklist
    // "ks015-respon"); Bu Laras belum mengonfirmasi penugasannya.
    tugas: { utama: "wk:2B", pendukung: ["laras"], waktu: "Rab 08.41", tetap: false },
    waktu: { lapor: "Rab 08.12", triage: "Rab 08.40" },
    rencana: [
      ["Kabari Ibu Dewi langkah sekolah", "Bu Rina", "Hari ini", false],
      ["Panggil dan bina kakak kelas yang terlibat, kabari orang tuanya", "Bu Laras", "Jum 13 Nov", false],
      ["Berjaga di area kantin saat istirahat panjang", "Pak Joko", "Mulai Kam 12 Nov", false],
      ["Cek kondisi Raka tiap minggu selama 4 minggu", "Bu Rina", "Mulai 18 Nov", false],
    ],
    riwayat: [
      ["Rab 08.42", "Ibu Dewi menerima konfirmasi dan perkiraan waktu respon."],
      ["Rab 08.41", "Sistem menunjuk Bu Rina dan Bu Laras menurut aturan Tinggi dan mengirim notifikasi. Kepala Sekolah diberi tahu."],
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
    tahap: "tangani",
    masuk: 2240,
    tRespon: 2285,
    jawaban: [0, 0, 0, 2, 0, 0],
    tugas: { utama: "laras", pendukung: ["wk:4A"], waktu: "Sel 13.25", tetap: true },
    waktu: { lapor: "Sel 13.20", triage: "Sel 13.25", tugas: "Sel 13.25" },
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
      ["Sel 13.25", "Tingkat Sedang. Ditugaskan ke Bu Laras, didukung Bu Fitri."],
      ["Sel 13.20", "Dilaporkan Bu Fitri dari ruang wali kelas."],
    ],
  },
  {
    id: "KS-012",
    judul: "Tiba-tiba takut ke sekolah",
    kategori: "Tanda bahaya",
    dariSkrining: true,
    anak: "Bima Aditya",
    anakSingkat: "Bima Aditya",
    kelas: "1B",
    sumber: "Skrining HEART orang tua · dibuat otomatis",
    uraian:
      "Saat mengisi skrining HEART, orang tua menjawab Ya pada pertanyaan keamanan: Bima tiba-tiba takut ke sekolah dan menolak bertemu orang tertentu.",
    tingkat: "Sedang",
    tahap: "tangani",
    masuk: 580,
    tRespon: 630,
    jawaban: [0, 0, 0, 0, 0, 1],
    tugas: { utama: "laras", pendukung: [], waktu: "Sen 09.40", tetap: true },
    waktu: { lapor: "Sen 09.40", triage: "Sen 09.40", tugas: "Sen 09.40" },
    rencana: [
      ["Telepon orang tua untuk menggali tanda", "Bu Laras", "Sen 9 Nov", true],
      ["Konseling Bima dengan media gambar", "Bu Laras", "Sel 10 Nov", true],
      ["Cari tahu siapa yang ditakuti Bima", "Bu Laras", "Rab 11 Nov", true],
      ["Putuskan: tutup, pantau, atau rujuk", "Bu Laras", "Kam 12 Nov", false],
    ],
    riwayat: [
      ["Rab 08.00", "Bima bercerita takut pada anak kelas 3 yang meminta uang jajannya."],
      ["Sen 10.30", "Respon pertama: Bu Laras menelepon orang tua."],
      ["Sen 09.40", "Kasus dibuat otomatis dari tanda bahaya di skrining HEART. Tingkat Sedang menurut aturan, ditugaskan ke Bu Laras."],
    ],
  },
  {
    id: "KS-010",
    judul: "Memukul teman hingga memar",
    kategori: "Perundungan fisik",
    anak: "Dafa Ramadhan",
    anakSingkat: "Dafa Ramadhan",
    kelas: "4B",
    sumber: "Wali kelas 4B (Pak Arif)",
    uraian:
      "Dafa memukul teman sekelas saat bermain bola hingga lengan memar. Di skrining HEART, aspek Agresi Dafa berstatus Waspada.",
    tingkat: "Tinggi",
    tahap: "tangani",
    masuk: -5100,
    tRespon: -5030,
    jawaban: [0, 0, 2, 0, 0, 0],
    eskalasi: true,
    tugas: { utama: "wk:4B", pendukung: ["laras", "hartini"], waktu: "Kam 5 Nov", tetap: true },
    waktu: { lapor: "Kam 5 Nov", triage: "Kam 5 Nov", tugas: "Kam 5 Nov" },
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
      ["Kam 11.05", "Tingkat Tinggi. Ditugaskan ke Pak Arif, didukung Bu Laras."],
      ["Kam 11.00", "Dilaporkan Pak Arif."],
    ],
  },
  {
    id: "KS-011",
    judul: "Dijauhi kelompok bermainnya",
    kategori: "Dikucilkan",
    anak: "Salsa Nabila",
    anakSingkat: "Salsa Nabila",
    kelas: "3B",
    sumber: "Wali kelas 3B (Bu Maya)",
    uraian: "Salsa makan sendiri dan tidak diajak bermain oleh kelompoknya selama seminggu.",
    tingkat: "Rendah",
    tahap: "pantau",
    masukLabel: "Jum 6 Nov 10.15",
    responLabel: "Jum 6 Nov 11.30 · tepat waktu",
    rencanaLabel: "Sen 9 Nov · tepat waktu",
    tinjauLabel: "Jum 20 Nov",
    jawaban: [0, 0, 0, 0, 0, 0],
    tugas: { utama: "wk:3B", pendukung: [], waktu: "Jum 6 Nov", tetap: true },
    waktu: { lapor: "Jum 6 Nov", triage: "Jum 6 Nov", tugas: "Jum 6 Nov", tangani: "Sel 10 Nov" },
    rencana: [
      ["Kegiatan kelompok campuran di kelas", "Bu Maya", "Sen 9 Nov", true],
      ["Ngobrol dengan kelompok bermain Salsa", "Bu Maya", "Sen 9 Nov", true],
      ["Kabari orang tua Salsa", "Bu Maya", "Sel 10 Nov", true],
      ["Cek ulang: apakah Salsa punya teman bermain", "Bu Maya", "Jum 20 Nov", false],
    ],
    riwayat: [
      ["Sel 10 Nov", "Masuk pemantauan dua minggu."],
      ["Sen 9 Nov", "Rencana tindak siap."],
      ["Jum 6 Nov", "Dilaporkan Bu Maya, tingkat Rendah. Ditugaskan ke Bu Maya."],
    ],
  },
  {
    id: "KS-009",
    judul: "Tantrum berat dan memukul diri sendiri",
    kategori: "Emosi atau perilaku anak",
    anak: "Alya Putri",
    anakSingkat: "Alya Putri",
    kelas: "TK B2",
    sumber: "Wali kelas TK B2 (Bu Rahma)",
    uraian: "Alya beberapa kali memukul kepalanya sendiri saat kecewa. Orang tua menyampaikan hal serupa di rumah.",
    tingkat: "Tinggi",
    tahap: "pantau",
    masukLabel: "Rab 4 Nov 09.30",
    responLabel: "Rab 4 Nov 10.10 · tepat waktu",
    rencanaLabel: "Kam 5 Nov · tepat waktu",
    tinjauLabel: "Rab 18 Nov",
    jawaban: [0, 0, 0, 0, 0, 2],
    tugas: { utama: "laras", pendukung: ["fammi", "wk:TK B2"], waktu: "Rab 4 Nov", tetap: true },
    waktu: { lapor: "Rab 4 Nov", triage: "Rab 4 Nov", tugas: "Rab 4 Nov", tangani: "Jum 6 Nov" },
    rencana: [
      ["Konsultasi pendamping Fammi bersama orang tua", "Pendamping Fammi", "Kam 5 Nov", true],
      ["Pojok tenang dan kartu perasaan di kelas", "Bu Rahma", "Jum 6 Nov", true],
      ["Catatan harian pemicu dan durasi tantrum", "Bu Rahma", "2 minggu", true],
      ["Evaluasi bersama pendamping Fammi", "Pendamping Fammi", "Rab 18 Nov", false],
    ],
    riwayat: [
      ["Sen 9 Nov", "Tantrum turun dari 4 menjadi 2 kali per minggu."],
      ["Jum 6 Nov", "Masuk pemantauan dua minggu."],
      ["Kam 5 Nov", "Rencana tindak siap, didampingi pendamping Fammi."],
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
    masukLabel: "Rab 21 Okt",
    tinjauLabel: "Rab 18 Nov",
    jawaban: [0, 2, 0, 0, 2, 0],
    tugas: { utama: "hartini", pendukung: ["fammi"], waktu: "Rab 21 Okt", tetap: true },
    waktu: { lapor: "Rab 21 Okt", triage: "Rab 21 Okt", tugas: "Rab 21 Okt", tangani: "Jum 30 Okt" },
    rencana: [],
    riwayat: [["Rab 21 Okt", "Detail hanya untuk Kepala Sekolah dan pendamping Fammi."]],
  },
  kasusSelesai("KS-013", "Jatuh dari ayunan, lutut berdarah", "Cedera atau kecelakaan", "Kirana L.", "2A", "Rendah", "Sel 10 Nov", "Sel 10 Nov", "Guru piket (Pak Joko)"),
  kasusSelesai("KS-008", "Saling ejek dan dorong saat antre", "Konflik antarteman", "Raka P. dan 1 teman", "2B", "Rendah", "Jum 30 Okt", "Sel 3 Nov", "Wali kelas 2B"),
  kasusSelesai("KS-007", "Diancam teman bila mengadu", "Tanda bahaya", "Kevin A.", "TK A", "Sedang", "Kam 29 Okt", "Kam 5 Nov", "Skrining HEART orang tua", true),
  kasusSelesai("KS-006", "Uang jajan dipalak kakak kelas", "Perundungan fisik", "Rafi A.", "3A", "Sedang", "Rab 28 Okt", "Rab 4 Nov", "Wali kelas 3A"),
  kasusSelesai("KS-005", "Diejek cengeng saat bermain", "Perundungan verbal", "Tiara S.", "1A", "Rendah", "Sel 27 Okt", "Jum 30 Okt", "Anak · Pojok Cerita"),
  kasusSelesai("KS-004", "Berkelahi berebut bola", "Konflik antarteman", "2 anak", "4A", "Rendah", "Jum 23 Okt", "Sen 26 Okt", "Guru piket"),
  kasusSelesai("KS-002", "Murung dan menolak makan siang", "Emosi atau perilaku anak", "Dimas P.", "1A", "Rendah", "Sel 20 Okt", "Sel 27 Okt", "Wali kelas 1A"),
  kasusSelesai("KS-001", "Diejek soal pekerjaan orang tua", "Perundungan verbal", "3 anak", "2A", "Sedang", "Sen 19 Okt", "Jum 23 Okt", "Wali kelas 2A"),
];

/**
 * Kasus saat layar dibuka. Respon pertama KS-015 adalah butir checklist Bu Rina ("ks015-respon",
 * bersama/tindakLanjut.js). Bila butir itu sudah dicentang di Ruang wali kelas selama demo, kasusnya
 * mulai dari penanganan dengan respon pertama tercatat, supaya kedua layar bercerita sama.
 */
export function kasusAwal(centang = {}) {
  return KASUS_AWAL.map((c) => {
    const butir = checklistKasus(c.id);
    if (c.tahap !== "tugas" || !butir.length || !butir.every((b) => centang[b.id])) return c;
    const pemilik = orangKasus(c.tugas?.utama);
    return {
      ...c,
      tahap: "tangani",
      tRespon: JAM_AWAL,
      tugas: { ...c.tugas, tetap: true },
      waktu: { ...c.waktu, tugas: c.tugas.waktu },
      riwayat: [[capWaktu(JAM_AWAL), (pemilik ? pemilik.nama : "Penanggung jawab") + " mencentang respon pertama di checklist. Kasus masuk penanganan."], ...c.riwayat],
    };
  });
}
