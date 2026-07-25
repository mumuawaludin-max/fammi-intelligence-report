import { useState } from "react";
import { ScLaporanReveal } from "./ScLaporanReveal";
import { ScIconBadge } from "./scIconBadge";
import tokens from "./scBudayaTokens.module.css";
import styles from "./ScKesejahteraanSuaraTim.module.css";

/**
 * ScKesejahteraanSuaraTim -- padanan "02-C" desain baru, menggantikan ScDimensiTindakLanjut
 * KHUSUS untuk bagian Kesejahteraan Tim. Memakai `tema_esai` (Fase D item 12: sintesis Gemini
 * atas jawaban esai staf, sudah lewat gerbang approve briefing) yang SEBELUMNYA dibaca di
 * useScData.js tapi tidak pernah dirender di halaman manapun sejak restart total wireframe.
 *
 * BEDA dari referensi screenshot: tidak ada badge sentimen ("Positif"/"Perlu perhatian") atau
 * kutipan verbatim staf per tema -- skema tema_esai cuma {tema, ringkasan, jumlah_mention}, tidak
 * ada klasifikasi sentimen atau kutipan asli (memang sengaja, demi privasi staf, lihat catatan di
 * sc.types.ts CeritaPegawai). Panel aksi kanan pakai langkah/waktu dari tindak_lanjut ASPEK YANG
 * SEDANG DIPILIH di 02-B (bukan jadwal 30/60/90 hari tetap dengan pemilik program -- itu tidak
 * ada di skema manapun sekarang, lihat catatan sama di ScShareDialog/ScBudayaPerbandinganDumbbell).
 */
export function ScKesejahteraanSuaraTim({ sectionIndex, temaEsai, aspekLabel, actionSteps }) {
  const [temaAktif, setTemaAktif] = useState(0);
  const tema = (temaEsai || [])[temaAktif] || null;

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <ScLaporanReveal className={styles.heading}>
        <span className={styles.index}>{sectionIndex}</span>
        <h2>Analisa Keseluruhan Suara Tim Lainnya</h2>
        <p>Analisa ini diambil dari berbagai isian atau komentar dalam screening, yang dirangkum menjadi tema utama dan tindak lanjut yang dapat dipantau.</p>
      </ScLaporanReveal>

      {tema && (
        <ScLaporanReveal className={styles.quoteCard} amount={0.2}>
          <ScIconBadge icon="quote" size="md" tone="plain" className={styles.quoteIcon} />
          <div>
            <p className={styles.quoteText}>{tema.ringkasan}</p>
            <p className={styles.quoteAttr}>Sintesis dari jawaban Tim, anonim, tema &ldquo;{tema.tema}&rdquo;</p>
          </div>
        </ScLaporanReveal>
      )}

      <div className={styles.layout}>
        <ScLaporanReveal className={styles.themeBlock} delay={0.05} amount={0.15}>
          <div className={styles.themeHeading}>
            <h3>Tema utama dari suara tim</h3>
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
        </ScLaporanReveal>

        <ScLaporanReveal className={styles.actionCard} delay={0.08} amount={0.15}>
          <div className={styles.actionHeading}>
            <ScIconBadge icon="calendar" size="sm" tone="gold" />
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
        </ScLaporanReveal>
      </div>
    </section>
  );
}
