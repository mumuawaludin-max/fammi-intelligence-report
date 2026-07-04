import styles from "./FollowupCard.module.css";

const PRIORITAS_META = {
  tinggi:  { label: "Prioritas Tinggi",  cls: "high" },
  sedang:  { label: "Prioritas Sedang",  cls: "mid"  },
  rendah:  { label: "Prioritas Rendah",  cls: "low"  },
};

const MODUL_LABEL = {
  karakter:  "Rapor Karakter",
  screening: "Screening",
  mi:        "Multiple Intelligence",
};

export default function FollowupCard({ action, trigger, module: modul, priority, onClick }) {
  const meta = PRIORITAS_META[priority] ?? PRIORITAS_META.rendah;
  const modulLabel = MODUL_LABEL[modul] ?? modul;
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`${styles.card} ${styles[meta.cls]}`}
      onClick={onClick}
      style={onClick ? { cursor: "pointer", textAlign: "left", width: "100%", font: "inherit" } : undefined}
    >
      <div className={styles.header}>
        <span className={`${styles.priorityBadge} ${styles[`badge_${meta.cls}`]}`}>
          {meta.label}
        </span>
        <span className={styles.modulBadge}>{modulLabel}</span>
      </div>
      <p className={styles.action}>{action}</p>
      <p className={styles.trigger}>{trigger}</p>
    </Tag>
  );
}
