import { KARAKTER_PENCAPAIAN_BAIK, KARAKTER_BAR_TONE_CUTOFF } from "../../lib/cutoffs";

// Warna spoke aspek karakter, dipetakan dari token --dv-1..--dv-6 (tokens.css).
// Aspek sendiri (label, urutan) datang dari tabel karakter_aspek_config, bukan hardcode di sini,
// karena aspek Karakter custom per sekolah.
const ASPEK_COLOR_VARS = ["--dv-1", "--dv-2", "--dv-3", "--dv-4", "--dv-5", "--dv-6"];

/** Tempel warna spoke ke daftar aspek (hasil query karakter_aspek_config, urut by urutan). */
export function withAspekColor(aspekRows = []) {
  return aspekRows.map((a, i) => ({
    ...a,
    color: `var(${ASPEK_COLOR_VARS[i % ASPEK_COLOR_VARS.length]})`,
  }));
}

/**
 * Fallback label paling akhir aspek karakter, dipakai cuma kalau aspekLabelFromRingkasan (lihat
 * di bawah) juga tidak menemukan apa-apa -- misal karakter_summary belum ada sama sekali untuk
 * sekolah itu. "Karakter 1", "Karakter 2" dst, bukan label sungguhan.
 */
export function aspekFallbackLabel(aspekKode) {
  const n = String(aspekKode || "").match(/\d+/)?.[0];
  return n ? `Karakter ${n}` : String(aspekKode || "Aspek");
}

/**
 * Gabungkan daftar aspek dari karakter_aspek_config (label/urutan sudah diatur admin) dengan
 * kode aspek yang benar-benar ada di data skor sekolah itu untuk periode berjalan. Sekolah baru
 * yang belum sempat dikonfigurasi admin-nya (karakter_aspek_config kosong/tidak lengkap) dulu
 * kehilangan seluruh bagian "Skor per Aspek" biarpun skornya sendiri sudah lengkap ter-upload --
 * sekarang aspek yang datanya ada tapi belum dikonfigurasi tetap tampil. labelResolver(kode)
 * opsional dipanggil dulu untuk cari label asli (lihat aspekLabelFromRingkasan); kalau itu juga
 * tidak ketemu, baru jatuh ke aspekFallbackLabel yang generik.
 */
/**
 * Sempitkan baris karakter_aspek_config ke satu jenjang.
 *
 * Sejak migration 20260828110000, satu sekolah bisa punya "karakter3" yang berbeda di tiap
 * jenjang. Memakai seluruh baris config apa adanya berarti nama Kelas 1 ikut menamai kolom
 * karakter3 milik Kelas 6, padahal itu hampir pasti karakter yang berbeda -- cacat yang sama
 * persis dengan yang sudah pernah kena di dashboard YPT (commit 4e3ab49), cuma di dalam satu
 * sekolah.
 *
 * Baris '*' dipakai sebagai CADANGAN, bukan tambahan: sekolah yang namanya sudah diisi sebelum
 * migration itu semuanya tersimpan di '*', dan tanpa cadangan ini nama yang sudah benar akan
 * hilang dari tampilan pada hari migration dijalankan. Kalau jenjangnya punya baris sendiri,
 * baris itu yang menang.
 */
export function aspekConfigJenjang(aspekConfig, jenjang) {
  const list = Array.isArray(aspekConfig) ? aspekConfig : [];
  const byKode = new Map();
  list.filter((a) => (a.jenjang ?? "*") === "*").forEach((a) => byKode.set(a.aspek_kode, a));
  if (jenjang && jenjang !== "*") {
    list.filter((a) => a.jenjang === jenjang).forEach((a) => byKode.set(a.aspek_kode, a));
  }
  return [...byKode.values()].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
}

/** Versi indikator dari aspekConfigJenjang, dengan kunci yang sama seperti yang dipakai
 * pemanggil (`${aspek_kode}_${indikator_kode}`). */
export function indikatorConfigJenjang(indikatorConfig, jenjang) {
  const list = Array.isArray(indikatorConfig) ? indikatorConfig : [];
  const byKunci = new Map();
  list.filter((a) => (a.jenjang ?? "*") === "*").forEach((a) => byKunci.set(`${a.aspek_kode}_${a.indikator_kode}`, a));
  if (jenjang && jenjang !== "*") {
    list.filter((a) => a.jenjang === jenjang).forEach((a) => byKunci.set(`${a.aspek_kode}_${a.indikator_kode}`, a));
  }
  return [...byKunci.values()];
}

export function resolveAspekList(aspekConfig, aspekKodeHadir, labelResolver) {
  const list = Array.isArray(aspekConfig) ? aspekConfig : [];
  const hadir = aspekKodeHadir instanceof Set ? aspekKodeHadir : new Set(aspekKodeHadir || []);
  const byKode = new Map(list.map((a) => [a.aspek_kode, a]));
  let urutanExtra = list.reduce((m, a) => Math.max(m, a.urutan || 0), 0);
  hadir.forEach((kode) => {
    if (!byKode.has(kode)) {
      urutanExtra += 1;
      const label = (labelResolver && labelResolver(kode)) || aspekFallbackLabel(kode);
      byKode.set(kode, { aspek_kode: kode, aspek_label: label, urutan: urutanExtra });
    }
  });
  return [...byKode.values()].sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
}

/**
 * Kode aspek karakter ("karakter1", "karakter2", dst) yang benar-benar ada di kolom ringkasan
 * (karakter_summary.ringkasan), dicari lewat pola "karakterN_" di mana pun ia muncul dalam nama
 * kolom -- prefix-nya sendiri beda-beda tergantung level data (input_guru_ untuk kelas,
 * rata_input_guru_/rata_input_orangtua_ untuk jenjang/sekolah), jadi dicari tanpa peduli
 * prefixnya apa. Dipakai untuk melengkapi daftar aspek lewat resolveAspekList di atas.
 */
export function aspekKodeFromRingkasan(ringkasan) {
  if (!ringkasan) return [];
  const found = new Set();
  Object.keys(ringkasan).forEach((k) => {
    const m = k.match(/(karakter\d+)_/i);
    if (m) found.add(m[1].toLowerCase());
  });
  return [...found];
}

