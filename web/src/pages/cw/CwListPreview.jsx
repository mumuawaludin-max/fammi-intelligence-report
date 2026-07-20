import SampleTag from "../../components/SampleTag";
import CwRespondenListPage from "./CwRespondenListPage";
import { MOCK_LAPORAN_INDIVIDU_CW } from "./cw.mock";
import styles from "./CwChartsPreview.module.css";

/**
 * CwListPreview -- preview lepas-login untuk CwRespondenListPage (klik satu baris untuk buka
 * dialog laporan individu), dibuka lewat http://localhost:5173/?preview=cw-list
 * BUKAN bagian dari alur produk -- jangan link-kan dari navigasi mana pun.
 */
export default function CwListPreview() {
  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>CW Daftar Responden Preview</p>
      <p className={styles.pageNote}>
        3 responden dari cw.mock.ts. Klik satu baris untuk buka laporan individunya di dialog.
        Halaman ini cuma untuk QA visual, tidak dipakai di produk.
      </p>
      <SampleTag />
      <CwRespondenListPage respondenList={MOCK_LAPORAN_INDIVIDU_CW} />
    </div>
  );
}
