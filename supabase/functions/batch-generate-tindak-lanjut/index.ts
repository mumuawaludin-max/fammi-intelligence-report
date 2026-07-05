// Edge Function: batch-generate-tindak-lanjut
//
// Dipanggil oleh pg_cron (net.http_post dari dalam Postgres, tiap jam) lewat header
// x-cron-secret, BUKAN oleh browser admin dan BUKAN pakai JWT user (tidak ada sesi
// pengguna di sisi cron). Function ini yang menentukan sendiri apakah sudah waktunya
// jalan berdasarkan gemini_schedule.interval_jam, supaya jadwal cron di Postgres bisa
// tetap fix tiap jam (granularitas paling halus pg_cron), sementara admin bisa atur
// interval yang lebih jarang (3/6/12/24 jam) lewat CMS tanpa perlu ubah jadwal cron.
//
// Alur:
// 1. Verifikasi header x-cron-secret cocok dengan secret CRON_SECRET.
// 2. Baca gemini_schedule (id='default'). Kalau nonaktif atau belum waktunya, keluar.
// 3. Hitung kelas yang punya karakter_summary (scope=kelas) periode terbaru tapi belum
//    punya baris tindak_lanjut sama sekali untuk periode itu (scope=kelas).
// 4. Generate draf untuk tiap rekomendasi (reuse generateAndInsertDraft, sama persis
//    dengan yang dipakai trigger manual), role default wali_kelas untuk scope kelas.
// 5. Update gemini_schedule.terakhir_jalan.
//
// Deploy: supabase functions deploy batch-generate-tindak-lanjut
// Secret: supabase secrets set CRON_SECRET=xxxxx (juga dipakai di SQL cron.schedule)

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { generateAndInsertDraft } from "../_shared/geminiPrompt.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash";
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const secret = req.headers.get("x-cron-secret");
    if (!secret || secret !== CRON_SECRET) {
      return json({ error: "Tidak berwenang." }, 401);
    }

    const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: jadwal, error: jadwalErr } = await db
      .from("gemini_schedule").select("*").eq("id", "default").maybeSingle();
    if (jadwalErr) return json({ error: jadwalErr.message }, 500);
    if (!jadwal || !jadwal.aktif) {
      return json({ ok: true, dikerjakan: false, alasan: "Jadwal otomatis nonaktif." });
    }

    const jamSejakTerakhir = jadwal.terakhir_jalan
      ? (Date.now() - new Date(jadwal.terakhir_jalan).getTime()) / 3600000
      : Infinity;
    if (jamSejakTerakhir < jadwal.interval_jam) {
      return json({ ok: true, dikerjakan: false, alasan: `Baru ${jamSejakTerakhir.toFixed(1)} jam sejak terakhir jalan, interval ${jadwal.interval_jam} jam.` });
    }

    const rekomendasi = await hitungRekomendasi(db);

    const hasil = [];
    for (const r of rekomendasi) {
      try {
        await generateAndInsertDraft(
          db,
          { role: "wali_kelas", scope: "kelas", scope_id: r.kelas_id, sekolah_id: r.sekolah_id, modul: "karakter", periode_id: r.periode_id, tipe: "tindak_lanjut" },
          { apiKey: GEMINI_API_KEY, model: GEMINI_MODEL }
        );
        hasil.push({ ...r, ok: true });
      } catch (e) {
        hasil.push({ ...r, ok: false, error: String(e?.message || e) });
      }
    }

    await db.from("gemini_schedule").update({ terakhir_jalan: new Date().toISOString() }).eq("id", "default");

    return json({ ok: true, dikerjakan: true, jumlahDigenerate: hasil.filter((h) => h.ok).length, hasil });
  } catch (e) {
    return json({ error: String(e?.message || e) }, 500);
  }
});

/** Kelas dengan karakter_summary periode terbaru tapi belum punya tindak_lanjut sama sekali. */
async function hitungRekomendasi(db) {
  const { data: sekolahAktif } = await db
    .from("school_modules").select("school_id").eq("modul", "karakter").eq("aktif", true);
  const sekolahIds = [...new Set((sekolahAktif || []).map((s) => s.school_id))];
  if (sekolahIds.length === 0) return [];

  const rekomendasi = [];
  for (const sekolahId of sekolahIds) {
    const { data: summaryRows } = await db
      .from("karakter_summary").select("scope_id, periode_id")
      .eq("sekolah_id", sekolahId).eq("scope", "kelas");
    if (!summaryRows || summaryRows.length === 0) continue;

    const periodeTerbaru = summaryRows.reduce((max, r) => (!max || r.periode_id > max ? r.periode_id : max), null);
    const kelasList = [...new Set(summaryRows.filter((r) => r.periode_id === periodeTerbaru).map((r) => r.scope_id))];

    // Filter modul + status disamakan dengan panel Rekomendasi di CMS: baris modul lain
    // tidak dihitung, dan kelas yang draf-nya ditolak boleh digenerate ulang oleh cron.
    const { data: tlRows } = await db
      .from("tindak_lanjut").select("scope_id")
      .eq("sekolah_id", sekolahId).eq("modul", "karakter").eq("scope", "kelas")
      .eq("periode_id", periodeTerbaru)
      .in("status", ["menunggu_persetujuan", "disetujui"]);
    const kelasSudahAda = new Set((tlRows || []).map((r) => r.scope_id));

    for (const kelasId of kelasList) {
      if (!kelasSudahAda.has(kelasId)) {
        rekomendasi.push({ sekolah_id: sekolahId, kelas_id: kelasId, periode_id: periodeTerbaru });
      }
    }
  }
  return rekomendasi;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
