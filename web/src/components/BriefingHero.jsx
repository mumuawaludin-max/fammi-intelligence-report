import styles from "./BriefingHero.module.css";
import SampleTag from "./SampleTag";

export default function BriefingHero({
  teks,
  periode,
  tipePeriode,
  sumber = [],
  isSample = false,
}) {
  return (
    <div className={styles.hero}>
      <div className={styles.top}>
        <div className={styles.periodRow}>
          <span className={styles.periodPill}>{tipePeriode}</span>
          <span className={styles.periodText}>{periode}</span>
          {isSample && <SampleTag />}
        </div>
      </div>

      <p className={styles.teks}>{teks}</p>

      {sumber.length > 0 && (
        <div className={styles.sumber}>
          <span className={styles.sumberLabel}>Data dari</span>
          {sumber.map((s) => (
            <span key={s} className={styles.sumberTag}>{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}
