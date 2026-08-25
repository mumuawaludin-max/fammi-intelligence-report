import { LwReveal } from "./LwReveal";
import { LwIconBadge } from "./lwIconBadge";
import tokens from "./lwTokens.module.css";
import styles from "./LwCeritaInspiratif.module.css";

/** LwCeritaInspiratif -- padanan ScBudayaCeritaPegawai: kutipan pengalaman leadership guru,
 * padanan langsung lampiran "Cerita Pengalaman Terbaik Leadership dari Para Guru" di dokumen
 * sumber. Setiap kartu mengutip SATU pengalaman, diberi atribusi nama guru dan unitnya. */
export function LwCeritaInspiratif({ sectionIndex, title, subtitle, items }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <LwReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </LwReveal>

      <div className={styles.grid}>
        {items.map((item, i) => (
          <LwReveal className={styles.card} delay={i * 0.04} amount={0.15} key={item.key}>
            <LwIconBadge icon="quote" size="sm" tone="gold" />
            <p className={styles.tema}>{item.tema}</p>
            <p className={styles.isi}>{item.isi}</p>
            {item.bulletPoin?.length > 0 && (
              <ul className={styles.bulletList}>
                {item.bulletPoin.map((b, idx) => <li key={idx}>{b}</li>)}
              </ul>
            )}
            <div className={styles.footer}>
              <span className={styles.nama}>{item.nama}</span>
              <span className={styles.unit}>{item.unit}</span>
            </div>
          </LwReveal>
        ))}
      </div>
    </section>
  );
}
