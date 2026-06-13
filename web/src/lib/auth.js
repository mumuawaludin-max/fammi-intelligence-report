/**
 * auth.js — manajemen sesi dan hashing PIN.
 *
 * Token disimpan di sessionStorage, bukan localStorage,
 * supaya otomatis hapus saat tab atau browser ditutup.
 * Kredensial plaintext tidak pernah dikirim ke mana pun.
 */

const SESSION_KEY = "fir_session";

/**
 * Hash PIN/password dengan SHA-256 via Web Crypto API.
 * Hasilnya adalah hex string 64 karakter, cocok dengan
 * nilai kredensial_hash di sheet Pengguna.
 */
export async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(pin));
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Simpan respons login ke sessionStorage. */
export function saveSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/** Baca sesi aktif. Kembalikan null bila tidak ada. */
export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Hapus sesi (logout). */
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
