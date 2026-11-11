// Klien akses demo yang tersambung ke Supabase. Seluruh aturannya di demoAturan.js; berkas ini
// cuma menyambungkan fungsi RPC, Edge Function, dan sessionStorage. Pemeriksaan kode dan sesi
// terjadi di fungsi demo_* di Postgres (migration 20261111100000) dan Edge Function demo-masuk,
// bukan di sini.
import { supabase } from "../../lib/supabase";
import { buatKlienDemo } from "./demoAturan";

function penyimpananSesi() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

// supabase.functions.invoke membalas galat generik untuk status non-2xx; status yang sebenarnya
// (expired, belum_diatur, dst) ada di badan JSON balasan, jadi badan itu yang diteruskan.
async function panggilFungsi(nama, body) {
  const { data, error } = await supabase.functions.invoke(nama, { body });
  if (!error) return { data, error: null };
  try {
    const isi = await error.context?.json?.();
    if (isi && typeof isi === "object") return { data: isi, error: null };
  } catch {
    // Badan tidak terbaca: perlakukan sebagai gangguan server.
  }
  return { data: null, error };
}

export const klienDemo = buatKlienDemo({
  rpc: (nama, argumen) => supabase.rpc(nama, argumen),
  fungsi: panggilFungsi,
  penyimpanan: penyimpananSesi(),
});
