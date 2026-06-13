/**
 * Gate.js — validasi sesi, kapabilitas, dan cakupan.
 *
 * Dua fungsi utama yang dipanggil dari Code.js:
 *   Gate.login(body)  — validasi kredensial, terbitkan token
 *   Gate.read(body)   — validasi token, susun konteks pengguna, delegasi ke Read
 *
 * Tidak ada data fakta yang dibaca di sini.
 * Gate hanya memutuskan: siapa, boleh apa, ke data mana.
 */

var Gate = (function () {

  /* ------------------------------------------------------------------ */
  /* Konstanta                                                            */
  /* ------------------------------------------------------------------ */

  var TTL_HOURS = 8; // token kedaluwarsa setelah 8 jam

  /* ------------------------------------------------------------------ */
  /* Login                                                                */
  /* ------------------------------------------------------------------ */

  /**
   * Validasi username + kredensial_hash lalu terbitkan token sesi.
   *
   * body: { action, username, kredensial_hash }
   *
   * kredensial_hash dikirim client sebagai SHA-256 hex dari PIN/password asli.
   * GAS membandingkan dengan nilai di kolom kredensial_hash sheet Pengguna.
   * Password plaintext tidak pernah melewati jaringan maupun disimpan.
   */
  function login(body) {
    var username = body.username;
    var hashedCred = body.kredensial_hash;

    if (!username || !hashedCred) {
      return respond_(400, { error: "username dan kredensial_hash wajib diisi" });
    }

    var ctrlWb = openControlWorkbook_();
    var penggunaSheet = ctrlWb.getSheetByName("Pengguna");
    if (!penggunaSheet) {
      return respond_(500, { error: "Sheet Pengguna tidak ditemukan" });
    }

    var user = findUser_(penggunaSheet, username, hashedCred);
    if (!user) {
      return respond_(401, { error: "Username atau kredensial salah" });
    }

    var token = Utilities.getUuid();
    var now = new Date();
    var expires = new Date(now.getTime() + TTL_HOURS * 60 * 60 * 1000);

    var sesiSheet = ctrlWb.getSheetByName("Sesi");
    if (!sesiSheet) {
      return respond_(500, { error: "Sheet Sesi tidak ditemukan" });
    }

    // Format eksplisit GMT+7 Jakarta agar konsisten saat dibaca kembali
    var tz = "Asia/Jakarta";
    var dibuat = Utilities.formatDate(now, tz, "yyyy-MM-dd'T'HH:mm:ss");
    var kedaluwarsa = Utilities.formatDate(expires, tz, "yyyy-MM-dd'T'HH:mm:ss");
    sesiSheet.appendRow([token, user.user_id, dibuat, kedaluwarsa]);

    // Kembalikan token + info peran tanpa data sensitif
    return respond_(200, {
      ok: true,
      token: token,
      user_id: user.user_id,
      nama: user.nama,
      peran: user.peran,
    });
  }

  /* ------------------------------------------------------------------ */
  /* Read (gerbang utama)                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * Validasi token lalu kembalikan data yang diizinkan untuk pengguna ini.
   *
   * body: {
   *   action,
   *   token,
   *   modul,       // "karakter" | "screening" | "mi" | "tindak_lanjut"
   *   periode_id,  // filter waktu
   * }
   */
  function read(body) {
    var token = body.token;
    if (!token) {
      return respond_(401, { error: "Token tidak disertakan" });
    }

    var ctrlWb = openControlWorkbook_();

    // 1. Validasi token
    var userId = validateToken_(ctrlWb, token);
    if (!userId) {
      return respond_(401, { error: "Token tidak valid atau sudah kedaluwarsa" });
    }

    // 2. Baca pengguna
    var user = getUserById_(ctrlWb, userId);
    if (!user || !user.aktif) {
      return respond_(403, { error: "Akun tidak aktif" });
    }

    // 3. Baca kapabilitas per modul
    var modul = body.modul;
    if (!modul) {
      return respond_(400, { error: "Param modul wajib diisi" });
    }
    var kapabilitas = getKapabilitas_(ctrlWb, user.peran, modul);
    if (!kapabilitas || !kapabilitas.boleh_lihat) {
      return respond_(403, { error: "Peran ini tidak punya akses ke modul " + modul });
    }

    // 4. Baca cakupan pengguna
    var cakupan = getCakupan_(ctrlWb, userId);
    Logger.log("DEBUG cakupan userId=" + userId + " hasil=" + JSON.stringify(cakupan));
    if (!cakupan || cakupan.length === 0) {
      return respond_(403, { error: "Cakupan data belum dikonfigurasi untuk akun ini" });
    }

    // 5. Tentukan sekolah_id dari cakupan
    var sekolahId = resolveSekolahId_(cakupan, user.peran);
    Logger.log("DEBUG sekolahId=" + sekolahId + " peran=" + user.peran);
    if (!sekolahId && user.peran !== "Admin Fammi") {
      return respond_(403, { error: "sekolah_id tidak dapat ditentukan dari cakupan pengguna. DEBUG: cakupan=" + JSON.stringify(cakupan) });
    }

    // 6. Cek langganan sekolah untuk modul yang diminta (kecuali Admin)
    if (user.peran !== "Admin Fammi" && modul !== "tindak_lanjut") {
      var aktifLangganan = cekLangganan_(ctrlWb, sekolahId, modul);
      if (!aktifLangganan) {
        return respond_(403, { error: "Sekolah belum berlangganan modul " + modul });
      }
    }

    // 7. Buka workbook data sekolah (yayasan baca Agregat dari kontrol)
    var dataWb;
    if (user.peran === "Yayasan") {
      dataWb = ctrlWb; // Agregat ada di workbook kontrol
    } else {
      dataWb = openSchoolWorkbook_(ctrlWb, sekolahId);
      if (!dataWb) {
        return respond_(500, { error: "Workbook data sekolah tidak ditemukan" });
      }
    }

    // 8. Delegasi pembacaan dan penyaringan ke Read
    var params = {
      modul: modul,
      periode_id: body.periode_id || null,
      cakupan: cakupan,
      kapabilitas: kapabilitas,
      peran: user.peran,
      sekolah_id: sekolahId,
      user_nama: user.nama,
      user_murid_id: String(user.murid_id || "").trim(),
    };

    var data = Read.fetch(dataWb, ctrlWb, params);

    return respond_(200, { ok: true, data: data });
  }

  /* ------------------------------------------------------------------ */
  /* Helper privat                                                        */
  /* ------------------------------------------------------------------ */

  function openControlWorkbook_() {
    var id = PropertiesService.getScriptProperties()
      .getProperty("CONTROL_WORKBOOK_ID");
    if (!id) throw new Error("CONTROL_WORKBOOK_ID belum dikonfigurasi di Script Properties");
    return SpreadsheetApp.openById(id);
  }

  function openSchoolWorkbook_(ctrlWb, sekolahId) {
    var registrySheet = ctrlWb.getSheetByName("Registry");
    if (!registrySheet) return null;

    var rows = sheetToObjects_(registrySheet);
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row.sekolah_id === sekolahId && row.aktif === true) {
        return SpreadsheetApp.openById(row.data_workbook_id);
      }
    }
    return null;
  }

  /**
   * Cari pengguna berdasarkan username + kredensial_hash.
   * Return object user atau null bila tidak cocok.
   */
  function findUser_(sheet, username, hashedCred) {
    var rows = sheetToObjects_(sheet);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (
        String(r.username).trim() === String(username).trim() &&
        String(r.kredensial_hash).trim() === String(hashedCred).trim() &&
        isAktif_(r.aktif)
      ) {
        return r;
      }
    }
    return null;
  }

  function isAktif_(val) {
    if (val === true) return true;
    if (typeof val === "string") return val.toUpperCase() === "TRUE";
    return false;
  }

  /**
   * Validasi token: cari di Sesi, periksa kedaluwarsa_pada.
   * Return user_id bila valid, null bila tidak.
   */
  function validateToken_(ctrlWb, token) {
    var sesiSheet = ctrlWb.getSheetByName("Sesi");
    if (!sesiSheet) return null;

    var rows = sheetToObjects_(sesiSheet);
    var now = new Date();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      // String cast agar aman bila sel di Sheets ter-format sebagai tipe lain
      if (String(r.token).trim() === String(token).trim()) {
        var expRaw = r.kedaluwarsa_pada;
        // Tangani Date object (baris lama) maupun string (baris baru format Jakarta)
        var exp = (expRaw instanceof Date) ? expRaw : new Date(expRaw);
        if (!isNaN(exp.getTime()) && exp > now) return r.user_id;
        return null; // kedaluwarsa
      }
    }
    return null; // tidak ditemukan
  }

  function getUserById_(ctrlWb, userId) {
    var sheet = ctrlWb.getSheetByName("Pengguna");
    if (!sheet) return null;
    var rows = sheetToObjects_(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].user_id === userId) return rows[i];
    }
    return null;
  }

  function getKapabilitas_(ctrlWb, peran, modul) {
    var sheet = ctrlWb.getSheetByName("Akses_Kapabilitas");
    if (!sheet) return null;
    var rows = sheetToObjects_(sheet);
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.peran === peran && r.modul === modul) return r;
    }
    return null;
  }

  function getCakupan_(ctrlWb, userId) {
    var sheet = ctrlWb.getSheetByName("Akses_Cakupan");
    if (!sheet) return [];
    var rows = sheetToObjects_(sheet);
    return rows.filter(function (r) { return r.user_id === userId; });
  }

  /**
   * Ambil sekolah_id dari cakupan pengguna.
   *
   * Prioritas:
   *   1. Baris bertipe "sekolah" → unit_id adalah sekolah_id (Kepala Sekolah).
   *   2. Kolom sekolah_id eksplisit di baris cakupan → untuk Siswa / Orang Tua /
   *      Wali Kelas yang unit_id-nya adalah murid_id atau kelas_id.
   *      Tambahkan kolom "sekolah_id" di sheet Akses_Cakupan untuk baris-baris ini.
   */
  function resolveSekolahId_(cakupan, peran) {
    if (peran === "Yayasan") return null;

    for (var i = 0; i < cakupan.length; i++) {
      if (cakupan[i].tipe_cakupan === "sekolah") return cakupan[i].unit_id;
    }

    // Fallback: kolom sekolah_id langsung di baris cakupan
    for (var i = 0; i < cakupan.length; i++) {
      var sid = String(cakupan[i].sekolah_id || "").trim();
      if (sid) return sid;
    }

    return null;
  }

  function cekLangganan_(ctrlWb, sekolahId, modul) {
    var sheet = ctrlWb.getSheetByName("Langganan");
    if (!sheet) return false;
    var rows = sheetToObjects_(sheet);
    var today = new Date();
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (r.sekolah_id !== sekolahId || r.modul !== modul || !r.aktif) continue;
      var akhir = r.akhir ? new Date(r.akhir) : null;
      if (!akhir || akhir >= today) return true;
    }
    return false;
  }

  /* ------------------------------------------------------------------ */
  /* Utility bersama                                                      */
  /* ------------------------------------------------------------------ */

  /**
   * Ubah sheet menjadi array of objects.
   * Baris pertama dianggap header (nama kolom).
   * Header dinormalisasi ke lowercase agar tidak sensitif huruf besar-kecil
   * ("Token", "token", "TOKEN" semua dibaca sebagai "token").
   */
  function sheetToObjects_(sheet) {
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];

    var headers = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var result = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // Lewati baris kosong
      if (row.every(function (c) { return c === "" || c === null; })) continue;
      var obj = {};
      headers.forEach(function (h, idx) { obj[h] = row[idx]; });
      result.push(obj);
    }
    return result;
  }

  function respond_(status, payload) {
    // GAS tidak mendukung custom HTTP status via ContentService,
    // tapi field ok dan error cukup untuk klien membedakan hasil.
    void status;
    return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }

  /* ------------------------------------------------------------------ */
  /* Ekspor                                                               */
  /* ------------------------------------------------------------------ */

  return {
    login: login,
    read: read,
    sheetToObjects: sheetToObjects_,
  };

})();
