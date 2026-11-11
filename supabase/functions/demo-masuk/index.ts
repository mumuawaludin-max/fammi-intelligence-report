// Edge Function: demo-masuk
//
// Membuka tampilan produk sungguhan untuk pengunjung demo, memakai akun demo milik Fammi (Rapor
// Karakter Kepala Sekolah/Wali Kelas, Multiple Intelligence, Culture Kelompok/Perorangan). Safety
// & Crisis Management tidak lewat sini lagi sejak 2026-11-11: demonya prototipe Sekolah Proteksi
// yang dibundel di web (tampilan berjenis "prototipe"). Tanpa kata sandi sama sekali: fungsi ini membuat tautan masuk sekali pakai
// untuk akun demo itu lalu langsung menukarnya jadi sesi, di server. Pengunjung tidak pernah
// mengetik username atau kode khusus, dan kode khusus akun demo tidak disimpan di mana pun untuk
// keperluan ini. Browser hanya menerima sesi Supabase Auth akun itu, dan hanya kalau sesi demonya
// masih sah.
//
// Urutan pemeriksaan:
//   1. Token sesi demo dan id tampilan berbentuk benar (id tampilan dari daftar tertutup di bawah).
//   2. Postgres (fungsi demo_session, migration 20261111100000) menyatakan sesi demo masih sah dan
//      sistem tampilan itu termasuk kode demo yang dipakai.
//   3. Username akun demo untuk tampilan itu ada di secret DEMO_AKUN.
//   4. Akun itu SUDAH ADA di Supabase Auth (fungsi demo_akun_email, hanya service_role). Wajib
//      sebelum langkah 5: generateLink tipe magiclink membuat akun baru kalau emailnya belum ada.
//   5. generateLink tipe magiclink (tidak mengirim email), lalu verifyOtp dengan hashed_token-nya
//      menghasilkan sesi. Yang dikembalikan hanya access_token + refresh_token.
//
// Body: { token: "<64 heksadesimal>", tampilan: "<id tampilan>" }
// Balasan: 200 { ok: true, session: { access_token, refresh_token, expires_in, expires_at } }
//          4xx/5xx { ok: false, status: invalid|expired|revoked|ended|not_allowed|belum_diatur|akun_gagal|galat }
//
// Secret DEMO_AKUN, diisi pemilik produk lewat Dashboard > Edge Functions > Secrets (atau
// `supabase secrets set`), berisi username saja, TANPA kata sandi:
//   DEMO_AKUN = {"karakter-kepsek":"<username>", "karakter-walas":"<username>", ...}
// Username sama dengan yang diketik di form masuk: email asli (mengandung "@") dipakai apa adanya,
// selain itu jadi username@fammi.internal (aturan yang sama dengan lib/auth.js dan create-user).
// Bentuk {"karakter-kepsek":{"username":"..."}} juga diterima; kolom lain diabaikan.
// SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY tersedia otomatis di Edge Function.
//
// Deploy: supabase functions deploy demo-masuk (atau Dashboard "Via Editor": berkas ini sengaja
// satu berkas, CORS ditulis langsung, sama seperti admin-actions dan create-user).
//
// Yang perlu diketahui pemilik produk (rinciannya di docs/demo-access.md): pengunjung demo memegang
// sesi sungguhan akun demo itu, jadi akun-akun di DEMO_AKUN wajib akun demo berisi data contoh,
// bukan akun sekolah sungguhan.

import { createClient } from "jsr:@supabase/supabase-js@2";

// Daftar tertutup tampilan berjenis akun dan sistemnya. WAJIB sama dengan tampilan berjenis "akun"
// di web/src/pages/demo/demoSystems.js (ada ujinya di demoAturan.test.js).
const TAMPILAN_AKUN: Record<string, string> = {
  "karakter-kepsek": "education-character",
  "karakter-walas": "education-character",
  "multiple-intelligence": "talent-life-design",
  "culture-kelompok": "teacher-growth",
  "culture-perorangan": "teacher-growth",
};

// Tipe verifikasi yang boleh dipakai untuk menukar hashed_token jadi sesi.
const TIPE_VERIFIKASI = new Set(["magiclink", "signup", "email"]);

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

// Secret dibaca setiap permintaan supaya perubahan secret langsung berlaku tanpa deploy ulang.
function bacaDaftarAkun(mentah: string | undefined): Record<string, string> {
  let isi: unknown;
  try {
    isi = JSON.parse(mentah || "{}");
  } catch {
    return {};
  }
  if (!isi || typeof isi !== "object" || Array.isArray(isi)) return {};
  const hasil: Record<string, string> = {};
  for (const [id, akun] of Object.entries(isi as Record<string, unknown>)) {
    if (!Object.hasOwn(TAMPILAN_AKUN, id)) continue;
    const username = typeof akun === "string"
      ? akun
      : akun && typeof akun === "object" && typeof (akun as { username?: unknown }).username === "string"
      ? (akun as { username: string }).username
      : "";
    if (username.trim()) hasil[id] = username.trim();
  }
  return hasil;
}

