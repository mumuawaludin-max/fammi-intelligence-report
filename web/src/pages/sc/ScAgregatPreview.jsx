import SampleTag from "../../components/SampleTag";
import ScLaporanAgregatPage from "./ScLaporanAgregatPage";
import { MOCK_LAPORAN_AGREGAT_SC } from "./sc.mock";
import styles from "./ScChartsPreview.module.css";

/**
 * ScAgregatPreview -- preview lepas-login untuk ScLaporanAgregatPage dengan data dummy,
 * dibuka lewat http://localhost:5173/?preview=sc-agregat
 * BUKAN bagian dari alur produk -- jangan link-kan dari navigasi mana pun.
 */
export default function ScAgregatPreview() {
  return (
    <div className={`${styles.page} ${styles.pageWide}`}>
      <p className={styles.pageTitle}>SC Laporan Agregat Preview</p>
      <p className={styles.pageNote}>
        Data dummy dari sc.mock.ts (MOCK_LAPORAN_AGREGAT_SC). Halaman ini cuma untuk QA visual,
        tidak dipakai di produk.
      </p>
      <SampleTag />
      <ScLaporanAgregatPage laporan={MOCK_LAPORAN_AGREGAT_SC} />
    </div>
  );
}
