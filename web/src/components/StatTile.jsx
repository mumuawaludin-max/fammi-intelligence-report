import styles from "./StatTile.module.css";

export default function StatTile({ label, value, unit, sub, tone = "default" }) {
  return (
    <div className={`${styles.tile} ${styles[tone]}`}>
      <div className={styles.value}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}
