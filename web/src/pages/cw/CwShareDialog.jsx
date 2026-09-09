import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CwIconBadge } from "./cwIconBadge";
import tokens from "./cwBudayaTokens.module.css";
import styles from "./CwShareDialog.module.css";

/**
 * CwShareDialog -- dialog konfirmasi berbagi lewat WhatsApp, dipakai tombol "Jadikan prioritas
 * intervensi" (01-B Budaya Kerja). Menampilkan pratinjau PERSIS pesan yang akan dikirim (satu
 * dimensi terpilih saja), pengguna menekan "Bagikan ke WhatsApp" untuk baru diarahkan ke wa.me
 * -- WhatsApp sendiri yang membuka layar kirim, dialog ini tidak pernah mengirim otomatis.
 *
 * Salinan ScShareDialog.jsx modul School Culture.
 */
export function CwShareDialog({ open, onClose, dimensionLabel, dimensionIcon, message, onShared }) {
  const reduceMotion = useReducedMotion();

  function bagikanKeWhatsapp() {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onShared?.();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`${tokens.scope} ${styles.backdrop}`}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.card}
            role="dialog"
            aria-modal="true"
            aria-label="Bagikan prioritas intervensi"
            initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.header}>
              <CwIconBadge icon={dimensionIcon} size="md" />
              <div>
                <p className={styles.title}>Bagikan Prioritas Intervensi</p>
                <p className={styles.subtitle}>
                  Fokus: <strong>{dimensionLabel}</strong>
                </p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
                <CwIconBadge icon="close" size="sm" tone="plain" />
              </button>
            </div>

            <p className={styles.previewLabel}>Pratinjau pesan yang akan dibagikan</p>
            <div className={styles.bubble}>
              <p className={styles.bubbleText}>{message}</p>
            </div>

            <div className={styles.actions}>
              <button type="button" className={styles.buttonGhost} onClick={onClose}>
                Batal
              </button>
              <button type="button" className={styles.buttonWhatsapp} onClick={bagikanKeWhatsapp}>
                <CwIconBadge icon="whatsapp" size="sm" tone="plain" className={styles.buttonIcon} />
                Bagikan ke WhatsApp
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
