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
//   "add-yayasan"              { nama } -> { id, nama }. id di-generate slug manual dari nama
//                              (prefix "YAY-", lihat handleAddYayasan) -- SEBELUMNYA diasumsikan
//                              auto-generate dari database, ternyata yayasan.id sungguhan text
//                              slug manual tanpa default (baris produksi "YAY-FAMMI" untuk
//                              "Yayasan Fammi" membuktikannya), jadi insert tanpa id selalu
//                              gagal kena not-null constraint. Ini penyebab "Tambah Yayasan"
//                              selalu error.
//   "toggle-module"            { schoolId, modul, aktif }
//   "update-schedule"          { patch }
//   "import-karakter"          { payload: { sekolah_id, periode_id, skor_rows, skor_indikator_rows, pernyataan_rows, summary_rows } }
//   "list-mi-pending"          {}  -> { rows: [...] } daftar laporan MI menunggu persetujuan
//   "approve-mi" | "reject-mi" { id }  setujui/tolak satu baris mi_hasil. Approve yang berhasil
//                              otomatis buat akun OrangTua untuk murid itu kalau belum ada
//                              (lihat ensureOrangTuaAccount) -- hasilnya balik lewat field
//                              `akun` di respons: {created, username, password} kalau baru
//                              dibuat, {created:false, existing:true} kalau sudah ada duluan.
//   "import-sc"                { payload: { sekolah_id, periode_id, personal, lembaga } } --
//                              modul School Culture, panggil RPC import_sc_periode (migration
//                              20260722100000), pola identik import-karakter.
//   "list-sc-pending"          {}  -> { rows: [...] } daftar laporan SC individu menunggu persetujuan
//   "approve-sc" | "reject-sc" { id }  setujui/tolak satu baris sc_hasil. Approve yang berhasil
//                              otomatis buat akun Karyawan untuk responden itu kalau belum ada
//                              (lihat ensureKaryawanScAccount, padanan ensureOrangTuaAccount) --
//                              hasilnya balik lewat field `akun`, bentuk sama seperti approve-mi.
//   "edit-sc"                  { id, detail } -- Fase C: admin sunting manual isi draf sc_hasil
//                              (LaporanIndividuSC lengkap) SEBELUM approve. Cuma boleh menimpa
//                              baris yang masih 'menunggu_persetujuan', supaya laporan yang
//                              sudah tayang ke staf tidak bisa diam-diam diubah lewat jalur ini.
//   "retry-sc-accounts"        { sekolah_id, periode_id } -> { ok, dicek, dibuat, sudahAda, akunBaru, gagal }
//                              Perbaikan: ensureKaryawanScAccount (dipanggil approve-sc) sempat
//                              gagal diam-diam (mis. rate limit Supabase Auth saat "Setujui
//                              semua" memanggil createUser berurutan tanpa jeda) TANPA pernah
//                              ditampilkan ke admin -- laporan tetap tayang, tapi stafnya tidak
//                              pernah dapat akun. Action ini mencari SEMUA sc_hasil status
//                              'disetujui' untuk (sekolah, periode) itu, lalu coba buat akun
//                              lagi untuk yang belum punya. Aman diklik berkali-kali (idempoten,
//                              pola sama ensureKaryawanScAccount sendiri).
//
// Deploy: supabase functions deploy admin-actions
//
// corsHeaders ditulis LANGSUNG di sini (bukan impor dari ../_shared/cors.ts seperti fungsi
// lain) supaya berkas ini berdiri sendiri satu file penuh -- deploy lewat Supabase Dashboard
// (tempel kode langsung, tanpa upload folder _shared/) gagal bundling kalau ada impor relatif
// ke luar folder fungsi ini sendiri. Origin dibatasi ke domain FIR sendiri (bukan "*"), sama
// seperti fungsi lain -- lihat komentar di _shared/cors.ts untuk alasannya.

import { createClient } from "jsr:@supabase/supabase-js@2";

// localhost diizinkan di port berapa pun (Vite autoPort bisa geser dari 5173), dan ALLOWED_ORIGIN
// boleh berisi lebih dari satu domain dipisah koma (FIR dilayani dari domain kustom fammi.id
// SEKALIGUS domain default Vercel) -- lihat komentar lengkap di _shared/cors.ts, salinan inline
// supaya berkas ini tetap satu file.
const PROD_ORIGINS = (Deno.env.get("ALLOWED_ORIGIN") || "https://fammi-intelligence-report.vercel.app")
  .split(",").map((s) => s.trim()).filter(Boolean);

