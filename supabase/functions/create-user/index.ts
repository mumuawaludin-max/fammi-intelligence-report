// Edge Function: create-user
//
// Dipanggil dari CMS Admin Fammi (dialog "Buat akun baru", satu per satu atau bulk CSV).
// Membuat akun Supabase Auth untuk ORANG LAIN butuh service_role — tidak bisa dan tidak
// boleh dilakukan dari browser dengan anon key (lihat CLAUDE.md: service_role tidak
// pernah di frontend).
//
// Login email: kalau `username` mengandung "@", dipakai langsung sebagai email Auth asli
// (dipakai untuk akun staf yang login pakai email sekolah sendiri, lihat lib/auth.js yang
// menerapkan aturan sama). Kalau tidak mengandung "@", tetap pola lama `username@fammi.internal`.
// auth.admin.createUser (Admin API) terbukti menerima domain @fammi.internal walau jalur
// publik (auth.signUp) sempat menolaknya di awal proyek.
//
// Password: kalau tidak dikirim di body, digenerate otomatis dari email — kata pertama
// bagian lokal email (huruf kecil saja, tanpa huruf besar biar minim salah ketik) + 3 digit
// acak. Contoh: "wiwifarida80@admin.sd.belajar.id" -> "wiwifarida482".
//
// Mode: body `{ nama, username, peran, school_id, cakupan, password? }` (satu akun), atau
// `{ users: [ {...sama seperti di atas}, ... ] }` (bulk, dipakai upload CSV guru/wali kelas),
// atau `{ reset_user_id, reset_username }` (reset satu akun), atau
// `{ reset_users: [ {user_id, username}, ... ] }` (reset banyak akun sekaligus, dipakai fitur
// "Reset & Export kode" di layar Pengguna — password lama TIDAK BISA diambil ulang, cuma bisa
// digenerate baru, makanya fiturnya "reset lalu export", bukan "export yang sudah ada").
//
// Deploy: supabase functions deploy create-user
// Secret: SUPABASE_SERVICE_ROLE_KEY sudah otomatis tersedia sebagai env bawaan Supabase Functions.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PERAN_VALID = ["AdminFammi", "Yayasan", "KepalaSekolah", "WakilKepalaSekolah", "WaliKelas", "OrangTua", "Siswa"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Tidak ada token." }, 401);

    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sesi tidak valid." }, 401);

    const { data: callerProfile, error: callerErr } = await callerClient
      .from("profiles")
      .select("peran")
      .eq("id", userData.user.id)
      .single();
    if (callerErr || callerProfile?.peran !== "AdminFammi") {
      return json({ error: "Cuma AdminFammi yang boleh membuat akun baru." }, 403);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const body = await req.json();

    if (body.reset_user_id) {
      const password = generatePassword(body.reset_username || "fammi");
      const { error: resetErr } = await admin.auth.admin.updateUserById(body.reset_user_id, { password });
      if (resetErr) return json({ error: `Gagal reset password: ${resetErr.message}` }, 500);
      return json({ ok: true, username: body.reset_username, password });
    }

    if (Array.isArray(body.reset_users)) {
      const results = [];
      for (const row of body.reset_users) {
        const password = generatePassword(row.username || "fammi");
        const { error: resetErr } = await admin.auth.admin.updateUserById(row.user_id, { password });
        results.push(resetErr
          ? { ok: false, username: row.username, error: resetErr.message }
          : { ok: true, username: row.username, password });
      }
      return json({ ok: true, results });
    }

    if (Array.isArray(body.users)) {
      const results = [];
      for (const row of body.users) {
        results.push(await createOne(admin, row));
      }
      return json({ ok: true, results });
    }

    const result = await createOne(admin, body);
    if (!result.ok) return json({ error: result.error }, 500);
    return json(result);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

async function createOne(admin, row) {
  const { nama, username, peran, school_id, cakupan, password: givenPassword } = row;
  if (!nama || !username || !peran) {
    return { ok: false, username, error: "Field wajib: nama, username, peran." };
  }
  if (!PERAN_VALID.includes(peran)) {
    return { ok: false, username, error: `peran harus salah satu dari: ${PERAN_VALID.join(", ")}` };
  }

  const usernameTrim = username.trim();
  const email = usernameTrim.includes("@") ? usernameTrim : `${usernameTrim}@fammi.internal`;
  const password = givenPassword || generatePassword(usernameTrim);

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr) {
    return { ok: false, username: usernameTrim, error: `Gagal buat auth user: ${createErr.message}` };
  }

  const { error: profileErr } = await admin.from("profiles").insert({
    id: created.user.id,
    username: usernameTrim,
    nama,
    peran,
    school_id: school_id || null,
    cakupan: Array.isArray(cakupan) && cakupan.length > 0 ? cakupan : null,
    murid_id: null,
  });
  if (profileErr) {
    // Rollback auth user supaya tidak ada akun tanpa profil.
    await admin.auth.admin.deleteUser(created.user.id);
    return { ok: false, username: usernameTrim, error: `Gagal buat profile: ${profileErr.message}` };
  }

  return { ok: true, nama, username: usernameTrim, password, user_id: created.user.id };
}

/** Kata pertama bagian lokal email, huruf kecil semua (tanpa huruf besar biar minim salah ketik) + 3 digit acak. */
function generatePassword(usernameOrEmail) {
  const local = usernameOrEmail.split("@")[0] || "fammi";
  const word = (local.replace(/[^a-zA-Z]/g, "") || "fammi").slice(0, 12).toLowerCase();
  const digits = String(Math.floor(100 + Math.random() * 900));
  return word + digits;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
