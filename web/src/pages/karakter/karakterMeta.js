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

/** top5_siswa_tertinggi ("Nama1\nNama2\n...") + top5_nilai_siswa_tertinggi ("100%\n98%\n...") → pasangan. */
export function parseTop5Pair(namaStr, nilaiStr) {
  const namaList = String(namaStr || "").split("\n").map((s) => s.trim()).filter(Boolean);
  const nilaiList = String(nilaiStr || "").split("\n").map((s) => s.trim()).filter(Boolean);
  return namaList.map((nama, i) => ({ nama, nilai: nilaiList[i] || "" }));
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
