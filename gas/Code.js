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

    if (action === "login") return Gate.login(body);
    if (action === "read")  return Gate.read(body);

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
