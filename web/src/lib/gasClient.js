/**
 * gasClient.js — satu-satunya titik di React yang memanggil GAS.
 *
 * Content-Type: "text/plain" disengaja. GAS memperlakukan request
 * dengan Content-Type non-standard sebagai "simple request" CORS
 * sehingga tidak memicu preflight OPTIONS yang akan ditolak GAS.
 * Body tetap JSON, GAS mem-parse-nya lewat e.postData.contents.
 */

const GAS_URL = import.meta.env.VITE_GAS_WEB_APP_URL || import.meta.env.VITE_GAS_URL;

if (!GAS_URL) {
  console.error("VITE_GAS_WEB_APP_URL belum diisi di .env.local");
}

async function post(action, params = {}) {
  const body = JSON.stringify({ action, ...params });

  const res = await fetch(GAS_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error("HTTP " + res.status);
  }

  const json = await res.json();

  if (json.error) {
    throw new GasError(json.error);
  }

  return json;
}

export class GasError extends Error {
  constructor(message) {
    super(message);
    this.name = "GasError";
  }
}

export const gasClient = { post };
