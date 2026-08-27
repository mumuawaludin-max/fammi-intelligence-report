import { useEffect, useState } from "react";

/**
 * Animasi masuk saat elemen tergulir ke dalam layar, plus angka yang berjalan naik.
 *
 * Dipakai grafik dashboard YPT. Sengaja IntersectionObserver + transisi CSS, bukan pustaka motion:
 * modul School Culture memang memakai `motion` atas instruksi khusus, tapi YPT tidak, dan yang
 * dibutuhkan di sini cuma reveal dan count-up yang ditangani CSS dengan biaya nol byte tambahan.
 *
 * Semua animasi mati total kalau sistem meminta gerak dikurangi. Bukan diperlambat, tapi langsung
 * ke keadaan akhir, supaya pembaca yang sensitif terhadap gerak tetap mendapat angka yang benar
 * dan bukan bar kosong.
 */

/**
 * Dibaca sekali saat modul dimuat, bukan tiap render. Nilainya praktis tidak pernah berubah di
 * tengah sesi, dan membacanya per komponen berarti puluhan matchMedia untuk jawaban yang sama.
 */
const KURANGI_GERAK = typeof window !== "undefined"
  && typeof window.matchMedia === "function"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { KURANGI_GERAK };

/**
 * @param {object}  opsi
 * @param {boolean} opsi.sekali  true = animasi hanya sekali seumur hidup elemen
 * @returns {[function, boolean]} callback ref untuk dipasang ke elemen, dan status terlihat
 *
 * Ambangnya sengaja nol, bukan sekian persen elemen. Blok grafik di sini sering LEBIH TINGGI dari
 * layar; ambang 15% pada elemen setinggi 1.200 piksel berarti menunggu 180 piksel terlihat, yang
 * pada layar pendek tidak pernah tercapai sekaligus dan grafiknya tidak pernah muncul sama sekali.
 * Yang mengatur kapan animasi terasa jalan adalah rootMargin bawah, bukan ambang.
 */
export function useReveal({ sekali = false } = {}) {
  /**
   * Node yang diamati disimpan sebagai STATE lewat callback ref, bukan sebagai useRef biasa.
   *
   * Dengan useRef, effect-nya membaca ref.current sekali saja dan tidak pernah tahu kalau
   * elemennya diganti. Itu bukan kasus teoretis di sini: blok grafik di tab Testimoni dilepas dan
   * dipasang ulang setiap kali saringan berubah (BlokPenulis menghilang saat cuma satu kelompok
   * penulis tersisa, BlokJenjang saat tidak ada jenjang berisi), sementara komponennya sendiri
   * tetap terpasang. Observer lama akan terus mengamati node yang sudah dibuang, dan node baru
   * tidak pernah diamati siapa pun, sehingga grafiknya tinggal di opacity 0 selamanya.
   *
   * setEl identitasnya stabil, jadi React tidak melepas-pasang callback ref ini tiap render.
   */
  const [el, setEl] = useState(null);
  const [terlihat, setTerlihat] = useState(KURANGI_GERAK);

  useEffect(() => {
    if (KURANGI_GERAK) return undefined;

    // Tanpa IntersectionObserver, tampilkan apa adanya. Menyembunyikan elemen dan menunggu
    // pemicu yang tidak akan pernah datang berarti halaman kosong permanen.
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setTerlihat(true);
      return undefined;
    }

    const obs = new IntersectionObserver(([entri]) => {
      if (entri.isIntersecting) {
        setTerlihat(true);
        if (sekali) obs.disconnect();
      } else if (!sekali) {
        // Disetel ulang saat elemen benar-benar keluar layar, supaya animasinya main lagi ketika
        // digulir balik. Reset hanya terjadi di luar layar, jadi pembaca tidak pernah melihat
        // grafik yang tiba-tiba kosong di depan matanya.
        setTerlihat(false);
      }
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });

    obs.observe(el);
    return () => obs.disconnect();
  }, [el, sekali]);

  return [setEl, terlihat];
}

/**
 * Angka yang berjalan dari nol ke nilai akhir begitu `aktif` menyala.
 *
 * Easing keluar-kubik: cepat di awal lalu melambat mendekati nilai akhir. Linier terbaca seperti
 * penghitung mesin, bukan seperti angka yang mendarat.
 */
export function useCountUp(target, aktif, durasi = 900) {
  const [nilai, setNilai] = useState(KURANGI_GERAK ? target : 0);

  useEffect(() => {
    if (KURANGI_GERAK) { setNilai(target); return undefined; }
    if (!aktif) { setNilai(0); return undefined; }
    if (!Number.isFinite(target)) { setNilai(target); return undefined; }

    let raf = 0;
    let mulai = null;

    function langkah(waktu) {
      if (mulai === null) mulai = waktu;
      const t = Math.min(1, (waktu - mulai) / durasi);
      const eased = 1 - Math.pow(1 - t, 3);
      setNilai(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(langkah);
    }

    raf = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(raf);
  }, [target, aktif, durasi]);

  return nilai;
}
