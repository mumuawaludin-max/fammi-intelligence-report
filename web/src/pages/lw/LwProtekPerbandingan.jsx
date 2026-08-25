import { LwReveal } from "./LwReveal";
import tokens from "./lwTokens.module.css";
import styles from "./LwProtekPerbandingan.module.css";

function StackBar({ item }) {
  const segments = [
    { persen: item.baikPersen, tone: "baik" },
    { persen: item.perluPerhatianPersen, tone: "perluPerhatian" },
    { persen: item.waspadaPersen, tone: "waspada" },
  ].filter((s) => s.persen > 0);

  return (
    <span className={styles.track}>
      {segments.map((s, i) => (
        <span key={i} className={`${styles.segment} ${styles[`segment_${s.tone}`]}`} style={{ width: `${s.persen}%` }} />
      ))}
    </span>
  );
}

/** LwProtekPerbandingan -- padanan bagian "B" section Kesehatan Mental & Wellbeing: sebaran
 * kategori (Baik/Perlu Perhatian/Waspada) per dimensi PROTEK, padanan langsung bagan "Area Utama
 * yang Perlu Perhatian Lebih" di dokumen sumber. Beda dari ScDimensiPerbandingan (bar tunggal
 * saat-ini vs harapan) karena PROTEK tidak punya konsep harapan, melainkan sebaran 3 kategori. */
export function LwProtekPerbandingan({ sectionIndex, title, subtitle, items }) {
  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <LwReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </LwReveal>

      <div className={styles.legend}>
        <span><i className={styles.dotBaik} />Baik</span>
        <span><i className={styles.dotPerhatian} />Perlu Perhatian</span>
        <span><i className={styles.dotWaspada} />Waspada</span>
      </div>

      <div className={styles.list}>
        {items.map((item, i) => (
          <LwReveal className={styles.row} delay={i * 0.04} amount={0.3} key={item.key}>
            <div className={styles.rowHead}>
              <h3>{item.label}</h3>
              {item.perluPerhatianJumlah > 0 && (
                <span className={styles.badge}>{item.perluPerhatianJumlah} guru perlu perhatian</span>
              )}
            </div>
            <StackBar item={item} />
            <p className={styles.detail}>
              Baik {item.baikPersen}% ({item.baikJumlah}) · Perlu Perhatian {item.perluPerhatianPersen}% ({item.perluPerhatianJumlah}) · Waspada {item.waspadaPersen}% ({item.waspadaJumlah})
            </p>
          </LwReveal>
        ))}
      </div>
    </section>
  );
}
