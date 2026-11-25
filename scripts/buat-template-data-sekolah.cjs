// Membuat template Excel data sekolah untuk Screening HEART.
// Pemakaian (dari akar repo): node scripts/buat-template-data-sekolah.cjs <berkas-screening.xlsx | -> <keluaran.xlsx>
// Berkas keluaran yang berisi data siswa JANGAN disimpan di repo (data pribadi).
//   "-" sebagai sumber = template kosong (tanpa data siswa), untuk dipakai sekolah lain.
const path = require("path");
const web = process.env.WEB_DIR || path.join(__dirname, "..", "web");
const X = require(path.join(web, "node_modules", "xlsx"));
const ExcelJS = require(path.join(web, "node_modules", "exceljs"));

const [sumber, keluaran] = process.argv.slice(2);
const kosong = sumber === "-";

// ---------- warna dan gaya ----------
const UNGU = "FF4F1DB8";
const UNGU_TUA = "FF2E1A78";
const ISI = "FFFFF4CC"; // kuning: wajib diisi sekolah
const SUDAH = "FFE7F4EE"; // hijau muda: sudah terisi dari data screening, mohon diperiksa
const FAMMI = "FFEEEDF1"; // abu: diisi tim Fammi
const CEK = "FFFDE2E2"; // merah muda: perlu dicek sekolah
const CONTOH = "FFF4F3F6";
const FONT = "Arial";

function warnai(cell, argb) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
}
function font(cell, opsi = {}) {
  cell.font = { name: FONT, size: 10, ...opsi };
}

// ---------- baca data screening ----------
const BULAN = {
  januari: 1, jan: 1, februari: 2, feb: 2, pebruari: 2, maret: 3, mar: 3, april: 4, apr: 4, mei: 5,
  juni: 6, jun: 6, juli: 7, jul: 7, agustus: 8, agu: 8, agt: 8, ags: 8, september: 9, sep: 9, sept: 9,
  oktober: 10, okt: 10, oktber: 10, november: 11, nov: 11, nopember: 11, desember: 12, desembar: 12, des: 12,
};

/** Tanggal lahir dari data screening: Date, atau { teks } bila tidak bisa dipastikan. */
function bacaTanggal(v) {
  if (v === 0 || v === "" || v == null) return null;
  if (typeof v === "number") {
    const d = X.SSF.parse_date_code(v);
    if (d && d.y > 1990 && d.y < 2025) return new Date(Date.UTC(d.y, d.m - 1, d.d));
    return { teks: String(v) };
  }
  const s = String(v).toLowerCase().replace(/[a-z]+(?=\s+\d{1,2}\s+[a-z])/i, "").trim(); // buang nama kota di depan
  let m = s.match(/^(\d{1,2})[\s,.\-\/]+([a-z]+)[\s,.\-\/]+(\d{4})$/);
  if (m && BULAN[m[2]]) return new Date(Date.UTC(+m[3], BULAN[m[2]] - 1, +m[1]));
  m = s.match(/^(\d{1,2})[\s,.\-\/]+(\d{1,2})[\s,.\-\/]+(\d{2,4})$/);
  if (m) {
    const th = m[3].length === 2 ? 2000 + +m[3] : +m[3];
    if (+m[2] >= 1 && +m[2] <= 12 && +m[1] >= 1 && +m[1] <= 31 && th > 1990 && th < 2025) {
      return new Date(Date.UTC(th, +m[2] - 1, +m[1]));
    }
  }
  return { teks: String(v) };
}

/** Kode kelas baku: "XI. 1" -> "XI.1". */
const kodeKelas = (k) => String(k).replace(/\s+/g, "").toUpperCase();

