import { LwReveal } from "./LwReveal";
import { LwIconBadge } from "./lwIconBadge";
import tokens from "./lwTokens.module.css";
import styles from "./LwInsightBanner.module.css";

/**
 * LwInsightBanner -- banner emas untuk insight yang berubah mengikuti data, salinan lokal
 * PaInsightBanner (pa/PaInsightBanner.jsx). Return null kalau teks kosong -- lebih baik hilang
 * daripada banner kosong.
 */
export function LwInsightBanner({ teks, delay = 0 }) {
  if (!teks) return null;

  return (
    <LwReveal className={`${tokens.scope} ${styles.banner}`} delay={delay}>
      <LwIconBadge icon="sparkle" size="sm" tone="gold" />
      <div>
        <p className={styles.label}>Insight periode ini</p>
        <p className={styles.teks}>{teks}</p>
      </div>
    </LwReveal>
  );
}
