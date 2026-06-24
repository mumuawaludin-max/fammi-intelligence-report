/**
 * Code.js — titik masuk tunggal web app GAS.
 *
 * Semua permintaan dari React masuk ke doPost.
 * doGet hanya untuk health-check; tidak membuka data.
 *
 * Format permintaan:
 *   POST body JSON { action: "login"|"read", ...params }
 *
 * Format respons selalu:
 *   { ok: true, data: {...} }   — sukses
 *   { ok: false, error: "..." } — gagal
 */

// eslint-disable-next-line no-unused-vars
function doGet() {
  return respond(200, { status: "FIR gate online" });
}

// eslint-disable-next-line no-unused-vars
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return respond(400, { error: "Body kosong" });
    }

    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === "login")         return Gate.login(body);
    if (action === "logout")        return Gate.logout(body);
    if (action === "read")          return Gate.read(body);
    if (action === "provisionUser") return Gate.provisionUser(body);

    return respond(400, { error: "Action tidak dikenal: " + action });

  } catch (err) {
    Logger.log("doPost error: " + err.message);
    return respond(500, { error: "Terjadi kesalahan internal" });
  }
}

/**
 * Bungkus respons JSON dengan header CORS.
 * status: HTTP status code (200, 400, 401, 403, 500)
 * payload: object yang akan di-JSON-kan
 */
function respond(status, payload) {
  const output = ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);

  // GAS web app tidak mendukung custom HTTP status code secara native,
  // tapi payload selalu membawa field ok dan error agar klien bisa membedakan.
  return output;
}

/* ====================================================================== */
/*  Fungsi editor (dijalankan manual, BUKAN action web)                   */
/* ====================================================================== */

/**
 * Buat pepper acak kuat. Run fungsi ini, lalu salin nilai dari Logs ke
 * Script Property bernama LOGIN_PEPPER. Jalankan sekali saja.
 */
// eslint-disable-next-line no-unused-vars
function buatLoginPepper() {
  var s = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  Logger.log("LOGIN_PEPPER = " + s);
  return s;
}

/**
 * Migrasi kredensial ke format pepper. Jalankan SEKALI dari editor Apps Script
 * setelah LOGIN_PEPPER di-set. Tidak bisa dipicu dari browser.
 */
// eslint-disable-next-line no-unused-vars
function migrateKredensialKePepper() {
  return Gate.migrateCredentials();
}

/**
 * Provision satu user secara interaktif (dialog prompt).
 * Jalankan dari editor: pilih fungsi ini di dropdown lalu klik Run.
 */
// eslint-disable-next-line no-unused-vars
function provisionUserInteraktif() {
  return UserProvisioning.selectProvisionUser();
}

/**
 * Batch provision dari sheet. Ganti nama sheet sesuai kebutuhan.
 * Jalankan dari editor setelah sheet siap.
 */
// eslint-disable-next-line no-unused-vars
function provisionUserBatch() {
  var SHEET_NAME = "BulkProvisioning";
  var results = UserProvisioning.batchProvisionFromSheet(SHEET_NAME);
  Logger.log("Batch selesai: " + results.length + " baris diproses");
  return results;
}

/**
 * Generate PIN unik per user untuk semua baris di sheet Pengguna.
 * Kolom pin_awal diisi plaintext, kredensial_hash diperbarui.
 * Baris yang pin_awal-nya sudah ada dilewati (aman diulang).
 * Jalankan dari editor.
 */
// eslint-disable-next-line no-unused-vars
function generateSemuaPin() {
  var result = UserProvisioning.generatePinUntukSemuaUser(false);
  Logger.log("generateSemuaPin selesai — total=" + result.total + " diperbarui=" + result.updated + " dilewati=" + result.skipped);
  return result;
}

/**
 * Generate ulang PIN untuk SEMUA user, termasuk yang sudah punya pin_awal.
 * Pakai ini kalau ingin reset total semua kredensial.
 */
// eslint-disable-next-line no-unused-vars
function resetSemuaPin() {
  var result = UserProvisioning.generatePinUntukSemuaUser(true);
  Logger.log("resetSemuaPin selesai — total=" + result.total + " diperbarui=" + result.updated);
  return result;
}
