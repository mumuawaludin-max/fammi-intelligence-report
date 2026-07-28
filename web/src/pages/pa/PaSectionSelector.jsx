import { PaReveal } from "./PaReveal";
import tokens from "./paTokens.module.css";
import styles from "./PaSectionSelector.module.css";

/**
 * PaSectionSelector -- empat kartu gelap yang jadi filter tampilan di bawahnya.
 *
 * Bentuk barunya mengikuti rancangan pemilik produk: isi kartu rata kiri (nomor kecil di atas,
 * lalu badge inisial + nama bagian, lalu satu baris keterangan isi), bukan lagi ikon besar di
 * tengah seperti versi pertama. Judul halaman besar di atas kartu juga dihapus -- kartu ini
 * langsung menyambung baris filter, dan nama lembaga sudah disebut di baris filter.
 */
export function PaSectionSelector({ sections, active, onSelect }) {
  return (
    <PaReveal className={`${tokens.scope} ${styles.grid}`}>
      {sections.map((s) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            type="button"
            className={`${styles.card} ${isActive ? styles.cardActive : ""}`}
            aria-pressed={isActive}
            onClick={() => onSelect(s.key)}
          >
            <span className={styles.number}>{s.number}</span>
            <span className={styles.titleRow}>
              <span className={styles.badge}>{s.initial}</span>
              <span className={styles.label}>{s.label}</span>
            </span>
            <span className={styles.desc}>{s.desc}</span>
          </button>
        );
      })}
    </PaReveal>
  );
}
