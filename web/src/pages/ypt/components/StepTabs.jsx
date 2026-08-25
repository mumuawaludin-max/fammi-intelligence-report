import styles from "./StepTabs.module.css";

/**
 * Stepper tab berbentuk panah, dipakai di ketiga menu yang punya sub-tab (Rapor Karakter,
 * Citra Sekolah, Survey Kepuasan). Bentuk panahnya dari Figma: tiap segmen punya takik di sisi
 * kanan, segmen aktif diangkat jadi kartu putih berbingkai navy.
 *
 * Takik dibuat pakai clip-path, bukan gambar, supaya lebar segmen bisa mengikuti jumlah tab
 * (2 tab di Survey Kepuasan, 4 di dua menu lain) tanpa aset terpisah per varian.
 */
export default function StepTabs({ items, activeId, onChange }) {
  if (!items || items.length === 0) return null;

  return (
    <div className={styles.wrap} role="tablist">
      {items.map((item, i) => {
        const aktif = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={aktif}
            className={`${styles.step} ${aktif ? styles.stepActive : ""}`}
            style={{ zIndex: aktif ? items.length + 1 : items.length - i }}
            onClick={() => onChange(item.id)}
          >
            <span className={styles.icon} aria-hidden="true">{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
