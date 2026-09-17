// Pembuat data CONTOH modul Screening Awal Wellbeing.
//
// Seluruh nama, unit, jawaban, dan angka di sini buatan. Generator ini meniru bentuk berkas
// olahan (sheet 03 sampai 09) lalu melewatkannya ke pembaca yang sama dengan berkas asli
// (bacaDatasetSw), jadi bentuk keluarannya dijamin sama. Perhitungan skor di bawah hanya untuk
// membuat angka contoh yang masuk akal, bukan rumus resmi instrumen.
//
// Pemakaian (dari folder web/): npm run sw:contoh
// Hasil: src/pages/sw/data/sw.contoh.json (boleh di-commit, tidak memuat data orang sungguhan).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bacaDatasetSw } from "../../src/pages/sw/lib/swPembaca.js";
import { INDIKATOR, KEBUTUHAN } from "../../src/pages/sw/lib/swMeta.js";

// ── Acak berbenih ───────────────────────────────────────────────────────────────────────────
let benih = 20260917;
function acak() {
  benih = (benih * 1664525 + 1013904223) % 4294967296;
  return benih / 4294967296;
}
const pilih = (arr) => arr[Math.floor(acak() * arr.length)];
const antara = (a, b) => a + acak() * (b - a);
const jepit = (v, a, b) => Math.max(a, Math.min(b, v));
const r1 = (v) => Math.round(v * 10) / 10;
const langkah = (v) => jepit(Math.round(v / 6.25) * 6.25, 0, 100);

// ── Kerangka lembaga contoh ─────────────────────────────────────────────────────────────────
const UNIT = [
  { nama: "SD Contoh Melati", n: 34, kelompok: "sekolah", jenjang: "SD", dasar: 70, formB: true },
  { nama: "SMP Contoh Melati", n: 24, kelompok: "sekolah", jenjang: "SMP", dasar: 66, formB: true },
  { nama: "SMA Contoh Melati", n: 20, kelompok: "sekolah", jenjang: "SMA", dasar: 74, formB: true },
  { nama: "TK Contoh Kenanga", n: 12, kelompok: "sekolah", jenjang: "TK", dasar: 62, formB: true },
  { nama: "Asrama Contoh Kenanga", n: 16, kelompok: "sekolah", jenjang: "Boarding", dasar: 56, formB: true },
  { nama: "Departemen Keuangan Contoh", n: 6, kelompok: "non", jenjang: 0, dasar: 68, formB: true },
  { nama: "Departemen Umum Contoh", n: 14, kelompok: "non", jenjang: 0, dasar: 72, formB: false },
  { nama: "Layanan Inklusi Contoh", n: 8, kelompok: "non", jenjang: 0, dasar: 60, formB: false },
];
const PIMPINAN = {
  "SD Contoh Melati": "Rahmat Hidayat, S.Pd.",
  "SMP Contoh Melati": "Sri Wahyuni, M.Pd.",
  "SMA Contoh Melati": "Bambang Prasetyo, S.Pd.",
  "TK Contoh Kenanga": "Dewi Lestari, S.Pd.",
  "Asrama Contoh Kenanga": "Hasan Basri, S.Ag.",
  "Departemen Keuangan Contoh": "Lina Marlina, S.E.",
};
const DEPAN = ["Aisyah", "Budi", "Citra", "Dedi", "Eka", "Fajar", "Gita", "Hendra", "Indah", "Joko", "Kartika", "Lukman",
  "Maya", "Nanda", "Oki", "Putri", "Rizki", "Sari", "Taufik", "Umi", "Vina", "Wahyu", "Yusuf", "Zahra", "Anisa", "Bayu"];
const BELAKANG = ["Pratama", "Lestari", "Saputra", "Wulandari", "Hidayat", "Rahayu", "Nugroho", "Permata", "Santoso",
  "Maharani", "Kurniawan", "Anggraini", "Setiawan", "Puspita", "Ramadhan", "Susanti"];
