import { LwReveal } from "./LwReveal";
import tokens from "./lwTokens.module.css";
import styles from "./LwTopSkill.module.css";

function Bar({ nilai, tone }) {
  return (
    <span className={styles.track}>
      <span className={`${styles.fill} ${styles[`fill_${tone}`]}`} style={{ width: `${Math.max(0, Math.min(100, nilai))}%` }} />
    </span>
  );
}

/** LwTopSkill -- padanan bagian "C" section Kesiapan Memimpin: dua daftar berdampingan, indikator
 * LEAD dengan skor rata-rata organisasi tertinggi (kekuatan) dan terendah (perlu penguatan),
 * padanan langsung "TOP 5 Skill" / "TOP 3 Skill Yang Perlu Penguatan" di dokumen sumber. */
export function LwTopSkill({ sectionIndex, title, subtitle, topSkill, skillGap }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <LwReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </LwReveal>

      <div className={styles.grid}>
        <LwReveal className={styles.card} delay={0.04}>
          <h3>Kekuatan Utama</h3>
          <ul className={styles.list}>
            {topSkill.map((s, i) => (
              <li key={i}>
                <div className={styles.rowHead}>
                  <span>{s.indikator}</span>
                  <b>{s.nilai.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</b>
                </div>
                <Bar nilai={s.nilai} tone="aligned" />
              </li>
            ))}
          </ul>
        </LwReveal>

        <LwReveal className={styles.card} delay={0.08}>
          <h3>Perlu Penguatan atau Pelatihan Lanjutan</h3>
          <ul className={styles.list}>
            {skillGap.map((s, i) => (
              <li key={i}>
                <div className={styles.rowHead}>
                  <span>{s.indikator}</span>
                  <b>{s.nilai.toLocaleString("id-ID", { maximumFractionDigits: 2 })}</b>
                </div>
                <Bar nilai={s.nilai} tone="attention" />
              </li>
            ))}
          </ul>
        </LwReveal>
      </div>
      <p className={styles.hint}>Skor indikator dari 0 sampai 100, rata-rata seluruh kandidat di lembaga ini.</p>
    </section>
  );
}
