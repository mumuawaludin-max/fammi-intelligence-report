import SampleTag from "../../components/SampleTag";
import CwLaporanIndividuPage from "./CwLaporanIndividuPage";
import { MOCK_LAPORAN_INDIVIDU_CW } from "./cw.mock";
import styles from "./CwKaryawanPage.module.css";

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
 * CwKaryawanPage -- shell MANDIRI untuk peran Karyawan, sepenuhnya di luar shell desktop
 * App.jsx (Header/NavBar/main). Strukturnya PERSIS SiswaPage.jsx atas instruksi eksplisit
 * pemilik produk ("harus sama dengan laporan siswa/orangtua, mobile view only"):
 *
 *   1. Root fixed, ambil alih seluruh viewport (position:fixed inset:0), berlatar netral.
 *   2. Bingkai "phone" terkunci max-width 440px, terpusat, height:100% -- TIDAK pernah
 *      melebar jadi dashboard di layar besar, beda dari shell Manajemen yang memang
 *      dashboard desktop. Ini yang dimaksud "mobile view only": bukan cuma responsive,
 *      tapi dikunci ke lebar HP bahkan saat dibuka di browser desktop.
 *   3. Header sticky tipis (logo + tombol keluar) di dalam area scroll, bukan Header.jsx
 *      generik yang didesain untuk dashboard lebar.
 *   4. Konten laporan (CwLaporanIndividuPage) di area scroll dengan padding mobile.
 *
 * App.jsx me-render komponen ini lewat early-return SEBELUM masuk ke shell generik --
 * lihat blok `if (session.peran === "Karyawan")`, persis pola Siswa/OrangTua.
 */
export default function CwKaryawanPage({ session, onLogout }) {
  // Data masih dummy -- tabel cw_* belum ada, lihat catatan di CwPage.jsx.
  const laporan = MOCK_LAPORAN_INDIVIDU_CW[0];

  return (
    <div className={styles.root}>
      <div className={styles.phone}>
        <header className={styles.header}>
          <span className={styles.logo}>Fammi</span>
          <div className={styles.headerRight}>
            <span className={styles.headerMeta}>Culture &amp; Wellbeing</span>
            {onLogout && (
              <button type="button" className={styles.logoutBtn} onClick={onLogout} aria-label="Keluar">
                <IconLogout />
              </button>
            )}
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.content}>
            <div className={styles.sampleRow}><SampleTag /></div>
            <CwLaporanIndividuPage laporan={laporan} />
          </div>
        </main>
      </div>
    </div>
  );
}
