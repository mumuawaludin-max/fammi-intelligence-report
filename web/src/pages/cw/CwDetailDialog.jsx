import { useEffect } from "react";
import styles from "./CwDetailDialog.module.css";

/**
 * CwDetailDialog -- modal drill-down generik untuk CW, dipakai CwRespondenListPage untuk
 * menampilkan laporan individu satu responden. Polanya sama dengan DetailDialog milik Karakter
 * (pages/karakter/DetailDialog.jsx), tapi dibuat salinan lokal khusus CW alih-alih diimpor
 * lintas-modul (Karakter tetap punya latar abu khusus untuk modulnya sendiri, lihat
 * KarakterViews.module.css/YayasanView.module.css; font sudah sama-sama token global sejak
 * pengecualian Montserrat dicabut, lihat CLAUDE.md).
 */
export default function CwDetailDialog({ icon, eyebrow, title, subtitle, onClose, children }) {
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