const GELAR = ["", ", S.Pd.", ", S.Pd.", ", S.E.", ", M.Pd.", ", S.Kom."];
const JABATAN_SEKOLAH = ["Guru", "Guru", "Guru", "Wali Kelas", "Guru Pendamping", "Tenaga Administrasi", "Office Boy"];
const JABATAN_LAYANAN = ["Staff", "Staff", "Koordinator", "Pendamping Khusus", "Tenaga Administrasi"];
const JENJANG_ORANG = { SD: "SD", SMP: "SMP", SMA: "SMA", TK: "TK", Boarding: "Boarding" };
const LAMA = ["Kurang dari 1 tahun", "1 sampai 3, 4 sampai 7", "Lebih dari 7 tahun"];
const KONDISI_TEKS = ["1 : Sangat Berat - Sangat Menguras Energi", "2 : Berat - Terasa Menguras Energi",
  "3 : Sedang - Berjalan Cukup", "4 : Baik - Bekerja dengan Cukup Tenang", "5: Sangat Baik - Tenang dan Bertenaga"];
const PERMINTAAN_TEKS = { ya: "Ya, saya merasa perlu", mungkin: "Mungkin, saya belum yakin", belum: "Belum perlu saat ini" };

const TEMA = {
  J: [
    { tema: "Rekan kerja & kerja sama tim", contoh: ["Rekan kerja yang saling membantu saat tugas menumpuk", "Tim yang kompak dan mau berbagi beban", "Teman sejawat yang selalu siap diajak berdiskusi"] },
    { tema: "Nilai ibadah, keikhlasan & syukur", contoh: ["Niat bekerja sebagai ibadah", "Rasa syukur masih bisa mengajar setiap hari", "Kajian rutin yang menenangkan hati"] },
    { tema: "Keluarga & orang terdekat", contoh: ["Dukungan keluarga di rumah", "Semangat dari anak-anak di rumah", "Pasangan yang selalu mendengarkan cerita saya"] },
    { tema: "Perkembangan & semangat siswa", contoh: ["Melihat murid berkembang dari bulan ke bulan", "Cerita lucu dari anak-anak di kelas", "Murid yang dulu sulit sekarang mulai percaya diri"] },
    { tema: "Lingkungan & suasana kerja yang nyaman", contoh: ["Suasana kantor yang tenang", "Ruang kerja yang nyaman dan rapi", "Lingkungan yang ramah untuk pegawai baru"] },
  ],
  AI: [
    { tema: "Perilaku & kondisi siswa", contoh: ["Menghadapi murid yang sulit diatur di kelas besar", "Mendampingi anak yang sering tantrum", "Murid yang belum bisa fokus belajar"] },
    { tema: "Perjalanan & krisis layanan publik", contoh: ["Macet setiap pagi menuju sekolah", "Jarak rumah yang jauh dan angkutan terbatas", "Listrik sering padam di rumah"] },
    { tema: "Jadwal padat, jam kerja & kurang istirahat", contoh: ["Jadwal mengajar tanpa jeda istirahat", "Rapat yang sering melewati jam pulang", "Jam kerja yang panjang di akhir semester"] },
    { tema: "Administrasi & pelaporan", contoh: ["Laporan yang harus diisi di beberapa aplikasi", "Administrasi penilaian yang berulang", "Berkas yang diminta mendadak"] },
    { tema: "Kondisi pribadi, keluarga & kesehatan", contoh: ["Mengurus orang tua di rumah", "Anak di rumah yang masih kecil", "Kondisi badan yang mudah lelah belakangan ini"] },
  ],
  AJ: [
    { tema: "Waktu istirahat, libur & jam kerja", contoh: ["Jam istirahat yang benar-benar bisa dipakai", "Pulang tepat waktu tanpa tugas tambahan", "Libur akhir pekan tanpa pesan pekerjaan"] },
    { tema: "Komunikasi, kerja sama & penghargaan", contoh: ["Informasi dari pimpinan yang lebih jelas", "Apresiasi untuk kerja tim", "Koordinasi antarbagian yang lebih rapi"] },
    { tema: "Beban administrasi & sistem kerja", contoh: ["Satu aplikasi untuk semua laporan", "Format administrasi yang lebih sederhana", "Pembagian tugas yang tertulis jelas"] },
    { tema: "Kesejahteraan & penghasilan", contoh: ["Tunjangan yang sesuai beban kerja", "Kejelasan kenaikan golongan", "Insentif untuk tugas tambahan"] },
    { tema: "Kesehatan fisik & mental", contoh: ["Kegiatan olahraga bersama", "Ruang untuk menenangkan diri", "Acara penyegaran untuk pegawai"] },
  ],
};
// Satu jawaban contoh yang ditandai perlu ditinjau manusia; pembaca harus membuangnya dari kutipan.
const JAWABAN_TINJAU = "Beberapa pekan ini saya sulit tidur dan sempat dibawa ke IGD";

