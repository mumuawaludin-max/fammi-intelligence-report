import { useEffect, useMemo, useState } from "react";
import { supabase, fetchAllRows } from "../../lib/supabase";
import { withAspekColor, latestPeriode } from "./karakterMeta";

/** Kembalikan { data, error } mentah (bukan array yang errornya sudah dibuang) supaya
 * pemanggil bisa ikut mengecek error-nya, bukan diam-diam dapat daftar aspek kosong. */
function queryAspekConfig(sekolahId) {
  return supabase
    .from("karakter_aspek_config")
    .select("aspek_kode, aspek_label, urutan")
    .eq("sekolah_id", sekolahId)
    .order("urutan", { ascending: true });
}

function queryIndikatorConfig(sekolahId) {
  return supabase
    .from("karakter_indikator_config")
    .select("aspek_kode, indikator_kode, indikator_label, urutan")
    .eq("sekolah_id", sekolahId)
    .order("urutan", { ascending: true });
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

      const [aspekRes, indikatorRes, summaryRes, sekolahSummaryRes, skorRes, skorIndRes, ortuRes, briefingRes, tlRes] = await Promise.all([
        queryAspekConfig(session.school_id),
        queryIndikatorConfig(session.school_id),
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
        // Detail per murid per aspek/indikator/pernyataan bisa lewat 1000 baris (batas diam-diam
        // Supabase) untuk sekolah menengah-besar, apalagi diambil semua periode sekaligus di
        // sini -- pakai fetchAllRows supaya tidak ada murid/baris yang hilang tanpa error.
        fetchAllRows((from, to) => supabase
          .from("karakter_skor")
          .select("kelas_id, murid_id, nama_murid, periode_id, aspek_kode, skor")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)
          .range(from, to)),
        fetchAllRows((from, to) => supabase
          .from("karakter_skor_indikator")
          .select("kelas_id, murid_id, nama_murid, periode_id, aspek_kode, indikator_kode, skor")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)
          .range(from, to)),
        fetchAllRows((from, to) => supabase
          .from("karakter_pernyataan_ortu")
          .select("kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri")
          .eq("sekolah_id", session.school_id)
          .in("kelas_id", kelasList)
          .range(from, to)),
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

      const err = aspekRes.error || indikatorRes.error || summaryRes.error || sekolahSummaryRes.error
        || skorRes.error || skorIndRes.error || ortuRes.error || briefingRes.error || tlRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          kelasList,
          aspek: withAspekColor(aspekRes.data || []),
          indikator: indikatorRes.data || [],
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

    // availablePeriods dan validasi periodeId TIDAK cuma dari summaryRows -- briefing/tindak
    // lanjut bisa saja sudah disetujui untuk periode yang summary-nya kebetulan belum lengkap
    // (atau sebaliknya), jangan sampai salah satu bikin konten "hilang" karena periode-nya
    // disubstitusi diam-diam ke periode lain.
    const periodeSet = new Set([
      ...summaryRows.map((r) => r.periode_id),
      ...briefingRows.map((r) => r.periode_id),
      ...tlRows.map((r) => r.periode_id),
    ]);
    const availablePeriods = Array.from(periodeSet).sort((a, b) => (a > b ? -1 : 1));
    const periode = periodeId && periodeSet.has(periodeId)
      ? periodeId
      : (latestPeriode(summaryRows) || latestPeriode(briefingRows) || latestPeriode(tlRows) || latestPeriode(skorRows));
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

      const [aspekRes, summaryRes, briefingRes, tlRes, ortuRes] = await Promise.all([
        queryAspekConfig(sekolahId),
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
        // Seluruh sekolah, semua periode, tanpa filter kelas -- kandidat kuat lewat batas 1000
        // baris diam-diam Supabase untuk sekolah menengah-besar, jadi dipaginasi penuh.
        fetchAllRows((from, to) => supabase
          .from("karakter_pernyataan_ortu")
          .select("kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri")
          .eq("sekolah_id", sekolahId)
          .range(from, to)),
      ]);

      if (!alive) return;
      const err = aspekRes.error || summaryRes.error || briefingRes.error || tlRes.error || ortuRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

      setState({
        loading: false,
        error: null,
        raw: {
          aspek: withAspekColor(aspekRes.data || []),
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

    // Lihat catatan di useKarakterWaliKelas: periode digabung dari summary + briefing +
    // tindak lanjut, bukan cuma summary.
    const periodeSet = new Set([
      ...summaryRows.map((r) => r.periode_id),
      ...briefingRows.map((r) => r.periode_id),
      ...tlRows.map((r) => r.periode_id),
    ]);
    const availablePeriods = Array.from(periodeSet).sort((a, b) => (a > b ? -1 : 1));
    const periode = periodeId && periodeSet.has(periodeId)
      ? periodeId
      : (latestPeriode(summaryRows) || latestPeriode(briefingRows) || latestPeriode(tlRows));
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
        setState({ loading: false, error: null, raw: { sekolahRows: [], summaryRows: [], briefingRows: [], tlRows: [], aspekBySekolah: {}, ortuRows: [], indikatorAvgRows: [], indikatorConfigRows: [] } });
        return;
      }

      const [summaryRes, briefingRes, tlRes, aspekRes, ortuRes, indikatorAvgRes, indikatorRes] = await Promise.all([
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
        // Lintas SEMUA sekolah yayasan, semua periode -- risiko terbesar melewati batas diam-diam
        // 1000 baris Supabase, jadi dipaginasi penuh lewat fetchAllRows.
        fetchAllRows((from, to) => supabase
          .from("karakter_pernyataan_ortu")
          .select("sekolah_id, kelas_id, murid_id, nama_murid, periode_id, pernyataan, kategori_pernyataan, emosi_anak, alasan_emosi, dukungan_dibutuhkan, dukungan_lainnya, hal_disyukuri")
          .in("sekolah_id", sekolahIds)
          .range(from, to)),
        // Indikator per sekolah, sudah dirata-rata di database lewat view
        // karakter_indikator_sekolah_avg (lihat migration 20260711150000) -- bukan lagi
        // mengambil tiap baris skor murid mentah lintas sekolah lalu diagregat di klien.
        // Tetap dipaginasi untuk jaga-jaga yayasan dengan sangat banyak sekolah/periode.
        fetchAllRows((from, to) => supabase
          .from("karakter_indikator_sekolah_avg")
          .select("sekolah_id, periode_id, aspek_kode, indikator_kode, skor")
          .in("sekolah_id", sekolahIds)
          .range(from, to)),
        supabase
          .from("karakter_indikator_config")
          .select("sekolah_id, aspek_kode, indikator_kode, indikator_label")
          .in("sekolah_id", sekolahIds),
      ]);

      if (!alive) return;
      const err = summaryRes.error || briefingRes.error || tlRes.error || aspekRes.error
        || ortuRes.error || indikatorAvgRes.error || indikatorRes.error;
      if (err) { setState({ loading: false, error: err.message, raw: null }); return; }

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
          indikatorAvgRows: indikatorAvgRes.data || [],
          indikatorConfigRows: indikatorRes.data || [],
        },
      });
    }

    run();
    return () => { alive = false; };
  }, [yayasanId]);

  const data = useMemo(() => {
    if (!state.raw) return null;
    const { sekolahRows, summaryRows, briefingRows, tlRows, aspekBySekolah, ortuRows, indikatorAvgRows, indikatorConfigRows } = state.raw;

    // Lihat catatan di useKarakterWaliKelas: periode digabung dari summary + briefing +
    // tindak lanjut, bukan cuma summary.
    const periodeSet = new Set([
      ...summaryRows.map((r) => r.periode_id),
      ...briefingRows.map((r) => r.periode_id),
      ...tlRows.map((r) => r.periode_id),
    ]);
    const availablePeriods = Array.from(periodeSet).sort((a, b) => (a > b ? -1 : 1));
    const periode = periodeId && periodeSet.has(periodeId)
      ? periodeId
      : (latestPeriode(summaryRows) || latestPeriode(briefingRows) || latestPeriode(tlRows));

    // Label indikator per sekolah, dari config custom tiap sekolah.
    const indikatorLabelBySekolah = {};
    (indikatorConfigRows || []).forEach((it) => {
      (indikatorLabelBySekolah[it.sekolah_id] ||= {})[`${it.aspek_kode}_${it.indikator_kode}`] = it.indikator_label;
    });

    // Rata-rata ketercapaian tiap indikator per sekolah -- sudah dihitung di database lewat
    // view karakter_indikator_sekolah_avg, tinggal disaring ke periode aktif dan diberi label.
    const indikatorBySekolah = {};
    (indikatorAvgRows || []).forEach((r) => {
      if (r.periode_id !== periode || r.skor == null) return;
      const labels = indikatorLabelBySekolah[r.sekolah_id] || {};
      const key = `${r.aspek_kode}_${r.indikator_kode}`;
      (indikatorBySekolah[r.sekolah_id] ||= []).push({ label: labels[key] || key, value: r.skor });
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
