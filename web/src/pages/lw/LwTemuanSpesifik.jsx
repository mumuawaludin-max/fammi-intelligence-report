import { LwReveal } from "./LwReveal";
import tokens from "./lwTokens.module.css";
import styles from "./LwTemuanSpesifik.module.css";

/** LwTemuanSpesifik -- padanan bagian "C" section Kesehatan Mental & Wellbeing: temuan spesifik
 * per dimensi, padanan langsung "Temuan Spesifik Kondisi Guru yang Perlu Diwaspadai" di dokumen
 * sumber. Dimensi tanpa temuan (Relasi Positif, Optimalisasi Potensi Diri) dirender sebagai
 * catatan jujur, bukan dikosongkan begitu saja -- konsisten dengan pola ScDimensiTindakLanjut. */
export function LwTemuanSpesifik({ sectionIndex, title, subtitle, items }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`} id="lw-temuan-spesifik">
      <LwReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </LwReveal>

      <div className={styles.grid}>
        {items.map((item, i) => (
          <LwReveal className={styles.card} delay={i * 0.05} amount={0.15} key={item.dimensi}>
            <h3>{item.dimensi}</h3>
            {item.temuan?.length > 0 ? (
              <ul className={styles.temuanList}>
                {item.temuan.map((t, idx) => (
                  <li key={idx}>
                    <p className={styles.pernyataan}>{t.pernyataan}</p>
                    <span className={styles.persenTag}>{t.persen}% · {t.jumlah} orang</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.gapNote}>Tidak ada temuan spesifik untuk dimensi ini -- seluruh kandidat berkategori Baik.</p>
            )}
          </LwReveal>
        ))}
      </div>
    </section>
  );
}
