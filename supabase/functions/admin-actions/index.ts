// Edge Function: admin-actions
//
// Satu titik untuk mutasi CMS Admin Fammi yang sebelumnya jalan langsung dari browser lewat
// anon key + RLS: approve/tolak draf briefing/tindak_lanjut, ubah profil user, tambah sekolah,
// toggle modul sekolah, ubah jadwal Gemini. Meniru pola create-user (lihat berkas itu):
// verifikasi caller AdminFammi lewat JWT-nya sendiri dulu, baru pakai service_role untuk
// mutasi sungguhan. Tujuannya supaya policy RLS tulis tabel-tabel ini bisa dilepas (sisakan
// SELECT saja) -- permukaan yang harus selalu benar di RLS mengecil jadi satu pintu di sini.
//
// Import Karakter (karakter_skor dkk) SENGAJA belum dipindah ke sini -- itu tulisan
// multi-tabel besar yang butuh transaksi sungguhan di server (rencana Fase E1), bukan sekadar
// pemindahan gerbang seperti lima aksi di bawah ini.
//
// Body: { action, ...payload }, action salah satu dari:
//   "approve" | "reject"      { id, tipe: "tindak_lanjut"|"briefing", teks?, langkahTerpilih?, regenerateDari? }
//   "update-profile"          { userId, nama?, peran?, schoolId?, cakupan? }
//   "add-school"               { nama, yayasanId?, modules? }
//   "toggle-module"            { schoolId, modul, aktif }
//   "update-schedule"          { patch }
//
// Deploy: supabase functions deploy admin-actions

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
      return json({ error: "Cuma AdminFammi yang boleh melakukan aksi ini." }, 403);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const body = await req.json();

    let result;
    switch (body.action) {
      case "approve":
      case "reject":
        result = await handleApproval(admin, body);
        break;
      case "update-profile":
        result = await handleUpdateProfile(admin, body);
        break;
      case "add-school":
        result = await handleAddSchool(admin, body);
        break;
      case "toggle-module":
        result = await handleToggleModule(admin, body);
        break;
      case "update-schedule":
        result = await handleUpdateSchedule(admin, body);
        break;
      default:
        return json({ error: `action tidak dikenal: ${body.action}` }, 400);
    }

    return json(result, result.ok ? 200 : 400);
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

async function handleApproval(admin, body) {
  const { id, tipe, action, teks, langkahTerpilih, regenerateDari } = body;
  if (!id || !tipe) return { ok: false, error: "Field wajib: id, tipe." };
  if (tipe !== "tindak_lanjut" && tipe !== "briefing") {
    return { ok: false, error: 'tipe harus "tindak_lanjut" atau "briefing".' };
  }

  const status = action === "approve" ? "disetujui" : "ditolak";
  const patch: Record<string, any> = { status };
  if (tipe === "briefing") {
    if (teks != null) patch.teks = teks;
  } else {
    if (teks != null) patch.action = teks;
    if (langkahTerpilih) patch.langkah_terpilih = langkahTerpilih; // array opsi terpilih (bisa semua)
  }

  const { error } = await admin.from(tipe).update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Penggantian mulus: begitu draf hasil regenerate disetujui, baris lama yang digantikannya
  // otomatis ditolak supaya tidak tayang ganda di laporan sekolah.
  if (action === "approve" && tipe !== "briefing" && regenerateDari) {
    await admin.from("tindak_lanjut").update({ status: "ditolak" }).eq("id", regenerateDari);
  }
  return { ok: true };
}

async function handleUpdateProfile(admin, body) {
  const { userId, nama, peran, schoolId, cakupan } = body;
  if (!userId) return { ok: false, error: "Field wajib: userId." };
  if (peran !== undefined && !PERAN_VALID.includes(peran)) {
    return { ok: false, error: `peran harus salah satu dari: ${PERAN_VALID.join(", ")}` };
  }

  const patch: Record<string, any> = {};
  if (nama !== undefined) patch.nama = nama;
  if (peran !== undefined) patch.peran = peran;
  if (schoolId !== undefined) patch.school_id = schoolId || null;
  if (cakupan !== undefined) {
    patch.cakupan = Array.isArray(cakupan) && cakupan.length > 0 ? cakupan : null;
  }

  const { error } = await admin.from("profiles").update(patch).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function handleAddSchool(admin, body) {
  const { nama, yayasanId, modules } = body;
  if (!nama) return { ok: false, error: "Field wajib: nama." };

  const id = String(nama).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);

  const { error: schoolErr } = await admin
    .from("schools")
    .insert({ id, nama, yayasan_id: yayasanId || null, aktif: true });
  if (schoolErr) return { ok: false, error: schoolErr.message };

  if (Array.isArray(modules) && modules.length > 0) {
    const { error: modErr } = await admin
      .from("school_modules")
      .insert(modules.map((m: string) => ({ school_id: id, modul: m, aktif: true })));
    if (modErr) return { ok: false, error: modErr.message };
  }

  return { ok: true, id };
}

async function handleToggleModule(admin, body) {
  const { schoolId, modul, aktif } = body;
  if (!schoolId || !modul) return { ok: false, error: "Field wajib: schoolId, modul." };

  const { error } = await admin
    .from("school_modules")
    .upsert({ school_id: schoolId, modul, aktif: !!aktif }, { onConflict: "school_id,modul" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

async function handleUpdateSchedule(admin, body) {
  const { patch } = body;
  if (!patch || typeof patch !== "object") return { ok: false, error: "Field wajib: patch (objek)." };

  const { error } = await admin.from("gemini_schedule").update(patch).eq("id", "default");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
