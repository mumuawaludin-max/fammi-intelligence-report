import { ScLaporanReveal } from "./ScLaporanReveal";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScBudayaCeritaPegawai.module.css";

/**
 * ScBudayaCeritaPegawai -- padanan "01-D" mockup terbaru (index digeser jadi "01-E" karena
 * ScBudayaDetailAspek sudah menempati "01-D"): dua kolom kalimat SINTESIS Gemini (bukan
 * verbatim) dari jawaban esai Q2/Q3, sudah lewat gerbang approve briefing sebelum tampil di
 * sini -- lihat CeritaPegawai di sc.types.ts dan SYSTEM_INSTRUCTION_SC_BRIEFING untuk kenapa ini
 * BUKAN kutipan asli staf (privasi: kalimat unik satu orang bisa dilacak balik ke orangnya).
 */
export function ScBudayaCeritaPegawai({ sectionIndex, ceritaPegawai }) {
  const saatIni = ceritaPegawai?.saat_ini || [];
  const inginDiubah = ceritaPegawai?.ingin_diubah || [];
  const adaData = saatIni.length > 0 || inginDiubah.length > 0;

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Cerita dari Para Pegawai</h2>
        <p>Bagaimana para pegawai memandang kondisi saat ini dan apa yang ingin diubah</p>
      </ScLaporanReveal>

      {!adaData ? (
        <p className={styles.gapNote}>
          Cerita dari para pegawai belum tersedia untuk periode ini. Sintesis ini butuh draf briefing
          digenerate ulang dan disetujui setelah section ini ditambahkan.
        </p>
      ) : (
        <div className={styles.grid}>
          <ScLaporanReveal className={styles.card}>
            <p className={styles.cardEyebrow}>Cerita Pegawai tentang</p>
            <h3>Gambaran Tempat Kerja Saat Ini</h3>
            {saatIni.length > 0 ? (
              <ul className={styles.list}>
                {saatIni.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            ) : (
              <p className={styles.gapNoteInline}>Belum ada sintesis untuk pertanyaan ini.</p>
            )}
          </ScLaporanReveal>

          <ScLaporanReveal className={styles.card} delay={0.06}>
            <p className={styles.cardEyebrow}>Cerita Pegawai tentang</p>
            <h3>Ingin Mengubah Suasana Kerja</h3>
            {inginDiubah.length > 0 ? (
              <ul className={styles.list}>
                {inginDiubah.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            ) : (
              <p className={styles.gapNoteInline}>Belum ada sintesis untuk pertanyaan ini.</p>
            )}
          </ScLaporanReveal>
        </div>
      )}
    </section>
  );
}
