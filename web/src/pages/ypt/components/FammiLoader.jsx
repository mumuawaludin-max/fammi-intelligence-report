import styles from "./FammiLoader.module.css";

/**
 * Indikator memuat bertanda Fammi, dipakai seluruh layar dashboard YPT lewat statusPanel().
 *
 * Menggantikan teks polos "Memuat data..." yang sebelumnya muncul sendirian di tengah kotak
 * kosong. Pada halaman yang datanya besar (Rapor Karakter menarik ribuan baris skor lintas 26
 * sekolah), teks diam tanpa gerakan tidak membedakan "sedang bekerja" dari "macet", dan itu
 * persis keluhan yang muncul.
 *
 * Bentuk petirnya disalin dari public/favicon.svg, jadi tanda yang berputar di sini benar-benar
 * logo Fammi, bukan spinner generik. Warnanya ungu merek Fammi, satu-satunya tempat di seluruh
 * shell YPT yang memakai warna di luar palet Telkom -- disengaja, karena ini penanda vendor yang
 * sedang bekerja, bukan bagian dari visualisasi datanya. Jangan pakai ungu ini untuk hal lain.
 */

/** Ukuran mark dalam px. Dipakai dua kali (lebar dan tinggi proporsional 48:46). */
const UKURAN = 40;

export default function FammiLoader({ pesan = "Memuat data…" }) {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.markWrap} aria-hidden="true">
        {/* Cincin denyut di belakang mark. Dipisah dari mark supaya keduanya bisa beranimasi
            dengan irama berbeda tanpa saling mengunci. */}
        <span className={styles.denyut} />
        <svg
          className={styles.mark}
          width={UKURAN}
          height={Math.round((UKURAN * 46) / 48)}
          viewBox="0 0 48 46"
          fill="none"
        >
          <path
            d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z"
            fill="currentColor"
          />
        </svg>
      </span>

      <span className={styles.teks}>{pesan}</span>
    </div>
  );
}
