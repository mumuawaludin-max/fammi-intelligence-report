import SampleTag from "../../components/SampleTag";
import CwLaporanAgregatPage from "./CwLaporanAgregatPage";
import { MOCK_LAPORAN_AGREGAT_CW } from "./cw.mock";
import styles from "./CwChartsPreview.module.css";

/**
 * CwAgregatPreview -- preview lepas-login untuk CwLaporanAgregatPage dengan data dummy,
 * dibuka lewat http://localhost:5173/?preview=cw-agregat
 * BUKAN bagian dari alur produk -- jangan link-kan dari navigasi mana pun.
 */
export default function CwAgregatPreview() {
  return (
    <div className={`${styles.page} ${styles.pageWide}`}>
      <p className={styles.pageTitle}>CW Laporan Agregat Preview</p>
      <p className={styles.pageNote}>
        Data dummy dari cw.mock.ts (MOCK_LAPORAN_AGREGAT_CW). Halaman ini cuma untuk QA visual,
        tidak dipakai di produk.
      </p>
      <SampleTag />
      <CwLaporanAgregatPage laporan={MOCK_LAPORAN_AGREGAT_CW} />
    </div>
  );
}