/**
 * Label asli satu aspek, digali dari nama kolom mentah di karakter_summary.ringkasan (mis.
 * "input_guru_karakter1_berpikir_positif") -- kolom ini masih menyimpan nama kolom Excel APA
 * ADANYA (lihat pushSummary di karakterImporter.js, cuma spread objek row mentah), beda dari
 * karakter_skor.aspek_kode yang cuma menyimpan kode pendek "karakter1" tanpa suffix labelnya.
 * Potong prefix apa pun sebelum "karakterN_" (macam-macam tergantung level data) dan suffix
 * "karakterN_" itu sendiri, sisanya ganti underscore jadi spasi dan huruf besar tiap kata --
 * "karakter1_berpikir_positif" jadi "Berpikir Positif". Sama persis polanya dengan
 * indikatorFallbackLabel di bawah, cuma untuk aspek. Kolom indikator ("karakterN_indikatorM_...")
 * sengaja dikecualikan supaya tidak salah kepotong jadi label aspek.
 */
export function aspekLabelFromRingkasan(ringkasan, aspekKode) {
  if (!ringkasan || !aspekKode) return null;
  const re = new RegExp(`(?:^|_)${aspekKode}_(?!indikator)(.+)$`, "i");
  const key = Object.keys(ringkasan).find((k) => re.test(k));
  if (!key) return null;
  const suffix = key.match(re)[1];
  const label = suffix
    .split("_")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
  return label || null;
}

/**
 * "87 %" / "87%" / 87 / "84,67 %" (format Indonesia, koma desimal) → 87 / 85 (number).
 * Null kalau tidak bisa diparse. parseFloat murni BERHENTI di karakter koma tanpa error
 * ("84,67" -> 84, bukan 84.67) -- kalau tidak dikonversi ke titik dulu, nilai kayak
 * "84,67 %" kepotong diam-diam jadi 84 alih-alih dibulatkan semestinya ke 85. Ini ditemukan
 * dari data sungguhan (ringkasan jenjang KB TK Istiqamah pakai koma desimal untuk
 * rata_pencapaian_orangtua), bukan cuma teori.
 */
export function pct(v) {
  if (v === null || v === undefined || v === "") return null;
  // Kolom persentase di sheet summary_kelas/summary_jenjang/summary_sekolah kadang diformat
  // sebagai "Percentage" di Excel (bukan diketik manual sebagai teks "91 %"), sehingga xlsx.js
  // membaca NILAI SEL asli 0.91, bukan teks yang tertampil "91%" -- ditemukan di karakter_summary
  // SMK Telkom Purwokerto (rata_rata_pencapaian_guru tersimpan 0.91, membuat pct() lama
  // membulatkannya jadi "1%"). Baris lain di file yang sama (skor per murid) tidak kena masalah
  // ini karena tersimpan sebagai teks "91 %", bukan angka Excel -- lihat pengecekan di bawah.
  //
  // Nilai numerik murni non-integer di rentang (0, 1) TIDAK MUNGKIN berasal dari kolom skor asli
  // (karakter_skor.skor / karakter_skor_indikator.skor kolom Postgres int, cuma bisa bilangan
  // bulat), jadi aman ditafsir sebagai pecahan Excel dan dikali 100. Titik v === 1 satu-satunya
  // yang ambigu (bisa berarti "100%" pecahan ATAU skor asli persis 1) -- dalam data karakter yang
  // ada, pencapaian 100% jauh lebih umum daripada skor asli 1, jadi ditafsir sebagai 100%.
  if (typeof v === "number") {
    if (v > 0 && v < 1) return Math.round(v * 100);
    if (v === 1) return 100;
    return Math.round(v);
  }
  const n = parseFloat(String(v).replace("%", "").replace(",", ".").trim());
  return Number.isFinite(n) ? Math.round(n) : null;
}

