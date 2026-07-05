import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { withAspekColor, latestPeriode } from "./karakterMeta";

async function fetchAspekConfig(sekolahId) {
  const { data } = await supabase
    .from("karakter_aspek_config")
    .select("aspek_kode, aspek_label, urutan")
    .eq("sekolah_id", sekolahId)
    .order("urutan", { ascending: true });
  return withAspekColor(data || []);
}

async function fetchIndikatorConfig(sekolahId) {
  const { data } = await supabase
    .from("karakter_indikator_config")
    .select("aspek_kode, indikator_kode, indikator_label, urutan")
    .eq("sekolah_id", sekolahId)
    .order("urutan", { ascending: true });
  return data || [];
}

/** Wali Kelas: satu (atau beberapa) kelas dari session.cakupan. */
export function useKarakterWaliKelas(session) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const kelasList = Array.isArray(session.cakupan) ? session.cakupan.filter(Boolean) : [];
  const kelasKey = kelasList.join("|");

  useEffect(() => {
    let alive = true;

    async function run() {
      if (kelasList.length === 0) {
        setState({ loading: false, error: "Kelas belum ditentukan untuk akun ini (profiles.cakupan kosong).", data: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      const [aspek, indikator, summaryRes, sekolahSummaryRes, skorRes, skorIndRes, ortuRes, briefingRes, tlRes] = await Promise.all([
        fetchAspekConfig(session.school_id),
        fetchIndikatorConfig(session.school_id),
        supabase
          .from("karakter_summary")
          .select("scope_id, periode_id, ringkasan")
          .eq("sekolah_id", session.school_id)
          .eq("scope", "kelas")
          .in("scope_id", kelasList),
        supabase
          .from("karakter_summary")
          .select("periode_id, ringkasan")
          .eq("sekolah_id", session.school_id)
          .eq("scope", "sekolah")
          .eq("scope_id", session.school_id),
        supabase
          .from("karakter_skor")
          .select("kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList),
        supabase
          .from("karakter_skor_indikator")
          .select("kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList),
        supabase
          .from("karakter_pernyataan_ortu")
          .select("kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, dukungan_dibutuhkan, hal_disyukuri")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList),
        supabase
          .from("briefing")
          .select("teks, sumber, periode_id")
          .eq("sekolah_id", session.school_id)
          .eq("modul", "karakter")
          .eq("scope", "kelas")
          .in("scope_id", kelasList)
          .eq("status", "disetujui"),
        supabase
          .from("tindak_lanjut")
          .select("id, action, trigger_desc, priority, periode_id, gambaran, langkah_terpilih")
          .eq("sekolah_id", session.school_id)
          .eq("modul", "karakter")
          .eq("scope", "kelas")
          .in("scope_id", kelasList)
          .eq("status", "disetujui"),
      ]);

      if (!alive) return;

      const err = summaryRes.error || skorRes.error || skorIndRes.error || ortuRes.error;
      if (err) { setState({ loading: false, error: err.message, data: null }); return; }

      const periode = latestPeriode(summaryRes.data || []) || latestPeriode(skorRes.data || []);
      const sekolahSummaryAtPeriode = (sekolahSummaryRes.data || []).find((r) => r.periode_id === periode)
        || (sekolahSummaryRes.data || [])[0] || null;

      setState({
        loading: false,
        error: null,
        data: {
          periode,
          kelasList,
          aspek,
          indikator,
          summary: (summaryRes.data || []).filter((r) => r.periode_id === periode),
          sekolahSummary: sekolahSummaryAtPeriode,
          skor: (skorRes.data || []).filter((r) => r.periode_id === periode),
          skorIndikator: (skorIndRes.data || []).filter((r) => r.periode_id === periode),
          pernyataan: (ortuRes.data || []).filter((r) => r.periode_id === periode),
          briefing: (briefingRes.data || [])[0] || null,
          tindakLanjut: tlRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.school_id, kelasKey]);

  return state;
}

/**
 * Kepala Sekolah: seluruh sekolahnya, level sekolah + jenjang + kelas.
 * periodeId (opsional): periode_id yang sedang dipilih di PeriodPicker header. Semua tabel
 * di-fetch SEKALI penuh (semua periode), lalu diiris ulang di sisi klien tiap periodeId
 * berubah — tidak perlu fetch ulang ke Supabase tiap ganti periode.
 */
export function useKarakterKepsek(session, periodeId) {
  const [state, setState] = useState({ loading: true, error: null, raw: null });

  useEffect(() => {
    let alive = true;
    const sekolahId = session.school_id;

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));

      const [aspek, summaryRes, briefingRes, tlRes, ortuRes] = await Promise.all([
        fetchAspekConfig(sekolahId),
        supabase
          .from("karakter_summary")
          .select("scope, scope_id, periode_id, ringkasan")
          .eq("sekolah_id", sekolahId)
          .in("scope", ["sekolah", "jenjang", "kelas"]),
        supabase
          .from("briefing")
          .select("teks, sumber, periode_id")
          .eq("sekolah_id", sekolahId)
          .eq("modul", "karakter")
          .eq("scope", "sekolah")
          .eq("scope_id", sekolahId)
          .eq("status", "disetujui"),
        supabase
          .from("tindak_lanjut")
          .select("id, scope, scope_id, action, trigger_desc, priority, periode_id, gambaran, langkah_terpilih")
          .eq("sekolah_id", sekolahId)
          .eq("modul", "karakter")
          .in("scope", ["sekolah", "kelas"])
          .eq("status", "disetujui"),
        supabase
          .from("karakter_pernyataan_ortu")
          .select("kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri")
          .eq("sekolah_id", sekolahId),
      ]);

      if (!alive) return;
      if (summaryRes.error) { setState({ loading: false, error: summaryRes.error.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          aspek,
          summaryRows: summaryRes.data || [],
          briefingRows: briefingRes.data || [],
          tlRows: tlRes.data || [],
          ortuRows: ortuRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [session.school_id]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { aspek, summaryRows, briefingRows, tlRows, ortuRows } = state.raw;

    const availablePeriods = Array.from(new Set(summaryRows.map((r) => r.periode_id))).sort((a, b) => (a > b ? -1 : 1));
    const periode = periodeId && summaryRows.some((r) => r.periode_id === periodeId) ? periodeId : latestPeriode(summaryRows);
    const atPeriode = summaryRows.filter((r) => r.periode_id === periode);

    return {
      periode,
      availablePeriods,
      aspek,
      sekolah: atPeriode.find((r) => r.scope === "sekolah") || null,
      jenjang: atPeriode.filter((r) => r.scope === "jenjang"),
      kelas: atPeriode.filter((r) => r.scope === "kelas"),
      briefing: briefingRows.find((r) => r.periode_id === periode) || null,
      tindakLanjut: tlRows.filter((r) => r.periode_id === periode),
      pernyataan: ortuRows.filter((r) => r.periode_id === periode),
    };
  }, [state.raw, periodeId]);

  return { loading: state.loading, error: state.error, data };
}

/** Yayasan: banyak sekolah, dikelompokkan lewat schools.yayasan_id. */
export function useKarakterYayasan(session) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const yayasanId = Array.isArray(session.cakupan) ? session.cakupan[0] : null;

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!yayasanId) {
        setState({ loading: false, error: "Cakupan yayasan belum ditentukan untuk akun ini.", data: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      const { data: sekolahRows, error: sekolahErr } = await supabase
        .from("schools")
        .select("id, nama")
        .eq("yayasan_id", yayasanId)
        .eq("aktif", true);

      if (!alive) return;
      if (sekolahErr) { setState({ loading: false, error: sekolahErr.message, data: null }); return; }

      const sekolahIds = (sekolahRows || []).map((s) => s.id);
      if (sekolahIds.length === 0) {
        setState({ loading: false, error: null, data: { sekolahList: [], summary: [], briefing: [], tindakLanjut: [], pernyataan: [] } });
        return;
      }

      const [summaryRes, briefingRes, tlRes, aspekRes, ortuRes] = await Promise.all([
        supabase
          .from("karakter_summary")
          .select("sekolah_id, periode_id, ringkasan")
          .eq("scope", "sekolah")
          .in("sekolah_id", sekolahIds),
        supabase
          .from("briefing")
          .select("sekolah_id, teks, sumber, periode_id")
          .eq("modul", "karakter")
          .eq("scope", "sekolah")
          .in("sekolah_id", sekolahIds)
          .eq("status", "disetujui"),
        supabase
          .from("tindak_lanjut")
          .select("id, sekolah_id, action, trigger_desc, priority, periode_id, gambaran, langkah_terpilih")
          .eq("modul", "karakter")
          .eq("scope", "sekolah")
          .in("sekolah_id", sekolahIds)
          .eq("status", "disetujui"),
        supabase
          .from("karakter_aspek_config")
          .select("sekolah_id, aspek_kode, aspek_label, urutan")
          .in("sekolah_id", sekolahIds)
          .order("urutan", { ascending: true }),
        supabase
          .from("karakter_pernyataan_ortu")
          .select("sekolah_id, kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri")
          .in("sekolah_id", sekolahIds),
      ]);

      if (!alive) return;
      if (summaryRes.error) { setState({ loading: false, error: summaryRes.error.message, data: null }); return; }

      const rows = summaryRes.data || [];
      const periode = latestPeriode(rows);

      const aspekBySekolah = {};
      (aspekRes.data || []).forEach((a) => {
        (aspekBySekolah[a.sekolah_id] ||= []).push(a);
      });
      Object.keys(aspekBySekolah).forEach((id) => {
        aspekBySekolah[id] = withAspekColor(aspekBySekolah[id]);
      });

      setState({
        loading: false,
        error: null,
        data: {
          periode,
          sekolahList: sekolahRows || [],
          summary: rows.filter((r) => r.periode_id === periode),
          aspekBySekolah,
          briefing: briefingRes.data || [],
          tindakLanjut: tlRes.data || [],
          pernyataan: (ortuRes.data || []).filter((r) => r.periode_id === periode),
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [yayasanId]);

  return state;
}