function buildCorsHeaders(req) {
  const origin = req.headers.get("origin") || req.headers.get("Origin");
  const allowed = origin && (PROD_ORIGINS.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin));
  const allowOrigin = allowed ? origin : PROD_ORIGINS[0];
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
      case "add-yayasan":
        result = await handleAddYayasan(admin, body);
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
      case "import-sc":
        result = await handleImportSc(admin, body);
        break;
      case "list-sc-personal":
        result = await handleListScPersonal(admin, body);
        break;
      case "list-sc-pending":
        result = await handleListScPending(admin);
        break;
      case "approve-sc":
      case "reject-sc":
        result = await handleScApproval(admin, body);
        break;
      case "edit-sc":
        result = await handleEditSc(admin, body);
        break;
      case "retry-sc-accounts":
        result = await handleRetryScAccounts(admin, body);
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

/**
 * yayasan.id ternyata text slug manual, sama seperti schools.id (lihat handleAddSchool) --
 * BUKAN uuid/serial auto-generate seperti yang diasumsikan sebelumnya. Baris produksi yang
 * sudah ada ("YAY-FAMMI" untuk "Yayasan Fammi") membuktikannya: itu bukan hasil default
 * database, jadi insert TANPA id selalu gagal kena not-null constraint -- ini penyebab
 * "Tambah Yayasan" selalu error di CMS. Kata "yayasan" dibuang dulu dari nama (kalau ada)
 * supaya tidak jadi redundan "YAY-YAYASAN-FAMMI", baru sisanya di-slug-kan -- pola ini
 * menghasilkan persis "YAY-FAMMI" untuk "Yayasan Fammi", cocok dengan baris yang sudah ada.
 */