/** Fraksi 0..1 (dari kolom ringkasan seperti perasaan_positif, dukungan_konsultasi_ringan) → persen bulat. */
export function fracToPct(v) {
  if (v === null || v === undefined || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/**
 * ringkasan karakter_summary menyimpan kolom seperti
 * "input_guru_karakter1_berpikir_positif" — cari nilai untuk satu aspek_kode
 * tanpa perlu tahu suffix labelnya persis.
 */
export function ringkasanAspekValue(ringkasan, aspekKode, prefix = "input_guru_") {
  if (!ringkasan) return null;
  const key = Object.keys(ringkasan).find((k) => k.startsWith(`${prefix}${aspekKode}_`));
  return key ? pct(ringkasan[key]) : null;
}

/** Rata-rata skor aspek untuk satu prefix ringkasan (mis. rata_input_guru_ / rata_input_orangtua_). */
export function avgAspek(ringkasan, aspek, prefix) {
  const vals = (aspek || []).map((a) => ringkasanAspekValue(ringkasan, a.aspek_kode, prefix)).filter((v) => v != null);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

/** "89" → "89%"; null → "—". */
export function persen(v) {
  return v == null ? "—" : `${v}%`;
}

/** top5_siswa_tertinggi ("Nama1\nNama2\n...") + top5_nilai_siswa_tertinggi ("100%\n98%\n...") → pasangan. */
export function parseTop5Pair(namaStr, nilaiStr) {
  // Pasangkan per indeks baris DULU, baru buang pasangan yang dua-duanya kosong -- kalau
  // masing-masing sisi difilter kosong secara terpisah sebelum dipasangkan, satu baris kosong
  // di tengah salah satu sisi (mis. nama urutan ke-3 tidak tercatat) menggeser semua pasangan
  // setelahnya, memasangkan nama yang salah dengan nilai yang salah.
  const namaList = String(namaStr || "").split("\n").map((s) => s.trim());
  const nilaiList = String(nilaiStr || "").split("\n").map((s) => s.trim());
  const len = Math.max(namaList.length, nilaiList.length);
  const pairs = [];
  for (let i = 0; i < len; i++) {
    const nama = namaList[i] || "";
    const nilai = nilaiList[i] || "";
    if (nama || nilai) pairs.push({ nama, nilai });
  }
  return pairs;
}

/** top5_indikator_terbaik/terendah tersimpan sebagai string JSON. Parse dengan aman. */
export function parseTop5Indikator(raw) {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => ({ label: x.pencapaian, nilai: x.nilai }));
  } catch {
    return [];
  }
}

/** Ambil periode_id terbesar (format 'YYYY-MM' sortable lexicographic) dari kumpulan baris. */
export function latestPeriode(rows = [], key = "periode_id") {
  return rows.reduce((max, r) => (!max || r[key] > max ? r[key] : max), null);
}

/**
 * Selisih titik terakhir vs sebelumnya dari deret { periode, rata }. Null kalau data
 * kurang dari 2 titik, supaya tidak pernah menampilkan delta hasil karangan.
 */
export function deltaVsPrevious(points = []) {
  if (points.length < 2) return null;
  const value = points[points.length - 1].rata - points[points.length - 2].rata;
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  return { value, direction };
}

/** "2026-05" → "Mei 2026" supaya enak dibaca. */
const BULAN_ID = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
/**
 * Tahun ajaran dari periode bulanan: "2026-08" -> "2026/2027".
 *
 * Batasnya Juli, berlaku untuk SELURUH sekolah (keputusan pemilik produk 2026-08-28):
 * Juli 2025 sampai Juni 2026 = tahun ajaran 2025/2026. Bukan setelan per sekolah, jadi tidak ada
 * yang perlu dikonfigurasi dan tidak ada yang bisa salah setel.
 *
 * Diturunkan dari periode_id, BUKAN kolom baru di berkas upload. Kolom tambahan berarti satu
 * lagi yang bisa salah isi, dan kita sudah melihat bagaimana kolom bulan sendiri bisa kacau di
 * berkas nyata. Turunan tidak bisa berselisih dengan bulannya sendiri.
 *
 * Kembalikan null untuk periode yang tidak berbentuk "YYYY-MM", supaya pemanggil bisa
 * memperlakukannya terpisah alih-alih mendapat tahun ajaran karangan.
 */
export function tahunAjaran(periodeId) {
  const m = String(periodeId || "").match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const tahun = Number(m[1]);
  const bulan = Number(m[2]);
  if (bulan < 1 || bulan > 12) return null;
  const mulai = bulan >= 7 ? tahun : tahun - 1;
  return `${mulai}/${mulai + 1}`;
}

/**
 * Saring titik tren ke tahun ajaran yang sama dengan periode yang sedang dilihat.
 *
 * Tanpa ini, grafik menyambungkan Oktober 2025 langsung ke Agustus 2026 sebagai satu garis
 * perkembangan, padahal itu dua tahun ajaran: kerangka karakternya bisa berbeda, dan anak yang
 * dulu Kelas 1 sekarang Kelas 2. Garis yang menghubungkan keduanya membaca seperti "naik 1 poin"
 * padahal yang dibandingkan bukan hal yang sama. Terlaporkan dari produksi 2026-08-28.
 *
 * Datanya tidak dibuang, cuma tidak digambar di tahun ajaran yang sedang dibuka. Pilih bulan dari
 * tahun ajaran lain di pemilih periode, dan grafiknya ikut berpindah.
 *
 * Periode aktif yang tidak dikenali bentuknya membuat penyaring ini tidak melakukan apa-apa,
 * supaya data lama tidak hilang gara-gara satu nilai periode yang aneh.
 */
export function titikSetahunAjaran(points, periodeAktif) {
  const ta = tahunAjaran(periodeAktif);
  if (!ta) return points || [];
  return (points || []).filter((p) => tahunAjaran(p.periode) === ta);
}

export function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const [y, m] = String(periodeId).split("-");
  const bulan = BULAN_ID[Number(m)] || m;
  return `${bulan} ${y}`;
}

/**
 * Fallback label indikator kalau sekolah itu belum punya baris karakter_indikator_config
 * (belum ada label manual dari admin). Tanpa ini, layar Wali Kelas/Yayasan menampilkan kode
 * mentah kolom Excel apa adanya ("karakter1_indikator2_melihat_sisi_baik") -- kode itu memang
 * sengaja dipakai APA ADANYA sebagai indikator_kode di DB (lihat komentar resolveIndikatorCols
 * di karakterImporter.js), tapi tidak pernah dimaksudkan untuk tampil ke pengguna. Buang
 * prefix "karakterN_" dan "indikatorM_", sisanya jadi "Melihat Sisi Baik".
 */
export function indikatorFallbackLabel(aspekKode, indikatorKode) {
  const gabung = `${aspekKode || ""}_${indikatorKode || ""}`;
  const bersih = gabung.replace(/^karakter\d+_/i, "").replace(/^indikator\d+_/i, "");
  return bersih
    .split("_")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ") || gabung;
}

/**
 * Emoji ikon per aspek karakter, dicocokkan lewat kata kunci di labelnya supaya tetap
 * jalan untuk aspek custom sekolah lain di masa depan (bukan hardcode per sekolah).
 */
export function aspekIcon(label = "") {
  const l = label.toLowerCase();
  if (l.includes("positif") || l.includes("optimis")) return "🌟";
  if (l.includes("bicara") || l.includes("kata") && l.includes("baik")) return "💬";
  if (l.includes("tindak") || l.includes("manfaat")) return "🤝";
  if (l.includes("maaf")) return "🙏";
  if (l.includes("terima kasih") || l.includes("syukur")) return "🙌";
  if (l.includes("wudhu") || l.includes("fiqih") || l.includes("ibadah")) return "💧";
  if (l.includes("disiplin")) return "⏰";
  if (l.includes("jujur")) return "🎯";
  if (l.includes("tanggung")) return "🧭";
  return "✨";
}

/**
 * Klasifikasi kelas/aspek jadi "baik" (sudah bagus) atau "perlu_perhatian". Null (tidak ada
 * data) BUKAN "perlu_perhatian" — beda kasus. Cutoff-nya masih sementara, lihat cutoffs.js.
 */
export const CLASSIFY_TONE = { baik: "aman", perlu_perhatian: "perhatian" };
export function classifyPencapaian(value) {
  const v = pct(value);
  if (v === null) return null;
  return v >= KARAKTER_PENCAPAIAN_BAIK ? "baik" : "perlu_perhatian";
}

