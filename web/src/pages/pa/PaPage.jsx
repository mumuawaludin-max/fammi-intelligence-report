import PaLaporanPage from "./PaLaporanPage";
import { PaComingSoon } from "./PaComingSoon";
import styles from "./PaPage.module.css";

/**
 * PaPage -- pintu masuk modul Perilaku Anak. Tahap ini SENGAJA cuma dibuka penuh untuk peran
 * Yayasan, instruksi eksplisit pemilik produk. Peran lain yang bisa menjangkau komponen ini
 * lewat tab "pa" (KepalaSekolah, WakilKepalaSekolah, WaliKelas, Manajemen -- tergantung entitlement
 * `pa` sekolah/organisasi itu di `school_modules`) melihat PaComingSoon, bukan pesan terkunci
 * generik. Siswa/OrangTua/Karyawan/AdminFammi tidak pernah sampai ke komponen ini sama sekali,
 * App.jsx sudah mengalihkan mereka lebih dulu ke shell masing-masing (lihat App.jsx) -- jadi
 * penjaga di sini murni soal Yayasan vs peran lain yang berbagi shell desktop yang sama.
 */
export default function PaPage({ session }) {
  if (session?.peran !== "Yayasan") {
    return (
      <div className={styles.page}>
        <PaComingSoon />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PaLaporanPage session={session} />
    </div>
  );
}
