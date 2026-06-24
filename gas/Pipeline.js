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
  "essay_kelebihan_cara_berpikir", "essay_cara_belajar", "essay_penggunaan_ai",
  "essay_citacita_profesi", "essay_alasan_pilih_profesi", "essay_cara_belajar_paling_berhasil",
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

  Utilities.sleep(800);
  // 7. Konten BakatView bagian 1: narasi cover, cara belajar, gaya komunikasi, ciri khas
  var laporan1 = generateLaporanBagian1_(inp, scores, levels, top, masterData, geminiKey);

  Utilities.sleep(800);
  // 8. Konten BakatView bagian 2: SMART goals, 7 hari, sinyal ortu, refleksi, diskusi
  var laporan2 = generateLaporanBagian2_(inp, scores, levels, top, masterData, geminiKey);

  Utilities.sleep(800);
  // 9. Konten BakatView bagian 3: jurusan, parenttip, profesi sorot per top intel
  var laporan3 = generateLaporanBagian3_(inp, scores, levels, top, masterData, geminiKey);

  Utilities.sleep(800);
  // 10. Konten BakatView bagian 4: detail semua profesi per top intel (pipe-delimited)
  var laporan4 = generateLaporanBagian4_(inp, scores, levels, top, masterData, geminiKey);

  // 11. aha_persen deterministik berdasarkan jumlah kecerdasan Kuat di top 3
  var ahaPersen = computeAhaPersen_(levels, top);

  // 11. Rakit baris final
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

  // essays — passthrough dari Input_MI ke Output_MI
  row.essay_kelebihan_cara_berpikir     = String(inp.essay_kelebihan_cara_berpikir     || "").trim();
  row.essay_cara_belajar                = String(inp.essay_cara_belajar                || "").trim();
  row.essay_penggunaan_ai               = String(inp.essay_penggunaan_ai               || "").trim();
  row.essay_citacita_profesi            = String(inp.essay_citacita_profesi            || "").trim();
  row.essay_alasan_pilih_profesi        = String(inp.essay_alasan_pilih_profesi        || "").trim();
  row.essay_cara_belajar_paling_berhasil= String(inp.essay_cara_belajar_paling_berhasil|| "").trim();

  // ── Kolom BakatView bagian 1 ──────────────────────────────────────────────
  row.narasi_cover         = laporan1.narasi_cover         || "";
  row.cara_belajar_summary = laporan1.cara_belajar_summary || "";
  var cb;
  for (cb = 1; cb <= 5; cb++) {
    row["cara_belajar_" + cb + "_title"] = laporan1["cara_belajar_" + cb + "_title"] || "";
    row["cara_belajar_" + cb + "_body"]  = laporan1["cara_belajar_" + cb + "_body"]  || "";
  }
  row.mapel_kuasai = laporan1.mapel_kuasai || "";
  row.aha_desc     = laporan1.aha_desc     || "";
  row.aha_persen   = ahaPersen;
  var ck;
  for (ck = 1; ck <= 4; ck++) {
    row["ciri_khas_" + ck] = laporan1["ciri_khas_" + ck] || "";
  }
  var gp;
  for (gp = 1; gp <= 4; gp++) {
    row["gaya_kom_positif_" + gp] = laporan1["gaya_kom_positif_" + gp] || "";
  }
  var gh;
  for (gh = 1; gh <= 3; gh++) {
    row["gaya_kom_hindari_" + gh] = laporan1["gaya_kom_hindari_" + gh] || "";
  }
  var gs;
  for (gs = 1; gs <= 3; gs++) {
    row["gaya_kom_siswa_" + gs + "_situasi"] = laporan1["gaya_kom_siswa_" + gs + "_situasi"] || "";
    row["gaya_kom_siswa_" + gs + "_script"]  = laporan1["gaya_kom_siswa_" + gs + "_script"]  || "";
  }

  // ── Kolom BakatView bagian 2 ──────────────────────────────────────────────
  row.smart_s = laporan2.smart_s || "";
  row.smart_m = laporan2.smart_m || "";
  row.smart_a = laporan2.smart_a || "";
  row.smart_r = laporan2.smart_r || "";
  row.smart_t = laporan2.smart_t || "";
  var h;
  for (h = 1; h <= 7; h++) {
    row["hari_" + h] = laporan2["hari_" + h] || "";
  }
  var so;
  for (so = 1; so <= 5; so++) {
    row["sinyal_" + so + "_icon"]  = laporan2["sinyal_" + so + "_icon"]  || "";
    row["sinyal_" + so + "_title"] = laporan2["sinyal_" + so + "_title"] || "";
    row["sinyal_" + so + "_body"]  = laporan2["sinyal_" + so + "_body"]  || "";
  }
  var rfl;
  for (rfl = 1; rfl <= 4; rfl++) {
    row["refleksi_" + rfl] = laporan2["refleksi_" + rfl] || "";
    row["diskusi_"  + rfl] = laporan2["diskusi_"  + rfl] || "";
  }

  // ── Kolom BakatView bagian 3 ──────────────────────────────────────────────
  var tn;
  for (tn = 1; tn <= 3; tn++) {
    row["top_" + tn + "_jurusan"]               = laporan3["top_" + tn + "_jurusan"]               || "";
    row["top_" + tn + "_parenttip"]             = laporan3["top_" + tn + "_parenttip"]             || "";
    row["top_" + tn + "_profesi_sorot"]         = laporan3["top_" + tn + "_profesi_sorot"]         || "";
    row["top_" + tn + "_profesi_sorot_desc"]    = laporan3["top_" + tn + "_profesi_sorot_desc"]    || "";
    row["top_" + tn + "_profesi_sorot_skill_1"] = laporan3["top_" + tn + "_profesi_sorot_skill_1"] || "";
    row["top_" + tn + "_profesi_sorot_skill_2"] = laporan3["top_" + tn + "_profesi_sorot_skill_2"] || "";
    row["top_" + tn + "_profesi_sorot_skill_3"] = laporan3["top_" + tn + "_profesi_sorot_skill_3"] || "";
    row["top_" + tn + "_profesi_sorot_jalur"]   = laporan3["top_" + tn + "_profesi_sorot_jalur"]   || "";
    row["top_" + tn + "_profesi_sorot_figur"]   = laporan3["top_" + tn + "_profesi_sorot_figur"]   || "";
  }

  // ── Kolom BakatView bagian 4 ──────────────────────────────────────────────
  row["top_1_profesi_detail"] = laporan4["top_1_profesi_detail"] || "";
  row["top_2_profesi_detail"] = laporan4["top_2_profesi_detail"] || "";
  row["top_3_profesi_detail"] = laporan4["top_3_profesi_detail"] || "";

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
    "4. mapel_strategi",
    mapel1 && mapel2
      ? "Tulis DUA baris terpisah: baris 1 untuk " + mapel1 + ", baris 2 untuk " + mapel2 + "."
      : mapel1
        ? "Tulis satu strategi konkret untuk " + mapel1 + " berdasarkan profil kecerdasan " + nama + "."
        : "Tulis KOSONG.",
    "Hubungkan ke kecerdasan dominan. Bukan motivasi umum, tapi langkah nyata.",
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

  var data;
  var delays = [3000, 8000, 20000]; // retry 3x dengan jeda makin panjang
  for (var attempt = 0; attempt <= delays.length; attempt++) {
    var resp = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: payload,
      muteHttpExceptions: true,
    });
    data = JSON.parse(resp.getContentText());
    if (!data.error) break;
    var isRetryable = data.error.code === 429 || data.error.code === 503 ||
                      (data.error.message && data.error.message.indexOf("high demand") !== -1);
    if (!isRetryable || attempt === delays.length) {
      throw new Error("Gemini error: " + data.error.message);
    }
    Logger.log("Gemini overload, retry " + (attempt + 1) + " dalam " + delays[attempt] + "ms...");
    Utilities.sleep(delays[attempt]);
  }
  if (data.error) throw new Error("Gemini error: " + data.error.message);

  // Ambil hanya bagian teks yang bukan thinking
  var parts = data.candidates[0].content.parts;
  var text = "";
  for (var i = 0; i < parts.length; i++) {
    if (!parts[i].thought) text += parts[i].text || "";
  }

  // Bersihkan markdown code fencing kalau Gemini membungkus dengan ```
  text = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/i, "").trim();

  // Potong teks sebelum label pertama (format HURUF_BESAR: di awal baris)
  var firstLabel = text.search(/(?:^|\n)[A-Z][A-Z_0-9]{2,}:/);
  if (firstLabel > 0) text = text.substring(firstLabel).trim();

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
  var mapelNarasi = "";

  if (mapelBlok && mapel1 && mapel2) {
    // Dua mapel: pisah per baris, baris pertama = mapel1, kedua = mapel2
    var lines = mapelBlok.split(/\n/).filter(function(l) { return l.trim(); });
    if (lines.length >= 2) {
      mapel1Desc  = lines[0].trim();
      mapel2Desc  = lines[1].trim();
      // Sisa baris (jika ada) jadi narasi penutup
      if (lines.length > 2) mapelNarasi = lines.slice(2).join(" ").trim();
    } else {
      mapel1Desc  = mapelBlok;
    }
  } else if (mapelBlok && mapel1) {
    // Satu mapel: desc = baris pertama, narasi = baris kedua dst
    var lines1 = mapelBlok.split(/\n/).filter(function(l) { return l.trim(); });
    mapel1Desc  = lines1[0] || mapelBlok;
    if (lines1.length > 1) mapelNarasi = lines1.slice(1).join(" ").trim();
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


// ── Laporan BakatView: fungsi pembantu ────────────────────────────────────────

/**
 * Hitung aha_persen berdasarkan berapa kecerdasan di top 3 yang level-nya Kuat.
 * Nilai adalah estimasi konservatif untuk narasi statistik di cover laporan.
 */
function computeAhaPersen_(levels, top) {
  var kuatCount = 0;
  for (var i = 0; i < top.length; i++) {
    if (levels[top[i]] === "Kuat") kuatCount++;
  }
  if (kuatCount >= 3) return "8%";
  if (kuatCount >= 2) return "15%";
  return "25%";
}

/**
 * Bagian 1: narasi cover, cara belajar, aha moment, ciri khas, gaya komunikasi, mapel kuasai.
 * Satu Gemini call, output pipe-delimited per seksi.
 */
function generateLaporanBagian1_(inp, scores, levels, top, masterData, geminiKey) {
  var nama      = String(inp.nama_siswa || "Siswa").trim();
  var panggilan = nama.split(/\s+/)[0];
  var top1Name  = MI_CODE_TO_NAME[top[0]];
  var top2Name  = MI_CODE_TO_NAME[top[1]];
  var top3Name  = top[2] ? MI_CODE_TO_NAME[top[2]] : "";
  var top1Arti    = (masterData[top[0]] || {}).arti || "";
  var top2Arti    = (masterData[top[1]] || {}).arti || "";
  var top3Arti    = top[2] ? ((masterData[top[2]] || {}).arti  || "") : "";
  var top1Belajar = INTEL_GAYA_BELAJAR[top[0]] || "";
  var top2Belajar = INTEL_GAYA_BELAJAR[top[1]] || "";
  var top3Belajar = top[2] ? (INTEL_GAYA_BELAJAR[top[2]] || "") : "";
  var skorSingkat = MI_CODES.map(function(code) {
    return MI_CODE_TO_NAME[code] + " " + scores[code] + " (" + levels[code] + ")";
  }).join(", ");

  var essayContext = [];
  if (inp.essay_kelebihan_cara_berpikir)      essayContext.push("Kelebihan cara berpikir: " + inp.essay_kelebihan_cara_berpikir);
  if (inp.essay_cara_belajar)                 essayContext.push("Cara belajar yang dirasakan: " + inp.essay_cara_belajar);
  if (inp.essay_cara_belajar_paling_berhasil) essayContext.push("Cara belajar paling berhasil: " + inp.essay_cara_belajar_paling_berhasil);
  if (inp.essay_citacita_profesi)             essayContext.push("Cita-cita profesi: " + inp.essay_citacita_profesi);
  if (inp.essay_alasan_pilih_profesi)         essayContext.push("Alasan pilih profesi: " + inp.essay_alasan_pilih_profesi);
  if (inp.essay_penggunaan_ai)                essayContext.push("Cara menggunakan AI: " + inp.essay_penggunaan_ai);

  var gayaBelajarLines = [
    "",
    "Gaya belajar per kecerdasan dominan (wajib jadi acuan, jangan diubah):",
    "- " + top1Name + " (Top 1): " + top1Belajar,
    "- " + top2Name + " (Top 2): " + top2Belajar,
  ];
  if (top3Name && top3Belajar) gayaBelajarLines.push("- " + top3Name + " (Top 3): " + top3Belajar);

  var promptLines = [
    "Kamu adalah psikolog pendidikan yang menulis laporan bakat personal untuk siswa.",
    "Nama: " + nama + " | Panggil: " + panggilan,
    "Top 3 kecerdasan: " + top1Name + " " + scores[top[0]] + ", "
      + top2Name + " " + scores[top[1]]
      + (top3Name ? ", " + top3Name + " " + scores[top[2]] : ""),
    "Semua skor: " + skorSingkat,
    "Narasi top 1 (" + top1Name + "): " + top1Arti,
    "Narasi top 2 (" + top2Name + "): " + top2Arti,
  ];
  if (top3Name && top3Arti) promptLines.push("Narasi top 3 (" + top3Name + "): " + top3Arti);
  promptLines = promptLines.concat(gayaBelajarLines);
  if (essayContext.length) {
    promptLines.push("", "Kata langsung dari " + panggilan + ":");
    promptLines = promptLines.concat(essayContext);
  }
  promptLines = promptLines.concat([
    "",
    "Tulis konten dalam format PERSIS berikut. Tidak ada teks di luar format ini.",
    "Gunakan nama panggilan '" + panggilan + "' di mana relevan.",
    "",
    "NARASI_COVER:",
    "1 kalimat saja, maksimal 12 kata. Hook tentang cara " + panggilan + " berpikir dan belajar berdasarkan kecerdasan " + top1Name + " dan " + top2Name + ". Jangan mulai dengan 'Kamu' atau 'Dia'. Jangan gunakan kata visual, gambar, atau diagram kecuali Spasial masuk top 3. Langsung ke inti, spesifik dan mengejutkan.",
    "",
    "CARA_BELAJAR_SUMMARY:",
    "1-2 kalimat ringkas cara belajar paling efektif untuk " + panggilan + " berdasarkan kecerdasan " + top1Name + " dan " + top2Name + ".",
    "",
    "CARA_BELAJAR:",
    "5 cara belajar sesuai gaya belajar kecerdasan " + top1Name + " dan " + top2Name + ". Format tiap baris: nomor|judul 3-5 kata|penjelasan 1-2 kalimat konkret",
    "01|Judul|Penjelasan",
    "02|Judul|Penjelasan",
    "03|Judul|Penjelasan",
    "04|Judul|Penjelasan",
    "05|Judul|Penjelasan",
    "",
    "AHA_DESC:",
    "Judul 4-7 kata yang menggambarkan kombinasi unik kecerdasan " + panggilan + ".",
    "",
    "CIRI_KHAS:",
    "4 ciri khas. Format: nomor|frasa pendek 3-5 kata",
    "01|Frasa",
    "02|Frasa",
    "03|Frasa",
    "04|Frasa",
    "",
    "GAYA_KOM_POSITIF:",
    "4 panduan komunikasi untuk orang tua atau guru. Format: nomor|kalimat panduan",
    "01|Panduan",
    "02|Panduan",
    "03|Panduan",
    "04|Panduan",
    "",
    "GAYA_KOM_HINDARI:",
    "3 hal yang harus dihindari saat berkomunikasi dengan " + panggilan + ". Format: nomor|kalimat",
    "01|Hindari",
    "02|Hindari",
    "03|Hindari",
    "",
    "GAYA_KOM_SISWA:",
    "3 script kalimat yang bisa dipakai " + panggilan + ". Format: nomor|situasi singkat|kalimat script",
    "01|Situasi|Script",
    "02|Situasi|Script",
    "03|Situasi|Script",
    "",
    "MAPEL_KUASAI:",
    "5-6 mata pelajaran yang cocok dengan kecerdasan " + panggilan + ", dipisah koma.",
    "",
    "ATURAN WAJIB:",
    "- Bahasa Indonesia.",
    "- DILARANG KERAS em-dash ( — ) dan double dash (--). Ganti dengan koma atau pecah kalimat.",
    "- Tidak ada kata: sangat penting, pada dasarnya, sesungguhnya, merupakan, terdapat, komprehensif.",
    "- Pisah kolom dengan | (pipe). Jangan ada | di dalam teks konten.",
    "- Langsung ke format, tidak ada intro atau penutup.",
  ]);
  var prompt = promptLines.join("\n");

  var raw = callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseLaporanBagian1_(raw);
}

function parseLaporanBagian1_(raw) {
  function extractBlock_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z_0-9]{2,}:|$)", "i");
    var m  = raw.match(re);
    return m ? m[1].trim() : "";
  }

  function parsePipeLines_(block) {
    return block.split("\n")
      .map(function(l) { return l.trim(); })
      .filter(function(l) { return l.length > 0 && l.indexOf("|") !== -1; });
  }

  function col_(line, idx) {
    var parts = line.split("|");
    return idx < parts.length ? parts[idx].trim() : "";
  }

  var result = {
    narasi_cover:         extractBlock_("NARASI_COVER"),
    cara_belajar_summary: extractBlock_("CARA_BELAJAR_SUMMARY"),
    aha_desc:             extractBlock_("AHA_DESC"),
    mapel_kuasai:         extractBlock_("MAPEL_KUASAI"),
  };

  var cb, ck, gp, gh, gs, n;
  var caraBelajarLines = parsePipeLines_(extractBlock_("CARA_BELAJAR"));
  for (cb = 0; cb < caraBelajarLines.length && cb < 5; cb++) {
    n = cb + 1;
    result["cara_belajar_" + n + "_title"] = col_(caraBelajarLines[cb], 1);
    result["cara_belajar_" + n + "_body"]  = col_(caraBelajarLines[cb], 2);
  }

  var ciriLines = parsePipeLines_(extractBlock_("CIRI_KHAS"));
  for (ck = 0; ck < ciriLines.length && ck < 4; ck++) {
    result["ciri_khas_" + (ck + 1)] = col_(ciriLines[ck], 1);
  }

  var positifLines = parsePipeLines_(extractBlock_("GAYA_KOM_POSITIF"));
  for (gp = 0; gp < positifLines.length && gp < 4; gp++) {
    result["gaya_kom_positif_" + (gp + 1)] = col_(positifLines[gp], 1);
  }

  var hindariLines = parsePipeLines_(extractBlock_("GAYA_KOM_HINDARI"));
  for (gh = 0; gh < hindariLines.length && gh < 3; gh++) {
    result["gaya_kom_hindari_" + (gh + 1)] = col_(hindariLines[gh], 1);
  }

  var siswaLines = parsePipeLines_(extractBlock_("GAYA_KOM_SISWA"));
  for (gs = 0; gs < siswaLines.length && gs < 3; gs++) {
    n = gs + 1;
    result["gaya_kom_siswa_" + n + "_situasi"] = col_(siswaLines[gs], 1);
    result["gaya_kom_siswa_" + n + "_script"]  = col_(siswaLines[gs], 2);
  }

  return result;
}

