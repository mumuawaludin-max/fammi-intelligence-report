import { LwReveal } from "./LwReveal";
import { LwIconBadge } from "./lwIconBadge";
import tokens from "./lwTokens.module.css";
import styles from "./LwSectionSelector.module.css";

/** LwSectionSelector -- padanan ScSectionSelector/PaSectionSelector: tiga kartu gelap besar
 * (01/02/03) yang jadi filter utama tampilan di bawahnya, bukan nav sekunder. */
export function LwSectionSelector({ sections, active, onSelect, namaLembaga }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <LwReveal className={styles.heading}>
        <h1>Leadership &amp; Wellbeing Assessment {namaLembaga || "Lembaga Anda"}</h1>
        <p>Laporan terdiri dari tiga bagian utama</p>
      </LwReveal>

      <LwReveal className={styles.grid} delay={0.08}>
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
              <LwIconBadge icon={s.icon} size="lg" tone="plain" className={styles.icon} />
              <span className={styles.label}>{s.label}</span>
            </button>
          );
        })}
      </LwReveal>
    </section>
  );
}
