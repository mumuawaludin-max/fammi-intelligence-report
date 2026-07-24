// Edge Function: generate-sc-individu
//
// Dipanggil dari CMS Admin Fammi, SATU staf (sc_personal_id) per panggilan -- pola identik
// generate-mi/index.ts (satu murid per panggilan), TAPI cuma SATU panggilan Gemini per staf
// (bukan 5x seperti MI), karena skema keluarannya lebih ringkas. Menulis hasilnya ke sc_hasil
// berstatus 'menunggu_persetujuan'.
//
// Body: { sc_personal_id, catatan? } -- catatan opsional dari reviewer (Fase C: "Regenerate
// dengan catatan" di PersetujuanSc.jsx), disimpan permanen ke sc_feedback dan otomatis dipatuhi
// di panggilan ini DAN setiap generate ulang berikutnya untuk staf yang sama, pola identik
// gemini_feedback pada generate-tindak-lanjut.
//
// CATATAN TERBUKA (lihat docs/Kerangka_School_Culture_FIR.md dan migration 20260722100000):
// bagian_kesejahteraan.indeks di sini dihitung sebagai RATA-RATA sederhana dari 5 nilai
// kesejahteraan yang sudah final (bukan interpretasi/kategori baru, cuma agregasi tampilan
// satu angka ringkasan) -- kategori-nya (Sangat Rendah..Sangat Tinggi) sengaja DIBIARKAN null
// sampai pemilik produk mengonfirmasi ambang persen->kategori untuk level individu (sheet
// "Personal" tidak menyertakan kolom predikat untuk blok ini, beda dari sheet "Lembaga").
//
// Deploy: supabase functions deploy generate-sc-individu (WAJIB lewat CLI, bukan Dashboard
//   "Via Editor" -- fungsi ini mengimpor ../_shared/geminiPromptSc.ts + ../_shared/cors.ts).
// Secret: GEMINI_API_KEY (sama seperti generate-mi/generate-tindak-lanjut).

import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildCorsHeaders } from "../_shared/cors.ts";
import { callGemini } from "../_shared/geminiPrompt.ts";
import { SYSTEM_INSTRUCTION_SC_INDIVIDU, buildUserPromptScIndividu } from "../_shared/geminiPromptSc.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash";

const DISCLAIMER_INDIVIDU =
  "Laporan ini adalah hasil pengolahan jawaban asesmen Anda dan bersifat rahasia. Gunakan sebagai bahan refleksi pribadi, bukan alat penilaian kinerja formal.";