async function handleAddYayasan(admin, body) {
  const { nama } = body;
  if (!nama) return { ok: false, error: "Field wajib: nama." };

  const inti = String(nama).replace(/\byayasan\b/gi, "").trim() || nama;
  const slug = inti.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const id = `YAY-${slug}`.slice(0, 40);

  const { data, error } = await admin.from("yayasan").insert({ id, nama }).select("id, nama").single();
  if (error) return { ok: false, error: error.message };

  return { ok: true, id: data.id, nama: data.nama };
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
// `detail` (jsonb, seluruh output pipeline) disertakan supaya CMS bisa menampilkan preview
// lengkap sebelum admin menyetujui -- lihat MiDetailDrawer di web.
async function handleListMiPending(admin) {
  const { data, error } = await admin
    .from("mi_hasil")
    .select("id, murid_id, sekolah_id, kelas_id, periode_id, generated_at, nama_siswa:detail->>nama_siswa, top_1:detail->>top_1, detail")
    .eq("status", "menunggu_persetujuan")
    .order("generated_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, rows: data || [] };
}

async function handleMiApproval(admin, body) {
  const { id, action } = body;
  if (!id) return { ok: false, error: "Field wajib: id." };
  const status = action === "approve-mi" ? "disetujui" : "ditolak";

  let row = null;
  if (status === "disetujui") {
    // Penggantian mulus: laporan MI disetujui LAMA untuk (sekolah, murid, periode) yang sama
    // ditolak dulu, supaya siswa tidak punya dua laporan tayang untuk periode itu. Ambil kunci
    // baris yang disetujui ini dulu (dipakai juga untuk buat akun OrangTua di bawah).
    const { data: gotRow, error: getErr } = await admin
      .from("mi_hasil").select("sekolah_id, murid_id, periode_id, nama_siswa:detail->>nama_siswa").eq("id", id).maybeSingle();
    if (getErr) return { ok: false, error: getErr.message };
    row = gotRow;
    if (row) {
      await admin.from("mi_hasil").update({ status: "ditolak" })
        .eq("sekolah_id", row.sekolah_id).eq("murid_id", row.murid_id)
        .eq("periode_id", row.periode_id).eq("status", "disetujui").neq("id", id);
    }
  }

  const { error } = await admin.from("mi_hasil").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Begitu laporan MI tayang, orang tua siswa itu butuh akun untuk membukanya sendiri (laporan
  // individu MI, lihat SiswaPage/BakatView). Dibuat di sini (bukan saat upload/generate) supaya
  // tidak ada akun yang aktif untuk laporan yang ternyata ditolak. Kalau akunnya sudah ada
  // (murid ini sudah pernah diapprove di periode lain), lewati -- satu akun cukup untuk semua
  // periode anak itu.
  let akun = null;
  if (status === "disetujui" && row?.sekolah_id && row?.murid_id) {
    akun = await ensureOrangTuaAccount(admin, row.sekolah_id, row.murid_id, row.nama_siswa);
  }
  return { ok: true, akun };
}

// Daftar id+nama_responden sc_personal untuk satu (sekolah, periode), lewat service_role --
// sama alasannya dengan handleListMiPending: RLS sc_personal cuma membuka baris ke
// KepalaSekolah/WakilKepalaSekolah/Manajemen/Yayasan sekolah itu sendiri (lihat migration
// 20260722100000), AdminFammi TIDAK match sekolah_id = my_school_id() apa pun sekolahnya, jadi
// query langsung dari CMS (anon key + JWT admin) selalu balas 0 baris walau datanya ada --
// dipakai Upload.jsx (handleGenerateScIndividu) buat tahu siapa saja yang baru diimpor.
async function handleListScPersonal(admin, body) {
  const { sekolah_id, periode_id } = body;
  if (!sekolah_id || !periode_id) return { ok: false, error: "Field wajib: sekolah_id, periode_id." };

  const { data, error } = await admin
    .from("sc_personal")
    .select("id, nama_responden")
    .eq("sekolah_id", sekolah_id)
    .eq("periode_id", periode_id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, rows: data || [] };
}

async function handleImportSc(admin, body) {
  const { payload } = body;
  if (!payload || typeof payload !== "object") return { ok: false, error: "Field wajib: payload (objek)." };
  const { sekolah_id, periode_id, personal, lembaga } = payload;

  const { data, error } = await admin.rpc("import_sc_periode", {
    p_sekolah_id: sekolah_id, p_periode_id: periode_id,
    p_personal: personal || [], p_lembaga: lembaga || [],
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true, ...data };
}

// Daftar laporan individu School Culture yang menunggu persetujuan, lewat service_role -- pola
// identik handleListMiPending. `detail` (jsonb, seluruh LaporanIndividuSC) disertakan supaya CMS
// bisa menampilkan preview lengkap sebelum admin menyetujui.
// `bersedia` disertakan (join lewat FK sc_personal_id) supaya reviewer tahu SEBELUM approve
// apakah drill-down individu staf ini akan tampil di tabel "Laporan Individu" pimpinan atau
// tidak (lihat filter di useScRespondenList, useScData.js) -- laporannya sendiri tetap boleh
// disetujui/tayang ke staf itu sendiri terlepas dari bersedia (consent ini cuma soal PIMPINAN
// melihat drill-down-nya, bukan soal staf melihat laporannya sendiri).
async function handleListScPending(admin) {
  const { data, error } = await admin
    .from("sc_hasil")
    .select(
      "id, sc_personal_id, sekolah_id, periode_id, generated_at, detail, qc_flags, " +
      "nama_responden:detail->meta->>nama_responden, peran_kerja:detail->meta->>peran_kerja, " +
      "unit:detail->meta->>unit, sumber:detail->meta->>sumber, sc_personal:sc_personal_id(bersedia)"
    )
    .eq("status", "menunggu_persetujuan")
    .order("generated_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  const rows = (data || []).map((r) => {
    const { sc_personal, ...rest } = r;
    return { ...rest, bersedia: sc_personal?.bersedia ?? null };
  });
  return { ok: true, rows };
}

async function handleScApproval(admin, body) {
  const { id, action } = body;
  if (!id) return { ok: false, error: "Field wajib: id." };
  const status = action === "approve-sc" ? "disetujui" : "ditolak";

  let row = null;
  if (status === "disetujui") {
    // Penggantian mulus: laporan SC disetujui LAMA untuk (sc_personal_id, periode) yang sama
    // ditolak dulu, supaya staf tidak punya dua laporan tayang untuk periode itu -- pola sama
    // dengan handleMiApproval.
    const { data: gotRow, error: getErr } = await admin
      .from("sc_hasil").select("sekolah_id, sc_personal_id, periode_id").eq("id", id).maybeSingle();
    if (getErr) return { ok: false, error: getErr.message };
    row = gotRow;
    if (row) {
      await admin.from("sc_hasil").update({ status: "ditolak" })
        .eq("sekolah_id", row.sekolah_id).eq("sc_personal_id", row.sc_personal_id)
        .eq("periode_id", row.periode_id).eq("status", "disetujui").neq("id", id);
    }
  }

  // approved_at: titik nol "Perjalanan 30 hari" di laporan individu -- WAJIB diisi di sini
  // (saat status benar-benar jadi 'disetujui'), bukan di generate-sc-individu (draf belum tentu
  // pernah disetujui, dan bisa di-generate ulang berkali-kali sebelum akhirnya disetujui).
  const patchSc: Record<string, unknown> = { status };
  if (status === "disetujui") patchSc.approved_at = new Date().toISOString();

  const { error } = await admin.from("sc_hasil").update(patchSc).eq("id", id);
  if (error) return { ok: false, error: error.message };

  // Begitu laporan SC tayang, staf itu butuh akun Karyawan untuk membukanya sendiri (lihat
  // ScKaryawanPage.jsx). Dibuat di sini (bukan saat generate) supaya tidak ada akun aktif untuk
  // laporan yang ternyata ditolak -- pola sama dengan ensureOrangTuaAccount di handleMiApproval.
  let akun = null;
  if (status === "disetujui" && row?.sekolah_id && row?.sc_personal_id) {
    const { data: personalRow } = await admin
      .from("sc_personal").select("nama_responden").eq("id", row.sc_personal_id).maybeSingle();
    akun = await ensureKaryawanScAccount(admin, row.sekolah_id, row.sc_personal_id, personalRow?.nama_responden);
  }
  return { ok: true, akun };
}

/** Fase C: admin sunting manual draf sc_hasil sebelum approve (mis. rapikan narasi hasil Gemini
 * atau perbaiki satu kalimat tanpa perlu regenerate seluruh laporan). Guard status di klausa
 * WHERE (bukan cuma di JS) supaya baris yang keburu disetujui/ditolak di tab lain tidak ikut
 * kena update balapan (race antara dua admin membuka CMS bersamaan). */
async function handleEditSc(admin, body) {
  const { id, detail } = body;
  if (!id || !detail) return { ok: false, error: "Field wajib: id, detail." };
  const { data, error } = await admin
    .from("sc_hasil").update({ detail })
    .eq("id", id).eq("status", "menunggu_persetujuan")
    .select("id").maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Draf tidak ditemukan atau sudah tidak menunggu persetujuan (mungkin sudah disetujui/ditolak di tempat lain)." };
  return { ok: true };
}

/**
 * Perbaikan pemulihan: cari SEMUA sc_hasil status 'disetujui' untuk satu (sekolah, periode),
 * lalu pastikan tiap sc_personal_id-nya punya akun Karyawan -- dipakai admin memperbaiki
 * laporan yang sudah tayang tapi akunnya sempat gagal dibuat tanpa terlihat (lihat catatan
 * "retry-sc-accounts" di atas). Jeda kecil ANTAR panggilan createUser (sama alasannya dengan
 * jeda 600ms di runScIndividuGenerateAction, useAdminCmsData.js) supaya tidak membanjiri
 * Supabase Auth admin API berurutan cepat, yang diduga jadi penyebab kegagalan diam-diam
 * sebelumnya.
 */
async function handleRetryScAccounts(admin, body) {
  const { sekolah_id, periode_id } = body;
  if (!sekolah_id || !periode_id) return { ok: false, error: "Field wajib: sekolah_id, periode_id." };

  const { data: rows, error: rowsErr } = await admin
    .from("sc_hasil")
    .select("sc_personal_id, sc_personal:sc_personal_id(nama_responden)")
    .eq("sekolah_id", sekolah_id).eq("periode_id", periode_id).eq("status", "disetujui");
  if (rowsErr) return { ok: false, error: rowsErr.message };

  // Dedup sc_personal_id -- satu orang mestinya cuma satu baris 'disetujui' per periode (lihat
  // penggantian mulus di handleScApproval), tapi dijaga di sini juga supaya tidak dobel proses
  // kalau ada anomali data.
  const unik = new Map();
  for (const r of rows || []) {
    if (!unik.has(r.sc_personal_id)) unik.set(r.sc_personal_id, r.sc_personal?.nama_responden);
  }

  const akunBaru: { nama: string; username: string; password: string }[] = [];
  let sudahAda = 0;
  const gagal: { nama: string; error: string }[] = [];
  let i = 0;
  for (const [scPersonalId, nama] of unik) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, 400));
    i++;
    const akun = await ensureKaryawanScAccount(admin, sekolah_id, scPersonalId, nama);
    if (akun.created) akunBaru.push({ nama: nama || scPersonalId, username: akun.username, password: akun.password });
    else if (akun.existing) sudahAda++;
    else gagal.push({ nama: nama || scPersonalId, error: akun.error || "Gagal tanpa keterangan." });
  }

  return { ok: true, dicek: unik.size, dibuat: akunBaru.length, sudahAda, akunBaru, gagal };
}

