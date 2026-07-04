import styles from "./SectionHeading.module.css";

export default function SectionHeading({ title, subtitle, eyebrow, icon }) {
  return (
    <div className={styles.wrap}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h2 className={styles.title}>
        {icon && <span className={styles.icon}>{icon}</span>}
        {title}
      </h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
