import { useReveal } from "./lwHooks";
import styles from "./LwBar.module.css";

function clampPersen(v) {
  return Math.max(0, Math.min(100, v ?? 0));
}

/**
 * LwBar -- satu batang isian di atas track netral, salinan lokal PaBar (pa/PaBar.jsx). Isian
 * tumbuh dari 0 begitu masuk viewport lewat transisi CSS, bukan motion `whileInView` -- lihat
 * catatan di lwHooks.js soal kenapa batang data tidak boleh bergantung pada animation frame.
 *
 * PENTING, beda dari PA: nama `tone` di sini mengikuti semantik kategori PROTEK yang lurus --
 * `baik` = hijau, `perluPerhatian` = emas, `waspada` = merah. Di PA nama token sengaja "meleset"
 * (tone waspada = emas, tone perhatian = merah); JANGAN menyalin pemetaan PA mentah-mentah.
 */
export function LwBar({ persen, tone = "primary", size = "md", className = "", label }) {
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
        className={`${styles.fill} ${styles[`fill_${tone}`]}`}
        style={{ width: shown ? width : 0 }}
      />
    </span>
  );
}

/**
 * LwStackBar -- satu batang berisi beberapa segmen berurutan. Seluruh batang membuka sebagai
 * satu kesatuan lewat scaleX supaya proporsi antarsegmen tidak sempat terlihat salah di tengah
 * animasi. Segmen 0% aman dibiarkan (width 0), tidak perlu difilter.
 */
export function LwStackBar({ segmen, size = "md", className = "", label }) {
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