/** Buat akun Karyawan untuk satu responden SC kalau belum ada (dicek lewat sc_responden_id) --
 * padanan langsung ensureOrangTuaAccount di bawah, tautannya lewat profiles.sc_responden_id
 * (bukan murid_id). Gagal buat akun TIDAK membatalkan approval laporannya (laporan tetap
 * tayang; admin bisa buat akunnya manual lewat layar Pengguna kalau ini gagal terus). */
async function ensureKaryawanScAccount(admin, sekolahId, scPersonalId, namaResponden) {
  const { data: existing, error: findErr } = await admin
    .from("profiles").select("id, username")
    .eq("school_id", sekolahId).eq("sc_responden_id", scPersonalId).eq("peran", "Karyawan").maybeSingle();
  if (findErr) {
    console.error(`ensureKaryawanScAccount: gagal cek akun existing untuk sc_personal_id=${scPersonalId} (${namaResponden}): ${findErr.message}`);
    return { created: false, error: findErr.message };
  }
  if (existing) return { created: false, existing: true, username: existing.username };

  const baseUsername = panggilanFromNama(namaResponden);
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const username = baseUsername + randomDigits(3);
    const email = `${username}@fammi.internal`;
    const password = generatePassword();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr) {
      lastErr = createErr;
      if (/registered|exists|duplicate/i.test(createErr.message || "")) continue;
      // Log eksplisit -- SEBELUMNYA error di sini cuma dibalas sebagai bagian objek `akun` yang
      // diam-diam dibuang pemanggil (lihat Upload.jsx/PersetujuanSc.jsx: cuma `akun?.created`
      // yang dicek, `akun?.error` tidak pernah ditampilkan), jadi kegagalan buat akun (mis. rate
      // limit Supabase Auth saat approve banyak sekaligus berurutan) tidak pernah kelihatan di
      // mana pun. Laporannya tetap tayang seperti dirancang, tapi admin tidak pernah tahu staf
      // itu belum punya akun untuk membukanya.
      console.error(`ensureKaryawanScAccount: gagal buat auth user untuk sc_personal_id=${scPersonalId} (${namaResponden}): ${createErr.message}`);
      return { created: false, error: `Gagal buat auth user: ${createErr.message}` };
    }

    const { error: profileErr } = await admin.from("profiles").insert({
      id: created.user.id,
      username,
      nama: namaResponden || "Staf Sekolah",
      peran: "Karyawan",
      school_id: sekolahId,
      cakupan: null,
      sc_responden_id: scPersonalId,
    });
    if (profileErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      console.error(`ensureKaryawanScAccount: gagal buat profile untuk sc_personal_id=${scPersonalId} (${namaResponden}): ${profileErr.message}`);
      return { created: false, error: `Gagal buat profile: ${profileErr.message}` };
    }

    return { created: true, username, password };
  }
  console.error(`ensureKaryawanScAccount: username terus bentrok untuk sc_personal_id=${scPersonalId} (${namaResponden}): ${lastErr?.message || ""}`);
  return { created: false, error: `Gagal buat akun setelah beberapa percobaan (username terus bentrok): ${lastErr?.message || ""}` };
}

