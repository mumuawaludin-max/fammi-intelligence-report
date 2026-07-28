import { motion, useReducedMotion } from "motion/react";
import { ScLaporanReveal } from "./ScLaporanReveal";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScDimensiPerbandingan.module.css";

function formatScore(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

function statusTone(status) {
  if (status === "Selaras" || status === "Sangat Tinggi" || status === "Tinggi") return "aligned";
  if (status === "Perlu perhatian" || status === "Sangat Rendah" || status === "Rendah") return "attention";
  return "light";
}

/**
 * ScDimensiPerbandingan -- padanan bagian "01-B" wireframe-original.png: N kartu berdampingan,
 * masing-masing bar "saat ini" + bar "harapan ke depan" (kalau ada) + kotak status/gap. BUKAN
 * dumbbell chart satu skala seperti versi polished reference -- atas instruksi eksplisit pemilik
 * produk untuk kembali ke bentuk wireframe.
 *
 * `target`/`gapValue` OPSIONAL per item -- Kesejahteraan Tim tidak punya konsep "harapan staf"
 * di data (cuma nilai + kategori kualitatif, beda dari Budaya Kerja yang punya pasangan
 * mean_gambaran/mean_harapan eksplisit). Kalau target tidak ada, bar "harapan" diganti catatan
 * jujur, dan kotak bawah menampilkan KATEGORI (bukan gap) -- bukan mengarang target yang tidak
 * pernah ada di data.
 */
export function ScDimensiPerbandingan({ sectionIndex, title, subtitle, items }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </ScLaporanReveal>

      <div className={styles.grid}>
        {items.map((item, i) => {
          const tone = statusTone(item.status);
          return (
            <ScLaporanReveal className={styles.card} delay={i * 0.05} amount={0.2} key={item.key}>
              <h3>{item.label}</h3>

              <div className={styles.barRow}>
                <div className={styles.barHead}>
                  <span className={styles.barLabelCurrent}>Saat ini</span>
                  <b>{formatScore(item.current)}%</b>
                </div>
                <div className={styles.barTrack}>
                  <motion.div
                    className={styles.barFillCurrent}
                    initial={reduceMotion ? false : { width: 0 }}
                    whileInView={{ width: `${Math.max(0, Math.min(100, item.current ?? 0))}%` }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.7, delay: 0.1 + i * 0.05 }}
                  />
                </div>
              </div>

              {item.target != null ? (
                <div className={styles.barRow}>
                  <div className={styles.barHead}>
                    <span className={styles.barLabelTarget}>Harapan ke depan</span>
                    <b>{formatScore(item.target)}%</b>
                  </div>
                  <div className={styles.barTrack}>
                    <motion.div
                      className={styles.barFillTarget}
                      initial={reduceMotion ? false : { width: 0 }}
                      whileInView={{ width: `${Math.max(0, Math.min(100, item.target ?? 0))}%` }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.7, delay: 0.2 + i * 0.05 }}
                    />
                  </div>
                </div>
              ) : (
                <p className={styles.noTarget}>Harapan Tim belum tersedia untuk dimensi ini.</p>
              )}

              <div className={`${styles.statusBox} ${styles[`statusBox_${tone}`]}`}>
                {item.gapValue != null ? (
                  <>
                    <span>Gap {item.label}</span>
                    <strong>{formatScore(Math.abs(item.gapValue))}%</strong>
                  </>
                ) : (
                  <span>Kategori</span>
                )}
                {item.status && <em>{item.status}</em>}
              </div>
            </ScLaporanReveal>
          );
        })}
      </div>
    </section>
  );
}
