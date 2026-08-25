import { LwReveal } from "./LwReveal";
import tokens from "./lwTokens.module.css";
import styles from "./LwInsightBanner.module.css";

/**
 * LwInsightBanner -- banner emas untuk temuan yang berubah mengikuti data, padanan
 * PaInsightBanner. Return null kalau teks kosong: lebih baik hilang daripada banner kosong.
 */
export function LwInsightBanner({ teks, delay = 0 }) {
  if (!teks) return null;

  return (
    <LwReveal className={`${tokens.scope} ${styles.banner}`} delay={delay}>
      <span className={styles.ikon} aria-hidden="true">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#96690a" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 6.4L21 11l-6.6 2.6L12 20l-2.4-6.4L3 11l6.6-2.6z" />
        </svg>
      </span>
      <div>
        <p className={styles.label}>Ringkasan eksekutif</p>
        <p className={styles.teks}>{teks}</p>
      </div>
    </LwReveal>
  );
}
