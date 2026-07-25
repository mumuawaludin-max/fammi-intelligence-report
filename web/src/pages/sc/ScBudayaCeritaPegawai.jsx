import { ScLaporanReveal } from "./ScLaporanReveal";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScBudayaCeritaPegawai.module.css";

/**
 * ScBudayaCeritaPegawai -- padanan "01-E" mockup: TIGA kolom word cloud (Gambaran Lembaga dari
 * esai Q1, Kejadian Keseharian dari Q2, Yang Ingin Diubah dari Q3), bukan lagi dua kolom kalimat
 * penuh. Instruksi eksplisit pemilik produk (2026-07): tiap entri sekarang frasa pendek gaya
 * word cloud ({frasa, jumlah_mention}), bukan kalimat naratif -- lihat FrasaCeritaTim di
 * sc.types.ts dan TUGAS KETIGA di SYSTEM_INSTRUCTION_SC_BRIEFING (_shared/geminiPromptSc.ts).
 * Sudah lewat gerbang approve briefing sebelum tampil di sini -- BUKAN kutipan asli Tim (privasi:
 * kalimat/frasa unik satu orang bisa dilacak balik ke orangnya).
 */
const KOLOM = [
  { key: "gambaran_lembaga", eyebrow: "Cerita Tim tentang", title: "Gambaran Lembaga" },
  { key: "saat_ini", eyebrow: "Cerita Tim tentang", title: "Kejadian Keseharian" },
  { key: "ingin_diubah", eyebrow: "Cerita Tim tentang", title: "Yang Ingin Diubah" },
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

export function ScBudayaCeritaPegawai({ sectionIndex, ceritaPegawai }) {
  const adaData = KOLOM.some((k) => (ceritaPegawai?.[k.key] || []).length > 0);

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Cerita dari Tim</h2>
        <p>Bagaimana Tim memandang kondisi saat ini dan apa yang ingin diubah</p>
      </ScLaporanReveal>

      {!adaData ? (
        <p className={styles.gapNote}>
          Cerita dari Tim belum tersedia untuk periode ini. Sintesis ini butuh draf briefing
          digenerate ulang dan disetujui setelah section ini ditambahkan.
        </p>
      ) : (
        <div className={styles.grid}>
          {KOLOM.map((k, i) => (
            <ScLaporanReveal className={styles.card} delay={i * 0.06} key={k.key}>
              <p className={styles.cardEyebrow}>{k.eyebrow}</p>
              <h3>{k.title}</h3>
              <WordCloudKolom frasaList={ceritaPegawai?.[k.key]} />
            </ScLaporanReveal>
          ))}
        </div>
      )}
    </section>
  );
}