/** Nama siswa -> panggilan: kata pertama nama, huruf kecil, diakritik dihilangkan (é->e).
 * "Syed Fachry Syahmy Ridho" -> "syed". Sama persis dengan cara panggilan dipetik di laporan
 * MI siswa sendiri (lihat miTransform.js: namaFinal.split(/\s+/)[0]) supaya username konsisten
 * dengan sapaan yang anak/orang tua lihat di laporannya. Sengaja dari nama siswa, BUKAN dari
 * sekolah_id -- versi lama pakai slug sekolah ("personal-smp.m007"), ganjil di kredensial dan
 * tidak terasa personal untuk orang tua. */
function panggilanFromNama(nama) {
  // \p{Diacritic}: hapus tanda diakritik hasil normalize("NFD") tanpa menulis karakter
  // combining mark mentah di source (gampang salah encode).
  const kata = String(nama || "")
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z\s]/g, "")
    .trim().split(/\s+/).filter(Boolean)[0];
  return (kata || "siswa").slice(0, 16);
}

/** Buat akun OrangTua untuk satu murid kalau belum ada (dicek lewat school_id+murid_id+peran).
 * Username = panggilan (lihat panggilanFromNama) + 3 digit acak untuk keunikan -- beda murid
 * dengan panggilan sama pasti dapat digit beda, dan auth.admin.createUser sendiri yang jadi
 * penjamin akhir keunikan email (retry dengan digit baru kalau ternyata bentrok). Gagal buat
 * akun TIDAK membatalkan approval laporan MI-nya (laporan tetap tayang; admin bisa buat akunnya
 * manual lewat layar Pengguna kalau ini gagal terus).
 *
 * CATATAN: kalau murid ini SUDAH punya akun OrangTua (dibuat sebelum perbaikan skema ini),
 * fungsi ini mengembalikan akun LAMA apa adanya (satu akun per anak, tidak dibuat ulang) --
 * username lama tidak otomatis berubah. Hapus akunnya lewat layar Pengguna kalau mau akun
 * baru dengan skema panggilan+PIN ini dibuatkan ulang saat approval berikutnya. */
