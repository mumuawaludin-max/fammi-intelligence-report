import { useCallback, useEffect, useRef, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { ArrowRight, CircleNotch, Clock, Eye, EyeSlash, Key, LockSimple, User, X } from "@phosphor-icons/react";
import { keluarAkunDemo, loginSupabase, masukAkunDemo, saveSession } from "../lib/auth";
import DemoAccessDialog from "./login/DemoAccessDialog";
import MozaikSistem from "./login/MozaikSistem";
import { JaringLatar, JanjiFammi, MerekFammi, Stabilo } from "./login/MerekFammi";
import DemoBeranda from "./demo/DemoBeranda";
import DemoReportViewer from "./demo/DemoReportViewer";
import { useDemoSession } from "./demo/useDemoSession";
import { PESAN_TAMPILAN, formatBerlaku, sesiMati } from "./demo/demoAturan";
import { bacaRuteDemo, cariSistem, cariTampilan } from "./demo/demoSystems";
import { gantiRuteDemo } from "./demo/ruteDemo";
import tokens from "./login/loginTokens.module.css";
import styles from "./LoginPage.module.css";

const EASE = [0.22, 1, 0.36, 1];
const muncul = (jeda) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: EASE, delay: jeda },
});

const RUTE_MASUK = { layar: "masuk", sistem: null };
const RUTE_DEMO = { layar: "demo", sistem: null };

function tampilanHtml(idSistem) {
  return cariSistem(idSistem)?.tampilan.find((t) => t.jenis === "html")?.id ?? null;
}

/**
 * LoginPage: gerbang masuk Fammi Intelligence Report, tiga layar lewat hash URL (demo/ruteDemo.js):
 *
 *   ""            halaman masuk. Kiri: pengantar lima Intelligence System, ubin informasi saja.
 *                 Kanan: form masuk akun, alurnya tidak berubah (username + kode khusus ke
 *                 Supabase Auth). Demo cuma tautan kecil "Lihat demo aplikasi" yang membuka dialog
 *                 kode demo. Muat satu layar tanpa gulir di laptop.
 *   "#demo"       layar demo (DemoBeranda), hanya terbuka selama server menyatakan sesi demo sah.
 *                 Di sinilah tombol tampilan berada. Tidak ada username atau kode khusus:
 *                 - tampilan "akun" (Rapor Karakter, Kesehatan Mental Anak, Multiple Intelligence,
 *                   Culture): Edge Function demo-masuk memeriksa sesi demo lalu mengembalikan sesi
 *                   akun demo. Halaman ini memasangnya dan masuk ke aplikasi dengan penanda `demo`
 *                   (App.jsx menampilkan bilah "Mode demo" dan keluar hanya dari browser ini).
 *                 - tampilan "html" (Dashboard Keuangan): laporan HTML dari server.
 *   "#demo/<id>"  penampil laporan HTML (DemoReportViewer).
 *
 * Aturan aksesnya di pages/demo/ dan docs/demo-access.md.
 */