let siswa = [];
let namaSekolah = "";
let catatanData = [];
if (!kosong) {
  const wb = X.readFile(sumber);
  const baca = (nama) =>
    X.utils.sheet_to_json(wb.Sheets[nama], { header: 1, defval: "" }).slice(1).filter((r) => String(r[0]).trim());
  const sudah = baca("Siswa Mengisi");
  const belum = wb.Sheets["Belum Mengisi"] ? baca("Belum Mengisi") : [];
  namaSekolah = String(sudah[0]?.[56] || "").trim();
  const peta = new Map();
  const tambah = (r, status) => {
    const nama = String(r[0]).replace(/\s+/g, " ").trim().toUpperCase();
    const kunci = nama + "|" + kodeKelas(r[3]);
    if (peta.has(kunci)) {
      peta.get(kunci).ganda = true;
      return;
    }
    peta.set(kunci, { nama, jk: String(r[2]).trim().toUpperCase(), tgl: bacaTanggal(r[1]), kelas: kodeKelas(r[3]), status });
  };
  sudah.forEach((r) => tambah(r, "Sudah"));
  belum.forEach((r) => tambah(r, "Belum"));
  siswa = [...peta.values()].sort((a, b) => a.kelas.localeCompare(b.kelas, "id", { numeric: true }) || a.nama.localeCompare(b.nama, "id"));
  const nGanda = siswa.filter((s) => s.ganda).length;
  const nTgl = siswa.filter((s) => !s.tgl || !(s.tgl instanceof Date)).length;
  const kelasAsli = [...new Set(sudah.map((r) => String(r[3])))].filter((k) => k !== kodeKelas(k));
  catatanData = [
    `${sudah.length} baris siswa sudah mengisi dan ${belum.length} siswa belum mengisi di berkas screening.`,
    nGanda ? `${nGanda} nama muncul dua kali di data screening (sudah digabung jadi satu baris, ditandai di kolom Catatan).` : "",
    `${nTgl} tanggal lahir kosong atau formatnya tidak bisa dipastikan (ditandai merah muda di lembar Siswa).`,
    kelasAsli.length ? `Kode kelas di data screening tidak seragam (mis. "${kelasAsli[0]}"); di template ini dibakukan jadi "${kodeKelas(kelasAsli[0])}".` : "",
    "Berkas screening tidak memuat NIS/NISN, data wali kelas, Guru BK, maupun kontak orang tua, jadi bagian itu wajib dilengkapi sekolah.",
  ].filter(Boolean);
}
const daftarKelas = [...new Set(siswa.map((s) => s.kelas))];

// ---------- buku kerja ----------
const wb = new ExcelJS.Workbook();
wb.creator = "Fammi";
wb.calcProperties.fullCalcOnLoad = true;

const PERAN = ["Kepala Sekolah", "Wakil Kepala Sekolah", "Guru BK", "Wali Kelas", "Guru Piket", "Admin Sekolah"];
const JK = ["L", "P"];
const YA = ["Ya", "Tidak"];
const STATUS = ["Sudah", "Belum"];
const HUBUNGAN = ["Ayah", "Ibu", "Wali"];
const PERSETUJUAN = ["Sudah", "Belum"];
const SALURAN = ["WhatsApp", "Email", "WhatsApp dan Email"];
const KELAS_PILIHAN = daftarKelas.length ? daftarKelas : ["X.1", "X.2", "XI.1", "XI.2", "XII.1", "XII.2"];
const BARIS_SISWA = 600;
const BARIS_STAF = 60;

// ---------- daftar pilihan (lembar Pilihan dibuat paling akhir) ----------
const kolomPilihan = [
  ["Peran", PERAN],
  ["Jenis kelamin", JK],
  ["Kelas", KELAS_PILIHAN],
  ["Ya/Tidak", YA],
  ["Status screening", STATUS],
  ["Hubungan", HUBUNGAN],
  ["Persetujuan", PERSETUJUAN],
  ["Saluran", SALURAN],
];
const rujukan = {};
kolomPilihan.forEach(([judul, nilai], i) => {
  const kol = String.fromCharCode(65 + i);
  rujukan[judul] = "Pilihan!$" + kol + "$2:$" + kol + "$" + (nilai.length + 1);
});
function buatPilihan() {
const pil = wb.addWorksheet("Pilihan");
kolomPilihan.forEach(([judul, nilai], i) => {
  const kol = String.fromCharCode(65 + i);
  const h = pil.getCell(`${kol}1`);
  h.value = judul;
  font(h, { bold: true, color: { argb: "FFFFFFFF" } });
  warnai(h, UNGU);
  nilai.forEach((v, j) => {
    const c = pil.getCell(`${kol}${j + 2}`);
    c.value = v;
    font(c);
  });
  pil.getColumn(i + 1).width = 22;
});
const bawah = Math.max(...kolomPilihan.map(([, n]) => n.length)) + 3;
pil.getCell(`A${bawah}`).value = "Lembar ini sumber pilihan dropdown. Bila sekolah punya kelas baru, tambahkan di kolom Kelas.";
font(pil.getCell(`A${bawah}`), { italic: true, color: { argb: "FF7C7689" } });
}

