// Titik masuk produksi modul Screening Awal Wellbeing (yayasan, kepala unit, Human Capital).
// Pegawai memakai SwPegawaiPage (shell sendiri, mobile-first).

import { useSwLaporan } from "./data/useSwLaporan";
import SwLaporan from "./SwLaporan";
import { SwStatus } from "./SwStatus";

export default function SwPage({ session }) {
  const { peran, loading, error, dataset, store, akses } = useSwLaporan(session);
  return (
    <SwStatus peran={peran} loading={loading} error={error} dataset={dataset}>
      <SwLaporan dataset={dataset} akses={akses} store={store} />
    </SwStatus>
  );
}
