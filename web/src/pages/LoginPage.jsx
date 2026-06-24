import { useState } from "react";
import { gasClient, GasError } from "../lib/gasClient";
import { hashPin, saveSession } from "../lib/auth";
import styles from "./LoginPage.module.css";

/**
 * LoginPage — gerbang masuk Fammi Intelligence Report.
 *
 * Panel kiri memajang nilai produk (modular, banyak screening jadi satu laporan).
 * Panel kanan form masuk: username + kode khusus, diverifikasi lewat GAS.
 * Wording general: dipakai orang tua, sekolah, maupun korporat.
 */

const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
function IcCheck({ size = 13 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><polyline points="20 6 9 17 4 12" /></svg>; }
function IcUser({ size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>; }
function IcKey({ size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><circle cx="7.5" cy="15.5" r="4.5" /><path d="M10.7 12.3 21 2M16 7l3 3M14 9l2.5 2.5" /></svg>; }
function IcEye({ size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>; }
function IcEyeOff({ size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M9.9 4.2A10.9 10.9 0 0 1 12 4c6.5 0 10 7 10 7a18 18 0 0 1-3 3.7M6.6 6.6A18 18 0 0 0 2 11s3.5 7 10 7a10.8 10.8 0 0 0 4.6-1M3 3l18 18M9.5 9.6A3 3 0 0 0 14.4 13.8" /></svg>; }
function IcArrow({ size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function IcLock({ size = 15 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><rect x="4.5" y="11" width="15" height="9.5" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>; }
function IcClipboard({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><rect x="5" y="4" width="14" height="17" rx="2.5" /><path d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6H9zM9 11h6M9 15h4" /></svg>; }
function IcTarget({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" /></svg>; }
function IcTrend({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M3 17l6-6 4 4 7-7" /><path d="M17 7h4v4" /></svg>; }
function IcSpark({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l1.8 5.4L19 9l-5.2 1.6L12 16l-1.8-5.4L5 9l5.2-1.6z" /></svg>; }
function IcArrowUp({ size = 11 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M12 19V5M6 11l6-6 6 6" /></svg>; }

const CHECKS = [
  "Satu portal untuk semua jenis screening Fammi",
  "Insight dirangkum otomatis, tanpa olah data manual",
  "Lengkap dengan rekomendasi langkah berikutnya",
];

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [kode, setKode]         = useState("");
  const [showKode, setShowKode] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim()) { setError("Username wajib diisi."); return; }
    if (!kode.trim())     { setError("Kode khusus wajib diisi."); return; }

    setLoading(true);
    try {
      const kredensial_hash = await hashPin(kode);
      const result = await gasClient.post("login", { username: username.trim(), kredensial_hash });

      const session = {
        token:   result.token,
        user_id: result.user_id,
        nama:    result.nama,
        peran:   result.peran,
      };
      saveSession(session);
      onLogin(session);
    } catch (err) {
      setError(err instanceof GasError ? err.message : "Tidak dapat menghubungi server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      {/* ════ Panel brand (kiri) ════ */}
      <aside className={styles.brand}>
        <div className={styles.logoRow}>
          <span className={styles.logoMark}><img src="/favicon-512.png" alt="Fammi" /></span>
          <div>
            <div className={styles.logoName}>Fammi</div>
            <div className={styles.kicker}><span className={styles.kbar} />Intelligence Report</div>
          </div>
        </div>

        <div className={styles.brandBody}>
          <h1 className={styles.headline}>Banyak screening.<br />Satu laporan cerdas.</h1>
          <p className={styles.lead}>
            Fammi Intelligence Report menyatukan seluruh hasil asesmen dan screening Anda
            menjadi satu laporan yang ringkas, jelas, dan siap ditindaklanjuti.
          </p>

          <div className={styles.checks}>
            {CHECKS.map((t) => (
              <div key={t} className={styles.checkItem}>
                <span className={styles.checkIcon}><IcCheck /></span>{t}
              </div>
            ))}
          </div>

          <div className={styles.preview}>
            <div className={styles.previewHead}>
              <span className={styles.previewBrand}><img src="/favicon-512.png" alt="" /> Fammi Intelligence Report</span>
              <span className={`${styles.badge} ${styles.bMint}`}><span className={styles.badgeDot} /> Hari ini</span>
            </div>
            <div className={styles.previewBig}>
              <span className={styles.previewNum}>12</span>
              <span className={styles.previewNumSub}>screening dirangkum<br />jadi satu laporan utuh</span>
            </div>
            <div className={styles.previewBar}><span className={styles.previewBarFill} /></div>
            <div className={styles.previewList}>
              <PreviewRow tile="iSky" icon={<IcClipboard />} label="Asesmen & kuesioner"
                badge={<span className={`${styles.badge} ${styles.bMint}`}>Lengkap</span>} />
              <PreviewRow tile="iSun" icon={<IcTarget />} label="Minat & potensi"
                badge={<span className={`${styles.badge} ${styles.bMint}`}>Lengkap</span>} />
              <PreviewRow tile="iMint" icon={<IcTrend />} label="Tren antarwaktu"
                badge={<span className={`${styles.badge} ${styles.bSun}`}><IcArrowUp /> Naik</span>} />
              <PreviewRow tile="iBlossom" icon={<IcSpark />} label="Rekomendasi langkah"
                badge={<span className={`${styles.badge} ${styles.bBlossom}`}>5 baru</span>} />
            </div>
          </div>
        </div>

        <div className={styles.brandFoot}>
          <IcLock /> Akses aman dan terenkripsi, sesuai peran masing-masing.
        </div>
      </aside>

      {/* ════ Panel form (kanan) ════ */}
      <main className={styles.form}>
        <div className={styles.formInner}>
          <div className={styles.formEyebrow}><img src="/favicon-512.png" alt="" /> Fammi Intelligence Report</div>
          <h2 className={styles.formTitle}>Masuk ke laporan Anda</h2>
          <p className={styles.formSub}>Gunakan username dan kode khusus yang telah diberikan kepada Anda.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel} htmlFor="username">Username</label>
              </div>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><IcUser /></span>
                <input
                  id="username"
                  className={styles.input}
                  type="text"
                  autoComplete="username"
                  autoFocus
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
                <span className={styles.inputIcon}><IcKey /></span>
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
                  tabIndex={-1}
                >
                  {showKode ? <IcEyeOff /> : <IcEye />}
                </button>
              </div>
            </div>

            {error && <div className={styles.errorMsg} role="alert">{error}</div>}

            <button className={styles.submit} type="submit" disabled={loading}>
              {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
              {loading ? "Memverifikasi" : "Buka laporan saya"}
              {!loading && <IcArrow />}
            </button>
          </form>

          <p className={styles.help}>
            Butuh bantuan masuk? <a href="https://fammi.ly/" target="_blank" rel="noopener noreferrer">Hubungi tim Fammi</a>
          </p>
        </div>
      </main>
    </div>
  );
}

function PreviewRow({ tile, icon, label, badge }) {
  return (
    <div className={styles.previewRow}>
      <span className={`${styles.rowIcon} ${styles[tile]}`}>{icon}</span>
      <span className={styles.rowLabel}>{label}</span>
      {badge}
    </div>
  );
}