// ── Bangun orang ────────────────────────────────────────────────────────────────────────────
const orang = [];
let urut = 0;
for (const u of UNIT) {
  for (let i = 0; i < u.n; i++) {
    urut += 1;
    const laten = jepit(u.dasar + antara(-26, 22), 18, 98);
    const skor = {
      T_Energi: langkah(laten + antara(-14, 8)),
      T_Fungsi: langkah(laten + antara(-10, 14)),
      T_Beban: langkah(laten + antara(-20, 4)),
      T_Dukungan: langkah(laten + antara(-10, 12)),
      T_Makna: langkah(laten + antara(0, 22)),
    };
    const ikd = r1(Object.values(skor).reduce((a, b) => a + b, 0) / 5);
    const kondisi = jepit(Math.round((laten - 10) / 20) + (acak() < 0.2 ? -1 : 0), 1, 5);
    const naik = kondisi === 5 ? 0 : pilih([0, 0, 1, 1, 1, 2, -1]);
    const target = jepit(kondisi + naik, 1, 5);
    const p = acak();
    const permintaan = laten < 45 && p < 0.55 ? "ya" : p < 0.15 ? "ya" : p < 0.45 ? "mungkin" : "belum";
    const temaJ = pilih(TEMA.J); const temaAI = acak() < 0.7 ? pilih(TEMA.AI) : null; const temaAJ = acak() < 0.7 ? pilih(TEMA.AJ) : null;
    orang.push({
      baris: urut + 1,
      unit: u,
      nama: `${pilih(DEPAN)} ${pilih(BELAKANG)}${pilih(GELAR)}`,
      jabatan: pilih(u.kelompok === "sekolah" ? JABATAN_SEKOLAH : JABATAN_LAYANAN),
      jenjang: JENJANG_ORANG[u.jenjang] || 0,
      lama: pilih(LAMA),
      atasan: PIMPINAN[u.nama] || "Kepala Bagian Contoh",
      laten, skor, ikd, kondisi, target, gap: target - kondisi, permintaan,
      kebutuhan: KEBUTUHAN.filter(() => acak() < 0.32).map((k) => k.label),
      temaJ, temaAI, temaAJ,
      jawaban: {
        J: temaJ.contoh[Math.floor(acak() * 3)],
        L: pilih(["Konsisten menjaga waktu istirahat", "Belajar hal baru", "Lebih terbuka bercerita ke rekan", "-"]),
        AI: temaAI ? temaAI.contoh[Math.floor(acak() * 3)] : "-",
        AJ: temaAJ ? temaAJ.contoh[Math.floor(acak() * 3)] : "-",
      },
    });
  }
}
// Pastikan nama unik dan satu jawaban bertanda tinjauan.
const dipakai = new Set();
for (const o of orang) {
  while (dipakai.has(o.nama)) o.nama = `${pilih(DEPAN)} ${pilih(BELAKANG)}${pilih(GELAR)}`;
  dipakai.add(o.nama);
}
orang[5].jawaban.AI = JAWABAN_TINJAU;
TEMA.AI[4].contoh[0] = JAWABAN_TINJAU;
orang[5].temaAI = TEMA.AI[4];

