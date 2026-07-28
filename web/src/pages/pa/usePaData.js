import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

/**
 * usePaData -- baca data modul Perilaku Anak dari Supabase. Pola sama dengan useScAgregat
 * (pages/sc/useScData.js): fetch lebar sekali (semua periode sekaligus, bukan per periode),
 * lalu periode/unit dipilih di useMemo tanpa perlu fetch ulang -- volume `pa_siswa`/`pa_esai`
 * untuk satu sekolah (ribuan baris untuk 1-2 periode) masih wajar untuk satu dashboard admin,
 * sepadan dengan cara sc_personal juga dibaca penuh per sekolah.
 *
 * Kembaliannya BUKAN `laporan` siap pakai -- itu tugas `rakitLaporanPa` (paAssembler.js), yang
 * dipanggil komponen setiap kali filter unit berganti, TANPA fetch ulang (data sudah di memori).
 */
export function usePaData(session, periodeId = null) {
  const sekolahId = session?.school_id;
  const [state, setState] = useState({ loading: true, error: null, raw: null });

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!sekolahId) {
        setState({ loading: false, error: null, raw: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      const [lembagaRes, siswaRes, esaiRes] = await Promise.all([
        supabase.from("pa_lembaga").select("*").eq("sekolah_id", sekolahId),
        supabase.from("pa_siswa").select("nama, kelas, unit, domain, status, skor, periode_id").eq("sekolah_id", sekolahId),
        supabase.from("pa_esai").select("kode_anonim, unit, domain, pertanyaan_kode, jawaban_pilihan, jawaban_teks, anotasi, periode_id").eq("sekolah_id", sekolahId),
      ]);

      if (!alive) return;
      const err = lembagaRes.error || siswaRes.error || esaiRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          lembagaRows: lembagaRes.data || [],
          siswaRows: siswaRes.data || [],
          esaiRows: esaiRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [sekolahId]);

  const raw = useMemo(() => {
    if (!state.raw) return null;
    const { lembagaRows, siswaRows, esaiRows } = state.raw;
    if (lembagaRows.length === 0) return null; // belum ada data diimpor sama sekali

    const availablePeriods = [...new Set(lembagaRows.map((r) => r.periode_id))].sort().reverse();
    const periode = periodeId && availablePeriods.includes(periodeId) ? periodeId : availablePeriods[0];

    return {
      periode,
      availablePeriods,
      lembagaAtPeriode: lembagaRows.filter((r) => r.periode_id === periode),
      siswaAtPeriode: siswaRows.filter((r) => r.periode_id === periode),
      esaiAtPeriode: esaiRows.filter((r) => r.periode_id === periode),
    };
  }, [state.raw, periodeId]);

  return { loading: state.loading, error: state.error, raw };
}
