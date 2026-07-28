import { PaReveal } from "./PaReveal";
import { PaIconBadge } from "./paIconBadge";
import tokens from "./paTokens.module.css";
import styles from "./PaComingSoon.module.css";

/**
 * PaComingSoon -- tampil untuk peran yang bisa menjangkau tab "pa" tapi belum jadi target
 * tahap ini (KepalaSekolah, WakilKepalaSekolah, WaliKelas, Manajemen). Modul Perilaku Anak
 * dirilis bertahap: Yayasan lebih dulu, peran lain menyusul kemudian.
 *
 * Framing di sini SENGAJA "segera hadir" (positif, menunggu giliran), BUKAN pesan "akses
 * ditolak" -- supaya tidak terbaca seperti masalah perizinan padahal memang belum saatnya.
 */
export function PaComingSoon() {
  return (
    <PaReveal className={`${tokens.scope} ${styles.wrap}`}>
      <PaIconBadge icon="sparkle" size="lg" tone="gold" />
      <h1 className={styles.title}>Segera Hadir</h1>
      <p className={styles.desc}>
        Modul Perilaku Anak sedang dirilis bertahap, dimulai dari peran Yayasan lebih dulu.
        Laporan untuk peran Anda sedang disiapkan dan akan menyusul di tahap berikutnya.
      </p>
    </PaReveal>
  );
}
