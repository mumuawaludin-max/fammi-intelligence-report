// Edge Function: generate-tindak-lanjut
//
// Dipanggil dari CMS Admin Fammi (rekomendasi/trigger manual layar "Trigger & Gemini") lewat
// supabase.functions.invoke(). Tidak pernah dipanggil dari jalur baca FIR biasa,
// dan API key Gemini tidak pernah ada di kode React/browser (lihat CLAUDE.md).
//
// Alur:
// 1. Verifikasi caller adalah AdminFammi (pakai JWT si caller, bukan service_role).
// 2. Ambil fakta kuantitatif dari karakter_summary DAN fakta kualitatif (kutipan refleksi
//    orang tua) dari karakter_pernyataan_ortu sesuai scope yang diminta.
// 3. Panggil Gemini (system instruction di _shared/geminiPrompt.ts), minta JSON
//    { gambaran, opsi: [{label, langkah:[{jangka,aksi}]}], catatan_internal }.
// 4. Tulis draf baru ke tindak_lanjut/briefing dengan status='menunggu_persetujuan'.
//    opsi_kandidat dan catatan_internal HANYA untuk reviewer, jangan pernah di-select
//    dari query sisi baca sekolah (lihat useKarakterData.js). action/trigger_desc diisi
//    otomatis dari opsi pertama supaya kontrak FollowupCard lama tetap kompatibel sebelum
//    reviewer memilih opsi final saat approve. TIDAK PERNAH langsung 'disetujui'.
//
// Deploy: supabase functions deploy generate-tindak-lanjut
// Secret: supabase secrets set GEMINI_API_KEY=xxxxx

import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { generateAndInsertDraft } from "../_shared/geminiPrompt.ts";
import { generateAndInsertDraftSc } from "../_shared/geminiPromptSc.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash";

