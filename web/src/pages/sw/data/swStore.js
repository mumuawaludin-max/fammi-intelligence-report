// Penyimpanan yang ditulis modul Screening Awal Wellbeing: catatan tindak lanjut Human Capital
// pada Profil Pegawai. Dua implementasi dengan bentuk sama:
//   - buatStoreSupabase: produksi, lewat tabel dan RPC ber-RLS (migration 20260917100000).
//   - buatStoreMemori: halaman pratinjau berdata contoh. Hanya hidup selama tab terbuka.
// Keduanya SENGAJA tidak memakai localStorage: catatan ini menyangkut orang tertentu dan wajib
// lewat RLS.

import { supabase } from "../../../lib/supabase";

export function buatStoreSupabase({ datasetId }) {
  return {
    async bacaTinjauan(individuId) {
      const { data, error } = await supabase
        .from("sw_tinjauan")
        .select("status, peninjau, tanggal, catatan, diubah_pada")
        .eq("dataset_id", datasetId)
        .eq("individu_id", individuId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
    async simpanTinjauan(individuId, isi) {
      const { data, error } = await supabase.rpc("sw_simpan_tinjauan", {
        p_dataset: datasetId,
        p_individu: individuId,
        p_status: isi.status,
        p_peninjau: isi.peninjau || null,
        p_tanggal: isi.tanggal || null,
        p_catatan: isi.catatan || null,
      });
      if (error) throw new Error(error.message);
      return data;
    },
  };
}

export function buatStoreMemori() {
  const tinjauan = new Map();
  const tunda = (v) => new Promise((r) => setTimeout(() => r(v), 120));
  return {
    async bacaTinjauan(individuId) {
      return tunda(tinjauan.get(individuId) || null);
    },
    async simpanTinjauan(individuId, isi) {
      const baris = { ...isi, diubah_pada: new Date().toISOString() };
      tinjauan.set(individuId, baris);
      return tunda(baris);
    },
  };
}
