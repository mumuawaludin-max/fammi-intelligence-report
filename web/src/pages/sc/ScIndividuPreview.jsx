import SampleTag from "../../components/SampleTag";
import ScLaporanIndividuPage from "./ScLaporanIndividuPage";
import { MOCK_LAPORAN_INDIVIDU_SC } from "./sc.mock";
import styles from "./ScChartsPreview.module.css";

/**
 * ScIndividuPreview -- halaman preview lepas-login untuk mengecek ScLaporanIndividuPage utuh
 * dengan 3 responden dummy, dibuka lewat http://localhost:5173/?preview=sc-individu
 * BUKAN bagian dari alur produk -- jangan link-kan dari navigasi mana pun.
 */
export default function ScIndividuPreview() {
  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>SC Laporan Individu Preview</p>
      <p className={styles.pageNote}>
        3 responden dari sc.mock.ts, dirender lewat ScLaporanIndividuPage utuh. Halaman ini cuma
        untuk QA visual, tidak dipakai di produk.
      </p>

      {MOCK_LAPORAN_INDIVIDU_SC.map((laporan) => (
        <section className={styles.responden} key={laporan.meta.responden_id}>
          <h2 className={styles.respondenNama}>
            {laporan.meta.nama_responden}
            <span className={styles.respondenJabatan}> · {laporan.meta.peran_kerja}</span>
          </h2>
          <SampleTag />
          <ScLaporanIndividuPage laporan={laporan} viewerIsOwner />
        </section>
      ))}
    </div>
  );
}
