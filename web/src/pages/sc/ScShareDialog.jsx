import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ScIconBadge } from "./scIconBadge";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScShareDialog.module.css";

/**
 * ScShareDialog -- dialog konfirmasi berbagi lewat WhatsApp, dipakai tombol "Jadikan prioritas
 * intervensi" (01-B Budaya Kerja). Menampilkan pratinjau PERSIS pesan yang akan dikirim (satu
 * dimensi terpilih saja, bukan seluruh laporan), pengguna menekan "Bagikan ke WhatsApp" untuk
 * baru diarahkan ke wa.me -- WhatsApp sendiri yang membuka layar kirim, dialog ini tidak pernah
 * mengirim pesan secara otomatis.
 *
 * UI/UX dulu, data belakangan: `message` sudah dirakit template oleh pemanggil dari data yang
 * sudah ada di komponen (bukan tanggung jawab dialog generik ini).
 */
export function ScShareDialog({ open, onClose, dimensionLabel, dimensionIcon, message, onShared }) {
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
              <ScIconBadge icon={dimensionIcon} size="md" />
              <div>
                <p className={styles.title}>Bagikan Prioritas Intervensi</p>
                <p className={styles.subtitle}>
                  Fokus: <strong>{dimensionLabel}</strong>
                </p>
              </div>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Tutup">
                <ScIconBadge icon="close" size="sm" tone="plain" />
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
                <ScIconBadge icon="whatsapp" size="sm" tone="plain" className={styles.buttonIcon} />
                Bagikan ke WhatsApp
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