/**
 * Bagian 2: SMART goals, 7 hari pertama, sinyal orang tua, refleksi, diskusi.
 */
function generateLaporanBagian2_(inp, scores, levels, top, masterData, geminiKey) {
  var nama      = String(inp.nama_siswa || "Siswa").trim();
  var panggilan = nama.split(/\s+/)[0];
  var top1Name  = MI_CODE_TO_NAME[top[0]];
  var top2Name  = MI_CODE_TO_NAME[top[1]];
  var top3Name  = top[2] ? MI_CODE_TO_NAME[top[2]] : "";

  var prompt = [
    "Kamu adalah psikolog pendidikan yang menulis rencana aksi dan pertanyaan refleksi untuk siswa SMA.",
    "Nama: " + nama + " | Panggil: " + panggilan,
    "Top 3 kecerdasan: " + top1Name + " " + scores[top[0]] + ", "
      + top2Name + " " + scores[top[1]]
      + (top3Name ? ", " + top3Name + " " + scores[top[2]] : ""),
    "",
    "Tulis konten dalam format PERSIS berikut. Tidak ada teks di luar format ini.",
    "",
    "SMART_GOALS:",
    "Format: huruf|isi satu paragraf pendek",
    "S|Spesifik: satu aktivitas konkret yang bisa dilakukan " + panggilan + " sekarang",
    "M|Terukur: bagaimana " + panggilan + " tahu sudah maju",
    "A|Achievable: kenapa ini realistis untuk " + panggilan + " di usianya sekarang",
    "R|Relevan: kaitannya dengan kecerdasan utama " + panggilan,
    "T|Time-bound: kapan dan bagaimana " + panggilan + " evaluasi kemajuannya",
    "",
    "HARI_7:",
    "7 tugas harian. Mulai ringan di hari 1, makin menantang di hari 6-7. Format: nomor|tugas konkret",
    "1|Tugas hari 1",
    "2|Tugas hari 2",
    "3|Tugas hari 3",
    "4|Tugas hari 4",
    "5|Tugas hari 5",
    "6|Tugas hari 6",
    "7|Tugas hari 7",
    "",
    "SINYAL_ORTU:",
    "5 sinyal yang bisa diperhatikan orang tua. Format: nomor|satu emoji|judul situasi singkat|penjelasan 1-2 kalimat untuk orang tua",
    "1|emoji|Judul|Penjelasan",
    "2|emoji|Judul|Penjelasan",
    "3|emoji|Judul|Penjelasan",
    "4|emoji|Judul|Penjelasan",
    "5|emoji|Judul|Penjelasan",
    "",
    "REFLEKSI:",
    "4 pertanyaan introspektif untuk " + panggilan + " sendiri. Format: nomor|pertanyaan",
    "1|Pertanyaan",
    "2|Pertanyaan",
    "3|Pertanyaan",
    "4|Pertanyaan",
    "",
    "DISKUSI:",
    "4 pertanyaan yang bagus dibahas bersama orang tua. Format: nomor|pertanyaan",
    "1|Pertanyaan",
    "2|Pertanyaan",
    "3|Pertanyaan",
    "4|Pertanyaan",
    "",
    "ATURAN WAJIB:",
    "- Bahasa Indonesia.",
    "- DILARANG KERAS em-dash ( — ) dan double dash (--). Ganti dengan koma atau pecah kalimat.",
    "- Tidak ada kata: sangat penting, pada dasarnya, sesungguhnya, merupakan, terdapat.",
    "- Pisah kolom dengan | (pipe). Jangan ada | di dalam teks konten.",
    "- Langsung ke format, tidak ada intro atau penutup.",
  ].join("\n");

  var raw = callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseLaporanBagian2_(raw);
}