// ── Form B contoh ──
for (const o of orang) {
  if (!o.unit.formB || acak() < 0.12) { o.amati = null; continue; }
  const berat = (100 - o.laten) / 100;
  const k = {};
  INDIKATOR.forEach((ind) => {
    let peluang = 0.12;
    if (ind.ranah === "beban") peluang = 0.1 + berat * 0.45;
    if (ind.ranah === "perubahan") peluang = 0.05 + berat * 0.35;
    if (ind.ranah === "kekuatan") peluang = 0.55 - berat * 0.35;
    if (ind.kode === "K15") peluang = berat > 0.5 ? 0.35 : 0.04;
    k[ind.kode] = acak() < peluang ? 1 : 0;
  });
  const jml = (kode) => kode.reduce((a, c) => a + k[c], 0);
  const cb = jml(["K1", "K2", "K3", "K4"]); const cp = jml(["K5", "K6", "K7", "K8"]);
  const ck = jml(["K9", "K10", "K11"]); const ckon = jml(["K12", "K13", "K14", "K15"]);
  const SB = r1(cb / 4 * 100); const SP = r1(cp / 4 * 100); const SK = r1(ck / 3 * 100); const SKon = r1(ckon / 4 * 100);
  const gB = r1((100 - o.skor.T_Beban) - SB); const gE = r1((100 - o.skor.T_Energi) - SP); const gD = r1(SK - o.skor.T_Dukungan);
  const ket = r1((Math.abs(gB) + Math.abs(gE) + Math.abs(gD)) / 3);
  const pola = ket <= 25 ? "Selaras" : gB + gE > 0 ? "Tekanan tak terlihat" : "Selisih sudut pandang";
  o.amati = {
    k, cb, cp, ck, ckon, SB, SP, SK, SKon, gB, gE, gD, ket, pola,
    kt: r1((SB + SP + (100 - SK) + SKon) / 4),
    frek: acak() < 0.05 ? "Jarang" : pilih(["Hampir setiap hari", "Hampir setiap hari", "Beberapa kali sepekan", "Beberapa kali sebulan"]),
    label: ket <= 10 ? "Selaras" : ket <= 25 ? "Ringan" : ket <= 40 ? "Sedang" : "Signifikan",
  };
}
// Satu pegawai contoh punya pengamatan tapi interaksinya jarang: diskor tanpa pengamatan.
for (const o of orang) {
  const pakaiAmati = o.amati && o.amati.frek !== "Jarang";
  const kompA = r1(100 - o.ikd);
  const spa = pakaiAmati
    ? r1(0.55 * kompA + 0.2 * o.amati.kt + 0.1 * Math.min(o.amati.ket, 50) * 2 + 0.15 * o.amati.SKon)
    : r1(0.79 * kompA + 0.21 * (o.amati?.SKon || 0));
  o.spa = spa;
  o.catatanSkor = pakaiAmati ? "" : "Tanpa data pengamatan";
  const datar = o.kondisi <= 2 && o.gap <= 1;
  o.penanda = o.permintaan === "ya" ? "Minta sendiri"
    : o.amati?.k.K15 ? "Disampaikan ke atasan"
      : o.skor.T_Fungsi < 25 ? "Fungsi rendah"
        : o.permintaan === "mungkin" ? "Ragu"
          : datar ? "Harapan datar" : "";
}

// ── Daftar peserta: penanda dulu, lalu kuota unit, lalu sisa kursi ──
const TARGET = 36;
const peserta = new Map();
for (const o of orang) if (["Minta sendiri", "Disampaikan ke atasan"].includes(o.penanda)) peserta.set(o, "Penanda");
while (peserta.size > TARGET - UNIT.length - 3) {
  const buang = [...peserta.keys()].sort((a, b) => a.spa - b.spa)[0];
  peserta.delete(buang);
}
for (const u of UNIT) {
  const calon = orang.filter((o) => o.unit === u && !peserta.has(o)).sort((a, b) => b.spa - a.spa);
  if (calon[0]) peserta.set(calon[0], "Kuota unit");
}
const sisa = orang.filter((o) => !peserta.has(o)).sort((a, b) => b.spa - a.spa);
while (peserta.size < TARGET && sisa.length) peserta.set(sisa.shift(), "Sisa kursi");

