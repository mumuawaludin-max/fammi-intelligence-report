/**
 * Transform Output_MI (87+ kolom dari GAS) → format Siswa Bakat view
 */

const NAME_TO_CODE = {
  "musikal":       "Mu",
  "spasial":       "Sp",
  "linguistik":    "Ve",
  "verbal":        "Ve",
  "naturalis":     "Na",
  "logis":         "Lo",
  "logmat":        "Lo",
  "logika":        "Lo",
  "kinestetik":    "Ki",
  "kinestetis":    "Ki",
  "interpersonal": "Ie",
  "intrapersonal": "Ia",
};

const CODE_META = {
  Ie: { name: "Interpersonal",      scoreKey: "r_inter",      levelKey: "pred_inter",      narasiKey: "inter_arti",    profesiKey: "inter_profesi",    lakukanKey: "inter_lakukan",    jagaKey: "inter_jaga",    terlihatKey: "inter_terlihat" },
  Ia: { name: "Intrapersonal",      scoreKey: "r_intra",      levelKey: "pred_intra",      narasiKey: "intra_arti",    profesiKey: "intra_profesi",    lakukanKey: "intra_lakukan",    jagaKey: "intra_jaga",    terlihatKey: "intra_terlihat" },
  Ki: { name: "Kinestetik",         scoreKey: "r_kines",      levelKey: "pred_kines",      narasiKey: "kinest_arti",   profesiKey: "kinest_profesi",   lakukanKey: "kinest_lakukan",   jagaKey: "kinest_jaga",   terlihatKey: "kinest_terlihat" },
  Ve: { name: "Linguistik",         scoreKey: "r_linguistik", levelKey: "pred_linguis",    narasiKey: "linguis_arti",  profesiKey: "linguis_profesi",  lakukanKey: "linguis_lakukan",  jagaKey: "linguis_jaga",  terlihatKey: "linguis_terlihat" },
  Lo: { name: "Logika-Matematika",  scoreKey: "r_logmat",     levelKey: "pred_logmat",     narasiKey: "logmat_arti",   profesiKey: "logmat_profesi",   lakukanKey: "logmat_lakukan",   jagaKey: "logmat_jaga",   terlihatKey: "logmat_terlihat" },
  Mu: { name: "Musikal",            scoreKey: "r_musikal",    levelKey: "pred_musikal",    narasiKey: "musikal_arti",  profesiKey: "musikal_profesi",  lakukanKey: "musikal_lakukan",  jagaKey: "musikal_jaga",  terlihatKey: "musikal_terlihat" },
  Na: { name: "Naturalis",          scoreKey: "r_naturalis",  levelKey: "pred_naturalis",  narasiKey: "natural_arti",  profesiKey: "natural_profesi",  lakukanKey: "natural_lakukan",  jagaKey: "natural_jaga",  terlihatKey: "natural_terlihat" },
  Sp: { name: "Spasial",            scoreKey: "r_spasial",    levelKey: "pred_spasial",    narasiKey: "spasial_arti",  profesiKey: "spasial_profesi",  lakukanKey: "spasial_lakukan",  jagaKey: "spasial_jaga",  terlihatKey: "spasial_terlihat" },
};