// "manajemen" ditambahkan untuk modul School Culture (peran pimpinan CW/SC) -- yayasan dan
// kepala_sekolah sudah dipakai bareng Karakter, jadi tidak perlu entri baru untuk keduanya.
const ROLE_VALID = ["yayasan", "kepala_sekolah", "wali_kelas", "orang_tua", "manajemen"];

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

    const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sesi tidak valid." }, 401);

    const { data: profile, error: profileErr } = await callerClient
      .from("profiles")
      .select("peran")
      .eq("id", userData.user.id)
      .single();
    if (profileErr || profile?.peran !== "AdminFammi") {
      return json({ error: "Cuma AdminFammi yang boleh memicu Gemini." }, 403);
    }

    const body = await req.json();
    const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Mode regenerate: baris lama jadi sumber konteks (scope dsb), catatan reviewer disimpan
    // jadi arahan permanen, lalu draf baru digenerate dengan arahan itu ikut di prompt.
    if (body.regenerate_of) {
      const { data: lama, error: lamaErr } = await db
        .from("tindak_lanjut")
        .select("id, sekolah_id, modul, scope, scope_id, periode_id, status, target_role")
        .eq("id", body.regenerate_of)
        .maybeSingle();
      if (lamaErr) return json({ error: lamaErr.message }, 500);
      if (!lama) return json({ error: "Draf yang mau di-regenerate tidak ditemukan." }, 404);

      if (body.catatan && String(body.catatan).trim()) {
        const { error: fbErr } = await db.from("gemini_feedback").insert({
          sekolah_id: lama.sekolah_id, scope: lama.scope, scope_id: lama.scope_id,
          tindak_lanjut_id: lama.id, catatan: String(body.catatan).trim(),
        });
        if (fbErr) return json({ error: `Gagal simpan catatan: ${fbErr.message}` }, 500);
      }

      // Role penerus: prioritas body.role, lalu target_role baris lama (supaya regenerate
      // draf Yayasan tetap jadi draf Yayasan, bukan berubah jadi Kepala Sekolah), baru
      // fallback tebakan dari scope untuk baris lama yang belum punya target_role.
      const role = ROLE_VALID.includes(body.role) ? body.role
        : ROLE_VALID.includes(lama.target_role) ? lama.target_role
        : (lama.scope === "kelas" || lama.scope === "murid") ? "wali_kelas" : "kepala_sekolah";

      const hasil = lama.modul === "sc"
        ? await generateAndInsertDraftSc(
            db,
            { role, sekolah_id: lama.sekolah_id, sekolah_nama: await namaSekolah(db, lama.sekolah_id),
              periode_id: lama.periode_id, tipe: "tindak_lanjut", regenerateDari: lama.id },
            { apiKey: GEMINI_API_KEY, model: GEMINI_MODEL }
          )
        : await generateAndInsertDraft(
            db,
            { role, scope: lama.scope, scope_id: lama.scope_id, sekolah_id: lama.sekolah_id,
              modul: lama.modul, periode_id: lama.periode_id, tipe: "tindak_lanjut", regenerateDari: lama.id },
            { apiKey: GEMINI_API_KEY, model: GEMINI_MODEL }
          );

      // Satu panggilan generate sekarang menghasilkan BEBERAPA baris rekomendasi sekaligus
      // (satu per rekomendasi, bukan satu baris berisi beberapa opsi). Regenerate berarti
      // mengganti seluruh batch lama untuk scope/periode ini, bukan cuma baris yang dibuka di
      // drawer, jadi semua saudara-baris yang masih menunggu ikut ditolak di sini. Yang sudah
      // disetujui dibiarkan tayang dulu, baru ditolak saat penggantinya di-approve (lihat
      // actApprovalAction di CMS) supaya laporan sekolah tidak pernah kosong di tengah proses.
      // Difilter target_role juga: Kepsek dan Yayasan sama-sama scope='sekolah' di sekolah
      // yang sama, jadi tanpa filter ini regenerate draf satu peran ikut menolak draf
      // peran lain yang masih menunggu.
      await db.from("tindak_lanjut")
        .update({ status: "ditolak" })
        .eq("sekolah_id", lama.sekolah_id).eq("modul", lama.modul)
        .eq("scope", lama.scope).eq("scope_id", lama.scope_id).eq("periode_id", lama.periode_id)
        .eq("target_role", role)
        .eq("status", "menunggu_persetujuan");

      return json({ ok: true, hasil });
    }

    const { scope, scope_id, sekolah_id, modul, periode_id, tipe, role } = body;
    if (!scope || !scope_id || !sekolah_id || !modul || !periode_id || !tipe || !role) {
      return json({ error: "Field wajib: scope, scope_id, sekolah_id, modul, periode_id, tipe, role." }, 400);
    }
    if (!ROLE_VALID.includes(role)) {
      return json({ error: `role harus salah satu dari: ${ROLE_VALID.join(", ")}` }, 400);
    }
    if (modul !== "karakter" && modul !== "sc") {
      return json({ error: "Baru modul Karakter dan School Culture yang didukung Edge Function ini untuk saat ini." }, 400);
    }

    if (modul === "sc") {
      const hasilSc = await generateAndInsertDraftSc(
        db,
        { role, sekolah_id, sekolah_nama: await namaSekolah(db, sekolah_id), periode_id, tipe },
        { apiKey: GEMINI_API_KEY, model: GEMINI_MODEL }
      );
      return json({ ok: true, hasil: hasilSc });
    }

    const hasil = await generateAndInsertDraft(
      db,
      { role, scope, scope_id, sekolah_id, modul, periode_id, tipe },
      { apiKey: GEMINI_API_KEY, model: GEMINI_MODEL }
    );

    return json({ ok: true, hasil });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

/** Nama sekolah untuk ditulis di prompt SC (mengapa_data harus sebut nama sekolah, bukan
 * cuma id slug-nya). Fallback ke sekolahId sendiri kalau baris schools tidak ketemu. */
async function namaSekolah(db: any, sekolahId: string) {
  const { data } = await db.from("schools").select("nama").eq("id", sekolahId).maybeSingle();
  return data?.nama || sekolahId;
}
