import { CwLaporanReveal } from "./CwLaporanReveal";
import { DIMENSI_LABEL_DATA, DIMENSI_LABEL_TAMPIL } from "./cwMeta";
import tokens from "./cwBudayaTokens.module.css";
import styles from "./CwOrganisasiDetailAspek.module.css";

const DIMENSI_ORDER = DIMENSI_LABEL_DATA;

/** Reframing tipe budaya jadi kalimat pendek deskriptif KHUSUS kartu ini, supaya jelas ini
 * menilai "seberapa terasa ciri X" pada tiap dimensi organisasi, bukan skor tipe budaya lagi. */
const TIPE_ROW_LABEL = {
  Kekeluargaan: "Perusahaan seperti keluarga",
  Inovasi: "Terbuka pada hal baru",
  Orientasi: "Fokus pada hasil",
  Aturan: "Berjalan dengan aturan",
};
const TIPE_ORDER = Object.keys(TIPE_ROW_LABEL);

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

function formatScore(value) {
  return (value ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 2 });
}

/**
 * CwOrganisasiDetailAspek -- bagian "03-B" Profil Organisasi: satu kartu per dimensi organisasi
 * (6 kartu, header skor asli dimensi itu + kategori), isi kartu rating bintang per tipe budaya.
 * Sumbernya SAMA dengan 01-D (analisis.heatmap), cuma ditranspos: di sana dikelompokkan per
 * tipe, di sini per dimensi.
 *
 * Salinan ScOrganisasiDetailAspek.jsx modul School Culture, istilah korporat.
 */
export function CwOrganisasiDetailAspek({ sectionIndex, items, heatmapCells = [] }) {
  const cellByKey = Object.fromEntries(heatmapCells.map((c) => [`${c.dimensi}|${c.tipe}`, c]));
  const itemByLabel = Object.fromEntries((items || []).map((d) => [d.label, d]));
  const adaData = heatmapCells.some((c) => c.nilai_mentah != null);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <CwLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Penilaian Detail Terhadap Setiap Aspek</h2>
        <p>Penilaian karyawan untuk setiap aspek dalam profil organisasi</p>
      </CwLaporanReveal>

      {!adaData ? (
        <p className={styles.gapNote}>Detail penilaian per aspek belum tersedia untuk periode ini.</p>
      ) : (
        <div className={styles.grid}>
          {DIMENSI_ORDER.map((dimensi, i) => {
            const dim = itemByLabel[dimensi];
            return (
              <CwLaporanReveal className={styles.card} delay={i * 0.05} amount={0.15} key={dimensi}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTop}>
                    <h3>{DIMENSI_LABEL_TAMPIL[dimensi] || dimensi}</h3>
                    {dim?.kategori && <span className={styles.badge}>{dim.kategori}</span>}
                  </div>
                  <strong className={styles.cardScore}>{formatScore(dim?.nilai)}%</strong>
                </div>

                <div className={styles.rows}>
                  {TIPE_ORDER.map((tipe) => {
                    const cell = cellByKey[`${dimensi}|${tipe}`];
                    const rating = cell?.nilai_mentah;
                    return (
                      <div className={styles.row} key={tipe}>
                        <span className={styles.rowLabel}>{TIPE_ROW_LABEL[tipe]}</span>
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
            );
          })}
        </div>
      )}
    </section>
  );
}
