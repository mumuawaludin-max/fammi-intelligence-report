import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

function latestPeriode(rows) {
  if (!rows || rows.length === 0) return null;
  return rows.reduce((max, r) => (!max || r.periode_id > max ? r.periode_id : max), null);
}

/**
 * target_role tindak_lanjut untuk tiap peran -- tanpa ini, tab Ringkasan membaca SEMUA
 * tindak_lanjut disetujui di scope-nya tanpa peduli untuk peran siapa baris itu ditulis
 * (mis. Wali Kelas ikut melihat kartu level Kepala Sekolah kelasnya sendiri), beda dengan
 * halaman modul (useKarakterData.js) yang sudah memfilter ini. briefing TIDAK punya kolom
 * target_role (dicek dari skema), jadi cuma dipakai untuk query tindak_lanjut.
 */
function targetRoleForPeran(peran) {
  switch (peran) {
    case "WaliKelas": return "wali_kelas";
    case "KepalaSekolah":
    case "WakilKepalaSekolah": return "kepala_sekolah";
    case "OrangTua": return "orang_tua";
    case "Yayasan": return "yayasan";
    default: return null;
  }
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
  const [state, setState] = useState({ loading: true, error: null, schoolName: null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] });
  const modules = session?.modules || [];
  const modulesKey = modules.join("|");

  useEffect(() => {
    let alive = true;

    // Ambil parameter { data, error } LANGSUNG dari respons Supabase (bukan cuma .data yang
    // sudah diekstrak pemanggil), supaya error briefing/tindak_lanjut selalu ketahuan di sini,
    // dari cabang Yayasan maupun cabang peran lain, tanpa bergantung pada closure luar.
    // schoolLogoUrl SENGAJA null di cabang Yayasan (lihat pemanggilnya) -- Yayasan menaungi
    // banyak sekolah sekaligus, tidak ada "logo satu sekolah" yang representatif untuk tampilan
    // lintas-sekolah itu. Logo cuma ditampilkan untuk peran yang scope-nya persis satu sekolah.
    function finalizeState(briefingRes, tlRes, schoolName, schoolLogoUrl = null) {
      const err = briefingRes?.error || tlRes?.error;
      if (err) { setState({ loading: false, error: err.message, schoolName, schoolLogoUrl, briefing: null, tindakLanjut: [] }); return; }

      const briefingRows = briefingRes?.data || [];
      const tlRows = tlRes?.data || [];
      // Periode TERBARU SESUNGGUHNYA di antara keduanya -- dulu "||" berarti briefing yang
      // punya baris apa pun (walau untuk periode lama) selalu menang, tindak_lanjut baru tidak
      // pernah dicek kalau briefing kebetulan tidak kosong, jadi tindak lanjut yang lebih baru
      // bisa hilang total dari tab Ringkasan.
      const periode = [latestPeriode(briefingRows), latestPeriode(tlRows)]
        .filter(Boolean)
        .sort((a, b) => (a > b ? -1 : 1))[0] || null;
      const briefingAtPeriode = briefingRows.filter((r) => r.periode_id === periode);
      const best = briefingAtPeriode.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] || null;

      const priorityRank = { tinggi: 0, sedang: 1, rendah: 2 };
      const tindakLanjut = tlRows
        .filter((r) => r.periode_id === periode)
        .sort((a, b) => (priorityRank[a.priority] ?? 3) - (priorityRank[b.priority] ?? 3));

      setState({ loading: false, error: null, schoolName, schoolLogoUrl, briefing: best, tindakLanjut, periode });
    }

    async function run() {
      if (!session || session.peran === "Siswa" || session.peran === "AdminFammi") {
        setState({ loading: false, error: null, schoolName: null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] });
        return;
      }
      setState((s) => ({ ...s, loading: true, error: null }));

      if (session.peran === "Yayasan") {
        const yayasanId = Array.isArray(session.cakupan) ? session.cakupan[0] : null;

        // Akun Yayasan single-sekolah (session.school_id terisi, cakupan lintas-sekolah tidak
        // pernah diatur -- mis. akun modul Perilaku Anak yang dibuat langsung terikat ke satu
        // sekolah) diperlakukan sama seperti Kepsek: satu sekolah, bukan agregat lintas yayasan.
        // SEBELUMNYA akun jenis ini selalu gagal dengan "Cakupan yayasan belum ditentukan",
        // padahal bukan error sungguhan -- schoolName/logo Header ikut kosong karenanya.
        if (!yayasanId) {
          if (!session.school_id) {
            setState({ loading: false, error: "Cakupan yayasan belum ditentukan untuk akun ini.", schoolName: null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] });
            return;
          }
          const schoolRes = await supabase.from("schools").select("nama, logo_url").eq("id", session.school_id).maybeSingle();
          if (!alive) return;
          if (schoolRes.error) { setState({ loading: false, error: schoolRes.error.message, schoolName: null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] }); return; }

          const [briefingRes, tlRes] = await Promise.all([
            supabase.from("briefing").select("sekolah_id, modul, teks, sumber, periode_id, created_at")
              .eq("sekolah_id", session.school_id).eq("scope", "sekolah").eq("status", "disetujui"),
            supabase.from("tindak_lanjut").select("id, sekolah_id, modul, action, trigger_desc, priority, periode_id, created_at")
              .eq("sekolah_id", session.school_id).eq("scope", "sekolah").eq("status", "disetujui")
              .eq("target_role", targetRoleForPeran(session.peran)),
          ]);
          if (!alive) return;
          finalizeState(briefingRes, tlRes, schoolRes.data?.nama || null, schoolRes.data?.logo_url || null);
          return;
        }
        const { data: schoolRows, error: schoolErr } = await supabase
          .from("schools").select("id, nama, yayasan_id").eq("yayasan_id", yayasanId).eq("aktif", true);
        if (!alive) return;
        if (schoolErr) { setState({ loading: false, error: schoolErr.message, schoolName: null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] }); return; }

        const yayasanRes = await supabase.from("yayasan").select("nama").eq("id", yayasanId).maybeSingle();
        if (!alive) return;
        if (yayasanRes.error) { setState({ loading: false, error: yayasanRes.error.message, schoolName: null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] }); return; }

        const sekolahIds = (schoolRows || []).map((s) => s.id);
        if (sekolahIds.length === 0) {
          setState({ loading: false, error: null, schoolName: yayasanRes.data?.nama || null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] });
          return;
        }

        const [briefingRes, tlRes] = await Promise.all([
          supabase.from("briefing").select("sekolah_id, modul, teks, sumber, periode_id, created_at")
            .in("sekolah_id", sekolahIds).eq("scope", "sekolah").eq("status", "disetujui"),
          supabase.from("tindak_lanjut").select("id, sekolah_id, modul, action, trigger_desc, priority, periode_id, created_at")
            .in("sekolah_id", sekolahIds).eq("scope", "sekolah").eq("status", "disetujui")
            .eq("target_role", targetRoleForPeran(session.peran)),
        ]);
        if (!alive) return;
        finalizeState(briefingRes, tlRes, yayasanRes.data?.nama || null);
        return;
      }

      const scoped = scopeForRole(session);
      if (!scoped) {
        setState({ loading: false, error: null, schoolName: null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] });
        return;
      }
      if (modules.length === 0) {
        const nameRes = await supabase.from("schools").select("nama, logo_url").eq("id", session.school_id).maybeSingle();
        if (!alive) return;
        if (nameRes.error) { setState({ loading: false, error: nameRes.error.message, schoolName: null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] }); return; }
        setState({ loading: false, error: null, schoolName: nameRes.data?.nama || null, schoolLogoUrl: nameRes.data?.logo_url || null, briefing: null, tindakLanjut: [] });
        return;
      }

      const [schoolRes, briefingRes, tlRes] = await Promise.all([
        supabase.from("schools").select("nama, logo_url").eq("id", session.school_id).maybeSingle(),
        supabase.from("briefing").select("modul, teks, sumber, periode_id, created_at")
          .eq("sekolah_id", session.school_id).eq("scope", scoped.scope).in("scope_id", scoped.scopeIds)
          .in("modul", modules).eq("status", "disetujui"),
        supabase.from("tindak_lanjut").select("id, modul, action, trigger_desc, priority, periode_id, created_at")
          .eq("sekolah_id", session.school_id).eq("scope", scoped.scope).in("scope_id", scoped.scopeIds)
          .in("modul", modules).eq("status", "disetujui")
          .eq("target_role", targetRoleForPeran(session.peran)),
      ]);
      if (!alive) return;
      if (schoolRes.error) { setState({ loading: false, error: schoolRes.error.message, schoolName: null, schoolLogoUrl: null, briefing: null, tindakLanjut: [] }); return; }
      finalizeState(briefingRes, tlRes, schoolRes.data?.nama || null, schoolRes.data?.logo_url || null);
    }

    run();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.school_id, session?.peran, session?.murid_id, modulesKey]);

  return state;
}
