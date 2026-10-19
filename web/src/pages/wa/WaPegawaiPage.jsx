// Shell pegawai modul Wellbeing Assessment: laporan dirinya sendiri, mobile-first, di luar
// Header/NavBar desktop (padanan SwPegawaiPage). Dialog sambutan wajib ada di dalam
// WaPegawaiLaporan, jadi tetap muncul sebelum apa pun terbaca.

import { useWaData } from "./data/useWaData";
import { usePegawaiUmpanBalik } from "./data/useWaUmpanBalik";
import WaPegawaiLaporan from "./WaPegawaiLaporan";
import { WaStatus } from "./WaStatus";

export default function WaPegawaiPage({ session, onLogout, onKeScreening }) {
  const { peran, loading, error, dataset } = useWaData(session);
  const akses = { peran, individuId: session?.wa_individu_id || null, nama: session?.nama || "" };
  const umpanBalik = usePegawaiUmpanBalik({ datasetId: dataset?.datasetId, individuId: akses.individuId, sekolahId: dataset?.meta?.sekolahId });
  return (
    <WaStatus peran={peran === "pegawai" ? peran : null} loading={loading} error={error} dataset={dataset} kosong={dataset && !dataset.individu.length}>
      <WaPegawaiLaporan dataset={dataset} akses={akses} onLogout={onLogout} onKeScreening={onKeScreening} umpanBalik={umpanBalik} />
    </WaStatus>
  );
}
