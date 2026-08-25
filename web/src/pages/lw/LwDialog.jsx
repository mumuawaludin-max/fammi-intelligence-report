import { useEffect } from "react";
import { motion, useReducedMotion } from "motion/react";
import tokens from "./lwTokens.module.css";
import styles from "./LwDialog.module.css";

/**
 * LwDialog -- modal stateless, salinan lokal PaDialog (pa/PaDialog.jsx). Parent yang memegang
 * buka/tutup lewat render kondisional ({dialog && <LwDialog .../>}), bukan prop `open`.
 * Tiga jalur tutup: tombol X, klik overlay, tombol Escape.
 */
export function LwDialog({ eyebrow, title, subtitle, onClose, children, size = "md" }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className={`${tokens.scope} ${styles.overlay}`}
      onClick={onClose}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div
        className={`${styles.dialog} ${styles[`dialog_${size}`]}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.header}>
          <div>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className={styles.body}>{children}</div>
      </motion.div>
    </motion.div>
  );
}