function rataRata(nilai: number[]) {
  const valid = nilai.filter((n) => Number.isFinite(n));
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

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
      return json({ error: "Cuma AdminFammi yang boleh menggenerate laporan School Culture." }, 403);
    }

    const body = await req.json();
    const scPersonalId = body.sc_personal_id;
    if (!scPersonalId) return json({ error: "Field wajib: sc_personal_id." }, 400);

    const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: row, error: rowErr } = await db
      .from("sc_personal")
      .select("id, sekolah_id, periode_id, nama_responden, peran_kerja, unit, jenjang, budaya, kesejahteraan, profil_organisasi, essay")
      .eq("id", scPersonalId).maybeSingle();
    if (rowErr) return json({ error: rowErr.message }, 500);
    if (!row) return json({ error: "sc_personal_id tidak ditemukan." }, 404);

    if (body.catatan && String(body.catatan).trim()) {
      const { error: fbErr } = await db.from("sc_feedback").insert({
        sekolah_id: row.sekolah_id, sc_personal_id: row.id, catatan: String(body.catatan).trim(),
      });
      if (fbErr) return json({ error: `Gagal simpan catatan: ${fbErr.message}` }, 500);
    }
    const { data: feedbackRows } = await db.from("sc_feedback")
      .select("catatan").eq("sc_personal_id", row.id)
      .order("created_at", { ascending: false }).limit(10);
    const arahanReviewer = (feedbackRows || []).map((r: any) => r.catatan).filter(Boolean);

    const prompt = buildUserPromptScIndividu({
      namaResponden: row.nama_responden, peranKerja: row.peran_kerja, unit: row.unit,
      budaya: row.budaya || [], kesejahteraan: row.kesejahteraan || [],
      profilOrganisasi: row.profil_organisasi || [], essay: row.essay || {}, arahanReviewer,
    });
    const out = await callGemini(GEMINI_API_KEY, GEMINI_MODEL, SYSTEM_INSTRUCTION_SC_INDIVIDU, prompt);
    if (!out || !out.header || !Array.isArray(out.rencana_aksi)) {
      return json({ error: "Gemini tidak mengembalikan laporan yang valid." }, 500);
    }
    const qcFlags = computeQcFlags(out);

    const indeks = rataRata((row.kesejahteraan || []).map((k: any) => k.nilai));

    // sc_personal.budaya (jsonb) pakai nama kolom mean_gambaran/mean_harapan (persis kolom
    // sheet Personal) -- FE (ScRadarChart/ScLaporanIndividuPage/ScDetailDrawer) menunggu bentuk
    // RadarBudayaPoint {tipe, saat_ini, harapan} (sc.types.ts). WAJIB dipetakan ulang di sini,
    // bukan diteruskan mentah, kalau tidak seluruh kartu budaya tampil "--%" (bug nyata yang
    // sempat terjadi: chart_data sempat diisi row.budaya apa adanya).
    const budayaChartData = (row.budaya || []).map((b: any) => ({
      tipe: b.tipe, saat_ini: b.mean_gambaran, harapan: b.mean_harapan,
    }));

    const detail = {
      meta: {
        responden_id: row.id, nama_responden: row.nama_responden, peran_kerja: row.peran_kerja,
        unit: row.unit, jenjang: row.jenjang, organisasi_id: row.sekolah_id, periode_id: row.periode_id,
      },
      header: out.header,
      bagian_budaya: { narasi: out.bagian_budaya?.narasi || "", chart_data: budayaChartData, tabel_gap: (row.budaya || []).map((b: any) => ({ label: b.tipe, arah: arahDariGap(b.gap), nilai_gap: b.gap })) },
      bagian_kesejahteraan: { narasi: out.bagian_kesejahteraan?.narasi || "", indeks, kategori: null, chart_data: row.kesejahteraan || [] },
      bagian_profil_organisasi: { narasi: out.bagian_profil_organisasi?.narasi || "", chart_data: row.profil_organisasi || [] },
      bagian_cermin: buildCermin(row.essay, out.cermin_konteks),
      bagian_refleksi: out.bagian_refleksi || "",
      jawaban_survey: buildJawabanSurvey(row.essay),
      rencana_aksi: (out.rencana_aksi || []).map((a: any, i: number) => ({
        id: `${row.id}-aksi-${i + 1}`, judul: a.judul, alasan: a.alasan,
        terkait: a.terkait, jangka: a.jangka, ikon: a.ikon || "🎯",
      })),
      footer: { disclaimer: DISCLAIMER_INDIVIDU },
    };

    // Idempoten: buang draf 'menunggu_persetujuan' lama untuk (personal, periode) yang sama
    // dulu, supaya generate ulang tidak menumpuk draf ganda -- pola sama generate-mi.
    await db.from("sc_hasil").delete()
      .eq("sc_personal_id", row.id).eq("periode_id", row.periode_id).eq("status", "menunggu_persetujuan");

    const { error: insErr } = await db.from("sc_hasil").insert({
      sekolah_id: row.sekolah_id, sc_personal_id: row.id, periode_id: row.periode_id,
      detail, status: "menunggu_persetujuan", qc_flags: qcFlags.length > 0 ? qcFlags : null,
    });
    if (insErr) return json({ error: insErr.message }, 500);

    return json({ ok: true, nama: row.nama_responden });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

// Fase C: QC otomatis ringan, regex saja -- TIDAK auto-block draf mana pun, cuma menandai
// supaya reviewer tahu bagian mana yang perlu dibaca lebih teliti sebelum approve. Diperiksa
// dari keluaran Gemini MENTAH (out), bukan `detail` final -- bagian_cermin sengaja tidak
// diperiksa di sini karena isinya kutipan verbatim staf sendiri (boleh mengandung angka/apa
// saja), beda dari cermin_konteks yang murni tulisan Gemini.
const FORBIDDEN_TERM_RE = /\b(ocai|klan|adhokrasi|pasar|hierarki|t-score)\b/i;
const EM_DASH_RE = /—|--/;
const NUMBER_RE = /\d/;
const MAX_KALIMAT = 4;

