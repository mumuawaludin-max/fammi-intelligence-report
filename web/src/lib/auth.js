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
 * Peran Yayasan punya dua bentuk yang sama-sama sah, dan keduanya harus tetap jalan:
 *   a. Yayasan MULTI-SEKOLAH -- cakupan[0] berisi id yayasan (berprefiks "YAY-"), menaungi banyak
 *      baris schools. Contoh: Yayasan Pendidikan Telkom.
 *   b. Yayasan SATU SEKOLAH  -- cakupan kosong, cakupannya "seluruh sekolah" dalam satu school_id
 *      saja, praktis sama dengan Kepala Sekolah. Contoh: yayasantkfammi.
 *
 * Pembedanya cuma bentuk cakupan, bukan peran. Catatan: profiles.cakupan adalah kolom yang
 * di-overload -- untuk WaliKelas isinya daftar kelas_id, untuk Yayasan isinya id yayasan (lihat
 * migration 20260810130000). Prefiks "YAY-" yang membuat penafsiran itu aman ditebak di sini.
 */
function yayasanIdDariCakupan(peran, cakupan) {
  if (peran !== "Yayasan" || !Array.isArray(cakupan)) return null;
  const first = cakupan[0];
  return typeof first === "string" && first.startsWith("YAY-") ? first : null;
}

/** Baca profiles + school_modules aktif untuk satu user_id. Dipakai bareng oleh login dan
 * refreshSession supaya keduanya selalu membangun bentuk sesi yang sama persis. */
async function fetchProfileSession(userId) {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, nama, peran, school_id, cakupan, murid_id, sc_responden_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) throw new Error("Profil pengguna tidak ditemukan.");

  const yayasanId = yayasanIdDariCakupan(profile.peran, profile.cakupan);

  // Yayasan multi-sekolah: daftar sekolah naungan diresolusi SEKALI di sini, bukan diulang di tiap
  // modul. Sebelumnya cuma useKarakterYayasan() yang melakukannya sendiri; begitu modul kedua dan
  // ketiga butuh daftar yang sama (dashboard YPT: Rapor Karakter, Citra Sekolah, Survey Kepuasan,
  // Dokumentasi), menduplikasi query itu tiga kali lagi cuma menunggu jadi sumber bug.
  //
  // Entitlement ikut berubah bentuk: session.modules untuk Yayasan multi-sekolah adalah GABUNGAN
  // modul aktif seluruh sekolahnya, bukan modul satu sekolah jangkar. Tanpa ini, akun yayasan
  // yang school_id jangkarnya kebetulan cuma punya modul "karakter" tidak akan pernah melihat
  // modul yang aktif di sekolah lain naungannya.
  let schools = null;
  let modulesBySchool = null;
  let modules = [];

  if (yayasanId) {
    const { data: sekolahRows } = await supabase
      .from("schools")
      .select("id, nama, jenjang, kota")
      .eq("yayasan_id", yayasanId)
      .eq("aktif", true)
      .order("nama");

    schools = sekolahRows || [];
    const ids = schools.map((s) => s.id);

    if (ids.length > 0) {
      const { data: modulRows } = await supabase
        .from("school_modules")
        .select("school_id, modul")
        .in("school_id", ids)
        .eq("aktif", true);

      modulesBySchool = {};
      const union = new Set();
      (modulRows || []).forEach((r) => {
        (modulesBySchool[r.school_id] ||= []).push(r.modul);
        union.add(r.modul);
      });
      modules = Array.from(union);
    }
  } else {
    const { data: modulRows } = await supabase
      .from("school_modules")
      .select("modul")
      .eq("school_id", profile.school_id)
      .eq("aktif", true);

    modules = (modulRows || []).map((r) => r.modul);
  }

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
    // Tiga field di bawah HANYA terisi untuk Yayasan multi-sekolah; null untuk semua akun lain,
    // supaya kode yang mengeceknya bisa memakai `session.schools?` sebagai penanda bentuk sesi.
    yayasan_id: yayasanId,
    schools,
    modulesBySchool,
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