function parseLaporanBagian2_(raw) {
  function extractBlock_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z_0-9]{2,}:|$)", "i");
    var m  = raw.match(re);
    return m ? m[1].trim() : "";
  }

  function parsePipeLines_(block) {
    return block.split("\n")
      .map(function(l) { return l.trim(); })
      .filter(function(l) { return l.length > 0 && l.indexOf("|") !== -1; });
  }

  function col_(line, idx) {
    var parts = line.split("|");
    return idx < parts.length ? parts[idx].trim() : "";
  }

  var result = {};
  var i, n, line;

  // SMART goals: keyed by letter (first column)
  var smartMap = { S: "", M: "", A: "", R: "", T: "" };
  var smartLines = parsePipeLines_(extractBlock_("SMART_GOALS"));
  for (i = 0; i < smartLines.length; i++) {
    var letter = col_(smartLines[i], 0).toUpperCase();
    if (Object.prototype.hasOwnProperty.call(smartMap, letter)) {
      smartMap[letter] = col_(smartLines[i], 1);
    }
  }
  result.smart_s = smartMap.S;
  result.smart_m = smartMap.M;
  result.smart_a = smartMap.A;
  result.smart_r = smartMap.R;
  result.smart_t = smartMap.T;

  // 7 hari
  var hari7Lines = parsePipeLines_(extractBlock_("HARI_7"));
  for (i = 0; i < hari7Lines.length; i++) {
    n = parseInt(col_(hari7Lines[i], 0), 10);
    if (n >= 1 && n <= 7) {
      result["hari_" + n] = col_(hari7Lines[i], 1);
    }
  }

  // Sinyal ortu: format no|emoji|judul|body
  var sinyalLines = parsePipeLines_(extractBlock_("SINYAL_ORTU"));
  for (i = 0; i < sinyalLines.length; i++) {
    line = sinyalLines[i];
    n    = parseInt(col_(line, 0), 10);
    if (n >= 1 && n <= 5) {
      result["sinyal_" + n + "_icon"]  = col_(line, 1);
      result["sinyal_" + n + "_title"] = col_(line, 2);
      result["sinyal_" + n + "_body"]  = col_(line, 3);
    }
  }

  // Refleksi dan diskusi
  var refleksiLines = parsePipeLines_(extractBlock_("REFLEKSI"));
  for (i = 0; i < refleksiLines.length; i++) {
    n = parseInt(col_(refleksiLines[i], 0), 10);
    if (n >= 1 && n <= 4) result["refleksi_" + n] = col_(refleksiLines[i], 1);
  }

  var diskusiLines = parsePipeLines_(extractBlock_("DISKUSI"));
  for (i = 0; i < diskusiLines.length; i++) {
    n = parseInt(col_(diskusiLines[i], 0), 10);
    if (n >= 1 && n <= 4) result["diskusi_" + n] = col_(diskusiLines[i], 1);
  }

  return result;
}