function daftar(cell, nama, wajib = false) {
  cell.dataValidation = {
    type: "list",
    allowBlank: !wajib,
    formulae: [rujukan[nama]],
    showErrorMessage: true,
    errorStyle: "warning",
    errorTitle: "Pilih dari daftar",
    error: `Pilih salah satu isian ${nama} dari daftar.`,
  };
}

/** Kepala tabel: baris 1 judul kolom (ungu), lebar kolom, freeze. */
function kepala(ws, kolom, barisKepala = 1) {
  kolom.forEach((k, i) => {
    const c = ws.getRow(barisKepala).getCell(i + 1);
    c.value = k.judul;
    font(c, { bold: true, color: { argb: "FFFFFFFF" } });
    warnai(c, k.fammi ? "FF7C7689" : UNGU);
    c.alignment = { vertical: "middle", wrapText: true };
    if (k.ket) c.note = { texts: [{ text: k.ket }] };
    ws.getColumn(i + 1).width = k.lebar || 18;
  });
  ws.getRow(barisKepala).height = 34;
  ws.views = [{ state: "frozen", ySplit: barisKepala, xSplit: 0 }];
}

/** Baris contoh (abu, miring) supaya sekolah melihat format yang diharapkan. */
function barisContoh(ws, nilai, baris = 2) {
  nilai.forEach((v, i) => {
    const c = ws.getRow(baris).getCell(i + 1);
    c.value = v;
    font(c, { italic: true, color: { argb: "FF7C7689" } });
    warnai(c, CONTOH);
  });
}