export function transformMIData(gasData, sessionNama) {
  if (!gasData || !gasData.output_mi || gasData.output_mi.length === 0) return null;
  const row = gasData.output_mi[0];

  // TOP 1/2/3
  const top1Name = norm(row.top_1);
  const top2Name = norm(row.top_2);
  const top3Name = norm(row.top_3);
  const topNames = [top1Name, top2Name, top3Name].filter(Boolean);

  const topCols = [
    { arti: row.top_1_arti, profesi: row.top_1_profesi, lakukan: row.top_1_lakukan, terlihat: row.top_1_terlihat, jaga: row.top_1_jaga, jurusan: row.top_1_jurusan, parentTip: row.top_1_parenttip, profesiSorotNama: row.top_1_profesi_sorot, profesiSorotDesc: row.top_1_profesi_sorot_desc, profesiSorotSkill1: row.top_1_profesi_sorot_skill_1, profesiSorotSkill2: row.top_1_profesi_sorot_skill_2, profesiSorotSkill3: row.top_1_profesi_sorot_skill_3, profesiSorotJalur: row.top_1_profesi_sorot_jalur, profesiSorotFigur: row.top_1_profesi_sorot_figur },
    { arti: row.top_2_arti, profesi: row.top_2_profesi, lakukan: row.top_2_lakukan, terlihat: row.top_2_terlihat, jaga: row.top_2_jaga, jurusan: row.top_2_jurusan, parentTip: row.top_2_parenttip, profesiSorotNama: row.top_2_profesi_sorot, profesiSorotDesc: row.top_2_profesi_sorot_desc, profesiSorotSkill1: row.top_2_profesi_sorot_skill_1, profesiSorotSkill2: row.top_2_profesi_sorot_skill_2, profesiSorotSkill3: row.top_2_profesi_sorot_skill_3, profesiSorotJalur: row.top_2_profesi_sorot_jalur, profesiSorotFigur: row.top_2_profesi_sorot_figur },
    { arti: row.top_3_arti, profesi: row.top_3_profesi, lakukan: row.top_3_lakukan, terlihat: row.top_3_terlihat, jaga: row.top_3_jaga, jurusan: row.top_3_jurusan, parentTip: row.top_3_parenttip, profesiSorotNama: row.top_3_profesi_sorot, profesiSorotDesc: row.top_3_profesi_sorot_desc, profesiSorotSkill1: row.top_3_profesi_sorot_skill_1, profesiSorotSkill2: row.top_3_profesi_sorot_skill_2, profesiSorotSkill3: row.top_3_profesi_sorot_skill_3, profesiSorotJalur: row.top_3_profesi_sorot_jalur, profesiSorotFigur: row.top_3_profesi_sorot_figur },
  ];

  // Raw profesi_detail per top intel (diparse ke Map di dalam topDetails)
  const topProfesiDetailRaws = [
    row.top_1_profesi_detail,
    row.top_2_profesi_detail,
    row.top_3_profesi_detail,
  ];

  // Detail lengkap per TOP (untuk card dominan)
  const topDetails = topNames.map((name, i) => {
    const tc = topCols[i];
    const code = nameToCode(name);
    const meta = code ? CODE_META[code] : null;
    const score = meta ? (parseFloat(row[meta.scoreKey]) || 0) : 0;
    const levelRaw = meta ? str(row[meta.levelKey]) : "";
    return {
      code,
      name: meta ? meta.name : name,
      score: Math.round(score),
      level: normLevel(levelRaw) || computeLevel(score),
      arti: str(tc.arti) || (meta ? str(row[meta.narasiKey]) : ""),
      jaga: str(tc.jaga),
      lakukan: parseLines(tc.lakukan),
      profesi: parseLines(tc.profesi),
      terlihat: parseLines(tc.terlihat),
      jurusan: parseCommaList(tc.jurusan),
      parentTip: str(tc.parentTip),
      profesiSorot: str(tc.profesiSorotNama) ? {
        nama:   str(tc.profesiSorotNama),
        desc:   str(tc.profesiSorotDesc),
        skills: [tc.profesiSorotSkill1, tc.profesiSorotSkill2, tc.profesiSorotSkill3].map(str).filter(Boolean),
        jalur:  str(tc.profesiSorotJalur),
        figur:  parseCommaList(tc.profesiSorotFigur),
      } : null,
      profesiDetail: parseProfesiDetailRaw(topProfesiDetailRaws[i]),
    };
  });

  // Semua 8 kecerdasan
  const intel = Object.entries(CODE_META).map(([code, meta]) => {
    const score = parseFloat(row[meta.scoreKey]) || 0;
    const levelRaw = str(row[meta.levelKey]);
    const level = normLevel(levelRaw) || computeLevel(score);
    const topIdx = topNames.findIndex(n => {
      if (nameToCode(n) === code) return true;
      return n.includes(norm(meta.name)) || norm(meta.name).includes(n);
    });

    let desc = "";
    if (topIdx !== -1) desc = str(topCols[topIdx].arti);
    if (!desc) desc = str(row[meta.narasiKey]);
    if (!desc) desc = fallbackDesc(code, level);

    const jaga = topIdx !== -1 ? str(topCols[topIdx].jaga) : str(row[meta.jagaKey]);
    const terlihat = topIdx !== -1 ? parseLines(topCols[topIdx].terlihat) : parseLines(row[meta.terlihatKey]);
    const lakukan = topIdx !== -1 ? parseLines(topCols[topIdx].lakukan) : parseLines(row[meta.lakukanKey]);
    const profesi = parseLines(topIdx !== -1 ? topCols[topIdx].profesi : row[meta.profesiKey]);

    return { code, name: meta.name, score: Math.round(score), level, desc, jaga, terlihat, lakukan, profesi, topIdx };
  });

  intel.sort((a, b) => b.score - a.score);

  // Siswa
  const namaSheet = str(row.nama_siswa || row.nama);
  const namaFinal = namaSheet || sessionNama || "Siswa";

  const student = {
    name: namaFinal,
    panggilan: namaFinal.split(/\s+/)[0],
    kelas: str(row.kelas_id) || str(row.kelas) || "",
    sekolah: str(row.sekolah_nama) || str(row.sekolah) || "",
  };

  // Rekomendasi gabungan dari TOP 1/2/3
  const profesi = [], ekskul = [];
  topCols.forEach((tc, i) => {
    if (!topNames[i]) return;
    parseLines(tc.profesi).forEach(p => { if (p && !profesi.includes(p)) profesi.push(p); });
    parseLines(tc.lakukan).forEach(p => { if (p && !ekskul.includes(p)) ekskul.push(p); });
  });

  // Mapel sulit
  const mapelSulit = [];
  if (str(row.mapel_sulit_1)) mapelSulit.push({ nama: str(row.mapel_sulit_1), desc: str(row.mapel_sulit_1_desc) });
  if (str(row.mapel_sulit_2)) mapelSulit.push({ nama: str(row.mapel_sulit_2), desc: str(row.mapel_sulit_2_desc) });
  const mapelNarasiFinal = str(row.mapel_sulit_narasi_final);

  // ── Kolom baru untuk BakatView light-theme ────────────────────────────────────
  // Kolom-kolom ini diisi oleh pipeline GAS/Gemini.
  // Jika belum terisi, UI akan menggunakan fallback berbasis top intel.

  const narasiCover = str(row.narasi_cover);
  const caraBelajarSummary = str(row.cara_belajar_summary);

  const caraBelajarItems = [1, 2, 3, 4, 5].map(i => ({
    no: String(i).padStart(2, "0"),
    title: str(row[`cara_belajar_${i}_title`]),
    body: str(row[`cara_belajar_${i}_body`]),
  })).filter(x => x.title);

  const mapelKuasai = parseCommaList(row.mapel_kuasai);
  const ahaDesc = str(row.aha_desc);

  const essayCara      = str(row.essay_cara_belajar);
  const essayBerhasil  = str(row.essay_cara_belajar_paling_berhasil);
  const essayKelebihan = str(row.essay_kelebihan_cara_berpikir);
  const essayCita      = str(row.essay_citacita_profesi);
  const essayAlasan    = str(row.essay_alasan_pilih_profesi);
  const essayAI        = str(row.essay_penggunaan_ai);

  const gayaKomPositif = [1, 2, 3, 4].map(i => str(row[`gaya_kom_positif_${i}`])).filter(Boolean);
  const gayaKomHindari = [1, 2, 3].map(i => str(row[`gaya_kom_hindari_${i}`])).filter(Boolean);
  const gayaKomSiswa = [1, 2, 3].map(i => ({
    situasi: str(row[`gaya_kom_siswa_${i}_situasi`]),
    script: str(row[`gaya_kom_siswa_${i}_script`]),
  })).filter(x => x.situasi);

  const smartGoalsSheet = {
    s: str(row.smart_s),
    m: str(row.smart_m),
    a: str(row.smart_a),
    r: str(row.smart_r),
    t: str(row.smart_t),
  };

  const hari7 = [1, 2, 3, 4, 5, 6, 7].map(i => str(row[`hari_${i}`])).filter(Boolean);

  const sinyalOrtu = [1, 2, 3, 4, 5].map(i => {
    const rawIcon  = str(row[`sinyal_${i}_icon`]);
    const rawTitle = str(row[`sinyal_${i}_title`]);
    const rawBody  = str(row[`sinyal_${i}_body`]);
    // Gemini sometimes skips the emoji and puts the title in the icon column.
    const shifted  = rawIcon.length > 4;
    return {
      icon:  shifted ? "✨"     : (rawIcon || "✨"),
      title: shifted ? rawIcon  : rawTitle,
      body:  shifted ? rawTitle : rawBody,
    };
  }).filter(x => x.title);

  const ciriKhas = [1, 2, 3, 4].map(i => str(row[`ciri_khas_${i}`])).filter(Boolean);

  const refleksiQuestions = [1, 2, 3, 4].map(i => str(row[`refleksi_${i}`])).filter(Boolean);
  const diskusiQuestions = [1, 2, 3, 4].map(i => str(row[`diskusi_${i}`])).filter(Boolean);

  return {
    student,
    intel,
    topNames,
    topDetails,
    rekom: { profesi, ekskul, jurusan: [], kuliah: [], lomba: [] },
    karakter: [],
    aspek: [],
    dukungan: str(row.narasi_hero),
    narasiKombinasi: str(row.narasi_kombinasi),
    narasiProfil: str(row.narasi_profil_final),
    mapelSulit,
    mapelNarasiFinal,
    // Kolom baru untuk BakatView
    narasiCover,
    caraBelajarSummary,
    caraBelajarItems,
    mapelKuasai,
    ahaDesc,
    gayaKomPositif,
    gayaKomHindari,
    gayaKomSiswa,
    smartGoalsSheet,
    hari7,
    sinyalOrtu,
    ciriKhas,
    refleksiQuestions,
    diskusiQuestions,
    essayCara,
    essayBerhasil,
    essayKelebihan,
    essayCita,
    essayAlasan,
    essayAI,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function str(val) {
  const s = String(val ?? "").trim();
  return s === "undefined" || s === "null" ? "" : s;
}

function norm(val) {
  return str(val).toLowerCase().replace(/\s+/g, " ");
}

function nameToCode(nameLower) {
  if (nameLower.includes("intrapersonal")) return "Ia";
  if (nameLower.includes("interpersonal")) return "Ie";
  for (const [k, v] of Object.entries(NAME_TO_CODE)) {
    if (k === "interpersonal" || k === "intrapersonal") continue;
    if (nameLower.includes(k)) return v;
  }
  return null;
}

function normLevel(raw) {
  const s = raw.toLowerCase();
  if (s === "kuat")       return "Kuat";
  if (s === "sedang")     return "Sedang";
  if (s === "berkembang") return "Berkembang";
  return null;
}

function computeLevel(score) {
  if (score >= 75) return "Kuat";
  if (score >= 50) return "Sedang";
  return "Berkembang";
}

function parseLines(raw) {
  return str(raw)
    .split("\n")
    .map(l => l.replace(/^[→•\-\s]+/, "").trim())
    .filter(Boolean);
}

function parseCommaList(raw) {
  return str(raw)
    .split(/[,;|]/)
    .map(s => s.trim())
    .filter(Boolean);
}

// raw = string satu profesi per baris, format: nama|desc|skill1|skill2|skill3|jalur
// return: Map{ namaLower → { desc, skills, jalur } }
function parseProfesiDetailRaw(raw) {
  const map = {};
  str(raw).split("\n").forEach(line => {
    const parts = line.split("|").map(s => s.trim());
    if (parts.length < 2 || !parts[0]) return;
    map[parts[0].toLowerCase()] = {
      desc:   parts[1] || "",
      skills: [parts[2], parts[3], parts[4]].filter(Boolean),
      jalur:  parts[5] || "",
      figur:  [],
    };
  });
  return map;
}

function fallbackDesc(code, level) {
  const map = {
    Ie: { Kuat: "Kamu mudah memahami perasaan orang lain dan nyaman menjalin pertemanan.", Sedang: "Kamu cukup baik dalam memahami orang lain, terus latih empati.", Berkembang: "Kemampuan sosialmu sedang berkembang." },
    Ia: { Kuat: "Kamu sangat mengenali perasaan dan tujuanmu sendiri.", Sedang: "Kamu cukup mengenali perasaan dan tujuanmu sendiri.", Berkembang: "Kemampuan refleksi dirimu sedang berkembang." },
    Ki: { Kuat: "Koordinasi gerakmu sangat baik.", Sedang: "Kamu memiliki koordinasi gerak yang cukup baik.", Berkembang: "Koordinasi gerakmu sedang berkembang." },
    Ve: { Kuat: "Kamu berkomunikasi dengan sangat baik dan fasih.", Sedang: "Kamu berkomunikasi dengan baik dalam keseharian.", Berkembang: "Kemampuan komunikasimu sedang berkembang." },
    Lo: { Kuat: "Kemampuan penalaran logismu sangat kuat.", Sedang: "Kamu cukup baik dalam penalaran logis.", Berkembang: "Kemampuan penalaran logismu sedang berkembang." },
    Mu: { Kuat: "Kamu sangat sensitif terhadap musik dan irama.", Sedang: "Kamu menikmati musik dan mampu mengikuti irama.", Berkembang: "Kamu menikmati musik, teruslah belajar." },
    Na: { Kuat: "Kamu sangat mencintai alam dan memiliki kepekaan lingkungan tinggi.", Sedang: "Kamu menikmati kegiatan di alam dan peka terhadap lingkungan.", Berkembang: "Kamu mulai menunjukkan ketertarikan pada alam." },
    Sp: { Kuat: "Kamu memiliki daya imajinasi visual yang sangat kuat.", Sedang: "Kamu punya daya imajinasi visual yang kuat dan senang berkarya.", Berkembang: "Daya imajinasi visualmu sedang berkembang." },
  };
  return (map[code] && map[code][level]) || "Terus kembangkan potensimu.";
}