/**
 * Tiga tingkat warna untuk bar skor, sesuai palet status Fammi: hijau (bagus),
 * kuning (perlu perhatian), merah (waspada, hanya untuk skor sungguh rendah supaya
 * merah tetap berarti peringatan, bukan hiasan). Cutoff-nya masih sementara, lihat cutoffs.js.
 */
export function classifyBarTone(value) {
  const v = pct(value);
  if (v === null) return null;
  if (v >= KARAKTER_BAR_TONE_CUTOFF.aman) return "aman";
  if (v >= KARAKTER_BAR_TONE_CUTOFF.perhatian) return "perhatian";
  return "waspada";
}

/**
 * Kelompokkan tindak_lanjut yang sudah disetujui jadi 3 bucket tampilan, murni reklasifikasi
 * client-side dari data yang ada (tidak mengubah data/Gemini). scope="kelas" yang scope_id-nya
 * cocok dengan salah satu kelas dipetakan lewat pencapaian kelas itu; sisanya (scope="sekolah"
 * atau kelas yang sudah tidak ada) masuk "lainnya" sebagai default aman.
 */
export function groupTindakLanjut(tindakLanjut = [], kelas = []) {
  const kelasByScopeId = new Map(kelas.map((k) => [k.scope_id, k]));
  const buckets = { baik: [], perlu_perhatian: [], lainnya: [] };

  for (const r of tindakLanjut) {
    if (r.scope === "kelas" && kelasByScopeId.has(r.scope_id)) {
      const k = kelasByScopeId.get(r.scope_id);
      const kelasTone = classifyPencapaian(k.ringkasan?.rata_rata_pencapaian_guru);
      // classifyPencapaian mengembalikan null kalau kelas itu belum ada data pencapaian --
      // itu BUKAN "perlu_perhatian" (lihat catatan di classifyPencapaian sendiri), jadi jangan
      // ikut ditumpuk ke bucket itu, biar tidak dikira kelas bermasalah padahal cuma kosong.
      if (kelasTone === "baik") buckets.baik.push(r);
      else if (kelasTone === "perlu_perhatian") buckets.perlu_perhatian.push(r);
      else buckets.lainnya.push(r);
    } else {
      buckets.lainnya.push(r);
    }
  }
  return buckets;
}

/**
 * karakter_pernyataan_ortu.pernyataan kadang tersimpan sebagai JSON rich-text (Slate.js) dari
 * batch upload tertentu, bukan cuma teks polos -- ekstrak teksnya biar tidak tampil JSON mentah.
 * Kalau bukan JSON (mayoritas baris, teks polos biasa), kembalikan apa adanya.
 */
export function extractPlainText(raw) {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed.startsWith("{")) return trimmed;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed?.type === "slate" && parsed.root) {
      const walk = (node) => {
        if (!node) return "";
        if (typeof node.text === "string") return node.text;
        if (Array.isArray(node.children)) return node.children.map(walk).join("");
        return "";
      };
      return walk(parsed.root).trim();
    }
  } catch {
    // bukan JSON valid, anggap teks polos
  }
  return trimmed;
}

/**
 * kategori_pernyataan/dukungan_dibutuhkan/hal_disyukuri di karakter_pernyataan_ortu adalah field
 * multi-pilih yang disimpan sebagai satu string gabungan koma. Beberapa OPSI-nya sendiri
 * mengandung koma di dalam tanda kurung (mis. "grup WhatsApp, form umpan balik, dll."), jadi
 * split-by-comma polos tidak aman -- cocokkan tiap opsi yang sudah diketahui (dari data asli)
 * sebagai substring, bukan menebak batas token.
 */
// Data siswa SMK Telkom Purwokerto punya kategori "Keluhan" (204 baris) yang sebelumnya tidak
// dikenali sama sekali oleh daftar ini (cuma kenal "Kritik" dari data orang tua). Keputusan
// produk (docs/karakter-multi-sumber-refleksi-plan.md fase 0 nomor 3): satu bucket tampilan,
// label "Kritik & Keluhan" -- makanya entri "Kritik" yang lama diganti labelnya, dan entri kedua
// "Keluhan" ditambah dengan label PERSIS sama supaya countMultiValue menjumlahkan keduanya lewat
// key counts yang sama (lihat komentar dedup di countMultiValue di bawah). Dicek terhadap data
// asli: "Kritik" (orang tua) dan "Keluhan" (siswa) tidak pernah muncul bersamaan di baris yang
// sama (beda sumber data), jadi tidak ada risiko satu baris dihitung dobel oleh dua entri ini.
export const KATEGORI_PERNYATAAN_OPTIONS = [
  { match: "Ucapan Terimakasih", label: "Apresiasi", icon: "⭐⭐⭐⭐⭐" },
  { match: "Harapan", label: "Harapan", icon: "🌱" },
  { match: "Saran dan Masukan", label: "Saran & Masukan", icon: "💡" },
  { match: "Kritik", label: "Kritik & Keluhan", icon: "⚠️" },
  { match: "Keluhan", label: "Kritik & Keluhan", icon: "⚠️" },
];

export const DUKUNGAN_OPTIONS = [
  { match: "Kelas parenting tematik (misalnya: atasi tantrum, susah makan, screen time, dsb.)", label: "Kelas/seminar parenting tematik", icon: "🎓" },
  { match: "Konsultasi ringan dengan guru secara pribadi (jika anak punya kesulitan khusus)", label: "Konsultasi pribadi dengan guru", icon: "🗣️" },
  { match: "Panduan sederhana untuk membantu pembiasaan anak di rumah", label: "Panduan pembiasaan di rumah", icon: "📘" },
  { match: "Rekomendasi aktivitas bermain yang bermakna (tanpa screen time berlebihan)", label: "Rekomendasi aktivitas bermain", icon: "🎲" },
  { match: "Wadah komunikasi dua arah yang lebih fleksibel (grup WhatsApp, form umpan balik, dll.)", label: "Wadah komunikasi dua arah", icon: "💬" },
  { match: "Sesi diskusi reflektif bareng guru atau orangtua lain (berbagi pengalaman)", label: "Diskusi reflektif dengan orang tua lain", icon: "🤝" },
  { match: "Saya belum tahu pasti, tapi ingin ikut terlibat lebih aktif bulan depan", label: "Ingin terlibat lebih aktif", icon: "🙋" },
  { match: "Tidak ada yang saya butuhkan saat ini", label: "Tidak butuh dukungan tambahan", icon: "✅" },
];

