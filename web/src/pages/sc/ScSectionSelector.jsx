import { ScLaporanReveal } from "./ScLaporanReveal";
import { ScIconBadge } from "./scIconBadge";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScSectionSelector.module.css";

/**
 * ScSectionSelector -- padanan wireframe-original.png (design-references/), BUKAN
 * ReportNavigation.tsx yang di-polish (nav strip tipis) -- atas instruksi eksplisit pemilik
 * produk untuk kembali ke bentuk wireframe: tiga kartu gelap besar (01/02/03) yang jadi filter
 * utama tampilan di bawahnya, bukan nav sekunder.
 */
export function ScSectionSelector({ sections, active, onSelect }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.heading}>
        <h1>Laporan School Culture Lembaga Anda</h1>
        <p>
          Laporan School Culture
          <br />
          terdiri dari tiga bagian utama
        </p>
      </ScLaporanReveal>

      <ScLaporanReveal className={styles.grid} delay={0.08}>
        {sections.map((s) => {
          const isActive = active === s.key;
          return (
            <button
              key={s.key}
              type="button"
              className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
              aria-pressed={isActive}
              onClick={() => onSelect(s.key)}
            >
              <span className={styles.number}>{s.number}</span>
              <ScIconBadge icon={s.icon} size="lg" tone="plain" className={styles.icon} />
              <span className={styles.label}>{s.label}</span>
            </button>
          );
        })}
      </ScLaporanReveal>
    </section>
  );
}
