// Shell pegawai: hanya laporan dirinya sendiri, mobile-first, di luar Header/NavBar desktop.
// Padanan SiswaPage/CwKaryawanPage. Isinya SwPegawaiLaporan (satu kolom, bilah bawah).

import { SignOut } from "@phosphor-icons/react";
import SwPegawaiLaporan from "./SwPegawaiLaporan";
import { useSwLaporan } from "./data/useSwLaporan";
import { SwStatus } from "./SwStatus";
import { KeadaanLayar } from "./SwUi";
import tokens from "./swTokens.module.css";
import styles from "./SwPegawaiPage.module.css";

export default function SwPegawaiPage({ session, onLogout }) {
  const { peran, loading, error, dataset, akses } = useSwLaporan(session);
  return (
    <div className={`${tokens.scope} ${styles.shell}`}>
      <header className={styles.bar}>
        <img src="/logo-purple.png" alt="Fammi" className={styles.logo} />
        <span className={styles.nama}>{session.nama}</span>
        <button type="button" className={styles.keluar} onClick={onLogout}>
          <SignOut size={16} weight="bold" aria-hidden="true" /> Keluar
        </button>
      </header>
      <SwStatus peran={peran} loading={loading} error={error} dataset={dataset}>
        {akses.individuId ? (
          <SwPegawaiLaporan dataset={dataset} akses={akses} />
        ) : (
          <div className={styles.kosong}>
            <KeadaanLayar jenis="kosong" judul="Akun Anda belum tertaut ke hasil screening" pesan="Hubungi tim Fammi agar akun ini dihubungkan dengan isian Anda." />
          </div>
        )}
      </SwStatus>
    </div>
  );
}
