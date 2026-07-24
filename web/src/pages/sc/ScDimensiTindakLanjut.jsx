import { ScLaporanReveal } from "./ScLaporanReveal";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScDimensiTindakLanjut.module.css";

/**
 * ScDimensiTindakLanjut -- padanan bagian "01-C" wireframe-original.png: N kartu berdampingan
 * (Fokus yang Disarankan / Lakukan Tiga Langkah / Indikator Keberhasilan / Hal yang Perlu
 * Diwaspadai), BUKAN tab-satu-dimensi seperti versi polished reference. Field yang genuinely
 * data gap (indicators/warnings, dan phases/focus untuk dimensi yang tidak punya tindak_lanjut
 * yang cocok) dirender sebagai catatan jujur, TIDAK dikarang.
 */
export function ScDimensiTindakLanjut({ sectionIndex, title, subtitle, items, id }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`} id={id}>
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </ScLaporanReveal>

      <div className={styles.grid}>
        {items.map((item, i) => (
          <ScLaporanReveal className={styles.card} delay={i * 0.05} amount={0.15} key={item.key}>
            <h3>{item.label}</h3>

            <div className={styles.block}>
              <p className={styles.blockTitle}>Fokus yang Disarankan</p>
              <p className={styles.blockText}>{item.focus || "Belum ada fokus spesifik untuk dimensi ini pada periode ini."}</p>
            </div>

            <div className={styles.block}>
              <p className={styles.blockTitle}>
                {item.steps?.length > 0 ? `Lakukan ${item.steps.length} Langkah` : "Langkah yang Disarankan"}
              </p>
              {item.steps?.length > 0 ? (
                <ol className={styles.stepList}>
                  {item.steps.map((s, idx) => (
                    <li key={idx}>{s.aksi}</li>
                  ))}
                </ol>
              ) : (
                <p className={styles.gapNote}>Rencana langkah belum tersedia untuk dimensi ini pada periode ini.</p>
              )}
            </div>

            <div className={styles.block}>
              <p className={styles.blockTitle}>Indikator Keberhasilan</p>
              {item.indicators?.length > 0 ? (
                <ol className={styles.stepList}>
                  {item.indicators.map((ind, idx) => (
                    <li key={idx}>{ind.detail ? `${ind.title}: ${ind.detail}` : ind.title}</li>
                  ))}
                </ol>
              ) : (
                <p className={styles.gapNote}>Indikator keberhasilan belum ditetapkan untuk dimensi ini.</p>
              )}
            </div>

            <div className={styles.block}>
              <p className={styles.blockTitle}>Hal yang Perlu Diwaspadai</p>
              {item.warnings?.length > 0 ? (
                <div className={styles.warningText}>
                  {item.warnings.map((w, idx) => <p key={idx}>{w}</p>)}
                </div>
              ) : (
                <p className={styles.gapNote}>Belum ada catatan risiko untuk dimensi ini.</p>
              )}
            </div>
          </ScLaporanReveal>
        ))}
      </div>
    </section>
  );
}
