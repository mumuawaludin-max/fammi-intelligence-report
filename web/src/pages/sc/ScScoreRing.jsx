import { motion, useReducedMotion } from "motion/react";
import styles from "./ScScoreRing.module.css";

function formatScore(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

/**
 * ScScoreRing -- ring gauge animasi generik (padanan ScoreRing.tsx reference), dipakai hero
 * Kesejahteraan Tim untuk menampilkan skor aspek terpilih. Skala tetap 0-100 (bukan sumbu
 * dinamis seperti dumbbell) karena di sini ring cuma menampilkan SATU angka, tidak
 * membandingkan posisi relatif beberapa titik.
 */
export function ScScoreRing({ score, eyebrow, label }) {
  const reduceMotion = useReducedMotion();
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score ?? 0));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={styles.ring} role="img" aria-label={`${label}: ${formatScore(score)}%`}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle className={styles.track} cx="110" cy="110" r={radius} />
        <motion.circle
          className={styles.value}
          cx="110"
          cy="110"
          r={radius}
          strokeDasharray={circumference}
          initial={reduceMotion ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className={styles.copy}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <strong>{formatScore(score)}%</strong>
        <span className={styles.label}>{label}</span>
      </div>
    </div>
  );
}
