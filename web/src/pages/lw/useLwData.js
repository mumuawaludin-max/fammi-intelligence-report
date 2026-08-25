import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { rakitLaporanLw } from "./lwAssembler";

/**
 * useLwLaporan -- baca seluruh data Wellbeing Guru satu sekolah dari Supabase, lalu rakit
 * lewat rakitLaporanLw. Seluruh periode ditarik sekali di awal (jumlahnya kecil: 15 baris
 * lembaga dan 60 baris personal untuk empat jenjang), pemilihan periode dilakukan di memori
 * tanpa fetch ulang -- pola yang sama dengan useScAgregat dan usePaData.
 */
export function useLwLaporan(session) {
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
          .select("periode_id, unit, jumlah_guru, indeks, protek_distribusi, protek_dimensi, protek_temuan_spesifik, narasi")
          .eq("sekolah_id", sekolahId),
        supabase
          .from("lw_personal")
          .select("id, periode_id, unit, nama, is_kepsek_saat_ini, skor_total, kategori_total, protek_dimensi, catatan, langkah, refleksi")
          .eq("sekolah_id", sekolahId),
        supabase
          .from("tindak_lanjut")
          .select("id, periode_id, type, dimensi, title, teaser, mengapa_data, manfaat, hal_diwaspadai")
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
          .eq("status", "disetujui"),
      ]);

      if (!alive) return;
      const err = sekolahRes.error || lembagaRes.error || personalRes.error || tlRes.error || briefingRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          sekolahNama: sekolahRes.data?.nama || sekolahId,
          lembagaRows: lembagaRes.data || [],
          personalRows: personalRes.data || [],
          tlRows: tlRes.data || [],
          briefingRows: briefingRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [sekolahId]);

  const laporan = useMemo(() => (state.raw ? rakitLaporanLw(state.raw) : null), [state.raw]);

  return { loading: state.loading, error: state.error, laporan };
}