// ── Susun sheet ──────────────────────────────────────────────────────────────────────────────
const sheets = {};
const kosong = (n) => Array(n).fill(null);

sheets["Personal Form"] = [
  ["No", null, "Unit", "Nama Lengkap", "Jabatan", "Jenjang", "Lama Kerja", "Atasan Langsung",
    "Secara keseluruhan, bagaimana rasanya menjalani pekerjaan Anda dalam empat pekan terakhir?",
    "Apa yang selama ini paling membantu Anda bertahan di angka itu?",
    "Tiga bulan lagi, angka berapa yang menurut Anda masuk akal untuk Anda capai?",
    "Apa satu hal yang bisa menaikkan angka Anda dari awal hingga 3 bulan lagi tersebut?",
    "Dukungan apa yang paling akan membantu Anda saat ini?",
    "Apakah Anda merasa perlu dibantu untuk pendalaman?",
    "Apa yang paling menguras energi Anda akhir-akhir ini? (- jika tidak ada)",
    "Satu hal yang kalau diperbaiki akan paling terasa bagi Anda, apa itu? (- jika tidak ada)"],
  ...orang.map((o, i) => [i + 1, o.unit.kelompok, o.unit.nama, o.nama, o.jabatan, o.jenjang, o.lama, o.atasan,
    KONDISI_TEKS[o.kondisi - 1], o.jawaban.J, KONDISI_TEKS[o.target - 1], o.jawaban.L,
    o.kebutuhan.join(","), PERMINTAAN_TEKS[o.permintaan], o.jawaban.AI, o.jawaban.AJ]),
];

sheets["03 Skor Individu"] = [
  ["Unit", "Nama", "Jabatan", "Jenjang", "Atasan Langsung", "T_Energi", "T_Fungsi", "T_Beban", "T_Dukungan", "T_Makna", "IKD"],
  ...orang.map((o) => [o.unit.nama, o.nama, o.jabatan, o.jenjang, o.atasan, ...Object.values(o.skor), o.ikd]),
];

const judul04 = ["Nama", "Unit Leader Form", "Unit Personal Form (pemetaan)", "Unit daftar induk", "Nama pimpinan pengisi",
  "Isi Personal Form", "Frekuensi_Interaksi", ...INDIKATOR.map((k) => k.kode), "Diusulkan_Pimpinan",
  "Centang_Beban", "Centang_Perubahan", "Centang_Kekuatan", "Centang_Konteks"];
const baris04 = [];
for (const o of orang) {
  if (!o.amati) continue;
  o.baris04 = baris04.length + 2;
  const a = o.amati;
  baris04.push([o.nama, o.unit.nama, o.unit.nama, o.unit.nama.toUpperCase(), PIMPINAN[o.unit.nama], "Ya", a.frek,
    ...INDIKATOR.map((k) => a.k[k.kode]), 0, a.cb, a.cp, a.ck, a.ckon]);
}
// Dua anggota tim yang dinilai pimpinan tapi tidak mengisi Form A.
baris04.push(["Anggota Tim Contoh Satu", "SD Contoh Melati", "SD Contoh Melati", "SD CONTOH", PIMPINAN["SD Contoh Melati"], "Tidak", "Beberapa kali sepekan", ...INDIKATOR.map(() => 0), 0, 0, 0, 0, 0]);
baris04.push(["Anggota Tim Contoh Dua", "SMP Contoh Melati", "SMP Contoh Melati", "SMP CONTOH", PIMPINAN["SMP Contoh Melati"], "Tidak", "Hampir setiap hari", ...INDIKATOR.map((k) => (k.ranah === "kekuatan" ? 1 : 0)), 0, 0, 0, 3, 0]);
sheets["04 Pengamatan"] = [judul04, ...baris04];

