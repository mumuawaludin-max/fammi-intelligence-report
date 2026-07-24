import { motion, useReducedMotion } from "motion/react";
import { ScLaporanReveal } from "./ScLaporanReveal";
import { ScIconBadge } from "./scIconBadge";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScDimensiRingkasan.module.css";

function formatScore(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

/**
 * ScDimensiRingkasan -- padanan bagian "01-A" wireframe-original.png: dominan + N kartu skor
 * datar (BUKAN score ring animasi seperti versi polished reference -- wireframe tidak
 * memakainya) + panel "artinya" DINAMIS mengikuti kartu skor yang sedang dipilih (bukan grid
 * statis semua dimensi sekaligus) -- supaya jelas keempat kartu "artinya" itu semuanya
 * menjelaskan SATU dimensi yang sama, tidak membingungkan pembaca soal dimensi mana yang
 * sedang dibahas. Generik, dipakai untuk ketiga bagian (Budaya Kerja/Kesejahteraan Tim/Profil
 * Organisasi), beda cuma datanya.
 */
export function ScDimensiRingkasan({
  sectionIndex, sectionTitle, subtitle, dominantPrefix, dominant,
  items, selectedKey, onSelect, meaningTitle, meaningFacets,
}) {
  const reduceMotion = useReducedMotion();
  const selectedItem = items.find((it) => it.key === selectedKey);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{sectionTitle}</h2>
        <p>{subtitle}</p>
        {dominant && (
          <div className={styles.dominantPill}>
            <span>{dominantPrefix}</span>
            <strong>{dominant.label}</strong>
          </div>
        )}
      </ScLaporanReveal>

      <ScLaporanReveal className={styles.scoreGrid} delay={0.06}>
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
              <span className={styles.scoreValue}>{formatScore(item.value)}%</span>
              <span className={styles.scoreLabel}>Skor {item.label}</span>
            </button>
          );
        })}
      </ScLaporanReveal>

      {meaningFacets?.length > 0 && selectedItem && (
        <div className={styles.meaningBlock}>
          <ScLaporanReveal>
            <p className={styles.meaningTitle}>
              {meaningTitle} <strong className={styles.meaningTitleHighlight}>{selectedItem.label}</strong>
            </p>
            <p className={styles.meaningHint}>Ingin tahu makna dimensi lain? Tinggal ketuk salah satu skor di atas.</p>
          </ScLaporanReveal>
          <motion.div
            className={styles.meaningGrid}
            key={selectedKey}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {meaningFacets.map((m, i) => (
              <div className={styles.meaningItem} key={i}>
                <ScIconBadge icon={m.icon} size="md" tone="gold" />
                <div>
                  <p className={styles.meaningItemTitle}>{m.title}</p>
                  <p className={styles.meaningItemDetail}>{m.detail}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      )}
    </section>
  );
}
