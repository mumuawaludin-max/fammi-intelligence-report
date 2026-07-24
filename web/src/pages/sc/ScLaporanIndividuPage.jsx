import { useState } from "react";
import { KATEGORI_NILAI_COLOR } from "./scColors";
import { DIMENSI_PROFIL_INFO, KESEJAHTERAAN_INFO, METODOLOGI_NOTE } from "./scMeta";
import { useReveal } from "./scHooks";
import ScRencanaTindakLanjutPage from "./ScRencanaTindakLanjutPage";
import styles from "./ScLaporanIndividuPage.module.css";

/** Label TAMPILAN subdimensi kesejahteraan, selalu ikut KESEJAHTERAAN_INFO (scMeta.js) --
 * beberapa baris sc_personal lama masih menyimpan label istilah sebelum wording diperbarui
 * (mis. "Keseimbangan Kerja-Hidup"). HANYA dipakai untuk teks yang dibaca pengguna. */
function labelKesejahteraan(kode, labelAsli) {
  return KESEJAHTERAAN_INFO[kode]?.label || labelAsli;
}

/** Reveal halus saat elemen masuk viewport -- animasi "benchmark Fammi" yang sama dipakai
 * seluruh laporan individu FIR (Karakter/MI), cuma salinan lokal SC (lihat scHooks.js). */
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${shown ? styles.revealShown : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title }) {
  return (
    <div className={styles.sectionHead}>
      <span className={styles.sectionMarker} aria-hidden="true" />
      <h2 className={styles.sectionTitle}>{title}</h2>
    </div>
  );
}

