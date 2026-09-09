import { CwLaporanReveal } from "./CwLaporanReveal";
import tokens from "./cwBudayaTokens.module.css";
import styles from "./CwBudayaCeritaKaryawan.module.css";

/**
 * CwBudayaCeritaKaryawan -- bagian "01-E": tiga kolom word cloud dari jawaban esai karyawan
 * (Gambaran Perusahaan, Kejadian Keseharian, Yang Ingin Diubah). Tiap entri frasa pendek
 * {frasa, jumlah_mention} hasil sintesis di hulu yang sudah lewat gerbang persetujuan, BUKAN
 * kutipan asli karyawan (privasi: kalimat unik satu orang bisa dilacak balik ke orangnya).
 *
 * Salinan ScBudayaCeritaPegawai.jsx modul School Culture, istilah korporat.
 */
const KOLOM = [
  { key: "gambaran_perusahaan", eyebrow: "Cerita karyawan tentang", title: "Gambaran Perusahaan" },
  { key: "saat_ini", eyebrow: "Cerita karyawan tentang", title: "Kejadian Keseharian" },
  { key: "ingin_diubah", eyebrow: "Cerita karyawan tentang", title: "Yang Ingin Diubah" },
];

/** Ukuran font tiap frasa mengikuti jumlah_mention relatif terhadap yang paling sering muncul
 * di kolom yang sama (word cloud sungguhan, bukan hiasan) -- skala 13px sampai 24px, cukup
 * kontras untuk kelihatan tanpa bikin frasa yang jarang muncul jadi tidak terbaca. */
function skalaFont(jumlahMention, maks) {
  if (!maks || maks <= 0) return 14;
  const rasio = Math.max(0, Math.min(1, jumlahMention / maks));
  return Math.round(13 + rasio * 11);
}

function WordCloudKolom({ frasaList }) {
  const items = (frasaList || []).filter((f) => f?.frasa);
  if (items.length === 0) {
    return <p className={styles.gapNoteInline}>Belum ada sintesis untuk pertanyaan ini.</p>;
  }
  const maks = Math.max(...items.map((f) => f.jumlah_mention || 0));
  return (
    <div className={styles.cloud}>
      {items.map((f, i) => (
        <span
          key={i}
          className={styles.cloudTag}
          style={{ fontSize: `${skalaFont(f.jumlah_mention, maks)}px` }}
          title={`${f.jumlah_mention || 0} kemunculan`}
        >
          {f.frasa}
        </span>
      ))}
    </div>
  );
}

export function CwBudayaCeritaKaryawan({ sectionIndex, ceritaKaryawan }) {
  const adaData = KOLOM.some((k) => (ceritaKaryawan?.[k.key] || []).length > 0);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <CwLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Cerita dari Karyawan</h2>
        <p>Bagaimana karyawan memandang kondisi saat ini dan apa yang ingin diubah</p>
      </CwLaporanReveal>

      {!adaData ? (
        <p className={styles.gapNote}>
          Cerita dari karyawan belum tersedia untuk periode ini. Sintesis ini butuh draf briefing
          digenerate ulang dan disetujui setelah section ini ditambahkan.
        </p>
      ) : (
        <div className={styles.grid}>
          {KOLOM.map((k, i) => (
            <CwLaporanReveal className={styles.card} delay={i * 0.06} key={k.key}>
              <p className={styles.cardEyebrow}>{k.eyebrow}</p>
              <h3>{k.title}</h3>
              <WordCloudKolom frasaList={ceritaKaryawan?.[k.key]} />
            </CwLaporanReveal>
          ))}
        </div>
      )}
    </section>
  );
}
