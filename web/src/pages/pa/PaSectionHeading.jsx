import { PaReveal } from "./PaReveal";
import styles from "./PaSectionHeading.module.css";

/**
 * PaSectionHeading -- kepala tiap bagian: judul rata kiri, subjudul, dan pill cakupan di kanan.
 *
 * Sebelumnya rata tengah dengan pill nomor ("01-A") seperti School Culture. Diubah ke rata kiri
 * tanpa nomor atas rancangan baru pemilik produk: nomor bagian sudah ada di kartu pemilih di
 * atas, mengulangnya di kepala bagian cuma bikin dua penomoran yang bersaing.
 */
export function PaSectionHeading({ title, subtitle, aside, className = "" }) {
  return (
    <PaReveal className={`${styles.heading} ${className}`}>
      <div className={styles.text}>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {aside && <span className={styles.aside}>{aside}</span>}
    </PaReveal>
  );
}
