import LwLaporanPage from "./LwLaporanPage";
import { LW_LAPORAN_CONTOH } from "./lw.mock";

/** LwPreview -- pratinjau lepas-login (QA visual) modul Wellbeing Guru memakai lw.mock.js,
 * padanan ScAgregatPreview/PaAgregatPreview. Bukan bagian alur produk. */
export default function LwPreview() {
  return <LwLaporanPage laporan={LW_LAPORAN_CONTOH} />;
}