function jumlahKalimat(text: string) {
  return text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean).length;
}

function periksaTeks(field: string, text: string | null | undefined, flags: { field: string; issue: string }[]) {
  if (!text) return;
  if (NUMBER_RE.test(text)) flags.push({ field, issue: "contains_number" });
  if (EM_DASH_RE.test(text)) flags.push({ field, issue: "contains_em_dash" });
  if (FORBIDDEN_TERM_RE.test(text)) flags.push({ field, issue: "contains_forbidden_terms" });
  if (jumlahKalimat(text) > MAX_KALIMAT) flags.push({ field, issue: "exceeds_sentence_limit" });
}

function computeQcFlags(out: Record<string, any>) {
  const flags: { field: string; issue: string }[] = [];
  periksaTeks("header.hook", out.header?.hook, flags);
  periksaTeks("header.sub_hook", out.header?.sub_hook, flags);
  periksaTeks("bagian_budaya.narasi", out.bagian_budaya?.narasi, flags);
  periksaTeks("bagian_kesejahteraan.narasi", out.bagian_kesejahteraan?.narasi, flags);
  periksaTeks("bagian_profil_organisasi.narasi", out.bagian_profil_organisasi?.narasi, flags);
  periksaTeks("cermin_konteks", out.cermin_konteks, flags);
  periksaTeks("bagian_refleksi", out.bagian_refleksi, flags);
  (out.rencana_aksi || []).forEach((a: any, i: number) => {
    periksaTeks(`rencana_aksi[${i}].judul`, a?.judul, flags);
    periksaTeks(`rencana_aksi[${i}].alasan`, a?.alasan, flags);
  });
  return flags;
}

/** Arah gap: tanda field `gap` yang sudah final dibaca apa adanya (bukan ambang baru yang
 * dikarang) -- positif berarti staf berharap lebih (naik), negatif berarti berharap lebih
 * ringan (turun), persis nol berarti sejalan (tetap). */
function arahDariGap(gap: number | null) {
  if (gap == null || gap === 0) return "tetap";
  return gap > 0 ? "naik" : "turun";
}

/**
 * Kutipan esai (alasan_betah + hal_menguras_energi) ditempel VERBATIM di sini, bukan digenerate
 * Gemini -- satu huruf pun tidak boleh berubah dari jawaban staf sendiri. Gemini cuma menulis
 * konteks yang menemani (cermin_konteks), tidak pernah menyentuh isi kutipannya. Kalau kedua
 * jawaban kosong, cukup pakai konteksnya saja (ajakan reflektif umum, sudah diatur di prompt).
 */
function buildCermin(essay: Record<string, any> | null | undefined, konteks: string | null | undefined) {
  const betah = essay?.alasan_betah ? String(essay.alasan_betah).trim() : "";
  const menguras = essay?.hal_menguras_energi ? String(essay.hal_menguras_energi).trim() : "";
  const kutipan = [betah, menguras].filter(Boolean).map((t) => `"${t}"`).join(" ");
  const konteksBersih = (konteks || "").trim();
  return [kutipan, konteksBersih].filter(Boolean).join(" ");
}

/**
 * Empat jawaban esai VERBATIM, satu field per pertanyaan survey -- BEDA dari buildCermin() di
 * atas yang membaurkan sebagian jawaban ini jadi satu paragraf gabungan dengan konteks Gemini.
 * Dipakai laporan individu remake total (section "Jawaban Survey Anda" + kartu "Perubahan yang
 * Anda harapkan" di hero) supaya tiap jawaban tampil apa adanya per pertanyaan, tidak diringkas.
 */
function buildJawabanSurvey(essay: Record<string, any> | null | undefined) {
  function ambil(field: string) {
    const v = essay?.[field];
    return v ? String(v).trim() : undefined;
  }
  return {
    betah: ambil("alasan_betah"),
    hal_menguras_energi: ambil("hal_menguras_energi"),
    yang_ingin_disampaikan: ambil("yang_ingin_disampaikan"),
    yang_ingin_diubah: ambil("yang_ingin_diubah"),
  };
}
