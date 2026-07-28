import { PaReveal } from "./PaReveal";
import { PaSectionHeading } from "./PaSectionHeading";
import { PaInsightBanner } from "./PaInsightBanner";
import { PaIconBadge } from "./paIconBadge";
import { PaBar } from "./PaBar";
import tokens from "./paTokens.module.css";
import styles from "./PaSurvey.module.css";

function angka(n) {
  return (n ?? 0).toLocaleString("id-ID");
}

/**
 * PaSurvey -- bagian 04. Dua jenis isi yang sengaja dipisah tegas:
 *
 * 1. Pertanyaan tertutup, dikelompokkan per domain HEART (`per_domain`, dari paAssembler.js) --
 *    tiap domain bisa punya lebih dari satu pertanyaan (mis. Emosional punya tiga: respon di
 *    situasi baru, tempat yang nyaman, respon saat gagal). Tiap pertanyaan ditampilkan sebagai
 *    kartu peringkat opsi terbanyak, plus satu kalimat interpretasi kalau sudah ditulis lewat
 *    sheet NARASI. Opsi "Tidak Menjawab" ditandai `muted` (warna redup, bukan warna sinyal),
 *    supaya tidak terbaca seolah jadi temuan seperti opsi lain.
 * Jawaban esai (pertanyaan terbuka) TIDAK lagi di sini -- dipindah ke bagian 01 Statistik Siswa
 * atas permintaan pemilik produk, jadi bagian ini sekarang murni pertanyaan tertutup.
 */
export function PaSurvey({ data, unitLabel }) {
  const { insight_utama, per_domain } = data;

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <PaSectionHeading
        title="Kebiasaan harian"
        subtitle="Jawaban pilihan siswa tentang kebiasaan sehari-hari, dikelompokkan per domain HEART."
        aside={unitLabel}
      />

      <PaInsightBanner teks={insight_utama} />

      <div className={styles.grid}>
        {per_domain.map((d, gi) => (
          <PaReveal className={styles.domainGroup} delay={gi * 0.04} amount={0.12} key={d.kode}>
            <div className={styles.domainHead}>
              <span className={styles.domainHuruf}>{d.huruf}</span>
              <p className={styles.domainLabel}>{d.label}</p>
            </div>

            <div className={styles.domainCards}>
              {d.pertanyaan.map((p) => (
                <div className={styles.card} key={p.kode}>
                  <div className={styles.cardHead}>
                    <PaIconBadge icon={p.kode} size="sm" tone="purple" />
                    <h3>{p.judul}</h3>
                    <span className={styles.headTotal}>Total Siswa</span>
                  </div>

                  <div className={styles.rows}>
                    {p.opsi.map((o) => (
                      <div
                        className={`${styles.row} ${o.sinyal ? styles.rowSinyal : ""} ${o.muted ? styles.rowMuted : ""}`}
                        key={o.label}
                      >
                        <span className={styles.rank}>{o.rank}</span>
                        <span className={styles.rowLabel}>{o.label}</span>
                        <PaBar
                          persen={o.persen}
                          tone={o.muted ? "muted" : o.sinyal ? "gold" : "primary"}
                          className={styles.rowBar}
                          label={`${o.label} ${o.persen} persen`}
                        />
                        <span className={styles.rowValue}>
                          <span className={styles.rowPct}>{o.persen}%</span>
                          <span className={styles.rowDot}>·</span>
                          <strong className={styles.rowCount}>{angka(o.jumlah)} Siswa</strong>
                        </span>
                      </div>
                    ))}
                  </div>

                  {p.interpretasi && <p className={styles.cardInterpretasi}>{p.interpretasi}</p>}
                </div>
              ))}
            </div>
          </PaReveal>
        ))}
      </div>
    </section>
  );
}
