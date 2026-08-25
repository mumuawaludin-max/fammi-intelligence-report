import { motion, useReducedMotion } from "motion/react";
import { LwReveal } from "./LwReveal";
import tokens from "./lwTokens.module.css";
import styles from "./LwDimensiRingkasan.module.css";

function formatScore(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 1 });
}

/**
 * LwDimensiRingkasan -- padanan ScDimensiRingkasan: dominan + N kartu skor datar + panel
 * "artinya" dinamis mengikuti kartu yang dipilih. Dipakai untuk KEDUA bagian (Kesiapan Memimpin
 * dan Kesehatan Mental & Wellbeing) supaya strukturnya identik.
 *
 * `distribusi` OPSIONAL -- baris pil kategori kualitatif organisasi (mis. "Istimewa 50% (4
 * orang)"), dirender di atas kartu skor kalau ada. Tidak ada di ScDimensiRingkasan karena SC
 * tidak punya konsep distribusi kategori level-organisasi untuk section A.
 */
export function LwDimensiRingkasan({
  sectionIndex, sectionTitle, subtitle, dominantPrefix, dominant,
  items, selectedKey, onSelect, namaLembaga, meaningFacets, distribusi, unitSatuan = "skor",
}) {
  const reduceMotion = useReducedMotion();
  const selectedItem = items.find((it) => it.key === selectedKey);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <LwReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{sectionTitle}</h2>
        <p>{subtitle}</p>
        {dominant && (
          <div className={styles.dominantPill}>
            <span>{dominantPrefix}</span>
            <strong>{dominant.label}</strong>
          </div>
        )}
      </LwReveal>

      {distribusi?.length > 0 && (
        <LwReveal className={styles.distribusiRow} delay={0.03}>
          {distribusi.map((d) => (
            <span
              key={d.kategori}
              className={styles.distribusiPill}
              style={{ color: `var(${d.toneVar})`, background: `color-mix(in srgb, var(${d.toneVar}) 12%, white)` }}
            >
              <strong>{d.kategori}</strong>
              <span>{formatScore(d.persen)}% ({d.jumlah} orang)</span>
            </span>
          ))}
        </LwReveal>
      )}

      <LwReveal className={styles.scoreGrid} delay={0.06}>
        {items.map((item) => {
          const active = selectedKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              className={`${styles.scoreCard} ${active ? styles.scoreCardActive : ""}`}
              aria-pressed={active}
              onClick={() => onSelect(item.key)}
            >
              <span className={styles.scoreValue}>{formatScore(item.value)}</span>
              <span className={styles.scoreLabel}>{unitSatuan === "persen" ? "%" : ""} {item.label}</span>
            </button>
          );
        })}
      </LwReveal>

      {meaningFacets?.length > 0 && selectedItem && (
        <div className={styles.meaningBlock}>
          <LwReveal>
            <p className={styles.meaningTitle}>
              <strong className={styles.meaningTitleHighlight}>{selectedItem.label}</strong> artinya bagi {namaLembaga} adalah:
            </p>
            <p className={styles.meaningHint}>Ingin tahu makna lain? Tinggal ketuk salah satu skor di atas.</p>
          </LwReveal>
          <motion.div
            className={styles.meaningGrid}
            key={selectedKey}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {meaningFacets.map((m, i) => (
              <div className={styles.meaningItem} key={i}>
                <div className={styles.meaningBullet} />
                <p className={styles.meaningItemDetail}>{m.detail}</p>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
}
