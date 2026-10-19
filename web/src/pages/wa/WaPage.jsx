// Titik masuk produksi modul Wellbeing Assessment untuk Human Capital (dirender App.jsx saat tab
// "wa" aktif). Pegawai memakai WaPegawaiPage (shell ponsel sendiri).

import { useLayoutEffect, useState } from "react";
import { useWaData } from "./data/useWaData";
import { useRingkasanUmpanBalik } from "./data/useWaUmpanBalik";
import WaLaporan from "./WaLaporan";
import { WaStatus } from "./WaStatus";

/** Tinggi header aplikasi yang menempel di atas, supaya bilah tab modul menempel tepat di bawahnya. */
function useTinggiHeader() {
  const [tinggi, setTinggi] = useState(0);
  useLayoutEffect(() => {
    const el = document.querySelector("header");
    if (!el) return undefined;
    const ukur = () => setTinggi(Math.round(el.getBoundingClientRect().height));
    ukur();
    const pengamat = new ResizeObserver(ukur);
    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);
  return tinggi;
}

export default function WaPage({ session }) {
  const { peran, loading, error, dataset } = useWaData(session);
  const tinggiHeader = useTinggiHeader();
  const umpanBalik = useRingkasanUmpanBalik(peran === "hc" ? dataset?.datasetId : null);
  const akses = { peran, nama: session?.nama || "" };
  return (
    <WaStatus peran={peran === "hc" ? peran : null} loading={loading} error={error} dataset={dataset} kosong={dataset && !dataset.kelompok.length}>
      <WaLaporan dataset={dataset} akses={akses} tabAtas={tinggiHeader} umpanBalik={umpanBalik} />
    </WaStatus>
  );
}
