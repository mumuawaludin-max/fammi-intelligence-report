// Edge Function: generate-mi
//
// Dipanggil dari CMS Admin Fammi (layar Upload/Generate MI) lewat supabase.functions.invoke(),
// SATU siswa per panggilan. Menjalankan mesin pipeline MI (miPipeline.ts, port dari pipeline
// GAS lama) yang untuk satu siswa memanggil Gemini 5 kali + jeda antar panggilan, lalu menulis
// hasilnya ke mi_hasil berstatus 'menunggu_persetujuan'.
//
// Kenapa satu siswa per panggilan: 5 panggilan Gemini + 4 jeda ~800ms + retry bisa makan
// 15-30 detik per siswa. Edge Function punya batas waktu ~150 detik, jadi kalau satu panggilan
// memproses sekelas (puluhan siswa) pasti timeout. CMS yang me-loop per siswa (pola sama dengan
// tombol "Generate semua" Karakter di layar Gemini). API key Gemini server-side (GEMINI_API_KEY),
// tidak pernah di kode React (lihat CLAUDE.md).
//
// Body: { row: { murid_id, nama_siswa, kelas_id, sekolah_id, periode_id, r_inter..r_spasial,
//                mapel_sulit_1?, mapel_sulit_2?, essay_*? } }
//   sekolah_id/kelas_id/murid_id/periode_id sudah di-resolve importer ke bentuk final
//   (sekolah_id = id sekolah kanonik, periode_id = "YYYY-MM").
//
// Deploy: supabase functions deploy generate-mi  (WAJIB lewat CLI, bukan Dashboard "Via
//   Editor" -- fungsi ini mengimpor ../_shared/miPipeline.ts (1600+ baris) dan
//   ../_shared/cors.ts yang tidak ikut terbundel kalau deploy tempel-satu-file.)
// Secret: GEMINI_API_KEY (sama seperti generate-tindak-lanjut).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { buildOutputRow_, setMiModel } from "../_shared/miPipeline.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash";

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

    const { data: profile, error: profileErr } = await callerClient
      .from("profiles").select("peran").eq("id", userData.user.id).single();
    if (profileErr || profile?.peran !== "AdminFammi") {
      return json({ error: "Cuma AdminFammi yang boleh menggenerate laporan MI." }, 403);
    }

    const body = await req.json();
    const inp = body.row;
    if (!inp || typeof inp !== "object") return json({ error: "Field wajib: row (objek satu siswa)." }, 400);
    if (!inp.murid_id || !inp.sekolah_id || !inp.periode_id) {
      return json({ error: "row wajib punya murid_id, sekolah_id, periode_id." }, 400);
    }

    setMiModel(GEMINI_MODEL);
    const out = await buildOutputRow_(inp, GEMINI_API_KEY);

    // Kolom flat mi_hasil = subset; sisanya (top_*, narasi per kecerdasan, hari_*, smart_*,
    // dst) hidup di detail jsonb. Perhatikan beda nama: pipeline keluarkan skor sebagai r_*
    // dan level linguistik sebagai pred_linguis, tapi kolom flat mi_hasil pakai skor_* dan
    // pred_linguistik. detail menyimpan seluruh objek out (kunci r_*/pred_linguis), konsisten
    // dengan yang dibaca transformMIData/CODE_META di web (scoreKey r_inter, levelKey pred_linguis).
    const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const miRow = {
      id: crypto.randomUUID(),
      murid_id: out.murid_id,
      sekolah_id: out.sekolah_id || null,
      kelas_id: out.kelas_id || null,
      periode_id: out.periode_id || null,
      skor_inter: out.r_inter, skor_intra: out.r_intra, skor_kines: out.r_kines,
      skor_linguistik: out.r_linguistik, skor_logmat: out.r_logmat, skor_musikal: out.r_musikal,
      skor_naturalis: out.r_naturalis, skor_spasial: out.r_spasial,
      narasi_hero: out.narasi_hero || null, narasi_kombinasi: out.narasi_kombinasi || null,
      pred_inter: out.pred_inter || null, pred_intra: out.pred_intra || null,
      pred_kines: out.pred_kines || null, pred_linguistik: out.pred_linguis || null,
      pred_logmat: out.pred_logmat || null,
      status: "menunggu_persetujuan",
      generated_at: new Date().toISOString(),
      detail: out,
    };

    // Idempoten: kalau sudah ada draf menunggu untuk (sekolah, murid, periode) yang sama
    // (mis. generate diulang karena sebelumnya gagal di tengah), buang dulu supaya tidak
    // menumpuk draf ganda. Baris yang sudah 'disetujui' TIDAK disentuh -- penggantian baris
    // disetujui lama diurus saat approval draf baru (lihat MI-4), sama pola dengan Karakter.
    await db.from("mi_hasil").delete()
      .eq("sekolah_id", miRow.sekolah_id).eq("murid_id", miRow.murid_id)
      .eq("periode_id", miRow.periode_id).eq("status", "menunggu_persetujuan");

    const { error: insErr } = await db.from("mi_hasil").insert(miRow);
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, murid_id: miRow.murid_id, top_1: out.top_1 });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});