// ---------- 0. Petunjuk ----------
const pet = wb.addWorksheet("Petunjuk");
pet.getColumn(1).width = 4;
pet.getColumn(2).width = 110;
let b = 1;
const tulis = (teks, opsi = {}) => {
  const c = pet.getCell(`B${b}`);
  c.value = teks;
  font(c, opsi.font || {});
  c.alignment = { wrapText: true, vertical: "top" };
  if (opsi.warna) warnai(c, opsi.warna);
  b += 1;
  return c;
};
tulis(`Data Sekolah untuk Screening HEART${namaSekolah ? `: ${namaSekolah}` : ""}`, { font: { bold: true, size: 16, color: { argb: UNGU_TUA } } });
tulis("Diisi sekolah sebelum akun dan laporan Screening HEART dibuka di aplikasi Fammi.", { font: { color: { argb: "FF55525F" } } });
b += 1;
tulis("Untuk apa data ini", { font: { bold: true, size: 12, color: { argb: UNGU_TUA } } });
tulis(
  "Hasil Screening HEART sudah ada, tapi belum bisa dipasang ke aplikasi karena belum ada data siapa wali kelasnya, siapa Guru BK, " +
    "nomor induk siswa, dan kontak orang tua. Data di bawah dipakai untuk: membuat akun Kepala Sekolah, Guru BK, wali kelas, orang tua, dan siswa; " +
    "menyambungkan hasil tiap siswa ke kelas dan wali kelasnya; dan mengirim pemberitahuan tindak lanjut.",
);
b += 1;
tulis("Urutan pengisian", { font: { bold: true, size: 12, color: { argb: UNGU_TUA } } });
[
  "1. Profil Sekolah: identitas sekolah, Kepala Sekolah, Koordinator BK, dan penanggung jawab (PIC) untuk Fammi.",
  "2. Staf: semua orang yang perlu akun dashboard. Setiap kelas wajib punya satu wali kelas.",
  "3. Kelas: cek kode kelas dan pilih Guru BK pendamping. Nama wali kelas terisi otomatis dari lembar Staf.",
  "4. Siswa: lengkapi NIS/NISN, perbaiki tanggal lahir yang ditandai, lalu isi data dan kontak orang tua.",
  "5. Cek Kelengkapan: semua baris harus berstatus Lengkap sebelum berkas dikirim kembali ke Fammi.",
].forEach((t) => tulis(t));
b += 1;
tulis("Arti warna sel", { font: { bold: true, size: 12, color: { argb: UNGU_TUA } } });
tulis("Kuning: wajib diisi sekolah.", { warna: ISI });
tulis("Hijau muda: sudah terisi dari data screening. Mohon diperiksa dan diperbaiki bila salah.", { warna: SUDAH });
tulis("Merah muda: perlu dicek sekolah (mis. tanggal lahir yang formatnya tidak jelas).", { warna: CEK });
tulis("Abu: diisi tim Fammi (username akun). Sekolah tidak perlu mengisi.", { warna: FAMMI });
tulis("Baris abu bertulisan miring di baris ke-2 tiap lembar adalah CONTOH format. Jangan dihapus, tidak ikut diproses.", { warna: CONTOH });
b += 1;
tulis("Aturan isian", { font: { bold: true, size: 12, color: { argb: UNGU_TUA } } });
[
  "Kode kelas memakai format baku tanpa spasi, mis. X.1, XI.4, XII.2 (pilih dari dropdown).",
  "Tanggal lahir diisi sebagai tanggal (format hari/bulan/tahun), bukan teks.",
  "Nomor WhatsApp diawali 62, tanpa spasi, tanda hubung, atau tanda plus. Contoh: 6281234567890.",
  "Email dipakai untuk pemberitahuan. Username login dibuatkan tim Fammi, sekolah tidak perlu membuat kata sandi.",
  "Satu siswa satu baris. Bila nama siswa ganda, pastikan apakah itu orang yang sama.",
].forEach((t) => tulis(`• ${t}`));
b += 1;
tulis("Privasi", { font: { bold: true, size: 12, color: { argb: UNGU_TUA } } });
tulis(
  "Berkas ini berisi data pribadi siswa dan orang tua. Kirim hanya lewat kanal resmi ke PIC Fammi, jangan diunggah ke grup. " +
    "Hasil skor screening TIDAK dimasukkan ke berkas ini; hasil tetap dikelola Fammi dan hanya terbuka sesuai peran di aplikasi.",
);
if (catatanData.length) {
  b += 1;
  tulis("Catatan dari data screening yang sudah ada", { font: { bold: true, size: 12, color: { argb: UNGU_TUA } } });
  catatanData.forEach((t) => tulis(`• ${t}`));
}

