import styles from "./SectionHeading.module.css";

export default function SectionHeading({ title, subtitle }) {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>{title}</h2>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}
