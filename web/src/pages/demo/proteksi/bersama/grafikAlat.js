import { useEffect, useState } from "react";

// Alat grafik bersama (Grafik.jsx). Dipisah dari berkas komponen supaya berkas .jsx hanya
// mengekspor komponen (aturan react-refresh/only-export-components).

/** Warna status HEART untuk grafik. */
export const WARNA_STATUS = {
  baik: "var(--sp-hijau-batang)",
  perhatian: "var(--sp-jingga)",
  waspada: "var(--sp-merah-teks)",
  belum: "var(--sp-abu-3)",
};

function gerakDikurangi() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Angka yang naik dari 0 ke `nilai` dalam `lama` ms saat pertama tampil. */
export function useHitung(nilai, lama = 900) {
  const kurangi = gerakDikurangi();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (kurangi) return undefined;
    let bingkai;
    const mulai = performance.now();
    const langkah = (t) => {
      const p = Math.min(1, (t - mulai) / lama);
      setN(Math.round(nilai * (1 - Math.pow(1 - p, 3))));
      if (p < 1) bingkai = requestAnimationFrame(langkah);
    };
    bingkai = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(bingkai);
  }, [nilai, lama, kurangi]);
  return kurangi ? nilai : n;
}

/** Warna tingkat kasus untuk grafik, dari yang paling berat. */
export const WARNA_TINGKAT = {
  Darurat: "var(--sp-merah)",
  Tinggi: "var(--sp-merah-teks)",
  Sedang: "var(--sp-jingga)",
  Rendah: "var(--sp-ungu-garis)",
};