const asumsiBlok = [
  ["ASUMSI & AMBANG (diubah di sini, seluruh kolom ikut)", null], ["Bobot SPA — ADA data pengamatan", null],
  ["w_A  (Komp_A = 100-IKD)", 0.55], ["w_B  (Kebutuhan_Teramati)", 0.2], ["w_C  (Ketidakselarasan terbatas)", 0.1],
  ["w_D  (SKon)", 0.15], ["Bobot SPA — TANPA pengamatan / Jarang", null], ["w_A", 0.79], ["w_D", 0.21],
  ['Label_Gap: "Selaras" bila ≤', 10], ['Label_Gap: "Ringan" bila ≤', 25], ['Label_Gap: "Sedang" bila ≤', 40],
  ["Ambang Pola (Ketidakselarasan >)", 25], ['Ambang "Fungsi rendah" (T_Fungsi <)', 25],
  ["Batas atas Ketidakselarasan pada Komp_C", 50],
];
const judul05 = ["Unit", "Nama", "Jabatan", "Jenjang", "T_Energi", "T_Fungsi", "T_Beban", "T_Dukungan", "T_Makna", "IKD",
  "Gap_Harapan", "Angka_Kondisi (kol I)", "Permintaan (kol AH)", "Ada_Pengamatan", "Frekuensi_Interaksi",
  "Centang_Beban", "Centang_Perubahan", "Centang_Kekuatan", "Centang_Konteks", "K15", "SB", "SP", "SK", "SKon",
  "Kebutuhan_Teramati", "Gap_Beban", "Gap_Energi", "Gap_Dukungan", "Ketidakselarasan", "Label_Gap", "Pola",
  "Komp_A (100-IKD)", "SPA", "Catatan_Skor", "Penanda", "H: Baris 03", "H: Baris 04",
  asumsiBlok[0][0], null];
const baris05 = orang.map((o, i) => {
  const a = o.amati;
  return [o.unit.nama, o.nama, o.jabatan, o.jenjang, ...Object.values(o.skor), o.ikd, o.gap, o.kondisi,
    PERMINTAAN_TEKS[o.permintaan], a ? "Ya" : "Tidak", a ? a.frek : "",
    a ? a.cb : "", a ? a.cp : "", a ? a.ck : "", a ? a.ckon : "", a ? a.k.K15 : "",
    a ? a.SB : "", a ? a.SP : "", a ? a.SK : "", a ? a.SKon : "", a ? a.kt : "",
    a ? a.gB : "", a ? a.gE : "", a ? a.gD : "", a ? a.ket : "", a ? a.label : "", a ? a.pola : "",
    r1(100 - o.ikd), o.spa, o.catatanSkor, o.penanda, o.baris, a ? o.baris04 : "",
    ...(asumsiBlok[i + 1] || [null, null])];
});
sheets["05 Prioritas"] = [judul05, ...baris05];
orang.forEach((o, i) => { o.baris05 = i + 2; });

const hitungJalur = (j) => [...peserta.values()].filter((v) => v === j).length;
sheets["06 Daftar Peserta"] = [
  [`06 DAFTAR PESERTA ASESMEN LANJUTAN — ${TARGET} PESERTA`], ["Daftar ini adalah daftar undangan, bukan peringkat."], [],
  ["RINGKASAN 1 — PESERTA PER JALUR"], ["Jalur", "Jumlah"],
  ["Penanda", hitungJalur("Penanda")], ["Kuota unit", hitungJalur("Kuota unit")], ["Sisa kursi", hitungJalur("Sisa kursi")],
  ["Total peserta", peserta.size], [], ["RINGKASAN 2 — PERHITUNGAN KURSI"], ["Target peserta", TARGET], [],
  ["RINGKASAN 4 — PESERTA PER UNIT"],
  ["Unit", "Jumlah pegawai (Personal Form)", "SPA rata-rata unit", "Kuota dasar (bulat bawah)", "Tambahan pembulatan", "Kuota unit final",
    "Peserta via Penanda", "Peserta via Kuota unit", "Peserta via Sisa kursi", "Total peserta unit"],
  ...UNIT.map((u) => [u.nama, u.n, null, 1, 0, 1, null, null, null, null]),
  ["TOTAL"], [],
  ["DAFTAR PESERTA ASESMEN LANJUTAN — urut Unit lalu Nama (bukan peringkat)"],
  ["Nama", "Unit", "Jabatan", "Jenjang", "SPA", "Penanda", "Jalur", "Pola", "Catatan_Skor", "H: Baris 05"],
  ...[...peserta.entries()]
    .sort(([a], [b]) => a.unit.nama.localeCompare(b.unit.nama) || a.nama.localeCompare(b.nama))
    .map(([o, jalur]) => [o.nama, o.unit.nama, o.jabatan, o.jenjang, o.spa, o.penanda, jalur, o.amati?.pola || "", o.catatanSkor, o.baris05]),
];

