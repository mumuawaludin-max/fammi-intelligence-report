import { motion, useReducedMotion } from "motion/react";

/**
 * PaReveal -- animasi masuk-viewport untuk seluruh modul Perilaku Anak. Salinan lokal dari
 * sc/ScLaporanReveal.jsx (durasi, easing, dan jarak geser dibuat persis sama) supaya ritme
 * animasi kedua modul terasa satu keluarga. Sengaja disalin, bukan diimpor lintas modul --
 * pola yang sama dipakai SC saat menyalin dari CW.
 */
export function PaReveal({ children, className = "", delay = 0, amount = 0.2, ...rest }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.62, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