// ---------- 1. Profil Sekolah ----------
const prof = wb.addWorksheet("1. Profil Sekolah");
kepala(prof, [
  { judul: "Data", lebar: 38 },
  { judul: "Isian", lebar: 46 },
  { judul: "Keterangan", lebar: 60 },
]);
const ISIAN_PROFIL = [
  ["Nama sekolah", namaSekolah, "Sesuai nama resmi.", !!namaSekolah],
  ["NPSN", "", "8 digit Nomor Pokok Sekolah Nasional."],
  ["Jenjang", kosong ? "" : "SMA", "TK, SD, SMP, SMA, atau SMK.", !kosong],
  ["Yayasan / naungan", "", "Kosongkan bila sekolah negeri."],
  ["Alamat", "", ""],
  ["Kota / kabupaten", "", ""],
  ["Provinsi", "", ""],
  ["Tahun ajaran", "", "Contoh: 2025/2026."],
  ["Semester", "", "Ganjil atau Genap."],
  ["Tanggal pelaksanaan screening", "", "Tanggal siswa mengisi screening."],
  ["Nama Kepala Sekolah", "", ""],
  ["Email Kepala Sekolah", "", ""],
  ["WhatsApp Kepala Sekolah", "", "Diawali 62."],
  ["Nama Koordinator BK", "", "Penerima utama laporan dan tindak lanjut screening."],
  ["Email Koordinator BK", "", ""],
  ["WhatsApp Koordinator BK", "", "Diawali 62."],
  ["Nama PIC sekolah untuk Fammi", "", "Orang yang dihubungi tim Fammi selama penyiapan."],
  ["Jabatan PIC", "", ""],
  ["Email PIC", "", ""],
  ["WhatsApp PIC", "", "Diawali 62."],
  ["Saluran pemberitahuan", "", "Pilih dari daftar."],
  ["Persetujuan orang tua sudah dikumpulkan?", "", "Sudah atau Belum. Diperlukan sebelum hasil dibuka ke orang tua dan siswa."],
];
ISIAN_PROFIL.forEach(([data, nilai, ket, terisi], i) => {
  const r = prof.getRow(i + 2);
  r.getCell(1).value = data;
  r.getCell(2).value = nilai || null;
  r.getCell(3).value = ket;
  font(r.getCell(1), { bold: true });
  font(r.getCell(2));
  font(r.getCell(3), { color: { argb: "FF7C7689" } });
  warnai(r.getCell(2), terisi ? SUDAH : ISI);
  r.getCell(3).alignment = { wrapText: true };
  if (data === "Saluran pemberitahuan") daftar(r.getCell(2), "Saluran");
  if (data.startsWith("Persetujuan orang tua")) daftar(r.getCell(2), "Persetujuan");
  if (data === "Tanggal pelaksanaan screening") r.getCell(2).numFmt = "dd/mm/yyyy";
});
const BARIS_PROFIL_AKHIR = ISIAN_PROFIL.length + 1;

// ---------- 2. Staf ----------
const staf = wb.addWorksheet("2. Staf");
const KOL_STAF = [
  { judul: "No", lebar: 6 },
  { judul: "Nama lengkap", lebar: 32 },
  { judul: "Peran", lebar: 22, ket: "Pilih dari daftar. Satu orang bisa muncul dua kali bila punya dua peran." },
  { judul: "Kelas binaan (khusus wali kelas)", lebar: 18, ket: "Wajib untuk peran Wali Kelas." },
  { judul: "Email", lebar: 30 },
  { judul: "WhatsApp (62...)", lebar: 18 },
  { judul: "Perlu akun dashboard?", lebar: 14 },
  { judul: "Catatan", lebar: 30 },
  { judul: "Username (diisi Fammi)", lebar: 22, fammi: true },
];
kepala(staf, KOL_STAF);
barisContoh(staf, ["Contoh", "Rina Kartika, S.Pd.", "Wali Kelas", "X.1", "rina.kartika@sekolah.sch.id", "6281234567890", "Ya", "", ""]);
const awalStaf = [
  ["Kepala Sekolah", ""],
  ["Guru BK", ""],
  ["Guru BK", ""],
  ...KELAS_PILIHAN.map((k) => ["Wali Kelas", daftarKelas.length ? k : ""]),
];
for (let i = 0; i < BARIS_STAF; i++) {
  const r = staf.getRow(i + 3);
  const awal = awalStaf[i];
  r.getCell(1).value = i + 1;
  font(r.getCell(1), { color: { argb: "FF7C7689" } });
  for (let k = 2; k <= 9; k++) {
    const c = r.getCell(k);
    font(c);
    warnai(c, k === 9 ? FAMMI : ISI);
  }
  if (awal) {
    r.getCell(3).value = awal[0];
    if (awal[1]) r.getCell(4).value = awal[1];
    r.getCell(7).value = "Ya";
  }
  daftar(r.getCell(3), "Peran");
  daftar(r.getCell(4), "Kelas");
  daftar(r.getCell(7), "Ya/Tidak");
  r.getCell(6).numFmt = "@";
}