export const HAL_DISYUKURI_OPTIONS = [
  { match: "Melihat Ananda mulai tumbuh kebiasaan positif", label: "Kebiasaan Positif Tumbuh", icon: "🌱",
    full: "Melihat Ananda mulai tumbuh kebiasaan positif (misalnya: lebih mandiri, lebih ceria)" },
  { match: "Guru atau sekolah menunjukkan kepedulian", label: "Kepedulian Sekolah", icon: "🏫",
    full: "Guru atau sekolah menunjukkan kepedulian yang membuat saya lebih tenang" },
  { match: "Ada perubahan kecil pada Ananda yang membuat saya terharu", label: "Perubahan yang Menyentuh", icon: "🥹",
    full: "Ada perubahan kecil pada Ananda yang membuat saya terharu" },
  { match: "Ada momen kecil yang membuat saya merasa dekat kembali dengan Ananda", label: "Momen Lebih Dekat", icon: "❤️",
    full: "Ada momen kecil yang membuat saya merasa dekat kembali dengan Ananda" },
  { match: "Saya bersyukur karena bisa belajar lebih memahami Ananda", label: "Belajar Memahami Anak", icon: "📖",
    full: "Saya bersyukur karena bisa belajar lebih memahami Ananda" },
  { match: "bukan dari daftar di atas", label: "Hal Lain", icon: "✨",
    full: "Saya bersyukur, tapi bukan dari daftar di atas (hal lain yang tidak disebutkan)" },
  { match: "Saya merasa terbantu karena sekolah memberi perhatian yang konsisten", label: "Perhatian Konsisten", icon: "🤝",
    full: "Saya merasa terbantu karena sekolah memberi perhatian yang konsisten" },
  { match: "Saya belum merasakan hal tertentu", label: "Masih Berproses", icon: "🌤️",
    full: "Saya belum merasakan hal tertentu, tapi ingin tetap berproses" },
  { match: "Belum ada yang bisa syukuri di bulan ini", label: "Belum Ada Bulan Ini", icon: "🌧️",
    full: "Belum ada yang bisa syukuri di bulan ini" },
];

/**
 * Padanan DUKUNGAN_OPTIONS untuk sumber siswa, diekstrak dari data asli SMK Telkom Purwokerto
 * (kolom dukungan_yang_dibutuhkan_siswa, docs/karakter-multi-sumber-refleksi-plan.md 2.1).
 * Instrumen siswa punya diksi sendiri (versi "aku"), bukan sekadar terjemahan field orang tua.
 */
export const DUKUNGAN_OPTIONS_SISWA = [
  { match: "Kegiatan seru di sekolah (misalnya event, lomba, klub hobi)", label: "Kegiatan Seru Sekolah", icon: "🎉" },
  { match: "Rekomendasi aktivitas positif di luar sekolah (misalnya olahraga, seni, volunteering)", label: "Aktivitas Positif Luar Sekolah", icon: "🏀" },
  { match: "Bimbingan atau motivasi dari guru (supaya lebih semangat)", label: "Bimbingan dari Guru", icon: "🧑‍🏫" },
  { match: "Diskusi atau sharing bareng teman/guru tentang hal yang bikin penasaran", label: "Diskusi Bareng Teman/Guru", icon: "🗨️" },
  { match: "Tips belajar efektif dan manajemen waktu", label: "Tips Belajar & Waktu", icon: "⏱️" },
  { match: "Konsultasi pribadi dengan guru atau konselor (kalau ada masalah pribadi/sekolah)", label: "Konsultasi Pribadi", icon: "🗣️" },
  // Teks aslinya "Belum tahu, tapi ingin coba ikut kegiatan lebih aktif bulan depan" -- opsi ini
  // mengandung koma di tengah kalimat, dan di data mentah ia kadang tersimpan terpotong jadi dua
  // fragmen saat digabung dengan pilihan lain lewat pemisah koma (peninggalan cara multi-pilih
  // di-serialize di sisi form/export). Match penuh kalimat awal ("Belum tahu, ...") jadi tidak
  // bisa diandalkan selalu utuh di raw string; potongan setelah koma ini pasti utuh dan tidak
  // dipakai opsi lain, jadi aman dipakai sebagai substring pencocokan. Diverifikasi lewat
  // countMultiValue atas data asli: 193 baris cocok, nol baris tak dikenali.
  { match: "tapi ingin coba ikut kegiatan lebih aktif bulan depan", label: "Ingin Lebih Aktif", icon: "🙋" },
  { match: "Tidak ada yang saya butuhkan saat ini", label: "Tidak Butuh Dukungan", icon: "✅" },
];

/**
 * Padanan HAL_DISYUKURI_OPTIONS untuk sumber siswa (kolom hal_yang_disyukuri_siswa, data SMK
 * Telkom Purwokerto). `full` di sini kebetulan sama persis dengan `match` untuk sebagian besar
 * entri (teks aslinya sudah utuh tanpa perlu dipersingkat untuk pencocokan), kecuali entri
 * "Masih Berproses" yang alasannya sama seperti DUKUNGAN_OPTIONS_SISWA di atas (koma di tengah
 * kalimat bikin match penuh berisiko terpotong).
 */
