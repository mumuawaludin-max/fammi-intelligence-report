import styles from "./StatTile.module.css";

const DELTA_ARROW = { up: "▲", down: "▼", flat: "→" };

/**
 * icon: glyph singkat (emoji/karakter) dirender dalam badge kotak-bulat, opsional.
 * delta: { value, direction: "up"|"down"|"flat" }, dirender sebagai pill kecil, opsional.
 * Keduanya default tidak render apa-apa supaya pemakaian lama (mis. MIPage) tidak berubah.
 */
export default function StatTile({ label, value, unit, sub, tone = "default", compact = false, icon, delta }) {
  return (
    <div className={`${styles.tile} ${styles[tone]}`}>
      {icon && <div className={styles.iconBadge}>{icon}</div>}
      <div className={`${styles.value} ${compact ? styles.valueCompact : ""}`}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      <div className={styles.label}>{label}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
      {delta && (
        <div className={`${styles.deltaPill} ${styles[`delta${delta.direction === "up" ? "Up" : delta.direction === "down" ? "Down" : "Flat"}`]}`}>
          {DELTA_ARROW[delta.direction] || DELTA_ARROW.flat} {delta.value > 0 ? "+" : ""}{delta.value}pp vs bulan lalu
        </div>
      )}
    </div>
  );
}
