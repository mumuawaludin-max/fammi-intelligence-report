import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Daftar periode_id ("YYYY-MM") yang benar-benar punya data karakter_summary, urut dari
 * terbaru, supaya PeriodPicker di Header tidak menampilkan bulan yang datanya belum ada.
 * Cakupannya mengikuti peran: Wali Kelas → periode kelas-kelasnya (scope "kelas"),
 * Yayasan → gabungan periode semua sekolah di bawah yayasannya, peran lain → sekolahnya.
 */
export function useAvailablePeriods(session) {
  const [periods, setPeriods] = useState([]);
  const cakupanKey = Array.isArray(session?.cakupan) ? session.cakupan.join("|") : "";

  useEffect(() => {
    let alive = true;
    const setUnique = (rows) => {
      if (!alive) return;
      setPeriods(Array.from(new Set((rows || []).map((r) => r.periode_id))).sort((a, b) => (a > b ? -1 : 1)));
    };

    const peran = session?.peran;
    const cakupan = Array.isArray(session?.cakupan) ? session.cakupan.filter(Boolean) : [];

    if (peran === "Yayasan") {
      // Yayasan tidak punya school_id sendiri: ambil sekolah di bawah yayasannya dulu.
      const yayasanId = cakupan[0];
      if (!yayasanId) { setPeriods([]); return () => { alive = false; }; }
      (async () => {
        const { data: sekolahRows } = await supabase
          .from("schools").select("id").eq("yayasan_id", yayasanId).eq("aktif", true);
        const ids = (sekolahRows || []).map((s) => s.id);
        if (!alive || ids.length === 0) { if (alive) setPeriods([]); return; }
        const { data } = await supabase
          .from("karakter_summary").select("periode_id").eq("scope", "sekolah").in("sekolah_id", ids);
        setUnique(data);
      })();
      return () => { alive = false; };
    }

    const schoolId = session?.school_id;
    const hasKarakter = (session?.modules || []).includes("karakter");
    if (!schoolId || !hasKarakter) { setPeriods([]); return () => { alive = false; }; }

    const isWaliKelas = peran === "WaliKelas" && cakupan.length > 0;
    let q = supabase.from("karakter_summary").select("periode_id").eq("sekolah_id", schoolId);
    q = isWaliKelas ? q.eq("scope", "kelas").in("scope_id", cakupan) : q.eq("scope", "sekolah");
    q.then(({ data }) => setUnique(data));

    return () => { alive = false; };
  }, [session?.school_id, session?.peran, cakupanKey]);

  return periods;
}