export const HAL_DISYUKURI_OPTIONS_SISWA = [
  { match: "Ada perubahan positif kecil pada diriku (misalnya lebih rajin, lebih percaya diri)", label: "Perubahan Kecil Positif", icon: "🌱",
    full: "Ada perubahan positif kecil pada diriku (misalnya lebih rajin, lebih percaya diri)" },
  { match: "Aku merasa lebih mandiri (misalnya berani ambil keputusan sendiri)", label: "Lebih Mandiri", icon: "🧍",
    full: "Aku merasa lebih mandiri (misalnya berani ambil keputusan sendiri)" },
  { match: "Aku merasa lebih dekat dengan teman atau keluarga", label: "Lebih Dekat", icon: "❤️",
    full: "Aku merasa lebih dekat dengan teman atau keluarga" },
  { match: "Aku mulai bisa mengontrol emosi/masalah lebih baik", label: "Kontrol Emosi Lebih Baik", icon: "🧘",
    full: "Aku mulai bisa mengontrol emosi/masalah lebih baik" },
  { match: "Aku merasa lebih paham tentang diriku sendiri", label: "Lebih Paham Diri Sendiri", icon: "🪞",
    full: "Aku merasa lebih paham tentang diriku sendiri" },
  { match: "Guru atau sekolah peduli dan memberi perhatian pada aku", label: "Kepedulian Guru/Sekolah", icon: "🏫",
    full: "Guru atau sekolah peduli dan memberi perhatian pada aku" },
  // Sama seperti kasus "tapi ingin coba ikut..." di DUKUNGAN_OPTIONS_SISWA: teks asli "Aku belum
  // merasakan hal tertentu, tapi tetap ingin berproses" mengandung koma di tengah, jadi match
  // dipersempit ke potongan setelah koma yang pasti utuh dan unik. full tetap kalimat lengkapnya.
  { match: "tapi tetap ingin berproses", label: "Masih Berproses", icon: "🌤️",
    full: "Aku belum merasakan hal tertentu, tapi tetap ingin berproses" },
  { match: "Ada hal baik lain yang bikin aku bersyukur (tuliskan)", label: "Hal Baik Lainnya", icon: "✨",
    full: "Ada hal baik lain yang bikin aku bersyukur (tuliskan)" },
  { match: "Belum ada yang bisa aku syukuri bulan ini", label: "Belum Ada Bulan Ini", icon: "🌧️",
    full: "Belum ada yang bisa aku syukuri bulan ini" },
];

/** "0" dipakai sebagai penanda tidak ada jawaban di field ini -- jangan dihitung sebagai data. */
function isNoAnswer(raw) {
  return !raw || String(raw).trim() === "0";
}

/**
 * Field esai bebas (alasan_emosi, dukungan_lainnya) sering diisi placeholder seperti "-", "_",
 * "0", "Tidak ada" alih-alih esai sungguhan -- jangan ditampilkan seolah itu jawaban nyata.
 */
const BLANK_ESSAY_TOKENS = new Set(["", "-", "--", ".", "_", "0", "tidak ada", "tdk ada", "blm ada", "belum ada"]);
export function isBlankEssay(raw) {
  const text = extractPlainText(raw);
  if (!text) return true;
  const normalized = text.trim().replace(/^["“”]+|["“”]+$/g, "").trim().toLowerCase();
  return BLANK_ESSAY_TOKENS.has(normalized);
}

/** Normalisasi teks pilihan mentah dari form (spasi berlebih, jenis kutip beda) supaya
 * pencocokan .includes() tidak gagal cuma karena beda spasi/kutip, bukan beda makna. */
