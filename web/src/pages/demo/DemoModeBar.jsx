import { useEffect, useRef } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { klienDemo } from "./demoAccess";
import { sesiMati } from "./demoAturan";
import tokens from "../login/loginTokens.module.css";
import styles from "./DemoModeBar.module.css";

const JEDA_PERIKSA_MS = 60_000;

/**
 * Penanda kecil yang mengambang selama pengunjung demo berada di tampilan produk sungguhan
 * (sesi FIR ber-`demo`, lihat App.jsx). Tombol Kembali memanggil `onKeluar()` tanpa status:
 * pengunjung kembali ke layar demo untuk memilih tampilan lain. Sekaligus pengawas: sesi demo
 * diperiksa ulang ke server tiap menit dan setiap tab kembali terlihat. Begitu sesi demo
 * kedaluwarsa, dicabut, atau diakhiri, `onKeluar(status)` dipanggil dan pengunjung kembali ke
 * halaman masuk beserta alasannya.
 *
 * Dibuat mengambang (position: fixed), bukan bilah di atas Header, karena beberapa shell
 * (laporan bakat, laporan individu Culture) memenuhi layar sendiri.
 */
export default function DemoModeBar({ demo, onKeluar }) {
  const keluarRef = useRef(onKeluar);
  useEffect(() => {
    keluarRef.current = onKeluar;
  }, [onKeluar]);

  useEffect(() => {
    let hidup = true;
    async function periksa() {
      const hasil = await klienDemo.periksaSesi();
      if (!hidup) return;
      if (hasil.status === "kosong" || sesiMati(hasil.status)) keluarRef.current(hasil.status);
    }
    periksa();
    const interval = window.setInterval(periksa, JEDA_PERIKSA_MS);
    function saatTerlihat() {
      if (document.visibilityState === "visible") periksa();
    }
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      hidup = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, []);

  return (
    <div className={`${tokens.scope} ${styles.bilah}`} role="region" aria-label="Mode demo">
      <span className={styles.titik} aria-hidden="true" />
      <span className={styles.teks}>
        <strong>Mode demo</strong>
        <span className={styles.keterangan}> · {demo.judul} · {demo.label}</span>
      </span>
      <button type="button" className={styles.kembali} onClick={() => onKeluar()}>
        <ArrowLeft size={15} weight="bold" aria-hidden="true" />
        Kembali
      </button>
    </div>
  );
}
