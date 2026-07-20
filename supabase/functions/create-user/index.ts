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
// bagian lokal email (huruf kecil saja, tanpa huruf besar biar minim salah ketik) + 6 digit
// acak kriptografis. Contoh: "wiwifarida80@admin.sd.belajar.id" -> "wiwifarida482917".
//
// Mode: body `{ nama, username, peran, school_id, cakupan, password? }` (satu akun), atau
// `{ users: [ {...sama seperti di atas}, ... ] }` (bulk, dipakai upload CSV guru/wali kelas),
// atau `{ reset_user_id, reset_username }` (reset satu akun), atau
// `{ reset_users: [ {user_id, username}, ... ] }` (reset banyak akun sekaligus, dipakai fitur
// "Reset & Export kode" di layar Pengguna — password lama TIDAK BISA diambil ulang, cuma bisa
// digenerate baru, makanya fiturnya "reset lalu export", bukan "export yang sudah ada"), atau
// `{ delete_user_id }` / `{ delete_user_ids: [...] }` (hapus akun: baris profiles dihapus dulu,
// baru akun Supabase Auth-nya, supaya tidak ada auth user yatim tanpa profile).
//
// Deploy: supabase functions deploy create-user
// Secret: SUPABASE_SERVICE_ROLE_KEY sudah otomatis tersedia sebagai env bawaan Supabase Functions.
//
// corsHeaders ditulis LANGSUNG di sini (bukan impor dari ../_shared/cors.ts) supaya berkas ini
// bisa dideploy sebagai satu file lewat Supabase Dashboard "Via Editor", yang tidak membundel
// folder _shared/. Lihat komentar yang sama di admin-actions/index.ts.

import { createClient } from "jsr:@supabase/supabase-js@2";

// localhost diizinkan di port berapa pun (Vite autoPort bisa geser dari 5173) -- lihat
// komentar lengkap di _shared/cors.ts, salinan inline supaya berkas ini tetap satu file.
const PROD_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://fammi-intelligence-report.vercel.app";

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || req.headers.get("Origin");
  const allowed = origin && (origin === PROD_ORIGIN || /^http:\/\/localhost:\d+$/.test(origin));
  const allowOrigin = allowed ? origin : PROD_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PERAN_VALID = ["AdminFammi", "Yayasan", "KepalaSekolah", "WakilKepalaSekolah", "Manajemen", "WaliKelas", "OrangTua", "Siswa"];

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  function json(body, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
      const password = generatePassword();
      const { error: resetErr } = await admin.auth.admin.updateUserById(body.reset_user_id, { password });
      if (resetErr) return json({ error: `Gagal reset password: ${resetErr.message}` }, 500);
      return json({ ok: true, username: body.reset_username, password });
    }

    if (Array.isArray(body.reset_users)) {
      const results = [];
      for (const row of body.reset_users) {
        const password = generatePassword();
        const { error: resetErr } = await admin.auth.admin.updateUserById(row.user_id, { password });
        results.push(resetErr
          ? { ok: false, username: row.username, error: resetErr.message }
          : { ok: true, username: row.username, password });
      }
      return json({ ok: true, results });
    }

    if (body.delete_user_id) {
      if (body.delete_user_id === userData.user.id) {
        return json({ error: "Tidak bisa menghapus akun sendiri yang sedang login." }, 400);
      }
      const result = await deleteOne(admin, body.delete_user_id);
      if (!result.ok) return json({ error: result.error }, 500);
      return json(result);
    }

    if (Array.isArray(body.delete_user_ids)) {
      const results = [];
      for (const id of body.delete_user_ids) {
        results.push(id === userData.user.id
          ? { ok: false, id, error: "Tidak bisa menghapus akun sendiri yang sedang login." }
          : await deleteOne(admin, id));
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
  const password = givenPassword || generatePassword();

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

/** Hapus profile dulu, baru auth user, supaya tidak ada baris profile yatim kalau auth delete gagal di tengah. */
async function deleteOne(admin, userId) {
  const { error: profileErr } = await admin.from("profiles").delete().eq("id", userId);
  if (profileErr) return { ok: false, id: userId, error: `Gagal hapus profile: ${profileErr.message}` };

  const { error: authErr } = await admin.auth.admin.deleteUser(userId);
  if (authErr) return { ok: false, id: userId, error: `Profile terhapus tapi akun Auth gagal dihapus: ${authErr.message}` };

  return { ok: true, id: userId };
}

/**
 * PIN 6 digit acak kriptografis (crypto.getRandomValues, bukan Math.random -- Math.random
 * bisa diprediksi, tidak cocok untuk apa pun yang menjaga akses). Dulu "kata dari email +
 * 6 digit"; bagian kata itu dihapus -- siapa pun yang tahu username otomatis bisa menebak
 * bagian kata itu, jadi tidak menambah keamanan sama sekali, cuma bikin kode lebih panjang
 * dan lebih rentan salah ketik. PIN murni 6 digit (sejuta kemungkinan) lebih gampang
 * dibaca/diketik dan sesuai label "Kode khusus" di layar login.
 */
function generatePassword() {
  return randomDigits(6);
}

/** n digit acak kriptografis, dipading nol di depan supaya selalu genap n digit. */
function randomDigits(n) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 10 ** n).padStart(n, "0");
}
