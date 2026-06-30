/**
 * auth.js — login via Supabase Auth + baca profil dari tabel profiles.
 *
 * Alur:
 * 1. signInWithPassword ke Supabase Auth (email = username@fammi.internal)
 * 2. Ambil baris profiles berdasarkan user.id
 * 3. Simpan sesi gabungan ke sessionStorage
 */

import { supabase } from "./supabase";

const SESSION_KEY = "fir_session";

/**
 * Login dengan username + kode khusus.
 * Email Supabase dibentuk: username@fammi.internal
 * Kembalikan objek sesi atau lempar Error.
 */
export async function loginSupabase(username, kode) {
  const email = `${username.trim()}@fammi.internal`;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: kode,
  });

  if (authError) throw new Error("Username atau kode salah.");

  const userId = authData.user.id;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, nama, peran, school_id, cakupan, murid_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) throw new Error("Profil pengguna tidak ditemukan.");

  // Baca modul yang aktif untuk sekolah ini
  const { data: modulRows } = await supabase
    .from("school_modules")
    .select("modul")
    .eq("school_id", profile.school_id)
    .eq("aktif", true);

  const modules = (modulRows || []).map((r) => r.modul);

  return {
    user_id: userId,
    username: profile.username,
    nama: profile.nama || profile.username,
    peran: profile.peran,
    school_id: profile.school_id,
    cakupan: profile.cakupan,
    murid_id: profile.murid_id,
    modules,
    token: authData.session.access_token,
  };
}

/** Logout dari Supabase dan hapus sesi lokal. */
export async function logoutSupabase() {
  await supabase.auth.signOut();
  sessionStorage.removeItem(SESSION_KEY);
}

/** Simpan sesi ke sessionStorage. */
export function saveSession(data) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

/** Baca sesi aktif. */
export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Hapus sesi lokal saja (tanpa Supabase signOut). */
export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

/** Tetap ada untuk kompatibilitas komponen lama. */
export async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(String(pin));
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
