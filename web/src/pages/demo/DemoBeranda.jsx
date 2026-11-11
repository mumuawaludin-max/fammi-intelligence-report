import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CircleNotch, WarningCircle, X } from "@phosphor-icons/react";
import { formatBerlaku } from "./demoAturan";
import MozaikSistem from "../login/MozaikSistem";
import { JaringLatar, JanjiFammi, MerekFammi, Stabilo } from "../login/MerekFammi";
import tokens from "../login/loginTokens.module.css";
import styles from "./DemoBeranda.module.css";

const EASE = [0.22, 1, 0.36, 1];
const muncul = (jeda) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay: jeda },
});

/**
 * Layar demo (hash #demo), hanya terbuka sesudah server menerima kode demo. Terpisah dari halaman
 * masuk: tidak ada form username dan kode khusus di sini. Tiap ubin membawa tombol tampilannya
 * (Rapor Karakter Kepala Sekolah/Wali Kelas, Sekolah Proteksi per sudut pandang, Multiple
 * Intelligence, Culture Kelompok/Perorangan, Dashboard Keuangan); satu klik langsung membuka
 * tampilannya.
 *
 * memeriksa = true: token demo tersimpan sedang ditanyakan ke server (muat ulang di #demo).
 */
export default function DemoBeranda({
  memeriksa = false, sesi, pesan, membuka, galatTampilan, fokusTampilan,
  onFokusSelesai, onBukaTampilan, onAkhiriDemo, onKeMasuk, onTutupGalat, onTutupPesan,
}) {
  const judulRef = useRef(null);
  const tombolRef = useRef(new Map());
  const fokusTertundaRef = useRef(null);
  // Dibaca sekali saat muncul: sesudah kode diterima, fokus pindah ke judul supaya pengguna papan
  // ketik dan pembaca layar langsung berada di layar yang baru terbuka.
  const [fokusJudul] = useState(pesan?.nada === "sukses");

  // Layar baru selalu mulai dari atas (di ponsel, halaman masuk sebelumnya bisa sudah digulir).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (fokusJudul) judulRef.current?.focus({ preventScroll: true });
  }, [fokusJudul]);

  useEffect(() => {
    if (pesan?.nada !== "sukses") return undefined;
    const t = window.setTimeout(onTutupPesan, 6000);
    return () => window.clearTimeout(t);
  }, [pesan, onTutupPesan]);

  // Kembali dari tampilan: fokus ke tombol tampilan yang tadi dibuka (di ponsel sekaligus digulir
  // ke tombol itu). Kalau tombolnya belum terpasang (layar masih memeriksa sesi), fokus menunggu
  // sampai tombol itu terpasang.
  useEffect(() => {
    if (!fokusTampilan) return;
    const tombol = tombolRef.current.get(fokusTampilan);
    if (tombol) {
      tombol.focus();
      onFokusSelesai?.();
    } else {
      fokusTertundaRef.current = fokusTampilan;
    }
  }, [fokusTampilan, onFokusSelesai]);

  function daftarkanTombol(id, el) {
    if (!el) {
      tombolRef.current.delete(id);
      return;
    }
    tombolRef.current.set(id, el);
    if (fokusTertundaRef.current === id) {
      fokusTertundaRef.current = null;
      el.focus();
      onFokusSelesai?.();
    }
  }

  const siap = !memeriksa && Boolean(sesi);

  return (
    <div className={`${tokens.scope} ${styles.layar}`}>
      <div className={styles.latar} aria-hidden="true">
        <JaringLatar />
      </div>

      <header className={styles.atas}>
        <MerekFammi />
        {siap && (
          <motion.p className={styles.status} {...muncul(0)}>
            <span className={styles.titikHijau} aria-hidden="true" />
            <span>
              Akses demo aktif hingga <strong>{formatBerlaku(sesi.expiresAt)}</strong>
            </span>
            <span className={styles.pemisah} aria-hidden="true">·</span>
            <button type="button" className={styles.akhiri} onClick={onAkhiriDemo}>Akhiri demo</button>
          </motion.p>
        )}
      </header>

      <main className={styles.isi} aria-labelledby="judul-demo" aria-busy={memeriksa || undefined}>
        {/* Wadah pengumuman selalu ada supaya pembaca layar menangkap perubahan isinya. */}
        <div className={styles.srOnly} role="status" aria-live="polite">
          {memeriksa ? "Memeriksa akses demo" : pesan?.teks || ""}
        </div>

        {siap ? (
          <>
            <motion.h1 id="judul-demo" ref={judulRef} tabIndex={-1} className={styles.judul} {...muncul(0.05)}>
              <span className={styles.judulRingan}>Welcome to</span>
              <span className={styles.judulTebal}>
                Fammi <Stabilo>Intelligence</Stabilo> Report
              </span>
            </motion.h1>
            <motion.p className={styles.lead} {...muncul(0.12)}>
              Pilih tampilan di salah satu Intelligence System. Tampilan langsung terbuka tanpa perlu
              masuk akun.
            </motion.p>
            <MozaikSistem
              mode="pilih"
              className={styles.mozaik}
              sesi={sesi}
              membuka={membuka}
              onBukaTampilan={onBukaTampilan}
              daftarkanTombol={daftarkanTombol}
              jeda={0.2}
            />
          </>
        ) : (
          <div className={styles.memeriksa}>
            <h1 id="judul-demo" className={styles.srOnly}>Demo Fammi Intelligence Report</h1>
            <CircleNotch className={styles.putar} size={22} weight="bold" aria-hidden="true" />
            <p>Memeriksa akses demo</p>
          </div>
        )}
      </main>

      <footer className={styles.bawah}>
        <JanjiFammi />
        {siap && (
          <button type="button" className={styles.keMasuk} onClick={onKeMasuk}>
            <ArrowLeft size={14} weight="bold" aria-hidden="true" />
            Halaman masuk
          </button>
        )}
      </footer>

      <AnimatePresence>
        {galatTampilan && (
          <motion.div
            key={galatTampilan.id}
            className={styles.galat}
            role="alert"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <WarningCircle size={18} weight="fill" aria-hidden="true" />
            <span>{galatTampilan.pesan}</span>
            <button type="button" className={styles.galatTutup} onClick={onTutupGalat} aria-label="Tutup pemberitahuan">
              <X size={14} weight="bold" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
