/**
 * Pipeline.js
 * Mengisi Output_MI secara otomatis dari skor mentah siswa.
 *
 * Alur:
 * 1. Baca baris dari sheet Input_MI (skor r_* per siswa)
 * 2. Hitung level per kecerdasan
 * 3. Ranking → tentukan top_1 / top_2 / top_3
 * 4. Lookup MASTER_MI → isi kolom per-kecerdasan
 * 5. Panggil Gemini → narasi_hero, narasi_kombinasi, narasi_profil_final, mapel_sulit_narasi_final
 * 6. Upsert baris ke Output_MI (match by murid_id + periode_id)
 *
 * Sheet yang dibutuhkan di Data Workbook:
 * - Input_MI       : satu baris per siswa, kolom lihat KOLOM_INPUT di bawah
 * - Output_MI      : sudah ada, pipeline menulis/update di sini
 *
 * Sebelum jalan:
 * - Set GEMINI_API_KEY di Script Properties (File > Project Properties > Script Properties)
 * - Set DATA_WORKBOOK_ID di Script Properties
 */

// ── Konfigurasi ────────────────────────────────────────────────────────────────

var PIPELINE_CONFIG = {
  inputSheet:  "Input_MI",
  outputSheet: "Output_MI",
  geminiModel: "gemini-3.5-flash",
};

var KOLOM_INPUT = [
  "murid_id", "nama_siswa", "kelas_id", "sekolah_id", "periode_id",
  "r_inter", "r_intra", "r_kines", "r_linguistik", "r_logmat",
  "r_musikal", "r_naturalis", "r_spasial",
  // opsional — kalau ada mapel sulit sudah diketahui:
  "mapel_sulit_1", "mapel_sulit_2",
];

// Urutan kode untuk ranking
var MI_CODES = ["Mu", "Sp", "Ve", "Lo", "Ki", "Ie", "Ia", "Na"];


// ── Entry point ────────────────────────────────────────────────────────────────

function runPipeline() {
  var props       = PropertiesService.getScriptProperties();
  var geminiKey   = props.getProperty("GEMINI_API_KEY");
  var wbId        = props.getProperty("DATA_WORKBOOK_ID");

  if (!geminiKey) throw new Error("GEMINI_API_KEY belum di-set di Script Properties.");
  if (!wbId)      throw new Error("DATA_WORKBOOK_ID belum di-set di Script Properties.");

  var wb         = SpreadsheetApp.openById(wbId);
  var inputSh    = wb.getSheetByName(PIPELINE_CONFIG.inputSheet);
  var outputSh   = wb.getSheetByName(PIPELINE_CONFIG.outputSheet);

  if (!inputSh)  throw new Error("Sheet " + PIPELINE_CONFIG.inputSheet + " tidak ditemukan.");
  if (!outputSh) throw new Error("Sheet " + PIPELINE_CONFIG.outputSheet + " tidak ditemukan.");

  var inputRows  = Gate.sheetToObjects(inputSh);
  var outputRows = Gate.sheetToObjects(outputSh);

  Logger.log("Pipeline mulai. Input: " + inputRows.length + " baris.");

  var processed = 0;
  var errors    = 0;

  inputRows.forEach(function(inp) {
    try {
      var result = buildOutputRow_(inp, geminiKey);
      upsertOutputMI_(outputSh, outputRows, result);
      processed++;
      Logger.log("OK: " + inp.murid_id + " / " + inp.nama_siswa);
    } catch (e) {
      errors++;
      Logger.log("ERROR " + inp.murid_id + ": " + e.message);
    }
    Utilities.sleep(1200); // hindari rate limit Gemini
  });

  Logger.log("Selesai. Berhasil: " + processed + ", Error: " + errors);
}

// Jalankan hanya satu murid_id (untuk testing)
function runPipelineSingle(muridId) {
  var props     = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty("GEMINI_API_KEY");
  var wbId      = props.getProperty("DATA_WORKBOOK_ID");
  var wb        = SpreadsheetApp.openById(wbId);
  var inputSh   = wb.getSheetByName(PIPELINE_CONFIG.inputSheet);
  var outputSh  = wb.getSheetByName(PIPELINE_CONFIG.outputSheet);
  var inputRows = Gate.sheetToObjects(inputSh);
  var outputRows = Gate.sheetToObjects(outputSh);

  var inp = inputRows.find(function(r) { return String(r.murid_id).trim() === muridId; });
  if (!inp) { Logger.log("murid_id tidak ditemukan: " + muridId); return; }

  var result = buildOutputRow_(inp, geminiKey);
  Logger.log("PREVIEW OUTPUT:");
  Logger.log(JSON.stringify(result, null, 2));
  upsertOutputMI_(outputSh, outputRows, result);
  Logger.log("Done: " + muridId);
}


