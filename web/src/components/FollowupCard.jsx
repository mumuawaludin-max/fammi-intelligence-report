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

export default function FollowupCard({ action, trigger, module: modul, priority }) {
  const meta = PRIORITAS_META[priority] ?? PRIORITAS_META.rendah;
  const modulLabel = MODUL_LABEL[modul] ?? modul;

  return (
    <div className={`${styles.card} ${styles[meta.cls]}`}>
      <div className={styles.header}>
        <span className={`${styles.priorityBadge} ${styles[`badge_${meta.cls}`]}`}>
          {meta.label}
        </span>
        <span className={styles.modulBadge}>{modulLabel}</span>
      </div>
      <p className={styles.action}>{action}</p>
      <p className={styles.trigger}>{trigger}</p>
    </div>
  );
}