// ---------- 3. Kelas ----------
const kel = wb.addWorksheet("3. Kelas");
kepala(kel, [
  { judul: "Kode kelas", lebar: 12 },
  { judul: "Tingkat", lebar: 10 },
  { judul: "Wali kelas (otomatis dari lembar Staf)", lebar: 34 },
  { judul: "Guru BK pendamping", lebar: 30, ket: "Nama Guru BK yang memegang kelas ini." },
  { judul: "Jumlah siswa", lebar: 12 },
  { judul: "Sudah screening", lebar: 14 },
  { judul: "Belum screening", lebar: 14 },
]);
barisContoh(kel, ["X.1", "X", "Rina Kartika, S.Pd.", "Laras Wulandari, S.Psi.", 28, 27, 1]);
const S = BARIS_SISWA + 2; // baris terakhir lembar Siswa
const nKelas = Math.max(KELAS_PILIHAN.length, 12);
for (let i = 0; i < nKelas; i++) {
  const n = i + 3;
  const r = kel.getRow(n);
  const kode = daftarKelas[i] || "";
  r.getCell(1).value = kode || null;
  r.getCell(2).value = { formula: `IF(A${n}="","",LEFT(A${n},FIND(".",A${n}&".")-1))` };
  // Nama wali kelas dari lembar Staf (baris berperan Wali Kelas dengan kelas binaan ini). Ditambah ""
  // supaya sel nama yang masih kosong tidak tampil sebagai 0.
  const akhirStaf = BARIS_STAF + 2;
  const cariWali =
    "IFERROR(INDEX('2. Staf'!$B$3:$B$" + akhirStaf + ",MATCH(1,INDEX(('2. Staf'!$C$3:$C$" + akhirStaf +
    "=\"Wali Kelas\")*('2. Staf'!$D$3:$D$" + akhirStaf + "=A" + n + "),0),0))&\"\",\"\")";
  r.getCell(3).value = {
    formula: "IF(A" + n + "=\"\",\"\",IF(" + cariWali + "=\"\",\"Belum ada wali kelas\"," + cariWali + "))",
  };
  r.getCell(5).value = { formula: `IF(A${n}="","",COUNTIFS('4. Siswa'!$H$3:$H$${S},A${n},'4. Siswa'!$E$3:$E$${S},"<>"))` };
  r.getCell(6).value = { formula: `IF(A${n}="","",COUNTIFS('4. Siswa'!$H$3:$H$${S},A${n},'4. Siswa'!$I$3:$I$${S},"Sudah"))` };
  r.getCell(7).value = { formula: `IF(A${n}="","",E${n}-F${n})` };
  for (let k = 1; k <= 7; k++) font(r.getCell(k));
  warnai(r.getCell(1), kode ? SUDAH : ISI);
  warnai(r.getCell(4), ISI);
  if (!kode) daftar(r.getCell(1), "Kelas");
}

