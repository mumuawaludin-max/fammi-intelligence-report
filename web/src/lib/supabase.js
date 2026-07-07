import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hypzmczwpigkyomzgjdb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5cHptY3p3cGlna3lvbXpnamRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI4MjU4MDgsImV4cCI6MjA5ODQwMTgwOH0.MxTMWmhfIwHZ-w4nqQnOQNji69NnjTmY1poN6-74KVk";

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
