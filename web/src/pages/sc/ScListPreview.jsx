import SampleTag from "../../components/SampleTag";
import ScRespondenListPage from "./ScRespondenListPage";
import { MOCK_LAPORAN_INDIVIDU_SC } from "./sc.mock";
import styles from "./ScChartsPreview.module.css";

/**
 * ScListPreview -- preview lepas-login untuk ScRespondenListPage (klik satu baris untuk buka
 * dialog laporan individu), dibuka lewat http://localhost:5173/?preview=sc-list
 * BUKAN bagian dari alur produk -- jangan link-kan dari navigasi mana pun.
 */
export default function ScListPreview() {
  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>SC Daftar Responden Preview</p>
      <p className={styles.pageNote}>
        3 responden dari sc.mock.ts. Klik satu baris untuk buka laporan individunya di dialog.
        Halaman ini cuma untuk QA visual, tidak dipakai di produk.
      </p>
      <SampleTag />
      <ScRespondenListPage respondenList={MOCK_LAPORAN_INDIVIDU_SC} />
    </div>
  );
}
