import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CheckCircle, LockKey, ShieldCheck, WarningCircle, X } from "@phosphor-icons/react";
import { PESAN_VERIFIKASI, normalisasiKode, rapikanKetikan } from "../demo/demoAturan";
import tokens from "./loginTokens.module.css";
import styles from "./DemoAccessDialog.module.css";

const EASE = [0.22, 1, 0.36, 1];
const JEDA_BERHASIL_MS = 1200;
const BISA_DIFOKUS = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

/**
 * Dialog kode demo. Kode dikirim ke server lewat `verifikasi` (useDemoSession -> demo_verify di
 * Postgres); dialog ini tidak pernah memutuskan sendiri apakah kode sah.
 *
 * Keadaan: diam, memeriksa, berhasil, lalu salah satu pesan gagal (tidak valid, kedaluwarsa,
 * dicabut, habis jatah, terlalu banyak percobaan, gangguan server).
 */
export default function DemoAccessDialog({ open, onClose, onVerified, verifikasi }) {
  return createPortal(
    <AnimatePresence>
      {open && <IsiDialog key="dialog-demo" onClose={onClose} onVerified={onVerified} verifikasi={verifikasi} />}
    </AnimatePresence>,
    document.body,
  );
}

function IsiDialog({ onClose, onVerified, verifikasi }) {
  const id = useId();
  const [kode, setKode] = useState("");
  const [fase, setFase] = useState("diam");
  const [galat, setGalat] = useState(null);
  const sesiRef = useRef(null);
  const terkirimRef = useRef(false);
  const dialogRef = useRef(null);
  const inputRef = useRef(null);

  // Fokus ke kolom kode saat dibuka, kembali ke pemicu saat ditutup (kalau pemicunya masih ada).
  useEffect(() => {
    const pemicu = document.activeElement;
    const bingkai = window.requestAnimationFrame(() => inputRef.current?.focus());
    const gulirAwal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.cancelAnimationFrame(bingkai);
      document.body.style.overflow = gulirAwal;
      if (pemicu instanceof HTMLElement && pemicu.isConnected) pemicu.focus({ preventScroll: true });
    };
  }, []);

  // Sesudah tanda berhasil tampil sebentar, panel kiri dibuka. Menutup dialog lebih cepat
  // (Esc, Kembali) langsung membukanya; keduanya tidak pernah meneruskan dua kali.
  const teruskan = useCallback(() => {
    if (terkirimRef.current || !sesiRef.current) return;
    terkirimRef.current = true;
    onVerified(sesiRef.current);
  }, [onVerified]);

  useEffect(() => {
    if (fase !== "berhasil") return undefined;
    const t = window.setTimeout(teruskan, JEDA_BERHASIL_MS);
    return () => window.clearTimeout(t);
  }, [fase, teruskan]);

  function tutup() {
    if (fase === "memeriksa") return;
    if (fase === "berhasil") {
      teruskan();
      return;
    }
    onClose();
  }

  function tanganiTombol(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      tutup();
      return;
    }
    if (e.key !== "Tab" || !dialogRef.current) return;
    const daftar = [...dialogRef.current.querySelectorAll(BISA_DIFOKUS)];
    if (daftar.length === 0) return;
    const pertama = daftar[0];
    const terakhir = daftar[daftar.length - 1];
    if (e.shiftKey && document.activeElement === pertama) {
      e.preventDefault();
      terakhir.focus();
    } else if (!e.shiftKey && document.activeElement === terakhir) {
      e.preventDefault();
      pertama.focus();
    }
  }

  async function kirim(e) {
    e.preventDefault();
    if (fase !== "diam") return;
    if (!normalisasiKode(kode)) {
      setGalat({ status: "kosong", pesan: PESAN_VERIFIKASI.kosong });
      inputRef.current?.focus();
      return;
    }
    setGalat(null);
    setFase("memeriksa");
    const hasil = await verifikasi(kode);
    if (hasil.status === "valid") {
      sesiRef.current = hasil.sesi;
      setFase("berhasil");
      return;
    }
    setFase("diam");
    setGalat({ status: hasil.status, pesan: hasil.pesan || PESAN_VERIFIKASI.galat });
    window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }

  const memeriksa = fase === "memeriksa";

  return (
    <motion.div
      className={`${tokens.scope} ${styles.tirai}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) tutup();
      }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-judul`}
        aria-describedby={`${id}-desk`}
        className={styles.dialog}
        onKeyDown={tanganiTombol}
        initial={{ opacity: 0, y: 22, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.36, ease: EASE }}
      >
        <button type="button" className={styles.tutup} onClick={tutup} disabled={memeriksa} aria-label="Tutup dialog kode demo">
          <X size={18} weight="bold" aria-hidden="true" />
        </button>

        <AnimatePresence mode="wait" initial={false}>
          {fase === "berhasil" ? (
            <motion.div
              key="berhasil"
              className={styles.berhasil}
              role="status"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <motion.span
                className={styles.berhasilIkon}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
              >
                <CheckCircle size={44} weight="fill" aria-hidden="true" />
              </motion.span>
              <p className={styles.eyebrow}>Kode terverifikasi</p>
              <h2 id={`${id}-judul`} className={styles.judul}>Akses demo diberikan.</h2>
              <p id={`${id}-desk`} className={styles.desk}>Lima Intelligence System sedang dibuka untuk Anda.</p>
              <span className={styles.progres} aria-hidden="true">
                <motion.span
                  className={styles.progresIsi}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: JEDA_BERHASIL_MS / 1000, ease: "linear" }}
                />
              </span>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className={styles.kepala}>
                <span className={styles.gembok} aria-hidden="true">
                  <LockKey size={22} weight="duotone" />
                </span>
                <p className={styles.eyebrow}>Fammi Intelligence Experience</p>
              </div>
              <h2 id={`${id}-judul`} className={styles.judul}>Explore the Intelligence Behind Your School.</h2>
              <p id={`${id}-desk`} className={styles.desk}>
                Masukkan kode demo khusus yang telah diberikan oleh tim Fammi untuk mengakses contoh Intelligence Report.
              </p>

              <form className={styles.form} onSubmit={kirim} noValidate aria-busy={memeriksa}>
                <label htmlFor={`${id}-kode`} className={styles.label}>Kode akses demo</label>
                <input
                  ref={inputRef}
                  id={`${id}-kode`}
                  className={`${styles.input} ${galat ? styles.inputGalat : ""}`}
                  value={kode}
                  onChange={(e) => {
                    setKode(rapikanKetikan(e.target.value));
                    if (galat) setGalat(null);
                  }}
                  placeholder="Masukkan kode demo Anda"
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="go"
                  maxLength={40}
                  required
                  aria-required="true"
                  aria-invalid={galat ? true : undefined}
                  aria-describedby={galat ? `${id}-galat` : `${id}-format`}
                  disabled={memeriksa}
                />
                {galat ? (
                  <p id={`${id}-galat`} className={styles.galat} role="alert">
                    <WarningCircle size={17} weight="fill" aria-hidden="true" />
                    <span>{galat.pesan}</span>
                  </p>
                ) : (
                  <p id={`${id}-format`} className={styles.format}>Format XXXX-XXXX-XXXX. Huruf besar atau kecil sama saja.</p>
                )}
                <span className={styles.srOnly} role="status">{memeriksa ? "Memverifikasi kode demo" : ""}</span>

                <div className={styles.aksi}>
                  <button type="submit" className={styles.verifikasi} disabled={memeriksa}>
                    {memeriksa ? (
                      <>
                        <span className={styles.putar} aria-hidden="true" />
                        Memverifikasi
                      </>
                    ) : (
                      <>
                        Verifikasi kode
                        <ArrowRight size={17} weight="bold" aria-hidden="true" />
                      </>
                    )}
                  </button>
                  <button type="button" className={styles.kembali} onClick={tutup} disabled={memeriksa}>
                    Kembali
                  </button>
                </div>
              </form>

              <p className={styles.catatan}>
                <ShieldCheck size={17} weight="duotone" aria-hidden="true" />
                Akses demo terbatas untuk pengguna yang memiliki kode resmi dari Fammi.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