/**
 * Bagian 3: Jurusan kuliah, tips orang tua, dan profesi sorot per top 3 kecerdasan.
 */
function generateLaporanBagian3_(inp, scores, levels, top, masterData, geminiKey) {
  var nama      = String(inp.nama_siswa || "Siswa").trim();
  var panggilan = nama.split(/\s+/)[0];
  var topNames  = [
    MI_CODE_TO_NAME[top[0]] || "",
    top[1] ? (MI_CODE_TO_NAME[top[1]] || "") : "",
    top[2] ? (MI_CODE_TO_NAME[top[2]] || "") : "",
  ];

  var scoreStr = topNames[0] + " " + scores[top[0]]
    + (topNames[1] ? ", " + topNames[1] + " " + scores[top[1]] : "")
    + (topNames[2] ? ", " + topNames[2] + " " + scores[top[2]] : "");

  var lines = [
    "Kamu adalah konselor karier yang menulis konten jalur karier personal untuk siswa SMA.",
    "Nama: " + nama + " | Panggil: " + panggilan,
    "Top 3 kecerdasan: " + scoreStr,
    "",
    "Tulis konten dalam format PERSIS berikut. Tidak ada teks di luar format ini.",
  ];

  var i;
  for (i = 0; i < 3; i++) {
    var n = i + 1;
    var topName = topNames[i];
    if (!topName) continue;
    lines = lines.concat([
      "",
      "TOP_" + n + "_JURUSAN:",
      "3-5 jurusan kuliah yang relevan dengan kecerdasan " + topName + ", dipisah koma.",
      "",
      "TOP_" + n + "_PARENTTIP:",
      "1-2 kalimat tips konkret untuk orang tua mendukung kecerdasan " + topName + " " + panggilan + " di rumah.",
      "",
      "TOP_" + n + "_PROFESI_SOROT:",
      "Satu nama profesi unggulan paling cocok dengan kecerdasan " + topName + ".",
      "",
      "TOP_" + n + "_PROFESI_SOROT_DESC:",
      "2-3 kalimat: apa yang dikerjakan, di mana bekerja, mengapa cocok untuk " + panggilan + ".",
      "",
      "TOP_" + n + "_PROFESI_SOROT_SKILL:",
      "3 skill utama. Format: nomor|deskripsi skill",
      "01|Skill",
      "02|Skill",
      "03|Skill",
      "",
      "TOP_" + n + "_PROFESI_SOROT_JALUR:",
      "1-2 kalimat jalur pendidikan dan karier untuk masuk ke profesi ini.",
      "",
      "TOP_" + n + "_PROFESI_SOROT_FIGUR:",
      "1-3 nama tokoh inspiratif di profesi ini, dipisah koma.",
    ]);
  }

  lines = lines.concat([
    "",
    "ATURAN WAJIB:",
    "- Bahasa Indonesia.",
    "- DILARANG KERAS em-dash ( — ) dan double dash (--). Ganti dengan koma atau pecah kalimat.",
    "- Tidak ada kata: sangat penting, pada dasarnya, sesungguhnya, merupakan, terdapat.",
    "- Pisah kolom skill dengan | (pipe). Jangan ada | di dalam teks lain.",
    "- Langsung ke format, tidak ada intro atau penutup.",
  ]);

  var prompt = lines.join("\n");
  var raw = callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseLaporanBagian3_(raw);
}

