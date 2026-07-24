import { useEffect, useRef, useState } from "react";

/** Hormati preferensi sistem: kalau user minta gerakan dikurangi, animasi dilewati sepenuhnya. */
function prefersReducedMotion() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Tandai elemen sebagai "sudah masuk viewport" untuk animasi reveal. Sekali menyala tetap
 * menyala. Salinan lokal SC dari pola yang sama di pages/cw/cwHooks.js -- modul ini sengaja
 * berdiri sendiri (lihat catatan arsitektur di sc.types.ts), bukan impor lintas-modul.
 */
export function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) { setShown(true); return; }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }

    let responded = false;
    const fallback = setTimeout(() => { if (!responded) setShown(true); }, 800);
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
  }, [threshold]);

  return [ref, shown];
}

/** Angka menghitung naik 0 -> target begitu `start` true. */
export function useCountUp(target, start, duration = 900) {
  const numericTarget = Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(() => (prefersReducedMotion() ? numericTarget : 0));

  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) { setValue(numericTarget); return; }

    let raf = null;
    let done = false;
    let startTs = null;
    const step = (ts) => {
      if (startTs == null) startTs = ts;
      const p = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(numericTarget * eased));
      if (p < 1) raf = requestAnimationFrame(step);
      else done = true;
    };
    raf = requestAnimationFrame(step);

    const safety = setTimeout(() => { if (!done) setValue(numericTarget); }, duration + 400);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [numericTarget, start, duration]);

  return value;
}
