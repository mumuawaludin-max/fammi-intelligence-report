import { useEffect, useRef, useState } from "react";

/** Hormati preferensi sistem: kalau user minta gerakan dikurangi, animasi dilewati sepenuhnya. */
function prefersReducedMotion() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Tandai elemen sebagai "sudah masuk viewport". Sekali menyala tetap menyala. Salinan lokal
 * dari pa/paHooks.js (yang sendirinya salinan sc/scHooks.js) -- tiap modul berdiri sendiri.
 *
 * Dipakai khusus untuk batang data (LwBar/LwStackBar), BUKAN motion `whileInView` seperti
 * LwReveal. Alasannya satu: kalau animasi motion tidak pernah jalan (tab di latar belakang,
 * halaman tidak meng-compose frame, mesin animasi tersendat), elemen tertahan di keadaan awal
 * selamanya. Untuk opacity itu cuma bikin blok telat muncul; untuk batang data artinya SELURUH
 * angka hilang dari layar. Hook ini punya timer cadangan 800ms yang menyalakan keadaan akhir
 * tanpa bergantung pada animation frame, jadi paling buruk batangnya muncul tanpa animasi.
 */
export function useReveal(threshold = 0.3) {
  const ref = useRef(null);
  // Saat gerakan diminta dikurangi, keadaan akhir dipakai sejak render pertama.
  const [shown, setShown] = useState(prefersReducedMotion);

  useEffect(() => {
    if (shown) return;

    const el = ref.current;
    const bisaObserve = el && typeof IntersectionObserver !== "undefined";

    let responded = false;
    // Tanpa IntersectionObserver, nyalakan di tick berikutnya. Dengan observer, timer ini cuma
    // jaring pengaman kalau callback-nya tidak pernah datang.
    const fallback = setTimeout(() => { if (!responded) setShown(true); }, bisaObserve ? 800 : 0);
    if (!bisaObserve) return () => clearTimeout(fallback);

    const io = new IntersectionObserver((entries) => {
      responded = true;
      clearTimeout(fallback);
      if (entries[0].isIntersecting) {
        setShown(true);
        io.disconnect();
      }
    }, { threshold });

    io.observe(el);
    return () => { clearTimeout(fallback); io.disconnect(); };
  }, [threshold, shown]);

  return [ref, shown];
}