export default function LoginPage({ onLogin, notice, demoKeluar = null }) {
  const demo = useDemoSession(demoKeluar?.status ?? null);
  const { aktifkan, akhiri, kunciKarena, hapusPesan, verifikasi, ambilLaporanHtml, masukTampilan } = demo;

  const [rute, setRute] = useState(() => bacaRuteDemo(window.location.hash));
  const ruteRef = useRef(rute);
  const [dialogBuka, setDialogBuka] = useState(false);
  const [fokusTampilan, setFokusTampilan] = useState(() => demoKeluar?.tampilan ?? null);
  const [membuka, setMembuka] = useState(null);
  const [galatTampilan, setGalatTampilan] = useState(null);
  const membukaRef = useRef(null);

  useEffect(() => {
    ruteRef.current = rute;
  }, [rute]);

  // Back dan Forward browser. Hash hanya dibaca sebagai id registri, tidak pernah sebagai path.
  useEffect(() => {
    function saatNavigasi() {
      const baru = bacaRuteDemo(window.location.hash);
      const lama = ruteRef.current;
      if (lama.layar === "laporan" && baru.layar !== "laporan") setFokusTampilan(tampilanHtml(lama.sistem));
      ruteRef.current = baru;
      setRute(baru);
    }
    window.addEventListener("popstate", saatNavigasi);
    window.addEventListener("hashchange", saatNavigasi);
    return () => {
      window.removeEventListener("popstate", saatNavigasi);
      window.removeEventListener("hashchange", saatNavigasi);
    };
  }, []);

  // Tanpa sesi demo, layar demo dan laporan tidak terbuka: alamatnya dikembalikan ke halaman masuk.
  const terkunci = demo.fase === "terkunci";
  useEffect(() => {
    if (terkunci && rute.layar !== "masuk") gantiRuteDemo(RUTE_MASUK);
  }, [terkunci, rute.layar]);

  const layar = terkunci ? "masuk" : rute.layar;

  const pindah = useCallback((tujuan, opsi) => {
    gantiRuteDemo(tujuan, opsi);
    ruteRef.current = tujuan;
    setRute(tujuan);
  }, []);

  // ── Laporan HTML demo ────────────────────────────────────────────────────────────────────
  const bukaLaporan = useCallback((idSistem) => {
    if (!cariSistem(idSistem)) return;
    pindah({ layar: "laporan", sistem: idSistem }, { tambah: true });
  }, [pindah]);

  const tutupLaporan = useCallback(() => {
    setFokusTampilan(tampilanHtml(ruteRef.current.sistem));
    // Laporan selalu dibuka dari layar demo, jadi entri riwayat sebelumnya adalah layar demo.
    if (window.history.state?.firDemo === "laporan") {
      window.history.back();
      return;
    }
    pindah(RUTE_DEMO);
  }, [pindah]);

  const selesaiFokus = useCallback(() => setFokusTampilan(null), []);

  // ── Tampilan demo ────────────────────────────────────────────────────────────────────────
  const bukaTampilan = useCallback(async (idTampilan) => {
    const tampilan = cariTampilan(idTampilan);
    if (!tampilan || membukaRef.current) return;
    setGalatTampilan(null);

    if (tampilan.jenis === "html") {
      bukaLaporan(tampilan.sistem);
      return;
    }

    membukaRef.current = idTampilan;
    setMembuka(idTampilan);
    const selesaiGagal = (pesan) => {
      membukaRef.current = null;
      setMembuka(null);
      setGalatTampilan({ id: idTampilan, pesan });
    };

    const hasil = await masukTampilan(idTampilan);
    if (hasil.status !== "ok") {
      if (sesiMati(hasil.status)) {
        membukaRef.current = null;
        setMembuka(null);
        kunciKarena(hasil.status);
        return;
      }
      selesaiGagal(PESAN_TAMPILAN[hasil.status] || PESAN_TAMPILAN.galat);
      return;
    }

    const sistem = cariSistem(tampilan.sistem);
    const banyak = sistem.tampilan.length > 1;
    try {
      const sesiFir = await masukAkunDemo(hasil.sesiAkun, {
        tampilan: tampilan.id,
        sistem: sistem.id,
        judul: sistem.judul,
        label: banyak ? `${tampilan.grup} ${tampilan.label}` : tampilan.label,
      });
      saveSession(sesiFir);
      onLogin(sesiFir);
    } catch {
      await keluarAkunDemo();
      selesaiGagal(PESAN_TAMPILAN.akun_gagal);
    }
  }, [bukaLaporan, kunciKarena, masukTampilan, onLogin]);

  // ── Dialog kode demo dan perpindahan layar ───────────────────────────────────────────────
  const bukaDialog = useCallback(() => setDialogBuka(true), []);
  const tutupDialog = useCallback(() => setDialogBuka(false), []);
  const saatTerverifikasi = useCallback((sesi) => {
    setGalatTampilan(null);
    aktifkan(sesi);
    setDialogBuka(false);
    pindah(RUTE_DEMO, { tambah: true });
  }, [aktifkan, pindah]);

  const lanjutkanDemo = useCallback(() => pindah(RUTE_DEMO, { tambah: true }), [pindah]);
  const keHalamanMasuk = useCallback(() => pindah(RUTE_MASUK, { tambah: true }), [pindah]);
  const akhiriDemo = useCallback(() => {
    setGalatTampilan(null);
    akhiri();
    pindah(RUTE_MASUK);
  }, [akhiri, pindah]);
  const tutupGalat = useCallback(() => setGalatTampilan(null), []);

  let isi;
  if (layar === "laporan" && demo.fase === "aktif") {
    isi = (
      <DemoReportViewer
        sistemId={rute.sistem}
        sesi={demo.sesi}
        onKembali={tutupLaporan}
        ambilLaporanHtml={ambilLaporanHtml}
        onSesiMati={kunciKarena}
      />
    );
  } else if (layar !== "masuk") {
    isi = (
      <DemoBeranda
        memeriksa={demo.fase === "memeriksa"}
        sesi={demo.sesi}
        pesan={demo.pesan}
        membuka={membuka}
        galatTampilan={galatTampilan}
        fokusTampilan={fokusTampilan}
        onFokusSelesai={selesaiFokus}
        onBukaTampilan={bukaTampilan}
        onAkhiriDemo={akhiriDemo}
        onKeMasuk={keHalamanMasuk}
        onTutupGalat={tutupGalat}
        onTutupPesan={hapusPesan}
      />
    );
  } else {
    isi = (
      <LayarMasuk
        onLogin={onLogin}
        notice={notice}
        fase={demo.fase}
        sesi={demo.sesi}
        pesan={demo.pesan}
        tertutupDialog={dialogBuka}
        onBukaDemo={bukaDialog}
        onLanjutkanDemo={lanjutkanDemo}
        onTutupPesan={hapusPesan}
      />
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {isi}
      <DemoAccessDialog open={dialogBuka} onClose={tutupDialog} onVerified={saatTerverifikasi} verifikasi={verifikasi} />
    </MotionConfig>
  );
}

/**
 * Halaman masuk: pengantar dan form akun. Urutan DOM (judul, form, lalu ubin) sengaja menaruh form
 * tepat sesudah judul, supaya di ponsel form langsung terlihat dan pembaca layar sampai ke form
 * lebih dulu. Di layar lebar grid menaruh form di kolom kanan.
 */
function LayarMasuk({ onLogin, notice, fase, sesi, pesan, tertutupDialog, onBukaDemo, onLanjutkanDemo, onTutupPesan }) {
  const [username, setUsername] = useState("");
  const [kode, setKode]         = useState("");
  const [showKode, setShowKode] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const usernameRef = useRef(null);
  const ctaRef = useRef(null);

  // Dibaca sekali saat layar muncul, yang selalu mulai dari atas. Kembali dari demo yang berakhir:
  // fokus ke tautan demo di dekat pesannya (di ponsel sekaligus digulir ke sana). Selain itu,
  // desktop langsung menaruh kursor di username seperti sebelumnya; ponsel tidak, supaya papan
  // ketik tidak menutupi pengantar.
  const [pesanAwal] = useState(pesan);
  useEffect(() => {
    window.scrollTo(0, 0);
    if (pesanAwal && pesanAwal.nada !== "sukses") {
      ctaRef.current?.focus();
    } else if (window.matchMedia?.("(min-width: 921px)").matches) {
      usernameRef.current?.focus({ preventScroll: true });
    }
  }, [pesanAwal]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim()) { setError("Username wajib diisi."); return; }
    if (!kode.trim())     { setError("Kode khusus wajib diisi."); return; }

    setLoading(true);
    try {
      const session = await loginSupabase(username, kode);
      saveSession(session);
      onLogin(session);
    } catch (err) {
      setError(err.message || "Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const pesanTampak = pesan && pesan.nada !== "sukses" ? pesan : null;

  return (
    <div className={`${tokens.scope} ${styles.page}`} inert={tertutupDialog ? true : undefined}>
      <div className={styles.latar} aria-hidden="true">
        <JaringLatar />
      </div>

      <header className={styles.atas}>
        <MerekFammi />
      </header>

      <motion.h1 className={styles.judul} {...muncul(0)}>
        <span className={styles.judulRingan}>One School.</span>
        <span className={styles.judulTebal}>
          Five <Stabilo>Intelligence</Stabilo> Systems.
        </span>
      </motion.h1>

      {/* ════ Form masuk akun ════ */}
      <main id="form-masuk" className={styles.form} aria-labelledby="judul-masuk">
        <div className={styles.kartu}>
          <p className={styles.formEyebrow}>Fammi Intelligence Report</p>
          <h2 id="judul-masuk" className={styles.formTitle}>Masuk ke laporan Anda</h2>
          <p className={styles.formSub}>Gunakan username dan kode khusus yang telah diberikan kepada Anda.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel} htmlFor="username">Username</label>
              </div>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><User size={19} weight="bold" aria-hidden="true" /></span>
                <input
                  ref={usernameRef}
                  id="username"
                  className={styles.input}
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mis. budi.santoso"
                  disabled={loading}
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel} htmlFor="kode">Kode khusus</label>
                <span className={styles.hint}>diberikan tim Fammi</span>
              </div>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Key size={19} weight="bold" aria-hidden="true" /></span>
                <input
                  id="kode"
                  className={`${styles.input} ${styles.inputPad}`}
                  type={showKode ? "text" : "password"}
                  autoComplete="current-password"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  placeholder="Masukkan kode khusus"
                  disabled={loading}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowKode((s) => !s)}
                  aria-label={showKode ? "Sembunyikan kode khusus" : "Tampilkan kode khusus"}
                  aria-pressed={showKode}
                >
                  {showKode ? <EyeSlash size={19} weight="bold" aria-hidden="true" /> : <Eye size={19} weight="bold" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {!error && notice && <div className={styles.noticeMsg} role="status">{notice}</div>}
            {error && <div className={styles.errorMsg} role="alert">{error}</div>}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
              {loading ? "Memverifikasi" : "Buka laporan saya"}
              {!loading && <ArrowRight size={18} weight="bold" aria-hidden="true" />}
            </button>
          </form>

          <p className={styles.help}>
            Butuh bantuan masuk? <a href="https://fammi.ly/" target="_blank" rel="noopener noreferrer">Hubungi tim Fammi</a>
          </p>
        </div>
      </main>

      <motion.p className={styles.lead} {...muncul(0.08)}>
        Satu ekosistem terintegrasi untuk memahami, mendampingi, dan memperkuat kualitas sekolah secara menyeluruh.
      </motion.p>

      <MozaikSistem mode="info" className={styles.mozaik} jeda={0.16} />

      <motion.div className={styles.demo} {...muncul(0.42)}>
        {/* Wadah pengumuman selalu ada supaya pembaca layar menangkap perubahan isinya. */}
        <div className={styles.srOnly} role="status" aria-live="polite">{pesanTampak?.teks || ""}</div>

        {pesanTampak && fase !== "aktif" && (
          <p className={`${styles.pesanDemo} ${pesanTampak.nada === "peringatan" ? styles.pesanPeringatan : ""}`}>
            {pesanTampak.nada === "peringatan"
              ? <Clock size={16} weight="bold" aria-hidden="true" />
              : <LockSimple size={16} weight="bold" aria-hidden="true" />}
            <span>{pesanTampak.teks}</span>
            <button type="button" className={styles.pesanTutup} onClick={onTutupPesan} aria-label="Tutup pemberitahuan">
              <X size={13} weight="bold" aria-hidden="true" />
            </button>
          </p>
        )}

        {fase === "memeriksa" && (
          <p className={styles.demoTeks}>
            <CircleNotch className={styles.putar} size={15} weight="bold" aria-hidden="true" />
            Memeriksa akses demo
          </p>
        )}
        {fase === "aktif" && sesi && (
          <p className={styles.demoTeks}>
            <span className={styles.titikHijau} aria-hidden="true" />
            <span>Akses demo Anda aktif hingga <strong>{formatBerlaku(sesi.expiresAt)}</strong>.</span>
            <button ref={ctaRef} type="button" className={styles.tautanDemo} onClick={onLanjutkanDemo}>
              Lanjutkan demo
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </button>
          </p>
        )}
        {fase === "terkunci" && (
          <p className={styles.demoTeks}>
            Sudah punya kode demo dari tim Fammi?
            <button ref={ctaRef} type="button" className={styles.tautanDemo} onClick={onBukaDemo} aria-haspopup="dialog">
              Lihat demo aplikasi
              <ArrowRight size={14} weight="bold" aria-hidden="true" />
            </button>
          </p>
        )}
      </motion.div>

      <footer className={styles.bawah}>
        <JanjiFammi />
      </footer>
    </div>
  );
}
