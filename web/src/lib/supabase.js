import { createClient } from "@supabase/supabase-js";

// Anon key aman dipublikasikan (bukan rahasia, lihat CLAUDE.md); RLS di Postgres yang
// menjaga baris mana yang boleh dibaca. Fallback ke nilai proyek FIR supaya build tetap
// jalan walau env var belum diisi (mis. preview deploy lokal), tapi produksi/staging
// sebaiknya set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY sendiri lewat Vercel.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hypzmczwpigkyomzgjdb.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHptY3p3cGlna3lvbXpnamRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjU4MDgsImV4cCI6MjA5ODQwMTgwOH0.MxTMWmhfIwHZ-w4nqQnOQNji69NnjTmY1poN6-74KVk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const PAGE_SIZE = 1000;

/**
 * Supabase/PostgREST diam-diam memotong hasil query di 1000 baris tanpa error -- tabel
 * detail (skor per murid, pernyataan ortu, hasil MI) gampang melewati itu untuk sekolah
 * menengah-besar. builderFn menerima (from, to) dan HARUS mengembalikan query builder yang
 * belum di-await (bukan builder bekas), supaya tiap halaman benar-benar request baru.
 */
export async function fetchAllRows(builderFn, pageSize = PAGE_SIZE) {
  let all = [];
  let from = 0;
  for (;;) {
    const { data, error } = await builderFn(from, from + pageSize - 1);
    if (error) return { data: null, error };
    const chunk = data || [];
    all = all.concat(chunk);
    if (chunk.length < pageSize) break;
    from += pageSize;
  }
  return { data: all, error: null };
}

/**
 * Ambil pesan error ASLI dari body respons Edge Function. supabase.functions.invoke cuma
 * kasih pesan generik "non-2xx status code"; error sebenarnya (mis. kolom belum ada,
 * Gemini balas JSON tak valid) ada di body JSON {error: "..."} yang tersimpan di
 * error.context (sebuah Response). Baca itu supaya toast/pesan gagal menampilkan penyebab
 * nyata, bukan cuma "non-2xx status code".
 */
export async function edgeErrorDetail(error, fallback) {
  try {
    const ctx = error?.context;
    if (ctx && typeof ctx.json === 'function') {
      const body = await ctx.json();
      if (body?.error) return body.error;
    } else if (ctx && typeof ctx.text === 'function') {
      const t = await ctx.text();
      if (t) return t;
    }
  } catch { /* body tidak bisa dibaca, pakai fallback */ }
  return error?.message || fallback;
}
