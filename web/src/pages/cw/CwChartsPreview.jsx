import CultureRadarChart from "./CultureRadarChart";
import WellbeingBarChart from "./WellbeingBarChart";
import { MOCK_LAPORAN_INDIVIDU_CW } from "./cw.mock";
import styles from "./CwChartsPreview.module.css";

/**
 * CwChartsPreview -- halaman preview lepas-login untuk mengecek CultureRadarChart dan
 * WellbeingBarChart secara visual dengan data dummy, sebelum dirakit ke laporan individu
 * sungguhan (langkah berikutnya). Project ini tidak pakai Storybook, jadi preview ini dibuka
 * lewat query param di URL dev server: http://localhost:5173/?preview=cw-charts
 *
 * BUKAN bagian dari alur produk -- jangan link-kan dari navigasi mana pun.
 */
export default function CwChartsPreview() {
  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>CW Charts Preview</p>
      <p className={styles.pageNote}>
        Data dummy dari cw.mock.ts, {MOCK_LAPORAN_INDIVIDU_CW.length} responden. Halaman ini
        cuma untuk QA visual, tidak dipakai di produk.
      </p>

      {MOCK_LAPORAN_INDIVIDU_CW.map((laporan) => (
        <section className={styles.responden} key={laporan.meta.responden_id}>
          <h2 className={styles.respondenNama}>
            {laporan.meta.nama_responden}
            <span className={styles.respondenJabatan}> · {laporan.meta.jabatan}</span>
          </h2>

          <div className={styles.grid}>
            <div className={styles.card}>
              <p className={styles.cardTitle}>Radar Budaya (bagian_budaya.chart_data)</p>
              <div className={styles.radarWrap}>
                <CultureRadarChart data={laporan.bagian_budaya.chart_data} size={260} />
              </div>
            </div>

            <div className={styles.card}>
              <p className={styles.cardTitle}>Kesejahteraan (bagian_kesejahteraan.chart_data)</p>
              <p className={styles.cardSub}>
                Indeks {laporan.bagian_kesejahteraan.indeks} · {laporan.bagian_kesejahteraan.kategori}
              </p>
              <WellbeingBarChart items={laporan.bagian_kesejahteraan.chart_data} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
