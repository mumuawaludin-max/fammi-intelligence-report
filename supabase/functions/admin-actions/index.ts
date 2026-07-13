// Edge Function: admin-actions
//
// Satu titik untuk mutasi CMS Admin Fammi yang sebelumnya jalan langsung dari browser lewat
// anon key + RLS: approve/tolak draf briefing/tindak_lanjut, ubah profil user, tambah sekolah,
// toggle modul sekolah, ubah jadwal Gemini. Meniru pola create-user (lihat berkas itu):
// verifikasi caller AdminFammi lewat JWT-nya sendiri dulu, baru pakai service_role untuk
// mutasi sungguhan. Tujuannya supaya policy RLS tulis tabel-tabel ini bisa dilepas (sisakan
// SELECT saja) -- permukaan yang harus selalu benar di RLS mengecil jadi satu pintu di sini.
//
// Import Karakter (karakter_skor dkk) lewat action "import-karakter": panggil RPC Postgres
// import_karakter_periode (migration 20260712100000) pakai service_role, satu panggilan per
// periode. RPC-nya sendiri SECURITY DEFINER tapi TERNYATA TIDAK melewati RLS di project ini
// (writes di dalamnya tetap dievaluasi terhadap policy tabel) -- kalau dipanggil langsung
// dari browser lewat anon key (supabase.rpc()), tetap butuh policy RLS tulis yang longgar,
// menggagalkan tujuan Fase E1. Dipanggil lewat service_role di sini, RLS-nya benar-benar
// dilewati, sehingga policy tabel karakter_skor dkk bisa disempitkan jadi SELECT saja.
// RPC tetap dipakai (bukan insert/delete langsung dari sini) supaya empat tabel tertulis
// dalam satu transaksi Postgres yang sesungguhnya -- panggilan admin.from(...) terpisah dari
// Edge Function TIDAK atomik lintas panggilan, beda dengan satu panggilan function.
//
// Body: { action, ...payload }, action salah satu dari:
//   "approve" | "reject"      { id, tipe: "tindak_lanjut"|"briefing", teks?, langkahTerpilih?, regenerateDari? }
//   "update-profile"          { userId, nama?, peran?, schoolId?, cakupan? }
//   "add-school"               { nama, yayasanId?, modules? }
//   "toggle-module"            { schoolId, modul, aktif }
//   "update-schedule"          { patch }
//   "import-karakter"          { payload: { sekolah_id, periode_id, skor_rows, skor_indikator_rows, pernyataan_rows, summary_rows } }
//   "list-mi-pending"          {}  -> { rows: [...] } daftar laporan MI menunggu persetujuan
//   "approve-mi" | "reject-mi" { id }  setujui/tolak satu baris mi_hasil
//
// Deploy: supabase functions deploy admin-actions
//
// corsHeaders ditulis LANGSUNG di sini (bukan impor dari ../_shared/cors.ts seperti fungsi
// lain) supaya berkas ini berdiri sendiri satu file penuh -- deploy lewat Supabase Dashboard
// (tempel kode langsung, tanpa upload folder _shared/) gagal bundling kalau ada impor relatif
// ke luar folder fungsi ini sendiri. Origin dibatasi ke domain FIR sendiri (bukan "*"), sama
// seperti fungsi lain -- lihat komentar di _shared/cors.ts untuk alasannya.

import { createClient } from "jsr:@supabase/supabase-js@2";

const PROD_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://fammi-intelligence-report.vercel.app";
const ALLOWED_ORIGINS = [PROD_ORIGIN, "http://localhost:5173"];

function buildCorsHeaders(req) {
  const origin = req.headers.get("origin") || req.headers.get("Origin");
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : PROD_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const PERAN_VALID = ["AdminFammi", "Yayasan", "KepalaSekolah", "WakilKepalaSekolah", "WaliKelas", "OrangTua", "Siswa"];

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
      case "import-karakter":
        result = await handleImportKarakter(admin, body);
        break;
      case "list-mi-pending":
        result = await handleListMiPending(admin);
        break;
      case "approve-mi":
      case "reject-mi":
        result = await handleMiApproval(admin, body);
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

async function handleImportKarakter(admin, body) {
  const { payload } = body;
  if (!payload || typeof payload !== "object") return { ok: false, error: "Field wajib: payload (objek)." };

  const { data, error } = await admin.rpc("import_karakter_periode", { payload });
  if (error) return { ok: false, error: error.message };
  return { ok: true, ...data };
}

// Daftar laporan MI yang menunggu persetujuan, lewat service_role -- supaya RLS mi_hasil tidak
// perlu membuka baris menunggu ke AdminFammi (jalur baca FIR tetap cuma lihat 'disetujui').
async function handleListMiPending(admin) {
  const { data, error } = await admin
    .from("mi_hasil")
    .select("id, murid_id, sekolah_id, kelas_id, periode_id, generated_at, nama_siswa:detail->>nama_siswa, top_1:detail->>top_1")
    .eq("status", "menunggu_persetujuan")
    .order("generated_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, rows: data || [] };
}

async function handleMiApproval(admin, body) {
  const { id, action } = body;
  if (!id) return { ok: false, error: "Field wajib: id." };
  const status = action === "approve-mi" ? "disetujui" : "ditolak";

  if (status === "disetujui") {
    // Penggantian mulus: laporan MI disetujui LAMA untuk (sekolah, murid, periode) yang sama
    // ditolak dulu, supaya siswa tidak punya dua laporan tayang untuk periode itu. Ambil kunci
    // baris yang disetujui ini dulu.
    const { data: row, error: getErr } = await admin
      .from("mi_hasil").select("sekolah_id, murid_id, periode_id").eq("id", id).maybeSingle();
    if (getErr) return { ok: false, error: getErr.message };
    if (row) {
      await admin.from("mi_hasil").update({ status: "ditolak" })
        .eq("sekolah_id", row.sekolah_id).eq("murid_id", row.murid_id)
        .eq("periode_id", row.periode_id).eq("status", "disetujui").neq("id", id);
    }
  }

  const { error } = await admin.from("mi_hasil").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