function parseLaporanBagian3_(raw) {
  function extractBlock_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z_0-9]{2,}:|$)", "i");
    var m  = raw.match(re);
    return m ? m[1].trim() : "";
  }

  function parsePipeLines_(block) {
    return block.split("\n")
      .map(function(l) { return l.trim(); })
      .filter(function(l) { return l.length > 0 && l.indexOf("|") !== -1; });
  }

  function col_(line, idx) {
    var parts = line.split("|");
    return idx < parts.length ? parts[idx].trim() : "";
  }

  var result = {};
  var n, i, skillLines;

  for (n = 1; n <= 3; n++) {
    result["top_" + n + "_jurusan"]             = extractBlock_("TOP_" + n + "_JURUSAN");
    result["top_" + n + "_parenttip"]           = extractBlock_("TOP_" + n + "_PARENTTIP");
    result["top_" + n + "_profesi_sorot"]       = extractBlock_("TOP_" + n + "_PROFESI_SOROT");
    result["top_" + n + "_profesi_sorot_desc"]  = extractBlock_("TOP_" + n + "_PROFESI_SOROT_DESC");
    result["top_" + n + "_profesi_sorot_jalur"] = extractBlock_("TOP_" + n + "_PROFESI_SOROT_JALUR");
    result["top_" + n + "_profesi_sorot_figur"] = extractBlock_("TOP_" + n + "_PROFESI_SOROT_FIGUR");

    skillLines = parsePipeLines_(extractBlock_("TOP_" + n + "_PROFESI_SOROT_SKILL"));
    for (i = 0; i < skillLines.length && i < 3; i++) {
      result["top_" + n + "_profesi_sorot_skill_" + (i + 1)] = col_(skillLines[i], 1);
    }
  }

  return result;
}

