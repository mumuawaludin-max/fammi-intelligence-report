import { useMemo, useState } from "react";
import { ProgressBar, SectionTitle } from "../components/Bits";
import JenjangCards from "./JenjangCards";
import styles from "./Rapor.module.css";

/**
 * Tab Penilaian per Karakter (Figma 84-2289).
 * Kartu jenjang di atas berfungsi sebagai FILTER; bar chart dan dua daftar indikator di bawahnya
 * mengikuti jenjang yang dipilih.
 *
 * Catatan label: di Figma, judul kolom kanan tertulis "Top 5 Sekolah Perlu Penguatan" padahal
 * isinya daftar indikator, sama seperti kolom kiri. Itu salah label mockup -- di sini ditulis
 * "Top 5 Indikator Perlu Penguatan" supaya cocok dengan isinya.
 */
export default function PerKarakterTab({ data }) {
  const [grup, setGrup] = useState(data.jenjang[0]?.id || "TK");

  const aspek = useMemo(() => data.aspekPerGrup(grup), [data, grup]);
  const indikator = useMemo(() => data.indikatorPerGrup(grup), [data, grup]);

  const top5 = [...indikator].sort((a, b) => b.nilai - a.nilai).slice(0, 5);
  const bawah5 = [...indikator].sort((a, b) => a.nilai - b.nilai).slice(0, 5);

  const label = data.jenjang.find((g) => g.id === grup)?.label || grup;

  return (
    <>
      <SectionTitle>Pencapaian Karakter per Jenjang</SectionTitle>
      <JenjangCards jenjang={data.jenjang} aktif={grup} onPilih={setGrup} />

      <div className={styles.chartCard}>
        <h3 className={styles.chartTitle}>Pencapaian Karakter Jenjang {label}</h3>

        {aspek.length === 0 ? (
          <p className={styles.jenjangMeta}>Belum ada data karakter untuk jenjang ini pada periode terpilih.</p>
        ) : (
          <>
            <div className={styles.chartArea}>
              {aspek.map((a) => (
                <div key={a.nama} className={styles.chartCol}>
                  <span className={styles.chartNilai}>{a.nilai}%</span>
                  <span className={styles.chartBarTrack}>
                    {/* Tinggi bar = persen langsung, jadi jalur abu di belakangnya mewakili 100%
                        dan tinggi antar bar bisa dibandingkan apa adanya. */}
                    <span className={styles.chartBar} style={{ height: `${a.nilai}%` }} />
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.chartLabels}>
              {aspek.map((a) => (
                <span key={a.nama} className={styles.chartLabel}>{a.nama}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.duaKolom}>
        <div>
          <SectionTitle>Top 5 Indikator Terbaik</SectionTitle>
          <div className={styles.rankCard}>
            {top5.length === 0 ? (
              <p className={styles.jenjangMeta}>Belum ada data indikator untuk jenjang ini.</p>
            ) : top5.map((it, i) => (
              <div key={it.label} className={styles.indikatorItem}>
                <span className={styles.indikatorKiri}>
                  <span className={styles.indikatorNo}>{i + 1}</span>
                  <span className={styles.indikatorNilai}>{it.nilai}%</span>
                </span>
                <span className={styles.indikatorKanan}>
                  <p className={styles.indikatorLabel}>{it.label}</p>
                  <ProgressBar value={it.nilai} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Top 5 Indikator Perlu Penguatan</SectionTitle>
          <div className={styles.rankCard}>
            {bawah5.length === 0 ? (
              <p className={styles.jenjangMeta}>Belum ada data indikator untuk jenjang ini.</p>
            ) : bawah5.map((it, i) => (
              <div key={it.label} className={styles.indikatorItem}>
                <span className={styles.indikatorKiri}>
                  <span className={`${styles.indikatorNo} ${styles.indikatorNoRed}`}>{i + 1}</span>
                  <span className={`${styles.indikatorNilai} ${styles.indikatorNilaiRed}`}>{it.nilai}%</span>
                </span>
                <span className={styles.indikatorKanan}>
                  <p className={styles.indikatorLabel}>{it.label}</p>
                  <ProgressBar value={it.nilai} varian="red" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
