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
  const unitBinaan = dataset?.unitBinaan;
  const akses = useMemo(() => ({
    peran,
    unitId: session?.sw_unit_id || null,
    // Pimpinan dengan unit binaan melihat semua unit itu; kepala unit biasa cuma unitnya.
    unitIds: unitBinaan?.length ? unitBinaan : null,
    individuId: session?.sw_individu_id || null,
    nama: session?.nama || "",
  }), [peran, session?.sw_unit_id, session?.sw_individu_id, session?.nama, unitBinaan]);
  return { peran, loading, error, dataset, store, akses };
}
