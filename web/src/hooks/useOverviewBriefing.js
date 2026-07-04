import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function latestPeriode(rows) {
  if (!rows || rows.length === 0) return null;
  return rows.reduce((max, r) => (!max || r.periode_id > max ? r.periode_id : max), null);
}

/**
 * Bikin filter { scope, scope_id[] } sesuai peran, dipakai untuk query briefing/tindak_lanjut.
 * Siswa dan AdminFammi tidak lewat hook ini (early-return di App.jsx sebelum sampai sini).
 */
function scopeForRole(session) {
  switch (session.peran) {
    case "WaliKelas": {
      const kelasList = Array.isArray(session.cakupan) ? session.cakupan.filter(Boolean) : [];
      return kelasList.length > 0 ? { scope: "kelas", scopeIds: kelasList } : null;
    }
    case "KepalaSekolah":
    case "WakilKepalaSekolah":
      return session.school_id ? { scope: "sekolah", scopeIds: [session.school_id] } : null;
    case "OrangTua":
      return session.murid_id ? { scope: "murid", scopeIds: [session.murid_id] } : null;
    default:
      return null;
  }
}

/**
 * Tab "Ringkasan" (overview, lintas modul). Baca briefing/tindak_lanjut asli sesuai peran +
 * sekolah yang login, dari modul-modul yang aktif untuk sekolah itu (session.modules).
 * Yayasan ditangani terpisah karena scope-nya lintas banyak sekolah, bukan satu scope_id.
 */
export function useOverviewBriefing(session) {
  const [state, setState] = useState({ loading: true, error: null, schoolName: null, briefing: null, tindakLanjut: [] });
  const modules = session?.modules || [];
  const modulesKey = modules.join("|");

  useEffect(() => {
    let alive = true;

    async function run() {
      if (!session || session.peran === "Siswa" || session.peran === "AdminFammi") {
        setState({ loading: false, error: null, schoolName: null, briefing: null, tindakLanjut: [] });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      if (session.peran === "Yayasan") {
        const yayasanId = Array.isArray(session.cakupan) ? session.cakupan[0] : null;
        if (!yayasanId) {
          setState({ loading: false, error: "Cakupan yayasan belum ditentukan untuk akun ini.", schoolName: null, briefing: null, tindakLanjut: [] });
          return;
        }
        const { data: schoolRows, error: schoolErr } = await supabase
          .from("schools").select("id, nama, yayasan_id").eq("yayasan_id", yayasanId).eq("aktif", true);
        if (!alive) return;
        if (schoolErr) { setState({ loading: false, error: schoolErr.message, schoolName: null, briefing: null, tindakLanjut: [] }); return; }

        const yayasanRes = await supabase.from("yayasan").select("nama").eq("id", yayasanId).maybeSingle();
        const sekolahIds = (schoolRows || []).map((s) => s.id);
        if (sekolahIds.length === 0) {
          setState({ loading: false, error: null, schoolName: yayasanRes.data?.nama || null, briefing: null, tindakLanjut: [] });
          return;
        }

        const [briefingRes, tlRes] = await Promise.all([
          supabase.from("briefing").select("sekolah_id, modul, teks, sumber, periode_id, created_at")
            .in("sekolah_id", sekolahIds).eq("scope", "sekolah").eq("status", "disetujui"),
          supabase.from("tindak_lanjut").select("id, sekolah_id, modul, action, trigger_desc, priority, periode_id, created_at")
            .in("sekolah_id", sekolahIds).eq("scope", "sekolah").eq("status", "disetujui"),
        ]);
        if (!alive) return;
        finalizeState(briefingRes.data, tlRes.data, yayasanRes.data?.nama || null);
        return;
      }

      const scoped = scopeForRole(session);
      if (!scoped) {
        setState({ loading: false, error: null, schoolName: null, briefing: null, tindakLanjut: [] });
        return;
      }
      if (modules.length === 0) {
        const nameRes = await supabase.from("schools").select("nama").eq("id", session.school_id).maybeSingle();
        if (!alive) return;
        setState({ loading: false, error: null, schoolName: nameRes.data?.nama || null, briefing: null, tindakLanjut: [] });
        return;
      }

      const [schoolRes, briefingRes, tlRes] = await Promise.all([
        supabase.from("schools").select("nama").eq("id", session.school_id).maybeSingle(),
        supabase.from("briefing").select("modul, teks, sumber, periode_id, created_at")
          .eq("sekolah_id", session.school_id).eq("scope", scoped.scope).in("scope_id", scoped.scopeIds)
          .in("modul", modules).eq("status", "disetujui"),
        supabase.from("tindak_lanjut").select("id, modul, action, trigger_desc, priority, periode_id, created_at")
          .eq("sekolah_id", session.school_id).eq("scope", scoped.scope).in("scope_id", scoped.scopeIds)
          .in("modul", modules).eq("status", "disetujui"),
      ]);
      if (!alive) return;
      finalizeState(briefingRes.data, tlRes.data, schoolRes.data?.nama || null);

      function finalizeState(briefingRows, tlRows, schoolName) {
        const err = briefingRes?.error || tlRes?.error;
        if (err) { setState({ loading: false, error: err.message, schoolName, briefing: null, tindakLanjut: [] }); return; }

        const periode = latestPeriode(briefingRows) || latestPeriode(tlRows);
        const briefingAtPeriode = (briefingRows || []).filter((r) => r.periode_id === periode);
        const best = briefingAtPeriode.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] || null;

        const priorityRank = { tinggi: 0, sedang: 1, rendah: 2 };
        const tindakLanjut = (tlRows || [])
          .filter((r) => r.periode_id === periode)
          .sort((a, b) => (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3));

        setState({ loading: false, error: null, schoolName, briefing: best, tindakLanjut, periode });
      }
    }

    run();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.school_id, session?.peran, session?.murid_id, modulesKey]);

  return state;
}
