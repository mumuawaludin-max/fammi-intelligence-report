import { useLwLaporan } from "./useLwData";
import LwLaporanPage from "./LwLaporanPage";
import styles from "./LwPage.module.css";

/**
 * LwPage -- entry point modul Wellbeing Guru. Modul ini hanya laporan pimpinan dan
 * desktop-first: guru yang dinilai bukan pengguna FIR, laporannya dibaca lewat drill-down
 * dari daftar prioritas. Karena itu tidak ada shell mobile self-service seperti
 * ScKaryawanPage di School Culture.
 */
export default function LwPage({ session }) {
  const { loading, error, laporan } = useLwLaporan(session);

  if (loading) return <div className={styles.page}><p className={styles.note}>Memuat laporan…</p></div>;
  if (error) return <div className={styles.page}><p className={styles.note}>Gagal memuat laporan: {error}</p></div>;
  if (!laporan) {
    return (
      <div className={styles.page}>
        <p className={styles.note}>Belum ada data Wellbeing Guru untuk lembaga ini.</p>
      </div>
    );
  }

  return <LwLaporanPage laporan={laporan} />;
}
