import { PaReveal } from "./PaReveal";
import { PaIconBadge } from "./paIconBadge";
import tokens from "./paTokens.module.css";
import styles from "./PaInsightBanner.module.css";

/**
 * PaInsightBanner -- satu kalimat temuan yang DIHITUNG dari data yang sedang tampil (lihat
 * insightUtamaAsesmen/insightUtamaPerhatian di pa.mock.js), ditempatkan di kepala bagian 02 dan
 * 03. Sengaja dibedakan secara visual dari PaInfoBanner: aksen emas + ikon sparkle, bukan ungu +
 * ikon info, supaya pembaca membedakan "catatan baku yang selalu sama" dari "temuan yang
 * berubah mengikuti data yang sedang ditampilkan". Kalau `teks` kosong (data terlalu sedikit
 * untuk dibandingkan), banner ini tidak dirender sama sekali -- lebih baik tidak muncul daripada
 * memaksakan insight kosong.
 */
export function PaInsightBanner({ teks, delay = 0 }) {
  if (!teks) return null;

  return (
    <PaReveal className={`${tokens.scope} ${styles.banner}`} delay={delay}>
      <PaIconBadge icon="sparkle" size="sm" tone="gold" />
      <div>
        <p className={styles.label}>Insight periode ini</p>
        <p className={styles.teks}>{teks}</p>
      </div>
    </PaReveal>
  );
}
