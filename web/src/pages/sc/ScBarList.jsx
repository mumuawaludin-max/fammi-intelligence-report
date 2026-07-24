import { KATEGORI_NILAI_COLOR } from "./scColors";
import styles from "./ScBarList.module.css";

/**
 * ScBarList -- horizontal bar chart generik untuk daftar item {kode, label, nilai, kategori}.
 * Dipakai DUA kali di modul SC: bagian_kesejahteraan.chart_data (5 subdimensi) DAN
 * bagian_profil_organisasi.chart_data (6 dimensi) -- keduanya sama-sama skala 0-100 dengan
 * kategori kualitatif 5-tingkat, jadi satu komponen generik ini cukup, tidak perlu dua salinan
 * (padanan pages/cw/WellbeingBarChart.jsx, cuma diganti nama supaya jelas dipakai lintas-bagian).
 *
 * Warna bar ikut field `kategori` yang sudah datang dari data -- BUKAN dihitung ulang di sini,
 * supaya FIR tetap murni menampilkan data yang sudah final (CLAUDE.md butir 3).
 *
 * onSelectItem: opsional -- kalau diisi, tiap baris jadi <button> yang bisa diklik.
 */
export default function ScBarList({ items = [], onSelectItem }) {
  if (items.length === 0) return null;
  const clickable = typeof onSelectItem === "function";
  const Row = clickable ? "button" : "div";

  return (
    <div className={styles.list}>
      {items.map((it) => {
        const color = KATEGORI_NILAI_COLOR[it.kategori] || "var(--ink-4)";
        return (
          <Row
            type={clickable ? "button" : undefined}
            className={`${styles.row} ${clickable ? styles.rowClickable : ""}`}
            key={it.kode}
            onClick={clickable ? () => onSelectItem(it) : undefined}
          >
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
            {clickable && <span className={styles.rowChevron} aria-hidden="true">›</span>}
          </Row>
        );
      })}
    </div>
  );
}