// ── Core builder ───────────────────────────────────────────────────────────────

function buildOutputRow_(inp, geminiKey) {
  // 1. Skor dan level per kecerdasan
  var scores = {};
  var levels = {};
  MI_CODES.forEach(function(code) {
    var key   = MI_CODE_TO_SCORE_KEY[code];
    var score = parseFloat(inp[key]) || 0;
    scores[code] = score;
    levels[code] = computeLevel_(score);
  });

  // 2. Ranking → top 1/2/3
  var ranked = MI_CODES.slice().sort(function(a, b) {
    return scores[b] - scores[a];
  });
  var top = [ranked[0], ranked[1], ranked[2]];

  // 3. Lookup MASTER_MI per kecerdasan
  var masterData = {};
  MI_CODES.forEach(function(code) {
    masterData[code] = masterLookup_(code, levels[code]) || {};
  });

  // 4. Rakit kolom per-kecerdasan (prefix_arti, prefix_jaga, dll.)
  var perKolom = {};
  MI_CODES.forEach(function(code) {
    var prefix = MI_CODE_TO_PREFIX[code];
    var md     = masterData[code];
    perKolom[prefix + "_arti"]    = md.arti    || "";
    perKolom[prefix + "_jaga"]    = md.jaga    || "";
    perKolom[prefix + "_lakukan"] = arrayToLines_(md.lakukan);
    perKolom[prefix + "_profesi"] = arrayToLines_(md.profesi);
    perKolom[prefix + "_terlihat"]= arrayToLines_(md.terlihat);
    if (md.desc) perKolom[prefix + "_desc"] = md.desc;
  });

  // kolom pred_*
  var predKolom = {};
  predKolom["pred_inter"]    = levels["Ie"];
  predKolom["pred_intra"]    = levels["Ia"];
  predKolom["pred_kines"]    = levels["Ki"];
  predKolom["pred_linguis"]  = levels["Ve"];
  predKolom["pred_logmat"]   = levels["Lo"];
  predKolom["pred_musikal"]  = levels["Mu"];
  predKolom["pred_naturalis"]= levels["Na"];
  predKolom["pred_spasial"]  = levels["Sp"];

  // 5. Kolom TOP 1/2/3 dari master
  var topKolom = {};
  top.forEach(function(code, i) {
    var n   = i + 1;
    var nm  = MI_CODE_TO_NAME[code];
    var md  = masterData[code];
    topKolom["top_" + n]          = nm;
    topKolom["top_" + n + "_arti"]    = md.arti    || "";
    topKolom["top_" + n + "_jaga"]    = md.jaga    || "";
    topKolom["top_" + n + "_lakukan"] = arrayToLines_(md.lakukan);
    topKolom["top_" + n + "_profesi"] = arrayToLines_(md.profesi);
    topKolom["top_" + n + "_terlihat"]= arrayToLines_(md.terlihat);
  });

  // 6. Panggil Gemini untuk narasi sintetis
  var narasi = generateNarasi_(inp, scores, levels, top, masterData, geminiKey);

  // 7. Rakit baris final
  var row = {};
  row.murid_id   = String(inp.murid_id  || "").trim();
  row.nama_siswa = String(inp.nama_siswa|| "").trim();
  row.kelas_id   = String(inp.kelas_id  || "").trim();
  row.sekolah_id = String(inp.sekolah_id|| "").trim();
  row.periode_id = String(inp.periode_id|| "").trim();

  // skor
  row.r_inter     = scores["Ie"];
  row.r_intra     = scores["Ia"];
  row.r_kines     = scores["Ki"];
  row.r_linguistik= scores["Ve"];
  row.r_logmat    = scores["Lo"];
  row.r_musikal   = scores["Mu"];
  row.r_naturalis = scores["Na"];
  row.r_spasial   = scores["Sp"];

  // pred
  Object.assign(row, predKolom);

  // per-kecerdasan narasi
  Object.assign(row, perKolom);

  // top
  Object.assign(row, topKolom);

  // narasi sintetis dari Gemini
  row.narasi_hero          = narasi.hero;
  row.narasi_kombinasi     = narasi.kombinasi;
  row.narasi_profil_final  = narasi.profil;

  // mapel sulit
  row.mapel_sulit_1       = String(inp.mapel_sulit_1 || "").trim();
  row.mapel_sulit_2       = String(inp.mapel_sulit_2 || "").trim();
  row.mapel_sulit_1_desc  = narasi.mapel1Desc;
  row.mapel_sulit_2_desc  = narasi.mapel2Desc;
  row.mapel_sulit_narasi_final = narasi.mapelNarasi;

  return row;
}


