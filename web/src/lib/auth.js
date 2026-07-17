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

/** Baca daftar modul yang aktif (school_modules.aktif = true) untuk satu sekolah. */
async function fetchActiveModules(schoolId) {
  const { data } = await supabase
    .from("school_modules")
    .select("modul")
    .eq("school_id", schoolId)
    .eq("aktif", true);
  return (data || []).map((r) => r.modul);
}

/**
 * Login dengan username + kode khusus.
 * Email Supabase dibentuk: username@fammi.internal — kecuali username sudah berupa
 * alamat email asli (mengandung "@"), dipakai langsung (dipakai akun staf yang login
 * dengan email sekolah, lihat create-user Edge Function yang menerapkan aturan sama).
 * Kembalikan objek sesi atau lempar Error.
 */
export async function loginSupabase(username, kode) {
  const usernameTrim = username.trim();
  const email = usernameTrim.includes("@") ? usernameTrim : `${usernameTrim}@fammi.internal`;

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
  const modules = await fetchActiveModules(profile.school_id);

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

/**
 * Ambil ulang daftar modul aktif dari Supabase dan timpa session.modules kalau berubah.
 * session.modules cuma diisi sekali waktu login lalu disimpan di sessionStorage -- kalau
 * AdminFammi meng-ON/OFF-kan modul sekolah SETELAH user login, sesi yang sudah tersimpan di
 * browser tidak pernah tahu perubahan itu (bahkan refresh halaman biasa pun cuma baca ulang
 * sessionStorage, bukan Supabase). Dipanggil tiap App dimuat (lihat App.jsx) supaya modul yang
 * baru diaktifkan Admin langsung kelihatan tanpa harus logout-login manual.
 * Kembalikan session baru (objek baru kalau modul berubah, objek sama kalau tidak).
 */
export async function refreshSessionModules(session) {
  if (!session || !session.school_id) return session;
  try {
    const modules = await fetchActiveModules(session.school_id);
    const unchanged = modules.length === (session.modules || []).length
      && modules.every((m) => (session.modules || []).includes(m));
    if (unchanged) return session;
    const next = { ...session, modules };
    saveSession(next);
    return next;
  } catch {
    // Gagal refresh (mis. offline sebentar) -- pertahankan sesi lama, jangan sampai user
    // ke-logout paksa cuma karena satu request modul gagal.
    return session;
  }
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