// ---------- 4. Siswa ----------
const sis = wb.addWorksheet("4. Siswa");
const KOL_SISWA = [
  { judul: "No", lebar: 6 },
  { judul: "NIS", lebar: 14, ket: "Nomor Induk Siswa dari sekolah. Wajib, tidak boleh sama antar siswa." },
  { judul: "NISN", lebar: 14, ket: "10 digit. Isi bila ada." },
  { judul: "Catatan data", lebar: 34 },
  { judul: "Nama lengkap", lebar: 34 },
  { judul: "L/P", lebar: 6 },
  { judul: "Tanggal lahir", lebar: 14 },
  { judul: "Kelas", lebar: 9 },
  { judul: "Status screening", lebar: 12 },
  { judul: "Nama orang tua/wali", lebar: 30 },
  { judul: "Hubungan", lebar: 10 },
  { judul: "WhatsApp orang tua (62...)", lebar: 18 },
  { judul: "Email orang tua", lebar: 28 },
  { judul: "Persetujuan orang tua", lebar: 12, ket: "Sudah bila orang tua setuju hasil screening dibuka di aplikasi." },
  { judul: "Akun aplikasi untuk siswa?", lebar: 12, ket: "Ya bila siswa (remaja) ikut membuka hasil dan misinya sendiri." },
  { judul: "Username siswa (diisi Fammi)", lebar: 20, fammi: true },
  { judul: "Username orang tua (diisi Fammi)", lebar: 20, fammi: true },
];
kepala(sis, KOL_SISWA);
barisContoh(sis, ["Contoh", "2526001", "0112345678", "", "AISYAH PUTRI RAMADHANI", "P", new Date(Date.UTC(2010, 2, 14)), "X.1", "Sudah", "Dewi Lestari", "Ibu", "6281234567890", "dewi.lestari@gmail.com", "Sudah", "Ya", "", ""]);
sis.getRow(2).getCell(7).numFmt = "dd/mm/yyyy";
for (let i = 0; i < BARIS_SISWA; i++) {
  const n = i + 3;
  const r = sis.getRow(n);
  const s = siswa[i];
  r.getCell(1).value = i + 1;
  font(r.getCell(1), { color: { argb: "FF7C7689" } });
  for (let k = 2; k <= 17; k++) {
    font(r.getCell(k));
    warnai(r.getCell(k), k >= 16 ? FAMMI : ISI);
  }
  r.getCell(2).numFmt = "@";
  r.getCell(3).numFmt = "@";
  r.getCell(12).numFmt = "@";
  r.getCell(7).numFmt = "dd/mm/yyyy";
  daftar(r.getCell(6), "Jenis kelamin");
  daftar(r.getCell(8), "Kelas");
  daftar(r.getCell(9), "Status screening");
  daftar(r.getCell(11), "Hubungan");
  daftar(r.getCell(14), "Persetujuan");
  daftar(r.getCell(15), "Ya/Tidak");
  r.getCell(7).dataValidation = {
    type: "date",
    operator: "between",
    allowBlank: true,
    formulae: [new Date(Date.UTC(1995, 0, 1)), new Date(Date.UTC(2025, 11, 31))],
    showErrorMessage: true,
    errorStyle: "warning",
    error: "Isi tanggal lahir sebagai tanggal, format hari/bulan/tahun.",
  };
  if (!s) continue;
  const catatan = [];
  r.getCell(5).value = s.nama;
  r.getCell(6).value = s.jk || null;
  r.getCell(8).value = s.kelas;
  r.getCell(9).value = s.status;
  [5, 6, 8, 9].forEach((k) => warnai(r.getCell(k), SUDAH));
  if (s.tgl instanceof Date) {
    r.getCell(7).value = s.tgl;
    warnai(r.getCell(7), SUDAH);
  } else {
    warnai(r.getCell(7), CEK);
    catatan.push(s.tgl ? `Tanggal lahir di data screening "${s.tgl.teks}", mohon diisi ulang` : "Tanggal lahir belum ada");
  }
  if (s.ganda) catatan.push("Nama ini muncul 2 kali di data screening, pastikan satu orang");
  if (s.status === "Belum") catatan.push("Belum mengisi screening");
  if (catatan.length) {
    r.getCell(4).value = catatan.join("; ");
    warnai(r.getCell(4), CEK);
  } else {
    warnai(r.getCell(4), "FFFFFFFF");
  }
  r.getCell(4).alignment = { wrapText: true, vertical: "top" };
}
sis.autoFilter = { from: "A1", to: "Q1" };

