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

/** Baca profiles + school_modules aktif untuk satu user_id. Dipakai bareng oleh login dan
 * refreshSession supaya keduanya selalu membangun bentuk sesi yang sama persis. */
async function fetchProfileSession(userId) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, nama, peran, school_id, cakupan, murid_id, sc_responden_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) throw new Error("Profil pengguna tidak ditemukan.");

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
    sc_responden_id: profile.sc_responden_id,
    modules,
  };
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

  const profileSession = await fetchProfileSession(authData.user.id);
  return { ...profileSession, token: authData.session.access_token };
}

/**
 * Dipanggil saat App dimuat kalau ada sesi lokal tersimpan (sessionStorage). Sesi lokal bisa
 * sudah basi tanpa sepengetahuan browser -- token Supabase Auth-nya dicabut/kedaluwarsa di
 * server, atau admin sudah ubah peran/sekolah/cakupan user ini sejak login terakhir. Cek dulu
 * ke server (bukan cuma percaya isi sessionStorage), lalu tarik ulang profiles/school_modules
 * supaya perubahan itu langsung kepakai tanpa user harus logout manual.
 * Return null kalau sesi Supabase sudah mati (caller wajib hapus sesi lokal dan arahkan ke
 * login), atau objek sesi segar kalau masih hidup.
 */
export async function refreshSession() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return null;

  try {
    const profileSession = await fetchProfileSession(userData.user.id);
    const { data: sessionData } = await supabase.auth.getSession();
    return { ...profileSession, token: sessionData?.session?.access_token || null };
  } catch {
    return null;
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
