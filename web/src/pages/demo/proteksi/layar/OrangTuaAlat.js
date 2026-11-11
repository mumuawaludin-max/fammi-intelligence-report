import { useEffect, useRef } from "react";

// Fungsi kecil aplikasi ponsel orang tua. Dipisah dari berkas komponen supaya berkas .jsx hanya
// mengekspor komponen (aturan react-refresh/only-export-components).

/** Gabungkan nama kelas, buang yang kosong. */
export function kelas(...daftar) {
  return daftar.filter(Boolean).join(" ");
}

/** Daftar jadi kalimat: "A", "A dan B", "A, B, dan C". */
export function gabungNama(daftar) {
  if (daftar.length <= 1) return daftar.join("");
  if (daftar.length === 2) return `${daftar[0]} dan ${daftar[1]}`;
  return `${daftar.slice(0, -1).join(", ")}, dan ${daftar[daftar.length - 1]}`;
}

/** Huruf pertama jadi kecil, untuk menyambung teks data ke tengah kalimat. */
export function awalKecil(teks) {
  return teks ? teks.charAt(0).toLowerCase() + teks.slice(1) : "";
}

/** Jumlah butir checklist yang sudah dicentang selesai. */
export function hitungSelesai(daftar, centang) {
  return daftar.filter((c) => centang[c.id]).length;
}

/**
 * Pindahkan fokus ke elemen `pemilih` di dalam `akarRef` setiap kali `kunci` berubah (tidak saat
 * pertama dipasang). Saat halaman ponsel atau langkah formulir berganti, tombol yang ditekan sering
 * ikut hilang; fokus dipindah ke judul supaya papan ketik dan pembaca layar tidak tersesat.
 */
export function useFokusBerganti(akarRef, kunci, pemilih) {
  const sebelumnyaRef = useRef(kunci);
  useEffect(() => {
    if (sebelumnyaRef.current === kunci) return;
    sebelumnyaRef.current = kunci;
    akarRef.current?.querySelector(pemilih)?.focus({ preventScroll: true });
  }, [akarRef, kunci, pemilih]);
}
