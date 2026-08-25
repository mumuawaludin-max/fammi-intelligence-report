// Edge Function: refresh-ypt-views
//
// Memanggil RPC refresh_ypt_karakter_views() (migration 20260826130000) lewat SERVICE_ROLE,
// bukan lewat supabase.rpc() langsung dari browser sebagai role 'authenticated'.
//
// KENAPA INI PERLU (bukan cuma gaya): refresh materialized view untuk sekolah Telkom butuh
// belasan detik (karakter_skor_indikator: ratusan ribu baris). Dua percobaan sebelumnya buat
// memperpanjang batas waktu -- `set local statement_timeout` di dalam fungsinya sendiri, lalu
// `alter role authenticated set statement_timeout = '5min'` -- SAMA-SAMA gagal, tetap kena
// "canceling statement due to statement timeout" walau setting-nya terverifikasi tersimpan benar
// (dicek 2026-08-26 lewat pg_db_role_setting). Kesimpulannya: batas waktu itu ditegakkan di
// connection pooler (Supavisor) yang dipakai PostgREST untuk role authenticated, bukan cuma GUC
// Postgres biasa yang bisa ditimpa dari dalam transaksi/role. service_role tidak lewat jalur
// pool terbatas yang sama, jadi memindahkan pemanggilan ke sini menghindari masalahnya sama
// sekali alih-alih terus menaikkan batas waktu role authenticated (yang berlaku untuk SELURUH
// aplikasi, bukan cuma tombol ini).
//
// Body: {} (tidak perlu payload). Respons: { ok: true } atau { error: "..." }.

import { createClient } from "jsr:@supabase/supabase-js@2";

const PROD_ORIGINS = (Deno.env.get("ALLOWED_ORIGIN") || "https://fammi-intelligence-report.vercel.app")
  .split(",").map((s) => s.trim()).filter(Boolean);

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || req.headers.get("Origin");
  const allowed = origin && (PROD_ORIGINS.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin));
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : PROD_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Tidak ada token." }, 401);

    // Verifikasi PEMANGGIL (bukan koneksi ini) memang AdminFammi, lewat JWT mereka sendiri --
    // pola sama persis dengan admin-actions/index.ts dan sync-ypt-sheets/index.ts.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Sesi tidak valid." }, 401);

    const { data: profil } = await callerClient
      .from("profiles").select("peran").eq("id", userData.user.id).single();
    if (profil?.peran !== "AdminFammi") {
      return json({ error: "Cuma AdminFammi yang boleh me-refresh ringkasan YPT." }, 403);
    }

    // Panggilan sesungguhnya lewat service_role -- tidak kena batas waktu pool authenticated.
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { error } = await admin.rpc("refresh_ypt_karakter_views");
    if (error) return json({ error: error.message }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message || "Refresh gagal." }, 500);
  }
});
