import { useEffect, useRef, useState } from "react";

/** Hormati preferensi sistem: kalau user minta gerakan dikurangi, animasi dilewati sepenuhnya. */
function prefersReducedMotion() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Tandai elemen sebagai "sudah masuk viewport" untuk animasi reveal. Sekali menyala tetap
 * menyala (tidak di-reset saat scroll keluar) supaya konten dashboard tidak berkedip waktu
 * user scroll bolak-balik -- beda dari useReveal di modul Karakter yang sengaja re-trigger.
 *
 * Fallback: kalau IntersectionObserver tidak ada, atau tidak pernah callback dalam 800ms,
 * langsung tampilkan penuh supaya konten tidak pernah tersangkut transparan.
 */
export function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [shown, setShown] = useState(() => prefersReducedMotion());

  useEffect(() => {
    if (prefersReducedMotion()) { setShown(true); return; }
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return; }

    // `responded` menandai "IntersectionObserver hidup dan menjawab", BUKAN "elemen terlihat".
    // Kalau dua hal ini disamakan, elemen yang memang masih di bawah layar ikut menyalakan
    // fallback dan seluruh halaman muncul serentak setelah 800ms -- reveal saat scroll jadi
    // tidak pernah benar-benar jalan.
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

/**
 * Angka menghitung naik 0 -> target begitu `start` true. Dipakai untuk angka besar di kartu
 * statistik. Memakai requestAnimationFrame dengan easing ease-out supaya berhenti halus,
 * bukan setInterval yang tersendat.
 */
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

    // Pengaman WAJIB: requestAnimationFrame dijeda browser saat tab tidak terlihat / tidak
    // di-paint. Tanpa ini, animasi berhenti di tengah dan kartu menampilkan angka yang SALAH
    // (mis. "0" padahal 142) selama-lamanya. Setelah durasi animasi lewat, paksa ke nilai asli.
    const safety = setTimeout(() => { if (!done) setValue(numericTarget); }, duration + 400);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(safety);
    };
  }, [numericTarget, start, duration]);

  return value;
}
