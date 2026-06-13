/**
 * Read.js — pembacaan dan penyaringan data per modul.
 *
 * Dipanggil hanya oleh Gate.read setelah token dan cakupan divalidasi.
 * Tidak punya akses ke token, kredensial, atau session logic.
 *
 * Aturan keras:
 *   - Screening: kirim proxy_code, bukan nama_murid. Buang field nama_murid sebelum return.
 *   - Fakta_Kualitatif bertanda sensitif_flag=true hanya dikirim bila boleh_lihat_kualitatif=true.
 *   - Tindak_Lanjut: hanya baris status_persetujuan = "disetujui".
 *   - FIR tidak menghitung. Semua nilai dibaca apa adanya dari sheet.
 */

var Read = (function () {

  /**
   * Titik masuk dari Gate.read.
   *
   * dataWb  — workbook data sekolah (atau kontrol bila Yayasan)
   * ctrlWb  — workbook kontrol (untuk Modul_Config, Aspek_Config, Master)
   * params  — { modul, periode_id, cakupan, kapabilitas, peran, sekolah_id }
   */
  function fetch(dataWb, ctrlWb, params) {
    var modul = params.modul;

    if (modul === "tindak_lanjut") {
      return {
        tindak_lanjut: fetchTindakLanjut_(dataWb, params),
      };
    }

    if (params.peran === "Yayasan") {
      return {
        agregat: fetchAgregat_(dataWb, params),
        tindak_lanjut: [],
      };
    }

    // Output_MI: bila sheet ada, pakai format satu baris per siswa (lebih kaya narasi)
    if (modul === "mi" && dataWb.getSheetByName("Output_MI")) {
      return {
        output_mi: fetchOutputMI_(dataWb, params),
        tindak_lanjut: fetchTindakLanjut_(dataWb, params),
      };
    }

    var fakta = fetchFaktaAspek_(dataWb, params);
    var kualitatif = fetchKualitatif_(dataWb, params);
    var tindakLanjut = fetchTindakLanjut_(dataWb, params);
    var config = fetchModulConfig_(ctrlWb, modul);

    var result = {
      modul_config: config,
      fakta_aspek: fakta,
      tindak_lanjut: tindakLanjut,
    };

    if (kualitatif.length > 0) result.fakta_kualitatif = kualitatif;

    // MI individu: tambahkan rekomendasi dari master
    if (modul === "mi" && params.peran !== "Admin Fammi") {
      result.rekomendasi_mi = fetchRekomendasiMI_(ctrlWb, fakta);
    }

    return result;
  }

  /* ------------------------------------------------------------------ */
  /* Fakta_Aspek                                                          */
  /* ------------------------------------------------------------------ */

  function fetchFaktaAspek_(dataWb, params) {
    var sheet = dataWb.getSheetByName("Fakta_Aspek");
    if (!sheet) return [];

    var rows = Gate.sheetToObjects(sheet);
    var filtered = rows.filter(function (r) {
      return matchScope_(r, params.cakupan, params.peran)
        && matchPeriode_(r, params.periode_id)
        && r.modul === params.modul;
    });

    // Terapkan aturan sensitivitas per modul
    if (params.modul === "screening") {
      filtered = applyScreeningFilter_(filtered);
    }

    return filtered;
  }

  /* ------------------------------------------------------------------ */
  /* Output_MI (satu baris per siswa, format output pipeline)            */
  /* ------------------------------------------------------------------ */

  /**
   * Baca sheet Output_MI. Header kolom dinormalisasi otomatis:
   * "R INTER" → "r_inter", "NARASI HERO" → "narasi_hero", dst.
   * Kolom sekolah_id diinjeksi dari params bila tidak ada di sheet.
   */
  function fetchOutputMI_(dataWb, params) {
    var sheet = dataWb.getSheetByName("Output_MI");
    if (!sheet) return [];

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];

    // Normalisasi header: lowercase, spasi → underscore, buang karakter non-alfanumerik
    var headers = values[0].map(function (h) {
      return String(h).trim().toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
    });

    var hasSekolahId = headers.indexOf("sekolah_id") !== -1;
    var hasMuridId   = headers.indexOf("murid_id") !== -1;

    // Kumpulkan murid_id yang boleh diakses dari cakupan
    var allowedMuridIds = {};
    for (var ci = 0; ci < params.cakupan.length; ci++) {
      var c = params.cakupan[ci];
      if (c.tipe_cakupan === "murid" || c.tipe_cakupan === "murid_mi") {
        allowedMuridIds[String(c.unit_id).trim().toLowerCase()] = true;
      }
    }
    var hasMuridFilter = Object.keys(allowedMuridIds).length > 0;

    var rows = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row.every(function (c) { return c === "" || c === null; })) continue;
      var obj = {};
      headers.forEach(function (h, idx) { obj[h] = row[idx]; });
      if (!hasSekolahId && params.sekolah_id) obj.sekolah_id = params.sekolah_id;
      rows.push(obj);
    }

    // Injeksi nama sekolah dari sheet Sekolah di workbook yang sama
    var namaSekolah = "";
    var sekolahSh = dataWb.getSheetByName("Sekolah");
    if (sekolahSh) {
      var sekolahRows = Gate.sheetToObjects(sekolahSh);
      for (var si = 0; si < sekolahRows.length; si++) {
        var sr = sekolahRows[si];
        if (sr.sekolah_id === params.sekolah_id) {
          namaSekolah = String(sr.nama_sekolah || sr.sekolah_nama || "").trim();
          break;
        }
      }
    }
    if (namaSekolah) {
      rows.forEach(function (r) { r.sekolah_nama = namaSekolah; });
    }

    // Filter periode dulu
    var periodFiltered = rows.filter(function (r) {
      return matchPeriode_(r, params.periode_id);
    });

    // Peran dengan akses seluruh sekolah: kembalikan semua baris sekolah itu
    if (params.peran === "Admin Fammi" || params.peran === "Kepala Sekolah") {
      return periodFiltered;
    }

    // Strategi 0: link langsung dari kolom murid_id di Pengguna sheet (paling reliable)
    Logger.log("S0 check: user_murid_id=" + params.user_murid_id
      + " hasMuridId=" + hasMuridId
      + " periodFiltered=" + periodFiltered.length
      + " sample_murid_id=" + (periodFiltered[0] ? String(periodFiltered[0].murid_id || "") : "N/A"));

    if (params.user_murid_id && hasMuridId) {
      var normUserMuridId = params.user_murid_id.trim().toLowerCase();
      var byUserMuridId = periodFiltered.filter(function (r) {
        return String(r.murid_id || "").trim().toLowerCase() === normUserMuridId;
      });
      if (byUserMuridId.length > 0) {
        Logger.log("fetchOutputMI_ Strategi0 match: " + normUserMuridId);
        return byUserMuridId;
      }
      // Gagal — inject debug ke response
      if (periodFiltered.length > 0) {
        periodFiltered[0]._s0_debug = "user_murid_id=" + params.user_murid_id
          + " vs row_murid_id=" + String(periodFiltered[0].murid_id || "");
      }
    }

    // Strategi 1: cocokkan lewat kolom murid_id di Output_MI
    if (hasMuridId && hasMuridFilter) {
      var byMuridId = periodFiltered.filter(function (r) {
        return allowedMuridIds[String(r.murid_id || "").trim().toLowerCase()];
      });
      if (byMuridId.length > 0) {
        Logger.log("fetchOutputMI_ Strategi1 match: " + byMuridId.length + " baris");
        return byMuridId;
      }
    }

    // Strategi 2: lookup nama siswa dari sheet Murid menggunakan murid_id cakupan,
    // lalu cocokkan ke kolom nama di Output_MI.
    // Diperlukan karena nama di Pengguna (login) bisa berbeda dengan nama di Output_MI.
    if (hasMuridFilter) {
      var muridSheet = dataWb.getSheetByName("Murid");
      var muridNama = null;
      if (muridSheet) {
        var muridRows = Gate.sheetToObjects(muridSheet);
        for (var mi = 0; mi < muridRows.length; mi++) {
          var mRow = muridRows[mi];
          var mId = String(mRow.murid_id || "").trim().toLowerCase();
          if (allowedMuridIds[mId]) {
            muridNama = String(mRow.nama_murid || mRow.nama || "").trim().toLowerCase();
            break;
          }
        }
      }
      if (muridNama) {
        var byMuridNama = periodFiltered.filter(function (r) {
          return String(r.nama || "").trim().toLowerCase() === muridNama;
        });
        if (byMuridNama.length > 0) {
          Logger.log("fetchOutputMI_ Strategi2 (Murid sheet) match: " + muridNama);
          return byMuridNama;
        }
        Logger.log("fetchOutputMI_ Strategi2 gagal: muridNama=" + muridNama);
      }
    }

    // Strategi 3: cocokkan lewat nama akun login (Pengguna sheet)
    // Output_MI memakai kolom nama_siswa, bukan nama — cek keduanya
    if (params.user_nama) {
      var normNama = String(params.user_nama).trim().toLowerCase();
      var byNama = periodFiltered.filter(function (r) {
        var rNama = String(r.nama_siswa || r.nama || "").trim().toLowerCase();
        return rNama === normNama;
      });
      if (byNama.length > 0) {
        Logger.log("fetchOutputMI_ Strategi3 (user_nama) match: " + normNama);
        return byNama;
      }
    }

    // Fallback: tidak ada yang cocok — kembalikan baris pertama PLUS info debug
    // sehingga browser console bisa menampilkan apa yang sebenarnya ada di sheet.
    var debugInfo = {
      _debug_no_match: true,
      _debug_headers: headers,
      _debug_allowed_murid_ids: Object.keys(allowedMuridIds),
      _debug_user_nama: params.user_nama,
      _debug_row_count: periodFiltered.length,
      _debug_row0_keys: periodFiltered.length > 0 ? Object.keys(periodFiltered[0]) : [],
      _debug_row0_murid_id: periodFiltered.length > 0 ? String(periodFiltered[0].murid_id || "") : "",
      _debug_row0_nama: periodFiltered.length > 0 ? String(periodFiltered[0].nama || "") : "",
    };

    Logger.log("fetchOutputMI_ NO MATCH: " + JSON.stringify(debugInfo));

    if (periodFiltered.length > 0) {
      return [Object.assign({}, periodFiltered[0], debugInfo)];
    }
    return [debugInfo];
  }

  /* ------------------------------------------------------------------ */
  /* Fakta_Kualitatif                                                     */
  /* ------------------------------------------------------------------ */

  function fetchKualitatif_(dataWb, params) {
    var sheet = dataWb.getSheetByName("Fakta_Kualitatif");
    if (!sheet) return [];

    var rows = Gate.sheetToObjects(sheet);
    return rows.filter(function (r) {
      if (!matchScope_(r, params.cakupan, params.peran)) return false;
      if (!matchPeriode_(r, params.periode_id)) return false;
      if (r.modul !== params.modul) return false;

      // Field sensitif hanya untuk yang punya hak kualitatif
      if (r.sensitif_flag === true && !params.kapabilitas.boleh_lihat_kualitatif) {
        return false;
      }

      return true;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Tindak_Lanjut                                                        */
  /* ------------------------------------------------------------------ */

  function fetchTindakLanjut_(dataWb, params) {
    var sheet = dataWb.getSheetByName("Tindak_Lanjut");
    if (!sheet) return [];

    var rows = Gate.sheetToObjects(sheet);
    return rows.filter(function (r) {
      // Hanya yang sudah disetujui
      if (r.status_persetujuan !== "disetujui") return false;

      // Filter waktu
      if (!matchPeriode_(r, params.periode_id)) return false;

      // Filter peran sasaran
      if (r.peran_sasaran && r.peran_sasaran !== params.peran) {
        // Kepala Sekolah boleh lihat semua tindak lanjut sekolahnya
        if (params.peran !== "Kepala Sekolah") return false;
      }

      // Filter cakupan
      return matchScopeTL_(r, params.cakupan, params.peran, params.sekolah_id);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Agregat (untuk Yayasan)                                              */
  /* ------------------------------------------------------------------ */

  function fetchAgregat_(ctrlWb, params) {
    var sheet = ctrlWb.getSheetByName("Agregat");
    if (!sheet) return [];

    // Ambil yayasan_id dari cakupan
    var yayasanId = null;
    for (var i = 0; i < params.cakupan.length; i++) {
      if (params.cakupan[i].tipe_cakupan === "yayasan") {
        yayasanId = params.cakupan[i].unit_id;
        break;
      }
    }

    var rows = Gate.sheetToObjects(sheet);
    return rows.filter(function (r) {
      if (!matchPeriode_(r, params.periode_id)) return false;
      if (params.modul && r.modul !== params.modul) return false;

      // Yayasan hanya lihat agregat scope sekolah/yayasan, bukan individu
      if (r.scope_tipe === "murid") return false;

      // Bila scope_tipe sekolah, pastikan sekolah tersebut di bawah yayasan ini
      // Untuk V1: tampilkan semua agregat sekolah (lookup yayasan per sekolah bisa ditambah V2)
      return true;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Konfigurasi modul                                                    */
  /* ------------------------------------------------------------------ */

  function fetchModulConfig_(ctrlWb, modul) {
    var config = {};

    var modulSheet = ctrlWb.getSheetByName("Modul_Config");
    if (modulSheet) {
      var rows = Gate.sheetToObjects(modulSheet);
      for (var i = 0; i < rows.length; i++) {
        if (rows[i].modul === modul) { config.modul_config = rows[i]; break; }
      }
    }

    var aspekSheet = ctrlWb.getSheetByName("Aspek_Config");
    if (aspekSheet) {
      var aspekRows = Gate.sheetToObjects(aspekSheet);
      config.aspek_config = aspekRows.filter(function (r) { return r.modul === modul; });
    }

    var statusSheet = ctrlWb.getSheetByName("Status_Label");
    if (statusSheet) {
      var statusRows = Gate.sheetToObjects(statusSheet);
      config.status_label = statusRows.filter(function (r) { return r.modul === modul; });
    }

    return config;
  }

  /* ------------------------------------------------------------------ */
  /* Rekomendasi MI                                                       */
  /* ------------------------------------------------------------------ */

  /**
   * Cocokkan kecerdasan dominan dari fakta ke Master_RekomendasiMI.
   * FIR tidak menghitung dominan; dominan_flag sudah ada di fakta.
   */
  function fetchRekomendasiMI_(ctrlWb, fakta) {
    var masterSheet = ctrlWb.getSheetByName("Master_RekomendasiMI");
    if (!masterSheet) return [];

    // Kumpulkan kode kecerdasan dominan dari fakta
    var dominanKodes = {};
    fakta.forEach(function (r) {
      if (r.dominan_flag === true) dominanKodes[r.aspek_kode] = true;
    });

    if (Object.keys(dominanKodes).length === 0) return [];

    var master = Gate.sheetToObjects(masterSheet);
    return master.filter(function (r) {
      return dominanKodes[r.kecerdasan_kode] === true;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Filter sensitivitas Screening                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Screening: buang nama_murid dari setiap baris, sisakan proxy_code.
   * Field ini tidak pernah dikirim ke browser, bukan disembunyikan di klien.
   */
  function applyScreeningFilter_(rows) {
    return rows.map(function (r) {
      var clean = {};
      Object.keys(r).forEach(function (key) {
        if (key === "nama_murid") return; // buang
        clean[key] = r[key];
      });
      return clean;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Helper scope dan periode                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Periksa apakah baris fakta masuk dalam cakupan pengguna.
   *
   * Logika per peran:
   *   Kepala Sekolah: semua baris sekolahnya (sekolah_id match)
   *   Wali Kelas    : baris yang kelas_id ada di cakupannya
   *   Orang Tua     : baris yang murid_id ada di cakupannya
   *   Siswa         : baris yang murid_id ada di cakupannya
   *   Admin Fammi   : semua baris (tidak difilter)
   */
  function matchScope_(row, cakupan, peran) {
    if (peran === "Admin Fammi") return true;

    for (var i = 0; i < cakupan.length; i++) {
      var c = cakupan[i];
      // Sekolah-level match hanya untuk peran yang memang punya akses seluruh sekolah.
      // Siswa dan Orang Tua punya baris sekolah di cakupan hanya untuk resolveSekolahId_,
      // bukan untuk membuka data seluruh sekolah.
      if (c.tipe_cakupan === "sekolah" && row.sekolah_id === c.unit_id
          && (peran === "Kepala Sekolah" || peran === "Yayasan")) return true;
      if (c.tipe_cakupan === "kelas" && row.kelas_id === c.unit_id) return true;
      if ((c.tipe_cakupan === "murid" || c.tipe_cakupan === "murid_mi") && row.murid_id === c.unit_id) return true;
    }
    return false;
  }

  /**
   * matchScopeTL_ khusus Tindak_Lanjut karena kolom cakupannya berbeda:
   * cakupan_tipe dan cakupan_id bukan sekolah_id/kelas_id/murid_id.
   */
  function matchScopeTL_(row, cakupan, peran, sekolahId) {
    if (peran === "Admin Fammi") return true;

    if (row.cakupan_tipe === "sekolah") {
      return row.cakupan_id === sekolahId;
    }

    for (var i = 0; i < cakupan.length; i++) {
      var c = cakupan[i];
      if (row.cakupan_tipe === "kelas" && c.tipe_cakupan === "kelas" && row.cakupan_id === c.unit_id) return true;
      if (row.cakupan_tipe === "murid" && c.tipe_cakupan === "murid" && row.cakupan_id === c.unit_id) return true;
    }
    return false;
  }

  function matchPeriode_(row, periodeId) {
    if (!periodeId) return true; // tanpa filter periode, ambil semua
    return row.periode_id === periodeId;
  }

  /* ------------------------------------------------------------------ */
  /* Ekspor                                                               */
  /* ------------------------------------------------------------------ */

  return { fetch: fetch };

})();
