import { useState } from "react";
import LwLaporanPage from "./LwLaporanPage";
import { LwLaporanIndividuPage } from "./LwLaporanIndividuPage";
import { LW_LAPORAN_CONTOH } from "./lw.mock";

/** LwPreview -- pratinjau lepas-login (QA visual) modul Leadership & Wellbeing memakai
 * lw.mock.js, padanan ScAgregatPreview/PaAgregatPreview. Bukan bagian alur produk. */
export default function LwPreview() {
  const [kandidatId, setKandidatId] = useState(null);
  const laporan = LW_LAPORAN_CONTOH;

  if (kandidatId && laporan.personalById[kandidatId]) {
    return <LwLaporanIndividuPage personal={laporan.personalById[kandidatId]} onBack={() => setKandidatId(null)} />;
  }

  return <LwLaporanPage laporan={laporan} onSelectKandidat={setKandidatId} />;
}
