import styles from "./MerekFammi.module.css";

/**
 * Unsur merek yang dipakai bersama halaman masuk dan layar demo, bernada deck Fammi: logo, stabilo
 * kuning, janji Fammi, dan rasi titik berwarna. Palet dari loginTokens.module.css (.scope dipasang
 * di halaman pemakainya).
 */

export function MerekFammi({ className = "" }) {
  return (
    <span className={`${styles.logo} ${className}`}>
      <img src="/favicon-512.png" alt="" width="56" height="56" />
      <span className={styles.logoNama}>Fammi</span>
    </span>
  );
}

/** Stabilo kuning di balik kata penting, disapukan sekali saat muncul. */
export function Stabilo({ children }) {
  return <span className={styles.stabilo}>{children}</span>;
}

export function JanjiFammi({ className = "" }) {
  return (
    <p className={`${styles.janji} ${className}`}>
      Better <strong>Understanding</strong>. Better <strong>Support</strong>. Better <strong>Outcomes</strong>.
    </p>
  );
}

// Rasi titik: titik berwarna lima modul yang saling tersambung. Digambar sekali saat halaman dibuka,
// lalu diam. Memudar ke arah isi supaya tidak bersaing dengan teks. Posisinya diatur pemakainya.
const TITIK = [
  [360, 80], [286, 58], [372, 132], [226, 104], [318, 168], [168, 52],
  [262, 214], [356, 246], [196, 176], [300, 300], [372, 352],
];
const GARIS = [
  [0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [3, 5], [3, 8], [4, 6], [4, 7], [6, 8], [6, 9], [7, 9], [9, 10],
];
const WARNA_TITIK = ["ungu", "merah", "biru", "jingga", "teal"];

export function JaringLatar({ className = "" }) {
  return (
    <svg
      className={`${styles.jaring} ${className}`}
      viewBox="0 0 380 380"
      preserveAspectRatio="xMaxYMin meet"
      aria-hidden="true"
      focusable="false"
    >
      {GARIS.map(([a, b], i) => (
        <line
          key={`g${i}`}
          x1={TITIK[a][0]} y1={TITIK[a][1]} x2={TITIK[b][0]} y2={TITIK[b][1]}
          pathLength="1"
          className={styles.jaringGaris}
          style={{ animationDelay: `${0.25 + i * 0.07}s` }}
        />
      ))}
      {TITIK.map(([x, y], i) => (
        <circle
          key={`t${i}`}
          cx={x} cy={y} r={i % 3 === 0 ? 4.2 : 3}
          className={`${styles.jaringTitik} ${styles[`titik_${WARNA_TITIK[i % WARNA_TITIK.length]}`]}`}
          style={{ animationDelay: `${0.4 + i * 0.07}s` }}
        />
      ))}
    </svg>
  );
}
