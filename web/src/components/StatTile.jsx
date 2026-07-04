import styles from "./StatTile.module.css";

export default function StatTile({ label, value, unit, sub, tone = "default", compact = false }) {
  return (
    <div className={`${styles.tile} ${styles[tone]}`}>
      <div className={`${styles.value} ${compact ? styles.valueCompact : ""}`}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}
