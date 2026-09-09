import { CwLaporanReveal } from "./CwLaporanReveal";
import { TIPE_BUDAYA_ORDER, DIMENSI_LABEL_DATA, DIMENSI_LABEL_TAMPIL } from "./cwMeta";
import tokens from "./cwBudayaTokens.module.css";
import styles from "./CwBudayaDetailAspek.module.css";

// Kedua daftar ini datang dari cwMeta supaya cuma ada satu tempat yang menyimpan urutan dan
// penamaan. DIMENSI_LABEL_DATA berisi label sesuai isi data (mis. "Karakter Lembaga"), yang
// dipakai mencocokkan sel heatmap; yang ditampilkan ke layar label korporatnya.
const TIPE_ORDER = TIPE_BUDAYA_ORDER;
const DIMENSI_ORDER = DIMENSI_LABEL_DATA;

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
 * CwBudayaDetailAspek -- bagian "01-D": rating bintang per dimensi profil organisasi, dipecah
 * per tipe budaya (4 kartu). Sumbernya rata-rata item mentah gambaran_<dimensi>_<tipe> yang
 * sudah final dari hulu (analisis.heatmap), BUKAN angka baru yang dihitung di sini.
 *
 * Salinan ScBudayaDetailAspek.jsx modul School Culture, istilah korporat.
 */
export function CwBudayaDetailAspek({ sectionIndex, heatmapCells = [] }) {
  const cellByKey = Object.fromEntries(heatmapCells.map((c) => [`${c.dimensi}|${c.tipe}`, c]));
  const adaData = heatmapCells.some((c) => c.nilai_mentah != null);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <CwLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Detail Penilaian Setiap Aspek</h2>
        <p>Penilaian lebih detail setiap aspek bisa dilihat dari 6 kategori</p>
      </CwLaporanReveal>

      {!adaData ? (
        <p className={styles.gapNote}>Detail penilaian per aspek belum tersedia untuk periode ini.</p>
      ) : (
        <div className={styles.grid}>
          {TIPE_ORDER.map((tipe, i) => (
            <CwLaporanReveal className={styles.card} delay={i * 0.05} amount={0.15} key={tipe}>
              <h3>{tipe}</h3>
              <div className={styles.rows}>
                {DIMENSI_ORDER.map((dimensi) => {
                  const cell = cellByKey[`${dimensi}|${tipe}`];
                  const rating = cell?.nilai_mentah;
                  return (
                    <div className={styles.row} key={dimensi}>
                      <span className={styles.rowLabel}>{DIMENSI_LABEL_TAMPIL[dimensi] || dimensi}</span>
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
            </CwLaporanReveal>
          ))}
        </div>
      )}
    </section>
  );
}
