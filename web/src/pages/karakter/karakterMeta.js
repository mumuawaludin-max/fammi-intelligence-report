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

/** "87 %" / "87%" / 87 → 87 (number). Null kalau tidak bisa diparse. */
export function pct(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v).replace("%", "").trim());
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
export function periodeLabel(periodeId) {
  if (!periodeId) return "";
  const [y, m] = String(periodeId).split("-");
  const bulan = BULAN_ID[Number(m)] || m;
  return `${bulan} ${y}`;
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
export const KATEGORI_PERNYATAAN_OPTIONS = [
  { match: "Ucapan Terimakasih", label: "Apresiasi", icon: "⭐⭐⭐⭐⭐" },
  { match: "Harapan", label: "Harapan", icon: "🌱" },
  { match: "Saran dan Masukan", label: "Saran & Masukan", icon: "💡" },
  { match: "Kritik", label: "Kritik", icon: "⚠️" },
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
    normOptions.forEach((o) => {
      if (rawNorm.includes(o.matchNorm)) { counts[o.label]++; matched = true; }
    });
    if (!matched && import.meta.env.DEV) {
      console.warn(`[karakterMeta] Opsi "${field}" tidak dikenali salah satu daftar option: "${raw}"`);
    }
  });
  const items = options.map((o) => ({ label: o.label, icon: o.icon, count: counts[o.label] }));
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
];

/** Tally emosi_anak (field single-pilih, beda dari 3 field multi-pilih di atas). */
export function countEmosi(rows) {
  const counts = {};
  let total = 0;
  rows.forEach((r) => {
    const v = (r.emosi_anak || "").trim();
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

/** Ikon untuk judul-judul bagian yang sifatnya tetap di modul Karakter. */
export const SECTION_ICON = {
  tindakLanjut: "🎯",
  profilKelas: "🧭",
  profilSekolah: "🏫",
  indikator: "⭐",
  skorSiswa: "📋",
  suaraOrtu: "💬",
  perbandinganKelas: "📊",
  perbandinganSekolah: "🏫",
  jenjang: "🎓",
  tren: "📈",
};
