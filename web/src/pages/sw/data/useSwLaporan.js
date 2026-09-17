// Pembungkus jalur baca produksi: dataset, penyimpanan Supabase, dan identitas akses peran.

import { useMemo } from "react";
import { peranSw } from "../lib/swAturan";
import { useSwData } from "./useSwData";
import { buatStoreSupabase } from "./swStore";

export function useSwLaporan(session) {
  const peran = peranSw(session);
  const { loading, error, dataset } = useSwData(session);
  const datasetId = dataset?.datasetId || null;
  const store = useMemo(() => (datasetId ? buatStoreSupabase({ datasetId }) : null), [datasetId]);
  const akses = useMemo(() => ({
    peran,
    unitId: session?.sw_unit_id || null,
    individuId: session?.sw_individu_id || null,
    nama: session?.nama || "",
  }), [peran, session?.sw_unit_id, session?.sw_individu_id, session?.nama]);
  return { peran, loading, error, dataset, store, akses };
}
