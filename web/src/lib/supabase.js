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
 * detail (skor per murid, pernyataan ortu, hasil MI, testimoni) gampang melewati itu untuk
 * sekolah menengah-besar atau seluruh yayasan. builderFn menerima (from, to) dan HARUS
 * mengembalikan query builder yang belum di-await (bukan builder bekas), supaya tiap halaman
 * benar-benar request baru.
 *
 * Halaman ditembak BERKELOMPOK secara paralel, bukan satu-satu berurutan. Diukur pada dashboard
 * YPT (2026-08-28): tabel testimoni 14 ribuan baris makan 14-15 permintaan sekuensial, tiap
 * permintaan menunggu balasan sebelumnya lebih dulu -- pada RTT 150-300ms itu 2-4 detik cuma
 * dari latensi jaringan yang ditumpuk seri, sebelum Postgres sempat dihitung. Dengan concurrency
 * 4, jumlah bolak-balik jaringan turun jadi seperlima.
 *
 * Halaman pertama TETAP ditembak sendirian sebelum yang lain menyusul berkelompok. Alasannya:
 * mayoritas pemanggil fetchAllRows di aplikasi ini (daftar sekolah, satu periode Survey Kepuasan,
 * dst) datanya muat dalam satu halaman, dan menembakkan `concurrency` permintaan sekaligus untuk
 * kasus itu cuma memboroskan tiga per empat permintaan yang pasti kembali kosong. Baru begitu
 * halaman pertama penuh (berarti kemungkinan besar ada lagi), sisanya ditembak paralel.
 */
export async function fetchAllRows(builderFn, pageSize = PAGE_SIZE, concurrency = 4) {
  const pertama = await builderFn(0, pageSize - 1);
  if (pertama.error) return { data: null, error: pertama.error };

  let all = pertama.data || [];
  if (all.length < pageSize) return { data: all, error: null };

  let from = pageSize;
  for (;;) {
    const awalHalaman = Array.from({ length: concurrency }, (_, i) => from + i * pageSize);
    // eslint-disable-next-line no-await-in-loop -- kelompok ini memang harus selesai lebih dulu
    // sebelum tahu apakah kelompok berikutnya masih perlu ditembak.
    const hasil = await Promise.all(awalHalaman.map((f) => builderFn(f, f + pageSize - 1)));

    let selesai = false;
    for (const { data, error } of hasil) {
      if (error) return { data: null, error };
      const chunk = data || [];
      all = all.concat(chunk);
      // Begitu satu halaman dalam kelompok ini kembali kurang dari penuh, itu halaman terakhir.
      // Halaman sesudahnya di kelompok yang sama pasti kosong (offset yang sudah lewat total
      // baris selalu membalas array kosong, bukan galat), jadi sisa hasil kelompok ini aman
      // dilewati tanpa memeriksanya satu per satu.
      if (chunk.length < pageSize) { selesai = true; break; }
    }
    if (selesai) break;
    from += concurrency * pageSize;
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
