import { ScLaporanReveal } from "./ScLaporanReveal";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScBudayaDetailAspek.module.css";

const TIPE_ORDER = ["Kekeluargaan", "Inovasi", "Orientasi", "Aturan"];
const DIMENSI_ORDER = ["Karakter Lembaga", "Kepemimpinan", "Manajemen", "Sinergi Tim", "Fokus Strategis", "Kinerja/Performa"];

function Stars({ rating }) {
  const filled = Math.round(Math.max(0, Math.min(5, rating ?? 0)));
  return (
    <span className={styles.stars} aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < filled ? styles.starFilled : styles.starEmpty}>★</span>
      ))}
    </span>
  );
}

/**
 * ScBudayaDetailAspek -- padanan "01-D" (bagian Budaya Kerja saja): rating bintang per dimensi
 * profil organisasi, dipecah per tipe budaya (4 kartu). Sumbernya SAMA dengan heatmap Fase B
 * yang sudah dihapus dari tampilan (rata-rata item mentah gambaran_<dimensi>_<tipe>, sudah
 * dihitung di heatmapDimensiTipe di useScData.js) -- di sini cuma disajikan ULANG sebagai kartu
 * bintang per tipe, bukan grid heatmap, BUKAN angka baru.
 */
export function ScBudayaDetailAspek({ sectionIndex, heatmapCells = [] }) {
  const cellByKey = Object.fromEntries(heatmapCells.map((c) => [`${c.dimensi}|${c.tipe}`, c]));
  const adaData = heatmapCells.some((c) => c.nilai_mentah != null);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Detail Penilaian Setiap Aspek</h2>
        <p>Penilaian lebih detail setiap aspek bisa dilihat dari 6 kategori</p>
      </ScLaporanReveal>

      {!adaData ? (
        <p className={styles.gapNote}>Detail penilaian per aspek belum tersedia untuk periode ini.</p>
      ) : (
        <div className={styles.grid}>
          {TIPE_ORDER.map((tipe, i) => (
            <ScLaporanReveal className={styles.card} delay={i * 0.05} amount={0.15} key={tipe}>
              <h3>{tipe}</h3>
              <div className={styles.rows}>
                {DIMENSI_ORDER.map((dimensi) => {
                  const cell = cellByKey[`${dimensi}|${tipe}`];
                  const rating = cell?.nilai_mentah;
                  return (
                    <div className={styles.row} key={dimensi}>
                      <span className={styles.rowLabel}>{dimensi}</span>
                      <span className={styles.rowValue}>
                        <Stars rating={rating} />
                        <span className={styles.rowNumber}>
                          {rating != null ? `${rating.toLocaleString("id-ID", { maximumFractionDigits: 2 })} dari 5` : "—"}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScLaporanReveal>
          ))}
        </div>
      )}
    </section>
  );
}
