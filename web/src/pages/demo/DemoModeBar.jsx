import { useEffect, useRef } from "react";
import { klienDemo } from "./demoAccess";
import { sesiMati } from "./demoAturan";
import { cariSistem } from "./demoSystems";
import DemoBilah from "./DemoBilah";
import styles from "./DemoModeBar.module.css";

const JEDA_PERIKSA_MS = 60_000;

/**
 * Bilah demo di atas tampilan produk sungguhan selama pengunjung demo memakai akun demo (sesi FIR
 * ber-`demo`, lihat App.jsx). Tampilannya sama dengan penampil laporan demo (DemoBilah): tombol
 * "Kembali ke Intelligence Systems" memanggil `onKeluar()` tanpa status, jadi pengunjung kembali ke
 * layar demo. Sekaligus pengawas: sesi demo diperiksa ulang ke server tiap menit dan setiap tab
 * kembali terlihat. Begitu sesi demo kedaluwarsa, dicabut, atau diakhiri, `onKeluar(status)`
 * dipanggil dan pengunjung kembali ke halaman masuk beserta alasannya.
 *
 * Shell aplikasi dirender sebagai children di bingkai di bawah bilah. Bingkai itu memakai
 * `contain: layout paint`, jadi elemen position: fixed di dalam shell (mis. SiswaPage yang
 * memenuhi layar dengan lapisan fixed) mengacu ke bingkai, bukan ke jendela, dan tidak tertutup
 * bilah demo.
 */
export default function DemoModeBar({ demo, onKeluar, children }) {
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
    <div className={styles.aplikasi}>
      <DemoBilah sistem={cariSistem(demo.sistem)} label={demo.label} onKembali={() => onKeluar()} />
      <div className={styles.isi}>{children}</div>
    </div>
  );
}
