// CORS dibatasi ke domain FIR sendiri, bukan "*" (siapa saja boleh memanggil dari browser).
// Otorisasi tetap ditegakkan lewat JWT di tiap fungsi (lihat verifikasi caller di masing-masing
// index.ts) -- ini bukan gerbang keamanan utama, tapi tidak ada alasan situs lain diizinkan
// memanggil fungsi ini langsung dari browser pengguna mereka.
//
// Domain produksi dibaca dari secret ALLOWED_ORIGIN (supabase secrets set ALLOWED_ORIGIN=...),
// dengan fallback ke domain Vercel default kalau secret belum di-set.
//
// localhost diizinkan di PORT BERAPA PUN, bukan cuma 5173: Vite dikonfigurasi autoPort (lihat
// .claude/launch.json), jadi kalau 5173 sedang terpakai proses lain, dev server pindah ke 5174
// dst -- dan origin yang bergeser satu port itu membuat SEMUA panggilan Edge Function gagal
// preflight dengan pesan "Failed to send a request to the Edge Function" yang tidak menyebut
// CORS sama sekali. Aman karena localhost hanya bisa berarti mesin developer itu sendiri.
const PROD_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://fammi-intelligence-report.vercel.app";

function isAllowedOrigin(origin: string) {
  return origin === PROD_ORIGIN || /^http:\/\/localhost:\d+$/.test(origin);
}

/** Panggil dengan request masuk, kembalikan header CORS yang me-refleksikan Origin pemanggil
 * HANYA kalau origin itu ada di daftar izin -- di luar itu, jatuh ke origin produksi (preflight
 * browser dari origin lain akan gagal karena Origin balasan tidak cocok dengan Origin asli). */
export function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || req.headers.get("Origin");
  const allowOrigin = origin && isAllowedOrigin(origin) ? origin : PROD_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}
