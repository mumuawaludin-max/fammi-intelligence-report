import { useEffect, useMemo, useState } from "react";
import { ProgressBar, SectionTitle, Persen } from "../components/Bits";
import { JENJANG_GROUPS } from "../yptMeta";
import styles from "./Rapor.module.css";

/**
 * Tab Penilaian per Jenjang (Figma 84-1977).
 * Kiri: Top 5 terbaik / perlu penguatan + daftar sekolah yang bisa dipilih.
 * Kanan: detail pencapaian sekolah terpilih (total, jumlah siswa, per aspek, siswa ekstrem).
 */
export default function PerJenjangTab({ data }) {
  const [filter, setFilter] = useState("semua");
  const [sekolahAktif, setSekolahAktif] = useState(null);

  const terfilter = useMemo(() => {
    const rows = filter === "semua" ? data.sekolah : data.sekolah.filter((s) => s.grup === filter);
    return [...rows].sort((a, b) => (b.rata_total ?? -1) - (a.rata_total ?? -1));
  }, [data.sekolah, filter]);

  // Sekolah terpilih default = peringkat pertama pada filter aktif. Kalau pengguna sudah memilih
  // sekolah yang masih ada di daftar hasil filter, pilihannya dipertahankan.
  useEffect(() => {
    setSekolahAktif((prev) => {
      if (prev && terfilter.some((s) => s.sekolah_id === prev)) return prev;
      return terfilter[0]?.sekolah_id || null;
    });
  }, [terfilter]);

  const detail = terfilter.find((s) => s.sekolah_id === sekolahAktif)
    || data.sekolah.find((s) => s.sekolah_id === sekolahAktif)
    || null;

  const top5 = terfilter.filter((s) => s.rata_total != null).slice(0, 5);
  const bawah5 = terfilter.filter((s) => s.rata_total != null).slice(-5).reverse();

  // aspekPerSekolah berkunci aspek_kode, jadi nama tampilannya dicari lewat aspekLabel. Panel ini
  // menampilkan SATU sekolah, jadi jenjangnya diketahui pasti dan namanya diambil dari jenjang itu
  // saja; nama karakter sebuah SMK tidak boleh dipakai untuk sekolah TK.
  const aspekDetail = detail
    ? Object.entries(data.aspekPerSekolah[detail.sekolah_id] || {})
        .map(([kode, nilai]) => ({ kode, nama: data.aspekLabel(detail.grup, kode), nilai }))
        .sort((a, b) => b.nilai - a.nilai)
    : [];

  const siswa = detail ? data.siswaPerSekolah[detail.sekolah_id] : null;
  // Sekolah dengan <= 10 murid akan memunculkan nama yang sama di kedua daftar (dia memang
  // sekaligus 5 tertinggi dan 5 terendah). Menampilkan keduanya jadi menyesatkan, jadi blok
  // "perlu penguatan" disembunyikan kalau daftarnya beririsan penuh dengan yang terbaik.
  const namaAtas = new Set((siswa?.atas || []).map((s) => s.nama_murid));
  const bawahBeda = (siswa?.bawah || []).filter((s) => !namaAtas.has(s.nama_murid));

  return (
    <>
      <div className={styles.duaKolom}>
        <div>
          <SectionTitle>Top 5 Sekolah Terbaik</SectionTitle>
          <div className={styles.rankCard}>
            {top5.length === 0 ? (
              <p className={styles.jenjangMeta}>Belum ada data periode ini.</p>
            ) : top5.map((s) => (
              <div key={s.sekolah_id} className={styles.rankItem}>
                <span className={styles.rankBadge}>{s.rata_total}%</span>
                <span className={styles.rankNama}>{s.nama}</span>
                <span className={styles.rankBarWrap}><ProgressBar value={s.rata_total} /></span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SectionTitle>Top 5 Sekolah Perlu Penguatan</SectionTitle>
          <div className={styles.rankCard}>
            {bawah5.length === 0 ? (
              <p className={styles.jenjangMeta}>Belum ada data periode ini.</p>
            ) : bawah5.map((s) => (
              <div key={s.sekolah_id} className={styles.rankItem}>
                <span className={`${styles.rankBadge} ${styles.rankBadgeRed}`}>{s.rata_total}%</span>
                <span className={styles.rankNama}>{s.nama}</span>
                <span className={styles.rankBarWrap}><ProgressBar value={s.rata_total} varian="red" /></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.duaKolom}>
        <div>
          <SectionTitle>Pilih Sekolah</SectionTitle>
          <div className={styles.rankCard}>
            <div className={styles.chipRow}>
              <button
                type="button"
                className={`${styles.chip} ${filter === "semua" ? styles.chipActive : ""}`}
                onClick={() => setFilter("semua")}
              >
                Semua
              </button>
              {JENJANG_GROUPS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className={`${styles.chip} ${filter === g.id ? styles.chipActive : ""}`}
                  onClick={() => setFilter(g.id)}
                >
                  {g.label}
                </button>
              ))}
            </div>

            <div className={styles.sekolahList}>
              {terfilter.length === 0 && (
                <p className={styles.jenjangMeta}>Tidak ada sekolah pada jenjang ini.</p>
              )}
              {terfilter.map((s) => (
                <button
                  key={s.sekolah_id}
                  type="button"
                  className={`${styles.sekolahItem} ${sekolahAktif === s.sekolah_id ? styles.sekolahItemActive : ""}`}
                  onClick={() => setSekolahAktif(s.sekolah_id)}
                >
                  <span className={styles.sekolahItemMain}>
                    <span className={styles.sekolahItemNama}>{s.nama}</span>
                    <span className={styles.sekolahItemRow}>
                      <span className={styles.sekolahItemNilai}><Persen value={s.rata_total} /></span>
                      <ProgressBar value={s.rata_total} varian="red" />
                    </span>
                  </span>
                  <span className={styles.sekolahItemGo} aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <SectionTitle>Detail Pencapaian</SectionTitle>

          {!detail ? (
            <div className={styles.rankCard}>
              <p className={styles.jenjangMeta}>Pilih satu sekolah untuk melihat detailnya.</p>
            </div>
          ) : (
            <>
              <div className={styles.detailStatRow}>
                <div className={styles.detailStat}>
                  <p className={styles.detailStatLabel}>Total Pencapaian Karakter</p>
                  <p className={styles.detailStatValue}>
                    <span className={styles.detailStatIcon} aria-hidden="true">👍</span>
                    {detail.rata_total == null ? "—" : `${detail.rata_total}%`}
                  </p>
                </div>
                <div className={styles.detailStat}>
                  <p className={styles.detailStatLabel}>Total Siswa</p>
                  <p className={styles.detailStatValue}>
                    <span className={styles.detailStatIcon} aria-hidden="true">👥</span>
                    {detail.jumlah_siswa || 0} Siswa
                  </p>
                </div>
              </div>

              {aspekDetail.length > 0 && (
                <div className={styles.aspekList}>
                  {aspekDetail.map((a, i) => (
                    <div key={a.kode} className={styles.aspekItem}>
                      <span className={styles.aspekNo}>{i + 1}</span>
                      <span className={styles.aspekNilai}>{a.nilai}%</span>
                      <span className={styles.aspekNama}>{a.nama}</span>
                      <span className={styles.aspekBar}><ProgressBar value={a.nilai} /></span>
                    </div>
                  ))}
                </div>
              )}

              {siswa?.atas?.length > 0 && (
                <div className={styles.siswaCard}>
                  <span className={`${styles.siswaHead} ${styles.siswaHeadNavy}`}>TOP 5 Siswa Terbaik</span>
                  {siswa.atas.map((s, i) => (
                    <div key={`${s.nama_murid}-${i}`} className={styles.siswaItem}>
                      <span className={styles.siswaNo}>{i + 1}.</span>
                      <span className={styles.siswaNama}>{s.nama_murid}</span>
                      <span className={styles.siswaKelas}>{s.kelas_id}</span>
                    </div>
                  ))}
                </div>
              )}

              {bawahBeda.length > 0 && (
                <div className={styles.siswaCard}>
                  <span className={`${styles.siswaHead} ${styles.siswaHeadRed}`}>TOP 5 Siswa Perlu Penguatan</span>
                  {bawahBeda.map((s, i) => (
                    <div key={`${s.nama_murid}-${i}`} className={styles.siswaItem}>
                      <span className={styles.siswaNo}>{i + 1}.</span>
                      <span className={styles.siswaNamaRed}>{s.nama_murid}</span>
                      <span className={styles.siswaKelas}>{s.kelas_id}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
