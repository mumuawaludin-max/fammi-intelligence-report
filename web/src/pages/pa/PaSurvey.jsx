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

function angkaSatuDesimal(n) {
  return (n ?? 0).toLocaleString("id-ID", { maximumFractionDigits: 1 });
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
 *
 * `top_prioritas` (sampai 3 kartu, dari hitungTopPrioritasSurvey di paAssembler.js) muncul
 * persis di bawah insight banner -- ringkasan paling penting sebelum pembaca menelusuri seluruh
 * rincian pertanyaan di bawahnya. Pemilihannya heuristik kata kunci + ambang durasi (BUKAN
 * klasifikasi ahli), jadi CTA-nya sengaja saran umum, bukan rekomendasi spesifik yang seolah
 * sudah ditinjau -- lihat catatan panjang di paAssembler.js kenapa.
 */
export function PaSurvey({ data, unitLabel }) {
  const { insight_utama, per_domain, top_prioritas } = data;

  return (
    <section className={`${tokens.scope} ${styles.section}`}>
      <PaSectionHeading
        title="Kebiasaan harian"
        subtitle="Jawaban pilihan siswa tentang kebiasaan sehari-hari, dikelompokkan per domain HEART."
        aside={unitLabel}
      />

      <PaInsightBanner teks={insight_utama} />

      {top_prioritas?.length > 0 && (
        <PaReveal className={styles.prioritasWrap} delay={0.02}>
          <div className={styles.prioritasHead}>
            <p className={styles.prioritasTitle}>Top {top_prioritas.length} prioritas dari seluruh survei</p>
            <p className={styles.prioritasSubtitle}>
              Dipilih otomatis dari pola jawaban yang paling menonjol di seluruh pertanyaan tertutup --
              bahan awal diskusi, bukan pengganti penilaian wali kelas atau guru BK.
            </p>
          </div>
          <div className={styles.prioritasGrid}>
            {top_prioritas.map((tp) => (
              <div className={styles.prioritasCard} key={tp.pertanyaanKode}>
                <div className={styles.prioritasCardHead}>
                  <span className={styles.prioritasRank}>{tp.rank}</span>
                  <span className={styles.prioritasDomain}>{tp.domainHuruf} · {tp.domainLabel}</span>
                </div>
                <p className={styles.prioritasJudul}>{tp.pertanyaanJudul}</p>
                <p className={styles.prioritasOpsi}>&ldquo;{tp.opsiLabel}&rdquo;</p>
                <div className={styles.prioritasAngka}>
                  <strong>{angka(tp.jumlah)} siswa</strong>
                  <span>{angkaSatuDesimal(tp.persen)}% dari total</span>
                </div>
                <div className={styles.prioritasCta}>
                  <span className={styles.prioritasCtaLabel}>Saran tindak lanjut</span>
                  <p>{tp.cta}</p>
                </div>
              </div>
            ))}
          </div>
        </PaReveal>
      )}

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
