import { KATEGORI_KESEJAHTERAAN_COLOR } from "./cwColors";
import styles from "./WellbeingBarChart.module.css";

/**
 * WellbeingBarChart -- horizontal bar chart untuk bagian_kesejahteraan.chart_data (satu baris
 * per subdimensi). Warna bar ikut field `kategori` yang sudah datang dari data (skala 5-tingkat,
 * lihat --cw-nilai-* di tokens.css) -- BUKAN dihitung ulang dari `nilai` di sini, supaya FIR
 * tetap murni menampilkan data yang sudah final (CLAUDE.md butir 3).
 *
 * items: SubdimensiKesejahteraan[] (lihat cw.types.ts).
 */
export default function WellbeingBarChart({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <div className={styles.list}>
      {items.map((it) => {
        const color = KATEGORI_KESEJAHTERAAN_COLOR[it.kategori] || "var(--ink-4)";
        return (
          <div className={styles.row} key={it.kode}>
            <span className={styles.label} title={it.label}>{it.label}</span>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{ width: `${Math.max(0, Math.min(100, it.nilai))}%`, background: color }}
              />
            </div>
            <span className={styles.value}>{it.nilai}%</span>
            <span
              className={styles.kategoriTag}
              style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
            >
              {it.kategori}
            </span>
          </div>
        );
      })}
    </div>
  );
}
