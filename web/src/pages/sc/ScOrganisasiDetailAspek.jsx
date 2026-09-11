import { ScLaporanReveal } from "./ScLaporanReveal";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScOrganisasiDetailAspek.module.css";

const DIMENSI_ORDER = ["Karakter Lembaga", "Kepemimpinan", "Manajemen", "Sinergi Tim", "Fokus Strategis", "Kinerja/Performa"];

/** CADANGAN saja. Label baris yang sebenarnya adalah redaksi butir survei itu sendiri, dibawa
 * per sel lewat cell.label_item (diturunkan dari nama kolom di useScData.js). Empat kalimat di
 * bawah cuma dipakai kalau kolomnya tidak ketemu di berkas sekolah, supaya barisnya tidak kosong.
 * JANGAN dijadikan sumber utama lagi: tiap pasangan dimensi x tipe menanyakan hal yang berbeda,
 * jadi memakai daftar per tipe bikin keenam kartu tampil dengan indikator yang sama persis. */
const TIPE_ROW_LABEL = {
  Kekeluargaan: "Lembaga seperti keluarga",
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
 * ScOrganisasiDetailAspek -- padanan "03-B" Profil Organisasi, REMAKE TOTAL atas instruksi
 * eksplisit pemilik produk (referensi screenshot terpisah): satu kartu per dimensi organisasi
 * (6 kartu, header skor asli dimensi itu + kategori), isi kartu rating bintang per butir survei
 * dimensi itu (4 baris, satu butir per tipe budaya, redaksinya ikut berkas sekolah; sumber SAMA
 * dengan heatmap Fase B yang dipakai ScBudayaDetailAspek/01-D, cuma
 * ditranspos: di sana dikelompokkan per tipe, di sini dikelompokkan per dimensi). Warna header
 * SENGAJA pakai token tema SC yang sudah ada (--sc-primary), BUKAN hijau/navy gelap seperti
 * screenshot referensi -- instruksi eksplisit "warna mengikuti tema sekarang saja".
 */
export function ScOrganisasiDetailAspek({ sectionIndex, items, heatmapCells = [] }) {
  const cellByKey = Object.fromEntries(heatmapCells.map((c) => [`${c.dimensi}|${c.tipe}`, c]));
  const itemByLabel = Object.fromEntries((items || []).map((d) => [d.label, d]));
  const adaData = heatmapCells.some((c) => c.nilai_mentah != null);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Penilaian Detail Terhadap Setiap Aspek</h2>
        <p>Penilaian Tim untuk setiap aspek dalam profil organisasi</p>
      </ScLaporanReveal>

      {!adaData ? (
        <p className={styles.gapNote}>Detail penilaian per aspek belum tersedia untuk periode ini.</p>
      ) : (
        <div className={styles.grid}>
          {DIMENSI_ORDER.map((dimensi, i) => {
            const dim = itemByLabel[dimensi];
            return (
              <ScLaporanReveal className={styles.card} delay={i * 0.05} amount={0.15} key={dimensi}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardHeaderTop}>
                    <h3>{dimensi}</h3>
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
                        <span className={styles.rowLabel}>{cell?.label_item || TIPE_ROW_LABEL[tipe]}</span>
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
            );
          })}
        </div>
      )}
    </section>
  );
}
