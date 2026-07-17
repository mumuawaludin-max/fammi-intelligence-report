import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { withAspekColor, latestPeriode } from "./karakterMeta";

const PAGE_SIZE = 1000; // batas default PostgREST per panggilan -- lewat ini, data terpotong diam-diam.

/**
 * Tabel per-murid/per-aspek (karakter_skor, karakter_skor_indikator, karakter_pernyataan_ortu)
 * gampang lewat 1000 baris begitu sekolah punya banyak kelas/periode. queryFactory harus
 * mengembalikan query builder BARU tiap dipanggil (builder Supabase sekali pakai per .range()).
 */
async function fetchAllRows(queryFactory) {
  let from = 0;
  let all = [];
  for (;;) {
    const { data, error } = await queryFactory().range(from, from + PAGE_SIZE - 1);
    if (error) return { data: all, error };
    const rows = data || [];
    all = all.concat(rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return { data: all, error: null };
}

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

/**
 * Wali Kelas: satu (atau beberapa) kelas dari session.cakupan.
 * periodeId (opsional): periode_id yang sedang dipilih di PeriodPicker header. Semua tabel
 * di-fetch SEKALI penuh (semua periode), lalu diiris ulang di sisi klien tiap periodeId
 * berubah — mirip useKarakterKepsek, supaya filter periode di topbar benar-benar mengubah data.
 */
export function useKarakterWaliKelas(session, periodeId) {
  const [state, setState] = useState({ loading: true, error: null, raw: null });
  const kelasList = Array.isArray(session.cakupan) ? session.cakupan.filter(Boolean) : [];
  const kelasKey = kelasList.join("|");

  useEffect(() => {
    let alive = true;

    async function run() {
      if (kelasList.length === 0) {
        setState({ loading: false, error: "Kelas belum ditentukan untuk akun ini (profiles.cakupan kosong).", raw: null });
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
        fetchAllRows(() => supabase
          .from("karakter_skor")
          .select("kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)),
        fetchAllRows(() => supabase
          .from("karakter_skor_indikator")
          .select("kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)),
        fetchAllRows(() => supabase
          .from("karakter_pernyataan_ortu")
          .select("kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)),
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
          .select("id, action, trigger_desc, priority, periode_id, gambaran, langkah_terpilih, term, type, fokus, icon, title, teaser, mengapa_data, mengapa_perspektif, manfaat, konkret")
          .eq("sekolah_id", session.school_id)
          .eq("modul", "karakter")
          .eq("scope", "kelas")
          .in("scope_id", kelasList)
          .eq("target_role", "wali_kelas")
          .eq("status", "disetujui"),
      ]);

      if (!alive) return;

      const err = summaryRes.error || skorRes.error || skorIndRes.error || ortuRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          kelasList,
          aspek,
          indikator,
          summaryRows: summaryRes.data || [],
          sekolahSummaryRows: sekolahSummaryRes.data || [],
          skorRows: skorRes.data || [],
          skorIndRows: skorIndRes.data || [],
          ortuRows: ortuRes.data || [],
          briefingRows: briefingRes.data || [],
          tlRows: tlRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.school_id, kelasKey]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { kelasList: kl, aspek, indikator, summaryRows, sekolahSummaryRows, skorRows, skorIndRows, ortuRows, briefingRows, tlRows } = state.raw;

    const availablePeriods = Array.from(new Set(summaryRows.map((r) => r.periode_id))).sort((a, b) => (a > b ? -1 : 1));
    const periode = periodeId && summaryRows.some((r) => r.periode_id === periodeId)
      ? periodeId
      : (latestPeriode(summaryRows) || latestPeriode(skorRows));
    const sekolahSummary = sekolahSummaryRows.find((r) => r.periode_id === periode) || sekolahSummaryRows[0] || null;

    return {
      periode,
      availablePeriods,
      kelasList: kl,
      aspek,
      indikator,
      summary: summaryRows.filter((r) => r.periode_id === periode),
      sekolahSummary,
      skor: skorRows.filter((r) => r.periode_id === periode),
      skorIndikator: skorIndRows.filter((r) => r.periode_id === periode),
      pernyataan: ortuRows.filter((r) => r.periode_id === periode),
      briefing: briefingRows.find((r) => r.periode_id === periode) || null,
      tindakLanjut: tlRows.filter((r) => r.periode_id === periode),
    };
  }, [state.raw, periodeId]);

  return { loading: state.loading, error: state.error, data };
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
          .select("id, scope, scope_id, action, trigger_desc, priority, periode_id, gambaran, langkah_terpilih, term, type, fokus, icon, title, teaser, mengapa_data, mengapa_perspektif, manfaat, konkret")
          .eq("sekolah_id", sekolahId)
          .eq("modul", "karakter")
          .eq("scope", "sekolah")
          .eq("target_role", "kepala_sekolah")
          .eq("status", "disetujui"),
        fetchAllRows(() => supabase
          .from("karakter_pernyataan_ortu")
          .select("kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri")
          .eq("sekolah_id", sekolahId)),
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

/**
 * Yayasan: banyak sekolah, dikelompokkan lewat schools.yayasan_id.
 * periodeId (opsional): periode yang dipilih di PeriodPicker header. Fetch sekali penuh
 * (semua periode) lalu diiris ulang di klien tiap periodeId berubah, sama seperti Kepsek/WaliKelas.
 */
export function useKarakterYayasan(session, periodeId) {
  const [state, setState] = useState({ loading: true, error: null, raw: null });
  const yayasanId = Array.isArray(session.cakupan) ? session.cakupan[0] : null;

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!yayasanId) {
        setState({ loading: false, error: "Cakupan yayasan belum ditentukan untuk akun ini.", raw: null });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      const { data: sekolahRows, error: sekolahErr } = await supabase
        .from("schools")
        .select("id, nama")
        .eq("yayasan_id", yayasanId)
        .eq("aktif", true);

      if (!alive) return;
      if (sekolahErr) { setState({ loading: false, error: sekolahErr.message, raw: null }); return; }

      const sekolahIds = (sekolahRows || []).map((s) => s.id);
      if (sekolahIds.length === 0) {
        setState({ loading: false, error: null, raw: { sekolahRows: [], summaryRows: [], briefingRows: [], tlRows: [], aspekBySekolah: {}, ortuRows: [], skorIndRows: [], indikatorConfigRows: [] } });
        return;
      }

      const [summaryRes, briefingRes, tlRes, aspekRes, ortuRes, skorIndRes, indikatorRes] = await Promise.all([
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
          .select("id, sekolah_id, action, trigger_desc, priority, periode_id, gambaran, langkah_terpilih, term, type, fokus, icon, title, teaser, mengapa_data, mengapa_perspektif, manfaat, konkret")
          .eq("modul", "karakter")
          .eq("scope", "sekolah")
          .in("sekolah_id", sekolahIds)
          .eq("target_role", "yayasan")
          .eq("status", "disetujui"),
        supabase
          .from("karakter_aspek_config")
          .select("sekolah_id, aspek_kode, aspek_label, urutan")
          .in("sekolah_id", sekolahIds)
          .order("urutan", { ascending: true }),
        fetchAllRows(() => supabase
          .from("karakter_pernyataan_ortu")
          .select("sekolah_id, kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri")
          .in("sekolah_id", sekolahIds)),
        // Indikator per sekolah diagregat dari skor murid (summary sekolah tidak menyimpan top5 indikator).
        fetchAllRows(() => supabase
          .from("karakter_skor_indikator")
          .select("sekolah_id, periode_id, aspek_kode, indikator_kode, skor")
          .in("sekolah_id", sekolahIds)),
        supabase
          .from("karakter_indikator_config")
          .select("sekolah_id, aspek_kode, indikator_kode, indikator_label")
          .in("sekolah_id", sekolahIds),
      ]);

      if (!alive) return;
      if (summaryRes.error) { setState({ loading: false, error: summaryRes.error.message, raw: null }); return; }

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
        raw: {
          sekolahRows: sekolahRows || [],
          summaryRows: summaryRes.data || [],
          briefingRows: briefingRes.data || [],
          tlRows: tlRes.data || [],
          aspekBySekolah,
          ortuRows: ortuRes.data || [],
          skorIndRows: skorIndRes.data || [],
          indikatorConfigRows: indikatorRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [yayasanId]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { sekolahRows, summaryRows, briefingRows, tlRows, aspekBySekolah, ortuRows, skorIndRows, indikatorConfigRows } = state.raw;

    const availablePeriods = Array.from(new Set(summaryRows.map((r) => r.periode_id))).sort((a, b) => (a > b ? -1 : 1));
    const periode = periodeId && summaryRows.some((r) => r.periode_id === periodeId) ? periodeId : latestPeriode(summaryRows);

    // Label indikator per sekolah, dari config custom tiap sekolah.
    const indikatorLabelBySekolah = {};
    (indikatorConfigRows || []).forEach((it) => {
      (indikatorLabelBySekolah[it.sekolah_id] ||= {})[`${it.aspek_kode}_${it.indikator_kode}`] = it.indikator_label;
    });

    // Rata-rata ketercapaian tiap indikator per sekolah (agregat dari skor murid periode berjalan).
    // Bentuk: { [sekolah_id]: [{ label, value }] }, sudah dirata-ratakan lintas murid sekolah itu.
    const indikatorBySekolah = {};
    const acc = {}; // sekolah_id -> key -> {sum, n}
    (skorIndRows || []).forEach((r) => {
      if (r.periode_id !== periode || r.skor == null) return;
      const key = `${r.aspek_kode}_${r.indikator_kode}`;
      const bucket = (acc[r.sekolah_id] ||= {});
      const cell = (bucket[key] ||= { sum: 0, n: 0 });
      cell.sum += r.skor; cell.n += 1;
    });
    Object.entries(acc).forEach(([sid, bucket]) => {
      const labels = indikatorLabelBySekolah[sid] || {};
      indikatorBySekolah[sid] = Object.entries(bucket).map(([key, v]) => ({
        label: labels[key] || key,
        value: Math.round(v.sum / v.n),
      }));
    });

    return {
      periode,
      availablePeriods,
      sekolahList: sekolahRows,
      summary: summaryRows.filter((r) => r.periode_id === periode),
      aspekBySekolah,
      indikatorBySekolah,
      briefing: briefingRows.filter((r) => r.periode_id === periode),
      tindakLanjut: tlRows.filter((r) => r.periode_id === periode),
      pernyataan: ortuRows.filter((r) => r.periode_id === periode),
    };
  }, [state.raw, periodeId]);

  return { loading: state.loading, error: state.error, data };
}
