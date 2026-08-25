import { LwReveal } from "./LwReveal";
import tokens from "./lwTokens.module.css";
import styles from "./LwPelatihanList.module.css";

/** LwPelatihanList -- padanan bagian "A" section Tindak Lanjut & Pengembangan: kartu program
 * pelatihan prioritas, padanan langsung "Rekomendasi Aksi Tindak Lanjut Prioritas" di dokumen
 * sumber. Field `catatan` (kalau ada) menandai kartu yang perlu diverifikasi ulang ke PDF asli --
 * bukan disembunyikan, supaya pimpinan tahu batas keyakinan datanya. */
export function LwPelatihanList({ sectionIndex, title, subtitle, items }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <LwReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </LwReveal>

      <div className={styles.grid}>
        {items.map((item, i) => (
          <LwReveal className={styles.card} delay={i * 0.05} amount={0.15} key={item.key}>
            <h3>{item.judul}</h3>
            {item.dimensi && <span className={styles.tag}>Menjawab: {item.dimensi}</span>}

            {item.teaser && (
              <div className={styles.block}>
                <p className={styles.blockTitle}>Fokus Materi</p>
                <p className={styles.blockText}>{item.teaser}</p>
              </div>
            )}

            {item.mengapaData && (
              <div className={styles.block}>
                <p className={styles.blockTitle}>Mengapa Prioritas Ini</p>
                <p className={styles.blockText}>{item.mengapaData}</p>
              </div>
            )}

            {item.learningOutcome ? (
              <div className={styles.block}>
                <p className={styles.blockTitle}>Learning Outcome</p>
                <p className={styles.blockText}>{item.learningOutcome}</p>
              </div>
            ) : (
              <p className={styles.gapNote}>Learning outcome belum tersedia untuk program ini.</p>
            )}

            {item.catatan && <p className={styles.warningNote}>{item.catatan}</p>}
          </LwReveal>
        ))}
      </div>
    </section>
  );
}
