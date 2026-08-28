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

  /**
   * Nama karakter di grafik ini datang dari karakter_aspek_config, dan sebagian besar sekolah
   * belum mengisinya. Batangnya sendiri sudah benar (rata-rata tertimbang seluruh sekolah pada
   * kode aspek yang sama), tapi NAMANYA adalah klaim dari sedikit sekolah untuk rata-rata banyak
   * sekolah. Itu harus terbaca, bukan disembunyikan -- pembaca level yayasan memakai grafik ini
   * untuk menilai sekolah, dan berhak tahu kalau namanya belum tentu berlaku di semua sekolah.
   */
  const catatanLabel = useMemo(() => {
    if (aspek.length === 0) return null;

    // Sekolah yang kerangka karakternya berbeda per jenjang tidak ikut grafik ini sama sekali
    // (lihat sekolahPerJenjang di useYptKarakter). Angka totalnya tetap ikut di tab lain, tapi
    // ketidakikutsertaannya di sini WAJIB disebut: grafik yang diam-diam melewatkan sekolah
    // terbaca seolah sudah mencakup semuanya.
    const perJenjang = data.sekolahPerJenjang || [];
    if (perJenjang.length > 0) {
      return `${perJenjang.length} sekolah tidak masuk grafik ini karena kerangka karakternya `
        + `berbeda di tiap jenjang, jadi karakternya tidak bisa disandingkan dengan sekolah lain: `
        + `${perJenjang.map((s) => s.nama).join(', ')}. Angka totalnya tetap ikut di tab lain.`;
    }

    const bentrok = aspek.filter((a) => a.labelBentrok);
    if (bentrok.length > 0) {
      return `Peringatan: ${bentrok.length} karakter dinamai berbeda-beda antar sekolah pada `
        + "kode yang sama, jadi angkanya bisa saja menggabungkan karakter yang berlainan. "
        + "Samakan penamaannya lewat Admin CMS.";
    }

    const berlabel = Math.max(...aspek.map((a) => a.sekolahBerlabel));
    const total = Math.max(...aspek.map((a) => a.jumlahSekolah));
    if (berlabel === 0) {
      return `Nama karakter belum diisi satu sekolah pun dari ${total} sekolah, jadi dipakai nama `
        + "sementara. Isi lewat Admin CMS supaya namanya muncul.";
    }
    if (berlabel < total) {
      return `Nama karakter diambil dari konfigurasi ${berlabel} dari ${total} sekolah; `
        + "sisanya belum mengisi, jadi namanya belum tentu berlaku di semua sekolah.";
    }
    return null;
  }, [aspek, data.sekolahPerJenjang]);

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
                <div key={a.kode} className={styles.chartCol}>
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
                <span key={a.kode} className={styles.chartLabel}>{a.nama}</span>
              ))}
            </div>

            {catatanLabel && <p className={styles.chartCatatan}>{catatanLabel}</p>}
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