/**
 * Bagian 4: detail semua profesi untuk tiap top intel.
 * Output: 3 kolom profesi_detail, tiap kolom = satu baris per profesi, pipe-delimited:
 *   nama|deskripsi 2 kalimat|skill1|skill2|skill3|jalur pendidikan
 */
function generateLaporanBagian4_(inp, scores, levels, top, masterData, geminiKey) {
  var top1Name = MI_CODE_TO_NAME[top[0]];
  var top2Name = MI_CODE_TO_NAME[top[1]];
  var top3Name = top[2] ? MI_CODE_TO_NAME[top[2]] : "";

  var sections = [];
  for (var i = 0; i < top.length; i++) {
    var n        = i + 1;
    var intelName = MI_CODE_TO_NAME[top[i]];
    var profesiList = (masterData[top[i]] || {}).profesi || [];
    var listStr  = Array.isArray(profesiList) ? profesiList.join(", ") : String(profesiList);

    sections.push(
      "TOP_" + n + "_PROFESI_DETAIL:",
      "Untuk setiap profesi berikut yang cocok dengan kecerdasan " + intelName + ":",
      listStr,
      "Tulis satu baris per profesi. Format PERSIS: nama profesi|deskripsi apa yang dikerjakan dan di mana (2 kalimat)|skill utama 1|skill utama 2|skill utama 3|jalur pendidikan (1 kalimat)",
      "Contoh format:",
      "Ahli Ekologi|Meneliti ekosistem dan rantai makanan di lapangan serta laboratorium. Bekerja untuk lembaga konservasi, pemerintah, atau universitas.|Observasi lapangan|Analisis data ekologi|Identifikasi spesies|Kuliah Biologi atau Ilmu Lingkungan S1 lalu lanjut S2",
      ""
    );
  }

  var prompt = [
    "Kamu adalah konselor karier yang menulis panduan profesi personal untuk siswa SMA.",
    "Nama siswa: " + String(inp.nama_siswa || "Siswa").trim(),
    "Top 3 kecerdasan: " + top1Name + " " + scores[top[0]]
      + ", " + top2Name + " " + scores[top[1]]
      + (top3Name ? ", " + top3Name + " " + scores[top[2]] : ""),
    "",
    "Tulis konten dalam format PERSIS berikut. Tidak ada teks di luar format ini.",
    "",
  ].concat(sections).concat([
    "ATURAN WAJIB:",
    "- Bahasa Indonesia.",
    "- DILARANG KERAS em-dash ( — ) dan double dash (--). Ganti dengan koma.",
    "- Tidak ada | di dalam teks konten (pipe hanya sebagai pemisah kolom).",
    "- Setiap profesi = satu baris, tepat 6 bagian dipisah pipe.",
    "- Tidak ada intro atau penutup.",
  ]).join("\n");

  var raw = callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseLaporanBagian4_(raw, top.length);
}

