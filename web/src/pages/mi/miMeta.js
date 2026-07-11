export const MI_META = [
  { code: "Ie", name: "Interpersonal",   tagline: "Paham lewat diskusi & belajar bersama",  color: "#1E94A6" },
  { code: "Sp", name: "Spasial",         tagline: "Paham lewat gambar, diagram & ruang",     color: "#6E3AD1" },
  { code: "Ve", name: "Linguistik",      tagline: "Paham lewat bacaan, tulisan & kata",      color: "#2F6BD4" },
  { code: "Ia", name: "Intrapersonal",   tagline: "Paham lewat refleksi mandiri",            color: "#8A4FB8" },
  { code: "Na", name: "Naturalis",       tagline: "Paham lewat alam & contoh nyata",         color: "#3E9B6B" },
  { code: "Mu", name: "Musikal",         tagline: "Paham lewat irama, nada & bunyi",         color: "#B5485F" },
  { code: "Lo", name: "Logis-Matematis", tagline: "Paham lewat logika, pola & angka",        color: "#3B4DA8" },
  { code: "Ki", name: "Kinestetik",      tagline: "Paham lewat gerak & praktik langsung",    color: "#C57A2C" },
];

export const MI_BY_CODE = Object.fromEntries(MI_META.map((m) => [m.code, m]));

// Nama kecerdasan dalam CSV (TOP 1/2/3) → kode internal
export const MI_NAME_TO_CODE = {
  "Interpersonal":   "Ie",
  "Intrapersonal":   "Ia",
  "Kinestetik":      "Ki",
  "Linguistik":      "Ve",
  "Logis-Matematis": "Lo",
  "Musikal":         "Mu",
  "Naturalis":       "Na",
  "Spasial":         "Sp",
};

// Kunci skor mentah per kode (hasil normalisasi header GAS)
const R_KEYS = {
  Ie: ["r_inter"],
  Ia: ["r_intra"],
  Ki: ["r_kines"],
  Ve: ["r_linguistik", "r_linguis"],
  Lo: ["r_logmat"],
  Mu: ["r_musikal"],
  Na: ["r_naturalis"],
  Sp: ["r_spasial"],
};

/**
 * Cari skor mentah untuk satu kecerdasan lewat daftar kemungkinan nama kolom (alias header
 * antar versi sheet). Kembalikan null kalau TIDAK SATU PUN kolom itu terisi sama sekali --
 * beda dari kolom yang terisi tapi nilainya 0 (itu tetap dikembalikan apa adanya, bukan
 * ditebak; validitas skor 0 untuk Interpersonal masih parameter terbuka, lihat CLAUDE.md).
 * Null di sini murni soal "datanya belum ada", bukan soal "0 itu valid atau tidak".
 */
function readScore_(row, keys) {
  let found = false;
  for (let i = 0; i < keys.length; i++) {
    const raw = row[keys[i]];
    if (raw === null || raw === undefined || raw === "") continue;
    found = true;
    const v = Number(raw);
    if (!isNaN(v) && v > 0) return v;
  }
  return found ? 0 : null;
}

/**
 * Proses Output_MI (satu baris per siswa) → struktur siap tampil.
 * Menggantikan processMIData bila sheet Output_MI tersedia di GAS.
 */
