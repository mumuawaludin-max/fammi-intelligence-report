import { useEffect } from "react";
import styles from "./ScDetailDialog.module.css";

/**
 * ScDetailDialog -- modal drill-down generik untuk SC. Salinan lokal dari
 * pages/cw/CwDetailDialog.jsx -- modul SC sengaja berdiri sendiri (lihat sc.types.ts), bukan
 * impor lintas-modul, walau UI/UX-nya dibuat identik atas instruksi pemilik produk.
 */
export default function ScDetailDialog({ icon, eyebrow, title, subtitle, onClose, children }) {
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Tutup">✕</button>

        <div className={styles.header}>
          {icon && <span className={styles.avatar}>{icon}</span>}
          <div>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
