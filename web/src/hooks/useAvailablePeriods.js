import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

/**
 * Daftar periode_id ("YYYY-MM") yang benar-benar punya data karakter_summary
 * (scope sekolah) untuk sekolah yang login, urut dari terbaru. Dipakai supaya
 * PeriodPicker di Header tidak menampilkan bulan yang datanya belum ada.
 */
export function useAvailablePeriods(session) {
  const [periods, setPeriods] = useState([]);

  useEffect(() => {
    const schoolId = session?.school_id;
    const hasKarakter = (session?.modules || []).includes("karakter");
    if (!schoolId || !hasKarakter) {
      setPeriods([]);
      return;
    }
    let alive = true;

    supabase
      .from("karakter_summary")
      .select("periode_id")
      .eq("sekolah_id", schoolId)
      .eq("scope", "sekolah")
      .then(({ data }) => {
        if (!alive) return;
        const unique = Array.from(new Set((data || []).map((r) => r.periode_id))).sort((a, b) => (a > b ? -1 : 1));
        setPeriods(unique);
      });

    return () => { alive = false; };
  }, [session?.school_id]);

  return periods;
}