/** Satu kartu tipe budaya: dua bar berdampingan (saat ini vs harapan) dipisah bulatan panah. */
function BudayaCard({ tipe, saatIni, harapan, delay }) {
  return (
    <Reveal delay={delay} className={styles.budayaCard}>
      <p className={styles.budayaTitle}>Skor {tipe}</p>
      <div className={styles.budayaCompare}>
        <div className={styles.budayaSide}>
          <div className={styles.budayaSideTop}>
            <span>Saat Ini</span>
            <strong>{saatIni}%</strong>
          </div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${Math.max(0, Math.min(100, saatIni ?? 0))}%` }} />
          </div>
        </div>

        <span className={styles.compareSep} aria-hidden="true">›</span>

        <div className={styles.budayaSide}>
          <div className={styles.budayaSideTop}>
            <span>Harapan ke Depan</span>
            <strong>{harapan}%</strong>
          </div>
          <div className={styles.barTrack}>
            <div className={`${styles.barFill} ${styles.barFillHarapan}`} style={{ width: `${Math.max(0, Math.min(100, harapan ?? 0))}%` }} />
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/** Satu baris subdimensi kesejahteraan, bisa dibuka-tutup. Saat terbuka, tampil facet generik
 * (KESEJAHTERAAN_INFO, scMeta.js) sebagai penjelasan pendorong -- BUKAN rincian butir survey
 * dengan skor 1-5 per butir seperti referensi visual: skor per-butir itu tidak ada di skema data
 * manapun sekarang (sc_personal.kesejahteraan cuma satu angka gabungan per subdimensi), jadi
 * sengaja tidak dikarang (CLAUDE.md: jangan menampilkan angka contoh seolah temuan nyata). */
function KesejahteraanRow({ item, expanded, onToggle }) {
  const warna = KATEGORI_NILAI_COLOR[item.kategori] || "var(--ink-4)";
  const info = KESEJAHTERAAN_INFO[item.kode];
  return (
    <div className={styles.kesRow}>
      <button type="button" className={styles.kesRowHead} onClick={onToggle} aria-expanded={expanded}>
        <span className={`${styles.chevron} ${expanded ? styles.chevronUp : ""}`} aria-hidden="true">⌄</span>
        <span className={styles.kesLabel}>{labelKesejahteraan(item.kode, item.label)}</span>
        <span className={styles.kesNilai}>{item.nilai}%</span>
      </button>
      <div className={styles.barTrackSlim}>
        <div className={styles.barFillSlim} style={{ width: `${Math.max(0, Math.min(100, item.nilai ?? 0))}%`, background: warna }} />
      </div>

      {expanded && (
        <div className={styles.kesDetail}>
          {info?.facets?.length > 0 ? (
            <ul className={styles.facetList}>
              {info.facets.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          ) : (
            <p className={styles.gapNote}>Penjelasan aspek ini belum tersedia.</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Satu kartu jawaban esai verbatim -- kutipan asli staf sendiri, bukan sintesis Gemini (beda
 * dari "Cerita dari Para Pegawai" versi agregat yang WAJIB sintesis demi privasi lintas-staf;
 * di laporan individu, menampilkan jawaban sendiri ke pemiliknya sendiri tidak masalah privasi). */
function SurveyCard({ heading, teks, delay }) {
  if (!teks) return null;
  return (
    <Reveal delay={delay} className={styles.surveyCard}>
      <span className={styles.quoteMark} aria-hidden="true">&ldquo;</span>
      <p className={styles.surveyHeading}>{heading}</p>
      <p className={styles.surveyText}>{teks}</p>
    </Reveal>
  );
}

/**
 * ScLaporanIndividuPage -- laporan School Culture untuk satu staf sekolah, MOBILE-FIRST.
 * REMAKE TOTAL atas instruksi eksplisit pemilik produk (screenshot referensi): hero sapaan +
 * hook + kutipan harapan perubahan, lalu 4 section flat (Budaya Lembaga/Kesejahteraan Tim/Profil
 * Organisasi/Jawaban Survey Anda) -- BUKAN lagi hero indeks besar + sorotan cepat + radar + dialog
 * per kartu dari versi sebelumnya. Section "Rencana Aksi" tidak lagi inline di beranda (instruksi
 * eksplisit pemilik produk, screenshot pertama tidak menampilkannya) -- dipindah ke halaman detail
 * ScRencanaTindakLanjutPage yang dibuka lewat tombol mengambang di bawah, bukan dihapus dari alur.
 *
 * Warna dan animasi mengikuti token/hook FIR yang sama dipakai laporan individu lain (Karakter/MI):
 * --purple-600/--ink/--surface/--bg, plus useReveal untuk reveal-on-scroll -- BUKAN token khusus
 * "Laporan Lembaga" SC (--sc-primary dkk, lihat scBudayaTokens.module.css), yang memang instruksi
 * terpisah cuma untuk dashboard pimpinan.
 */
export default function ScLaporanIndividuPage({ laporan }) {
  const {
    meta, header, bagian_budaya, bagian_kesejahteraan, bagian_profil_organisasi,
    jawaban_survey, rencana_aksi, footer,
  } = laporan;

  const kesejahteraanItems = bagian_kesejahteraan?.chart_data || [];
  const [kesExpanded, setKesExpanded] = useState(() => kesejahteraanItems[0]?.kode || null);
  const [showRencana, setShowRencana] = useState(false);

  const adaJawabanSurvey = jawaban_survey && (
    jawaban_survey.betah || jawaban_survey.hal_menguras_energi || jawaban_survey.yang_ingin_disampaikan
  );

  if (showRencana) {
    return <ScRencanaTindakLanjutPage laporan={laporan} onBack={() => setShowRencana(false)} />;
  }

  return (
    <div className={styles.page}>
      {/* ── Hero: sapaan + hook + chip peran/unit + kutipan harapan perubahan ─────────── */}
      <Reveal className={styles.hero}>
        <p className={styles.heroGreet}>Halo, <strong>{meta.nama_responden}</strong></p>
        <h1 className={styles.heroHook}>{header.hook}</h1>

        <div className={styles.chips}>
          {meta.peran_kerja && <span className={styles.chip}>{meta.peran_kerja}</span>}
          {meta.unit && <span className={styles.chip}>{meta.unit}</span>}
        </div>

        {jawaban_survey?.yang_ingin_diubah && (
          <div className={styles.heroQuote}>
            <span className={styles.quoteMark} aria-hidden="true">&ldquo;</span>
            <p className={styles.heroQuoteHeading}>Perubahan Lembaga yang Anda Harapkan</p>
            <p className={styles.heroQuoteText}>{jawaban_survey.yang_ingin_diubah}</p>
          </div>
        )}
      </Reveal>

      {/* ── Laporan Budaya Lembaga ─────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <SectionHead title="Laporan Budaya Lembaga" />
        <div className={styles.budayaList}>
          {(bagian_budaya?.chart_data || []).map((c, i) => (
            <BudayaCard key={c.tipe} tipe={c.tipe} saatIni={c.saat_ini} harapan={c.harapan} delay={i * 60} />
          ))}
        </div>
      </section>

      {/* ── Laporan Kesejahteraan Tim ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <SectionHead title="Laporan Kesejahteraan Tim" />
        <Reveal className={styles.kesList}>
          {kesejahteraanItems.map((it) => (
            <KesejahteraanRow
              key={it.kode}
              item={it}
              expanded={kesExpanded === it.kode}
              onToggle={() => setKesExpanded((cur) => (cur === it.kode ? null : it.kode))}
            />
          ))}
        </Reveal>
      </section>

      {/* ── Laporan Profil Organisasi ──────────────────────────────────────────────── */}
      {(bagian_profil_organisasi?.chart_data?.length > 0) && (
        <section className={styles.section}>
          <SectionHead title="Laporan Profil Organisasi" />
          <Reveal className={styles.orgGrid}>
            {bagian_profil_organisasi.chart_data.map((d) => (
              <div className={styles.orgCard} key={d.kode}>
                <span className={styles.orgIcon} aria-hidden="true">{DIMENSI_PROFIL_INFO[d.kode]?.icon}</span>
                <span className={styles.orgLabel}>Nilai {d.label}</span>
                <strong className={styles.orgNilai}>{d.nilai}%</strong>
              </div>
            ))}
          </Reveal>
        </section>
      )}

      {/* ── Jawaban Survey Anda ────────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <SectionHead title="Jawaban Survey Anda" />
        {adaJawabanSurvey ? (
          <div className={styles.surveyList}>
            <SurveyCard heading="Anda betah bekerja di tempat ini karena" teks={jawaban_survey.betah} delay={0} />
            <SurveyCard heading="Hal yang menguras energi Anda" teks={jawaban_survey.hal_menguras_energi} delay={60} />
            <SurveyCard heading="Hal yang ingin Anda sampaikan" teks={jawaban_survey.yang_ingin_disampaikan} delay={120} />
          </div>
        ) : (
          <p className={styles.gapNote}>Jawaban esai belum tersedia untuk laporan periode ini.</p>
        )}
      </section>

      <p className={styles.disclaimer}>{footer?.disclaimer}</p>
      <p className={styles.metodologi}>{METODOLOGI_NOTE}</p>

      {rencana_aksi?.length > 0 && (
        <button type="button" className={styles.fabRencana} onClick={() => setShowRencana(true)}>
          Baca Rencana Tindak Lanjut
          <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}
