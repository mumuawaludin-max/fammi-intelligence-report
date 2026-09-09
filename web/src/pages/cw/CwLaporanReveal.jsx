import { motion, useReducedMotion } from "motion/react";

/** Animasi reveal saat elemen masuk layar, dipakai bersama oleh SELURUH section dashboard
 * "Laporan Organisasi" Corporate Culture & Wellbeing. Salinan ScLaporanReveal.jsx (modul School
 * Culture) -- keduanya sengaja dibiarkan terpisah supaya wording satu modul bisa diubah tanpa
 * menyeret modul lain. */
export function CwLaporanReveal({ children, className = "", delay = 0, amount = 0.2 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.62, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