export function processOutputMI(rows = []) {
  if (!rows.length) {
    return { nSiswa: 0, nKelas: 0, miDist: MI_META.map((m) => ({ ...m, n: 0 })), miAvg: {}, kelasList: [], students: [] };
  }

  const nSiswa = rows.length;
  const topCounts = {};
  const scoreAccum = {};
  const scoreCount = {};
  MI_META.forEach((m) => { scoreAccum[m.code] = 0; scoreCount[m.code] = 0; });
  const kelasMap = {};

  rows.forEach((row) => {
    const top1Code = MI_NAME_TO_CODE[String(row.top_1 || "").trim()];
    if (top1Code) topCounts[top1Code] = (topCounts[top1Code] || 0) + 1;

    MI_META.forEach((m) => {
      const s = readScore_(row, R_KEYS[m.code]);
      // Murid yang belum punya skor kecerdasan ini SAMA SEKALI tidak ikut dihitung di
      // rata-rata (miAvg), bukan dianggap 0 -- lihat readScore_.
      if (s != null) { scoreAccum[m.code] += s; scoreCount[m.code] += 1; }
    });

    const kelasId = row.kelas_id ? String(row.kelas_id).trim() : "";
    if (kelasId) {
      if (!kelasMap[kelasId]) kelasMap[kelasId] = { nSiswa: 0, topCounts: {} };
      kelasMap[kelasId].nSiswa++;
      if (top1Code) {
        kelasMap[kelasId].topCounts[top1Code] = (kelasMap[kelasId].topCounts[top1Code] || 0) + 1;
      }
    }
  });

  const miDist = MI_META
    .map((m) => ({ ...m, n: topCounts[m.code] || 0 }))
    .sort((a, b) => b.n - a.n);

  const miAvg = {};
  MI_META.forEach((m) => {
    miAvg[m.code] = scoreCount[m.code] > 0 ? Math.round(scoreAccum[m.code] / scoreCount[m.code]) : null;
  });

  const kelasList = Object.entries(kelasMap)
    .map(([kelasId, d]) => {
      const topMI = Object.entries(d.topCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;
      return { kelasId, nSiswa: d.nSiswa, topMI };
    })
    .sort((a, b) => a.kelasId.localeCompare(b.kelasId));

  return { nSiswa, nKelas: kelasList.length, miDist, miAvg, kelasList, students: rows };
}

/** Proses fakta_aspek mentah → struktur siap tampil */
export function processMIData(fakta = []) {
  const studentSet = new Set();
  const kelasSet   = new Set();
  const domCount   = {};
  const skorSum    = {};
  const skorCnt    = {};

  fakta.forEach((r) => {
    studentSet.add(r.murid_id);
    kelasSet.add(r.kelas_id);

    const kode = r.aspek_kode;
    const isDom = r.dominan_flag === true || r.dominan_flag === "TRUE" || r.dominan_flag === "true";
    if (isDom) domCount[kode] = (domCount[kode] || 0) + 1;

    const skor = parseFloat(r.skor);
    if (!isNaN(skor)) {
      skorSum[kode] = (skorSum[kode] || 0) + skor;
      skorCnt[kode] = (skorCnt[kode] || 0) + 1;
    }
  });

  const miAvg = {};
  MI_META.forEach((m) => {
    miAvg[m.code] = skorCnt[m.code] ? Math.round(skorSum[m.code] / skorCnt[m.code]) : 0;
  });

  // Sebaran dominan, urut dari terbanyak
  const miDist = MI_META
    .map((m) => ({ ...m, n: domCount[m.code] || 0 }))
    .sort((a, b) => b.n - a.n);

  // Breakdown per kelas
  const kelasMap = {};
  fakta.forEach((r) => {
    if (!kelasMap[r.kelas_id]) kelasMap[r.kelas_id] = { students: new Set(), domCount: {} };
    kelasMap[r.kelas_id].students.add(r.murid_id);
    const isDom = r.dominan_flag === true || r.dominan_flag === "TRUE" || r.dominan_flag === "true";
    if (isDom) {
      const kc = kelasMap[r.kelas_id].domCount;
      kc[r.aspek_kode] = (kc[r.aspek_kode] || 0) + 1;
    }
  });

  const kelasList = Object.entries(kelasMap).map(([kelasId, d]) => {
    const topEntry = Object.entries(d.domCount).sort((a, b) => b[1] - a[1])[0];
    return { kelasId, nSiswa: d.students.size, topMI: topEntry?.[0] || null };
  });

  return {
    nSiswa: studentSet.size,
    nKelas: kelasSet.size,
    miDist,
    miAvg,
    kelasList,
  };
}
