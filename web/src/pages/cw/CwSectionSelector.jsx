import { CwLaporanReveal } from "./CwLaporanReveal";
import { CwIconBadge } from "./cwIconBadge";
import tokens from "./cwBudayaTokens.module.css";
import styles from "./CwSectionSelector.module.css";

/**
 * CwSectionSelector -- tiga kartu gelap besar (01/02/03) yang jadi filter utama tampilan di
 * bawahnya. Struktur dan gaya mengikuti ScSectionSelector.jsx modul School Culture (versi
 * paling mutakhir, hasil restart total mengikuti wireframe-original.png), cuma beda istilah:
 * konteks CW korporat (karyawan/perusahaan), bukan sekolah/Tim guru.
 */
export function CwSectionSelector({ sections, active, onSelect, namaOrganisasi }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <CwLaporanReveal className={styles.heading}>
        <h1>Laporan Corporate Culture &amp; Wellbeing {namaOrganisasi || "Perusahaan Anda"}</h1>
        <p>Laporan ini terdiri dari tiga bagian utama</p>
      </CwLaporanReveal>

      <CwLaporanReveal className={styles.grid} delay={0.08}>
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
              <CwIconBadge icon={s.icon} size="lg" tone="plain" className={styles.icon} />
              <span className={styles.label}>{s.label}</span>
            </button>
          );
        })}
      </CwLaporanReveal>
    </section>
  );
}