function parseLaporanBagian4_(raw, topCount) {
  function extractBlock_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z_0-9]{2,}:|$)", "i");
    var m  = raw.match(re);
    return m ? m[1].trim() : "";
  }

  var result = {};
  var count  = topCount || 3;
  for (var n = 1; n <= count; n++) {
    var block = extractBlock_("TOP_" + n + "_PROFESI_DETAIL");
    var lines = block.split("\n")
      .map(function(l) { return l.trim(); })
      .filter(function(l) {
        // baris valid: punya minimal 3 pipe (nama|desc|skill1|...)
        return l.split("|").length >= 4;
      });
    result["top_" + n + "_profesi_detail"] = lines.join("\n");
  }
  return result;
}


// ── Output_MI upsert ───────────────────────────────────────────────────────────

function normalizeKey_(h) {
  return String(h).toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

/**
 * Tambah header yang belum ada ke baris 1 sheet sebelum menulis data.
 * Pipeline tidak perlu manual setup kolom di sheet Output_MI.
 */
function ensureOutputHeaders_(sheet, newRow) {
  var rawHeaders  = getRawHeaders_(sheet);
  var normHeaders = rawHeaders.map(normalizeKey_);

  var missing = Object.keys(newRow).filter(function(key) {
    return normHeaders.indexOf(normalizeKey_(key)) === -1;
  });

  if (missing.length === 0) return;

  var startCol = rawHeaders.length + 1;
  missing.forEach(function(key, i) {
    sheet.getRange(1, startCol + i).setValue(key);
  });

  Logger.log("Header baru ditambah (" + missing.length + "): " + missing.join(", "));
}

function upsertOutputMI_(sheet, existingRows, newRow) {
  // Pastikan semua kolom dari newRow sudah ada di header sebelum menulis
  ensureOutputHeaders_(sheet, newRow);

  // Baca ulang header setelah kemungkinan ada penambahan
  var rawHeaders  = getRawHeaders_(sheet);
  var normHeaders = rawHeaders.map(normalizeKey_);
  var muridId     = String(newRow.murid_id).trim();

  var muridIdx  = normHeaders.indexOf("murid_id");
  var dataRange = sheet.getDataRange();
  var values    = dataRange.getValues();

  for (var r = 1; r < values.length; r++) {
    var cellVal = muridIdx < (values[r] || []).length ? String(values[r][muridIdx]).trim() : "";
    if (cellVal === muridId) {
      var updated = normHeaders.map(function(nk, i) {
        if (newRow[nk] !== undefined) return newRow[nk];
        return i < values[r].length ? values[r][i] : "";
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
  var lastCol  = sheet.getLastColumn();
  if (lastCol < 1) return [];
  var firstRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
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

/**
 * Batch generator: jalankan sampai max 30 murid per trigger (timeout-safe).
 * Panggil berkali-kali untuk batch berikutnya:
 *   debugBatch_(1, 30)   → murid baris 1-30
 *   debugBatch_(31, 60)  → murid baris 31-60
 *   debugBatch_(61, 90)  → dst
 */
function debugBatch_(startIdx, endIdx) {
  var props     = PropertiesService.getScriptProperties();
  var geminiKey = props.getProperty("GEMINI_API_KEY");
  var wbId      = props.getProperty("DATA_WORKBOOK_ID");
  var wb        = SpreadsheetApp.openById(wbId);
  var inputSh   = wb.getSheetByName("Input_MI");
  var outputSh  = wb.getSheetByName("Output_MI");
  var inputRows = Gate.sheetToObjects(inputSh);
  var outputRows = Gate.sheetToObjects(outputSh);

  var BATCH_SIZE = 30;
  var actualEnd = Math.min(endIdx, startIdx + BATCH_SIZE - 1);

  Logger.log("=== BATCH " + startIdx + " to " + actualEnd + " ===");
  Logger.log("Total murid di sheet: " + inputRows.length);

  var ok = 0, skip = 0, err = 0;
  for (var i = startIdx - 1; i < Math.min(actualEnd, inputRows.length); i++) {
    var inp = inputRows[i];
    if (!inp.murid_id) {
      Logger.log("Baris " + (i + 1) + " kosong, skip");
      skip++;
      continue;
    }

    var mid = inp.murid_id;
    Logger.log("\n[" + (i + 1) + "] Proses: " + mid);

    try {
      var result = buildOutputRow_(inp, geminiKey);
      Logger.log("✓ buildOutputRow_ sukses (" + Object.keys(result).length + " kolom)");
      Logger.log("  narasi_cover: " + (result.narasi_cover || "(kosong)").substring(0, 60) + "...");
      upsertOutputMI_(outputSh, outputRows, result);
      Logger.log("✓ Tulis Output_MI: " + mid);
      ok++;
    } catch (e) {
      Logger.log("✗ ERROR [" + mid + "]: " + e.message);
      err++;
    }

    if ((i - startIdx + 2) % 10 === 0) {
      Logger.log("Progress: " + (i - startIdx + 2) + " / " + (actualEnd - startIdx + 1));
    }
  }

  Logger.log("\n=== RINGKASAN BATCH ===");
  Logger.log("OK: " + ok + ", SKIP: " + skip + ", ERROR: " + err);
  Logger.log("Batch selesai. Kalau ada error, jalankan batch ini lagi.");
}

/**
 * Wrapper: jalankan batch pertama (murid 1-30). Tinggal klik di dropdown GAS.
 */
function debugSatuMurid() {
  debugBatch_(1, 30);
}

/**
 * Batch 2: murid 31-60. Klik di dropdown setelah batch 1 selesai.
 */
function debugBatch2_() {
  debugBatch_(31, 60);
}

/**
 * Batch 3: murid 61-90.
 */
function debugBatch3_() {
  debugBatch_(61, 90);
}

/**
 * Batch 4: murid 91-120. (adjust sesuai total murid)
 */
function debugBatch4_() {
  debugBatch_(91, 120);
}
