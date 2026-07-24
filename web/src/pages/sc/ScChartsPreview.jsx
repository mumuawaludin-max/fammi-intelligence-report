import ScRadarChart from "./ScRadarChart";
import ScBarList from "./ScBarList";
import { MOCK_LAPORAN_INDIVIDU_SC } from "./sc.mock";
import styles from "./ScChartsPreview.module.css";

/**
 * ScChartsPreview -- halaman preview lepas-login untuk mengecek ScRadarChart dan ScBarList
 * secara visual dengan data dummy, dibuka lewat http://localhost:5173/?preview=sc-charts
 * BUKAN bagian dari alur produk -- jangan link-kan dari navigasi mana pun.
 */
export default function ScChartsPreview() {
  return (
    <div className={styles.page}>
      <p className={styles.pageTitle}>SC Charts Preview</p>
      <p className={styles.pageNote}>
        Data dummy dari sc.mock.ts, {MOCK_LAPORAN_INDIVIDU_SC.length} responden. Halaman ini cuma
        untuk QA visual, tidak dipakai di produk.
      </p>

      {MOCK_LAPORAN_INDIVIDU_SC.map((laporan) => (
        <section className={styles.responden} key={laporan.meta.responden_id}>
          <h2 className={styles.respondenNama}>
            {laporan.meta.nama_responden}
            <span className={styles.respondenJabatan}> · {laporan.meta.peran_kerja}</span>
          </h2>

          <div className={styles.grid}>
            <div className={styles.card}>
              <p className={styles.cardTitle}>Radar Budaya (bagian_budaya.chart_data)</p>
              <div className={styles.radarWrap}>
                <ScRadarChart data={laporan.bagian_budaya.chart_data} size={260} />
              </div>
            </div>

            <div className={styles.card}>
              <p className={styles.cardTitle}>Kesejahteraan (bagian_kesejahteraan.chart_data)</p>
              <p className={styles.cardSub}>
                Indeks {laporan.bagian_kesejahteraan.indeks} · {laporan.bagian_kesejahteraan.kategori}
              </p>
              <ScBarList items={laporan.bagian_kesejahteraan.chart_data} />
            </div>

            <div className={styles.card}>
              <p className={styles.cardTitle}>Profil Organisasi (bagian_profil_organisasi.chart_data)</p>
              <p className={styles.cardSub}>6 dimensi -- BARU, tidak ada di modul CW korporat</p>
              <ScBarList items={laporan.bagian_profil_organisasi.chart_data} />
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
