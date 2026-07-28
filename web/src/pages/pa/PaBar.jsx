import { useReveal } from "./paHooks";
import styles from "./PaBar.module.css";

function clampPersen(v) {
  return Math.max(0, Math.min(100, v ?? 0));
}

/**
 * PaBar -- satu batang isian di atas track netral. Isian tumbuh dari 0 begitu masuk viewport
 * lewat transisi CSS, bukan motion `whileInView` -- lihat catatan di paHooks.js soal kenapa
 * batang data tidak boleh bergantung pada animation frame untuk bisa terlihat sama sekali.
 *
 * `tone` memetakan ke warna token PA: primary, aman, waspada, perhatian, laki, perempuan.
 */
export function PaBar({ persen, tone = "primary", size = "md", align = "left", className = "", label }) {
  const [ref, shown] = useReveal();
  const width = `${clampPersen(persen)}%`;

  return (
    <span
      ref={ref}
      className={`${styles.track} ${styles[`track_${size}`]} ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      <span
        className={`${styles.fill} ${styles[`fill_${tone}`]} ${align === "right" ? styles.fillRight : ""}`}
        style={{ width: shown ? width : 0 }}
      />
    </span>
  );
}

/**
 * PaStackBar -- satu batang berisi beberapa segmen berurutan (sebaran emosi lima tingkat, atau
 * pasangan aman/perlu perhatian). Seluruh batang membuka sebagai satu kesatuan lewat scaleX
 * supaya proporsi antarsegmen tidak sempat terlihat salah di tengah animasi.
 */
export function PaStackBar({ segmen, size = "md", className = "", label }) {
  const [ref, shown] = useReveal();

  return (
    <span
      ref={ref}
      className={`${styles.track} ${styles[`track_${size}`]} ${styles.stack} ${className}`}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
      style={{ transform: shown ? "scaleX(1)" : "scaleX(0)" }}
    >
      {segmen.map((s, i) => (
        <span
          key={s.kode || i}
          className={styles.segment}
          style={{ width: `${clampPersen(s.persen)}%`, background: s.warna }}
        />
      ))}
    </span>
  );
}