async function ensureOrangTuaAccount(admin, sekolahId, muridId, namaSiswa) {
  const { data: existing, error: findErr } = await admin
    .from("profiles").select("id, username")
    .eq("school_id", sekolahId).eq("murid_id", muridId).eq("peran", "OrangTua").maybeSingle();
  if (findErr) return { created: false, error: findErr.message };
  if (existing) return { created: false, existing: true, username: existing.username };

  const baseUsername = panggilanFromNama(namaSiswa);
  let lastErr = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const username = baseUsername + randomDigits(3);
    const email = `${username}@fammi.internal`;
    const password = generatePassword();

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
    });
    if (createErr) {
      lastErr = createErr;
      // Email sudah dipakai (nama+digit kebetulan sama dengan akun lain) -- coba lagi dengan
      // digit baru, bukan langsung gagal. Error lain (mis. password ditolak kebijakan Auth)
      // tidak ada gunanya diulang, langsung dilaporkan.
      if (/registered|exists|duplicate/i.test(createErr.message || "")) continue;
      return { created: false, error: `Gagal buat auth user: ${createErr.message}` };
    }

    const { error: profileErr } = await admin.from("profiles").insert({
      id: created.user.id,
      username,
      nama: `Orang Tua ${namaSiswa || muridId}`,
      peran: "OrangTua",
      school_id: sekolahId,
      cakupan: null,
      murid_id: muridId,
    });
    if (profileErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return { created: false, error: `Gagal buat profile: ${profileErr.message}` };
    }

    return { created: true, username, password };
  }
  return { created: false, error: `Gagal buat akun setelah beberapa percobaan (username terus bentrok): ${lastErr?.message || ""}` };
}

/** Sama persis dengan generatePassword di create-user/index.ts (lihat komentar di sana) --
 * diduplikasi, bukan diimpor, supaya berkas ini tetap berdiri sendiri satu file (lihat
 * catatan deploy di kepala berkas ini). PIN 6 digit acak kriptografis, bukan lagi kata+angka --
 * bagian kata di skema lama sebenarnya tidak menambah keamanan sama sekali (siapa pun yang
 * tahu username otomatis tahu bagian kata itu, tebakannya cuma tinggal 6 digit -- sama seperti
 * sekarang), tapi PIN murni lebih gampang dibaca/diketik dan cocok dengan label "Kode khusus"
 * di layar login. */
function generatePassword() {
  return randomDigits(6);
}

function randomDigits(n) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 10 ** n).padStart(n, "0");
}
