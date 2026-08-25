import styles from "./Bits.module.css";

/**
 * Primitif kecil yang dipakai berulang di seluruh dashboard YPT. Sengaja dikumpulkan di satu
 * berkas: semuanya di bawah 20 baris dan selalu muncul bersamaan, memecahnya jadi satu berkas
 * per komponen cuma menambah impor tanpa menambah kejelasan.
 */

/** Bar progres horizontal. varian: "navy" (pencapaian) | "red" (perlu penguatan). */
export function ProgressBar({ value, varian = "navy", tinggi }) {
  const lebar = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className={styles.track} style={tinggi ? { height: tinggi } : undefined}>
      <div
        className={`${styles.fill} ${varian === "red" ? styles.fillRed : styles.fillNavy}`}
        style={{ width: `${lebar}%` }}
      />
    </div>
  );
}

/**
 * Kartu status: memuat, galat, atau kosong. Satu bentuk untuk ketiganya supaya konsisten.
 *
 * SENGAJA fungsi biasa, bukan komponen React, dan mengembalikan null kalau tidak ada yang perlu
 * ditampilkan. Pemanggilnya memakai pola `const s = statusPanel(...); if (s) return s;` -- kalau
 * ini dibuat sebagai <StatePanel/>, elemennya SELALU truthy walaupun isinya null, sehingga
 * pengecekan itu selalu benar dan halaman jadi kosong justru ketika datanya ada.
 */
export function statusPanel({ loading, error, kosong, judul, pesan }) {
  if (loading) return <div className={styles.state}>Memuat data…</div>;
  if (error) {
    return (
      <div className={styles.state}>
        <p className={styles.stateTitle}>Gagal memuat data</p>
        <p>{error}</p>
      </div>
    );
  }
  if (kosong) {
    return (
      <div className={styles.state}>
        <p className={styles.stateTitle}>{judul || "Belum ada data"}</p>
        {pesan && <p>{pesan}</p>}
      </div>
    );
  }
  return null;
}

/** Angka persen dengan penanda "belum ada data" yang eksplisit, bukan 0%. */
export function Persen({ value, className }) {
  if (value == null) return <span className={`${styles.kosong} ${className || ""}`}>—</span>;
  return <span className={className}>{value}%</span>;
}

/** Judul section, dipakai di atas tiap blok. */
export function SectionTitle({ children, aksi }) {
  return (
    <div className={styles.sectionHead}>
      <h2 className={styles.sectionTitle}>{children}</h2>
      {aksi}
    </div>
  );
}

/** Sepasang tombol panah carousel (kiri/kanan), dipakai layar Dokumentasi Kegiatan. */
export function ArrowPair({ onPrev, onNext, prevDisabled, nextDisabled }) {
  return (
    <div className={styles.arrowPair}>
      <button
        type="button"
        className={styles.arrowBtn}
        onClick={onPrev}
        disabled={prevDisabled}
        aria-label="Sebelumnya"
      >
        ‹
      </button>
      <button
        type="button"
        className={styles.arrowBtn}
        onClick={onNext}
        disabled={nextDisabled}
        aria-label="Berikutnya"
      >
        ›
      </button>
    </div>
  );
}
