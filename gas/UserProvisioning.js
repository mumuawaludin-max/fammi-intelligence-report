/**
 * UserProvisioning.js — provisioning user baru dengan PIN otomatis.
 *
 * Workflow:
 *   1. Generate PIN acak 12 karakter (A-Z, a-z, 0-9)
 *   2. Hash PIN dengan pepper (format v2:HMAC-SHA256)
 *   3. Insert ke sheet Pengguna + log ke sheet Sesi
 *   4. Return PIN plaintext untuk dikirim ke user
 *
 * Jalankan dari editor: selectProvisionUser() atau batch via Google Form trigger.
 */

var UserProvisioning = (function () {

  const PEPPER_KEY = "LOGIN_PEPPER";
  const PIN_LENGTH = 12;
  const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  // Karakter suffix: huruf kapital + angka, tanpa 0/O dan 1/I yang mudah tertukar
  var SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  /**
   * Generate PIN dari nama: namaDepan (maks 8 huruf kecil) + 4 karakter acak.
   * Contoh: "Budi Santoso" → "budiK7XP", "M. Alief Algafaru" → "aliefQ3NW"
   *
   * Kata inisial (≤2 huruf atau berakhiran titik) dilewati untuk cari nama asli.
   */
  function generatePinDariNama(nama) {
    var kata = String(nama || "").trim().split(/\s+/);
    var prefix = "";
    for (var i = 0; i < kata.length; i++) {
      var bersih = kata[i].replace(/[^a-zA-Z]/g, "");
      if (bersih.length >= 3) {
        prefix = bersih.substring(0, 8).toLowerCase();
        break;
      }
    }
    if (!prefix) prefix = "user";

    var suffix = "";
    for (var j = 0; j < 4; j++) {
      suffix += SUFFIX_CHARS[Math.floor(Math.random() * SUFFIX_CHARS.length)];
    }
    return prefix + suffix;
  }

  /**
   * Generate PIN acak murni (fallback bila nama tidak tersedia).
   */
  function generateRandomPin() {
    var pin = "";
    for (var i = 0; i < PIN_LENGTH; i++) {
      var idx = Math.floor(Math.random() * CHARSET.length);
      pin += CHARSET[idx];
    }
    return pin;
  }

  /** SHA-256 hex dari string, sama persis dengan hashPin() di sisi klien React. */
  function sha256Hex_(str) {
    var bytes = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, String(str), Utilities.Charset.UTF_8);
    var hex = "";
    for (var i = 0; i < bytes.length; i++) {
      var b = (bytes[i] + 256) % 256;
      hex += (b < 16 ? "0" : "") + b.toString(16);
    }
    return hex;
  }

  /**
   * HMAC-SHA256 hex dari message memakai key.
   */
  function hmacSha256Hex_(key, message) {
    var raw = Utilities.computeHmacSha256Signature(String(message), String(key));
    var hex = "";
    for (var i = 0; i < raw.length; i++) {
      var b = (raw[i] + 256) % 256;
      hex += (b < 16 ? "0" : "") + b.toString(16);
    }
    return hex;
  }

  /**
   * Baca pepper dari Script Properties.
   */
  function getPepper_() {
    return PropertiesService.getScriptProperties().getProperty(PEPPER_KEY) || "";
  }

  /**
   * Buka workbook kontrol.
   */
  function openControlWorkbook_() {
    var id = PropertiesService.getScriptProperties()
      .getProperty("CONTROL_WORKBOOK_ID");
    if (!id) throw new Error("CONTROL_WORKBOOK_ID belum dikonfigurasi di Script Properties");
    return SpreadsheetApp.openById(id);
  }

  /**
   * Ubah sheet menjadi array of objects.
   */
  function sheetToObjects_(sheet) {
    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return [];
    var headers = values[0].map(function (h) { return String(h).trim().toLowerCase(); });
    var result = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row.every(function (c) { return c === "" || c === null; })) continue;
      var obj = {};
      headers.forEach(function (h, idx) { obj[h] = row[idx]; });
      result.push(obj);
    }
    return result;
  }

  /**
   * Provisioning user baru dengan PIN otomatis.
   *
   * @param {string} username - username baru
   * @param {string} peran - peran pengguna (Siswa, OrangTua, WaliKelas, KepalaSekolah, Yayasan, AdminFammi)
   * @param {string} nama - nama lengkap pengguna
   * @param {string} email - email untuk kirim PIN (opsional)
   * @returns {object} { username, plainPin, hashedPin, success, message, emailSent }
   */
  function provisionUser(username, peran, nama, email) {
    try {
      var pepper = getPepper_();
      if (!pepper) throw new Error("LOGIN_PEPPER belum di-set. Set dulu di Script Properties.");

      var ctrlWb = openControlWorkbook_();
      var penggunaSheet = ctrlWb.getSheetByName("Pengguna");
      if (!penggunaSheet) throw new Error("Sheet Pengguna tidak ditemukan");

      // Cek username sudah ada
      var existing = sheetToObjects_(penggunaSheet);
      if (existing.some(function (r) { return String(r.username || "").trim() === String(username).trim(); })) {
        return { success: false, message: "Username sudah terdaftar", username: username };
      }

      // Generate PIN dari nama supaya mudah dibaca
      var plainPin = nama ? generatePinDariNama(nama) : generateRandomPin();
      var hashedPin = "v2:" + hmacSha256Hex_(pepper, sha256Hex_(plainPin));

      // Insert ke Pengguna
      var now = new Date();
      var tz = "Asia/Jakarta";
      var dibuat = Utilities.formatDate(now, tz, "yyyy-MM-dd'T'HH:mm:ss");
      penggunaSheet.appendRow([
        username,
        hashedPin,
        peran,
        nama,
        "true", // aktif
        email || "",
        dibuat,
      ]);

      // Log ke Sesi untuk audit
      var sesiSheet = ctrlWb.getSheetByName("Sesi");
      if (sesiSheet) {
        sesiSheet.appendRow([
          "", // token (kosong, ini provision bukan login)
          "", // user_id (akan diisi saat login pertama)
          dibuat,
          "", // kedaluwarsa_pada (tidak berlaku)
          "_provision", // catatan internal: ini provision record
        ]);
      }

      Logger.log("Provision berhasil: username=" + username + " peran=" + peran);

      var result = {
        success: true,
        username: username,
        peran: peran,
        nama: nama,
        plainPin: plainPin,
        hashedPin: hashedPin,
        message: "User berhasil diprovision. PIN: " + plainPin,
        emailSent: false,
      };

      // Coba kirim email (opsional)
      if (email) {
        try {
          sendProvisioningEmail(email, username, peran, nama, plainPin);
          result.emailSent = true;
        } catch (e) {
          Logger.log("Email gagal dikirim: " + e.message);
        }
      }

      return result;
    } catch (err) {
      Logger.log("Provision error: " + err.message);
      return { success: false, message: "Error: " + err.message };
    }
  }

  /**
   * Kirim email notifikasi PIN ke pengguna.
   */
  function sendProvisioningEmail(email, username, peran, nama, plainPin) {
    var subject = "Selamat datang di Fammi Intelligence Report";
    var body = "Halo " + nama + ",\n\n" +
      "Akun Anda sudah siap di Fammi Intelligence Report.\n\n" +
      "Username: " + username + "\n" +
      "Kode Khusus: " + plainPin + "\n" +
      "Peran: " + peran + "\n\n" +
      "Akses laporan Anda di: https://fammi-intelligence-report.vercel.app\n\n" +
      "Jaga kode ini tetap rahasia. Jangan bagikan ke orang lain.\n\n" +
      "Salam,\nTim Fammi";

    GmailApp.sendEmail(email, subject, body);
  }

  /**
   * Fungsi editor untuk provision satu user interaktif.
   * (Jalankan dari Apps Script editor: selectProvisionUser())
   */
  // eslint-disable-next-line no-unused-vars
  function selectProvisionUser() {
    var username = Browser.inputBox("Provision User Baru", "Username (cth: budi.santoso):", Browser.Buttons.OK_CANCEL);
    if (!username || username === "cancel") return;
    username = username.trim();

    var nama = Browser.inputBox("Nama lengkap:", Browser.Buttons.OK_CANCEL);
    if (!nama || nama === "cancel") return;
    nama = nama.trim();

    var email = Browser.inputBox("Email (opsional, Enter untuk kosongkan):", Browser.Buttons.OK_CANCEL);
    email = (email === "cancel") ? "" : email.trim();

    var peranInput = Browser.inputBox(
      "Peran: Siswa / OrangTua / WaliKelas / KepalaSekolah / Yayasan / AdminFammi",
      Browser.Buttons.OK_CANCEL
    );
    if (!peranInput || peranInput === "cancel") return;
    var peran = peranInput.trim();

    var provision = provisionUser(username, peran, nama, email || null);
    if (provision.success) {
      Browser.msgBox(
        "Provision Berhasil!\n\n" +
        "Username: " + provision.username + "\n" +
        "Kode: " + provision.plainPin + "\n" +
        "Email terkirim: " + (provision.emailSent ? "Ya" : "Tidak")
      );
    } else {
      Browser.msgBox("Gagal: " + provision.message);
    }
  }

  /**
   * Batch provision dari sheet data (future: integrasikan dengan Google Form).
   * Format sheet: [username, peran, nama, email]
   */
  function batchProvisionFromSheet(sheetName) {
    var wb = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = wb.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet " + sheetName + " tidak ditemukan");

    var values = sheet.getDataRange().getValues();
    var results = [];
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (!row[0]) break; // stop di baris kosong
      var prov = provisionUser(String(row[0]), String(row[1]), String(row[2]), String(row[3] || ""));
      results.push(prov);
      Logger.log((i) + ": " + JSON.stringify(prov));
    }
    return results;
  }

  // Ekspor
  return {
    generateRandomPin: generateRandomPin,
    provisionUser: provisionUser,
    sendProvisioningEmail: sendProvisioningEmail,
    selectProvisionUser: selectProvisionUser,
    batchProvisionFromSheet: batchProvisionFromSheet,
    generatePinUntukSemuaUser: generatePinUntukSemuaUser,
  };

  /**
   * Generate PIN unik per user untuk semua baris di sheet Pengguna.
   * Kolom pin_awal diisi plaintext, kredensial_hash diisi hash baru.
   * Aman diulang: baris yang pin_awal-nya sudah terisi dilewati.
   *
   * @param {boolean} forceAll - true = generate ulang SEMUA baris meski pin_awal sudah ada
   */
  function generatePinUntukSemuaUser(forceAll) {
    var pepper = getPepper_();
    if (!pepper) throw new Error("LOGIN_PEPPER belum di-set di Script Properties.");

    var ctrlWb = openControlWorkbook_();
    var sheet = ctrlWb.getSheetByName("Pengguna");
    if (!sheet) throw new Error("Sheet Pengguna tidak ditemukan.");

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) return { total: 0, updated: 0, skipped: 0 };

    var headers = values[0].map(function (h) { return String(h).trim().toLowerCase(); });

    // Pastikan kolom pin_awal ada; kalau belum, tambahkan ke header baris pertama
    var pinCol = headers.indexOf("pin_awal");
    if (pinCol === -1) {
      pinCol = headers.length;
      headers.push("pin_awal");
      sheet.getRange(1, pinCol + 1).setValue("pin_awal");
    }

    var hashCol = headers.indexOf("kredensial_hash");
    if (hashCol === -1) throw new Error("Kolom kredensial_hash tidak ditemukan.");

    var namaCol = headers.indexOf("nama");

    var updated = 0, skipped = 0;
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      // Lewati baris kosong
      if (row.every(function (c) { return c === "" || c === null; })) continue;

      var pinAwalSudahAda = (pinCol < row.length) && String(row[pinCol]).trim() !== "";
      if (pinAwalSudahAda && !forceAll) {
        skipped++;
        continue;
      }

      var nama = (namaCol !== -1) ? String(row[namaCol] || "").trim() : "";
      var pin = nama ? generatePinDariNama(nama) : generateRandomPin();
      var hash = "v2:" + hmacSha256Hex_(pepper, sha256Hex_(pin));

      sheet.getRange(i + 1, pinCol + 1).setValue(pin);
      sheet.getRange(i + 1, hashCol + 1).setValue(hash);
      updated++;
    }

    Logger.log("generatePinUntukSemuaUser: updated=" + updated + " skipped=" + skipped);
    return { total: values.length - 1, updated: updated, skipped: skipped };
  }

})();