const rata = (arr) => r1(arr.reduce((a, b) => a + b, 0) / arr.length);
const barisUnit = (nama, anggota, n) => {
  const amati = anggota.filter((o) => o.amati);
  const keb = KEBUTUHAN.map((k) => anggota.filter((o) => o.kebutuhan.includes(k.label)).length);
  const row = [nama, n, n, rata(anggota.map((o) => o.ikd)),
    ...["T_Energi", "T_Fungsi", "T_Beban", "T_Dukungan", "T_Makna"].map((k) => rata(anggota.map((o) => o.skor[k]))),
    "", "", rata(anggota.map((o) => (o.kondisi - 1) * 25)), null, null, null,
    rata(anggota.map((o) => o.gap)), anggota.filter((o) => o.amati?.pola === "Tekanan tak terlihat").length, null, null,
    "", "", "", amati.length ? "Ya" : "Tidak", amati.length ? rata(amati.map((o) => o.amati.ket)) : "", n < 10 ? "Pengisi <10" : "", null,
    ...kosong(6), ...keb];
  return row;
};
const judul07 = ["Unit", "Jumlah pegawai", "Jumlah pengisi", "Rata-rata IKD", "Rata-rata T_Energi", "Rata-rata T_Fungsi",
  "Rata-rata T_Beban", "Rata-rata T_Dukungan", "Rata-rata T_Makna", "Subskala terendah", "Subskala tertinggi",
  "Rata-rata T_Skala", "% kondisi 1–2", "% kondisi 3", "% kondisi 4–5", "Rata-rata Gap_Harapan",
  'Jumlah "Tekanan tak terlihat"', '% "Ya, saya merasa perlu"', '% "Mungkin, saya belum yakin"',
  "Kebutuhan #1", "Kebutuhan #2", "Kebutuhan #3", "Punya_Data_Pengamatan", "Rata-rata gap tim", "Tanda", null,
  ...kosong(6), ...KEBUTUHAN.map((k) => k.label)];
sheets["07 Unit"] = [
  ["07 UNIT — RINGKASAN PER UNIT"], ["Satu baris per unit (data contoh)."], judul07,
  ...UNIT.map((u) => barisUnit(u.nama, orang.filter((o) => o.unit === u), u.n)),
  barisUnit("SELURUH LEMBAGA", orang, orang.length),
];