// ---------- 5. Cek Kelengkapan ----------
const cek = wb.addWorksheet("5. Cek Kelengkapan");
kepala(cek, [
  { judul: "Pemeriksaan", lebar: 56 },
  { judul: "Jumlah", lebar: 12 },
  { judul: "Status", lebar: 18 },
]);
const SIS = (k) => `'4. Siswa'!$${k}$3:$${k}$${S}`;
const STF = (k) => `'2. Staf'!$${k}$3:$${k}$${BARIS_STAF + 2}`;
const KLS = (k) => `'3. Kelas'!$${k}$3:$${k}$${nKelas + 2}`;
const PEMERIKSAAN = [
  ["Isian Profil Sekolah yang masih kosong", `COUNTBLANK('1. Profil Sekolah'!$B$2:$B$${BARIS_PROFIL_AKHIR})`],
  ["Jumlah siswa terdaftar", `COUNTIF(${SIS("E")},"?*")`, "info"],
  ["Siswa tanpa NIS", `COUNTIFS(${SIS("E")},"?*",${SIS("B")},"")`],
  ["NIS yang dipakai lebih dari satu siswa", `SUMPRODUCT((${SIS("B")}<>"")*(COUNTIF(${SIS("B")},${SIS("B")})>1))`],
  ["Siswa tanpa tanggal lahir yang valid", `COUNTIFS(${SIS("E")},"?*",${SIS("G")},"")+SUMPRODUCT((${SIS("E")}<>"")*ISTEXT(${SIS("G")}))`],
  ["Siswa tanpa kelas", `COUNTIFS(${SIS("E")},"?*",${SIS("H")},"")`],
  ["Siswa tanpa nama orang tua/wali", `COUNTIFS(${SIS("E")},"?*",${SIS("J")},"")`],
  ["Siswa tanpa WhatsApp orang tua", `COUNTIFS(${SIS("E")},"?*",${SIS("L")},"")`],
  ["Siswa yang persetujuan orang tuanya belum Sudah", `COUNTIF(${SIS("E")},"?*")-COUNTIFS(${SIS("E")},"?*",${SIS("N")},"Sudah")`],
  ["Kelas tanpa wali kelas", `COUNTIF(${KLS("C")},"Belum ada wali kelas")`],
  ["Kelas tanpa Guru BK pendamping", `COUNTIFS(${KLS("A")},"?*",${KLS("D")},"")`],
  ["Staf tanpa email", `COUNTIFS(${STF("B")},"?*",${STF("E")},"")`],
  ["Staf tanpa WhatsApp", `COUNTIFS(${STF("B")},"?*",${STF("F")},"")`],
  ["Baris peran yang belum diberi nama staf", `COUNTIFS(${STF("C")},"?*",${STF("B")},"")`],
];
PEMERIKSAAN.forEach(([judul, rumus, jenis], i) => {
  const n = i + 2;
  const r = cek.getRow(n);
  r.getCell(1).value = judul;
  r.getCell(2).value = { formula: rumus };
  r.getCell(3).value = jenis === "info" ? "Informasi" : { formula: `IF(B${n}=0,"Lengkap","Belum lengkap")` };
  [1, 2, 3].forEach((k) => font(r.getCell(k), k === 1 ? {} : { bold: true }));
});
const akhirCek = PEMERIKSAAN.length + 3;
cek.getCell(`A${akhirCek}`).value = "Siap dikirim ke Fammi?";
cek.getCell(`B${akhirCek}`).value = {
  formula: `IF(COUNTIF($C$2:$C$${PEMERIKSAAN.length + 1},"Belum lengkap")=0,"Siap","Belum")`,
};
font(cek.getCell(`A${akhirCek}`), { bold: true, size: 12 });
font(cek.getCell(`B${akhirCek}`), { bold: true, size: 12, color: { argb: UNGU } });
cek.getCell(`A${akhirCek + 1}`).value =
  "Status Lengkap/Belum lengkap dihitung otomatis dari lembar 1 sampai 4. Baris contoh (baris 2) tidak ikut dihitung.";
font(cek.getCell(`A${akhirCek + 1}`), { italic: true, color: { argb: "FF7C7689" } });
cek.addConditionalFormatting({
  ref: `C2:C${PEMERIKSAAN.length + 1}`,
  rules: [
    { type: "containsText", operator: "containsText", text: "Belum", style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: CEK } }, font: { color: { argb: "FFB71C1C" } } }, priority: 1 },
    { type: "containsText", operator: "containsText", text: "Lengkap", style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: SUDAH } }, font: { color: { argb: "FF236F1A" } } }, priority: 2 },
  ],
});

buatPilihan();

wb.xlsx.writeFile(keluaran).then(() => {
  console.log(`tersimpan: ${keluaran}`);
  console.log(`siswa: ${siswa.length}, kelas: ${daftarKelas.length}, catatan: ${catatanData.length}`);
});
