import { motion, useReducedMotion } from "motion/react";
import { CwLaporanReveal } from "./CwLaporanReveal";
import { CwIconBadge } from "./cwIconBadge";
import tokens from "./cwBudayaTokens.module.css";
import styles from "./CwDimensiRingkasan.module.css";

function formatScore(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

/**
 * CwDimensiRingkasan -- bagian "A" tiap section: dominan + N kartu skor datar + panel "artinya"
 * yang DINAMIS mengikuti kartu skor yang sedang dipilih, supaya jelas keempat kartu "artinya"
 * itu menjelaskan SATU dimensi yang sama. Generik, dipakai untuk KETIGA bagian (Budaya Kerja/
 * Kesejahteraan Karyawan/Profil Organisasi) supaya struktur "A" ketiganya benar-benar identik.
 *
 * Salinan ScDimensiRingkasan.jsx modul School Culture, dengan istilah korporat.
 */
export function CwDimensiRingkasan({
  sectionIndex, sectionTitle, subtitle, dominantPrefix, dominant,
  items, selectedKey, onSelect, namaOrganisasi, meaningFacets,
}) {
  const reduceMotion = useReducedMotion();
  const selectedItem = items.find((it) => it.key === selectedKey);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <CwLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>{sectionTitle}</h2>
        <p>{subtitle}</p>
        {dominant && (
          <div className={styles.dominantPill}>
            <span>{dominantPrefix}</span>
            <strong>{dominant.label}</strong>
          </div>
        )}
      </CwLaporanReveal>

      <CwLaporanReveal className={styles.scoreGrid} delay={0.06}>
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
      </CwLaporanReveal>

      {meaningFacets?.length > 0 && selectedItem && (
        <div className={styles.meaningBlock}>
          <CwLaporanReveal>
            <p className={styles.meaningTitle}>
              <strong className={styles.meaningTitleHighlight}>{selectedItem.label}</strong> artinya bagi {namaOrganisasi} adalah:
            </p>
            <p className={styles.meaningHint}>Ingin tahu makna dimensi lain? Tinggal ketuk salah satu skor di atas.</p>
          </CwLaporanReveal>
          <motion.div
            className={styles.meaningGrid}
            key={selectedKey}
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {meaningFacets.map((m, i) => (
              <div className={styles.meaningItem} key={i}>
                <CwIconBadge icon={m.icon} size="md" tone="gold" />
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
