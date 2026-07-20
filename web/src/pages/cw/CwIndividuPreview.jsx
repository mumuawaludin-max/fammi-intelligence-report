import SampleTag from "../../components/SampleTag";
import CwLaporanIndividuPage from "./CwLaporanIndividuPage";
import { MOCK_LAPORAN_INDIVIDU_CW } from "./cw.mock";
import styles from "./CwChartsPreview.module.css";

/**
 * CwIndividuPreview -- halaman preview lepas-login untuk mengecek CwLaporanIndividuPage utuh
 * (semua 6 bagian) dengan 3 responden dummy, dibuka lewat http://localhost:5173/?preview=cw-individu
 * BUKAN bagian dari alur produk -- jangan link-kan dari navigasi mana pun.
 */
export default function CwIndividuPreview() {
  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>CW Laporan Individu Preview</p>
      <p className={styles.pageNote}>
        3 responden dari cw.mock.ts, dirender lewat CwLaporanIndividuPage utuh. Halaman ini cuma
        untuk QA visual, tidak dipakai di produk.
      </p>

      {MOCK_LAPORAN_INDIVIDU_CW.map((laporan) => (
        <section className={styles.responden} key={laporan.meta.responden_id}>
          <h2 className={styles.respondenNama}>
            {laporan.meta.nama_responden}
            <span className={styles.respondenJabatan}> · {laporan.meta.jabatan}</span>
          </h2>
          <SampleTag />
          <CwLaporanIndividuPage laporan={laporan} />
        </section>
      ))}
    </div>
  );
}
