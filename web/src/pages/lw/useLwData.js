import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { rakitLaporanLw } from "./lwAssembler";

/**
 * useLwAgregat -- baca data Leadership & Wellbeing Assessment satu sekolah dari Supabase,
 * lalu rakit lewat rakitLaporanLw. Satu-satunya periode yang ada untuk modul ini saat ini
 * ("2025-07"), jadi TIDAK ada PeriodPicker/filter periode -- lihat catatan padanan di
 * useScAgregat soal Manajemen yang juga tidak menampilkan PeriodPicker.
 */
export function useLwAgregat(session) {
  const [state, setState] = useState({ loading: true, error: null, raw: null });
  const sekolahId = session.school_id;

  useEffect(() => {
    let alive = true;

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));

      const [sekolahRes, lembagaRes, personalRes, tlRes, briefingRes] = await Promise.all([
        supabase.from("schools").select("nama").eq("id", sekolahId).maybeSingle(),
        supabase
          .from("lw_lembaga")
          .select("periode_id, unit, lead_distribusi, lead_aspek, lead_top_skill, lead_skill_gap, protek_distribusi, protek_dimensi, protek_temuan_spesifik")
          .eq("sekolah_id", sekolahId)
          .is("unit", null),
        supabase
          .from("lw_personal")
          .select("id, periode_id, unit, nama, is_kepsek_saat_ini, kesiapan_memimpin_skor, kesiapan_memimpin_kategori, kondisi_psikologis_skor, kondisi_psikologis_kategori, kondisi_psikologis_label, lead_aspek, protek_dimensi, narasi_pengalaman, cerita_terbaik")
          .eq("sekolah_id", sekolahId),
        supabase
          .from("tindak_lanjut")
          .select("id, periode_id, dimensi, title, teaser, mengapa_data, manfaat, hal_diwaspadai")
          .eq("sekolah_id", sekolahId)
          .eq("modul", "lw")
          .eq("scope", "sekolah")
          .eq("scope_id", sekolahId)
          .eq("status", "disetujui"),
        supabase
          .from("briefing")
          .select("teks, periode_id")
          .eq("sekolah_id", sekolahId)
          .eq("modul", "lw")
          .eq("scope", "sekolah")
          .eq("scope_id", sekolahId)
          .eq("status", "disetujui")
          .maybeSingle(),
      ]);

      if (!alive) return;
      const err = sekolahRes.error || lembagaRes.error || personalRes.error || tlRes.error || briefingRes.error;
      if (err) { setState({ loading: false, error: err.message, laporan: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          sekolahNama: sekolahRes.data?.nama || sekolahId,
          lembagaRow: lembagaRes.data?.[0] || null,
          personalRows: personalRes.data || [],
          tlRows: tlRes.data || [],
          briefingRow: briefingRes.data || null,
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [sekolahId]);

  const laporan = useMemo(() => (state.raw ? rakitLaporanLw(state.raw) : null), [state.raw]);

  return { loading: state.loading, error: state.error, laporan };
}