function normalizeChoiceText(s) {
  return String(s || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Hitung berapa baris yang menyebut tiap opsi (satu baris bisa kena banyak opsi sekaligus). */
export function countMultiValue(rows, field, options) {
  const normOptions = options.map((o) => ({ ...o, matchNorm: normalizeChoiceText(o.match) }));
  const counts = Object.fromEntries(options.map((o) => [o.label, 0]));
  let totalWithAnswer = 0;
  rows.forEach((r) => {
    const raw = r[field];
    if (isNoAnswer(raw)) return;
    totalWithAnswer++;
    const rawNorm = normalizeChoiceText(raw);
    let matched = false;
    // Satu baris menambah hitungan sebuah bucket paling banyak satu kali. Ini baru terasa sejak
    // dua opsi boleh berbagi label ("Kritik" dan "Keluhan" sama-sama bucket "Kritik & Keluhan"):
    // responden yang mencentang dua-duanya akan terhitung ganda di bucket yang sama kalau tidak
    // dijaga di sini, membuat total bucket bisa melebihi jumlah responden.
    const labelTerhitung = new Set();
    normOptions.forEach((o) => {
      if (!rawNorm.includes(o.matchNorm)) return;
      matched = true;
      if (labelTerhitung.has(o.label)) return;
      labelTerhitung.add(o.label);
      counts[o.label]++;
    });
    if (!matched && import.meta.env.DEV) {
      console.warn(`[karakterMeta] Opsi "${field}" tidak dikenali salah satu daftar option: "${raw}"`);
    }
  });
  // Dua opsi boleh berbagi label yang sama (mis. "Kritik" dan "Keluhan" sama-sama masuk bucket
  // "Kritik & Keluhan" di KATEGORI_PERNYATAAN_OPTIONS) supaya cocok di salah satu teks saja sudah
  // cukup menambah hitungan bucket gabungan -- counts di atas sudah menjumlahkan itu dengan benar
  // lewat key yang sama. Tapi kalau items dibentuk polos dari options.map, dua opsi berlabel sama
  // menghasilkan DUA entri objek dengan label dan count yang identik, dan pemanggil (StatBarMiniList
  // dkk di KarakterShared.jsx) akan menampilkan bucket itu dua kali. Dedup by label di sini
  // menjaga array items tetap satu entri per bucket tampilan, icon diambil dari kemunculan
  // pertama. Pemanggil lama semuanya pakai opsi berlabel unik, jadi dedup ini tidak pernah kena
  // untuk mereka -- perilakunya identik dengan sebelumnya.
  const seenLabel = new Set();
  const items = [];
  options.forEach((o) => {
    if (seenLabel.has(o.label)) return;
    seenLabel.add(o.label);
    items.push({ label: o.label, icon: o.icon, count: counts[o.label] });
  });
  return { items, totalWithAnswer };
}

/** Opsi (dari daftar options manapun) yang cocok untuk satu nilai field multi-pilih mentah. */
export function matchedOptions(raw, options) {
  if (isNoAnswer(raw)) return [];
  const rawNorm = normalizeChoiceText(raw);
  return options.filter((o) => rawNorm.includes(normalizeChoiceText(o.match)));
}

/** Opsi kategori_pernyataan yang cocok untuk satu baris, dipakai jadi tag pada kartu kutipan. */
export function matchedCategoryTags(raw) {
  return matchedOptions(raw, KATEGORI_PERNYATAAN_OPTIONS);
}

const EMOSI_ORDER = [
  { key: "Sangat Positif", tone: "aman", icon: "😄" },
  { key: "Positif", tone: "aman", icon: "🙂" },
  { key: "Netral", tone: "default", icon: "😐" },
  { key: "Negatif", tone: "perhatian", icon: "😟" },
  // Ditambah untuk data siswa SMK Telkom Purwokerto (21 baris emosi_siswa = "Sangat Negatif").
  // Ini sekaligus menutup celah lama di jalur orang tua: nilai "Sangat Negatif" yang mungkin ada
  // di data lama selama ini dibuang diam-diam tanpa peringatan, karena countEmosi cuma menghitung
  // apa yang ADA di EMOSI_ORDER (beda dari countMultiValue yang punya console.warn untuk nilai
  // tak dikenal). Tone "waspada" dipakai supaya beda tegas dari "perhatian" biasa.
  { key: "Sangat Negatif", tone: "waspada", icon: "😞" },
];

/**
 * Tally field emosi single-pilih (beda dari 3 field multi-pilih di atas). Parameter field
 * opsional (default "emosi_anak", nama kolom DB yang sudah dipakai jalur orang tua sejak awal)
 * supaya sumber lain yang kelak menyimpan emosinya di kolom berbeda tetap bisa pakai fungsi yang
 * sama tanpa duplikasi logika. Pemanggil lama yang cuma kirim rows tanpa argumen kedua tetap
 * baca emosi_anak persis seperti sebelumnya.
 */
export function countEmosi(rows, field = "emosi_anak") {
  const counts = {};
  let total = 0;
  rows.forEach((r) => {
    const v = (r[field] || "").trim();
    if (isNoAnswer(v)) return;
    counts[v] = (counts[v] || 0) + 1;
    total++;
  });
  const items = EMOSI_ORDER.filter((o) => counts[o.key] > 0).map((o) => ({ label: o.key, count: counts[o.key], tone: o.tone, icon: o.icon }));
  return { items, total };
}

/**
 * Baris `tindak_lanjut` (modul='karakter', status='disetujui') dianggap siap tampil di
 * KebijakanGoals hanya kalau semua field skema baru terisi lengkap -- baris lama/setengah
 * jadi dari sisa skema sebelumnya (kalau ada) tidak boleh bikin kartu kosong/pecah.
 */
export function isKebijakanReady(r) {
  return !!(r && r.title && r.type && r.fokus && r.term && Array.isArray(r.konkret) && r.konkret.length > 0);
}

/**
 * Satu meta per sumber refleksi (orang tua, siswa). Ini kontraknya WS4 (useKarakterData.js) dan
 * WS5 (KarakterShared.jsx) bergantung: semua teks yang beda per responden dibaca dari sini,
 * bukan lagi ditanam langsung di komponen. Nilai untuk 'orangtua' DISALIN PERSIS karakter demi
 * karakter dari string yang sudah dipakai di KarakterShared.jsx sekarang (nomor baris dicatat di
 * komentar tiap field) -- jangan dirapikan redaksinya di sini, itu bukan lingkup WS3 dan akan
 * mengubah tampilan sekolah existing (varian A) yang wajib tidak berubah sepiksel pun.
 */
export const REFLEKSI_META = {
  orangtua: {
    key: "orangtua",
    label: "Orang Tua",
    satuan: "orang tua",
    icon: "👪",
    emosiLabel: "Perasaan anak menurut orang tua", // KarakterShared.jsx:1178
    sectionTitle: "Suara Orang Tua",
    kategoriOptions: KATEGORI_PERNYATAAN_OPTIONS,
    dukunganOptions: DUKUNGAN_OPTIONS,
    disyukuriOptions: HAL_DISYUKURI_OPTIONS,
    namaFallback: "Orang tua", // KarakterShared.jsx:540, 598, 638, 707
    namaFallbackLower: "orang tua", // fallback nama di dalam teks WhatsApp, KarakterShared.jsx:576
    waLabel: (nama) => `Masukan orang tua (${nama || "orang tua"}):`, // KarakterShared.jsx:576
    dialogTeruskanTitle: "Teruskan masukan orang tua", // KarakterShared.jsx:597
    headingRefleksi: "Refleksi orang tua", // KarakterShared.jsx:723
    labelPesan: "Pesan orang tua", // KarakterShared.jsx:733
    voiceTabs: [ // VOICE_TABS, KarakterShared.jsx:497-502
      { id: "testimoni", label: "Testimoni", icon: "💬" },
      { id: "emosi", label: "Emosi Anak", icon: "🙂" },
      { id: "dukungan", label: "Dukungan Dibutuhkan", icon: "🤲" },
      { id: "halDisyukuri", label: "Keberhasilan Sekolah di Mata Orang Tua", icon: "🙏" },
    ],
    emptyText: {
      // ParentVoiceBento saat pernyataan kosong total, KarakterShared.jsx:787
      blok: "Belum ada refleksi orang tua untuk periode ini.",
      // ParentVoiceBento saat ada baris tapi tak satu dimensi pun terisi, KarakterShared.jsx:908
      dataKosong: (adaFilterSekolah) =>
        `Belum ada refleksi orang tua yang bisa ditampilkan${adaFilterSekolah ? " untuk sekolah ini" : ""} periode ini.`,
      // MuridResumeDialog saat semua field lain kosong, KarakterShared.jsx:757
      dialogLain: "Orang tua belum mengisi refleksi lain untuk periode ini.",
      // ReflectionBlock per murid, KarakterShared.jsx:1167
      murid: (nama) => `Belum ada refleksi dari orang tua ${nama} periode ini.`,
      // Kategori dipilih tapi esai bebasnya kosong, KarakterShared.jsx:977
      tanpaEsai: (n, val) =>
        `${n} orang tua memilih "${val}", tapi belum ada yang menuliskan pesan tertulis untuk periode ini.`,
    },
    summaryKeys: {
      pencapaian: ["pencapaian_orangtua", "persentase_pencapaian_orangtua"],
      rataPencapaian: ["rata_pencapaian_orangtua", "rata_rata_pencapaian_orangtua"],
      rataAspekPrefix: "rata_input_orangtua_",
      inputAspekPrefix: "input_orangtua_",
    },
  },
  siswa: {
    key: "siswa",
    label: "Siswa",
    satuan: "siswa",
    icon: "🧑‍🎓",
    // Padanan lapor-diri dari "Perasaan anak menurut orang tua" -- siswa melaporkan perasaannya
    // sendiri, bukan dinilai pihak ketiga, jadi diksinya sengaja beda, bukan sekadar ganti kata.
    emosiLabel: "Perasaan yang dilaporkan siswa sendiri",
    sectionTitle: "Suara Siswa",
    kategoriOptions: KATEGORI_PERNYATAAN_OPTIONS, // sama dengan orang tua, sudah termasuk bucket Keluhan
    dukunganOptions: DUKUNGAN_OPTIONS_SISWA,
    disyukuriOptions: HAL_DISYUKURI_OPTIONS_SISWA,
    namaFallback: "Siswa",
    namaFallbackLower: "siswa",
    waLabel: (nama) => `Masukan siswa (${nama || "siswa"}):`,
    dialogTeruskanTitle: "Teruskan masukan siswa",
    headingRefleksi: "Refleksi siswa",
    labelPesan: "Pesan siswa",
    voiceTabs: [
      { id: "testimoni", label: "Testimoni", icon: "💬" },
      // "Emosi Anak" hanya benar untuk jalur orang tua (menilai perasaan anaknya). Di jalur
      // siswa isinya lapor diri, jadi labelnya ikut sudut pandang pengisi.
      { id: "emosi", label: "Emosi Siswa", icon: "🙂" },
      { id: "dukungan", label: "Dukungan Dibutuhkan", icon: "🤲" },
      { id: "halDisyukuri", label: "Keberhasilan Sekolah di Mata Siswa", icon: "🙏" },
    ],
    emptyText: {
      blok: "Belum ada refleksi siswa untuk periode ini.",
      dataKosong: (adaFilterSekolah) =>
        `Belum ada refleksi siswa yang bisa ditampilkan${adaFilterSekolah ? " untuk sekolah ini" : ""} periode ini.`,
      dialogLain: "Siswa belum mengisi refleksi lain untuk periode ini.",
      murid: (nama) => `Belum ada refleksi dari siswa ${nama} periode ini.`,
      tanpaEsai: (n, val) =>
        `${n} siswa memilih "${val}", tapi belum ada yang menuliskan pesan tertulis untuk periode ini.`,
    },
    summaryKeys: {
      pencapaian: ["pencapaian_siswa", "persentase_pencapaian_siswa"],
      rataPencapaian: ["rata_pencapaian_siswa", "rata_rata_pencapaian_siswa"],
      rataAspekPrefix: "rata_input_siswa_",
      inputAspekPrefix: "input_siswa_",
    },
  },
};

/** Urutan tetap sumber refleksi -- dipakai untuk menyusun label gabungan dan urutan saklar/tab
 * secara konsisten, bukan urutan kemunculan data yang bisa acak antar periode. */
export const REFLEKSI_SUMBER_URUTAN = ["orangtua", "siswa"];

/**
 * Judul section dan judul mega-kategori, dihitung dari daftar sumber yang tersedia di periode
 * itu. Untuk sumberList ['orangtua'] WAJIB mengembalikan string lama persis ("Suara Orang Tua" /
 * "Perkembangan Citra Sekolah di Mata Orang Tua") supaya varian A (sekolah existing) tidak
 * berubah sepiksel pun. Urutan gabungan selalu ikut REFLEKSI_SUMBER_URUTAN (orang tua dulu baru
 * siswa), bukan urutan argumen sumberList, supaya "Orang Tua & Siswa" konsisten di mana pun
 * fungsi ini dipanggil, tidak tergantung urutan deteksi di hook.
 */
export function judulSectionSuara(sumberList = []) {
  const urut = REFLEKSI_SUMBER_URUTAN.filter((s) => sumberList.includes(s));
  const label = urut.map((s) => REFLEKSI_META[s]?.label).filter(Boolean).join(" & ");
  return {
    section: `Suara ${label}`,
    mega: `Perkembangan Citra Sekolah di Mata ${label}`,
  };
}

/**
 * Baca kunci ringkasan pertama yang benar-benar ada di jsonb karakter_summary.ringkasan dan
 * kembalikan NILAINYA (bukan nama kuncinya). Nama kolom di data lama beda antara scope kelas
 * (mis. "pencapaian_orangtua") dan jenjang/sekolah (mis. "persentase_pencapaian_orangtua") --
 * peninggalan nama kolom Excel yang tidak seragam antar level -- jadi tiap summaryKeys di atas
 * berupa daftar kandidat, dicoba berurutan sampai salah satu ketemu. Pakai hasOwnProperty
 * (bukan sekadar truthy check) supaya nilai 0 yang sah tetap kebaca sebagai "ada", bukan
 * dilewati seolah kuncinya tidak ada.
 */
export function resolveSummaryKey(ringkasan, kandidat) {
  if (!ringkasan) return null;
  for (const k of kandidat || []) {
    if (Object.prototype.hasOwnProperty.call(ringkasan, k)) return ringkasan[k];
  }
  return null;
}

/** Ikon untuk judul-judul bagian yang sifatnya tetap di modul Karakter. */
export const SECTION_ICON = {
  tindakLanjut: "🎯",
  profilKelas: "🧭",
  profilSekolah: "🏫",
  indikator: "⭐",
  skorSiswa: "📋",
  suaraOrtu: "💬",
  suara: "💬", // judul dinamis multi-sumber (judulSectionSuara), suaraOrtu tetap ada demi kompatibilitas
  perbandinganKelas: "📊",
  perbandinganSekolah: "🏫",
  jenjang: "🎓",
  tren: "📈",
};
