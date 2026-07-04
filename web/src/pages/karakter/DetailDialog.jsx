import { useEffect } from "react";
import styles from "./DetailDialog.module.css";

/**
 * Dialog box terpusat (bukan panel geser dari pinggir) untuk semua drill-down
 * di modul Karakter: detail siswa, detail kelas, detail jenjang, detail sekolah,
 * detail indikator. Isinya fleksibel lewat children.
 */
export default function DetailDialog({ icon, eyebrow, title, subtitle, onClose, children }) {
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