// ── Gemini ─────────────────────────────────────────────────────────────────────

function generateNarasi_(inp, scores, levels, top, masterData, geminiKey) {
  var nama   = String(inp.nama_siswa || "Siswa").trim();
  var kelas  = String(inp.kelas_id   || "").trim();
  var mapel1 = String(inp.mapel_sulit_1 || "").trim();
  var mapel2 = String(inp.mapel_sulit_2 || "").trim();

  // Susun profil lengkap untuk prompt
  var skorList = MI_CODES.map(function(code) {
    return "- " + MI_CODE_TO_NAME[code] + ": " + scores[code] + " (" + levels[code] + ")";
  }).join("\n");

  var top3Detail = top.map(function(code, i) {
    var md = masterData[code];
    return "[TOP " + (i+1) + " - " + MI_CODE_TO_NAME[code] + "]\n" +
           "Arti: " + (md.arti || "") + "\n" +
           "Terlihat: " + arrayToLines_(md.terlihat) + "\n" +
           "Jaga: " + (md.jaga || "");
  }).join("\n\n");

  var mapelBlok = "";
  if (mapel1 || mapel2) {
    mapelBlok = "\nMapel yang dirasakan sulit:\n" +
      (mapel1 ? "- " + mapel1 + "\n" : "") +
      (mapel2 ? "- " + mapel2 + "\n" : "");
  }

  var prompt = [
    "Kamu adalah psikolog pendidikan yang menulis narasi personal untuk siswa SMA.",
    "Data siswa:",
    "Nama: " + nama + ", Kelas: " + kelas,
    "",
    "Skor kecerdasan majemuk (Howard Gardner):",
    skorList,
    "",
    "Tiga kecerdasan tertinggi:",
    top3Detail,
    mapelBlok,
    "",
    "Tugas kamu: tulis EMPAT blok narasi berikut.",
    "",
    "1. narasi_hero (2-3 kalimat)",
    "Pembuka personal langsung ke " + nama + " (pakai \"kamu\").",
    "Fokus pada cara belajar dominannya, bukan sekadar menyebut nama kecerdasan.",
    "Tidak ada kalimat klise seperti \"setiap orang unik\" atau \"kamu luar biasa\".",
    "",
    "2. narasi_kombinasi (2-3 kalimat)",
    "Jelaskan bagaimana dua atau tiga kecerdasan tertinggi saling bekerja pada " + nama + ".",
    "Konkret, pakai contoh situasi nyata (belajar, diskusi, mengerjakan tugas).",
    "",
    "3. narasi_profil_final (4-6 kalimat)",
    "Gambaran utuh profil belajar " + nama + " berdasarkan seluruh delapan kecerdasan.",
    "Sebut kekuatan yang sudah jelas, potensi yang masih bisa dikembangkan,",
    "dan satu saran konkret untuk cara belajar yang sesuai.",
    "",
    "4. mapel_strategi (1-2 kalimat per mapel yang sulit, atau kosongkan jika tidak ada mapel sulit)",
    "Hubungkan kecerdasan dominan " + nama + " dengan cara mendekati mapel yang terasa sulit.",
    "Bukan motivasi umum, tapi strategi spesifik berdasarkan profilnya.",
    "",
    "ATURAN WAJIB:",
    "- Bahasa Indonesia",
    "- DILARANG KERAS menggunakan em-dash ( — ) atau tanda hubung ganda (--) dalam bentuk apapun.",
    "  Ganti selalu dengan koma, titik koma, atau pecah jadi dua kalimat.",
    "- Tidak ada kata: sangat penting, perlu dicatat, pada dasarnya, sesungguhnya,",
    "  tentu saja, dengan demikian, merupakan, terdapat, komprehensif, holistik.",
    "- Tidak ada kalimat pembuka seperti \"Berikut adalah\" atau \"Tentu saja\".",
    "- Nada hangat tapi lugas.",
    "",
    "FORMAT OUTPUT (jangan tambah apapun di luar format ini):",
    "NARASI_HERO:",
    "[isi]",
    "",
    "NARASI_KOMBINASI:",
    "[isi]",
    "",
    "NARASI_PROFIL:",
    "[isi]",
    "",
    "MAPEL_STRATEGI:",
    "[isi, atau tulis KOSONG jika tidak ada mapel sulit]",
  ].join("\n");

  var raw = callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseNarasiOutput_(raw, mapel1, mapel2);
}

