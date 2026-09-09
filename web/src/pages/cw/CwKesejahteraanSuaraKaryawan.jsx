import { useState } from "react";
import { CwLaporanReveal } from "./CwLaporanReveal";
import { CwIconBadge } from "./cwIconBadge";
import tokens from "./cwBudayaTokens.module.css";
import styles from "./CwKesejahteraanSuaraKaryawan.module.css";

/**
 * CwKesejahteraanSuaraKaryawan -- bagian "02-C", menggantikan CwDimensiTindakLanjut KHUSUS untuk
 * Kesejahteraan Karyawan. Memakai `tema_esai` (sintesis jawaban esai karyawan yang sudah lewat
 * gerbang persetujuan briefing). Tidak ada badge sentimen atau kutipan verbatim: skema tema_esai
 * cuma {tema, ringkasan, jumlah_mention}, dan kutipan asli sengaja tidak ditampilkan demi
 * privasi karyawan. Panel aksi kanan memakai langkah dari tindak lanjut ASPEK YANG SEDANG
 * DIPILIH di 02-B.
 *
 * Salinan ScKesejahteraanSuaraTim.jsx modul School Culture, istilah korporat.
 */
export function CwKesejahteraanSuaraKaryawan({ sectionIndex, temaEsai, aspekLabel, actionSteps }) {
  const [temaAktif, setTemaAktif] = useState(0);
  const tema = (temaEsai || [])[temaAktif] || null;

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <CwLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Analisa Keseluruhan Suara Karyawan Lainnya</h2>
        <p>Analisa ini diambil dari berbagai isian atau komentar dalam screening, yang dirangkum menjadi tema utama dan tindak lanjut yang dapat dipantau.</p>
      </CwLaporanReveal>

      {tema && (
        <CwLaporanReveal className={styles.quoteCard} amount={0.2}>
          <CwIconBadge icon="quote" size="md" tone="plain" className={styles.quoteIcon} />
          <div>
            <p className={styles.quoteText}>{tema.ringkasan}</p>
            <p className={styles.quoteAttr}>Sintesis dari jawaban karyawan, anonim, tema &ldquo;{tema.tema}&rdquo;</p>
          </div>
        </CwLaporanReveal>
      )}

      <div className={styles.layout}>
        <CwLaporanReveal className={styles.themeBlock} delay={0.05} amount={0.15}>
          <div className={styles.themeHeading}>
            <h3>Tema utama dari suara karyawan</h3>
            <p>Pilih tema untuk membaca sintesis lengkapnya.</p>
          </div>

          {temaEsai?.length > 0 ? (
            <div className={styles.themeList}>
              {temaEsai.map((t, i) => {
                const active = i === temaAktif;
                return (
                  <button
                    key={t.tema}
                    type="button"
                    className={`${styles.themeRow} ${active ? styles.themeRowActive : ""}`}
                    aria-pressed={active}
                    onClick={() => setTemaAktif(i)}
                  >
                    <span className={styles.themeNumber}>{i + 1}</span>
                    <span className={styles.themeBody}>
                      <strong>{t.tema}</strong>
                    </span>
                    <span className={styles.themeCount}>{t.jumlah_mention} kemunculan</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className={styles.gapNote}>Belum ada tema esai yang disetujui untuk periode ini.</p>
          )}
        </CwLaporanReveal>

        <CwLaporanReveal className={styles.actionCard} delay={0.08} amount={0.15}>
          <div className={styles.actionHeading}>
            <CwIconBadge icon="calendar" size="sm" tone="gold" />
            <div>
              <h3>Arah tindakan</h3>
              <p>Langkah yang bisa dipantau untuk aspek {aspekLabel || "terpilih"}.</p>
            </div>
          </div>

          {actionSteps?.length > 0 ? (
            <ol className={styles.timeline}>
              {actionSteps.map((s, i) => (
                <li key={i}>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <div>
                    {s.waktu && <p className={styles.timelineWaktu}>{s.waktu}</p>}
                    <p className={styles.timelineAksi}>{s.aksi}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.gapNote}>Rencana langkah belum tersedia untuk aspek ini pada periode ini.</p>
          )}
        </CwLaporanReveal>
      </div>
    </section>
  );
}
