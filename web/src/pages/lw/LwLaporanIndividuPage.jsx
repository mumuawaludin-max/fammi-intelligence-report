import { LwReveal } from "./LwReveal";
import { leadKategoriTone, protekKategoriTone } from "./lwMeta";
import tokens from "./lwTokens.module.css";
import styles from "./LwLaporanIndividuPage.module.css";

/**
 * LwLaporanIndividuPage -- laporan individu satu kandidat, dibuka pimpinan lewat drill-down dari
 * LwKandidatTable (bukan self-service seperti ScKaryawanPage -- modul ini memang hanya untuk
 * laporan pimpinan, lihat catatan LwPage.jsx). Menampilkan gabungan skor LEAD dan PROTEK persis
 * seperti halaman "Hasil Asesmen Individu -- LEAD & Kesehatan Mental" di dokumen sumber.
 */
export function LwLaporanIndividuPage({ personal, onBack }) {
  const {
    nama, unit, isKepsek, kesiapanSkor, kesiapanKategori, kondisiSkor, kondisiKategori, kondisiLabel,
    leadAspek, protekDimensi, narasi, ceritaTerbaik,
  } = personal;

  return (
    <div className={`${tokens.scope} ${styles.page}`}>
      <button type="button" className={styles.backButton} onClick={onBack}>&larr; Kembali ke Laporan Lembaga</button>

      <LwReveal className={styles.hero}>
        <div className={styles.heroHead}>
          <div>
            <h1>{nama}</h1>
            <p className={styles.unit}>{unit}{isKepsek ? " · Kepala Sekolah saat ini" : ""}</p>
          </div>
          <div className={styles.heroBadges}>
            <div
              className={styles.heroBadge}
              style={{ color: `var(${leadKategoriTone(kesiapanKategori)})`, background: `color-mix(in srgb, var(${leadKategoriTone(kesiapanKategori)}) 12%, white)` }}
            >
              <span>Kesiapan Memimpin</span>
              <strong>{kesiapanSkor} · {kesiapanKategori}</strong>
            </div>
            <div
              className={styles.heroBadge}
              style={{ color: `var(${protekKategoriTone(kondisiKategori)})`, background: `color-mix(in srgb, var(${protekKategoriTone(kondisiKategori)}) 12%, white)` }}
            >
              <span>Kondisi Psikologis</span>
              <strong>{kondisiLabel || kondisiKategori} ({kondisiSkor})</strong>
            </div>
          </div>
        </div>
      </LwReveal>

      <LwReveal className={styles.scoreSection} delay={0.05}>
        <h2>Empat Aspek LEAD</h2>
        <div className={styles.scoreGrid}>
          {leadAspek.map((a) => (
            <div className={styles.scoreCard} key={a.kode}>
              <span className={styles.scoreValue}>{a.nilai}</span>
              <span className={styles.scoreLabel}>{a.label}</span>
            </div>
          ))}
        </div>
      </LwReveal>

      <LwReveal className={styles.scoreSection} delay={0.08}>
        <h2>Enam Dimensi PROTEK</h2>
        <div className={styles.scoreGrid}>
          {protekDimensi.map((d) => (
            <div className={styles.scoreCard} key={d.kode}>
              <span className={styles.scoreValue}>{d.nilai}</span>
              <span className={styles.scoreLabel}>{d.label}</span>
              {d.kategori !== "Baik" && <span className={styles.scoreFlag}>{d.kategori}</span>}
            </div>
          ))}
        </div>
      </LwReveal>

      {narasi?.length > 0 && (
        <LwReveal className={styles.narasiSection} delay={0.1}>
          <h2>Pengalaman &amp; Refleksi Kepemimpinan</h2>
          <div className={styles.narasiGrid}>
            {narasi.map((n, i) => (
              <div className={styles.narasiCard} key={i}>
                <p className={styles.narasiTema}>{n.tema}</p>
                <p className={styles.narasiIsi}>{n.isi}</p>
              </div>
            ))}
          </div>
        </LwReveal>
      )}

      {ceritaTerbaik?.length > 0 && (
        <LwReveal className={styles.narasiSection} delay={0.12}>
          <h2>Cerita Pengalaman Terbaik</h2>
          <div className={styles.narasiGrid}>
            {ceritaTerbaik.map((c, i) => (
              <div className={styles.narasiCard} key={i}>
                <p className={styles.narasiTema}>{c.judul}</p>
                <p className={styles.narasiIsi}>{c.isi}</p>
                {c.bulletPoin?.length > 0 && (
                  <ul className={styles.bulletList}>
                    {c.bulletPoin.map((b, idx) => <li key={idx}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </LwReveal>
      )}
    </div>
  );
}
