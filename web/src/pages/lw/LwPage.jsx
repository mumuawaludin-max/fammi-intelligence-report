import { useState } from "react";
import { useLwAgregat } from "./useLwData";
import LwLaporanPage from "./LwLaporanPage";
import { LwLaporanIndividuPage } from "./LwLaporanIndividuPage";
import styles from "./LwPage.module.css";

/**
 * LwPage -- entry point modul Leadership & Wellbeing Assessment. Berbeda dari SC/PA: modul ini
 * HANYA laporan pimpinan (desktop-first, tidak ada shell mobile self-service seperti
 * ScKaryawanPage) -- kandidat yang dinilai bukan pengguna FIR, laporannya dibaca lewat
 * drill-down dari tabel kandidat (lihat LwKandidatTable), bukan login sendiri.
 */
export default function LwPage({ session }) {
  const { loading, error, laporan } = useLwAgregat(session);
  const [kandidatId, setKandidatId] = useState(null);

  if (loading) return <div className={styles.page}><p className={styles.note}>Memuat laporan…</p></div>;
  if (error) return <div className={styles.page}><p className={styles.note}>Gagal memuat laporan: {error}</p></div>;
  if (!laporan) return <div className={styles.page}><p className={styles.note}>Belum ada data Leadership &amp; Wellbeing Assessment untuk lembaga ini.</p></div>;

  if (kandidatId && laporan.personalById[kandidatId]) {
    return (
      <div className={styles.page}>
        <LwLaporanIndividuPage personal={laporan.personalById[kandidatId]} onBack={() => setKandidatId(null)} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <LwLaporanPage laporan={laporan} onSelectKandidat={setKandidatId} />
    </div>
  );
}
