import ScLaporanIndividuPage from "./ScLaporanIndividuPage";
import { useScIndividu } from "./useScData";
import styles from "./ScKaryawanPage.module.css";

function IconLogout({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/**
 * ScKaryawanPage -- shell MANDIRI untuk staf sekolah (peran Karyawan, modul School Culture aktif
 * untuk sekolahnya), sepenuhnya di luar shell desktop App.jsx (Header/NavBar/main). Struktur
 * PERSIS pages/cw/CwKaryawanPage.jsx (mobile view only, position:fixed ambil-alih viewport
 * penuh) atas instruksi eksplisit pemilik produk ("UI/UX yang sama") -- modul SC sengaja tetap
 * berdiri sendiri sebagai berkas (bukan impor lintas-modul), lihat sc.types.ts.
 *
 * App.jsx memilih komponen ini alih-alih CwKaryawanPage kalau session.modules memuat "sc"
 * (bukan "cw") -- lihat blok `if (session.peran === "Karyawan")` di App.jsx.
 *
 * Data ASLI dari sc_hasil lewat useScIndividu (bukan lagi sc.mock.ts) -- RLS membatasi baris
 * yang kembali ke milik profiles.sc_responden_id akun ini sendiri, status='disetujui' saja.
 */
export default function ScKaryawanPage({ session, onLogout }) {
  const { loading, error, data: laporan } = useScIndividu(session);

  return (
    <div className={styles.root}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <span className={styles.logo}>Fammi</span>
          <div className={styles.headerRight}>
            <span className={styles.headerMeta}>School Culture</span>
            {onLogout && (
              <button type="button" className={styles.logoutBtn} onClick={onLogout} aria-label="Keluar">
                <IconLogout />
              </button>
            )}
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.content}>
            {loading ? (
              <p className={styles.stateMsg}>Memuat laporan…</p>
            ) : error ? (
              <p className={styles.stateMsg}>Gagal memuat laporan: {error}</p>
            ) : laporan ? (
              <ScLaporanIndividuPage laporan={laporan} viewerIsOwner />
            ) : (
              <p className={styles.stateMsg}>Laporan Anda belum tersedia atau belum disetujui untuk periode ini.</p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
