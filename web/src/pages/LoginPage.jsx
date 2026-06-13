import { useState } from "react";
import { gasClient, GasError } from "../lib/gasClient";
import { hashPin, saveSession } from "../lib/auth";
import styles from "./LoginPage.module.css";

/**
 * LoginPage — form masuk FIR.
 *
 * onLogin(session) dipanggil setelah token berhasil diterima dari GAS.
 * session = { token, user_id, nama, peran }
 */
export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [pin, setPin]         = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim()) { setError("Username wajib diisi."); return; }
    if (!pin.trim())      { setError("PIN wajib diisi."); return; }

    setLoading(true);
    try {
      const kredensial_hash = await hashPin(pin);
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
      if (err instanceof GasError) {
        setError(err.message);
      } else {
        setError("Tidak dapat menghubungi server. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Logo */}
        <div className={styles.logo}>
          <span className={styles.logoMark}>F</span>
          <span className={styles.logoText}>Fammi<em>IR</em></span>
        </div>

        <p className={styles.tagline}>Masuk ke dashboard sekolah Anda</p>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="username">Username</label>
            <input
              id="username"
              className={styles.input}
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="pin">PIN</label>
            <input
              id="pin"
              className={styles.input}
              type="password"
              autoComplete="current-password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Masukkan PIN"
              disabled={loading}
            />
          </div>

          {error && (
            <div className={styles.errorBox} role="alert">
              {error}
            </div>
          )}

          <button
            className={styles.btn}
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} aria-hidden="true" />
            ) : null}
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>

        </form>

        <p className={styles.footer}>
          Fammi Intelligence Report, akses sesuai peran
        </p>
      </div>
    </div>
  );
}