const blokTema = (kode, judulBlok, kolom) => {
  const terisi = orang.filter((o) => o.jawaban[kolom] !== "-");
  const baris = [[judulBlok], ["Jawaban terisi", terisi.length], ["Diabaikan (tanda hubung, \"tidak ada\", kosong)", orang.length - terisi.length],
    ["Menyebut orang tertentu — tidak dipakai sebagai kutipan", 0], [], ["Tema", "Penyebutan", "% dari jawaban terisi", "Kutipan 1", "Kutipan 2", "Kutipan 3"]];
  const kunciTema = { J: "temaJ", AI: "temaAI", AJ: "temaAJ" }[kode];
  for (const t of TEMA[kode]) {
    const n = orang.filter((o) => o[kunciTema] === t).length;
    baris.push([t.tema, n, terisi.length ? n / terisi.length : 0, ...t.contoh]);
  }
  baris.push(["TOTAL", terisi.length, 1], [], []);
  return baris;
};
const tema08 = [
  ["08 TEMA — PENGELOMPOKAN TIGA KOLOM ESAI (data contoh)"], ["Tema disusun dari isi jawaban."], [], [],
  ...blokTema("J", "KOLOM J — APA YANG PALING MEMBANTU BERTAHAN", "J"),
  ...blokTema("AI", "KOLOM AI — APA YANG PALING MENGURAS ENERGI", "AI"),
  ...blokTema("AJ", "KOLOM AJ — SATU HAL YANG KALAU DIPERBAIKI PALING TERASA", "AJ"),
  ["TABEL SILANG — PENYEBUTAN TEMA KOLOM AI PER UNIT"], [], [],
  ["Unit", "Jawaban terisi", ...TEMA.AI.map((t) => t.tema), "Tema terbanyak di unit"],
  ...UNIT.map((u) => {
    const anggota = orang.filter((o) => o.unit === u && o.temaAI);
    return [u.nama, anggota.length, ...TEMA.AI.map((t) => anggota.filter((o) => o.temaAI === t).length), ""];
  }),
  ["TOTAL"], [], [], ["PERLU DITINJAU MANUSIA"], [], [],
  ["Nama", "Unit", "Kolom", "Kata penanda terdeteksi", "Isi jawaban"],
  [orang[5].nama, orang[5].unit.nama, "AI", "igd", JAWABAN_TINJAU], [],
];
// Blok kanan: tema per orang, dimulai kolom AA (indeks 26) seperti berkas asli.
const LEBAR_KIRI = 26;
tema08.forEach((r) => { while (r.length < LEBAR_KIRI) r.push(null); });
tema08[0].push("Baris PF", "Unit", "Nama", "Tema J", "Tema AI", "Tema AJ", "Sebut orang J", "Sebut orang AI", "Sebut orang AJ", "Penanda tinjauan");
orang.forEach((o, i) => {
  const r = tema08[i + 1] || (tema08[i + 1] = Array(LEBAR_KIRI).fill(null));
  while (r.length < LEBAR_KIRI) r.push(null);
  r.push(o.baris, o.unit.nama, o.nama, o.temaJ.tema, o.temaAI?.tema || "(diabaikan)", o.temaAJ?.tema || "(diabaikan)",
    0, 0, 0, i === 5 ? "AI" : null);
});
sheets["08 Tema"] = tema08;

sheets["09 Ringkasan Pimpinan"] = [
  ["09 RINGKASAN TEMUAN UNTUK PIMPINAN (data contoh)"], ["Sumber: data contoh."],
  ["1. GAMBARAN KESELURUHAN"],
  ["Ini ringkasan contoh. Subskala makna paling tinggi, subskala beban paling rendah."],
  ["2. SISI YANG PERLU PERHATIAN"],
  ["Ringkasan contoh: jadwal padat dan administrasi paling sering disebut."],
  ["CATATAN KETERBATASAN"],
  ["Dua unit contoh belum memiliki data pengamatan pimpinan."],
];

const dataset = bacaDatasetSw(sheets, {
  lembaga: "Yayasan Contoh Nusantara",
  sekolahId: "CONTOH-SW",
  periodeId: "2026-09",
  sumber: "data buatan (buat-data-contoh.mjs)",
  dibuat: "2026-09-17T00:00:00.000Z",
  contoh: true,
});

const tujuan = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src/pages/sw/data/sw.contoh.json");
fs.mkdirSync(path.dirname(tujuan), { recursive: true });
fs.writeFileSync(tujuan, `${JSON.stringify(dataset, null, 1)}\n`);
const l = dataset.lembaga;
console.log(`Data contoh: ${l.nPengisi} pengisi, ${l.nUnit} unit, ${l.peserta.total} peserta`);
console.log(`  jalur  : ${JSON.stringify(l.peserta.perJalur)}`);
console.log(`  alasan : ${JSON.stringify(l.peserta.perAlasan)}`);
console.log(`  ditulis: ${path.relative(process.cwd(), tujuan)}`);