function emailDariUsername(username: string) {
  return username.includes("@") ? username : `${username}@fammi.internal`;
}

Deno.serve(async (req) => {
  const cors = buildCorsHeaders(req);
  const balas = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return balas({ ok: false, status: "invalid" }, 405);

  let body: { token?: unknown; tampilan?: unknown };
  try {
    body = await req.json();
  } catch {
    return balas({ ok: false, status: "invalid" }, 400);
  }

  const token = typeof body?.token === "string" ? body.token : "";
  const tampilan = typeof body?.tampilan === "string" ? body.tampilan : "";
  if (!/^[0-9a-f]{64}$/.test(token) || !Object.hasOwn(TAMPILAN_AKUN, tampilan)) {
    return balas({ ok: false, status: "invalid" }, 400);
  }
  const sistem = TAMPILAN_AKUN[tampilan];

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const kunciServis = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const opsi = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

  // 2. Sesi demo diperiksa Postgres, bukan di sini. Memakai anon key, seperti browser.
  const pemeriksa = createClient(url, anon, opsi);
  const { data: sesi, error: galatSesi } = await pemeriksa.rpc("demo_session", { p_token: token });
  if (galatSesi) {
    console.error("demo-masuk: demo_session gagal", galatSesi.message);
    return balas({ ok: false, status: "galat" }, 502);
  }
  if (!sesi?.valid) return balas({ ok: false, status: sesi?.status || "invalid" }, 403);
  if (!Array.isArray(sesi.availableSystems) || !sesi.availableSystems.includes(sistem)) {
    return balas({ ok: false, status: "not_allowed" }, 403);
  }

  // 3. Akun demo untuk tampilan ini.
  const username = bacaDaftarAkun(Deno.env.get("DEMO_AKUN"))[tampilan];
  if (!username) return balas({ ok: false, status: "belum_diatur" }, 503);

  // 4. Akun harus sudah ada. Kunci service_role hanya dipakai di dalam fungsi ini.
  const admin = createClient(url, kunciServis, opsi);
  const { data: email, error: galatAkun } = await admin.rpc("demo_akun_email", {
    p_email: emailDariUsername(username),
  });
  if (galatAkun) {
    console.error("demo-masuk: demo_akun_email gagal", galatAkun.message);
    return balas({ ok: false, status: "galat" }, 502);
  }
  if (typeof email !== "string" || !email) {
    // Hanya id tampilan yang dicatat, tidak pernah username atau emailnya.
    console.error("demo-masuk: akun demo tidak ditemukan untuk tampilan", tampilan);
    return balas({ ok: false, status: "akun_gagal" }, 502);
  }

  // 5. Tautan masuk sekali pakai (tidak dikirim ke mana pun), langsung ditukar jadi sesi dengan klien
  //    baru tanpa penyimpanan, supaya tiap pengunjung mendapat sesinya sendiri.
  const { data: tautan, error: galatTautan } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const hashed = tautan?.properties?.hashed_token;
  if (galatTautan || !hashed) {
    console.error("demo-masuk: tautan masuk gagal dibuat untuk tampilan", tampilan, galatTautan?.status ?? "");
    return balas({ ok: false, status: "akun_gagal" }, 502);
  }

  // Tipe dari tautan itu sendiri lebih dulu (sama dengan action_link-nya), "email" sebagai cadangan
  // karena tipe itu mencakup token tautan masuk maupun konfirmasi.
  const tipeTautan = String(tautan?.properties?.verification_type || "magiclink");
  const daftarTipe = [...new Set([TIPE_VERIFIKASI.has(tipeTautan) ? tipeTautan : "magiclink", "email"])];
  const masuk = createClient(url, anon, opsi);
  for (const tipe of daftarTipe) {
    const { data, error } = await masuk.auth.verifyOtp({ token_hash: hashed, type: tipe as "magiclink" | "signup" | "email" });
    if (!error && data?.session) {
      const s = data.session;
      return balas({
        ok: true,
        session: {
          access_token: s.access_token,
          refresh_token: s.refresh_token,
          expires_in: s.expires_in,
          expires_at: s.expires_at,
        },
      });
    }
    console.error("demo-masuk: tautan masuk gagal ditukar untuk tampilan", tampilan, tipe, error?.status ?? "");
  }
  return balas({ ok: false, status: "akun_gagal" }, 502);
});