function callGemini_(prompt, apiKey) {
  var url     = "https://generativelanguage.googleapis.com/v1beta/models/" +
                PIPELINE_CONFIG.geminiModel + ":generateContent?key=" + apiKey;
  var payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  var resp = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: payload,
    muteHttpExceptions: true,
  });
  var data = JSON.parse(resp.getContentText());
  if (data.error) throw new Error("Gemini error: " + data.error.message);

  // Ambil hanya bagian teks yang bukan thinking
  var parts = data.candidates[0].content.parts;
  var text = "";
  for (var i = 0; i < parts.length; i++) {
    if (!parts[i].thought) text += parts[i].text || "";
  }

  // Fallback: potong mulai NARASI_HERO jika thinking masih menyusup
  var heroIdx = text.indexOf("NARASI_HERO:");
  if (heroIdx > 0) text = text.substring(heroIdx);

  return text;
}

function parseNarasiOutput_(raw, mapel1, mapel2) {
  function extract_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)", "i");
    var m  = raw.match(re);
    if (!m) return "";
    return m[1].trim().replace(/^KOSONG$/i, "");
  }

  var mapelBlok  = extract_("MAPEL_STRATEGI");
  var mapel1Desc = "";
  var mapel2Desc = "";
  var mapelNarasi = mapelBlok;

  // Coba pisah per mapel kalau ada dua
  if (mapelBlok && mapel1 && mapel2) {
    var lines = mapelBlok.split(/\n/).filter(function(l) { return l.trim(); });
    if (lines.length >= 2) {
      mapel1Desc  = lines[0];
      mapel2Desc  = lines[1];
    } else {
      mapel1Desc = mapelBlok;
    }
  } else if (mapelBlok && mapel1) {
    mapel1Desc = mapelBlok;
  }

  return {
    hero:       extract_("NARASI_HERO"),
    kombinasi:  extract_("NARASI_KOMBINASI"),
    profil:     extract_("NARASI_PROFIL"),
    mapel1Desc: mapel1Desc,
    mapel2Desc: mapel2Desc,
    mapelNarasi: mapelNarasi,
  };
}


// ── Output_MI upsert ───────────────────────────────────────────────────────────

function normalizeKey_(h) {
  return String(h).toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function upsertOutputMI_(sheet, existingRows, newRow) {
  var rawHeaders  = getRawHeaders_(sheet);
  var normHeaders = rawHeaders.map(normalizeKey_);
  var muridId     = String(newRow.murid_id).trim();

  var muridIdx  = normHeaders.indexOf("murid_id");
  var dataRange = sheet.getDataRange();
  var values    = dataRange.getValues();

  for (var r = 1; r < values.length; r++) {
    if (String(values[r][muridIdx]).trim() === muridId) {
      var updated = normHeaders.map(function(nk, i) {
        return newRow[nk] !== undefined ? newRow[nk] : values[r][i];
      });
      sheet.getRange(r + 1, 1, 1, rawHeaders.length).setValues([updated]);
      Logger.log("Updated baris murid_id=" + muridId);
      return;
    }
  }

  // Baris baru jika belum ada
  var appended = normHeaders.map(function(nk) { return newRow[nk] !== undefined ? newRow[nk] : ""; });
  sheet.appendRow(appended);
  Logger.log("Appended baris baru murid_id=" + muridId);
}

function getRawHeaders_(sheet) {
  var firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return firstRow.filter(function(h) { return String(h).trim() !== ""; });
}


// ── Helper ─────────────────────────────────────────────────────────────────────

function stripEmDash_(text) {
  return text
    .replace(/—/g, ", ")   // em-dash → koma spasi
    .replace(/–/g, ", ")   // en-dash → koma spasi
    .replace(/--/g, ", ")       // double hyphen → koma spasi
    .replace(/,\s*,/g, ",");    // bersihkan koma ganda kalau muncul
}

function arrayToLines_(arr) {
  if (!arr || !arr.length) return "";
  return arr.map(function(s) { return "- " + s; }).join("\n");
}
